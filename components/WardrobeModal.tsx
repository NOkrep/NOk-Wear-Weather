'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ClothingItem, BudgetSegment } from '@/lib/types';
import {
  addWardrobeItem,
  removeWardrobeItem,
  resetWardrobeToDefaults,
  saveWardrobeList,
} from '@/lib/wardrobe-storage';
import {
  CatalogGarmentTemplate,
  getMarketProfileForCountry,
} from '@/lib/clothing-catalog';
import { useLocale } from '@/lib/i18n';
import { Modal } from './Modal';
import { GarmentVisual } from './GarmentVisual';
import { Layers, Droplets, ArrowUpRight } from 'lucide-react';
import { BarcodeAddPanel } from './BarcodeAddPanel';
import { CatalogProductCard } from './CatalogProductCard';
import type { CatalogProduct, CatalogSource } from '@/lib/catalog/model';
import { GARMENT_TYPES, PILOT_TARGET } from '@/lib/catalog/taxonomy';
import { catalogProductToWardrobe } from '@/lib/catalog-wardrobe';
import { GarmentAppearanceEditor } from './GarmentAppearanceEditor';
import { GarmentDesignGallery } from './GarmentDesignGallery';
import { normalizeGarmentAppearance, type GarmentAppearance } from '@/lib/garment-appearance';
import { getStoredCustomKeys } from '@/lib/weather-service';
import {
  X,
  Shirt,
  Sparkles,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  Upload,
} from 'lucide-react';

interface WardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardrobe: ClothingItem[];
  onWardrobeChange: (updated: ClothingItem[]) => void;
  currentCountry?: string;
}

const CATEGORY_LABELS: Record<ClothingItem['category'], string> = {
  base: 'İç Katman',
  mid: 'Orta Katman',
  outer: 'Dış Katman',
  bottom: 'Alt Giyim',
  footwear: 'Ayakkabı',
  accessory: 'Aksesuar',
};

export function WardrobeModal({
  isOpen,
  onClose,
  wardrobe,
  onWardrobeChange,
  currentCountry = 'Türkiye',
}: WardrobeModalProps) {
  const { t, locale, garment } = useLocale();
  const [aiError, setAiError] = useState('');
  const [wardrobeError, setWardrobeError] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_closet' | 'custom_ai' | 'barcode'>('catalog');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [catalogTier, setCatalogTier] = useState<string>('all');
  const [catalogMode, setCatalogMode] = useState<'products' | 'profiles' | 'designs'>('products');
  const [catalogType, setCatalogType] = useState('all');
  const [productPage, setProductPage] = useState(0);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [sources, setSources] = useState<CatalogSource[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [coverage, setCoverage] = useState<Record<string, number>>({});
  const [productStatus, setProductStatus] = useState('loading');
  const [catalogError, setCatalogError] = useState(false);
  const [catalogRetry, setCatalogRetry] = useState(0);
  const [catalogResults, setCatalogResults] = useState<CatalogGarmentTemplate[]>([]);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Custom / AI states
  const [aiDescription, setAiDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const market = getMarketProfileForCountry(currentCountry);

  // Abort obsolete requests so a slow response cannot overwrite newer filters.
  useEffect(() => {
    if (!isOpen || catalogMode === 'designs') return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearchingCatalog(true);
      setCatalogError(false);
      try {
        const query = catalogMode === 'profiles' && locale === 'en' ? '' : catalogQuery;
        const params = new URLSearchParams({ q: query, category: catalogCategory, tier: catalogMode === 'profiles' ? catalogTier : 'all', country: currentCountry, limit: '12', offset: String(productPage * 12) });
        if (catalogMode === 'products' && catalogType !== 'all') params.set('type', catalogType);
        const res = await fetch(`/api/catalog?${params}`, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (controller.signal.aborted) return;
        setCatalogResults(data.results || []);
        setProducts(data.products || []);
        setSources(data.sources || []);
        setTotalProducts(data.totalProducts ?? 0);
        setProductStatus(data.productStatus || 'unavailable');
        setCoverage(Object.fromEntries((data.coverage || []).map((row: { garmentTypeId: string; products: number }) => [row.garmentTypeId, row.products])));
      } catch {
        if (!controller.signal.aborted) { setCatalogError(true); setProductStatus('unavailable'); setProducts([]); }
      } finally {
        if (!controller.signal.aborted) setIsSearchingCatalog(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, catalogQuery, catalogCategory, catalogTier, currentCountry, locale, catalogMode, catalogType, productPage, catalogRetry]);

  if (!isOpen) return null;

  const handleAddFromCatalog = (tpl: CatalogGarmentTemplate) => {
    const newItem: ClothingItem = {
      id: `w-cat-${tpl.id}-${Date.now()}`,
      name: tpl.name,
      category: tpl.category,
      segment: tpl.segment,
      material: tpl.material,
      warmth: tpl.warmth,
      waterResistance: tpl.waterResistance,
      windResistance: tpl.windResistance,
      colorName: tpl.colorName,
      colorHex: tpl.colorHex,
      colorType: tpl.colorType,
      description: tpl.description,
      brandHint:
        currentCountry.toLowerCase().includes('türkiye')
          ? tpl.brandExamplesTr
          : tpl.brandExamplesGlobal,
      isUserOwned: true,
      catalogId: tpl.id,
      dataSource: 'template',
      materialConfirmed: false,
    };
    const updated = addWardrobeItem(newItem);
    onWardrobeChange(updated);
    setJustAddedId(tpl.id);
    setTimeout(() => setJustAddedId(null), 1400);
  };

  const handleAddProduct = (product: CatalogProduct) => {
    try {
      const item = catalogProductToWardrobe(product, sources, `w-catalog-${crypto.randomUUID()}`);
      onWardrobeChange(addWardrobeItem(item));
      setWardrobeError(false);
    } catch { setWardrobeError(true); }
  };

  const handlePersonalWarmth = (id: string, value: string) => {
    const estimate = Number(value);
    const personalWarmth = value && Number.isInteger(estimate) && estimate >= 1 && estimate <= 5 ? estimate as NonNullable<ClothingItem['warmth']> : null;
    try {
      onWardrobeChange(saveWardrobeList(wardrobe.map(item => item.id === id ? { ...item, personalWarmth } : item)));
      setWardrobeError(false);
    } catch { setWardrobeError(true); }
  };

  const handleAppearance = (id: string, appearance: GarmentAppearance): boolean => {
    try {
      onWardrobeChange(saveWardrobeList(wardrobe.map(item => {
        if (item.id !== id) return item;
        const normalized = normalizeGarmentAppearance(appearance, item);
        return { ...item, personalAppearance: Object.keys(normalized).length > 1 ? normalized : undefined };
      })));
      setWardrobeError(false);
      return true;
    } catch { setWardrobeError(true); return false; }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAiAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiDescription.trim() && !imagePreview) return;

    setIsAnalyzing(true);
    setAiError('');
    try {
      const customKeys = getStoredCustomKeys();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (customKeys.geminiApiKey?.trim()) {
        headers['x-gemini-key'] = customKeys.geminiApiKey.trim();
      }

      const res = await fetch('/api/ai-stylist', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode: 'analyze_garment',
          descriptionText: aiDescription,
          imageBase64: imagePreview || undefined,
          mimeType: imageMimeType,
        }),
      });

      if (!res.ok) throw new Error();
      if (res.ok) {
        const data = await res.json();
        if (data.item) {
          const updated = addWardrobeItem({ ...data.item, dataSource: 'user', materialConfirmed: false });
          onWardrobeChange(updated);
          setAiDescription('');
          setImagePreview(null);
          setActiveTab('my_closet');
        }
      }
    } catch (err) {
      setAiError('Taslak oluşturulamadı. Manuel girişle devam edebilirsin.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = (id: string) => {
    const updated = removeWardrobeItem(id);
    onWardrobeChange(updated);
  };

  const handleReset = () => {
    const updated = resetWardrobeToDefaults();
    onWardrobeChange(updated);
  };

  return <Modal open={isOpen} onClose={onClose} title={t('Dolabın, sana göre.')} eyebrow={t('Katalog & kişisel koleksiyon')} wide>
    <div className="wardrobe-intro"><span>{t('Gerçek ürünleri keşfet veya kendi parçanı etiket bilgisiyle ekle.')}</span><span className="market-badge">{market.countryName} · {t('Pazar profili')}</span></div>
    <div className="studio-tabs" role="group" aria-label={t('Dolap bölümleri')}>{([{id:'catalog',label:'Katalog',Icon:ShoppingBag},{id:'my_closet',label:'Dolabım',Icon:Shirt},{id:'barcode',label:'Barkod / Manuel',Icon:Plus},{id:'custom_ai',label:'AI Taslağı',Icon:Sparkles}] as const).map(({id,label,Icon})=><button key={id} type="button" aria-pressed={activeTab===id} onClick={()=>setActiveTab(id)}><Icon size={15}/>{t(label)}{id==='my_closet'&&<span>{wardrobe.length}</span>}</button>)}</div>
    {wardrobeError && <p role="alert" className="form-message">{t('Dolap kaydedilemedi. Tarayıcı depolama iznini ve boş alanı kontrol et.')}</p>}
    {activeTab==='barcode'&&<BarcodeAddPanel onAdd={item=>{const updated=addWardrobeItem(item);onWardrobeChange(updated);}}/>}
    {activeTab==='catalog'&&<>
      <div className="catalog-view-switch" role="group" aria-label={t('Katalog görünümü')}>
        <button type="button" aria-pressed={catalogMode==='products'} onClick={()=>{setCatalogMode('products');setProductPage(0);}}>{t('Gerçek ürünler')}</button>
        <button type="button" aria-pressed={catalogMode==='profiles'} onClick={()=>{setCatalogMode('profiles');setCatalogCategory('all');setProductPage(0);}}>{t('Örnek profiller')}</button>
        <button type="button" aria-pressed={catalogMode==='designs'} onClick={()=>setCatalogMode('designs')}>{t('Tasarım örnekleri')}</button>
      </div>
      {catalogMode==='designs'?<GarmentDesignGallery/>:<>
      <div className="catalog-filters"><label className="studio-search"><Search size={16}/><span className="sr-only">{t('Katalogda ara')}</span><input type="search" value={catalogQuery} onChange={e=>{setCatalogQuery(e.target.value);setProductPage(0);}} placeholder={t('Kıyafet, kumaş veya marka ara…')}/>{isSearchingCatalog&&<Loader2 size={15} className="loading-spin"/>}</label>
        {catalogMode==='profiles'?<select aria-label={t('Bütçe segmenti')} value={catalogTier} onChange={e=>setCatalogTier(e.target.value)}><option value="all">{t('Tüm segmentler')}</option><option value="essential">{t('Standart')}</option><option value="smart">{t('Orta-Üst')}</option><option value="luxury">{t('Lüks / Teknik')}</option></select>:<select aria-label={t('Kıyafet türü')} value={catalogType} onChange={e=>{setCatalogType(e.target.value);setProductPage(0);}}><option value="all">{t('Tüm türler')}</option>{GARMENT_TYPES.filter(type=>catalogCategory==='all'||type.group===catalogCategory).map(type=><option key={type.id} value={type.id}>{locale==='tr'?type.tr:type.en} ({coverage[type.id]??0})</option>)}</select>}
        <select aria-label={t('Kategori')} value={catalogCategory} onChange={e=>{setCatalogCategory(e.target.value);setCatalogType('all');setProductPage(0);}}><option value="all">{t('Tüm kategoriler')}</option>{Object.entries(CATEGORY_LABELS).map(([key,label])=><option key={key} value={key}>{t(label)}</option>)}{catalogMode==='products'&&<option value="one_piece">{t('Tek parça')}</option>}</select>
      </div>
      {catalogMode==='products'?<>
        <div className="catalog-product-status" aria-live="polite"><span>{isSearchingCatalog||productStatus==='loading'?t('Ürünler yükleniyor…'):productStatus==='available'?`${totalProducts} ${locale==='en'&&totalProducts===1?'sourced product':t('kaynaklı ürün')}`:t('Ürün kataloğuna ulaşılamadı.')}</span><small>{t('Bilinmeyen teknik bilgiler tahmin edilmez.')}</small></div>
        {productStatus==='available'&&<div className="catalog-target-progress"><span>{t(catalogType==='all'?'Kaynaklı ürün hedefi':'Tür başına hedef')}</span><progress aria-label={t('Kaynaklı ürün hedefi')} value={catalogType==='all'?Object.values(coverage).reduce((sum,n)=>sum+n,0):coverage[catalogType]??0} max={PILOT_TARGET.minimum*(catalogType==='all'?GARMENT_TYPES.length:1)}/><strong>{catalogType==='all'?Object.values(coverage).reduce((sum,n)=>sum+n,0):coverage[catalogType]??0} / {PILOT_TARGET.minimum*(catalogType==='all'?GARMENT_TYPES.length:1)}</strong></div>}
        {productStatus==='available'&&!catalogError&&<div className="studio-catalog-grid" aria-busy={isSearchingCatalog}>{products.map(product=><CatalogProductCard key={product.id} product={product} sources={sources} isAdded={wardrobe.some(item=>item.productId===product.id)} onAdd={()=>handleAddProduct(product)}/>)}</div>}
        {!isSearchingCatalog&&productStatus==='available'&&products.length===0&&<div className="studio-empty"><Shirt size={32}/><h3>{t('Bu aramada ürün bulunamadı.')}</h3><p>{t('Bu tür için kaynak doğrulaması sürüyor. Diğer türleri inceleyebilir veya kendi parçanı ekleyebilirsin.')}</p></div>}
        {!isSearchingCatalog&&(productStatus==='unavailable'||productStatus==='not-configured')&&<div className="studio-empty" role="status"><Shirt size={32}/><h3>{t('Ürün kataloğuna ulaşılamadı.')}</h3><div className="catalog-recovery-actions"><button type="button" className="text-button" onClick={()=>setCatalogRetry(value=>value+1)}>{t('Yeniden dene')}</button><button type="button" className="text-button" onClick={()=>{setCatalogMode('profiles');setCatalogCategory('all');}}>{t('Örnek profillere geç')}</button></div></div>}
        {productStatus==='available'&&totalProducts>12&&<div className="catalog-pagination"><button type="button" className="secondary-button" disabled={productPage===0||isSearchingCatalog} onClick={()=>setProductPage(value=>value-1)}>{t('Önceki')}</button><span>{productPage+1} / {Math.ceil(totalProducts/12)}</span><button type="button" className="secondary-button" disabled={(productPage+1)*12>=totalProducts||isSearchingCatalog} onClick={()=>setProductPage(value=>value+1)}>{t('Sonraki')}</button></div>}
      </>:<>
      <p className="catalog-disclaimer">{t('Örnek giysi profilleri · mağazalardan doğrulanmış ürün kayıtları değildir.')}</p>
      <div className="studio-catalog-grid">{catalogResults.filter(tpl=>locale!=='en'||!catalogQuery.trim()||[t(tpl.name),t(tpl.material),tpl.brandExamplesGlobal,tpl.brandExamplesTr].join(' ').toLowerCase().includes(catalogQuery.toLowerCase().trim())).map(tpl=><article className="catalog-piece" key={tpl.id}>
        <div className="catalog-piece-art"><span className="catalog-category">{t(CATEGORY_LABELS[tpl.category])}</span><GarmentVisual item={tpl}/><i style={{background:tpl.colorHex}}/></div>
        <div className="catalog-piece-info"><span className="catalog-tier">{t(tpl.segment==='luxury'?'Lüks / Teknik':tpl.segment==='smart'?'Orta-Üst':'Standart')}</span><h3>{t(tpl.name)}</h3><p>{t(tpl.material)}</p><details><summary>{t('Parça ayrıntısı')}</summary><p>{t(tpl.description)}</p><small>{currentCountry.toLowerCase().includes('türkiye')?tpl.brandExamplesTr:tpl.brandExamplesGlobal}</small></details><div className="catalog-piece-bottom"><span><Layers size={13}/>{tpl.warmth}/5</span><button type="button" className="text-button" onClick={()=>handleAddFromCatalog(tpl)}>{justAddedId===tpl.id?<CheckCircle2 size={15}/>:<Plus size={15}/>} {t(justAddedId===tpl.id?'Eklendi':'Dolabıma ekle')}</button></div></div>
      </article>)}</div>
      {!isSearchingCatalog&&!catalogResults.filter(tpl=>locale!=='en'||!catalogQuery.trim()||[t(tpl.name),t(tpl.material),tpl.brandExamplesGlobal,tpl.brandExamplesTr].join(' ').toLowerCase().includes(catalogQuery.toLowerCase().trim())).length&&<div className="studio-empty"><Shirt size={32}/><h3>{t('Eşleşen parça bulunamadı.')}</h3><button type="button" className="text-button" onClick={()=>setActiveTab('barcode')}>{t('Kendi parçanı ekle')}<ArrowUpRight size={14}/></button></div>}
      </>}
      </>}
    </>}
    {activeTab==='my_closet'&&<>
      <div className="closet-heading"><span>{wardrobe.length} {t('kayıtlı parça')}</span><button type="button" className="text-button" onClick={handleReset}><RotateCcw size={13}/>{t('Varsayılan dolaba dön')}</button></div>
      <div className="studio-catalog-grid">{wardrobe.map(item=><article className="catalog-piece" key={item.id} data-product-id={item.productId}>
        <div className="catalog-piece-art"><span className="catalog-category">{t(CATEGORY_LABELS[item.category])}</span><GarmentVisual item={item}/>{item.dataSource==='catalog'&&<span className="product-illustration-label">{t('Temsili çizim')}</span>}<button type="button" className="icon-button catalog-delete" onClick={()=>handleDelete(item.id)} aria-label={t(`${garment(item)} parçasını dolaptan sil`)}><Trash2 size={16}/></button></div>
        <div className="catalog-piece-info"><span className="catalog-tier">{t(item.dataSource==='catalog'?'Kaynaklı ürün':item.dataSource==='barcode'?'Barkod eşleşmesi':item.dataSource==='user'?'Kişisel kayıt':'Giysi profili')}</span><h3>{garment(item)}</h3>
          {(item.brand || item.dataSource==='catalog' && item.brandHint) && <p className="wardrobe-brand">{item.brand || item.brandHint}{item.brand && item.model ? ` / ${item.model}` : ''}</p>}
          <p>{item.dataSource==='catalog'?(locale==='en'?item.materialEn??item.material:item.material):(item.dataSource==='user'||item.dataSource==='barcode')&&item.material!=='Kumaş içeriği bilinmiyor'?item.material:t(item.material)}</p>
          <div className="catalog-piece-bottom"><span><Layers size={13}/>{item.warmth===null?t('Isı bilgisi yok'):`${item.warmth}/5`}</span><span><Droplets size={13}/>{t(item.waterResistance===null?'Su koruması bilinmiyor':item.waterResistance==='waterproof'?'Su geçirmez':item.waterResistance==='light'?'Su itici':'Koruma yok')}</span></div>
          <GarmentAppearanceEditor item={item} onSave={appearance=>handleAppearance(item.id,appearance)}/>
          {item.dataSource==='catalog'&&<>
            <label className="catalog-personal-warmth">{t('Kişisel ısı tahminim')}<select value={item.personalWarmth??''} onChange={e=>handlePersonalWarmth(item.id,e.target.value)} aria-label={`${garment(item)} · ${t('Kişisel ısı tahminim')}`}><option value="">{t('Belirtilmedi')}</option>{[1,2,3,4,5].map(level=><option key={level} value={level}>{level}/5 · {t(level===1?'Çok hafif':level===2?'Hafif':level===3?'Orta':level===4?'Sıcak':'Çok sıcak')}</option>)}</select></label>
            <small className="catalog-estimate-note">{t(item.personalWarmth?'Kişisel tahmin · üretici verisini değiştirmez.':'Isı bilgisi olmadan otomatik seçilmez. Eşleştir’de kendin seçebilirsin.')}</small>
            <details className="product-evidence"><summary>{t('Kaynak ve ayrıntılar')}</summary><p>{t('Üretici / satıcı beyanı · bağımsız ölçüm değildir.')}</p><p>{item.brandHint}</p><p>{t('Gramaj')}: {item.catalogFacts?.gsm==null?t('Bilinmiyor'):`${item.catalogFacts.gsm} g/m²`}</p><p>{t('Renk ve kesim çizimi temsilidir. Fiyat ve stok bilgisi henüz eklenmedi.')}</p>{item.productUrl&&<a className="text-button" href={item.productUrl} target="_blank" rel="noopener noreferrer">{t('Ürün sayfası')}<ArrowUpRight size={14}/></a>}</details>
          </>}
        </div>
      </article>)}</div>
      {!wardrobe.length&&<div className="studio-empty"><Shirt size={32}/><h3>{t('İlk parçanı ekle.')}</h3><button type="button" className="primary-button" onClick={()=>setActiveTab('barcode')}><Plus size={16}/>{t('Parça ekle')}</button></div>}
    </>}
    {activeTab==='custom_ai'&&<form onSubmit={handleAiAdd} className="studio-ai-form"><span className="eyebrow">{t('İsteğe bağlı yardımcı')}</span><h3>{t('Etiketi yaz. Bir taslak oluşturalım.')}</h3><p>{t('Fotoğraftan kumaş içeriği doğrulanamaz. Etiketteki bilgileri yaz; oluşturulan teknik değerleri tahmin olarak değerlendir.')}</p><label className="feedback-field">{t('Parçanı tarif et')}<textarea value={aiDescription} onChange={e=>setAiDescription(e.target.value)} placeholder={t('Örn. Lacivert kaban, etikette %80 yün %20 kaşmir…')} rows={3}/></label><input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden/><div className="studio-form-actions"><button type="button" className="secondary-button" onClick={()=>fileInputRef.current?.click()}><Upload size={15}/>{t(imagePreview?'Fotoğraf seçildi':'Fotoğraf ekle (isteğe bağlı)')}</button><button type="submit" className="primary-button" disabled={isAnalyzing||(!aiDescription.trim()&&!imagePreview)}>{isAnalyzing?<Loader2 size={16} className="loading-spin"/>:<Sparkles size={16}/>} {t('Taslak oluştur')}</button></div>{imagePreview&&<div className="ai-image-preview"><img src={imagePreview} alt={t('Seçtiğin kıyafet fotoğrafı')}/><button type="button" className="text-button" onClick={()=>setImagePreview(null)}><X size={14}/>{t('Fotoğrafı kaldır')}</button></div>}<p className="form-message">{t('Bu işlemde yazdığın açıklama ve seçtiğin fotoğraf, yapılandırılmışsa AI hizmetine gönderilir. Barkod / Manuel bölümünü kullanarak kendin de ekleyebilirsin.')}</p>{aiError&&<p role="alert" className="form-message">{t(aiError)}</p>}</form>}
  </Modal>;
}

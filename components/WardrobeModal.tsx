'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ClothingItem, BudgetSegment } from '@/lib/types';
import {
  addWardrobeItem,
  removeWardrobeItem,
  resetWardrobeToDefaults,
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
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_closet' | 'custom_ai' | 'barcode'>('catalog');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [catalogTier, setCatalogTier] = useState<string>('all');
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

  // Fetch template profiles whenever language or filters change
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearchingCatalog(true);
      try {
        const url = `/api/catalog?q=${encodeURIComponent(locale === 'en' ? '' : catalogQuery)}&category=${catalogCategory}&tier=${catalogTier}&country=${encodeURIComponent(currentCountry)}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error();
      if (res.ok) {
          const data = await res.json();
          setCatalogResults(data.results || []);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.error(err);
      } finally {
        setIsSearchingCatalog(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, catalogQuery, catalogCategory, catalogTier, currentCountry, locale]);

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
    <div className="wardrobe-intro"><span>{t('Hazır giysi profillerini ara veya kendi ürününü barkod ve etiket bilgisiyle ekle.')}</span><span className="market-badge">{market.countryName} · {t('Pazar profili')}</span></div>
    <div className="studio-tabs" role="group" aria-label={t('Dolap bölümleri')}>{([{id:'catalog',label:'Katalog',Icon:ShoppingBag},{id:'my_closet',label:'Dolabım',Icon:Shirt},{id:'barcode',label:'Barkod / Manuel',Icon:Plus},{id:'custom_ai',label:'AI Taslağı',Icon:Sparkles}] as const).map(({id,label,Icon})=><button key={id} type="button" aria-pressed={activeTab===id} onClick={()=>setActiveTab(id)}><Icon size={15}/>{t(label)}{id==='my_closet'&&<span>{wardrobe.length}</span>}</button>)}</div>
    {activeTab==='barcode'&&<BarcodeAddPanel onAdd={item=>{const updated=addWardrobeItem(item);onWardrobeChange(updated);}}/>}
    {activeTab==='catalog'&&<>
      <div className="catalog-filters"><label className="studio-search"><Search size={16}/><span className="sr-only">{t('Katalogda ara')}</span><input type="search" value={catalogQuery} onChange={e=>setCatalogQuery(e.target.value)} placeholder={t('Kıyafet, kumaş veya marka ara…')}/>{isSearchingCatalog&&<Loader2 size={15} className="loading-spin"/>}</label>
        <select aria-label={t('Bütçe segmenti')} value={catalogTier} onChange={e=>setCatalogTier(e.target.value)}><option value="all">{t('Tüm segmentler')}</option><option value="essential">{t('Standart')}</option><option value="smart">{t('Orta-Üst')}</option><option value="luxury">{t('Lüks / Teknik')}</option></select>
        <select aria-label={t('Kategori')} value={catalogCategory} onChange={e=>setCatalogCategory(e.target.value)}><option value="all">{t('Tüm kategoriler')}</option>{Object.entries(CATEGORY_LABELS).map(([key,label])=><option key={key} value={key}>{t(label)}</option>)}</select>
      </div>
      <p className="catalog-disclaimer">{t('Örnek giysi profilleri · mağazalardan doğrulanmış ürün kayıtları değildir.')}</p>
      <div className="studio-catalog-grid">{catalogResults.filter(tpl=>locale!=='en'||!catalogQuery.trim()||[t(tpl.name),t(tpl.material),tpl.brandExamplesGlobal,tpl.brandExamplesTr].join(' ').toLowerCase().includes(catalogQuery.toLowerCase().trim())).map(tpl=><article className="catalog-piece" key={tpl.id}>
        <div className="catalog-piece-art"><span className="catalog-category">{t(CATEGORY_LABELS[tpl.category])}</span><GarmentVisual item={tpl}/><i style={{background:tpl.colorHex}}/></div>
        <div className="catalog-piece-info"><span className="catalog-tier">{t(tpl.segment==='luxury'?'Lüks / Teknik':tpl.segment==='smart'?'Orta-Üst':'Standart')}</span><h3>{t(tpl.name)}</h3><p>{t(tpl.material)}</p><details><summary>{t('Parça ayrıntısı')}</summary><p>{t(tpl.description)}</p><small>{currentCountry.toLowerCase().includes('türkiye')?tpl.brandExamplesTr:tpl.brandExamplesGlobal}</small></details><div className="catalog-piece-bottom"><span><Layers size={13}/>{tpl.warmth}/5</span><button type="button" className="text-button" onClick={()=>handleAddFromCatalog(tpl)}>{justAddedId===tpl.id?<CheckCircle2 size={15}/>:<Plus size={15}/>} {t(justAddedId===tpl.id?'Eklendi':'Dolabıma ekle')}</button></div></div>
      </article>)}</div>
      {!isSearchingCatalog&&!catalogResults.filter(tpl=>locale!=='en'||!catalogQuery.trim()||[t(tpl.name),t(tpl.material),tpl.brandExamplesGlobal,tpl.brandExamplesTr].join(' ').toLowerCase().includes(catalogQuery.toLowerCase().trim())).length&&<div className="studio-empty"><Shirt size={32}/><h3>{t('Eşleşen parça bulunamadı.')}</h3><button type="button" className="text-button" onClick={()=>setActiveTab('barcode')}>{t('Kendi parçanı ekle')}<ArrowUpRight size={14}/></button></div>}
    </>}
    {activeTab==='my_closet'&&<>
      <div className="closet-heading"><span>{wardrobe.length} {t('kayıtlı parça')}</span><button type="button" className="text-button" onClick={handleReset}><RotateCcw size={13}/>{t('Varsayılan dolaba dön')}</button></div>
      <div className="studio-catalog-grid">{wardrobe.map(item=><article className="catalog-piece" key={item.id}><div className="catalog-piece-art"><span className="catalog-category">{t(CATEGORY_LABELS[item.category])}</span><GarmentVisual item={item}/><button type="button" className="icon-button catalog-delete" onClick={()=>handleDelete(item.id)} aria-label={t(`${garment(item)} parçasını dolaptan sil`)}><Trash2 size={16}/></button></div><div className="catalog-piece-info"><span className="catalog-tier">{t(item.dataSource==='barcode'?'Barkod eşleşmesi':item.dataSource==='user'?'Kişisel kayıt':'Giysi profili')}</span><h3>{garment(item)}</h3><p>{(item.dataSource==='user'||item.dataSource==='barcode') && item.material!=='Kumaş içeriği bilinmiyor'?item.material:t(item.material)}</p><div className="catalog-piece-bottom"><span><Layers size={13}/>{item.warmth}/5</span><span><Droplets size={13}/>{t(item.waterResistance==='waterproof'?'Su geçirmez':item.waterResistance==='light'?'Su itici':'Koruma yok')}</span></div></div></article>)}</div>
      {!wardrobe.length&&<div className="studio-empty"><Shirt size={32}/><h3>{t('İlk parçanı ekle.')}</h3><button type="button" className="primary-button" onClick={()=>setActiveTab('barcode')}><Plus size={16}/>{t('Parça ekle')}</button></div>}
    </>}
    {activeTab==='custom_ai'&&<form onSubmit={handleAiAdd} className="studio-ai-form"><span className="eyebrow">{t('İsteğe bağlı yardımcı')}</span><h3>{t('Etiketi yaz. Bir taslak oluşturalım.')}</h3><p>{t('Fotoğraftan kumaş içeriği doğrulanamaz. Etiketteki bilgileri yaz; oluşturulan teknik değerleri tahmin olarak değerlendir.')}</p><label className="feedback-field">{t('Parçanı tarif et')}<textarea value={aiDescription} onChange={e=>setAiDescription(e.target.value)} placeholder={t('Örn. Lacivert kaban, etikette %80 yün %20 kaşmir…')} rows={3}/></label><input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden/><div className="studio-form-actions"><button type="button" className="secondary-button" onClick={()=>fileInputRef.current?.click()}><Upload size={15}/>{t(imagePreview?'Fotoğraf seçildi':'Fotoğraf ekle (isteğe bağlı)')}</button><button type="submit" className="primary-button" disabled={isAnalyzing||(!aiDescription.trim()&&!imagePreview)}>{isAnalyzing?<Loader2 size={16} className="loading-spin"/>:<Sparkles size={16}/>} {t('Taslak oluştur')}</button></div>{imagePreview&&<div className="ai-image-preview"><img src={imagePreview} alt={t('Seçtiğin kıyafet fotoğrafı')}/><button type="button" className="text-button" onClick={()=>setImagePreview(null)}><X size={14}/>{t('Fotoğrafı kaldır')}</button></div>}<p className="form-message">{t('Bu işlemde yazdığın açıklama ve seçtiğin fotoğraf, yapılandırılmışsa AI hizmetine gönderilir. Barkod / Manuel bölümünü kullanarak kendin de ekleyebilirsin.')}</p>{aiError&&<p role="alert" className="form-message">{t(aiError)}</p>}</form>}
  </Modal>;
}

'use client';
import { useLocale } from '@/lib/i18n';
import { useEffect, useRef, useState } from 'react';
import { Camera, LoaderCircle, ScanLine, X } from 'lucide-react';
import type { ClothingItem } from '@/lib/types';
import { normalizeBarcode, type ProductLookup } from '@/lib/product-lookup';
const categoryOptions = { base: 'İç katman', mid: 'Üst giyim', outer: 'Dış katman', bottom: 'Alt giyim', footwear: 'Ayakkabı', accessory: 'Aksesuar' };
export function BarcodeAddPanel({ onAdd }: {
    onAdd: (item: ClothingItem) => void;
}) {
    const { t } = useLocale();
    const [barcode, setBarcode] = useState('');
    const [product, setProduct] = useState<ProductLookup | null>(null);
    const [title, setTitle] = useState('');
    const [brand, setBrand] = useState('');
    const [material, setMaterial] = useState('');
    const [productUrl, setProductUrl] = useState('');
    const [category, setCategory] = useState<ClothingItem['category']>('mid');
    const [warmth, setWarmth] = useState<ClothingItem['warmth']>(3);
    const [color, setColor] = useState('#9ba58d');
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [cameraBusy, setCameraBusy] = useState(false);
    const scanner = useRef<{
        stop: () => void;
    } | null>(null);
    const [error, setError] = useState('');
    const [added, setAdded] = useState(false);
    const video = useRef<HTMLVideoElement>(null);
    const stream = useRef<MediaStream | null>(null);
    const generation = useRef(0);
    const request = useRef<AbortController | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stopCamera = () => {
        generation.current++;
        scanner.current?.stop();
        scanner.current = null;
        stream.current?.getTracks().forEach(track => track.stop());
        stream.current = null;
        if (timer.current)
            clearTimeout(timer.current);
        setScanning(false);
        setCameraBusy(false);
    };
    useEffect(() => () => {
        generation.current++;
        scanner.current?.stop();
        scanner.current = null;
        stream.current?.getTracks().forEach(track => track.stop());
        if (timer.current)
            clearTimeout(timer.current);
        request.current?.abort();
    }, []);
    const startCamera = async () => {
        setError('');
        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Bu ortamda kamera açılamıyor. HTTPS bağlantısını kullanabilir veya barkodu yazabilirsin.');
            return;
        }
        const current = ++generation.current;
        setCameraBusy(true);
        try {
            // Loaded only after the camera action, so the reader does not burden the main screen.
            const { BrowserMultiFormatReader, BarcodeFormat } = await import('@zxing/browser');
            if (current !== generation.current)
                return;
            const camera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
            if (current !== generation.current) {
                camera.getTracks().forEach(track => track.stop());
                return;
            }
            stream.current = camera;
            setScanning(true);
            const reader = new BrowserMultiFormatReader(new Map(), { delayBetweenScanAttempts: 250, delayBetweenScanSuccess: 500 });
            reader.possibleFormats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A];
            const attach = async () => {
                if (current !== generation.current)
                    return;
                if (!video.current) {
                    timer.current = setTimeout(attach, 30);
                    return;
                }
                try {
                    const controls = await reader.decodeFromStream(camera, video.current, (result, _error, controls) => {
                        if (current !== generation.current) {
                            controls.stop();
                            return;
                        }
                        const code = result ? normalizeBarcode(result.getText()) : null;
                        if (code) {
                            request.current?.abort();
                            setLoading(false);
                            setBarcode(code);
                            setProduct(null);
                            setAdded(false);
                            controls.stop();
                            stopCamera();
                        }
                    });
                    if (current !== generation.current)
                        controls.stop();
                    else
                        scanner.current = controls;
                }
                catch {
                    if (current === generation.current) {
                        stopCamera();
                        setError('Kamera görüntüsü okunamadı. Barkodu yazarak devam edebilirsin.');
                    }
                }
            };
            void attach();
        }
        catch {
            if (current === generation.current) {
                stopCamera();
                setError('Kamera açılamadı. İzni kontrol et veya barkodu yazarak devam et.');
            }
        }
        finally {
            if (current === generation.current)
                setCameraBusy(false);
        }
    };
    const lookup = async () => {
        const code = normalizeBarcode(barcode);
        if (!code) {
            setError('Barkodun hane sayısını ve son kontrol rakamını kontrol et.');
            return;
        }
        stopCamera();
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        setLoading(true);
        setError('');
        setProduct(null);
        setAdded(false);
        setConfirmed(false);
        setTitle('');
        setBrand('');
        setMaterial('');
        try {
            const response = await fetch(`/api/product?barcode=${code}`, { signal: controller.signal });
            const data = await response.json();
            if (!response.ok && response.status !== 429)
                throw new Error();
            setProduct(data);
            setTitle(data.title || '');
            setBrand(data.brand || '');
        }
        catch {
            if (!controller.signal.aborted) {
                setProduct({ barcode: code, found: false, source: 'manual', status: 'unavailable' });
                setError('Ürün servisine ulaşılamadı. Bilgileri kendin girerek devam edebilirsin.');
            }
        }
        finally {
            if (!controller.signal.aborted)
                setLoading(false);
        }
    };
    const add = (event: React.FormEvent) => {
        event.preventDefault();
        if (!product || !title.trim() || !confirmed || added)
            return;
        onAdd({ id: `w-product-${crypto.randomUUID()}`, barcode: product.barcode || undefined, productUrl: productUrl || undefined, name: title.trim(), brandHint: brand.trim(), category, segment: 'essential', material: material.trim() || 'Kumaş içeriği bilinmiyor', materialConfirmed: Boolean(material.trim()), dataSource: product.found ? 'barcode' : 'user', warmth, waterResistance: 'none', windResistance: 'low', colorHex: color, colorName: 'Seçtiğim renk', colorType: 'neutral', isUserOwned: true, description: 'Ürün kimliği ve kullanıcı tarafından onaylanan bilgiler. Isı seviyesi kişisel tahmindir; su ve rüzgâr koruması doğrulanmadı.' });
        setAdded(true);
    };
    return <div className="barcode-panel">
      <div className="barcode-intro"><ScanLine size={23}/><div><h3>{t('Barkoddan dolabına')}</h3><p>{t('Tara veya numarasını yaz. Ürün bilgilerini eklemeden önce onayla.')}</p></div></div>
      <button type="button" className="primary-button" disabled={cameraBusy} onClick={scanning?stopCamera:startCamera}>{scanning?<X size={16}/>:<Camera size={16}/>} {t(scanning?'Kamerayı kapat':'Kamera ile tara')}</button>
      {scanning&&<div className="barcode-camera"><video ref={video} muted playsInline aria-label={t('Barkod kamerası')}/><span>{t('Barkodu çerçevenin ortasına getir')}</span></div>}
      <p className="barcode-privacy">{t('Kamera görüntüsü bu cihazda işlenir. “Ürünü bul” dediğinde yalnızca barkod numarası ürün servisine gönderilir.')}</p>
      <div className="barcode-query"><input aria-label={t('Barkod numarası')} inputMode="numeric" autoComplete="off" placeholder={t('EAN / UPC barkod numarası')} value={barcode} onChange={e=>{request.current?.abort();setLoading(false);setBarcode(e.target.value.replace(/\D/g,'').slice(0,14));setProduct(null);setAdded(false);}}/><button type="button" className="primary-button" onClick={lookup} disabled={loading}>{loading&&<LoaderCircle size={15} className="loading-spin"/>}{t('Ürünü bul')}</button></div>
      <button type="button" className="text-button" onClick={()=>{request.current?.abort();stopCamera();setLoading(false);setError('');setAdded(false);setConfirmed(false);setTitle('');setBrand('');setMaterial('');setProductUrl('');setProduct({barcode:'',found:false,source:'manual',status:'not-found'});}}>{t('Barkodsuz elle ekle')}</button>
      {error&&<p className="form-message" role="alert">{t(error)}</p>}
      {product&&<form className="product-confirm" onSubmit={add}>
        <p className="form-message">{t(product.found?`Kaynak: ${product.source}. Ürünün marka, model ve varyantını kontrol et.`:!product.barcode?'Barkodsuz kayıt: ürün etiketindeki bilgileri gir.':product.status==='rate-limited'?'Ürün servisi kotası dolu. Manuel girişle devam edebilirsin.':product.status==='unavailable'?'Ürün servisine şu an ulaşılamıyor. Etiketteki bilgileri kendin girebilirsin.':'Bu barkod için eşleşme bulunamadı. Etiketteki bilgileri girebilirsin.')}</p>
        <label className="feedback-field">{t('Ürün bağlantısı (isteğe bağlı)')}<input type="url" pattern="https://.*" placeholder="https://…" value={productUrl} onChange={e=>setProductUrl(e.target.value)}/></label>
        <div className="product-fields">
          <label>{t('Ürün adı')}<input required maxLength={150} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>{t('Marka')}<input maxLength={100} value={brand} onChange={e=>setBrand(e.target.value)}/></label>
          <label>{t('Kategori')}<select value={category} onChange={e=>setCategory(e.target.value as ClothingItem['category'])}>{Object.entries(categoryOptions).map(([key,label])=><option key={key} value={key}>{t(label)}</option>)}</select></label>
          <label>{t('Kumaş etiketi')}<small>{t('İsteğe bağlı')}</small><input maxLength={200} placeholder={t('Örn. %80 pamuk, %20 polyester')} value={material} onChange={e=>setMaterial(e.target.value)}/></label>
          <label>{t('Isı koruması')}<small>{t('Kişisel tahmin')}</small><select value={warmth} onChange={e=>setWarmth(Number(e.target.value) as ClothingItem['warmth'])}>{[1,2,3,4,5].map(v=><option key={v} value={v}>{v} / 5</option>)}</select></label>
          <label>{t('Renk')}<input type="color" value={color} onChange={e=>setColor(e.target.value)}/></label>
        </div>
        <label className="check-label"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} required/>{t('Bu ürünün bendeki parçayla eşleştiğini onaylıyorum.')}</label>
        <button type="submit" className="primary-button" disabled={!confirmed||added}>{t(added?'Dolabına eklendi ✓':'Onayla ve dolabıma ekle')}</button>
      </form>}
    </div>;
}

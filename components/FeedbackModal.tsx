'use client';
import { useLocale } from '@/lib/i18n';
import { useEffect, useRef, useState } from 'react';
import { Check, Download, LoaderCircle, MessageCircle, Trash2, X } from 'lucide-react';
import type { ClothingItem, FeedbackRecord, WeatherConsensus } from '@/lib/types';
import { COMMUNITY_CONSENT_KEY, FEEDBACK_KEY, communityPayload, computeThermalProfile, itemIdentity, readFeedback } from '@/lib/comfort';
interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLocationName: string;
    onFeedbackChanged?: () => void;
    items?: ClothingItem[];
    weather?: WeatherConsensus | null;
}
const outcomes: {
    key: FeedbackRecord['clothingResult'];
    label: string;
    icon: string;
}[] = [
    { key: 'froze', label: 'Üşüdüm', icon: '❄' }, { key: 'perfect', label: 'Rahattım', icon: '✓' },
    { key: 'sweated', label: 'Terledim', icon: '☀' }, { key: 'wet', label: 'Islandım', icon: '☂' },
];
export function FeedbackModal({ isOpen, onClose, currentLocationName, onFeedbackChanged, items = [], weather }: FeedbackModalProps) {
    const { t, garment } = useLocale();
    const dialog = useRef<HTMLDialogElement>(null);
    const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
    const [outcome, setOutcome] = useState<FeedbackRecord['clothingResult']>('perfect');
    const [itemKey, setItemKey] = useState('');
    const [activity, setActivity] = useState<'resting' | 'walking' | 'active'>('walking');
    const [worn, setWorn] = useState(false);
    const [consent, setConsent] = useState(false);
    const [notes, setNotes] = useState('');
    const [rating, setRating] = useState(5);
    const [bestSource, setBestSource] = useState('Konsensüs Ortalaması');
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    useEffect(() => {
        if (!isOpen)
            return;
        const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const oldOverflow = document.body.style.overflow;
        setFeedbacks(readFeedback());
        setSubmitted(false);
        setWorn(false);
        setItemKey('');
        setNotes('');
        setMessage('');
        try {
            setConsent(localStorage.getItem(COMMUNITY_CONSENT_KEY) === 'true');
        }
        catch { }
        dialog.current?.showModal();
        document.body.style.overflow = 'hidden';
        return () => { dialog.current?.close(); document.body.style.overflow = oldOverflow; previous?.focus({ preventScroll: true }); };
    }, [isOpen]);
    if (!isOpen)
        return null;
    const profile = computeThermalProfile(feedbacks);
    const liveWeather = Boolean(weather?.sources.some(source => source.isAvailable));
    const eligible = itemKey.startsWith('gtin:') && liveWeather && worn;
    const revoke = async () => {
        setBusy(true);
        try {
            const response = await fetch('/api/community', { method: 'DELETE' });
            if (!response.ok)
                throw new Error();
            localStorage.setItem(COMMUNITY_CONSENT_KEY, 'false');
            setConsent(false);
            setMessage('Bu tarayıcıdan gönderilen topluluk katkıları silindi.');
        }
        catch {
            setMessage('Topluluk katkıları silinemedi. Bağlantını kontrol edip yeniden dene.');
        }
        finally {
            setBusy(false);
        }
    };
    const save = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!worn || !weather || !items.length)
            return;
        setBusy(true);
        setMessage('');
        const record: FeedbackRecord = {
            id: crypto.randomUUID(), timestamp: new Date().toISOString(), location: currentLocationName,
            rating, bestSource, clothingResult: outcome, notes: notes.trim().slice(0, 500),
            context: { worn: true, items: items.map(item => ({ key: itemIdentity(item), name: item.name, category: item.category })), itemKey: itemKey || undefined, feelsLike: weather.feelsLike, windSpeed: weather.windSpeed, precipitationProb: weather.precipitationProb, activity, liveWeather },
        };
        try {
            const updated = [record, ...readFeedback()].slice(0, 500);
            localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
            localStorage.setItem(COMMUNITY_CONSENT_KEY, String(consent));
            setFeedbacks(updated);
            setSubmitted(true);
            onFeedbackChanged?.();
            const payload = consent ? communityPayload(record) : null;
            if (payload) {
                try {
                    const response = await fetch('/api/community', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    setMessage(response.ok ? 'Kişisel kaydın ve izin verdiğin ürün katkısı kaydedildi. Genel öneriler inceleme olmadan değişmez.' : 'Kişisel kaydın saklandı; topluluk servisine ulaşılamadı. Topluluk katkısı gönderilmedi.');
                }
                catch {
                    setMessage('Kişisel kaydın saklandı; topluluk katkısı gönderilemedi.');
                }
            }
            else
                setMessage('Geri bildirimin bu cihazdaki kişisel profiline kaydedildi.');
        }
        catch {
            setMessage('Tarayıcı depolamasına yazılamadı. Kayıt yapılamadı.');
        }
        finally {
            setBusy(false);
        }
    };
    const reset = () => {
        try {
            localStorage.removeItem(FEEDBACK_KEY);
            setFeedbacks([]);
            setSubmitted(false);
            onFeedbackChanged?.();
            setMessage('Bu cihazdaki kişisel geri bildirimlerin sıfırlandı.');
        }
        catch {
            setMessage('Yerel kayıtlar temizlenemedi.');
        }
    };
    const exportFeedback = () => {
        const blob = new Blob([JSON.stringify(feedbacks, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob), anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'weathrobe-feedback.json';
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    return <dialog ref={dialog} className="feedback-dialog garment-dialog" aria-labelledby="feedback-title" onCancel={onClose} onClose={()=>{if(!dialog.current?.open)onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="feedback-content">
        <div className="detail-top"><span className="eyebrow"><MessageCircle size={14}/>{t('Sana göre öğrenir')}</span><button type="button" className="icon-button" onClick={onClose} aria-label={t('Geri bildirimi kapat')} autoFocus><X size={18}/></button></div>
        <h2 id="feedback-title">{t('Nasıl hissettin?')}</h2>
        <p className="feedback-context">{currentLocationName}{weather&&<> · {t(`Hissedilen ${weather.feelsLike}°`)} · {t('Rüzgâr')} {weather.windSpeed} km/h</>}</p>
        <div className="personal-profile"><span>{t(profile.label)}</span><span>{t(`${profile.feedbackCount} kayıt`)}</span></div>
        {submitted?<div className="feedback-success"><Check size={30}/><h3>{t('Bir sonraki öneriye katkın var.')}</h3><p>{t(message)}</p><button type="button" className="primary-button" onClick={onClose}>{t('Tamam')}</button></div>:<form onSubmit={save}>
          <div className="comfort-options" role="group" aria-label={t('Kıyafet konforu')}>{outcomes.map(option=><button type="button" key={option.key} aria-pressed={outcome===option.key} onClick={()=>setOutcome(option.key)}><span>{option.icon}</span>{t(option.label)}</button>)}</div>
          <label className="feedback-field">{t('Kombinin bütünü mü, bir parça mı?')}<select value={itemKey} onChange={e=>setItemKey(e.target.value)}><option value="">{t('Kombinin bütünü')}</option>{items.map(item=><option key={item.id} value={itemIdentity(item)}>{garment(item)}</option>)}</select></label>
          <label className="feedback-field">{t('Ne yapıyordun?')}<select value={activity} onChange={e=>setActivity(e.target.value as typeof activity)}><option value="resting">{t('Çoğunlukla oturuyordum')}</option><option value="walking">{t('Yürüyordum / günlük hareket')}</option><option value="active">{t('Yoğun hareket ediyordum')}</option></select></label>
          <label className="check-label"><input type="checkbox" checked={worn} onChange={e=>setWorn(e.target.checked)} required/>{t('Gösterilen hava koşulunda bu kombini gerçekten giydim.')}</label>
          {!liveWeather&&<p className="form-message">{t('Hava verisi canlı değil. Kayıt kişisel profiline eklenir; topluluk öğrenmesine gönderilmez.')}</p>}
          {!items.length&&<p className="form-message">{t('Önce bir kombin oluşturmalısın.')}</p>}
          <details className="feedback-extras"><summary>{t('Hava tahmini değerlendirmesi ve not')}</summary><label className="feedback-field">{t('Tahmin doğruluğu')}<select value={rating} onChange={e=>setRating(Number(e.target.value))}>{[1,2,3,4,5].map(v=><option key={v} value={v}>{v} / 5</option>)}</select></label><label className="feedback-field">{t('Daha isabetli kaynak')}<select value={bestSource} onChange={e=>setBestSource(e.target.value)}>{['Konsensüs Ortalaması','Open-Meteo','MET Norway','DWD ICON'].map(s=><option key={s} value={s}>{t(s)}</option>)}</select></label><label className="feedback-field">{t('Not')}<textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={500} rows={2}/></label></details>
          <div className="community-choice"><label className="check-label"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>{if(e.target.checked)setConsent(true);else void revoke();}}/>{t('Ürün geri bildirimim topluluk değerlendirmesine katkı sağlasın.')}</label><p>{t('Yalnızca barkodlu parçanın kimliği, konfor sonucu, hareket türü ve yuvarlanmış hava koşulları paylaşılır. Konum, notlar ve manken bilgileri gönderilmez. Katkılar otomatik genel güncelleme oluşturmaz.')}</p>{consent&&!eligible&&<p>{t('Bu kayıt paylaşılmayacak. Katkı için barkodlu bir parça, canlı hava ve giydim onayı gerekir.')}</p>}</div>
          {message&&<p role="status" className="form-message">{t(message)}</p>}
          <button type="submit" className="primary-button detail-done" disabled={busy||!worn||!weather||!items.length}>{busy?<LoaderCircle size={16} className="loading-spin"/>:<Check size={16}/>} {t('Kaydet ve kişiselleştir')}</button>
        </form>}
        <details className="feedback-history"><summary>{t('Kayıtlarım ve veri kontrolü')}</summary><p>{t(`${feedbacks.length} yerel kayıt. Kayıtlar dışa aktarıldığında konum ve notlarını da içerir.`)}</p><div><button type="button" className="text-button" onClick={exportFeedback}><Download size={14}/>{t('JSON indir')}</button><button type="button" className="text-button" onClick={reset}><Trash2 size={14}/>{t('Yerel profili sıfırla')}</button><button type="button" className="text-button" onClick={revoke} disabled={busy}><Trash2 size={14}/>{t('Topluluk katkılarımı sil')}</button></div></details>
      </div>
    </dialog>;
}

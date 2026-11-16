'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle, MessageSquareWarning, X } from 'lucide-react';
import { useLocale } from '@/lib/i18n';
import { FEEDBACK_ID, FEEDBACK_MAX_TEXT, prepareProductFeedback, type ProductFeedbackCategory, type ProductFeedbackSubmission } from '@/lib/product-feedback';

export function ProductFeedbackModal({ onClose }: { onClose: () => void }) {
  const { t, locale } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [category, setCategory] = useState<ProductFeedbackCategory>('bug');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [reviewed, setReviewed] = useState<ProductFeedbackSubmission | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState('');
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    element?.querySelector('select')?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      controller.current?.abort(); element?.close(); document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (reviewed || receipt) dialog.current?.querySelector<HTMLElement>('h3')?.focus();
  }, [reviewed, receipt]);

  function preview(event: React.FormEvent) {
    event.preventDefault();
    const candidate = prepareProductFeedback({ category, description, steps }, locale, crypto.randomUUID());
    if (!candidate) { setMessage('Açıklama 10–2000 karakter, tekrar adımları en fazla 2000 karakter olmalı.'); return; }
    setReviewed(candidate); setConsent(false); setMessage('');
  }
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!reviewed || !consent || busy) return;
    setBusy(true); setMessage('');
    const abort = new AbortController(); controller.current = abort;
    const timer = window.setTimeout(() => abort.abort(), 20000);
    try {
      const response = await fetch('/api/feedback', { method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reviewed), signal: abort.signal });
      if (response.status === 429) { setMessage('Gönderim sınırına ulaşıldı. Daha sonra tekrar deneyebilirsin.'); return; }
      if (response.status === 400 || response.status === 413 || response.status === 409) {
        setMessage('Bildirim doğrulanamadı. Düzenle düğmesiyle metni kontrol edip yeniden önizle.'); return;
      }
      if (!response.ok) throw new Error('SAVE_FAILED');
      const result = await response.json();
      if (result.saved !== true || typeof result.id !== 'string' || !FEEDBACK_ID.test(result.id) || result.id !== reviewed.submissionId) throw new Error('BAD_RECEIPT');
      setReceipt(result.id);
    } catch {
      setMessage('Kayıt onayı alınamadı. Metnin bu pencerede korunuyor; tekrar gönderebilirsin.');
    } finally { window.clearTimeout(timer); controller.current = null; setBusy(false); }
  }
  const categoryLabel = (value: ProductFeedbackCategory) => t(value === 'bug' ? 'Hata bildir' : 'Öneri paylaş');
  return <dialog ref={dialog} className="studio-dialog product-feedback-dialog" aria-labelledby="product-feedback-title"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="studio-modal-head"><div><span className="eyebrow"><MessageSquareWarning size={14}/> {t('Uygulama geri bildirimi')}</span><h2 id="product-feedback-title">{t('Hata bildir / Öneri paylaş')}</h2></div>
      <button type="button" className="icon-button" aria-label={t('Kapat')} disabled={busy} onClick={onClose}><X size={20}/></button></div>
    <div className="studio-modal-body">
      {receipt ? <section className="product-feedback-success" role="status"><Check size={28}/><h3 tabIndex={-1}>{t('Bildirimin kaydedildi.')}</h3><p>{t('İnceleme için rapor numaran:')}</p><code>{receipt}</code><button type="button" className="primary-button" onClick={onClose}>{t('Kapat')}</button></section>
        : reviewed ? <form onSubmit={send} aria-busy={busy}>
          <h3 tabIndex={-1}>{t('Göndermeden önce kontrol et')}</h3>
          <dl className="product-feedback-preview"><dt>{t('Kategori')}</dt><dd>{categoryLabel(reviewed.category)}</dd><dt>{t('Açıklama')}</dt><dd>{reviewed.description}</dd>
            <dt>{t('Tekrar adımları (isteğe bağlı)')}</dt><dd>{reviewed.steps || t('Eklenmedi')}</dd><dt>{t('Form dili')}</dt><dd>{reviewed.locale.toUpperCase()}</dd></dl>
          <p className="product-feedback-privacy">{t('Yalnızca bu bilgiler gönderilir. Sunucu rapor numarası ve kayıt zamanı ekler. Gönderim sınırı için bir günlük anonim çerez ve özetlenmiş sayaç kullanılır. IP adresi kaydedilmez.')}</p>
          <label className="product-feedback-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)}/><span>{t('Önizlemedeki bilgilerin inceleme için sunucuda saklanmasını onaylıyorum.')}</span></label>
          {message && <p className="form-message" role="alert">{t(message)}</p>}
          <div className="product-feedback-actions"><button type="button" className="text-button" disabled={busy} onClick={() => { setReviewed(null); setConsent(false); setMessage(''); }}>{t('Düzenle')}</button>
            <button type="submit" className="primary-button" disabled={!consent || busy}>{busy ? <><LoaderCircle size={16} className="loading-spin"/>{t('Gönderiliyor…')}</> : t('Onayla ve gönder')}</button></div>
        </form> : <form onSubmit={preview}>
          <p>{t('Uygulamadaki bir sorunu veya geliştirme fikrini paylaş. Kombin ve üşüme/terleme değerlendirmesi ayrı bölümde kalır.')}</p>
          <label className="feedback-field">{t('Kategori')}<select value={category} onChange={event => setCategory(event.target.value as ProductFeedbackCategory)}><option value="bug">{t('Hata bildir')}</option><option value="suggestion">{t('Öneri paylaş')}</option></select></label>
          <label className="feedback-field">{t('Açıklama')}<textarea value={description} onChange={event => setDescription(event.target.value)} required minLength={10} maxLength={FEEDBACK_MAX_TEXT} rows={5} aria-describedby="product-feedback-description-help"/></label>
          <p id="product-feedback-description-help" className="product-feedback-help">{t('10–2000 karakter. Kişisel bilgi veya gizli anahtar yazma.')} <span>{description.length}/{FEEDBACK_MAX_TEXT}</span></p>
          <label className="feedback-field">{t('Tekrar adımları (isteğe bağlı)')}<textarea value={steps} onChange={event => setSteps(event.target.value)} maxLength={FEEDBACK_MAX_TEXT} rows={3}/></label>
          <p className="product-feedback-privacy">{t('Konumun, dolabın, avatarın, API anahtarların ve cihaz dökümü otomatik eklenmez. Ekran görüntüsü veya dosya alınmaz.')}</p>
          <p className="product-feedback-help">{t('Taslak yalnızca bu pencerede kalır; kapattığında silinir. Önizleme veri göndermez.')}</p>
          {message && <p className="form-message" role="alert">{t(message)}</p>}
          <button type="submit" className="primary-button product-feedback-next">{t('Gönderilecek bilgileri önizle')}</button>
        </form>}
    </div>
  </dialog>;
}

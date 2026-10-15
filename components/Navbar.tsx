'use client';
import { Sun, Moon, SlidersHorizontal, MessageCircle, Shirt, Smartphone, Monitor, ArrowUpRight } from 'lucide-react';
import { useLocale } from '@/lib/i18n';
import { BrandMark } from './BrandMark';
interface NavbarProps {
  theme: 'dark' | 'light'; onToggleTheme: () => void; onOpenSources: () => void; onOpenFeedback: () => void;
  onOpenWardrobe: () => void; wardrobeCount: number; previewDevice: 'desktop' | 'mobile'; onTogglePreviewDevice: () => void;
}
export function Navbar({ theme, onToggleTheme, onOpenSources, onOpenFeedback, onOpenWardrobe, wardrobeCount, previewDevice, onTogglePreviewDevice }: NavbarProps) {
  const { t, locale, setLocale } = useLocale();
  return <header className="app-header">
    <a href="#main-content" className="skip-link">{t('İçeriğe geç')}</a>
    <a className="brand" href="#main-content" aria-label={t('Weathrobe ana ekran')}><span>weathrobe<span className="brand-period">.</span><small>A NOk PROJECT</small></span><BrandMark /></a>
    <nav className="header-nav" aria-label={t('Ana menü')}><a className="nav-today" href="#main-content" aria-current="page"><span className="status-dot" />{t('Bugün')}</a><button type="button" className="nav-wardrobe" aria-label={t(`Dolabım (${wardrobeCount} parça)`)} onClick={onOpenWardrobe}><Shirt size={16}/><span>{t('Dolabım')}</span><span className="nav-count">{wardrobeCount}</span></button></nav>
    <div className="header-actions">
      <label className="language-select"><span className="sr-only">{t('Dil')}</span><select aria-label={t('Dil')} value={locale} onChange={event => setLocale(event.target.value as 'tr' | 'en')}><option value="tr">TR</option><option value="en">EN</option></select></label>
      <button type="button" className="preview-toggle" onClick={onTogglePreviewDevice} aria-label={t(previewDevice === 'mobile' ? 'Masaüstü' : 'App Preview')} aria-pressed={previewDevice === 'mobile'}>{previewDevice === 'mobile' ? <Monitor size={16}/> : <Smartphone size={16}/>}<span>{t(previewDevice === 'mobile' ? 'Masaüstü' : 'App Preview')}</span><ArrowUpRight size={13}/></button>
      <span className="header-divider"/>
      <button type="button" className="icon-button" onClick={onOpenSources} aria-label={t('Kaynaklar ve gizlilik')} title={t('Kaynaklar ve gizlilik')}><SlidersHorizontal size={18}/></button>
      <button type="button" className="icon-button feedback-button" onClick={onOpenFeedback} aria-label={t('Geri bildirim')} title={t('Geri bildirim')}><MessageCircle size={18}/></button>
      <button type="button" className="icon-button" onClick={onToggleTheme} aria-label={t(theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç')}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button>
    </div>
  </header>;
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <span className={`nok-brand-mark ${compact ? 'nok-brand-compact' : ''}`}><img src="/nok-logo-transparent.svg" width="76" height="33" alt="NOk" /></span>;
}

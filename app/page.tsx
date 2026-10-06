import { CloudSun, MapPin, Compass, ShieldCheck, Shirt, Globe2 } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 sm:p-12">
      <div className="max-w-4xl mx-auto w-full space-y-8 my-auto">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs sm:text-sm font-medium">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          Gizlilik Odaklı &bull; Ülke/Şehir/İlçe Düzeyinde Konumlandırma
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <CloudSun className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 shrink-0" />
            Weathrobe
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            3+ güvenilir meteoroloji kaynağından hava durumu konsensüsü, ilçe ve rota bazlı harita görselleştirmesi, 3D dünya küresi ve anlık katmanlı kıyafet rehberi.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <MapPin className="w-6 h-6 text-sky-400" />
            <h3 className="font-semibold text-white text-base">Şehir & İlçe Haritası</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              İlçe ilçe hava durumu ve her ilçe için ikonlarla eşleşen stil ve kıyafet tavsiyeleri.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <Compass className="w-6 h-6 text-emerald-400" />
            <h3 className="font-semibold text-white text-base">Rota & Yolculuk Analizi</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Şehirler arası seyahatlerde ulaşım aracı ve hareket saatine göre durak durak hava tahminleri.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <Globe2 className="w-6 h-6 text-purple-400" />
            <h3 className="font-semibold text-white text-base">3D Dünya Küresi</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Uluslararası seyahatlerde interaktif 3D küre üzerinde iklim farkı ve seyahat gardırobu planı.
            </p>
          </div>
        </div>

        {/* Status Callout */}
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-start gap-3">
          <Shirt className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-100">Mimari ve Dizayn Haritası Hazırlandı: </span>
            Tüm mimari gereksinimler, veri modelleri, Firefox optimizasyonları ve Oracle Cloud dağıtım analizleri 
            <code className="mx-1 px-1.5 py-0.5 bg-slate-900 text-amber-300 rounded text-xs font-mono">ARCHITECTURE_AND_ROADMAP.md</code> 
            dosyasında detaylandırıldı. Gereksinim onaylarınızın ardından site inşasına başlanacaktır.
          </div>
        </div>
      </div>

      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 pt-8">
        Weathrobe Architecture &bull; Firefox-first &bull; PWA Ready
      </footer>
    </main>
  );
}

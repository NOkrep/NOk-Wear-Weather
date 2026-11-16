<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/3411c9db-4b32-4450-b247-0fd910e2ee1f

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`


---

## Güncel geliştirme durumu — 16 Ekim 2026

Yukarıdaki AI Studio bölümü projenin ilk oluşturulma kaydıdır ve korunmuştur. Projenin güncel adı **Weathrobe / Wear Weather (NOk)**; yerel uygulama Next.js 15, React 19 ve TypeScript kullanır.

Güncel dosya haritası, uygulanan özellikler, test sonuçları, açık işler ve Meta VR referanslı avatar tasarımı için **[DEVELOPMENT_HANDOFF.md](DEVELOPMENT_HANDOFF.md)** dosyasını okuyun. Sonraki geliştirmelerde bu belgeyi kodla birlikte güncelleyin.

Hava, rota ve katalog akışları Gemini anahtarı gerektirmez. İlk gerçek 3D avatar/editör sürümünün varlık kapsamı ve giysi renk önizlemesinin sınırları güncel devir belgesinin 8. bölümündedir. Mobil App Preview tarayıcı tabanlı önizlemedir.

### Dolap taslağı ve konum verisi

- Metinden dolap taslağı Weathrobe'un kural motoruyla oluşturulabilir. Kaynaklar ekranında kişisel Gemini anahtarı tanımlanmışsa uygulama gönderilen açıklamayı ve varsa fotoğrafı Gemini'ye iletir. Fotoğraf kabulü JPEG, PNG ve WebP için 2 MiB ile sınırlı. Gemini istekleri kişisel anahtarın Google kotasına tabidir. Her uygulama süreci en fazla dört eşzamanlı taslak isteğini ve dakikada 30 başvuruyu kabul eder.
- Service worker uygulama API yanıtlarını ağdan ister ve eski Weathrobe Cache Storage girdilerindeki API kayıtlarını temizler. Hava tahmini sağlayıcılarına ve cihaz konumu akışına iki ondalığa yuvarlatılmış koordinatlar gider. Adres ve yol sağlayıcıları arayüzün verdiği koordinatları, yer arama sağlayıcısı arama metnini alır. Uygulama bu sorgular için kalıcı Next.js veri önbelleğini kullanmaz. Tarayıcı navigasyon geçmişi ve dış sağlayıcıların saklama politikaları kendi sınırlarında kalır.

## Katalog ve sunucu altyapısı — 18 Ekim 2026

32 TR/EN kıyafet türü, PostgreSQL ürün/varyant/fiyat/kaynak şeması, alan bazlı veri dayanağı ve doğrulama → taslak → inceleme → yayımlama komutları eklendi. Hedef tür başına 10–15 farklı gerçek model, toplam 320–480 modeldir; **bu tur gerçek ürün verisi toplanmadı**. Önceki 23 öneri profili ve yerel dolap kayıtları korunur. Gerçek ürün kartlarının arayüze bağlanması sonraki aşamadır.

Kurulum, API sözleşmesi, veri toplama kuralları, Docker/Caddy ve yedekleme için **[db/README.md](db/README.md)** dosyasını okuyun. Güncel çalışma zamanı Node.js **24+**; Docker imajı da Node 24 kullanır. `DATABASE_URL` olmadan yerel geliştirme eski profillerle devam eder. Oracle hesabında kaynak veya canlı yayın oluşturulmadı.

## İlk kaynaklı ürün grubu — 18 Ekim 2026

Altyapı turunun ardından **10 farklı kısa kollu tişört modeli** kaynaklı JSON grubu olarak hazırlandı. Her modelde resmî ürün sayfasına dayanan ana kumaş bileşimi, 3 modelde açık gramaj beyanı var. Yayımlanmamış barkod/beden/renk ve teknik değerler boş; fiyat/stok bu gruba dahil değil. Renk varyantları farklı model sayılmadı.

Ürün listesi, kaynaklar ve sınırlar **[db/imports/README.md](db/imports/README.md)** içinde. `tests/catalog-data.test.cjs`: ayrı gerçek PostgreSQL test veritabanıyla **6/6 başarılı**. Kayıtlar yalnız o test ortamında yayımlanıp geri okundu; kalıcı/üretim kataloğuna veya dolap arayüzüne otomatik aktarılmadı. Önceki bölümler tarihsel kapsamıyla korunur.

## Yerel uygulamada gerçek katalog — 18 Ekim 2026

Kullanıcının aktarım onayıyla yukarıdaki 10 model artık **kalıcı yerel PostgreSQL kataloğunda** yayımlandı. [Yerel önizleme](http://127.0.0.1:3000/) içinde **Dolabım → Katalog → Gerçek ürünler** varsayılan görünümüdür: TR/EN arama, 32 türün kapsam sayıları, kumaş yüzdeleri, varsa GSM ve kaynak ayrıntıları gösterilir. Eski 23 profil ayrı **Örnek profiller** görünümündedir; kişisel dolap kayıtları korunur.

Docker Desktop çalışırken `npm run catalog:local` yerel veritabanını başlatır, geçişleri uygular ve bu incelenmiş grubu tekrarları çoğaltmadan yayımlar. Ardından `npm run dev` çalıştırın; açık Next.js sürecini ilk bağlantıdan sonra yeniden başlatın. Yerel bağlantı/volume ve durdurma komutları [db/README.md](db/README.md) içinde.

Bu bağlantı ürün inceleme içindir. Kaynaklı ürünleri dolaba ekleme ve öneri motorunda kullanma henüz uygulanmadı; teknik değerler bilinmediğinde eski puanlara dönüştürülmez. Kart çizimleri temsilidir. Oracle hesabına veya internete yayın yapılmadı. Önceki bölümlerdeki yalnız-test durumu, bu yeni yerel aktarım öncesinin kaydıdır.

## Gerçek ürün → kişisel dolap → kombin — 18 Ekim 2026

Sonraki entegrasyon onayıyla gerçek ürün kartlarına **Dolabıma ekle** eklendi; aynı ürün tekrar eklenmez. Dolap kaydı ürün kimliği/bağlantısını, TR/EN adını, kumaşını ve kaynak/dayanak snapshot'ını korur. Eski dolap kayıtları geçerli kalır.

**Dolabım** içinde isteğe bağlı **Kişisel ısı tahminim** verilebilir. Bu değer ürünün kaynaklı teknik alanlarını değiştirmez. Isı bilgisi/tahmini olmayan ürün otomatik seçilmez; **Eşleştir** içinde elle seçilebilir ve eksik hava uygunluğu uyarısı gösterilir. Tahmin verildiğinde **Dolabımdan** seçiminde kullanılabilir; bilinmeyen yağmur/rüzgâr koruması doğrulanmış sayılmaz. Gerçek ürünler için fiyat segmenti ve renk bilinmiyorsa boş/bilinmiyor kalır.

İlk 10 modelin kaynakları: Decathlon Türkiye 6 (biri NORFOLK pazaryeri satıcı beyanı), LCW 1, Marks & Spencer Türkiye 3. Bunlar kayıtlı ürün sayfası beyanlarıdır; otomatik canlı mağaza API'si değildir. Fotoğraf aktarılmadı; çizimler temsilidir. Görsel kullanımı için kaynak izni/ürün akışı gerekir; ayrıntılar [kaynak notlarında](db/imports/README.md). Önceki inceleme-aşaması sınırları, bu yeni bağlantıdan önceki tarihsel durumu anlatır.

## Kaynak genişlemesi — 18 Ekim 2026

Yeni onayla **DeFacto 2, Koton 4, Mavi 4 ve Stanley/Stella 4 olmak üzere 14 model** daha kalıcı yerel kataloğa eklendi. Toplam **24 farklı model / 24 kaynak gözlemi**: kısa kollu tişört 14, uzun kollu tişört 10. İlk iki türde 10–15 model hedefi karşılandı; diğer 30 tür sıradadır. Mevcut 23 örnek profil ve kişisel dolap kayıtları korunur.

[Kaynak takip kaydı](db/sources/README.md), 13 sağlayıcı için alınan veri, erişim/görsel koşulları, doğrulama sorunları ve yeniden ele alma adımını tutar. Printful açık API'sinden iki gerçek modelin varyant/kumaş gözlemleri alındı; merkezi katalogda yayımlanmadı. Awin, GS1, adidas ve pazaryeri API'leri dahil bekleyenlerin nedenleri açıkça kayıtlıdır. Bu araştırma hesap açma, ücretli erişim veya görsel lisansı alındığı anlamına gelmez.

`npm run catalog:local` artık [incelenmiş yerel aktarım listesindeki](db/imports/local-approved.json) iki grubu idempotent yükler; araştırma/probe/aday dosyaları kendiliğinden içe alınmaz. Uygulamada arama, tür filtresi ve sayfalama yeni kayıtları doğrudan kullanır. Belgelerdeki önceki 10 ürün/31 boş tür ifadeleri tarihsel kayıttır.

## Temsili 3D kombin ve bağımsız aksesuarlar — 18 Ekim 2026

Dolaptaki kişisel renk/desen/kesim artık desteklenen 3D giysi şablonlarına da aktarılır. Ön/yan/arka görünüm ve karakter editörü açık kombini korur. Kısa/uzun üst, sweatshirt, ceket, pantolon ve ayakkabı yüzeyleri yerel gövde topolojisinden üretilir; gerçek ürün kalıbı veya kumaş fiziği değildir. Bere, atkı, eldiven ve çorap ayrı yuvalarda birlikte kullanılabilir. Elbise/etek/sandalet/güneş şapkası/ekipman 3D desteği ve tek-parça seçim kuralları henüz tamamlanmadı.

Kendi parçanızı Barkod/Manuel ekranında kategori ve tür seçerek ekleyebilirsiniz. Doğrulanmamış teknik değerler bilinmiyor kalır. Doğrulama ve daha sonra toplu kontrol listesi: `DEVELOPMENT_HANDOFF.md` bölüm 15. Önceki içerik korunmuştur.

## Katalogta tam kombin kapsamı — 18 Ekim 2026

Kullanıcının son önceliğiyle 3D katman hatası açık iş olarak bırakılıp katalog büyütüldü. Beş yeni grupta 10'ar polar, sweatshirt, kumaş pantolon, yağmurluk ve koşu ayakkabısı kalıcı yerel PostgreSQL'e aktarıldı. **Toplam 74 kaynaklı model / 74 kaynak gözlemi / 7 dolu tür / 25 boş tür** var. İlk iki tişört grubunun kayıtları korunur; renkler ayrı model sayılmaz.

[50 yeni model ve kaynak kararları](db/sources/complete-outfit-research.2026-10-18.md), [açık aktarım listesi](db/imports/local-approved.json) ve [güncel devir kaydı](DEVELOPMENT_HANDOFF.md) inceleme için hazırdır. Yeni gruplar mevcut katalogdan dolaba eklenir; ısı bilinmiyorsa otomatik hava uygunluğu puanı kazanmaz. Isı/GSM/protection tahmin edilmedi; 9 yağmurluğun su geçirmezlik beyanı, bir Raincut'ın ihtiyatlı su itici kaydı üretici beyanıdır.

32 tür × 10–15 hedefi tamamlanmadı. Sonraki sıra günlük jean/gömlek/kazak/hırka/eşofman, kışlık dış giyim ve aksesuarlar; farklı mağazalarla spor/outdoor ağırlığını dengeleme. Bu veri turu 3D giydirme düzeltmesi veya Oracle yayını değildir.

## 36 tür, kişisel çizim galerisi ve 100 model hedefi — 18 Ekim 2026

Güncel katalog **146 farklı gerçek model / 146 kaynak / 20 incelenmiş grup / 36 tür** içerir; 72 yeni model kalıcı yerel PostgreSQL'e yayımlandı. Yeni türler **polo, bluz, yelek, yağmurluk pançosu**. Kullanıcının güncel hedefi **tür başına 100 gerçek model, toplam 3.600**. Şu anda 18 tür dolu, 18 tür boş; **hiçbir tür 100'e ulaşmadı**, 3.454 model eksik. Önceki 10–15 hedefi ve 74/32 sayıları tarihsel kayıttır.

Dolabım → Katalog → **Tasarım örnekleri**: 36 türün her biri için 5, toplam **180 özgün SVG çizimi**. Yaka/kol/kesim yanında cepler, kapanış, silüet ve boy farklılaşır. Dolabımdaki parçanın **Görünümü düzenle** ekranından silüet seçip kişisel renk/desenle kaydedebilirsiniz. Kaydet/Vazgeç akışı korunur; bunlar gerçek ürün veya üretici kumaş/performans verisi sayılmaz. Yeni tasarımlar 2D içindir; 3D katman sorunu açık kalır.

[Gerçek model ilerlemesi](db/sources/catalog-progress.md), [72 model ve kaynak kararları](db/sources/catalog-expansion.2026-10-18.md), [güncel devir/kontrol listesi](DEVELOPMENT_HANDOFF.md). İlerleme raporunu yenilemek için `node node_modules/tsx/dist/cli.mjs scripts/catalog/progress.ts --write`; mevcut `npm run catalog:local` yalnız açık onay listesini tekrarları çoğaltmadan yükler. Eski Markdown bölümleri ve yayınlanmış JSON grupları korunmuştur.

## Oracle arkadaş önizlemesi — 19 Ekim 2026

[Adım adım yayın rehberi](deploy/ORACLE_PREVIEW.md): kullanıcının Frankfurt Ubuntu ARM sunucusuna güncel çalışma dosyaları, PostgreSQL ve 146 incelenmiş ürün aktarılır. Sunucu Docker/Compose ve SSH bağlantısı kullanıcı tarafından doğrulandı; uygulamanın Oracle üzerindeki canlı yayını ve ARM üretim derlemesi henüz tamamlanmış sayılmaz.

- `node scripts/deploy/package-release.mjs --name weathrobe-preview-2026-10-19`: yerel sırlar, kişisel veriler ve bağımlılık/derleme klasörleri hariç kaynak arşivi ve SHA-256 üretir. Çıktı `artifacts/releases/` altındadır; Git'e eklenmez, mevcut paket üzerine yazılmaz.
- `node scripts/deploy/configure-preview.mjs --domain PUBLIC_HOSTNAME`: sunucuda iki ayrı yeni DB parolası üretir, AI anahtarlarını boş bırakır; mevcut yerel DB/AI anahtarı veya çakışan ayarlarda durur. Komut sunucuda Node 24 konteynerinde çalıştırılabilir.
- Araç konteynerinde `node --import tsx scripts/catalog/import-reviewed.ts --check` tüm onay listesini DB'ye dokunmadan doğrular; `--reviewed` mevcut digest/yayın işlemleriyle aktarır ve tekrar çalıştırmada çoğaltmaz. `catalog:local` bilgisayardaki yerel ortam içindir.
- Next.js **15.5.28** korundu; iç PostCSS **8.5.30** sürümüne yönlendirildi. Doğrudan PostCSS kilidi **8.5.31**. Üretim bağımlılığı `npm audit --omit=dev`: **0 bulgu**. Tüm bağımlılıklar denetiminde lint araçlarının `braces` zincirinden **5 yüksek önem uyarısı** sürüyor; bu tur zorlayıcı ana sürüm değişikliği yapılmadı.
- Yerel Docker Linux üretim imajı derlendi; boş test DB'sinde Linux yayın testleri **9/9** başarılı. İkinci aktarım 0 yeni ürün, salt okuma hesabı yazmayı/taslak payload okumayı reddediyor. Üretim imajı HTTP 200 ve DB üzerinden 146 ürün/36 tür/23 eski profil ile doğrulandı. Bu kanıt yerel Docker ortamına aittir; Oracle/HTTPS/gerçek mobil cihaz kontrolü sonraki adımdır.

İlk paylaşım adresi için alan adı satın almadan `sslip.io` ve Caddy kullanılabilir; DNS/sertifika hizmetlerinin kullanılabilirliğine bağlıdır. Genel uygulama geri bildirim kutusu ve gerçek 3D katman düzeltmesi bu tur eklenmedi. Mevcut Markdown bölümleri ve kişisel yerel veriler korundu.

## Hedef ve ilerleme takibi — 27 Ekim 2026

[PROJECT_GOALS.md](PROJECT_GOALS.md), tamamlanan işleri, öncelikli hedefleri, bağımlılıkları, kabul koşullarını ve tarihli ilerleme günlüğünü tek yerde toplar. Önceki bölümler tarihsel kayıt olarak korunur.

19 Ekim'de kullanıcı Oracle ARM üretim derlemesini, 146 ürün / 20 grup / 36 tür aktarımını ve sitenin açıldığını doğruladı. Yukarıdaki “yayın henüz tamamlanmadı” ifadeleri hazırlık aşamasına aittir. 27 Ekim incelemesinde canlı sunucu yeniden kontrol edilmedi; bugünkü erişim ve yedek sağlığı doğrulanmış sayılmaz.

Önerilen sıra: **WW-01 canlı durumu doğrulama → WW-02 sunucu dışı yedek ve izole geri yükleme → WW-03 gerçek cihaz kabulü**. Katalog hedefi 146/3.600, dolu tür 18/36; 3D katman hatası ve diğer ürün işleri listede açık kalır. Bu tur uygulama/sürüm/veri/yayın değişikliği yapılmadı.

## WW-05 — 0.6.0 toplu yayın hazırlığı — 30 Ekim 2026

Kullanıcı WW-22/24/23/21'i tek sürümde hazırlamak için 23 dosyalık kapsamı onayladı. Paket/kilit, görünür sürüm, SW önbelleği ve imaj kimlikleri 0.6.0 ile eşleştiriliyor. Bağımlılık sürümleri değiştirilmedi; canlı yayın yapılmadı. Yukarıdaki eski sürüm/audit/kurulum sonuçları kendi tarihlerine aittir.

[Yayın profili](deploy/release-profile.json), [hazırlık ve geri dönüş rehberi](deploy/RELEASE.md), [güncel kanıtlar ve açık kapılar](deploy/RELEASE_EVIDENCE.md). `node scripts/deploy/check-release.mjs --all` aynı kaynakta tüm hazırlık kontrollerini çalıştırır. Başarısız veya eksik kapıda paketleme engellenir. Yeni sağlık uç noktası `/api/health` sürüm/kaynak kimliği ve DB kaynaklı katalog sayımını sır göstermeden bildirir; çevrimdışı başarı yanıtı önbellekten sunulmaz. Gerçek canlı envanter ve kurtarma kanıtları yerel prova ile karıştırılmaz; yayın ayrı onayda kalır.

## 0.6.0 canlı yayın kabulü — 2 Kasım 2026

WW-22/24/23/21 tek sürümde gerçek ARM64 sunucuya yayınlandı; kullanıcı kısa tarayıcı kabulünü verdi. Sağlık HTTPS 200, katalog 146 ürün/36 tür ve içerik eşitliği, 30 stüdyo görseli sunumu, geri bildirim güvenliği/kalıcılığı, rapor içeren gerçek yedek/izole geri yükleme ve güncel bağımsız bilgisayar kopyası doğrulandı. Mevcut DB/Caddy/Doctus kimlikleri ve geri dönüş malzemesi korundu. Önceden kişisel kayıt yoktu; gerçek kayıt korunumu bu kullanıcıda uygulanamadı. Önceki hazırlık tarihli bölümler kendi tarihlerine aittir.

[Güncel hedefler](PROJECT_GOALS.md), [yayın/kurtarma kanıtı ve kabul sınırları](deploy/RELEASE_EVIDENCE.md), [geri dönüş rehberi](deploy/RELEASE.md). Önerilen sıradaki hedef **WW-03 — masaüstü ve en az bir gerçek telefonda temel kullanıcı akışları**; kısa tarayıcı kabulü bu kapsamı tamamlamaz. Yayın için kullanılan kaynak/arşiv değişmeden tutuldu; düzenli yedek ve kapasite bakımına devam edilir.

<!-- ww28-private-evidence-2026-11-02 -->
## Özgün stüdyo görselleri ile public kaynak sınırı — 2 Kasım 2026

Uygulamanın 30 optimize WebP'si `public/garments/studio/` ve kimlik/hash eşlemesi `lib/garment-studio-assets.ts` içinde kalır. Public `npm run check`, özgün PNG veya kabul kaydı gerektirmeden runtime kimliklerini, gerçek WebP çözümleme/şeffaflık/boyut/hash ve aktarım bütçesini doğrular. Kaynak CI, `artifacts/previews/` veya `evidence/ww21/` altında takip edilen dosya bulursa durur.

Özgün 30 PNG, manifest ve iki karşılaştırma HTML'i ayrı private `NOk-Weathrobe-Release/evidence/ww21/` alanındadır; SHA-256 envanteriyle korunur. Önizleme araçları bu ortak merkez yolunu varsayılan alır; başka yerel kanıt dizini için `NOK_STUDIO_EVIDENCE_ROOT` kullanılır. Eski yerel özgünler silinmedi, `artifacts/previews/` Git dışında bırakıldı. Üretim uygulaması bu özel dizini okumaz.

Private hedef deposunda `npm run test:evidence -- --source <Weathrobe-kaynak-dizini>` özgün/kabul/önizleme kontrollerini çalıştırır. Yeniden görsel hazırlama kabul edilmiş envanteri kendiliğinden yenilemez; değişiklik yeni görsel inceleme gerektirir. Ayrıntılı yerel hedef ve devir notları ayrıca gözden geçirilmeden public gönderime topluca eklenmez. Bu ayrımın yerel kontrolleri geçti; GitHub'a gönderim ve uzak koşu ayrı adımlardır.

# Weathrobe / Wear Weather — Güncel Geliştirme Devri

Son inceleme: **16 Ekim 2026**. Bu dosya mevcut kod ile hedefleri ayırır. Önceki şartname, mimari ve mobil kılavuz bölümleri korunmuştur; bu belgelerdeki eski “tamamlandı” ifadeleri güncel test kanıtı sayılmaz.

**Oturum içi güncelleme:** Kullanıcı avatar uygulama kapsamını onayladı. İlk gerçek 3D karakter/editör sürümü uygulandı; ayrıntılar ve sınırlar bölüm 8'de. Bölüm 4 araştırma ve tasarım hedeflerini, bölüm 5 önceki sürümün doğrulamasını da tarihsel bağlamıyla korur.

## 1. Çalışma ve belge güncelleme kuralları

- Kod değişikliğinden önce etkilenecek dosyaları ve sonucu özetle, kullanıcı onayı al. Verilmiş kapsam onayını tekrar isteme. Kullanıcı bildirim üzerinden onayı tercih ediyor.
- Kullanıcı 16 Ekim 2026'da proje Markdown belgelerinin gerektiğinde güncellenmesini istedi. Geliştirmelerle birlikte bu dosyadaki durum, açık işler ve doğrulama kayıtlarını güncelle.
- Mevcut Markdown bölümlerini kullanıcıdan habersiz silme veya kısaltma. Düzeltmeleri tarihli eklerle görünür tut; kapsamlı yeniden düzenlemeyi ayrıca onaya sun.
- Uygulanan özellik, tasarım önerisi, hedef ve doğrulanmamış iddiayı açıkça ayır. Yapılmamış avatar veya mağaza entegrasyonunu tamamlanmış gösterme.
- Kullanıcı istemeden commit, push, dağıtım veya dış hesap bağlantısı yapma.

## 2. Ürün ve tasarım kararları

- NOk bağımsız ekip; ürün adı Weathrobe / Wear Weather.
- Referanslar: [Orbyte](https://orbyte.studio/) genel estetik; [Seve](https://www.seve.app/) yalnızca kullanıcının beğendiği Creator kıyafet sunumu; Meta Horizon/VR avatar oluşturma deneyimi karakter kişiselleştirmesi için referans.
- Kompakt HMI: giysi görselleri ve kısa etiketler; ayrıntılar dokununca açılır.
- Rota, kıyafet kararından önce gelir. Tek CARTO/Leaflet haritası solda; rota ve kombin odağına göre alan paylaşımı değişir. 3D küre kullanılmaz. Bu kısıt avatarın 3D olmasına engel değildir.
- Hava paleti yalnız rota çizgisini değil sayfa, kart, kontrol ve vurgu renklerini etkiler; açık/koyu tema kontrastı korunur.
- Fotoğraf yüklemeden dolap/katalog kullanımı ve elle konum arama temel akışlardır. GPS kullanıcı eylemiyle istenir.
- Kıyafet segmentleri ülkeye göre sunulur; giysi profili gerçek mağaza stoğu veya doğrulanmış tekil ürün olarak gösterilmez.

## 3. Mevcut kodun durumu

| Alan | Mevcut uygulama | Sınır / açık iş |
| --- | --- | --- |
| Sayfa ve odak | `app/page.tsx`, `app/globals.css`: rota/kombin odağı, mobil App Preview | Fiziksel cihaz performansı ayrıca ölçülmeli. |
| Harita | `components/RealCityMap.tsx`: tek Leaflet haritası, durak ekle/sil, saat, konum arama, alan değişimine tepki | Gerçek OSRM çizgisi yalnız iki durakta kullanılıyor; 3+ durak kesikli doğrudan çizgilerle bağlanıyor. Çok duraklı karayolu geometrisi tamamlanmış değildir. |
| Hava | `lib/weather-service.ts`, `app/api/weather/route.ts`: çok kaynaklı veri akışı | Canlı kaynak kullanılabilirliği değişebilir; tüm kaynakların her konumda başarı garantisi yok. |
| Dil | `lib/i18n.tsx`, `lib/translations.ts`: TR/EN ve yerel dil tercihi | Yeni metinler iki dilde eklenmeli; kullanıcı metni otomatik çevrilmez. |
| Renk | `lib/weather-theme.ts`: 8 hava durumu, açık/koyu palet | Otomatik kontrast testleri mevcut; gerçek cihazda 60 FPS kanıtı yok. |
| NOk simgesi | `components/BrandMark.tsx`, `public/nok-logo-transparent.svg`: beyaz zemin SVG filtresiyle ayıklanır | Kaynak SVG raster görsel içeriyor. `public/nok-logo.svg` ve kullanıcının özgün dosyası korunuyor. |
| Çoklu eşleştirme | `components/OutfitRecommendation.tsx`, `lib/outfit-matching.ts` | Tıklama seçer/tekrar tıklama bırakır. Her kategori için son seçim giyilir; önceki seçimler alternatif kalır. Eksik kategoriler tamamlanır; kullanıcı seçimi sessizce değiştirilmez. |
| Avatar | `components/AvatarViewer.tsx`, `components/AvatarEditor.tsx`, `lib/avatar-profile.ts`: gerçek glTF model, görsel seçimler, döndürme, taslak/kayıt akışı | İlk 3D sürüm uygulandı. 2 temel model, 5 saç ve sakal; bağımsız yüz morph'ları yok. Giysiler temsili renk önizlemesi; ürünün dijital ikizi değil. Eski SVG dosyası tarihsel kaynak olarak duruyor, ana görünümde kullanılmıyor. |
| Kişisel konfor | `lib/comfort.ts`, `components/FeedbackModal.tsx`: yerel geri bildirim, termal ofset, parça bazlı düzeltme | Klinik/fiziksel kıyafet ölçümü değil; öneri kişiselleştirmesi. |
| Topluluk | `app/api/community/route.ts`, `lib/community-store.ts`: ayrı izinle barkod bazlı katkı pilotu | Dosya tabanlı tek sunucu pilotu; 30 farklı katılımcı belirteci ve istatistiksel eşik inceleme adayı üretir. Belirteçler doğrulanmış farklı insanlar değildir. Genel motor otomatik güncellenmez. |
| Barkod | `components/BarcodeAddPanel.tsx`, `lib/product-lookup.ts`, `app/api/product/route.ts`: kamera/elle giriş, EAN/UPC kontrolü, UPCitemdb araması | Ürün bulunması ve kumaş bilgisi garanti değil. Kumaş otomatik tahmin edilmez; etiket kullanıcı tarafından doğrulanır. Servis/kota hatasında elle devam edilir. |
| Katalog | `lib/clothing-catalog.ts`, `app/api/catalog/route.ts`, `components/WardrobeModal.tsx` | Mevcut katalog öneri profilleridir; canlı mağaza fiyatı, stok veya barkod kapsamı garantisi yok. |
| Mobil | App Preview, manifest, servis çalışanı ve Capacitor yapılandırma dosyası | APK/IPA üretimi, mağaza yayını ve eksiksiz çevrimdışı akış doğrulanmış değil. Ayrıntılar aşağıda. |

## 4. Avatar: Meta referansından uygulanabilir tasarıma

### Kullanıcının istediği deneyim

Kullanıcı Meta hesabıyla ilişkili olduğunu düşündüğü VR karakter oluşturucuyu beğendi; bağlantı vermesi gerekmiyor. Ana amaç, insanların kendilerine benzeyen veya eğlenceli bir maskot oluşturması. Mevcut SVG'ye birkaç seçenek eklemek bu beklentiyi karşılamıyor.

**Tasarım hedefi — kullanıcı bu oturumda uygulama kapsamını onayladı; ilk sürümün durumu bölüm 8'de:**

- Ortada yumuşak ışıkla sunulan, insani oranları ve okunur yüz ifadesi olan stilize 3D karakter.
- Vücut, ten, yüz, saç, sakal sekmeleri; açılır seçim listeleri yerine görsel küçük önizlemeler ve renk örnekleri.
- Ön/yan/arka görünüm ve dokunarak/fareyle döndürme. Saç/yüz düzenlerken başa yakınlaşma.
- İsteğe bağlı sade beyaz manken görünümü korunabilir. Varsayılan karakter ve görsel tarz kullanıcı tasarım onayıyla seçilmeli.
- Masaüstünde sahne yanında dar düzenleme paneli; mobilde karakter üstte, seçenekler erişilebilir alt panelde.
- Düzenleme taslağı: Kaydet uygular, Vazgeç önceki görünümü korur. Rastgele görünüm ve başlangıca dönme sonradan eklenebilir.
- Fotoğraf ve Meta hesabı gerektirmeyen yerel profil. Avatar verisi topluluk geri bildirimine dahil edilmez.

### Araştırma sonucu ve teknik tercih önerisi

16 Ekim 2026'da [Meta'nın resmi entegrasyon belgesi](https://developers.meta.com/vr/documentation/unity/meta-avatars-app-config/) incelendi. Meta Avatars SDK için uygulama kimliği, geliştirici hesabı ve Data Use Checkup gerekiyor. Belge SDK'nın End-of-Feature durumunda olduğunu, 40.0.1'in son sürüm olduğunu bildiriyor. Bu kaynak, mevcut Next.js web uygulamasına serbest model dışa aktarımı veya web editörü gömme desteğini doğrulamıyor. Meta'daki görsel deneyim ile Meta hesabından avatar aktarımı ayrı konulardır; ikincisi uygulanmış gibi sunulmamalı.

Araştırma sonucunda Meta'nın kişiselleştirme hissinden yararlanan NOk arayüzü ve lisansı açık 3D varlıklarla ilerleme kararı alındı. [Quaternius Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html) CC0 lisanslı, glTF destekli model/saç kaynağıdır. Uygulama onayından sonra ücretsiz Standard paketi indirildi ve dosyaları incelendi: iki temel gövde, beş saç ve sakal içeriyor; bağımsız yüz morph'ları yok. Source sürümünün özellikleri ücretsiz pakette var sayılmadı. Ücretli varlık alınmadı; onaylı Three/Fiber/Drei bağımlılıkları kuruldu. Ayrıntılı sonuç bölüm 8'de.

Uygulanan render altyapısı: Three.js + React Three Fiber'ın React 19 ile uyumlu v9 serisi; [resmi uyumluluk belgesi](https://r3f.docs.pmnd.rs/getting-started/introduction). 3D görüntüleyici istemcide gerektiğinde yüklenir. [İhtiyaç halinde render](https://r3f.docs.pmnd.rs/advanced/scaling-performance), sınırlı piksel oranı ve WebGL yokken sabit önizleme bulunur. 60 FPS bir test hedefidir; tüm cihazlar için garanti değildir.

### Model kabul ölçütleri

1. Varlık kaynağı, lisansı ve ücretsiz/ücretli kapsamı kaydedilmeli; Meta modeli izinsiz kopyalanmamalı.
2. Gerçek glTF/GLB sahnesi döndürülebilmeli; üretilmiş tek bir PNG “3D model” diye kullanılmamalı.
3. Gövde, saç, yüz ve kıyafetler aynı oran/iskelete uymalı. Varlıkta yüz morph'ları yoksa varmış gibi kaydırıcı sunulmamalı.
4. Kıyafet katmanları gövdeye uymalı ve iç içe geçme kontrol edilmeli. Genel bir model, dolaptaki tüm gerçek ürünlerin dijital ikizi sayılmaz.
5. Varlık kapsamı yetersizse önce uygun model/saç/kıyafet seti tamamlanmalı; basit geometrilerle kalite eksikliği gizlenmemeli.
6. Yerel profil doğrulanmalı ve mevcut `wear_weather_avatar_v1` tercihleri kaybolmadan taşınmalı. Veri temizleme, yeni profil sürümünü de kapsamalı.
7. Görsel konsept ayrı bir değerlendirme aracıdır; çalışır arayüz, 3D varlık veya bitmiş özellik kanıtı değildir.

Onaylanan kod kapsamı: `components/OutfitBoard.tsx`, mevcut mankenin yerini alan `components/AvatarViewer.tsx`, `components/AvatarEditor.tsx`, `lib/avatar-profile.ts`, `lib/translations.ts`, `lib/security.ts`, `app/globals.css`, `package.json`/kilit dosyası ve lisans kaydıyla `public/avatars/`. Paket incelemesi sonrasında doğrulanan ücretsiz varlık kapsamı bölüm 8'de kayıtlıdır.

## 5. Doğrulama kaydı

16 Ekim 2026, avatar yenilemesinden **önceki** mevcut sürüm:

- `node --test tests/outfit-matching.test.cjs tests/locale-theme.test.cjs`: 9 test başarılı sonucu verdi. Sandbox oturumu sonuçları verdikten sonra açık kaldığı için kapatıldı; temiz süreç çıkışı ayrıca doğrulanmış değildir.
- `next build`: başarılı; TypeScript kontrolü dahil. `next.config.ts` içindeki `ignoreDuringBuilds` nedeniyle lint bu doğrulamaya dahil değil.
- Tarayıcı: TR/EN, logo açık/koyu tema, farklı kategorilerden üçlü seçim, tekrar basınca bırakma, aynı kategori alternatifi ve önceki seçime dönüş, boş seçim, kaynak/kategori filtreleri kontrol edildi.
- App Preview 390 px çerçevede içerik yatay taşması görülmedi. Masaüstünde 1280 px ölçüde de taşma kontrol edildi. Bunlar fiziksel mobil cihaz testi değildir.
- Bu ilk kayıt sırasında uygulama kodu değiştirilmemişti; kullanıcı aynı oturumda daha sonra avatar değişikliğini onayladı. Sonraki uygulama/doğrulama kaydı bölüm 8'de.

Komutlar (Node/npm PATH üzerinde olmalı):

```powershell
npm install
npm run dev
node --test tests/outfit-matching.test.cjs tests/locale-theme.test.cjs
npm run build
```

Geliştirme sunucusu ile üretim derlemesini aynı `.next` dizinine eşzamanlı yazdırma. Önce sunucuyu durdur, derle, sonra tekrar başlat. Windows sandbox ortamında SWC yol erişim hatası olursa gerekli izinle aynı komutu tekrar çalıştır; kaynak kodu hatayı gizlemek için değiştirme.

## 6. Öncelikli açık işler

1. **Avatarın sonraki görsel turu:** ilk 3D editör uygulandı. Daha doğal/çeşitli oranlara sahip model setleri, yüz morph'ları ve gerçek giysi kalıpları için aynı iskeletle uyumlu lisanslı varlıklar değerlendirilmeli. Mevcut iki model paketin “Superhero” temel modelleridir; tam Meta editörü kapsamına ulaşıldığı iddia edilmemeli.
2. **3+ durak OSRM:** tüm durakları sırayla geçen gerçek yol geometrisi, mesafe/süre ve erişilemeyen güzergah durumları.
3. **Mobil paketleme:** `next.config.ts` standalone sunucu çıktısı üretirken `capacitor.config.json` `out` dizinini bekliyor. Capacitor paketleri mevcut `package.json` içinde yok. API sunucusu ve mobil istemci dağıtım yolu belirlenmeden APK/IPA hazır denmemeli.
4. **Çevrimdışı/gizlilik doğrulaması:** mevcut servis çalışanı API GET yanıtlarını önbellekliyor; tüm uygulama dosyalarının çevrimdışı çalıştığı kanıtlanmış değil. Konum anonimleştirmesini hava, geocode ve rota çağrılarında uçtan uca doğrula; “hiç konum paylaşılmaz” iddiasını genelleme. İstemciye açık harita anahtarı yaklaşımını gözden geçir; anahtar değerlerini belgelere kopyalama.
5. **Gerçek ürün verisi:** marka/mağaza anlaşmaları, veri kaynağı ve kumaş doğrulaması; mevcut profil kataloğuyla canlı ürün verisini ayır.
6. **Topluluk ölçekleme:** kalıcı veritabanı, çok örnekli sunucu, katılımcı güvenilirliği ve denetim süreci olmadan pilotu üretim ölçeği diye sunma.

## 7. Belge haritası

- [Ana şartname ve ilk devir](wear_weather_project_spec_and_handoff.md): kapsam ve uzun vadeli beklentiler.
- [Mimari ve eski yol haritası](ARCHITECTURE_AND_ROADMAP.md): önceki tasarım/mimari kayıtları; güncel durum bu dosyada.
- [Mobil kılavuz](MOBILE_APP_GUIDE.md): önceki kurulum taslağı ve güncel sınırlar eki.
- [Oracle dağıtım kılavuzu](ORACLE_CLOUD_DEPLOY_GUIDE.md): dağıtım planı; bu turda dağıtım yapılmadı.
- [README](README.md): tarihsel AI Studio başlangıcı ve güncel belge bağlantısı.

Her geliştirme turu sonunda: değişen davranış, ilgili dosyalar, çalıştırılan kontroller, kalan işler ve yeni kararlar aynı turda kaydedilmeli. Sadece hedef yazıp uygulama tamamlandı diye işaretlenmemeli.

## 8. Uygulanan gerçek 3D avatar — 16 Ekim 2026

Kullanıcı, bildirim üzerinden gerçek 3D avatar turunu açıkça onayladı. Bu bölüm yukarıdaki uygulama öncesi araştırma notlarının güncel sonucudur.

### Uygulananlar

- Three.js + React Three Fiber v9 + Drei ile istemcide dinamik yüklenen glTF sahnesi. Döndürme, Ön/Yan/Arka açıları; saç/sakal seçiminde başa yakınlaşma. Serbest döndürme başladıktan sonra hazır açı seçili gösterilmez.
- Quaternius **Universal Base Characters — Standard**, ücretsiz CC0 paketinden iki rig'li temel gövde, beş saç ve ayrı bir sakal modeli. Kaynak paket altı gövde/yirmi saçın tamamını ücretsiz sunmuyor; yalnız gerçekten indirilen varlıklar seçilebilir.
- İki temel karakterin yüzleri modele bağlı. Paket bağımsız yüz şekli morph hedefleri içermediği için sahte yüz kaydırıcıları eklenmedi.
- İnce/Dengeli/Geniş görünüm, altı ten tonu, altı saç/sakal renk örneği ve isteğe bağlı porselen görünüm. Genişlik seçenekleri modelin yatay ölçeğidir; beden ölçüsü veya medikal vücut modellemesi değildir.
- Gerçek 3D render'lardan üretilen yerel seçim görselleri. Üretilmiş konsept PNG'si model olarak kullanılmadı.
- Kaydet/Vazgeç ile ayrı düzenleme taslağı. `wear_weather_avatar_v2` yalnız Kaydet ile yazılır. Eski `wear_weather_avatar_v1` okunup uyumlu tercihler taşınır; eski kayıt silinmez veya üzerine yazılmaz. Dosya/URL alanları kullanıcı profilinden kabul edilmez.
- Depolama engelinde görünüm oturumda uygulanır ve kalıcı kaydın yapılamadığı bildirilir. Veri temizleme hem v1 hem v2 avatar tercihlerini kapsar.
- TR/EN, mobil editör düzeni, WebGL hata sınırı ve sabit model önizlemesi. Hareket yokken `frameloop="demand"`; cihaz piksel oranı en fazla 1.5. Cihazlarda 60 FPS ölçümü henüz yapılmadı.

### Giysi temsilinin sınırı

Gövdenin mevcut topolojisinden kesilip aynı iskelete bağlanan temsili üst/alt/ayakkabı yüzeyleri kullanılır; üstte seçili dış katmanın veya üst giysinin, altta seçili pantolonun ve ayakkabının rengi gösterilir. Bunlar her mağaza ürününün gerçek 3D kalıbı, kaban uzunluğu, kumaş dökümü veya beden provası değildir. Asıl önerilen giysiler çevredeki ayrı parça kartlarında gösterilmeye devam eder. Arayüz bunu “Giysi renk önizlemesi · kalıp simülasyonu değildir” diye açıklar. Sonraki aşama gerçek giysi mesh'leri ve daha çeşitli temel modellerdir.

### Varlık kaydı ve geliştirme dosyaları

- `public/avatars/source.json`: kaynak URL, indirme tarihi, kaynak ZIP SHA-256, ücretsiz kapsam ve yapılan uyarlamalar.
- `public/avatars/LICENSE-Quaternius.txt`: paketten gelen özgün CC0 bildirimi.
- `public/avatars/*.gltf`, `*.bin`, `*.webp`: yalnız kullanılan modeller ve sıkıştırılmış dokular. Tüm public avatar varlıkları, önizlemelerle birlikte yaklaşık **2.9 MB**.
- `.data/avatar-import/`: yerel/ignore edilen hazırlama ve render ara dosyaları; uygulama bunlara bağımlı değil.
- `components/AvatarViewer.tsx`: model, malzeme, rig pozu, topolojiden giysi renk yüzeyleri, saç hizalaması, kamera ve WebGL yedek görünümü.
- `components/AvatarEditor.tsx`: taslak düzenleme ve görsel seçenekler; `components/OutfitBoard.tsx`: kayıtlı görünüm ve öneri kartları.
- `lib/avatar-profile.ts`: sürümlü profil, doğrulama, eski tercihleri taşıma ve kayıt hatası yönetimi.
- `tests/avatar-profile.test.cjs`: eski tercihleri koruma, doğrulama, taslak/kayıt, bozuk/engelli depolama ve tüm yerel glTF kaynaklarının bütünlüğü.
- Bu turda npm ve `package-lock.json` kullanıldı; `bun.lock` yenilenmedi.

### Güncel otomatik doğrulama

`node --test tests/avatar-profile.test.cjs tests/outfit-matching.test.cjs tests/locale-theme.test.cjs`: **14/14 başarılı**, süreç başarı koduyla kapandı. Avatar paketindeki tüm buffer/doku referansları yerel dosyalara çözülüyor ve CC0 bildirimi mevcut. Üretim derlemesi ve son tarayıcı kontrolleri aşağıdaki kapanış kaydında belirtilir.

`npm audit` ayrıca kontrol edildi: **7 uyarı** (6 high, 1 moderate) mevcut Next/ESLint/PostCSS zincirinde raporlandı; yeni Three/Fiber/Drei paketleri listelenmiyor. Önerilen otomatik düzeltme ana sürüm değişiklikleri içeriyor; bu turda `audit fix --force` uygulanmadı. Ayrı bir uyumluluk/güvenlik bakım turunda ele alınmalı.

### Kapanış doğrulaması — 16 Ekim 2026

- Son mobil CSS değişikliğinden sonra `next build` **başarılı (exit 0)**; TypeScript kontrolü dahil. Lint, yapılandırma gereği derleme sırasında atlanıyor ve bu turda lint başarısı iddia edilmiyor.
- Avatar/eşleştirme/dil-renk testleri **14/14 başarılı (exit 0)**. Sonraki değişiklik yalnız mobil CSS idi; kaynak davranış testi tekrarını gerektiren yeni işlev değişikliği yapılmadı.
- Ayrı `127.0.0.1:3001` üretim önizlemesinde Karakter B taslağından Vazgeç'in Karakter A'yı koruması; B + uzun saç kaydının sayfa yenilenince kalması doğrulandı. Bu origin ana `127.0.0.1:3000` kullanıcı tercihlerinden ayrıdır.
- Son mobil düzen `localhost:3000` üzerinde, ana origin'den ayrı test edildi. 390 px genişlikte açık modalın içerik/scroll genişlikleri eşitti; karakter sahnesi ile Kaydet/Vazgeç aynı ekranda kaldı, yalnız seçenek alanı kayıyor. TR/EN, açık/koyu tema ve ten/porselen seçimi kontrol edildi. Tarayıcıda hata seviyesinde konsol kaydı görülmedi.
- Tarayıcı test sekmeleri ve ayrı üretim test sunucusu kapatıldı. Ana 3000 geliştirme önizlemesi yeniden açıldı; kullanıcı sayfası/taslağı zorla yeniden yüklenmedi.
- README, mimari, mobil kılavuz ve özgün şartnamenin mevcut içerikleri Git başlangıç kopyasına karşı doğrulandı: hiçbir eski bölüm silinmedi veya kısaltılmadı, yalnız tarihli ekler eklendi. Yerel belge bağlantıları ve `git diff --check` kontrolü başarılı.

## 9. Kaynaklı katalog / PostgreSQL temeli — 18 Ekim 2026

### Onaylanan kapsam ve uygulama

Kullanıcı 32 türün ve PostgreSQL altyapısının kurulmasını onayladı. 320–480 kaynaklı gerçek ürünün toplanması, dolap ekranının yeni ürün kartlarına geçişi ve Oracle canlı yayını sonraki aşamalardır; bu tur tamamlanmış sayılmazlar.

- `lib/catalog/taxonomy.ts`: sabit 32 tür, TR/EN adlar, eş anlamlar, temel vücut bölgeleri ve tür başına 10–15 farklı model hedefi. Elbise ayrı `one_piece`; aksesuarlar beş farklı türdür.
- `lib/catalog/model.ts` ve `validation.ts`: ürün/varyant/teklif/kaynak, bilinmeyenler için `null`, dış/astar/dolgu bileşimleri ve alan bazlı beyan/etiket/ölçüm/tahmin ayrımı. Lif yüzdeleri, UTC tarihler, GTIN, bağlantılar, referanslar ve yinelenen kimlikler kontrol edilir. Tam GTIN uydurulmaz; bilinmeyen barkod `null` kalır.
- `db/migrations/001_catalog.sql`: ilişkisel katalog, kaynaklar, varyantta tekil/checksum geçerli GTIN, tarihlenmiş teklifler, malzemeler, dayanaklar, taslaklar ve full-text indeksi. `scripts/catalog/migrate.ts` checksum/advisory lock/transaction kullanır; mevcut tohum satırlarını değiştirmez.
- `scripts/catalog/cli.ts`: doğrula, taslaklaştır, incele, açık `--reviewed` ile yayımla/reddet ve kapsam sayımı. Yayında çakışma eski ürünü ezmez, bütün işlem geri alınır. Kamuya açık yazma API'si eklenmedi.
- `lib/clothing-catalog.ts`: eski 23 profilin içeriği/kimliği korunur; `LEGACY_GARMENT_CATALOG` açık isim, eski export uyumluluk alias'ı. Bunlar gerçek katalog model sayısına girmez. Karışık şort/pantolon profili ve şemsiye tek bir yeni türe zorlanmadı.
- `/api/catalog`: eski arayüz için `results`; yeni gerçek ürünler için `products/sources/types/coverage`. Sayfalama ürünlere uygulanır. `tier` yalnız eski profilleri filtreler. Ülke, fiyat gözlemlerini seçer; fiyatı bilinmeyen model gizlenmez. DB yokken eski yerel kullanım devam eder, DB arızası başarılı boş sonuç gibi gösterilmez.
- `lib/types.ts`: isteğe bağlı tür/ürün/varyant referansları; eski localStorage kayıtlarına yazılmadı veya kayıt silinmedi. Kişisel dolap, konum ve avatar sunucu katalog tablolarına taşınmadı.
- `Dockerfile`, `.dockerignore`, Compose ve `deploy/Caddyfile`: Node 24, PostgreSQL 17, ayrı geçiş/yönetim aracı, web için salt okuma hesabı, yalnız loopback uygulama portu, isteğe bağlı HTTPS. Sırlar imaja dahil edilmez. Ayrıntılar `db/README.md`.
- `catalog:setup`: mevcut `.env` dosyasını korur, yalnız yeni dosyada iki farklı parola üretir. `catalog:backup`: binary custom dump, atomik dosya tamamlama ve hatada partial temizliği; bağımsız depoya kopyalama/zamanlama ayrıca kurulur. Topluluk pilot verisi dump'a dahil değildir.

### Mevcut sınırlar

Bu aşamada gerçek ürün toplanmadı. Test fixture'ı yalnız atılabilir test veritabanındadır ve ürün hedefini doldurmaz. Eski dolap ekranı hâlâ 23 profili gösterir; 32 tür API/veri modelinde hazırdır. Elbise ve birden fazla aksesuarın öneri/giydirme kuralları henüz uygulanmadı. Güncel fiyat yenileme, yayımlanmış ürün düzeltme, yönetim paneli, hesap/senkronizasyon ve topluluk DB geçişi ayrı işlerdir.

Oracle hesabında kaynak oluşturulmadı; gerçek ARM sunucusu, DNS/TLS, kullanım kapasitesi ve kesinti sonrası kurtarma ayrıca doğrulanmalıdır. Mevcut 7 npm güvenlik uyarısı otomatik ana sürüm değişikliğiyle giderilmedi. `bun.lock` yenilenmedi; bu turun paket kaynağı npm kilit dosyasıdır.

### Doğrulama kaydı

- 30 katalog/avatar/eşleştirme/dil/hava/konfor/barkod testi başarılı (exit 0).
- Gerçek PostgreSQL 17 üzerinde ayrı loopback test DB'si ile şema/tohum idempotansı, taslak gizliliği, yayın, GTIN araması, kaynak/fiyat alanları, çift barkodda rollback, salt okuma hesabı, fallback ve açık hata durumu doğrulandı (exit 0).
- TypeScript `tsc --noEmit --incremental false` başarılı.
- Docker Compose yapılandırma doğrulaması başarılı. Docker üretim imajı, yedek geri yükleme ve API kapanış sonuçları sonraki kayıtta belirtilecektir.
- Testlerin ilk sandbox koşusunda temp rename `EPERM` ve loopback DB bağlantısı `EACCES` ile engellendi; aynı kontroller gerekli izinle yeniden çalıştırılıp geçti. Program Files Node komutları sandbox'ta ilerlemediği için doğrulamada paketli Node 24 çalışma zamanı kullanıldı.

### Katalog kapanış doğrulaması — 18 Ekim 2026

- Son üretim Docker imajı Node **24.22.0** ile derlendi, exit 0. Next.js 15.5.28 üretim derlemesi ve TypeScript kontrolü başarılı. İlk Node 22 imajındaki barkod bağımlılığı engine uyarısı üzerine Docker tabanı ve package engines Node 24'e yükseltildi. ARM imajı ayrıca derlenmedi/test edilmedi.
- `lib/catalog`, `scripts/catalog`, katalog route'u ve PostgreSQL entegrasyon test dosyası için hedefli ESLint kontrolü başarılı (exit 0). Bu tüm eski proje dosyalarının lint başarısı anlamına gelmez; Next build lint'i yapılandırma gereği atlıyor.
- `weathrobe-catalog-tools:qa` imajı üretildi; geri yüklenen test DB'sinde `npm run db:migrate` başarılı, mevcut tür ve profil kayıtları korundu.
- Yedekleme betiği gerçek PostgreSQL test konteynerinden custom dump oluşturdu. Binary akışla boş `weathrobe_restore_check` DB'sine `pg_restore --single-transaction --exit-on-error` başarılı; son sayımlar **32 tür / 23 legacy profil / 1 sentetik test ürünü**. Sentetik ürün üretim kataloğuna eklenmedi.
- Ayrı 3002 loopback portunda üretim konteyneri, salt okuma hesabıyla açıldı: ana sayfa HTTP 200; katalog HTTP 200, 32 tür ve PostgreSQL backend. Türkçe arama, null GSM, TR fiyatı, GB için boş fiyat listesi; geçersiz sayfa boyutunda HTTP 400 ve POST için HTTP 405 doğrulandı.
- Caddy yapılandırması container içinde geçerli bulundu. DNS, gerçek sertifika, Oracle hesabı ve canlı trafik sınanmadı.
- Kapanışta yalnız bu iş için oluşturulan `weathrobe-catalog-web-qa` ve `weathrobe-catalog-test-20261018` konteynerleri başarıyla durduruldu (exit 0).
- Kurulum betiği geçici dizinde yeni `.env` oluşturdu; ikinci çalıştırma mevcut dosyayı değiştirmeden reddedildi. Çalışma alanındaki gerçek `.env` dosyasına yazılmadı.
- README/mimari/mobil kılavuz/özgün şartname diff'lerinde eski içerik silinmesi yok; yalnız ekler var. Bu tur mobil kılavuz/özgün şartnameye yeni değişiklik yapılmadı, önceki ekleri korundu. Geçici web ve PostgreSQL test konteynerleri kapanışta durdurulur; ana 3000 sayfası/taslağı yeniden yüklenmez. Commit/push/canlı yayın yapılmadı.

## 10. İlk kaynaklı gerçek ürün grubu — 18 Ekim 2026

### Kullanıcı onayı ve kapsam

Kullanıcı `db/imports/` altında kısa kollu tişört türü için 10–15 farklı kaynaklı modelin hazırlanmasını, `tests/catalog-data.test.cjs` kalite kontrolünü ve README/devir belgelerinin eklerle güncellenmesini onayladı. Oracle ödeme/hesap aşaması beklenmeden yerelde devam edildi. Bu tur yalnız veri ve doğrulamadır; UI, uygulama kodu, gerçek `.env`, Oracle hesabı ve canlı yayın değiştirilmedi.

### Hazırlanan kayıtlar

- `db/imports/short-sleeve-tees.tr.2026-10-18.json`: **10 farklı model ve 10 kaynak**. DOMYOS 332540 / 338648, QUECHUA 349961, KIPRUN 355949 / 340992, NORFOLK RAGNAR, LCW EVERYDAY 0S2159Z8, M&S Collection T41002101C / T41007738 ve Autograph T28004960A.
- Tüm modellerde ana kumaş bileşimi kaynaklı. DOMYOS 332540 ve 338648 için 190 g/m², NORFOLK için 150 g/m² açık sayfa beyanı var. Diğer GSM alanları boş; ürünün gram/kg ağırlığından hesaplanmadı.
- Yaka/ribana ve örgü eklerinin farklı bileşimleri ana kumaşa katılmadı, kaynak notlarına yazıldı. Tek `-unresolved` referansın GTIN/beden/renk/SKU alanları `null`; barkod, varyant veya fiyat uydurulmadı. Teknik özellikler/ısı puanı bilinmiyor; `offers` boş.
- KIPRUN iki ayrı model kimliği ve farklı bileşimi nedeniyle iki modeldir; renk çoğaltması değildir. Benzer ad/URL altında farklı kesim veya renk gösteren sayfalardaki belirsizlikler `evidence.note` ve kaynak notlarında açıkça yazılıdır.
- `db/imports/README.md`: model/kumaş/kaynak tablosu, 3 GSM beyanı, oturum tarihinin UTC/TR anlamı, varyant sınırları ve dışarıda bırakılan adaylar. Veri kaynağı resmî sayfa metni/önbelleğidir; fiziksel laboratuvar veya etiket doğrulaması değildir. NORFOLK kaynağı pazaryeri satıcı beyanı olarak ayrılır.
- Bazı LCW/M&S adaylarında tutarlı ürün detayı alınamadı veya yalnız arama özeti görüldü; bunlarla sayı tamamlanmadı. KIPRUN 145864 kategoriye yönlendi, KALENJI 330591 uzun kollu ürün sundu; bu gruptan çıkarıldı.

### Doğrulama ve yayın durumu

- Mevcut `catalog validate` komutu JSON'u **10 ürünle geçerli** buldu (exit 0).
- `tests/catalog-data.test.cjs`: **6/6 başarılı**, gerçek PostgreSQL testi atlanmadı. Ayrı 55441 loopback portunda atılabilir `weathrobe_catalog_data_test` DB'si kullanıldı. Doğrulama ve benzersiz model sayısı, kaynak/bileşim eşleşmeleri, yalnız açık GSM'lerin tutulması, bilinmeyenler ve trim ayrımı kontrol edildi.
- DB tarafında geçiş/tohum iki kez çalıştırıldı; grup taslaklaştırıldı, tekrar taslaklaştırmanın aynı kimliği vermesi ve yayın öncesinde aramada görünmemesi kontrol edildi. Yalnız test DB'sinde yayımlanıp **10 model / 10 kaynak** olarak geri okundu; bileşimler/null alanlar, merino/keten araması, sayfalama, ilk türde 10 ve diğer 31 türde 0 kapsam, 23 eski profilin korunması doğrulandı.
- Bu test yayını gerçek siteye aktarım değildir. Kaynaklı JSON grubu dosyalarda hazır; dolap ekranı hâlâ eski profilleri kullanır. 320–480 toplam hedefin kalan 31 türü ve gerçek ürün UI bağlantısı sonraki aşamadır. Bu veri turu çalışır uygulama kodunu değiştirmediği için üretim derlemesi tekrar edilmedi.
- Mevcut Markdown bölümleri korundu; yalnız tarihli ekler eklendi. Test konteynerinin kapanış ve son dosya kontrolleri aşağıdaki kapanış kaydında belirtilir.

### Veri grubu kapanışı

- Yeni `tests/catalog-data.test.cjs` için hedefli ESLint kontrolü başarılı (exit 0).
- On ürünün kimliği ve kaynak bağlantısı kaynak tablosuyla eşleşiyor; README yerel belge bağlantısı ve `git diff --check` doğrulandı. Mevcut README içeriği silinmedi.
- Yalnız bu tur için oluşturulan `weathrobe-shirt-data-qa-20261018` PostgreSQL konteyneri durduruldu (exit 0). Hazırlanan JSON ve kaynak notları dosyalarda duruyor; üretim veya kalıcı uygulama DB'sine aktarılmadı. Ana geliştirme sayfası yeniden yüklenmedi.

## 11. Kaynaklı ürünlerin kalıcı yerel uygulamaya aktarımı — 18 Ekim 2026

Kullanıcı, uygulamayı koruyarak gerçek ürünleri aktarıp birlikte incelemek istediğini açıkça belirtti. Önceki veri turunun yalnız-test kapsamı bu sonraki onayla yerel uygulamaya genişletildi. Önceki bölümler tarihsel kayıt olarak korunur.

### Uygulanan bağlantı

- `docker-compose.local.yml`: yalnız host geliştirmesi için `127.0.0.1:55442` PostgreSQL portu. Compose projesi `weathrobe-local`, konteyner `weathrobe-local-db-1`, kalıcı volume `weathrobe-local_postgres_data`. Oracle/uzak sunucu açılmadı.
- `scripts/catalog/activate-local.ts` ve `npm run catalog:local`: güvenli ilk `.env` kurulumu, farklı bağlantıyı ezmeme, DB'yi başlatma, geçiş, açıkça seçili incelenmiş 10 ürün grubunu taslaklaştırma/yayımlama. Uygulama veya migrasyon başlangıcında kendiliğinden ürün yayımlanmaz. Tekrar çalıştırınca mevcut yayın korunur. Uygulama `.env` üzerinden salt okuma hesabına bağlanır; yönetici bağlantısı yalnız komut sürecindedir. Sırlar Git'e/imaja dahil edilmez ve yazdırılmaz.
- `components/WardrobeModal.tsx`: varsayılan Gerçek ürünler görünümü; TR/EN ürün/kumaş/marka araması, 32 tür ve kapsam sayıları, kategori ve sayfalama. Eski 23 profil Örnek profiller görünümünde tutulur. Açık bağlantı hatası ve yeniden deneme/örnek profil seçeneği vardır; gecikmiş yanıtlar yeni filtreyi ezemez.
- `components/CatalogProductCard.tsx`: gerçek model/marka/ürün adı, kaynaklı ana kumaş yüzdeleri, yalnız bilinen GSM, açılır kaynak/teknik belirsizlik ayrıntıları ve özgün ürün sayfası. Mevcut `GarmentVisual` yalnız görsel alanlarla kullanılır; sahte performans alanı üretilmez. Temsili renk/kesim açıkça belirtilir.
- `app/globals.css`, `lib/translations.ts`: ortak tasarıma uygun kartlar/katalog seçimleri ve TR/EN metinler. Mevcut dolap/konum/avatar kayıtları değişmedi. Kaynak JSON'u ve ürün gerçekleri bu tur değiştirilmedi.

### Doğrulama ve açık kalan sınırlar

- Yerel kurulum iki kez başarılı (exit 0). İkinci çalıştırmada konteyner yeniden oluşturulmasına rağmen yayın/volume korundu; **10 ürün / 32 tür / 23 legacy profil** SQL ile doğrulandı.
- Gerçek uygulama `127.0.0.1:3000` üzerinde API'den 10 ürün gösteriyor. Türkçe keten → 1 M&S modeli, İngilizce merino → 1 NORFOLK modeli; kaynak ayrıntısındaki bilinmeyen ısı/su koruması ve kontrol tarihi doğrulandı. Boş uzun kollu türü gerçek boş sonuç gösterir. Eski profillere geçişte 23 kart ve eski ekleme akışı görünür kaldı; kullanıcı dolabına test ürünü eklenmedi.
- Dar ekran kontrolünde etkin DOM genişliği 337 px idi (istenen viewport 390×844, araç ekran ölçeklemesi); belge ve modal içeriğinde yatay taşma görülmedi. Sekmeler kendi yatay kaydırma alanında. Boyut geçersiz kılması test sonunda sıfırlandı; önceki EN tercihi geri yüklendi.
- Hedefli ESLint: yeni kart/etkinleştirme betiği ve dolap bileşeni için hata yok; dolap bileşeninin mevcut isteğe bağlı AI fotoğraf bölümünde 1 eski `img` uyarısı var. Tüm repo lint başarısı iddia edilmez.
- `docker build --target runner -t weathrobe-catalog:qa .`: **exit 0**, Next.js 15.5.28 üretim derlemesi ve TypeScript kontrolü başarılı. Build lint'i mevcut yapılandırma gereği atlar. Host sandbox'taki ayrı tsc süreci ilerlemediği için sonlandırıldı; başarılı tip kontrolü Docker üretim derlemesidir. Önceden bilinen 7 npm güvenlik uyarısı bu tur sürüm zorlamasıyla değiştirilmedi.
- `scripts/catalog/backup.mjs --container weathrobe-local-db-1`: binary custom dump başarılı; `.data/backups/catalog-2026-10-17T23-33-21-088Z-8c38a84e.dump`. Bu yeni yedek için geri yükleme tekrar denenmedi; önceki altyapı turunun geri yükleme testi ayrı kanıttır. Bağımsız depolama/zamanlama kurulmadı.
- **Bu UI ürün inceleme aşamasıdır:** gerçek ürünleri dolaba ekleme ve öneri motorunda kullanma henüz uygulanmadı. Null performans değerleri eski zorunlu puanlara çevrilmez. Fiyat/stok, doğrulanmış beden/barkod/renk ve diğer 31 türün ürünleri hâlâ eksik. Eski profillerin dolaba eklenmesi korunur.
- Kalıcı yerel DB ve ana geliştirme sunucusu kullanıcı incelemesi için çalışır bırakılır; bunlar atılabilir QA konteynerleri gibi durdurulmaz. Kapanışta katalog sekmesi açık bırakılır. README, DB kılavuzu ve kaynak notlarına ekler yazıldı; commit/push/canlı yayın yapılmadı.
- Kapanış tarayıcı kontrolünde hata seviyesinde konsol kaydı yoktu. Önizleme Gerçek ürünler görünümünde açık bırakıldı; ekran görüntüsü `real-catalog-local.jpg` olarak görev görselleştirme dizinine kaydedildi. Mimari yol haritasına da bu bağlantıyı ve devam eden sınırları belirten tarihli ek yazıldı.

## 12. Gerçek ürünlerin dolap ve öneri entegrasyonu — 18 Ekim 2026

### Onaylanan kapsam ve veri sınırı

Kullanıcı kaynakları/görselleri sordu ve entegrasyonun sürmesini istedi; dosya kapsamını bildirim üzerinden onayladı. Ortak nullable ısı tipinin Barkod/Manuel ekranında gerektirdiği `NonNullable` uyarlaması da ayrıca onaylandı. Ürün JSON'u, kaynak gerçekleri ve kalıcı PostgreSQL şeması değişmedi; kişisel dolap sunucuya taşınmadı. Önceki bölümdeki yalnız-inceleme sınırı bu yeni tur öncesinin kaydıdır.

- `lib/catalog-wardrobe.ts`: TR/EN kumaş metni, canonical ürün → yerel dolap adaptörü, güvenli 1–5 ısı okuması ve hava sıralamasına uygunluk. Kaynaklı null ısı/su/rüzgâr ve bilinmeyen fiyat segmenti korunur. `catalogFacts`, `catalogEvidence`, `catalogSources` bağımsız snapshot'tır. Renk bilinmiyorsa çizim rengi yalnız temsilidir; renk/termal bonusu kazanmaz.
- `lib/types.ts`: nullable teknik alanlar/segment, `catalog` veri kaynağı, TR/EN ad/kumaş ve ayrı `personalWarmth`. Kişisel tahmin kaynak gerçeğini veya PostgreSQL ürününü değiştirmez. Eski kayıtlar mevcut biçimleriyle geçerlidir.
- `CatalogProductCard.tsx`, `WardrobeModal.tsx`: Dolabıma ekle / Dolabında, yinelenen model kaydını önleme, kaynaklı kişisel kart, isteğe bağlı ısı tahminini değiştirme/temizleme ve depolama hatası bildirimi. Çözümlenmemiş varyant gerçek barkod/beden/SKU olarak atanmaz. Mevcut altı slota uymayan `one_piece` açıkça eklenemez; elbise tişörte çevrilmez.
- `wardrobe-storage.ts`, `comfort.ts`, `outfit-matching.ts`: ısı bilgisi olmayan ürün otomatik sıralama/alternatif seçimine girmez; elle sabitlenmiş seçim korunur. Yağışta dış giyim/ayakkabıda bilinmeyen su koruması ve kuvvetli rüzgârda dış giyimde bilinmeyen rüzgâr koruması, kişisel ısı tahminiyle aşılmaz. Feedback kimliği ürün/varyanta bağlıdır; eski GTIN ve legacy katalog kimlikleri korunur. Ürün kimliği topluluk paylaşımına otomatik izin vermez; mevcut GTIN sınırı sürer.
- `OutfitRecommendation.tsx`, `i18n.tsx`, `translations.ts`, `globals.css`: TR/EN gerçek ürün adı/kumaşı, kaynak/kişisel tahmin ayrımı, belirsizlik ve otomatik seçilmeme notu, ortak tasarımda kontroller. Elle seçilmiş eksik verili ürün için hava uygunluğu doğrulandığı iddia edilmez.
- `app/api/ai-stylist/route.ts`: eksik teknik verili ürünler otomatik/AI gardırop girdisinden filtrelenir; kişisel tahmin açıkça adlandırılır. Kumaş bileşiminden koruma uydurulmaması talimatı eklenir. Dış AI çağrısı bu doğrulamada yapılmadı; deterministik kod/tip kontrolü ve yerel arayüz sınandı.
- `BarcodeAddPanel.tsx`: 1–5 yerel seçicinin state ve cast tipi nullable ortak tipten ayrıldı; kullanıcı akışı değişmedi.

### Kaynak ve fotoğraf değerlendirmesi

10 modelin 6'sı Decathlon Türkiye'den (5 kendi markası + 1 NORFOLK pazaryeri satıcı beyanı), 1'i LCW, 3'ü M&S Türkiye'dendir. Ürün sayfaları incelenerek hazırlanmış veri grubudur; canlı/ücretsiz API entegrasyonu değildir. LCW ve Decathlon Türkiye içerik koşulları incelendi; mevcut fotoğraflar için yeniden yayın izni doğrulanmadı, görsel indirilmedi/gömülmedi. Decathlon UK resmî affiliate sayfası onaylı ortaklara görsel materyal ve ürün akışı sunduğunu belirtiyor; Türkiye/uygulamamız için erişim veya izin anlamına gelmez. M&S Türkiye açık görsel lisansı doğrulanamadı. Kaynak notlarına bağlantılar ve ileriye dönük izin/varyant/medya metadata gereksinimleri eklendi; medya altyapısı uygulandı iddiası yoktur.

### Doğrulama

- `tests/catalog-wardrobe.test.cjs` 7 yeni kontrol + mevcut eşleştirme/konfor/barkod/dil/hava testleri: **24/24 başarılı**, atlanan test yok. On ürünün snapshot/null/bilingual aktarımı, depolama/dedup, kişisel tahminle sıralama, elle sabitleme, eksik yağmur/rüzgâr koruması, ürün kimliğiyle geri bildirim ve topluluk paylaşım sınırı doğrulandı. İlk koşuda bir fixture eşit puanlı eski termal içlikle yarışıyordu; beklenti anlamlı karşılaştırmayla düzeltildi. Topluluk dosya testinin sandbox temp rename EPERM engeli gerekli izinle yeniden çalıştırılarak aşıldı.
- `tsc --noEmit --incremental false`: **exit 0**. İlk kontrol nullable ısıya bağlı Barkod/Manuel uyarlamasını ve yinelenen sözlük anahtarını yakaladı; ikisi düzeltildi.
- Son kodla `docker build --target runner -t weathrobe-catalog:qa .`: **exit 0**, Next.js 15.5.28 üretim derlemesi ve tip kontrolü başarılı. Build lint'i mevcut yapılandırma gereği atlar.
- Adaptör, depolama, konfor, eşleştirme, tipler/sözlük, ürün kartı, dolap, barkod ve yeni test dosyasında hedefli ESLint: **0 hata, 1 eski AI fotoğrafı img uyarısı**. OutfitRecommendation ve i18n tam lint'inde önceki `react-hooks/set-state-in-effect` hataları ve feedback yenileme bağımlılık uyarıları sürüyor; bu tur tüm repo lint başarısı iddia edilmez.
- Ayrı `http://localhost:3000` origin'inde UI testi yapıldı; ana `127.0.0.1:3000` dolabı değiştirilmedi. Gerçek ürün ekleme → 11 kayıt, Dolabında düğmesinin devre dışı kalması, kişisel ısı tahmini, sayfa yenilemesinden sonra ürün/tahminin korunması, tahmin temizlenince otomatik seçimden çıkarma, Eşleştir'de elle tutma + belirsizlik, tahmin girilince Dolabımdan seçimi, TR/EN ad/kumaş ve kaynak ayrıntıları doğrulandı.
- 390×844 dar ekran kontrolünde belge genişliği 390, modal client/scroll genişlikleri 336/336, seçici 122/122 idi; yatay taşma görülmedi. Viewport geçersiz kılması sıfırlandı. Yalnız eklenen test kaydı temizlenip test dolabı tekrar 10 oldu ve test sekmesi kapatıldı. Silme düğmesinin araçla pointer tıklaması sonrası sonuç alınamadığında klavye Enter ile başarılı silme doğrulandı; toplu sıfırlama yapılmadı.
- Test sekmesinde hata seviyesinde konsol kaydı yoktu; 3D karakter yer yer mevcut statik fallback'i gösterdi. Bu tur avatar/WebGL başarısı iddia edilmez.
- `catalog-wardrobe-integration.jpg` görev görselleştirme dizinine kaydedildi. Ana sekme gerçek katalog ve yeni ekleme düğmeleriyle açık bırakıldı; mevcut kişisel 10 kayıt korundu. Yerel DB/geliştirme sunucusu çalışır durumda; Oracle/commit/push/canlı yayın yapılmadı.

### Devam eden işler

Kalan 31 türün verileri, tek-parça slot kuralları, gerçek varyant/GTIN/renk ve fiyat/stok doğrulaması, ölçülmüş teknik performans, ürün kimliğiyle izinli topluluk toplulaştırma ve lisanslı görsel/mağaza akışı henüz tamamlanmadı. Kişisel ısı tahmini bu eksikleri doğrulanmış ürün gerçeğine dönüştürmez. Markdown bölümleri kısaltılmadan yeni tarihli kayıtlar eklendi.

## 13. Kaynak genişletme ve bekleyen erişimler — 18 Ekim 2026

### Kullanıcı onayı ve uygulama

Kullanıcı bütün kaynakları incelemeyi, alınabilen güvenilir bilgileri almayı ve diğerlerini gelecek iş olarak kaydetmeyi istedi. db/imports, db/sources, yerel aktarım betiği, kaynak/veri testleri ve eklemeli proje belgeleri için kapsamı onayladı. Hesap açma/ücretli hizmet/mesaj gönderme yapılmadı; medya izni varmış gibi işaretlenmedi.

- `db/imports/multi-source-tees.2026-10-18.json`: **14 yeni farklı model / 14 kaynak**. DeFacto 2, Koton 4, Mavi 4, Stanley/Stella 4. Yeni modellerin 4'ü kısa, 10'u uzun kolludur. Eski grup değiştirilmedi; toplam **24 model**, kısa kollu 14 / uzun kollu 10. İlk iki türde 10–15 hedefi sağlanır; kalan **30 tür** boştur.
- Ana kumaş bileşimi tüm yeni modellerde resmî ürün sayfası/araç önbelleği beyanına dayanır. Yalnız STTU169 180, STTU200 240, STTM558 200 ve STTW219 180 g/m² açık GSM'leri eklendi; eski üç GSM ile toplam 7 model. Teknik performans/fiyat/stok/GTIN/beden/renk/SKU üretilmedi. Koton sayfa telemetrisindeki barkod ve fiyatlar doğrulanmış varyant sayılmadı. Çocuk ürünleri, renk veya ülke sayfalarıyla model sayısı çoğaltılmadı.
- Mavi 065755 antrasit açıklaması %100 pamuk, yüzdeleri 50/50 pamuk-polyester olduğu için dışarıda; siyah aynı model yalnız kendi tutarlı %100 pamuk gözlemine dayanır. 1613048 çoklu kumaş kapsamı, Koton 5WAL10542IK ikili/paket kapsamı ve Stanley STTU199 erişimi ayrıca bekleyen adaylar olarak kaydedildi. Eski/outlet/0 renk kayıtları canlı satış iddiası taşımaz.
- `db/sources/registry.json` + README: **13 sağlayıcı**, 7'si katalogda kullanılan veri kaynağı, 6'sı gelecekte erişim/doğrulama işi. Her birinde kapsam, resmi referans, medya durumu, gerekli koşul ve yeniden ele alma adımı var. İlk gruptaki Decathlon/LCW/M&S de bu takipte tutulur.
- `db/sources/printful-probe.2026-10-18.json`: anahtarsız API GET'i HTTP 200; listede **571 kayıt** gözlendi (hepsi kıyafet değildir). Bella + Canvas 3501 (356) ve Gildan 2400 (57) gerçek model/varyant kumaş alanları alındı. Örneğin 3501 White ve Athletic Heather farklı lif yüzdeleri taşıyor. İki model araştırma kaydıdır, 24 model hedefine veya yayın listesine dahil değildir. Görsel URL'si/ürün marketing paragrafları/fiyat snapshot'a kopyalanmadı; yalnız görsel referansı bulunduğu boolean olarak tutuldu.
- Printful genel uygulama/API ve medya kapsamı metni tam doğrulanamadığından otomatik bağdaştırıcı/yayın geleceğe kaydedildi. Awin yayıncı + marka onayı; GS1 üye kuruluş/API/yeniden kullanım; adidas güncel kumaş ayrıntısı; Trendyol/Hepsiburada merchant/partner yetkisi ayrı bekleyenlerdir. Belirli Türk markalarının Awin'e dahil olduğu veya API'lerin ücretsiz genel katalog sunduğu varsayılmadı. Hesap, sözleşme, ücret veya barkod sorgusu yapılmadı.
- `db/imports/local-approved.json`: eski 10 ve yeni 14 ürün grubunun açık inceleme listesi. `scripts/catalog/activate-local.ts` bu listeyi baştan doğrular (sürüm/dosya yolu/tekrar/tarih/sayı/import şeması); yalnız listelenen grupları mevcut transaction/hash idempotansıyla yayımlar. Dizin glob'u veya aday/probe yayını yoktur. Liste reviewedAt alanı bu oturumdaki liste incelemesidir, eski ürün kaynaklarını yeniden tarama tarihi değildir.
- README, DB kılavuzu, import kaynak notları ve mimari yol haritası mevcut bölümleri korunarak eklerle güncellendi. Bu tur UI kodu, kişisel dolap, kaynak JSON'larının eski gözlemleri, bağımlılıklar veya DB şeması değiştirilmedi.

### Doğrulama ve yerel yayın

- `tests/catalog-sources.test.cjs`: **6/6 başarılı**, atlanan test yok. Açık manifest/global model ve kaynak benzersizliği, 24 ürünün kalite sınırları, dört yeni sağlayıcı ve açık GSM, null teknik/veri alanları, gelecek kaynakların yayın dışı kalması ve Printful varyant reçeteleri kontrol edildi.
- Ayrı `127.0.0.1:55443/weathrobe_source_test` DB'sinde gerçek PostgreSQL roundtrip: iki grubun taslak/yayın idempotansı, 24 ürün/24 kaynak geri okuma, bileşimler, Mavi araması 4, uzun kollu 10, ikinci sayfa 12, 32 tür içinde 2 dolu tür ve 23 legacy profil doğrulandı. Yalnız bu iş için oluşturulan `weathrobe-sources-qa-20261018` test konteyneri durduruldu (exit 0); kalıcı DB durdurulmadı.
- Yeni test dosyası ve yerel aktarım betiği için hedefli ESLint **exit 0**. `tsc --noEmit --incremental false` **exit 0**. UI üretim kodu değişmediği için bu veri turunda üretim imajı yeniden derlenmedi; önceki turun derleme kanıtı ayrı tutulur.
- Yeni yayından önce kalıcı DB yedeği alındı: `.data/backups/catalog-2026-10-18T00-06-12-916Z-a6340b45.dump`. Bu yedekte önceki 10 ürün vardır. Yeni dump için geri yükleme tekrar denenmedi; bağımsız depo/zamanlama kurulmadı.
- Güncellenmiş `catalog:local` ilk çalıştırmada **14 yeni ürün** yayımladı. İkinci çalıştırmada **Existing publications preserved**; ürün çoğalması yok. Kalıcı SQL sayımı **24 ürün / 24 kaynak / 32 tür / 23 legacy profil**.
- Ana uygulama tarayıcısında Mavi araması 4; bütün katalog 24; iki sayfada 12+12 kart ve aralarında 0 ortak ürün kimliği; uzun kollu filtresi 10 doğrulandı. Kullanıcının kişisel dolabı 10 kayıt olarak korundu; test ürünü eklenmedi/silinmedi. EN tercihi değiştirilmedi. Kaynaklı 180/240 g/m² yeni kartları görüntülendi; hata seviyesinde tarayıcı konsol kaydı yoktu.
- `catalog-source-expansion.jpg` görev görselleştirme dizinine kaydedildi. Ana katalog uzun kollu filtresiyle incelemeye açık bırakıldı; yerel geliştirme sunucusu ve kalıcı DB çalışır durumda. Oracle/commit/push/canlı yayın yapılmadı.
- Printful ilk ağ denemesi sandbox DNS hatasıyla engellendi; aynı salt okuma işlemi gerekli izinle başarıyla tekrarlandı. Web aracında eksik gelen koşul/sayfa içerikleri erişilmiş/lisanslanmış gibi raporlanmadı.

### Sonraki adımlar

Yeni ürün türlerini doldururken kalan 30 türü önceliklendirin. Her sağlayıcının bekleyen erişim/medya adımı `db/sources/registry.json` içinde koşullu iş olarak saklıdır; erişim değişince kanıtını ve ilgili testleri güncelleyin. Fiyat segmenti, termal performans veya fotoğrafı bulunmayan alanlar sayıyı tamamlamak için tahminle doldurulmaz. Eski belge bölümleri tarihsel kapsamıyla korunur.

## 14. Ayrıntılı temsili kıyafet görselleri ve kabul edilen sonraki işler — 18 Ekim 2026

### Kullanıcı kararı ve sınır

Kullanıcı ürün fotoğrafına bağımlı olmayan, türün ötesinde yaka/kol/kesim/renk/desen ayrımları taşıyan ortak görselleri ve temsili kombin görünümünü seçti. Marka kartta görünecek; eksik alanlar açıkça bilinmiyor olacak. Birden fazla kullanıcının aynı bilgiyi eklemesi durumunda ayrı bir topluluk etiketi isteniyor. Kullanıcı ilk uygulama adımının dosya kapsamını bildirim üzerinden onayladı. Bu tur gerçek 3D giysi veya topluluk veri yayını olarak sunulmaz.

### Uygulanan ilk adım

- `lib/garment-appearance.ts`: sürümlü, isteğe bağlı `personalAppearance` alanı; sabit tür kimliği, yaka, kol, kesim, boy, beş desen, ana/desen rengi. Renkler altı haneli HEX ve seçimler izin listesiyle doğrulanır. Kısa/uzun kollu tişört ile atletin kol seçenekleri türle çelişmez; aksesuar/ayakkabı için alakasız yaka/kol/kesim/boy alanları elenir. Eski bilinen dolap/profil kimlikleri açık eşlemeyle korunur; bilinmeyen kayıtlar ürün adından tahminle yeni bir gerçek türe dönüştürülmez.
- `components/GarmentVisual.tsx`: 32 tür için vektör şablonları; gömlek/termal/polar/şişme mont, pantolon/şort/etek, elbise, ayakkabı/bot/sandalet, çorap/şapka/atkı/eldiven ayrımları. Bazı türler ortak temel geometriyi farklı dikiş/panel/örgü ayrıntılarıyla paylaşır. Kaynak görseli indirilmedi. Eski şemsiye profili kendi ekipman çizimini korur; 32 türe ek ürün gibi sayılmaz.
- `components/GarmentAppearanceEditor.tsx`: dolaptaki her parçadan açılan ayrı görünüm penceresi; anlık önizleme, renk paleti/özel renk, desen rengi, Kaydet/Vazgeç ve yalnız görünümü sıfırlama. İlk kart içine gömülü deneme satırları uzattığından nihai arayüz ortak Modal bileşenini kullanır. Bu sıfırlama dolabı veya ürünün kaynak bilgilerini silmez.
- Kişisel görünüm tarayıcıdaki mevcut dolap kaydıyla saklanır. `warmth`, `colorHex`, `colorType`, `garmentTypeId`, katalog snapshot'ları ve teknik sıralama girdileri değiştirilmez. Kişisel çizim rengi ürünün gerçek rengi veya güneşte ısınma verisi gibi kullanılmaz. Eski kayıtların toplu yeniden yazımı yapılmadı; görünüm ancak Kaydet ile kayda eklenir.
- Gerçek ürün kartı tür kimliğini çizime iletir; marka/model görünür. Gramaj ve ısı eksikliği kartta, rüzgâr/nefes alabilirlik ve mevcut koruma bilgileri ayrıntıda açık gösterilir. Mevcut ürünlerin yapılandırılmış renk/desen/kesim alanları henüz bulunmadığı için bilinmiyor etiketi korunur; kaynaklı görünüm/varyant şeması gelecekte ayrı kanıtla genişletilmelidir. Kişisel önizleme bu eksikleri kaynaklı gerçeklere dönüştürmez.
- Gerçek üründen dolaba aktarımda ayrı marka/model alanları eklenir; eski `brandHint` korunur. TR/EN kontrol etiketleri ve dar ekran stilleri eklendi. Tek parça için çizim vardır; elbiseyi dolaba/öneri motoruna aktarma hâlâ önceki slot engeline tabidir.

### Sonraki aşamalar — kabul edilmiş yön, henüz uygulanmadı

1. Ortak tür/görünüm sözleşmesini 3D giysi şablonlarına bağlayın. Önce tişört, uzun kollu üst, pantolon, sweatshirt, ceket, ayakkabı. Mevcut avatarın gövde bölgesi renk önizlemesi yeni yaka/desen/kesimi henüz giymez; 2D SVG'nin 3D mesh'e otomatik dönüşümü veya gerçek beden/kalıp simülasyonu iddia edilmez.
2. Üst/orta/dış katman ve bağımsız baş/boyun/el aksesuar yuvaları; elbisenin üst ve altı birlikte kaplaması; giysilerin görsel çakışmasını kontrol etme. Katalogdaki kalan 30 türü özellikle alt giyim/dış giyim/ayakkabıyla doldurma.
3. Topluluk bilgi katkısı: kaynak beyanı, kişisel gözlem ve topluluk uzlaşısını ayrı saklayın. Aynı ürün/varyant ve aynı alan için bağımsız katkıları sayın; tek kişinin tekrarlarını kullanıcı sayısı gibi göstermeyin. Görünür etiket önerisi: “Kullanıcılar ekledi · N bağımsız katkı”, tarih ve çelişki durumu. Sayı tek başına doğruluk kanıtı değildir; yeterlilik/çelişki/etiket kanıtı, kötüye kullanım ve inceleme kurallarıyla yayınlayın. Kaynakla çelişen katkıyı üretici gerçeğinin üzerine yazmayın. Katkı izni ve geri çekmenin toplulaştırmaya etkisi tasarlanmalı. Mevcut GTIN topluluk pilotu bunun tamamlandığı anlamına gelmez.
4. Üç ve üzeri durakta gerçek OSRM karayolu geometrisi, durak saati ve içeride/dışarıda geçirilen süre/hareketle öneri. Kişisel üşüme/terleme geri bildirimini bu bağlama göre geliştirme; genel öneri güncellemesi ayrı izin, yeterli veri ve değerlendirme gerektirir.
5. Kullanıcının kabul ettiği üç ürün fikri: “Yanına al” (akşam için taşınacak katman), kısa “Bunu neden önerdin?” gerekçeleri, kombin/parça sabitleme ve sevilen kombinleri kaydetme. Mevcut parça eşleştirme sabitlemesi vardır; bütün kombinleri günler arasında saklama henüz eklenmedi.
6. Gerçek mobil cihaz/PWA çevrimdışı doğrulaması, son rota/kombin, kullanıcı kontrollü dolap/avatar dışa–içe aktarımı ve isteğe bağlı senkronizasyon. Oracle hesabı bu yerel görsel adımı için gerekli olmadı.

### İlk adımın doğrulaması

- `tests/garment-appearance.test.cjs` 5 yeni davranış kontrolü + katalog/dolap entegrasyonundaki 7 kontrol: **12/12 başarılı**, atlanan yok. 32 türün React SSR çizimi, ad değişse de türün korunması, dış görsel gerekmemesi, yaka/kol/kesim/boy/renk/desen etkisi, pantolon/şort/etek boy ve kesim farkları, güvenilmeyen ayarlar, eski kayıtlar ve kaynak gerçeklerini değiştirmeyen depolama kontrol edildi.
- `tsc --noEmit --incremental false`: **exit 0**. Hedefli ESLint: **0 hata**, WardrobeModal'daki eski isteğe bağlı AI fotoğrafı `<img>` uyarısı sürüyor. Tüm repo lint başarısı iddia edilmez.
- Ayrı `http://localhost:3000` origin'inde mevcut 10 örnek kayıttan birinin görünümü V yaka, rahat kesim, çizgili lacivert olarak kaydedildi; yenilemeden sonra korundu. Puantiye taslağından Vazgeç yapılıp yeniden açınca kayıtlı çizgili görünümün kaldığı doğrulandı. Yalnız testte eklenen görünüm kendi sıfırla + Kaydet akışıyla geri alındı; toplu dolap sıfırlama/silme yapılmadı. Test origin'i TR tercihine geri döndürüldü, test sekmesi kapatıldı.
- TR/EN seçenekler, gerçek katalogda 24 ürün, marka/model, kartta kumaş/gramaj/ısı belirsizliği ve ayrıntıda su/rüzgâr/nefes alabilirlik bilinmiyor etiketleri görüldü. Test sekmesinde hata seviyesinde konsol kaydı yoktu. Gerçek ürün veya kişisel ana dolap kaydı eklenmedi/silinmedi.
- 390×844 mobil kontrolde belge genişliği **390**, her iki açık pencerenin client/scroll genişliği **336/336**; yatay taşma görülmedi. Geçici viewport ayarı geri alındı. Bu, gerçek telefon veya APK/IPA testi değildir.
- `garment-appearance-editor.png` görev görselleştirme dizinine örnek ekran olarak kaydedildi. Ana `127.0.0.1:3000` sekmesinde mevcut EN tercihi ve 10 kayıt korunup yeni görünüm penceresi incelemeye açıldı; ana dolaba görünüm kaydedilmedi. Avatar bu ortamda yine yer yer statik fallback gösterdi; yeni 3D giydirme/WebGL doğrulaması iddia edilmez.
- Son çizim/kırpma düzeltmeleriyle `docker build --target runner -t weathrobe-appearance:qa .`: **exit 0**, Next.js 15.5.28 üretim derlemesi ve tip kontrolü başarılı. İlk sandbox denemesinde Docker buildx kilidi erişimi engellendi; gerekli izinle ayrı imajda doğrulandı. Çalışan geliştirme sunucusunun `.next` dizini veya kalıcı PostgreSQL kataloğu değiştirilmedi. Build yapılandırması lint'i atladığı için hedefli lint kanıtı yukarıda ayrı tutulur. Commit/push/Oracle/canlı yayın yapılmadı.

## 15. Temsili 3D giysiler ve bağımsız aksesuar yuvaları — 18 Ekim 2026

### Yetki ve kapsam

Kullanıcı şu anda inceleyemediğini, geliştirme/yapılacak işlere devam edilmesini ve sonda toplu kontrol listesi verilmesini istedi. Bu yönlendirme kapsamında önceki görsel adımın devamı olarak 3D giysi, katman/aksesuar kuralları, manuel tür seçimi, ilgili testler ve belgeler üzerinde çalışıldı. Yeni dosya/iş kapsamı uygulamadan önce yorum kanalında bildirildi. Hesap, ücretli varlık veya yayın işlemi yapılmadı.

### Uygulama

- `lib/avatar-garments.ts`: ortak tür/kişisel görünümü altı temel şablona bağlar: kısa kollu üst, uzun kollu üst, sweatshirt, ceket, pantolon, ayakkabı. Bere, atkı, eldiven ve çorap için ek temsili yüzeyler bulunur. Etek, elbise, güneş şapkası, sandalet ve ekipman bu tur 3D şablonu gibi gösterilmez; kartta kalır ve açıklama çıkar. Eksik temel parçalar avatarın nötr temel görünümüdür; ürün veya dolap kaydı oluşturmaz.
- `lib/garment-mesh.ts`: mevcut CC0 gövdenin bağlama uzayındaki yüzeylerinden türetilen ayrı `SkinnedMesh` geometrileri, taşınan/normalize edilen kemik ağırlıkları, kol ve paça kesimleri, kesime bağlı bolluk, katman uzaklıkları, açık ceket, kapüşon/yaka ve taban ayrıntıları. Bu, bağımsız bir kumaş fiziği veya ürünün gerçek kalıbı değildir. Uzun kabanlar da genel ceket yaklaşımıyla temsil edilir; her gerçek ürüne özel mesh üretilmedi.
- Renk/desen 64×64 yerel `DataTexture` üzerinden uygulanır; düz renkte doku oluşturulmaz. Çizgili/ekose/puantiye/renk bloğu dış görsel URL'si veya üretici fotoğrafı gerektirmez. 2D/3D aynı görünüm parametrelerini kullanır; yüzey ve dikiş nedeniyle birebir piksel eşliği beklenmez. İlk dokuda desen ölçeği fazla büyüktü; dünya koordinatı UV sıklığı küçültülerek kontrol edildi.
- `AvatarViewer`: bütün seçili katmanları ve desteklenen aksesuarları render eder; kişisel görünüm değişimi render imzasına dahildir. Yerel oluşturulan geometri, materyal, desen dokusu ve kopya iskelet kaynakları temizlenir; kaynak glTF/texture varlıkları değiştirilmez. İstek üzerine render ve sınırlı DPR korunur; 60 FPS cihaz ölçümü yapılmadı.
- Bere için saçın üst kısmı yerel clipping düzlemiyle örtülür, saç profili silinmez. Bu ekleme sırasında `fit` yerel değişkeniyle gölgelenme geçici bir HMR çalışma zamanı hatası verdi; `heightRatio` adıyla düzeltildi. Sonra iki gövde ve bereyle gerçek render tekrar doğrulandı. Tarihsel hata konsoldan silinmiş gibi raporlanmaz; son temiz açılış oturumunda hata seviyesinde kayıt yoktu.
- `AvatarEditor` artık açık kombini de alır; gövde/saç/ten denemesinde seçili giysiler kaybolmaz. Vazgeç profil kaydı yazmaz. `OutfitBoard` ilk profil okumasını lazy state başlatıcısına taşıyarak eski eşzamanlı effect-setState lint hatasını kaldırır; 3D viewer zaten client-only'dir. Bağımsız aksesuar kartları ana 5 giysi kartının üzerine binmek yerine ayrı, dar ekrana saran şeritte gösterilir. Kişisel renk işareti çizimle aynı çözücüden gelir.
- `lib/outfit-layers.ts`: kaynak türüne göre baş, boyun, el, çorap, ekipman ve diğer aksesuar yuvaları. Aynı yuvada son seçilen aktif, önceki alternatif; bere–atkı–eldiven birlikte kalır. Bere ve güneş şapkası aynı baş yuvasında alternatiftir. Kişisel temsil ayarı gerçek seçim yuvasını/teknik öneriyi değiştirmez.
- `outfit-matching`, `wardrobe-storage`, `comfort`: elle sabitlenen aksesuarlar birbirini silmez; dolap her ilgili aksesuar yuvasından uygun parça seçer. Soğuk aksesuarlar yaz sıcağına otomatik önerilmez; güneş şapkası sıcak/UV bağlamıyla değerlendirilir. Olumsuz bere geri bildirimi eldivenle değiştirmez. Bilinmeyen ısı ve koruma için önceki katalog kısıtları korunur.
- `clothing-engine`: eski sabit örnek profil/anchor nesnelerine açık tür kimlikleri eklenir; hava koşuluna göre tipi değişen e-2/e-9 kendi koşullu kimliğini taşır. Belirsiz eski örnekler gerçek ürün bilgisiymiş gibi çözümlenmez. Bu profiller mağaza ürünleri değildir.
- `BarcodeAddPanel`: kategoriye bağlı gerçek tür seçimi, isteğe bağlı marka alanının ayrı saklanması. Yeni manuel kayıtlardaki doğrulanmamış su/rüzgâr koruması artık `null`; önceki “yok/düşük” varsayımları yeni kayda yazılmaz. Kullanıcının verdiği ısı tahmini mevcut kişisel kayıt davranışını sürdürür. Tek-parça giyimin öneri motoruna alınması bu tur açılmadı.

### Doğrulama ve durum

- Yeni `tests/avatar-garments.test.cjs` (4) ve `tests/outfit-layers.test.cjs` (3), mevcut eşleştirme/katalog-dolap/görünüm/konfor-barkod testleriyle **33/33 başarılı**, atlanan yok. İlk sandbox koşusunda yalnız mevcut topluluk dosya pilotunun geçici rename işlemi EPERM ile engellendi; gerekli izinle tam grup başarıyla tekrarlandı. Topluluk veritabanı veya gerçek kullanıcı katkısı kullanılmadı.
- Testler iki gerçek glTF gövdesinin yerel binary buffer'larını okur; 10 temsil şablonunda sonlu konum/normal/UV, geçerli 65 kemik sınırı ve toplamı 1 olan ağırlıkları; kaynak geometrinin değişmemesini; kol/paça/bolluk değişimini; desen verisi ve dispose olayını doğrular. Son desen/bere düzeltmeleri sonrasında yeni 7 kontrol ayrıca **7/7** geçti. CPU kontrolleri gerçek tarayıcı görüntüsünden ayrıdır.
- Son kodla `tsc --noEmit --incremental false`: **exit 0**. Hedefli ESLint **0 hata**, avatarın eski statik önizleme `<img>` kullanımları için 2 uyarı. Tüm repo lint başarısı iddia edilmez.
- `docker build --target runner -t weathrobe-garments:qa .`: **exit 0**, Next.js 15.5.28 üretim derlemesi ve tip kontrolü başarılı. Build lint'i mevcut yapılandırma nedeniyle atlar. Çalışan geliştirme sunucusunun `.next` dizini değiştirilmedi.
- Ayrı `localhost:3000` origin'inde montun görünümü ekose/rahat/yeşil yapıldı. Dolabımdan modunda 3D render imzasında aynı ayarlar görüldü ve gerçek görüntüde desen render edildi. Üç manuel QA kaydı (bere/atkı/eldiven) doğru türle eklendi; dolap önerisinde ve Eşleştir'de üçü aynı anda “Kombinde” kaldı. Atkı seçimi bırakılınca bere/eldiven korundu. Hiçbir kamera/barkod dış servis çağrısı yapılmadı.
- Ön/yan/arka açıları, karakter A/B gövdeleri ve editörde açık kombinin korunması kontrol edildi; iki canvas da `data-avatar-ready=true` bildirdi ve ekran görüntülerinde gerçek 3D model görüldü. Editör denemesi Vazgeç ile kapatıldı. Önceki kayıtlarda erişilebilirlik ağacında statik fallback öğesinin görülmesi tek başına WebGL başarısızlığını kanıtlamaz; Canvas içindeki alternatif DOM içeriklerine rağmen gerçek render bulunabilir. Bu tur başarı hem ready hem görüntüyle doğrulandı.
- 1280×800 masaüstü ve 390×844 mobil kontrolde aksesuar şeridi sarıldı; mobil belge genişliği **375**, viewport **390** (dikey scrollbar payı), yatay taşma yok. Gerçek telefon/Quest/60 FPS ölçümü yapılmadı.
- TR ve EN yeni metinleri görüldü. Yalnız bu tur eklenen üç QA kaydı ve mont görünümü geri alındı; localhost dolabı yeniden **10** kayıt, TR tercihi ve avatar profili korunur. Genel dolap sıfırlama yapılmadı. Son temiz açılışta 3D hazırdı ve hata konsolu boştu. Geçici viewport geri alındı, QA sekmeleri kapatıldı; ana 127.0.0.1 dolabı/EN tercihi/karakteri değişmedi.
- `avatar-garments-and-accessories.png` aksesuar/desen deneyinin kısmi ekranı; `avatar-3d-garments.png` temiz son 3D önizlemedir. Görev görselleştirme dizinine kaydedildi. Kalıcı katalog halen önceki 24 üründür; bu tur gerçek ürün, şema veya veri aktarımı yapılmadı. Yerel DB/dev sunucusu açık; commit/push/Oracle/canlı yayın yok.

### Kullanıcının daha sonra topluca kontrol edecekleri

- [ ] Dolabım → Görünümü düzenle: renk/desen/kesim değiştirip Kaydet; Dolabımdan veya Eşleştir ile seçilen parçanın 3D görünümüne bak. Kaynaklı ürünün gerçek teknik bilgisi değişmemeli.
- [ ] Kısa/uzun kol, dar/rahat kesim ve kısa paçanın temsili 3D farkını kontrol et; montun altında ayrı katman görünmeli.
- [ ] Barkod/Manuel → Barkodsuz elle ekle → Aksesuar: ayrı bere, atkı, eldiven türleri ekle; Eşleştir'de birlikte seçip yalnız birini bırak. Diğerleri kalmalı.
- [ ] Karakterim → karakter A/B ve görünüm denemeleri: mevcut kombin korunmalı; Vazgeç eski profile dönmeli. Ön/yan/arka açılarını dene.
- [ ] Mobil genişlik/App Preview ve TR/EN: aksesuarlar sarmalı, kartlar kontrol düğmelerine taşmamalı, yeni metinler çevrilmeli.
- [ ] Marka/model ve bilinmeyen teknik bilgi etiketlerini kontrol et; yeni manuel üründe doğrulanmamış su/rüzgâr bilgisi bilinmiyor görünmeli.

### Açık işler

Elbisenin üst+alt yuvalarını birlikte kaplaması ve dolaba aktarımı; etek/elbise/sandalet/güneş şapkası/ekipman için bağımsız 3D topoloji; kol altı/uzun kaban/gevşek kıyafette daha ayrıntılı modelleme ve cihaz performans ölçümü; kalan 30 türün kaynaklı ürünleri; topluluk alan katkısı, üç ve üzeri durakta gerçek rota, “Yanına al”, kısa öneri gerekçeleri ve kayıtlı kombinler henüz tamamlanmadı. Önceki kabul edilen yol haritası korunur. Temsili katman görünümü gerçek kumaş fiziği veya satın alınacak ürünün birebir kalıbı değildir.

## 16. 3D yerine gerçek katalog büyütme — 18 Ekim 2026

### Kullanıcının yeni önceliği

Kullanıcı üst üste 3D giydirmenin hatalı göründüğünü belirtti; önce kıyafet veritabanına odaklanılmasını istedi. Önceki 3D doğrulaması sorunun çözümü olarak sunulmamalı. Bu tur 3D/UI/öneri kodları değiştirilmedi. Önceki devam yetkisi kapsamında veri, kaynak kaydı, test ve belge kapsamı işlemden önce bildirildi. Markdown bölümleri silinmedi veya kısaltılmadı.

### Tamamlanan veri işi

- Beş yeni grup: sweatshirt, fleece, woven-trousers, rain-jacket, running-shoes; her biri 10 model, 50 yeni ürün/kaynak gözlemi. Renkler ayrı model sayılmadı; Decathlon ürün kodları global tekildir.
- Önceki iki tişört grubu değiştirilmedi. Güncel toplam **74 ürün / 74 kaynak / 32 tür / 23 legacy profil**, 7 yayımlanmış grup. Kısa kollu 14, uzun kollu 10; yeni beş türün her biri 10. **25 tür hâlâ boş**; 320–480 hedefi tamamlanmadı.
- Decathlon Türkiye'den 40, Stanley/Stella'dan 10 yeni model. Bazı Stanley modelleri US kodludur; Türkiye fiyat/stok/tedarik iddiası yoktur. Güncel toplamlar Decathlon 46, Stanley/Stella 14; diğer beş sağlayıcı korunur.
- 50 modelde ana bileşim kaynaklıdır; astar yalnız açıkça tanımlanınca ayrı saklanır. 16 yeni açık ana kumaş GSM ile toplam 23 ürünün GSM'si bilinir. Isı ve diğer ordinal teknik puanlar uydurulmadı.
- 9 yağmurlukta üretici su geçirmezlik iddiası, çelişkili Raincut 134585 için ihtiyatlı repellent kaydı var. Kısıtlar alan kanıtlarında saklıdır; bağımsız ölçüm değildir.
- Ayakkabı shell üst yüzey, lining astardır; dış taban fill değildir. Kaplama/membran/takviye/manşet ana kumaş yüzdeleriyle toplanmaz. İstisnalar ve gelecekte gereken bileşen/test şeması [araştırma kaydında](db/sources/complete-outfit-research.2026-10-18.md).
- local-approved.json yalnız 7 incelenmiş grubu içerir. Registry ürün listeleri genişletildi; gelecek 6 sağlayıcı/probe yayın dışındadır. Yönlenen/açılamayan üç aday yeniden inceleme koşuluyla kaydedildi.
- Kaynak gözlemi önbellek içerebilir; accessedAt stok veya üretici güncelleme tarihi değildir. Fotoğraf indirilmedi; renk/desen/kesim/GTIN/beden/fiyat doğrulanmadan doldurulmadı.

### Doğrulama ve yerel aktarım kanıtı

- Kaynak/şema/ilk veri/yeni veri/dolap paketleri: **29 başarılı, 2 DB testi açıkça atlandı, 0 başarısız**. Bu komuttan DB başarısı iddia edilmez.
- Ayrı yeni PostgreSQL konteynerinde kaynak + genişletme paketleri: **10/10 başarılı, atlanan yok**. 74 ürünün canonical alanları, bileşenleri, kaynak kanıtları, 32 tür kapsamı, 23 legacy profil, 5 yeni tür filtresi, sayfalama ve tekrar yayın idempotansı denetlendi. SQL sıralamasından bağımsız içerik karşılaştırılır.
- Docker kapalıydı; başlatıldı. Yayın öncesi yedek: `.data/backups/catalog-2026-10-18T13-41-16-159Z-ac3b885b.dump`. Ayrı boş `weathrobe_restore_test` DB'sine no-owner/no-privileges ile geri yüklenip **24 ürün** doğrulandı. Kalıcı DB'nin üzerine geri yükleme yapılmadı.
- Atılabilir `weathrobe-expansion-qa-20261018` konteyneri, loopback 55443, test sonunda durduruldu. Kalıcı `weathrobe-local-db-1`, loopback 55442 ve volume korunur.
- Kalıcı etkinleştirme ilk çalışmada **50 yeni ürün**, ikinci çalışmada **mevcut yayınlar korundu** dedi. Şema/migrasyon veya parolalar değiştirilmedi; kimlik bilgileri yazdırılmadı. Uygulamanın salt okuma bağlantısı korunur.
- Önizleme kapalıydı; Next.js 3000 portunda yeniden başlatıldı. API available ve 14/10/10/10/10/10/10 tür kapsamını döndürdü. Yalnız veri/test/belge değiştiğinden yeni üretim build veya 3D render testi yapılmadı.
- Ayrı localhost tarayıcı sekmesinde toplam **74**, yeni beş türün her birinde **10** kart, kaynak/bilinmiyor etiketleri ve kadın Raincut 134585 ayrıntısında **Su itici** görüldü. Konsolda hata seviyesinde kayıt yoktu. Kullanıcının mevcut 10 kişisel dolap kaydı değiştirilmedi; test ürünü eklenmedi. Bu tur TR ekranı kontrol edildi; yeni TR/EN ürün adları şema testinden geçti, ayrı EN/mobil cihaz testi iddia edilmez.
- Katalog ekran görüntüsü görev görselleştirme dizininde `catalog-74-models.png` olarak kaydedildi. Geçici localhost sekmesi kapatıldı; ana 127.0.0.1 önizleme sekmesi ve geliştirme sunucusu açık bırakıldı.

### Sonraki geliştirme sırası

1. Kalan 25 tür: önce günlük jean, gömlek, kazak/hırka, eşofman; farklı mağazalarla spor/outdoor ağırlığını dengeleme.
2. Kışlık mont/kaban/termal/softshell/rüzgârlık ve botlar; sonra aksesuar/yazlık türler. Her türde 10–15 ayrı model, renklerle sayıyı şişirmeden.
3. Kaynaklı varyant renk/desen/kesim, GTIN ve ülke–varyant–para birimi–tarih içeren fiyat. Segmenti markadan tahmin etmeyin.
4. Membran/takviye/taban rolleri; test birimi/yöntemi/kapsamı ve kaynak çelişkisi şeması. Topluluk katkısı ayrı köken/kanıt/izinle ele alınmalı.
5. Kullanıcının bildirdiği 3D katman sorunu, katalog yeterince çeşitlendikten sonra. Önceki mesh yaklaşımını hatasız veya gerçek kalıp simülasyonu kabul etmeyin.

### Sonradan toplu kontrol listesi

- Dolabım → Katalog → Gerçek ürünler: toplam **74** görünüyor mu?
- Polar, sweatshirt, kumaş pantolon, yağmurluk, koşu ayakkabısı filtrelerinin her birinde **10** model var mı?
- Marka/model, kumaş, açık GSM veya bilinmiyor etiketleri ve ürün sayfası bağlantıları anlaşılır mı?
- Pamuk/keten–lyocell/poliamid pantolonlar ve ayakkabı simgeleri ayırt ediliyor mu?
- Yağmurluk ayrıntısında su koruması, kadın Raincut 134585'te ihtiyatlı su itici bilgisi görünüyor mu?
- Yeni ürünün dolaba eklenmesi, tekrar ekleme engeli ve Eşleştir'de elle seçilmesi beklentini karşılıyor mu?
- Bilinmeyen ısının otomatik puan kazanmaması ve kişisel tahminin ayrı olması açık mı?
- TR/EN marka/model araması ve telefonda kartların okunabilirliği yeterli mi?
- 3D katman sorunu bu tur düzeltilmedi; sonraki görsel tur için açık kaldı.

## 17. Trendyol kaynak uygunluğu araştırması — 18 Ekim 2026

Kullanıcı Trendyol giyim tarafının kaynak olabileceğini belirterek araştırma istedi. Yeni veri aktarımı veya kod kapsamı açılmadı. Dört ürün sayfası, API yetkilendirme/onaylı ürün belgeleri ve affiliate eğitim belgesi incelendi; tam bulgular db/sources/trendyol-research.2026-10-18.md içinde. Registry ve kaynak README'si güncellendi; önceki Markdown bölümleri korunur.

Sonuç: kumaş ve ayrıntılı görünüm alanları için yararlı aday kaynak, fakat başlık/özellik çelişkisi ve satıcı/model/varyant ayrımı gerekiyor. Tüm platformun açık API'si bulunmuş gibi davranmayın: resmî ürün API'si satıcının kendi mağazasına yetkilidir. Affiliate hesabının uygulama için feed/API veya görsel lisansı sağladığı doğrulanmadı. barcode alanını doğrulanmış GTIN ile karıştırmayın; aynı modelin renk/satıcı tekrarını ürün sayısına eklemeyin.

Sonraki veri önerisi gömlek, jean/pantolon ve kazak/hırkadan 10'ar aday. Bu 30 ürünün toplandığı/yayımlandığı anlamına gelmez; gerçek model kimliği ve alan kanıtı kontrolü gerekir. Yeni kaynaklı varyant görünüm modeli, satıcıya bağlı fiyat gözlemi ve izinli sürekli akış ayrı uygulama işleridir. Katalog **74**, Trendyol published ürün kimliği listesi **boş**, liveSync **false** kalır. Hesap oluşturulmadı, API anahtarı kullanılmadı, mağazaya ileti gönderilmedi, fotoğraf indirilmedi.

Kaynak kayıtlarının güncellenmesinden sonra `node --test tests/catalog-sources.test.cjs`: **5 başarılı, 1 DB testi açıkça atlandı, 0 başarısız**. Yayınlanan kimliklerin kaynaklarla tutarlılığı ve araştırma/gelecek kaynaklarının import dışında kalması korundu. Ürün veya DB değişmediği için yeniden yayın, üretim build ve UI testi yapılmadı.

## 18. 36 tür, 100 gerçek model hedefi ve 180 SVG tasarımı — 18 Ekim 2026

### Kullanıcı isteği ve sınır

Kullanıcı hedefi açıklığa kavuşturdu: her türde 100 **gerçek ürün**, mevcut ve anlamlı yeni türler için özgün temsili çizimler. Bildirilen dosya/migrasyon/galeri/veri/test/belge kapsamını onayladı; onay 3.600 ürünün zaten bulunmuş olduğu anlamına gelmiyordu. 3D katman kodu kapsam dışıdır. Eski Markdown bölümleri kısaltılmadan korundu; aşağıdaki sayılar önceki 74/32/10–15 kayıtlarının güncel devamıdır.

### Uygulanan yapı

- Taxonomy: eski 32 kimlik korunarak **polo-shirt, blouse, gilet, rain-poncho** eklendi; toplam 36. Hedef min/max 100/100. `002_catalog_targets.sql` eski hedefleri ve gömlek alias'larını günceller, yeni türleri migrate seed'i ekler. Bu migration artık kalıcı DB'ye uygulanmıştır; içeriğini değiştirmek yerine sonraki numaralı migration açılmalıdır.
- `lib/garment-designs.ts`: her tür için 5 kararlı kimlik, TR/EN ad ve temsili varsayılan. Toplam **180 çizim**, gerçek ürün sayısından ayrıdır. `GarmentVisual` SVG silüet, yaka, kol, kapanış, cep ve boy ayrıntılarını çizer; yeni mağaza fotoğrafı kullanılmaz.
- Kişisel `GarmentAppearance` sürüm 1 korunur; isteğe bağlı `designId` yalnız uyumlu türde kabul edilir. Bilinmeyen/yabancı türdeki kimlik atılır. Açık kişisel alanlar preset varsayılanını ezer. Kaynak kumaş/ısı/marka ve gerçek seçim yuvası değişmez.
- Dolabım → Katalog → **Tasarım örnekleri**: tür filtresi, 12'li sayfalama, kısa temsil açıklaması. **Görünümü düzenle**: beş görsel silüet, renk/desen ve mevcut bireysel kontroller; Kaydet/Vazgeç/Sıfırla. Masaüstü ve dar ekran stilleri, TR/EN metinleri eklendi. İngilizcede tek tür sayacı `1 type`.
- Gerçek ürün görünümü gerçek toplamı ve seçili türün 100 hedefine ilerlemesini gösterir; arama sonuç sayısı, toplam hedef ve çizim sayısı birbirinin yerine kullanılmaz. Boş tür ekranındaki eski “ilk grup tişört” açıklaması güncellendi.
- `scripts/catalog/progress.ts --write`: yalnız açık incelenmiş manifesti doğrulayıp tür bazlı rapor üretir; ID/marka-model tekrarını reddeder. `--json` makine çıktısıdır. Raporun kaynak gruplarını saydığı, DB yayın kontrolünden farklı olduğu açıkça yazılır.

### Gerçek veri durumu: tamamlanmayan hedef

72 yeni model, 13 yeni `*.expansion.2026-10-18.json` grubuyla **kalıcı yerel DB'ye yayımlandı**. Kaynaklar Stanley/Stella EU 65, Koton 2, Decathlon TR 5. Önceki 74 model ve yayınlanmış JSON içerikleri korundu.

**Güncel: 146 ürün / 146 kaynak gözlemi / 20 published grup / 36 tür / 23 legacy profil.** 18 türde ürün var, 18 tür boş. **Hiçbir tür 100'e ulaşmadı; 3.600 hedefe 3.454 model eksik.** Renk/beden veya 180 SVG tasarımı ürün sayısını artırmaz. [Tür raporu](db/sources/catalog-progress.md), [72 modelin doğrudan kaynakları ve kararlar](db/sources/catalog-expansion.2026-10-18.md).

Yeni grup sayıları: kısa tişört 25, uzun tişört 1, atlet 3, gömlek 8, polo 5, bluz 2, yelek 8, softshell 2, eşofman altı 5, şort 2, bere 5, şapka 1, panço 5. Birleşik kısa tişört 39, uzun tişört 11; diğer önceki beş 10'lu grup korunur.

60 yeni açık GSM ile toplam 83 GSM bilinir. Yeni 8 su itici DWR ve 5 panço su geçirmezlik kaydı üretici beyanıdır; bağımsız laboratuvar/ısı puanı değildir. EVA, modal ve karışım oranları korunur. Kaplama astara/dolguya zorlanmaz; Fielder polar kenar astarı yüzdesi bilinmiyor kalır. Bucket Hat astarı ve Puffer Gilet dolgusu ayrı korunur. Tüm 146 ürünün ısısı bilinmiyor; yeni ürünlerin teknik sınıfı, rüzgâr ve ordinal nefes alabilirliği, fiyat/teklif, çözümlenmiş varyant ve GTIN uydurulmadı. Bazı kaynak sayfaları eski model gözlemidir; güncel stok/satış iddiası yoktur.

### Doğrulama kanıtı

- 10 ilişkili CJS test dosyasında **53 kontrol: 51 başarılı, 2 DB koşullu kontrol atlandı, 0 başarısız**. Bunlar veri, kişisel görünüm/180 farklı SVG geometrisi, seri saklama, eşleştirme, bağımsız yuvalar ve mevcut CPU avatar regresyon kontrollerini kapsar. CPU 3D testi kullanıcının bildirdiği katman hatasını çözüldü yapmaz.
- Ayrı temiz `weathrobe_source_test`: **6/6 başarılı, atlama yok**. 146 modelin tam alan/kanıt geri okuması, aynı grubun ikinci staging/yayını, 36 hedef satırı, tür araması, sayfalama ve yeniden migration sırasında ürün/yayın kimliklerinin korunması doğrulandı. İlk koşuda testte dolu tür sayısı yanlışlıkla 15 beklenmişti; gerçek 16 (henüz bluz/panço eklenmeden önce) sayımı düzeltilip son 18 tür için temiz DB'de yeniden başarı alındı.
- Ayrı `weathrobe_migration_test`: **1/1 başarılı**. Değişiklik öncesi gerçek 74 ürün/32 tür/10–15 hedef yedeği boş test DB'sine geri yüklendi; migration iki kez çalıştı. Ürün, kaynak, malzeme, kanıt, varyant, teklif, legacy ve import payload/hash snapshot'ları aynı kaldı; 36 tür/100 hedef oluştu.
- Ayrı `weathrobe_catalog_test`: PostgreSQL yaşam döngüsü/arama/taslak gizliliği/salt okuma yetki testi **1/1 başarılı**. Testte kasıtlı DB erişimsizliği senaryosunun legacy fallback log'u beklenen davranıştır.
- `tsc --noEmit` başarılı. Değişen TS/TSX dosyalarında ESLint **0 hata**, mevcut AI resim önizlemesinden **1 no-img-element uyarısı**. SVG galerisi uzak görsel eklemez. Test harness'inde mevcut Three CommonJS deprecation uyarısı vardır.
- Güncel son mobil/İngilizce düzeltmeler dahil ayrı Docker `runner` üretim derlemesi başarılı: Next **15.5.28**, 9 route, ana sayfa first-load JS yaklaşık 188 kB. Açık geliştirme sunucusunun `.next` diziniyle çakıştırılmadı. Image: `weathrobe-catalog-targets-preview:20261018`. Yerel image oluşturmak canlı yayın değildir.
- Gerçek tarayıcı: katalog toplamı **146**, 36 tür ve yeni dört türün sayıları; 180/36 galeri, tür başına beş çizim ve İngilizce `1 type` doğrulandı. Kişisel taslak Vazgeç'te kayboldu; V yaka/renk Kaydet ve sayfa yenilemesi sonrası korundu. Test kaydı Sıfırla/Kaydet ile eski görünümüne döndürüldü; QA origin'i `localhost`, kullanıcının `127.0.0.1` kaydına dokunulmadı.
- 375 × 812 dar ekran: dialog 321/321, galeri 289/289 ve katalog görünüm seçicisi 287/287 client/scroll genişliği; yeni bölümlerde yatay taşma yok. Üç görünüm seçeneğinin iki satıra düşmesi tek sıra grid ile düzeltildi. Geçici viewport override sıfırlandı. Bu bir gerçek telefon/60 FPS ölçümü değildir. Son tarayıcı hata log'u boş.
- Galeri kanıt görseli (yerel): `C:/Users/ihsan/.codex/visualizations/2026/10/15/01a14165-2aed-7e13-a731-c984e2c4e2fe/garment-design-gallery.png`.

### Veri güvenliği ve devam

Yayın öncesi yedek: `.data/backups/catalog-2026-10-18T14-11-28-650Z-08dfcc6f.dump` (**74 ürün**, test geri yüklemesi yapıldı). Yayın sonrası yedek: `.data/backups/catalog-2026-10-18T14-36-49-906Z-bf5eb5dd.dump` (**146 ürün**, ayrıca alındı; bu ikinci dump için geri yükleme testi henüz yapılmadı). Bağımsız cihaz/depolama kopyası kurulmuş sayılmaz. Kalıcı volume ve salt okuma uygulama bağlantısı korunur. Geçici test DB'leri kalıcı katalogdan ayrıdır.

Öncelik: boş 18 tür (termal üst, kazak/hırka, hafif ceket/rüzgârlık/şişme mont/kaban, jean/tayt/etek/elbise, günlük ayakkabı/sandalet/yağmur-kış botu, çorap/atkı/eldiven), sonra her dolu türün 100'e tamamlanması. Stanley/Stella ve outdoor yoğunluğu farklı günlük mağazalarla dengelenmeli. İncelenen her model için üretici kodu, bileşen kapsamı, güncellik/çelişki ve renk/beden tekrarını denetleyin. İşlem büyük olduğu için hedef takip sistemi tamamlanmasıyla veri toplama hedefinin tamamlanmasını karıştırmayın. Trendyol/marka/affiliate toplu akışı için önceki yetki/kullanım önkoşulları açık kalır; sırf sayaç dolsun diye doğrulanmamış model üretmeyin.

**3D katman hatası bu tur ele alınmadı.** Yeni 2D preset ayrıntıları henüz gerçek 3D giysi geometrisi değildir. Topluluk katkısı/alan uzlaşısı, tek-parça seçim kuralı, sürekli fiyat-varyant akışı ve Oracle canlı ortamı önceki açık işlerdir. Commit/push/canlı yayın, hesap veya ücretli alım yapılmadı.

### Kullanıcının sonra topluca kontrol edeceği yerler

- Dolabım → Katalog → **Gerçek ürünler**: toplam 146, 146/3600 hedefi ve yeni polo 5 / bluz 2 / yelek 8 / panço 5 filtreleri.
- Marka/model, doğrudan kaynak, kumaş bileşimi, bilinen gramaj ve bilinmiyor alanları; MT50 EVA, panço kaplama notu ve Puffer Gilet astar/dolgu ayrımı.
- **Tasarım örnekleri**: 180 çizim, 36 tür filtresi, her türün beş farklı silüeti. Özellikle tişört/polo/bluz/yelek/panço/ayakkabı/aksesuar farkları.
- Dolabımdaki bir parçada **Görünümü düzenle**: silüet + renk/desen, Kaydet ve yeniden açma; ayrı bir denemede Vazgeç, sonra gerekirse Sıfırla.
- TR/EN metinleri ve telefonda üç görünüm sekmesi, kartlar, filtreler ve editör. Gerçek 3D model/katman konusu ayrı kontrol listesinde açık kalır.

Tur sonunda bu çalışma için oluşturulan iki geçici PostgreSQL test konteyneri ve test volume'ları kaldırıldı; kalıcı `weathrobe-local-db-1` ve yedekler korundu. QA tarayıcı sekmesi kapatıldı, kullanıcının mevcut önizleme sekmesi açık bırakıldı. `git diff --check` normal depo satır sonu ayarlarıyla başarılıdır.

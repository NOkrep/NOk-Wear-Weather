# Weathrobe / Wear Weather — Güncel Geliştirme Devri

**2 Kasım 2026 güncel kapanış:** 0.6.0 gerçek ARM64 sunucuda yayında ve kısa tarayıcı kabulü alındı. WW-22/24/23/21 tek sürümde; sağlık/katalog/veri, 30 görsel sunumu, rapor güvenliği/kalıcılığı, raporlu gerçek backup/restore ve güncel bağımsız PC kopyası doğrulandı. WW-01/02'nin bu yayın koşulları karşılandı. Önceden kişisel kullanıcı kaydı olmadığından o korunma kontrolü uygulanamadı. Yeni kullanıcı önceliği WW-27 ortak yayın merkezi, ardından WW-28 güvenlik/görünürlük incelemesi; WW-03 daha sonra açık kalır. Ayrıntılar [yayın kanıtında](deploy/RELEASE_EVIDENCE.md); aşağıdaki eski inceleme ve günlükler tarihsel bağlamıyla korunur.

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
- Galeri kanıt görseli (yerel): Codex yerel görselleştirme klasöründe `garment-design-gallery.png` (yerel yol açık depoda tutulmaz).

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

## 19. Oracle arkadaş önizlemesi için yayın paketi — 19 Ekim 2026

### Yetki ve sunucu durumu

Kullanıcı Oracle hesabını açtı; yalnız Always Free ile, hesap yükseltmeden ve ücretli AI/alan adı alımı olmadan ilk paylaşımı istiyor. Sunucu adım adım kullanıcı tarafından oluşturuldu: Frankfurt Home Region, A1 Flex 2 OCPU/12 GB, Ubuntu 24.04 Minimal aarch64; AD-3 kapasite hatası sonrası AD-2 başarılı. Ayrı `nok-network` VCN, regional `nok-public-subnet`, Internet Gateway ve varsayılan rota oluşturuldu. TCP 22 kullanıcının çıkış IP'si /32, web için 80 ve 443. Private key Windows ACL'sinden Users çıkarılınca SSH girişi başarılı; SYSTEM, Administrators ve kullanıcı izinleri korundu. Özel anahtar, gerçek IP ve parolalar bu belgeye eklenmedi.

Kullanıcı terminalinde ARM64 `hello-world` ve Docker Compose v5.6.0 başarılı. Kullanıcı önceki kaynakları GitHub'a yüklediğini belirtti. Bu tur güncel çalışma kopyası paketlenecek; yeni değişikliklerin ayrıca GitHub'a gönderildiği varsayılmaz. Dosya kapsamı uygulama bildirimiyle açıkça onaylandı; canlı sunucu komutlarını kullanıcı çalıştıracak.

### Uygulanan dosyalar ve korumalar

- `package.json` / kilit: Next.js 15.5.28 korunarak Next altındaki eski PostCSS 8.4.31 yerine override ile 8.5.30; kök PostCSS kilidi 8.5.31. Çalışan yerel `node_modules` yeniden kurulmadı; yeni kilit üretim Docker imajında temiz `npm ci` ile doğrulandı.
- `scripts/deploy/package-release.mjs`: açık üst dizin/dosya listesiyle güncel kaynakları paketler. `.env`/özel ortam dosyaları, `.data`, `.git`, bağımlılıklar, anahtar/yedek uzantıları ve gizli dizinler dışarıda kalır. Sembolik bağlantı ve PEM özel anahtar içeriği reddedilir. Arşiv yeniden listelenir; SHA-256 yazılır; aynı çıktı üzerine yazılmaz. Genel amaçlı bütün sır biçimlerini tanıyan bir tarayıcı değildir.
- `scripts/deploy/configure-preview.mjs`: yeni sunucu `.env` dosyası, iki ayrı 64 karakter hex parola ve public HTTPS adı üretir; sır basmaz. Yeniden çalıştırma parolaları korur. Başka ortam dosyası, DB bağlantısı, ücretli AI anahtarı, tekrarlanan yönetilen ayar veya farklı site adı durumunda mevcut dosya korunur. Linux izinleri 0600, yazım atomiktir.
- `scripts/catalog/import-reviewed.ts`: onay listesinin tamamına DB'den önce tarih/yol/sayım/şema ve çapraz ürün-varyant kimliği doğrulaması. `--check` salt doğrulama, `--reviewed` açık yayın. Mevcut digest ve transaction mekanizmasıyla tekrar çalıştırma güvenlidir; kısmi DB hatasında tamamlanmış gruplar korunur, kalanlar tekrar denenebilir. Kaynak sayfalarını yeniden araştırmaz, adayları glob ile toplamaz, yeni ürün uydurmaz.
- `scripts/catalog/cli.ts`: eski sabit 32 tür mesajı yerine güncel taksonomi uzunluğu kullanılır.
- `tests/deployment.test.cjs`, `.gitignore`, `deploy/ORACLE_PREVIEW.md` ve bu belgelere ekler. Şema, kaynaklı ürün JSON'ları, avatar/katman kodu ve kişisel veriler değiştirilmedi.

### Doğrulama ve sınırlar

- Windows Node: 11 ilişkili CJS dosyasında **61 test; 58 başarılı, 3 DB koşullu atlama, 0 hata**. Paket gizlilik/anahtar içerik kontrolü, mevcut dosya ve parola koruma, hatalı son grubun DB erişiminden önce reddi kapsanır. Korumalı sandbox temp dizininde rename/realpath erişimi engellendi; aynı testler normal kullanıcı erişimiyle geçti.
- TypeScript `--noEmit --incremental false` başarılı. Yeni MJS/TS yardımcıları ve değişen CLI için hedefli ESLint başarılı.
- Üretim bağımlılığı denetimi **0 bulgu**. Tam denetimde geliştirme/lint `braces → micromatch → fast-glob → @next/eslint-plugin-next → eslint-config-next` zincirinde **5 yüksek önem uyarısı** kalır. Bunları gidermek için önerilen zorlayıcı/eski ana sürüme geçiş uygulanmadı; ayrı geliştirme aracı bakımı gerekir. Üretim denetimi genel güvenlik garantisi değildir.
- Ayrı `weathrobe-oracle-preview:20261019` Docker runner derlemesi başarılı; Next 15.5.28, 9 route, ilk JS yaklaşık 188 kB. Docker Desktop başlangıçta kapalıydı; motor başlatıldı. Yerel geliştirme `.next` klasörü derleme için kullanılmadı.
- `weathrobe-oracle-tools:20261019` ile Linux üzerinde **9/9 yayın testi, atlama yok**. Ayrı boş `weathrobe_deployment_test` DB'sinde ilk aktarım 146 yeni ürün, ikinci aktarım 0; 20 yayın kimliği/digest'i aynı kaldı. 36 tür/23 eski profil korundu. Reader hesabı SELECT yapabilir; DELETE ve import payload SELECT 42501 ile reddedilir.
- Aynı geçici DB'ye salt okuma hesabıyla bağlanan üretim runner ana sayfada HTTP **200**; katalog API'si **postgresql / available / 146 ürün / 36 tür / 23 profil** döndürdü.
- Test DB'si tmpfs üzerinde, ayrı etiketli ağ/konteynerlerdeydi; uygulama yalnız rastgele localhost portunda açıldı. Bu test kaynakları sonunda kaldırıldı; kalıcı yerel katalog ve yedekler korunur. Docker imajları sonraki kontroller için kalır.
- Bu Docker kanıtı yerel Linux platformuna aittir. Oracle ARM üretim derlemesi, public DNS/HTTPS, gerçek telefon ve dışarıdan tarayıcı testi kullanıcıyla sonraki aşamadır. İlk yayın paketi `artifacts/releases/weathrobe-preview-2026-10-19.tar.gz` ve yanında `.sha256` üretilecek; canlı yayının tamamlandığı iddia edilmez.

### Sonraki kullanıcı adımları

1. Windows PowerShell'den arşiv ve checksum'u SCP ile sunucunun home dizinine yüklemek; private key bilgisayarda kalır.
2. SSH oturumunda `sha256sum --check`; yeni dizine açmak.
3. Gerçek Oracle public IP'sinden `weathrobe-IP-TİRELERLE.sslip.io` adı seçmek; konteyner içindeki configure-preview komutuyla taze sunucu sırları oluşturmak. Yerel `.env` yüklenmez.
4. Rehberdeki Compose proje adı `weathrobe-preview` korunarak ARM build → db → migration → kontrol → onaylı 146 ürün → coverage → Caddy/app başlatma.
5. HTTPS, gerçek katalog ve mobil/konum/rota akışı doğrulandıktan sonra bağlantıyı arkadaşlara kullanıcı paylaşır. Merkezi genel uygulama geri bildirim kutusu bu tur eklenmedi; termal geri bildirim ayrı işlevdir.
6. Sunucu dışı yedek ve ayrı DB'de geri yükleme testi. Doctus için ortak Caddy/ayrı uygulama ağı ve volume'lar sonra onaylanacak; ikinci Caddy ile 80/443 çakıştırılmaz.

Oracle konsolunun 4/24 uyarısı ile o gün kontrol edilen resmî belgenin 2/12 açıklaması uyuşmuyordu; kurulan 2/12 korunur. Hesabın ücretsiz statüsü ve toplam kaynak tüketimi kontrol edilmeden genişletme yapılmaz. Eski Markdown bölümleri korunmuştur.

## 20. Yayın sonucunun uzlaştırılması ve hedef takibi — 27 Ekim 2026

Kullanıcı son durumu analiz edip ilerlemeyi sistematik takip edecek hedef listesi istedi; yeni `PROJECT_GOALS.md` ile bu dosya ve README sonuna tarihli ek kapsamını bildirim üzerinden onayladı. Önceki bölümler silinmedi veya kısaltılmadı.

### Son kanıt ve bugünkü sınır

- Bölüm 19'daki yayın bekleme ifadelerinden sonra, 19 Ekim konuşmasında kullanıcı Oracle ARM build başarısını, `products:146, batches:20, types:36, newlyPublished:146` aktarım sonucunu ve sitenin açıldığını doğruladı. İlk önizleme yayını bu tarihli kullanıcı kanıtıyla tamamlanmıştır.
- 27 Ekim'de yerel HEAD `f8cd86a8eb754e9ad383cb87e89d1d49d959b12d` ve başlangıç çalışma ağacının temiz olduğu görüldü. Onay listesindeki 20 JSON grubu yeniden sayıldı: 146 kayıt, 146 farklı kimlik ve 18 dolu tür. Bu, tam import doğrulaması veya canlı DB sayımı değildir.
- Bu tur sunucuya bağlanılmadı, canlı adres açılmadı, önceki testler tekrar çalıştırılmadı. Bugünkü HTTPS/servis/katalog sağlığı, gerçek telefon kabulü ve sunucu dışı yedek/geri yükleme için yeni tamamlanma kanıtı yoktur.
- Paket ve kilit sürümü 0.3.0; tarihsel mimari/SW adı 0.4.0, Git geçmişinde 0.5.0 mesajı var. Sürüm değiştirilmedi; sonraki yayın öncesi WW-05 ile kimlikler netleştirilecek.

### Ana liste ve devam sırası

[PROJECT_GOALS.md](PROJECT_GOALS.md) sabit WW kimlikleri, durumlar, öncelikler, kabul koşulları, bağımlılıklar, ölçüm tablosu ve tur sonu kayıt şablonunu içerir. Önerilen ilk sıra WW-01 (mevcut yayının salt okuma doğrulaması), WW-02 (katalog/topluluk/gizli yapılandırmanın uygun yedeği, sunucu dışı kopya ve izole geri yükleme), WW-03 (gerçek cihaz kabulü).

Katalog çeşitliliği ve 36 türde 100'er gerçek model hedefi korunur; 146/3.600, 18 dolu/18 boş tür ve 3D katman sorunu başlangıç durumudur. Rota fallback güvenilirliği, 3+ durak, konum/önbellek gizliliği, arkadaş yorumlarının takibi, “Yanına al”, gerekçeler, kayıtlı kombinler, kişisel veri kurtarma, PWA/native ve topluluk/mağaza işleri ayrı hedeflere ayrıldı. Doctus ortak sunucu/proxy konusu sonraki, ayrıca yetkilendirilecek iştir.

Hedeflerin listelenmesi kod/veri/yayın için toplu uygulama izni değildir. Bu tur yalnız üç dokümantasyon dosyasını kapsar; commit/push, sürüm artışı, yeni yayın paketi, sunucu işlemi veya zamanlanmış otomasyon yapılmadı. Her sonraki turda durum ve kanıtlar güncellenmeli; kod/test/canlı/kullanıcı kabulü birbirinin yerine kullanılmamalıdır.

## 21. Altı kullanıcı bulgusu ve üç kıyafet seçimi önerisi — 27 Ekim 2026

Kullanıcı tür çizimlerinin yetersizliğini, eksik genel hata/geri bildirim bölümünü, gece güneşli gösterimini ve ileri tarihli plan ihtiyacını bildirdi; avatar için üç kıyafet seçimi arayüzü ile Claude/ChatGPT eklenti-beceri rehberi istedi. Bildirim üzerinden iki yeni belge ve hedef/devir sonuna ek kapsamı onaylandı. Uygulama kodu/canlı yayın onayı bu turun kapsamı değildir.

### İnceleme bulguları

- `components/GarmentVisual.tsx` üst türlerinin çoğunda ortak ana silüet kullanıyor; `lib/garment-designs.ts` 36x5 tasarım sayısı küçük kartta görsel kaliteyi kanıtlamıyor. Önce altı temsilci türde kullanıcı görsel kabulü, sonra yayılım önerildi.
- `components/FeedbackModal.tsx` termal değerlendirme ve ayrıca izinli GTIN katkısı içindir. Genel hata/ürün önerisi için ayrı giriş, gönderim önizlemesi ve kalıcı/yetkili inceleme akışı bulunmadığı görüldü; yeni WW-24'e yazıldı.
- `app/api/weather/route.ts` Open-Meteo ve DWD WMO dönüşümlerinde bazı çağrılar gece bilgisi vermiyor; Bright Sky dry ve OpenWeather clear yolları sunny üretebiliyor. Saatlik pencere sunucu `new Date().getHours()` değerine göre kesiliyor; gece için sabit saat aralığı kullanılıyor. Bunlar bildirilen hatayı açıklayan kod yollarıdır; bu tur canlı hata yeniden üretilmedi ve düzeltilmedi.
- `ItineraryStop` yalnız `preferredTime` taşıyor. `fetchWeatherConsensus` tarih almıyor, istek/önbellek tarih içermiyor, `resolveStopWeatherAtTime` tarih yerine saat numarasına bakıyor. Takvim kontrolü yanında hedef konumun tarih/saat dilimi, tam tahmin zamanı, kaynak ufku ve veri-yok akışı birlikte ele alınmalı.

### Hazırlananlar ve sınırlar

- [AVATAR_UI_ONERILERI.md](AVATAR_UI_ONERILERI.md): Atölye, Katman rafı ve Günlük kombin; ortak kabul koşulları, kıyafet çizimi kalite turu ve seçim sonrası uygulama kapsamı. Atölye başlangıç önerisi; kullanıcı henüz seçmedi.
- Konuşmada karşılaştırılabilir etkileşimli önizleme: mevcut projedeki statik avatar render'ı, örnek parçalar ve yerel taslak denemeleri. Yeni 3D giysi/mesh veya canlı tarihli hava uygulanmış gibi gösterilmez.
- [CLAUDE_CHATGPT_EKLENTILERI_VE_BECERILERI.md](CLAUDE_CHATGPT_EKLENTILERI_VE_BECERILERI.md): beceri/eklenti/MCP/bağlayıcı ayrımı, resmi OpenAI/Claude kaynakları, mevcut ve aday araçlar, izin/maliyet/durum şablonu. Product Design isteğe bağlı önerildi; kurulum veya hesap bağlantısı doğrulanmadı. Claude ortamı incelenmedi.
- PROJECT_GOALS.md sonuna WW-21–26 ve ürün önceliği eklendi; önceki bölüm ve kayıtlar korunur. Duyulan belirli beceri/eklenti adları gelince kaynak bazlı incelenecek.

Bu tur uygulama testleri yeniden çalıştırılmadı; belge bağlantıları/eklerin korunumu ve önizlemenin yerel etkileşimleri ayrıca kontrol edilir. Sunucu, veri, bağımlılık, sürüm, GitHub issue/commit/push veya yayın değişikliği yapılmadı. Sonraki adım kullanıcı tasarım seçimi ve uygulanacak kod/test kapsamının onaylanmasıdır.

### Bu tur doğrulama kaydı

- Önizleme, geçici ve ayrı Edge profilinde üç tasarım x 360/736 px olmak üzere altı senaryoda açıldı. Parça/kombin seçimi, taslak kaydetme, başlangıca dönme, avatar görselinin yüklenmesi ve yatay taşma kontrolü geçti; sayfa JavaScript hatası görülmedi. Bunlar konuşma önizlemesi kontrolleridir; gerçek uygulama/3D mesh/meteoroloji veya fiziksel telefon kabulü değildir.
- İlk tarayıcı denemeleri sandbox'ın geçici profil engeli nedeniyle başarısızdı; izinli aynı kontrol ayrı Edge profiliyle başarılı oldu. Yeni tarayıcı paketi kurulmadı; kişisel tarayıcı profili kullanılmadı.
- PROJECT_GOALS.md ve DEVELOPMENT_HANDOFF.md ek öncesi baytlarının SHA-256 karşılaştırması korundu; 26 farklı WW hedef satırı ve yeni belgelerin yerel bağlantıları kontrol edildi. `git diff --check` başarılı; normal satır sonu uyarıları dışında hata yok.


## 22. WW-22 gece/gündüz zaman bağlamı — 29 Ekim 2026

Kullanıcının bildirim üzerinden onayladığı 14 dosyalık kapsam uygulandı. Güncel sonuç ve kabul sınırları [PROJECT_GOALS.md bölüm 11](PROJECT_GOALS.md#11-ww-22--gecegündüz-düzeltmesi-29-ekim-2026) içindedir; önceki bölümler korunur.

- Yeni `lib/weather-time.ts`: yerel gün/saat, IANA saat dilimi, DST boşluğu/ilk tekrar politikası, tam UTC tahmin noktası seçimi, günlük doğuş/batış ve yaklaşık astronomik yedek. Yeni `lib/weather-condition.ts`: ortak WMO/gündüz-gece dönüşümü ve önbellek/eskimiş veri normalizasyonu.
- `app/api/weather/route.ts` ve `lib/weather-service.ts`: epoch sağlayıcı zamanları, tam iki günlük seri, konum fazında kaynak birleştirme, kaynak kesintisinde gerçek veri yok durumu, özel anahtarlı sonuçları ortak cache dışında tutma. Çıktı koordinatları istemcide mevcut iki ondalık gizlilik ızgarasında kalır; sıfır koordinatlar başka şehre dönüşmez.
- `app/api/route/route.ts`: kalkışın konum günü, gerçek süre farkıyla varış anı, her durağın kendi saat dilimi ve o ana ait saatlik koşulu. Saatlik karşılık yoksa `forecastAvailable: false`; mevcut rota kestirimi/hata sunumu ayrıca WW-13 kapsamında ele alınmalıdır.
- `lib/types.ts` alanları eklemelidir; eski dolap/avatar/geri bildirim kayıtlarına göç veya yazma yok. Eski tarihsiz meteoroloji saatleri geçerli bir güne atanmaz.
- Yeni `components/WeatherIcon.tsx`, `app/page.tsx`, `components/HourlyForecastChart.tsx`: ortak ay/güneş/bulut-ay dönüşümü, yerel tarih, 30 saniyelik faz saati ve 15 dakikalık veri yenileme. Kombin hesabına yalnız hedef günün saatleri girer. Veri yokken kişisel termal rapora sahte hava bağlanmaz.
- `public/sw.js`: kalıcı hava/rota cache replay kaldırıldı; aktivasyonda yalnız eski hava/rota girişleri silinir. Kişisel/ilgisiz cache'ler ve localStorage korunur.
- Yeni `tests/weather-time.test.cjs` ve `tests/weather-flow.test.cjs`: 20/20 başarılı. Tüm CJS paketi 99 test: 95 başarılı, 0 başarısız, 4 DB koşullu atlama. Nihai Next üretim derlemesi exit 0; TypeScript kontrolü başarılı. React sunucu render kanıtı vardır; gerçek tarayıcı/telefon/canlı yayın kabulü yoktur.
- Lint'te bu işle eklenen hata yok; kişisel profil yükleyen mevcut `app/page.tsx` efektinin `react-hooks/set-state-in-effect` hatası HEAD ile karşılaştırılarak teyit edildi. Build yapılandırması lint'i önceden atlıyor. Yeni bağımlılık veya lint kuralı istisnası eklenmedi.

WW-22 yerel geliştirme hedefi tamamlandı. WW-23 tarih/takvim arayüzü, WW-24 genel hata raporu ve diğer hedefler ayrıca kapsam onayıyla ilerler. Sunucuya bağlanılmadı; kişisel anahtar dizinine erişilmedi; commit/push, yayın paketi veya canlı değişiklik yapılmadı.


## 23. WW-24 genel uygulama bildirimi — 29 Ekim 2026

Kullanıcının 17 dosyalık kapsam onayıyla hata/öneri formu, ayrı kalıcı rapor alanı ve yetkili salt okuma komutu hazırlandı. Termal modal ve kişisel dolap/avatar/geri bildirim kayıtları korunur. Güncel sonuç [PROJECT_GOALS.md bölüm 12](PROJECT_GOALS.md#12-ww-24--genel-hata-raporu-ve-öneri-29-ekim-2026), işletim ayrıntıları [deploy/PRODUCT_FEEDBACK.md](deploy/PRODUCT_FEEDBACK.md) içindedir.

- `components/ProductFeedbackModal.tsx`, `app/page.tsx`, `components/Navbar.tsx`, `app/globals.css`, `lib/translations.ts`: görünür genel giriş; hata/öneri, açıklama ve isteğe bağlı adımlar; TR/EN önizleme, açık saklama onayı ve gönderim; başarısızlıkta taslak/kimlik korunumu; mobil taşma/fokus/dokunma kontrolü. Form otomatik kişisel bağlam almaz ve localStorage kullanmaz.
- `lib/product-feedback.ts`, `lib/product-feedback-store.ts`, `app/api/feedback/route.ts`: katı izinli alanlar/onay, 20 KiB gerçek okuma sınırı, origin/JSON denetimi, kısa ve günlük kotalar, 10.000 kayıt kapasitesi, aynı kimlikte değişmez/idempotent kayıt, tek yazıcı kuyruğu ve atomik/senkron kalıcılık. Ham IP, ham çerez ve cihaz başlıkları kayıt dışıdır. Sayaç özeti 24 saatlik pencereyi izler ve eski sayaçlar yeni başarılı kayıtta temizlenir; raporlar otomatik silinmez.
- `Dockerfile`, `docker-compose.yml`, `scripts/feedback/review.mjs`: raporlar bağımsız `reports_data` alanındadır. Linux 0700/0600/UID 1001; inceleme servisi Docker yetkilisine açık, ağı kapalı ve alanı salt okunurdur. GET API veya özel dosya URL'leri içerik sunmaz. Yeni web yönetici paneli/parolası veya katalog veritabanı yazma yetkisi yoktur.
- Üç yeni test dosyası toplam 23 test: doğrulama/gizlilik, HTTP gövde/origin/izin/kota/hata, form geçişleri/TR-EN/onay/yeniden deneme ve Docker/kalıcılık. Son tam koşu `WW24_DOCKER_TEST=1` ile **122 toplam / 118 başarılı / 4 DB atlama / 0 başarısız**. Gerçek Linux konteyner yenilenmesi, farklı UID'nin EACCES alması ve salt okunur yazmanın EROFS alması doğrulandı.
- Gerçek tarayıcıda TR/EN sentetik kayıt, kayıt öncesi önizleme, hata sonrası tekrar ve sunucu yeniden açılınca iki kaydın korunması kontrol edildi. 321/360/1441 CSS piksel son ölçümlerinde yatay taşma yok; klavye odağı ve masaüstü görüntüsü kontrol edildi. Fiziksel telefon kabulü yapılmadı; WW-03'e bırakıldı. Yerel HTTP özel dosyalara 404, rapor okumasına 405 döndürdü.
- Nihai üretim derlemesi/tip kontrolü başarılı; yeni WW-24 kodunda lint hatası yok. Önceden mevcut ana sayfa kişisel profil efektinin lint hatası devam ediyor; mevcut yapılandırma derlemede lint'i atlıyor. Mevcut Three.js CommonJS uyarısı değiştirilmedi.

WW-24 yerel geliştirme hedefi tamamlandı. Uygulama yeni rapor alanı için tek Node yazıcısı varsayar; çoklu kopyadan önce ortak işlemsel depolama gerekir. `reports_data`, mevcut PostgreSQL/topluluk yedeğine kendiliğinden girmez: sonraki WW-02/yayın turunda sunucu dışı kopya ve izole kurtarma kanıtına eklenmelidir. Canlı yayın veya sunucu bağlantısı yapılmadı; yerel testler mevcut özel kayıtlardan ayrı geçici veri kullandı. Önceki WW-22 ve belge değişiklikleri korundu; commit/push yapılmadı.


## 24. WW-23 tarihli durak planlama — 29 Ekim 2026

Kullanıcının onayladığı 20 dosyalık kapsam uygulandı. Güncel sonuç ve sonraki hedef metni [PROJECT_GOALS.md bölüm 13](PROJECT_GOALS.md#13-ww-23--ileri-tarih-ve-saat-aralığı-29-ekim-2026) içindedir. WW-22/24 değişiklikleri, eski bölümler ve kişisel kayıtlar korunur.

- Yeni `lib/weather-plan.ts`: plan penceresi, yerel tarih/DST kuralları, gerçek kaynak ufku, bütün aralığı kapsama/boşluk denetimi, 15 dakika tazelik ve açık hata durumları. Yeni `lib/weather-forecast.ts`: epoch saatlik noktaların katı ayrıştırılması; eksik alan sıfır sayılmaz, bilinmeyen UV ayrı kalır.
- `lib/weather-time.ts`, `lib/weather-condition.ts`, `lib/types.ts`: açık yerel takvim, IANA çözümleme, ertesi gün, ilk tekrarlanan saat politikası, kaynak/plan/UTC nokta tipleri ve gelecekteki an için WW-22 gündüz/gece dönüşümü.
- `app/api/weather/route.ts`: isteğe bağlı doğrulanmış tarih, ayrı cache kimliği; Open-Meteo 16/DWD ICON 10 gün talebi fakat gerçek dönen saatlere göre kapsam. Diğer kaynaklar bu uygulamada Şimdi akışına ayrılır. Sayısal gözlem alanları eski API zarfında kalır; tarihli tüketici yalnız `forecastSources` içinden doğrulanan plan sonucunu kullanır. Gözlem değerleri ileri tarihin verisi olarak kullanılmaz.
- `lib/weather-service.ts`: tarihli istek/deduplikasyon, planlarda özel anahtar okumama/göndermeme, durak başına çözümleme ve eksik plan varsa ortak kombini engelleme. Birden çok tarih/konumun yalnız seçili saatleri birleştirilir; güçlü koşul, soğuk hissedilen, yağış/rüzgâr riski ve bilinmeyen UV korunur.
- Yeni `components/StopPlanControls.tsx`, `app/page.tsx`, `components/RealCityMap.tsx`: her durakta bağımsız Şimdi/Bugün/Yarın/takvim ve saatler; saat dilimi, kaynak kapsamı ve veri yok uyarıları; eski tarih/konum yanıtını reddetme; yeni yanıtla ekran saatini eşitleme. Planlar oturum durumudur; kayıt göçü veya yeni kişisel saklama alanı yoktur.
- `components/HourlyForecastChart.tsx`: planın bütün tarihli saatleri; seçili aralığın dışındaki günler ve 12 saat sınırı plana taşınmaz. Veri saatlik [t,t+1h) dilimleridir; dakika ölçümü/interpolasyon iddia edilmez.
- `lib/clothing-engine.ts`, `components/OutfitRecommendation.tsx`: planın gerçek dilimlerinden tarihli/gündüz-gece katman zaman çizelgesi, sıcak yağmur/rüzgâr için dış katman; sahte sabah/öğle/akşam değerleri planlarda yok. Plan gerçek giyim deneyimi olarak kaydedilemez. Eski termal geçmiş ve kişisel dolap/avatar verileri değişmez.
- `app/globals.css`, `lib/translations.ts`: TR/EN kontroller ve uyarılar, 44px hedef/16px alan, dar ekranda sıcaklık aralığına uygun kart akışı. 320/347/1427 CSS pikselde sayfa taşması yok; gerçek telefon kabulü yapılmadı.
- Yeni üç plan testi **19/19**; son genel koşu **141 toplam / 136 başarılı / 5 koşullu atlama / 0 başarısız**. Dört DB ve bir isteğe bağlı WW-24 Docker testi bu tur koşmadı. Son üretim derlemesi/tip kontrolü başarılı; önceki iki efekt lint hatası ve üç uyarı devam ediyor, yeni WW-23 lint hatası yok. Derleme yapılandırması lint'i önceden atlar.
- Gerçek tarayıcıda TR/EN, Şimdi/Yarın, gece yarısı, ufuk dışı uyarı, gerçek kaynak sınırları ve iki durağın bağımsız gün/saatlerinin korunması doğrulandı. Yeni yanıtın önceki UI saati nedeniyle geçici eski sayılması ile çok durakta kar/UV birleşimi hataları regresyonla düzeltildi.

WW-23 yerel hedefi tamamlandı; canlı sunucuya bağlanılmadı ve yayın yapılmadı. Fiziksel cihaz WW-03, canlı sağlık/yedek/geri dönüş WW-01/02/05 kapsamındadır. Önerilen sıradaki ürün hedefi **WW-21: önce altı temsilci kıyafet türünde görsel kabul**; kullanıcı hedefi başlatmadan yeni uygulama kapsamına geçilmez.


## 25. WW-21 — altı kıyafet türünün çizimleri, görsel kabul aşaması — 29 Ekim 2026

Sekiz dosyalık kapsam kullanıcı tarafından onaylandı. Yerel geliştirme/teknik doğrulama tamamlandı; **kullanıcı görsel kabulü henüz yoktur ve WW-21 açık kalır**. Güncel ayrıntı ve yayın sayacı [PROJECT_GOALS.md bölüm 14](PROJECT_GOALS.md#14-ww-21--altı-tür-çizim-turu-görsel-kabul-bekleniyor--29-ekim-2026) içindedir.

- Yeni `lib/garment-illustrations.ts` yalnız short-sleeve-tee, shirt, sweatshirt, puffer, jeans ve sneakers için özgün silüet/panel/detay verisi üretir. Her türün beş mevcut varyantı korunur. İnce detaylar silüete kırpılır; yaka/kapüşon dış çizgileri ayrı tutulur.
- `components/GarmentVisual.tsx` aynı çözülmüş görünümden yeni altılıyı çizer; `drawingVersion="before"` eski çıktıyı inceleme için korur. Diğer 30 tür eski yolu kullanır. Kişisel görünüm şeması, kayıt kimlikleri ve 3D giysi kodu değişmedi.
- Yeni `scripts/preview/garment-review.tsx`, onaylı `artifacts/previews/ww21-garment-comparison.html` dosyasını üretir. Otuz önce/sonra eş, boyut/zemin/tür/varyant kontrolleri ve altı sentetik kişisel örnek vardır. Ağ/analitik/localStorage yoktur; kullanıcı kabulü sohbetten alınır. Dosya güncelliği ve CSP betik hash'i test edilir.
- Başlangıçta alınan 216 SVG özetiyle eski görünüm tamamen aynı; yeni görünümde yalnız altı türün 36 çıktısı farklıdır. Diğer 30 türün varsayılan+beş varyanttan oluşan 180 çıktısı aynıdır. Renk/desen/kesim ve kaynak gerçekleri sentinellerle doğrulanır.
- Yeni altı test 6/6; görünüm/avatar paketi 17/17. Son genel koşu 147 toplam, 142 başarılı, 5 koşullu atlama, 0 başarısız. İlk koşudaki eski geri bildirim testinin geçici klasör temizleme ENOTEMPTY hatası, tekil ve genel tekrarında görülmedi; ilgili kaynaklar değiştirilmedi.
- Son üretim derlemesi/tip kontrolü ve değişen üç TS/TSX dosyasının lint'i başarılı. Fiziksel telefon doğrulanmadı. Tarayıcıda büyük varyantlar, 320/1427 CSS piksel, 72/144/240 px, açık/koyu zemin ve kişisel örneklerin filtrelerden bağımsız kalması kontrol edildi.
- Yerel önizleme salt okunur bir test sunucusuyla açılabilir; bu canlı yayın değildir. Oluşturulan görsel özet bir tarayıcı ekran görüntüsü değil, aynı SVG çıktılarının PNG karşılaştırmasıdır. Araç motoru veya bağımlılık kurulmadı; commit/push/SSH/canlı yayın yoktur. Önceki WW-22/24/23 değişiklikleri ve eski belge bölümleri korunur.

Kullanıcı düzeltme isterse altı türlük onaylı kapsamda ele alınır; kabul gelmeden 36 türe yayılmaz veya hedef tamamlandı işaretlenmez. Kullanıcının yayın kuralı her dört tamamlanan hedefte bir site güncellemesidir: WW-22 + WW-24 + WW-23 şu an 3/4; WW-21 kabulüyle 4/4. Sonraki öneri WW-05 toplu yayın hazırlığıdır; WW-01/02 sağlık/yedek/geri dönüş koşulları ayrıca doğrulanır.


### Görsel inceleme sonrası kullanıcı geri bildirimi — 30 Ekim 2026

- Kullanıcı yeni çizimlerin daha iyi olduğunu ve özellikle detaylandırılma biçimini beğendiğini belirtti; **son kullanıcıya sunulacak kaliteyi henüz yeterli bulmadı**. Bu, tam görsel kabul değildir. WW-21 açık ve yayın sayacı 3/4 kalır.
- Kullanıcı internetten/tasarım araçlarından daha nitelikli varlık teminini, satıcıların sağlayabileceği tür modellerini ve “kişisel dolapta satıcı ürün fotoğrafı + genel öneride kendi tür çizimlerimiz” yaklaşımını sordu. Detaylandırma dili korunacak; mevcut çalışma silinmeyecek. Hibrit yaklaşım bu aşamada değerlendirme/öneridir, yeni uygulama kapsamı onayı değildir.
- Önerilen ayrım: gerçek dolap parçası ve o parçadan yapılan öneride doğru ürün/renk varyantı fotoğrafı; ürün seçilmemiş genel öneride tutarlı temsili illüstrasyon; görsel bulunmazsa mevcut tür çizimi. 3D avatar ayrı temsili geometridir; ürün fotoğrafı otomatik 3D giysiye dönüşmüş sayılmaz.
- Kod incelemesi: CatalogProduct ve ClothingItem henüz ürün fotoğrafı alanı taşımıyor. Mevcut barkod API'si UPCitemdb'den başlık/marka/model döndürüyor, images alanını almıyor. Fotoğraf eklemek; görsel kaynağı/izin, ürün-varyant eşleşmesi, kalıcılık ve kart gösterimi için ayrı ve onaylı dosya kapsamı gerektirir. Mevcut sekiz dosyalık çizim kapsamına sessizce genişletilmez.
- Kaynak adayları: [VecFashion çizim örnekleri](https://vecfashion.com/collections/free-fashion-vectors?page=1) ve [lisans koşulları](https://vecfashion.com/pages/licenses); [Awin ürün görselleri içeren veri akışı](https://help.awin.com/developers/docs/product-feed-publisher-guide-intro); [UPCitemdb images yanıt alanı](https://www.upcitemdb.com/wp/docs/main/development/responses/) ve [üçüncü taraf haklarına ilişkin koşulları](https://devs.upcitemdb.com/termsofservice). Bir görsel URL'sinin veya ücretsiz indirmenin bulunması, uygulamada kullanım izni olarak kabul edilmez. Henüz dış görsel indirilmedi, satın alınmadı veya uygulamaya eklenmedi.
- Araç keşfinde Figma ve Adobe eklentileri kurulu görünmedi; Figma isteğe bağlı bir düzenleme yolu olarak önerildi, kurulmadı/bağlanmadı. Özgün temsili görseller için mevcut görsel üretim aracıyla bağımsız kalite denemesi yapılabilir; böyle bir çıktı gerçek ürün fotoğrafı olarak etiketlenmez.
- Sonraki kalite denemesi önerisi: bütün 36 türe yayılmadan tişört, hoodie ve mont için daha profesyonel temsili görsellerle fotoğraf/illüstrasyon ayrımını karşılaştırmak; seçilen yön ve lisans/izin koşullarından sonra somut uygulama dosya kapsamını onaya sunmak. Bu geri bildirim kaydında uygulama kodu veya canlı site değiştirilmedi.

### Kalite panosu ve korunacak görünüm davranışı — 30 Ekim 2026

- Tişört/hoodie/şişme mont için A moda illüstrasyonu ve B stüdyo görünümü içeren sentetik kalite panosu yerleşik görsel üretimiyle oluşturulup sohbette gösterildi. Yerel dosya Codex'in üretilmiş görseller klasöründe (yerel yol açık depoda tutulmaz); 1536x1024, 2.017.542 bayt; SHA-256 `43afc5bed8b166612e3c13b05e8010e81dca25993786675236df882f4bb2ef6e`. Bu dosya yayın varlığı veya gerçek satıcı fotoğrafı değildir; proje kodundan referans verilmedi.
- A/B ayrımı özellikle hoodie ve montta zayıf kaldı; pano yüksek ayrıntı/hacim için referanstır, kullanıcı yön seçimi veya nihai stil kabulü değildir. Bağımsız şeffaf kesitler, küçük kart görünümü ve beşer varyant henüz bu raster yönle doğrulanmadı.
- Kod yeniden incelendi: mevcut SVG, kişisel renk/desen/kesim/boy/kol/yaka seçimlerinden üretilir. Tek rasterı SVG yerine geçirmek bu davranışı sağlamaz. Gelecek uygulamada tasarım kimlikleri ve kişisel tercihler korunmalı; fotoğraf gösterimi gerçek ürün-varyant eşleşmesine dayanmalı; desteklenmeyen tercihler sessizce yok sayılmamalı. Raster, 3D avatar giysisi olarak sunulmaz.
- Sonraki iş kullanıcının görsel yön geri bildirimidir; ardından gerçek kart boyutlarında ve kişisel tercihlerle seçilen yaklaşımın önizlemesi hazırlanır. Genişleyen varlık/fotoğraf kapsamı önce onaya sunulur. Mevcut altı tür SVG uygulaması ve otuz eşli karşılaştırma korunur; 36 türe yayılım/canlı yayın yapılmaz. WW-21 açık, sayaç 3/4; kabul sonrası öneri WW-05.
- Bu tur yalnız iki belgenin sonuna kayıt eklendi. Uygulama testlerinin önceki sonuçları yeni raster yönün işlevsel doğrulaması olarak kullanılmadı; uygulama kodu değişmediği için tam test/derleme tekrarlanmadı.

### B yönü seçildi — 30 Ekim 2026

Kullanıcı **B — Stüdyo görünümü** yönünü seçti. Yön sorusu artık beklemiyor; nihai altı tür görsel kabulü henüz yok. WW-21 ve 3/4 yayın sayacı korunur.

Hazırlanacak sonraki kapsam: altı özgün şeffaf PNG (tişört `short-sleeve-tee:0`, gömlek `shirt:0`, hoodie `sweatshirt:1`, mont `puffer:0`, jean `jeans:0`, spor ayakkabı `sneakers:0`), üretim/kimlik manifesti, ayrı yerel stüdyo karşılaştırma üreticisi ve HTML, test ve iki belge. Bu 12 dosyalık genişleme onaydan sonra uygulanır. Üç boyut/açık-koyu zemin ve gerçek mevcut SVG ile karşılaştırma yapılır; kişisel görünüm örnekleri korunur. Rasterın desteklemediği renk/desen/kesim için destek varmış gibi gösterim yapılmaz. Bu aşama uygulama entegrasyonu, ürün fotoğrafı alanı veya yeni 3D model içermez; sonraki uygulama kapsamı kalite sonucuna göre ayrıca belirlenir.

### B stüdyo önizlemesi uygulandı; örneklerin görsel kabulü bekleniyor — 30 Ekim 2026

12 dosyalık genişleme kullanıcı tarafından onaylandı ve hazırlandı. Altı PNG + manifest `artifacts/previews/ww21-studio/` içinde; üretici `scripts/preview/garment-studio-review.tsx`, HTML `artifacts/previews/ww21-studio-comparison.html`, yeni test `tests/garment-studio-preview.test.cjs`. Değişen mevcut dosyalar yalnız bu belge ve PROJECT_GOALS.md'dir. Önceki uygulama kodu, tasarım kimlikleri, kişisel veri ve otuz varyantlı SVG önizlemesi korunur.

- Görseller yerleşik image_gen ile üretildi; tam istemler, tek ayakkabı kenar düzeltmesi, kaynak adları ve SHA-256 manifesttedir. Altısı da 1254x1254 PNG, gerçek alfa içerir ve opak silüetler dosya kenarına değmez. Toplam kaynak boyutu 9.962.765 bayt. Bunlar satıcı/SKU fotoğrafı veya malzeme/termal performans kaynağı değildir.
- HTML altı PNG'yi birer kez gömer. Eski SVG / WW-21 SVG / sabit B örneği ve yalnız-stüdyo görünümü; tür, boyut, zemin kontrolleri; gerçek SVG'den sentetik kişisel örnekler vardır. Renk/desen/kesim desteği sabit raster için varmış gibi sunulmaz. PNG varlıkları uygulama bileşenine bağlanmadı; kalan 24 raster varyant üretilmedi.
- Tekrar üretme: `node --import tsx scripts/preview/garment-studio-review.tsx`. Üretici varlık SHA-256 eşleşmesini doğrular. HTML 13.364.804 bayt, SHA-256 `5f77c16b4460fc24075fa06ab2bd04d135ef00ca5a16c43b2ce6130722821d14`. Üretime bu ham boyutla taşınmaz; bu bir yerel kalite incelemesidir.
- Yeni beş test + mevcut görünüm/illüstrasyon testleri **18/18, 0 atlama, exit 0**. Tam proje `tsc --noEmit --incremental false` ve yeni TSX lint'i exit 0. İlk HTML güncellik testi derleyiciye bağlı function.toString betik farkını buldu; istemci betiği sabit metinle üretildi ve gerçek HTML betiği VM'de çalıştırılarak test edildi. Üretim build/tüm uygulama testleri bu tur tekrarlanmadı.
- Tarayıcıda altı örneğin küçük/orta/büyük alanı, iki zemin, tür ve yalnız-stüdyo kontrolleri incelendi. Gerçek DOM ölçülerinde 1090 CSS px masaüstü ve 263 CSS px dar mobil görünümde taşma yok; büyük mobil karşılaştırma tek sütun, kişisel örnekler filtreden bağımsız. Error/warn kayıtları boş. Fiziksel telefon testi yoktur. Ekran kanıtı görev görselleştirme dizinindeki `ww21-studio-review-desktop.png` dosyasıdır.
- Yerel salt okunur sunucu `http://127.0.0.1:33125/` adresindedir; yalnız bu HTML'i sunar. Sandbox tarayıcı erişimi ve açık kalan kontrol oturumları nedeniyle son sunucu/test/tip kontrolleri normal yerel ortamda yürütüldü. Sunucu ömrü geçicidir; HTML kalıcı teslimdir. Eski SVG HTML SHA-256 değeri `e86258ebdae18b2753f9f2f788f98ddabdd84b88d0804a0f057ea6d63f48291a` ile aynı kaldı.

WW-21 henüz tamamlanmadı: bu altı tek-varyant örneğin kullanıcı kalite değerlendirmesi, ardından kalan varyantlar ve kişisel görünüm davranışını karşılayan uygulama kapsamı gerekir. 36 türe yayılım ve canlı yayın yoktur; yayın sayacı 3/4. Nihai kabul sonrası öneri WW-05 toplu yayın hazırlığıdır.

### Altı B örneği için kullanıcı kalite kabulü — 30 Ekim 2026

Kullanıcı **“Bu kaliteyi temel alalım”** dedi. Altı temel örnek kabul edildi; manifest `six-base-samples-quality-accepted` ve önizleme bildirimi bu durumu kaydeder. Bu, diğer 24 varyant veya uygulama entegrasyonu kabulü değildir; WW-21 açık ve sayaç 3/4 kalır.

Ortak GarmentVisual çağrıları yeniden incelendi. Sabit fotoğraf temsillerini tüm çağrılara koşulsuz uygulamak kişisel görünüm seçeneklerini kaybettirir. Önerilen sonraki kapsam, 24 yeni varyant + yerel optimize edilmiş varlıklar + genel model/tasarım gösterimlerinde ayrı stüdyo bileşeni; kişisel dolap, kişisel özelleştirme ve desteklenmeyen türlerde SVG korunumudur. Temsili görsel ve kişisel görünüm ayrımı görünür/TR-EN olmalıdır. Bu yöntem ve yeni dosyalar kapsam onayından sonra uygulanır; ürün fotoğrafı veri modeli ve 3D avatar bu işin parçası değildir.

Kabul kaydı sonrası beş stüdyo önizleme testi yeniden çalıştırıldı: **5/5, 0 atlama, exit 0**. Tarayıcıda güncel kabul bildirimi doğrulandı; PNG kaynakları değişmedi. Güncel HTML 13.364.856 bayt, SHA-256 `26bcad422d767b86c85063d4ec0ed508a2f1c0fabc22e8014f2ba03e9e4670a0`; önceki HTML özeti kabul öncesi sürüme aittir.

### WW-21 — onaylı otuz model ve yerel entegrasyon; son görsel kabul bekleniyor — 30 Ekim 2026

Kullanıcı kalan 24 PNG + 30 WebP + 19 kod/test/önizleme/belge dosyasını onayladı; kapsam uygulandı. Kabul edilen altı kaynak PNG bayt düzeyinde korunur. Altı tür × beş mevcut tasarım = 30 model; diğer 30 türün SVG akışı ve kişisel görünüm veri modeli değişmez. WW-21 henüz tamamlanmadı, yayın sayacı 3/4.

Tekrar üretim: `node scripts/preview/prepare-garment-studio-assets.mjs`, ardından `node --import tsx scripts/preview/garment-studio-review.tsx`. İlk komut mevcut Sharp ile alfa sınırlarını ölçer, kenar payıyla kırpar, şeffaf 640×640 WebP üretir; içerik SHA-256'sını dosya adına ekler. Manifestten üretilen `lib/garment-studio-assets.ts` yalnız yerel URL/kimlik/boyut/özet içerir. 30 PNG toplamı 46.951.215 bayt, 30 WebP toplamı 1.331.496 bayt. Yeniden optimizasyon tüm çıktılarda bayt eşitliğiyle doğrulandı (exit 0).

`GarmentStudioVisual` genel referanslarda B gösterir; kişisel bağlam, sahip olunan/kullanıcı/barkod parçası veya geçerli kişisel renk/desen/kesim değişikliği varsa eski `GarmentVisual` döner. Düzenleyicinin ana önizlemesi ve dolaptaki kişisel parça SVG kalır; tasarım seçeneklerinde yalnız sabit B referansı gösterilir. Hata durumu URL'ye bağlı tutulur; yüklenemeyen yerel WebP için SVG ve TR/EN hata notu vardır. Alt yazı/alt metni sentetik model olduğunu açıklar. Katalog, galeri, genel profil, öneri ve OutfitBoard çağrıları bu ayrımı kullanır; kayıt işlemleri ve 3D değişmez.

Doğrulama kanıtı:

- Uygulama aşamasında hedefli 24 test, tüm testlerde 158 toplam/153 başarılı/0 hata/5 koşullu atlama; `tsc --noEmit --incremental false` ve `next build` exit 0. Atlamalar dört PostgreSQL ve bir isteğe bağlı Linux/Docker kontrolüdür.
- Son devam turunda stüdyo varlık/önizleme/arayüz testleri 11/11 geçti. Yeni bileşen, optimizasyon/önizleme betikleri ve ilgili temiz çağrılarda ESLint exit 0. Önceden var olan OutfitRecommendation effect/dependency bulguları ve WardrobeModal img uyarısı aynı: 1 hata + 4 uyarı; bunlar kapsam dışı tutuldu.
- Gerçek uygulama galerisinde altı türün beşer B kimliği ve yükleme kontrolü; TR/EN açıklamalar; kişisel ana SVG; kaydedilmeden renk/desen taslağı; 337 CSS px mobil düzenleyici taşma kontrolü doğrulandı. Tek bir WebP geçici yeniden adlandırılarak gerçek 404 → SVG dönüşümü görüldü; dosya SHA-256 doğrulanarak geri konuldu ve tekrar normal yüklendi. Kullanıcı kişisel kayıtları okunmadı/değiştirilmedi; test ayrı yerel origin üzerinde varsayılan örnek dolapla yapıldı.
- Güncel HTML 2.036.654 bayt, SHA-256 `b77a044933629151a296ea3b2f90538f99fc794a5bb1216c54354882f7b8a2dc`. Manifest SHA-256 `d0f5eed628df7cd5ef3b3196cb2899620a7da72cb2165a8afa3f0506884c8894`. Önceki altı örnekli HTML özetleri geçmiş aşamaya aittir. Güncel ekran kanıtı görev görselleştirme dizinindeki `ww21-studio-variants-review.png`, `ww21-mobile-editor-en.png`, `ww21-image-fallback.png`, `ww21-app-gallery-tr.png` dosyalarıdır.

Yerel inceleme `http://127.0.0.1:33125/`; uygulama kontrolü `http://127.0.0.1:33126/`. Sunucular geçicidir. Fiziksel telefon testi ve veritabanı bağlı gerçek ürün kataloğu uçtan uca kontrolü yapılmadı. Yerel next start standalone uyarısı verdi; bu çalışma yayın/standalone paket doğrulaması değildir. Canlı yayın, yeni bağımlılık ve gerçek satıcı fotoğrafı desteği yoktur.

Sıradaki işlem: tüm 30 modelin kullanıcı görsel kabulü. Kabul sonrası WW-21 kapanır; **WW-05 toplu yayın hazırlığı ve geri dönüş planı** önerilir. WW-01 sağlık/katalog ile WW-02 yedek/geri yükleme kanıtları yayın öncesinde uzlaştırılır. Görsel kabul olmadan hedef tamamlandı veya sayaç 4/4 diye kaydetme.

### WW-21 nihai kullanıcı kabulü ve kapanış — 30 Ekim 2026

Kullanıcı **“30 modeli ve yerel entegrasyonu kabul ediyorum”** yanıtını verdi. **WW-21 tamamlandı; dört hedeflik yayın sayacı 4/4** (WW-22, WW-24, WW-23, WW-21). Önceki bekleme kayıtları tarihsel durumdur. Kabul, altı türün toplam otuz stüdyo modelini ve yerel temsili/kişisel görünüm ayrımını kapsar; diğer 30 tür, gerçek satıcı fotoğrafı veya canlı yayın kapsamına genişlemez.

Manifestin `finalReview` kaydı nihai kararı ve 2026-10-30 tarihini taşır; ilk altı örneğin `userReview` kaydı korunur. Durum `thirty-variants-and-local-integration-accepted`. Optimizasyon betiği nihai kabulü koruyacak biçimde güncellendi; önizleme üreticisinin bekleme bildirimi kabul bildirimi oldu. İlgili mevcut test beklentileri yeni durumla eşleştirildi. PNG/WebP içerikleri, uygulama bileşenleri ve kişisel kayıtlar bu kapanış turunda değişmedi.

Kabul güncellemesinden sonra 11 stüdyo testi geçti (0 hata/atlama, exit 0). Güncel manifest 70.907 bayt, SHA-256 `54ae6ac3ae9d066a07cc6c2a9fad21ef1be9acd3ba1cc2055b69d62a60f67be1`; HTML 2.036.717 bayt, SHA-256 `94e601fce1c846419811145a73f1059e3b85a6228cbda89ea7207e524a5ff40d`. Önceki özetler kabul öncesi sürümleri tanımlar. Bu tur yeni üretim build gerektiren uygulama değişikliği yapılmadı; önceki build/test kanıtları yukarıdadır. Fiziksel telefon ve gerçek katalog/veritabanı kontrollerinin yapılmadığı bilgisi korunur.

**Sıradaki öneri WW-05 — dört hedeflik toplu yayın hazırlığı ve geri dönüş planı.** Önce mevcut sürüm ve kurulumun salt okunur incelemesi, sonra somut dosya kapsamı onayı; WW-01 sağlık/katalog, WW-02 yedek/sunucu dışı kopya/geri yükleme kanıtları ve ortak sunucu/proxy durumu uzlaştırılır. Tek sürüm kimliği, paket, veri korunumu, uygun standalone/Compose başlatma ve geri dönüş kanıtları hazırlanır. Canlı yayın ayrı inceleme ve onay adımıdır; bu kullanıcı kabulü yayını başlatmaz.

Kapanış doğrulaması: optimizasyon betiği normal yerel ortamda yeniden çalıştırıldı; nihai kabul, manifest/eşleme ve bütün üretim varlıkları bayt düzeyinde aynı kaldı (exit 0). İki değişen betikte ESLint exit 0. Yeni kaynak/üretim görseli oluşturulmadı.

### WW-05 — onaylı hazırlık sürüyor; canlı yayın yok — 30 Ekim 2026

Aktif kullanıcı hedefi WW-22/24/23/21'i tek yayın grubunda hazırlamak. 23 dosya ve 0.6.0 sürümü onaylandı; paket/kilit dışında bağımlılık sürümleri değiştirilmedi. Yeni profil `deploy/release-profile.json`, rehber `deploy/RELEASE.md`, ayrıntılı kanıt `deploy/RELEASE_EVIDENCE.md`. Mevcut kirli çalışma kopyası ve önceki yayın arşivi korunur; commit/push/SSH anahtarı erişimi yok.

`check-release.mjs --all` aynı kaynakta seri tam CJS testleri (163/158 başarılı/5 koşullu atlama/0 hata), tsc, üretim build ve gerçek Linux Docker provasını exit 0 ile bitirdi. Kaynak `3ae5bb5e57d21d4837604d19ea7dc7d37d8095d50aceae21f0131085caaeff12`; dört komutun kaydı `.data/release-checks/0.6.0.json`. Paketleme bu kayıtla aynı kaynağı zorunlu tutar; sırları/çalışma verisini/ham önizleme kaynaklarını dışlar, mevcut arşivi ezmez, kaynak dosya hash manifesti üretir. `--verify-source` çıkarılmış paketi kontrol eder.

Prova, doğrulanmış 19 Ekim arşivinden eski imaj üretir; 146 ürün/36 tür, DB satır özeti, eski ve yeni topluluk yazısı, WW-24 rapor kalıcılığı/tekrar, otuz WebP ve eskiye geri dönüş/yeniden ileri geçişi sınar. Ayrı DB/volume'larda eski-yeni yedek geri yüklemesi, reader ve özel dosya izinleri geçti. `recovery.mjs` bu sentetik prova için şifreli doğrulama yardımcısıdır; bulunan ortak Restic canlı sisteminin yerine otomatik kurulmaz. Tam canlı kurtarma/copy kanıtı sayılmaz.

Kullanıcı SSH giriş adımı eksikliğini düzeltti: önce bağlantıyı açtır, sonra Linux komutu iste. Rehberde PowerShell Read-Host ile anahtar yolu/güncel sunucu adresi girişi vardır; agent anahtar ağacını okumaz/kullanmaz ve eski adresi kurtarmaz. Node komutları Bash history/dolar dönüşümüne karşı tek tırnaklı ve kod bloklu verilir. İlk iki hatalı sağlık/inspect komutu başarılı sayılmadı; düzeltilmiş çıktılar alındı.

Canlı: katalog/HTTPS 200, DB 146/36/23; Weathrobe/Doctus aynı `weathrobe-preview_default` ağında. Gerçek imaj/volume kimlikleri kanıt dosyasında. Caddy hâlâ eski Weathrobe kurulumunun deploy/Caddyfile dosyasını bind ediyor; eski kaynak dizini silinmez ve proxy yeniden başlatılmaz. Kapasite 38 GB boş disk / yaklaşık 10 GiB kullanılabilir bellek.

Ortak yedek işleri ve 23 Ekim PC makbuzu bulundu; Weathrobe günlük servisinin son sonucu 30 Ekim success/0, restore 23 Ekim success/0. Kullanıcının hatırladığı sistemi yok sayma. NOk-Doctus/deploy/shared-backups README ve kodu yalnız okundu: Oracle Object Storage/Restic, ayrı şifreler, PostgreSQL dump+roller, community ve runtime.env kapsamı var; reports_data desteği kaynakta görünmüyor. Kurulu script hash'i ve hazır --health/--operations-status çıktısı istendi. Başka depo veya canlı yardımcı değişikliği henüz onaylanmadı/uygulanmadı; gerekirse somut ek kapsam istenir. WW-05 ve canlı geçiş kapıları açık kalır.

### WW-05 hazırlık arşivi doğrulaması — 30 Ekim 2026

0.6.0 hazırlık paketi oluşturuldu; 248 dosya çıkarılarak tam envanter/tek tek özet ve sürüm/kaynak kimliği doğrulandı (exit 0). Arşiv SHA-256: `7904180e09d30b97d2eaba1740218f82db619b7b03909de791effee9ff5abd96`. Ayrıntılar deploy/RELEASE_EVIDENCE.md içinde. Arşiv mevcut test kapısıyla aynı kaynakta; eski arşiv korunuyor. Bu not paket sonrasında eklendi, arşiv değiştirilmedi. Ortak canlı yedeğin yeni reports_data kapsamı ve güncel bağımsız kopya/geri yükleme kanıtları açık; WW-05 tamamlanmadı ve canlı yayın yapılmadı. Sıradaki adım mevcut nok-backup sağlık/işletim özeti ve kurulu yardımcı hash eşleştirmesidir.

### WW-05 ortak yedek kaynak eşleşmesi — 30 Ekim 2026

Kullanıcı --health/--operations-status çıktısını sağladı: günlük yedek kaydı sağlıklı; son yedek yaklaşık 9 saat 36 dakika, tam kontrol yaklaşık 3 gün 9 saat, restore ve bağımsız kopya yaklaşık 6 gün 19 saat yaşında; eşiklere göre sorun yok. PC onayı tarihsel checksum aktarım makbuzudur, güncel dosya/restore denemesi değildir. Kurulu nok-backup hash'i yerel ortak kaynakla birebir eşleşti; yeni reports_data bu kodda toplanmıyor. Ayrıntı deploy/RELEASE_EVIDENCE.md içinde. Ortak yardımcıya rapor desteği için ek kapsam onayı istenecek; sunucu veya başka depo henüz değiştirilmedi. WW-05 açık, canlı yayın ayrı onayda kalır.

### WW-05 güncel bulut yedeği geri yükleme kanıtı — 30 Ekim 2026

Kullanıcının 13:48:50 Türkiye saati çıktısı: son sağlık kaydıyla aynı snapshot için restore_test ok / postgres_restore ok. Kaynak sürümü 0.3.0; 146 ürün, 0 topluluk kaydı. Bu, bugün ayrı test ortamında geri açılmış mevcut canlı sürüm yedeğidir; 0.6.0 yayını veya rapor alanı koruması değildir. Ayrıntı deploy/RELEASE_EVIDENCE.md içinde. Ek ortak yardımcı dosya kapsamı onayı ile yeni rapor desteği, bağımsız kopyanın gerçek dosya doğrulaması ve sonraki yayın kapıları açık; canlı yayın yapılmadı.

### WW-05 — ortak yardımcı rapor desteği yerelde doğrulandı — 30 Ekim 2026

Kullanıcının devam talebiyle son sunulan sekiz dosyalık ek kapsam uygulandı. Ortak helper 0.0.5; 62 offline test, gerçek sentetik PostgreSQL/SQLite restore, Restic şifreli kopyadan rapor restore ve gerçek Linux named-volume/UID izin testi geçti. Raporlar eski uygulamaya dönüşte de açık volume eşlemesiyle korunuyor; 0.6.0'da eksik/bozuk kapsam hata sayılıyor. Helper paketi 14 kaynak dosyasıyla byte eşleşmesi ve checksum kontrolünden geçti; SHA-256 648088b7f9b097d480dc4e0f6d22f5cb9b95556301965509b5832959b785d57a. Doctus uygulama kodu/sürümü ve gerçek sunucu değiştirilmedi. Ayrıntı deploy/RELEASE_EVIDENCE.md.

Sıradaki WW-05 adımı: güncel bağımsız PC kopyası ve gerçek dosya doğrulaması; ardından ortak yardımcı kurulumu için somut ayrı onay ve Oracle ARM/yayın hazırlığı. Telegram günlük başarı özeti ve yetkili /durum, /yedek, /surum, /kapasite, /kontroller önerisi ortak Doctus HEDEFLER.md 19'a kaydedildi; henüz bot kodu veya mesaj ayarı değişmedi. Aktif oturum sayımı ayrıca ölçüm/mahremiyet kapsamı gerektiriyor. WW-05 açık, uygulama yayını ayrı onayda.

### WW-05 güncel bilgisayar yedeği aktarım hazırlığı — 30 Ekim 2026

Ortak export-pc aracı yeni şifreli nok-backups-pc-20261030T112434Z-7342e85b.tar.gz arşivini sunucuda hazırladı; SHA-256 e443197e486843ca2aa0f778ec577278465c4cfa0e0a4fab0825e01a04f78894. Kullanıcı özel sunucu indirme kopyası için tam OK çıktısını sağladı. Bu bağımsız PC kopyası değildir; Windows PowerShell aktarım/gerçek dosya hash adımı verildi, sonucu bekleniyor. Kaynak snapshot kimlikleri/zamanları ve ayrı parola saklama durumu ayrıca uzlaştırılacak. PC makbuzu, gerçek sunucu yardımcısı ve uygulama değiştirilmedi. Ayrıntı deploy/RELEASE_EVIDENCE.md.

### WW-05 bağımsız bilgisayar kopyası tamamlandı — 30 Ekim 2026

Kullanıcı SCP %100 / yerel SHA-256 OK verdi. Agent yalnız belirtilen NOk_Backups/nok-backups-pc-20261030T112434Z-7342e85b.tar.gz dosyasının SHA-256/manifestini bağımsız salt okuma kontrolüyle doğruladı: 8.240.806 bayt, e443197e486843ca2aa0f778ec577278465c4cfa0e0a4fab0825e01a04f78894. Weathrobe kaynak snapshot'ı bugün buluttan geri açılmış fb68ff0e… ile aynı; 30 Ekim iki site verisi bulunuyor. Sunucu makbuzu kullanıcı tarafından 14:32:24 Türkiye saatinde user_confirmed olarak güncellendi. İki Restic parolasının bağımsız güvenli saklandığı kullanıcı tarafından doğrulandı; değerleri okunmadı. Bilgisayarda gerçek şifre çözme/DB restore yapılmış sayılmaz. Ayrıntılar deploy/RELEASE_EVIDENCE.md. ARM64 yerel imaj derlemeleri başladı; henüz sonuç yok. Gerçek sunucu yardımcı/uygulama kurulumu ayrı onayda.

### WW-05 ARM64 ve yayın incelemesi — 30 Ekim 2026

Ek ARM64 runner/tools build ve gerçek geçici ARM64 PostgreSQL/Node çalışması başarılı: 146 ürün/36 tür, sağlık/ana sayfa HTTP 200, rapor oluşturma ve tekrar göndermede çoğaltmama, özel rapor erişiminin reddi, üretim görseli SHA ve native optimizasyon, Docker CLI kontrolü geçti. Kaynak 3ae5bb5e57d21d4837604d19ea7dc7d37d8095d50aceae21f0131085caaeff12 aynı. İlk geçici prova yanlış görsel yolu nedeniyle başarısızdı; manifest yolu okunarak yalnız prova düzeltildi, son tam koşu geçti. Kendi kaynakları temizlendi. Bu ARM64 emülasyon kanıtıdır, Oracle yayını değildir.

deploy/RELEASE.md ayrı canlı onay için aktarım/kimlik, eski imaj koruması, helper'ın yalnız üç dosyalık kurulumu, aynı volume/ağ ile yalnız uygulama geçişi ve eski kaynak/aynı güncel veriyle geri dönüş sınırlarını somutlaştırır. Güncel bağımsız PC kopyası ve makbuzu, ayrı Restic parola saklama beyanı tamamdır. Nihai uygulama arşivinin son doğrulaması kaydedilecek. Gerçek kurulum/yayın ve sonrasındaki rapor yedeği çalışması ayrı onay kapsamıdır; fiziksel telefon WW-03, Telegram bot genişletmesi ayrı sonraki hedeftir.

### WW-05 tamamlandı — yalnız yayın hazırlığı — 30 Ekim 2026

[x] Kullanıcı onaylı toplu hazırlık tamamlandı. Nihai weathrobe-0-6-0.tar.gz: 6.250.863 bayt; SHA-256 26feab20e2bb8ee92c37663ea8ceaf0ed99ef5d7b94e4726894bd0750dc8612d. Çıkarılmış 248 dosya ve kaynak manifesti doğrulandı; 0.6.0 / 3ae5bb5e57d21d4837604d19ea7dc7d37d8095d50aceae21f0131085caaeff12. Aynı kaynak için test/type/build/Linux geri dönüş ve ek ARM64 gerçek çalışma kanıtları mevcut. Ortak helper 0.0.5 ayrıca paketlendi ve 62 test/kurtarma/kopya/izin provalarıyla doğrulandı. Gerçek mevcut yedek restore, aynı snapshot'lı bağımsız PC dosyası/makbuzu ve ayrı parola saklama beyanı uzlaştırıldı. Önceki arşivler ve kişisel kayıtlar korundu; anahtar ağacına erişim veya Git gönderimi yok.

Ayrıntılı son kanıt deploy/RELEASE_EVIDENCE.md, ayrı canlı geçiş/geri dönüş sınırı deploy/RELEASE.md içinde. Bu kapanış arşiv üretiminden sonra eklenmiştir; arşivin belge anlık görüntüsü değiştirilmedi. Sunucuda helper kurulumu, app 0.6.0 yayını veya yeni rapor kapsamının gerçek canlı yedeği yapılmış sayılmaz; hepsi ayrı onaylı canlı hedefin kabul adımlarıdır. Fiziksel telefon WW-03, Telegram günlük özet/sorgu botu ayrı hedeftir.

Sıradaki önerilen hedef: kontrollü canlı kurulum/yayın. Önce güncel hedef/geri dönüş malzemesini tekrar kontrol et; ayrı kullanıcı onayıyla helper'ın yalnız gözden geçirilmiş üç dosyasını ve yalnız wear-weather uygulama servisini değiştir; DB/Caddy/Doctus kimliklerini ve mevcut verileri koru; gerçek sağlık/katalog/yeni rapor yedeği ile kabulü doğrula. Onay olmadan başlatma.

### 2 Kasım 2026 — kontrollü canlı geçiş önkontrolü sürüyor

Kullanıcı devam talebi sonrası SSH bağlantısını doğruladı. Yerel 0.6.0/helper 0.0.5 arşivleri aynı checksum'larda, runtime kaynak kapısı aynı kimlikte passed. Kullanıcı dört canlı konteyner/imaj/volume ve ortak ağın 30 Ekim kimlikleriyle aynı olduğunu doğruladı; helper hâlâ 0.0.3/6da1d7da…; gerçek kurulum yok. Disk/bellek yeterli. Weathrobe günlük yedeği healthy, bugünkü snapshot c80a9196…; önceki restore kanıtı bu farklı snapshot'ın denemesi sayılmıyor.

Telegram bucket uyarısının nedeni >8 günlük manuel kapasite kaydı. Yeni Oracle Usage gözlemi yaklaşık 8,79 MiB / 81 nesne / 0 multipart. 9.216.983 yaklaşık byte ve aynı 5 GiB işletim bütçesiyle kapasite kaydı güncelleme + iki uygulama sağlık/işletim okuması istendi; sonucu bekleniyor. Doğrudan mesaj gönderme, service restart, helper veya app değişikliği yok. Ayrıntılar deploy/RELEASE_EVIDENCE.md. Sıradaki adım güncel sağlık/kapasiteyi, kurtarmayı ve korunacak eski imajı doğrulayıp kontrollü aktarıma geçmek; WW-05 hazırlık kapanışı değişmedi.

### 2 Kasım — kapasite ve güncel Weathrobe kurtarma geçti

11:18 Türkiye saati kullanıcı çıktısı: yaklaşık kapasite kaydı yenilendi; iki uygulama healthy, işletim/disk/bucket attention=false. Bütçe ve eşikler değiştirilmedi; doğrudan Telegram gönderilmedi. 11:21'de bugünkü c80a9196… Weathrobe snapshot'ı ayrı ortamda restore_test ok / postgres_restore ok verdi: kaynak 0.3.0, 146 ürün/0 topluluk. Eski 30 Ekim snapshot'ıyla karıştırılmadı. Sonraki adım çalışan eski imajı kimlik kontrolüyle weathrobe-rollback:20261102-b87dd78e4bd2 etiketinde korumak; blok verildi, sonucu bekleniyor. Kaynak aktarımı/gerçek helper-app kurulumu henüz yok. Ayrıntı deploy/RELEASE_EVIDENCE.md.

### 2 Kasım — geri dönüş imajı korundu, paket aktarımı bekleniyor

Kullanıcı weathrobe-rollback:20261102-b87dd78e4bd2 etiketinin mevcut b87dd78e… imajına bağlandığını verified=true / services_restarted=false çıktısıyla doğruladı. Yeni build başlamadan eski imaj korundu. Yerel app/helper arşivleri ve app manifesti yeniden hash kontrolünden geçti; aynı paketler kullanılacak. Kullanıcının ayrı PowerShell penceresinde yeni nok-release-incoming-0.6.0-20261102 klasörüne beş dosya aktaracağı blok verildi; sonucu bekleniyor. Agent anahtar ağacına erişmedi. Sonraki adım sunucu checksum/içerik doğrulaması; helper/app kurulumu henüz yok. Ayrıntı deploy/RELEASE_EVIDENCE.md.

### 2 Kasım — gerçek sunucuda imaj ve başlangıç verisi doğrulandı

Kullanıcı çıktıları: iki arşiv ve açılan 248/14 dosya doğrulandı; 0.6.0 runner/tools gerçek ARM64 sunucuda aynı 3ae5bb5e… kaynağından derlendi. Ortak helper 0.0.5 kuruldu, önceki üç root dosyası özel geri dönüş klasöründe korundu; uygulama/DB/Caddy/Doctus yeniden başlatılmadı, iki uygulama yedek sağlığı normal. Eski gizli ayarlar yeni dizine byte eşitliği doğrulanarak mode 600 kopyalandı. İmaj override ve veri kontrol betiği checksum'ları, ardından Compose config --quiet doğrulandı.

Geçiş öncesi gerçek veri referansı: katalog SHA-256 `bab6429eb6ee3b3615df76b38c72b30ea6630fde9d5168ece68b7c8e3d247afd`; topluluk present=false/count=0/sha256=null; eski app tam kimliği ve çalışır durumu doğrulandı. Uygulama henüz eski sürümde. Sıradaki kapı yalnız şema hazırlama, ardından aynı içerik özetleriyle veri korunumu karşılaştırması. App geçişi, rapor kalıcılığı ve yeni raporları içeren gerçek yedek/restore henüz tamamlanmadı. Ayrıntılı imaj/yardımcı/geri dönüş kimlikleri deploy/RELEASE_EVIDENCE.md içinde. Önceki bekleyen aktarım notlarının güncel durumu budur; hazırlık hedefi ile canlı kabul ayrı tutulur.

### 2 Kasım — şema hazırlığı sonrası veri korundu

Gerçek sunucuda 0.6.0 catalog-migrate başarılı. after-migrate katalog SHA-256 başlangıçtaki bab6429e… özetiyle birebir aynı; topluluk present=false/count=0/sha256=null. Eski uygulama kimliği/imajı hâlâ çalışıyor. Sonraki adım yalnız wear-weather servisini doğrulanmış 0.6.0 imajına geçirmek ve ardından sağlık/sürüm/veri/diğer servis korunumu doğrulaması. Geçiş sonucu ve yeni raporları kapsayan gerçek backup/restore henüz bekliyor. Ayrıntı deploy/RELEASE_EVIDENCE.md.

### 2 Kasım — 0.6.0 çalışıyor; son yayın kontrolleri sürüyor

Yalnız wear-weather geçişi yapıldı, reports_data oluşturuldu. Ayrı after-deploy kontrolü HTTP 200/status ok, version 0.6.0, doğru 3ae5bb5e… kaynak, arm64, 146 ürün/36 tür verdi. Katalog SHA-256 bab6429e… ve topluluk yok/0 durumu başlangıçla aynı; DB kimlik kapısı geçti. Yeni uygulama kimliği d162cc0c…, imaj 51f284b7…. Dış HTTPS, DB/Caddy/Doctus son kimlik kontrolü, rapor güvenliği/kalıcılığı ve yeni rapor kapsamlı gerçek backup/restore henüz bekliyor. Yayın tamamlandı kabul edilmedi. Ayrıntı deploy/RELEASE_EVIDENCE.md.

### 2 Kasım — HTTPS ve geri bildirim kabul kapıları geçti

Gerçek dış HTTPS sayfa/sağlık 200; doğru 0.6.0 kaynak ve 146 ürün/36 tür. DB/Caddy/Doctus tam kimlikleri/imajları değişmemiş, hepsi çalışıyor. Sentetik geri bildirim ilk POST 201/tekrar 200 ve tek kayıt; özel okuma 405/dosya 404, kötü Origin 403/onaysız gönderim 400; güvenli çerez ve UID1001/0700/0600 geçti. Önce 0, sonra 1 rapor; sentetik kayıt yedek kanıtı için saklanıyor. Sonraki kapı yeni sürüm ve raporu içeren gerçek backup + ayrı ortam restore-test, ardından sunucu dışı güncel kopya ve kullanıcı görünüm kontrolü. Nihai yayın kapanışı henüz verilmedi. Ayrıntı deploy/RELEASE_EVIDENCE.md.

### 2 Kasım — 0.6.0 ve raporun gerçek kurtarma kanıtı tamamlandı

Yeni gerçek snapshot 86d5899bf1c8173c0289fdc9a202c394ec3da448d0d8fc240b8c6904bbcb6590; yedek/depo kontrolü başarılı. Ayrı ortam restore-test 13:14 Türkiye saatinde ok: source_version 0.6.0, PostgreSQL ok, 146 ürün/0 topluluk, reports_coverage present/report_count 1. Sentetik rapor yeni ortak yedekten geri açıldı; canlıya restore yapılmadı. Sıradaki kapı güncel bağımsız bilgisayar arşivi hazırlama/aktarım/hash/makbuz ve son kullanıcı görünüm kontrolü. Eski bilgisayar kopyası korunuyor; yeni snapshot'ı içerdiği iddia edilmiyor. Ayrıntı deploy/RELEASE_EVIDENCE.md.

### 2 Kasım — güncel bilgisayar yedeği ve makbuz tamamlandı

Yeni nok-backups-pc-20261102T101534Z-88236fe3.tar.gz arşivi mevcut NOk_Backups klasörüne aktarıldı; kullanıcı ve agent tam dosya SHA-256 kontrolü 613b12ff… ile eşleşti. Eski kopya korundu. Sunucu aktarım makbuzu gerçek kontrolden sonra 13:21:57 Türkiye saatinde user_confirmed olarak güncellendi. Şifre çözme veya bilgisayar arşivinden restore iddiası yok; yeni Weathrobe bulut snapshot'ının ayrı ortam geri yüklemesi zaten başarılı. Son işletim/volume/görsel HTTP kontrolleri ve kullanıcının tarayıcı görünüm/kayıt kontrolü bekleniyor. Ayrıntı deploy/RELEASE_EVIDENCE.md.

### 2 Kasım — canlı teknik kapılar geçti; son tarayıcı kabulü bekleniyor

13:25 Türkiye son kontrolü: uygulama healthy, doğru eski community/yeni reports volume'ları ve ortak ağ; iki sitenin yedek sağlığı normal, birleşik operations attention=false. Güncel bağımsız kopya makbuzu doğrulandı. 30 gerçek üretim görselinin dış HTTPS tam hash eşitliği ve Next image optimizasyon 200 kontrolü geçti. Sağlık/katalog/veri, rapor güvenliği/kalıcılığı, yeni raporlu snapshot gerçek restore ve bilgisayar kopyası kanıtları deploy/RELEASE_EVIDENCE.md içinde.

Nihai yayın kabulü için aynı tarayıcı/origin'de sürüm, varsa kişisel kayıtlar, gece/ileri tarih arayüzü, geri bildirim penceresi ve stüdyo görsellerinin kullanıcı kontrolü bekleniyor. Site verileri temizlenmeyecek. WW-03 fiziksel telefon/kapsamlı akışları bu teknik sonuçlarla bitmiş sayılmaz. Yayın kabulünden sonraki önerilen hedef WW-03; bu öneri yeni hedef başlatıldığı anlamına gelmez.

### 2 Kasım 2026 — kullanıcı kabulü alındı; kontrollü canlı yayın kapandı

Kullanıcı sürüm 0.6.0, gece Açık gece etiketi/ileri tarih seçimi, geri bildirim penceresi ve yeni stüdyo görsellerini doğruladı. Önceden kişisel kayıt bulunmadığını belirtti; gerçek kullanıcı kayıt korunumu uygulanamadı, başarılı sayılmadı. Teknik sağlık/veri/rapor izinleri, 30 görsel HTTPS hash/optimizasyon, raporlu gerçek snapshot restore ve güncel bağımsız PC kopyası/makbuzu kanıtları tamam. DB/Caddy/Doctus ve eski geri dönüş imajı korundu.

WW-05 hazırlık (30 Ekim) ve ayrı onaylı canlı geçiş/kısa kabul (2 Kasım) tamamlandı. WW-01 ve WW-02 bu yayın kapsamındaki kabul kanıtlarıyla uzlaştırıldı; düzenli bakım devam eder. Fiziksel telefon ve kapsamlı masaüstü akışları **WW-03 açık**, önerilen sonraki hedeftir; henüz başlatılmadı. Ayrıntılı kapanış ve sınırlar deploy/RELEASE_EVIDENCE.md içinde. Doğrulanmış 0.6.0 kodu/arşivi değiştirilmedi; bu kapanış belge güncellemesidir.


<!-- nok-release-center-local-2026-11-02 -->
## 2 Kasım — WW-27 ortak yayın merkezi ve WW-28 güvenlik sırası

Kullanıcı dosya/depo kapsamını onayladı; kaynak depoları mevcut görünürlükte kalacak, yalnız yeni yayın depoları private olacak. GitHub işlemlerini kullanıcı GitHub Desktop ile yapmayı seçti. Ortak merkez `NOk_Sites&Extensions` klasörü altında dört ayrı yerel Git deposu: NOk-Release-Core, NOk-Weathrobe-Release, NOk-Doctus-Release, NOk-FilmDeck-Release. Üst klasör tek depo yapılmadı. Yalnız gözden geçirilmiş otomasyon kaynakları commit edildi; uygulamaların mevcut commitlenmemiş işleri topluca commit/push edilmedi. Mevcut NOk-Tools runtime kopyası korundu.

| Hedef | Durum / kabul sınırı |
| --- | --- |
| WW-27 / Doctus 18 — ortak yayın otomasyonu | Yerel kurulum/test tamam; dört private GitHub Publish, uzak CI ve ilk yeni otomatik gerçek yayın/mağaza kabulü bekliyor. Tek operatör release komutu, hash/makbuz, detached kalıcı iş/durum, yalnız hedef uygulama, yedek/izole restore, PC kopyası/hash/makbuz akışı uygulandı. Varsayılan plan; gerçek işlem açık --apply ve o sürümün kullanıcı onayı gerektirir. |
| WW-28 — üç projede güvenlik ve görünürlük incelemesi | Sonraki öncelik. Yalnız Weathrobe/Doctus/FilmDeck public kaynak/Git geçmişi, işletim bilgileri, artifact/log/issue içerikleri, yetkili API ve kullanıcı veri sınırları incelensin. Riskli yapı için private depo/sunucuya özel yapılandırma/sır yönetimi uygunluğunu belirle; bulguları sır basmadan kaydet, görünürlük/izin/geçmiş veya anahtar değişikliklerini somut kapsamla onaya sun. Private yapmak tek başına uygulama güvenliği veya geçmiş sızıntının giderilmesi sayılmaz. |
| WW-03 | Açık; kullanıcı tercihiyle otomasyon ve güvenlik önceliğinin ardından kapsamlı masaüstü/gerçek telefon kabulü. |

Yeni motor 0.1.0: 11 ortak Node + 9 paket/sahte mağaza testi =20/20; ağsız Linux ortamında Weathrobe 8 + Doctus 3 + kalıcı iş 7 =18/18. Gerçek SSH/sunucu/magaza kullanmadan başarılı ve başarısız geçiş, yalnız uygulama geri dönüşü, kaynak/adapter değişikliği, kesilmiş iş, yedek/PC kopyası hataları sınandı. FilmDeck kaynak 0.7.7.2 için 180/180 Node testi geçti, iki tarayıcıya uygun 14'er runtime dosyalı ZIP üretildi; paket makbuzları kaynak ve otomasyon kimliklerine bağlandı, not-submitted. Yeni server adaptörlerinin gerçek canlı kabulü yapılmadı. GitHub prepare workflow'u plan üretir; tam uygulama hazırlığı/transfer yerel komuttadır; üretim SSH/mağaza sırları GitHub'a taşınmadı.

Codex/Claude kullanıcı düzeyi ve üst klasör notları ile mevcut üç projenin AGENTS/CLAUDE bağlantıları kuruldu (10 dosya, mevcut kurallar korunarak). Yeni site/eklenti projeleri merkezde register ve incelenmiş hedef profiliyle kendi yapılarını kuracak; eksik adaptor registered-not-ready durumunda durur. Parent notu tek başına her Git köküne otomatik uygulanır varsayılmadı; global ve proje içi bağlantılar birlikte eklendi. Kuralın bu sohbete yüklenmesi görüldü; başka yeni sohbet ajanı başlatılmadı.

Merkezdeki README.md, VALIDATION.md, GITHUB_DESKTOP.md ve ROADMAP.md güncel kullanım/kanıtları taşır. Doctus'un eski 0.0.10 arşiv/baz/adaptör hash'leri sağlam, güncel kaynak eski native makbuzla uyuşmadığından verify beklenen şekilde durur; yeni sürüm/kanıt gerekir. Weathrobe'un mevcut 0.6.0 kaynak/arşiv kapısı doğrulandı; aynı canlı sürümü yeniden yayınlamak için kullanılmaz. Bu kurulum gerçek siteleri, verileri veya mağaza hesaplarını değiştirmedi; private GitHub depoları kullanıcı Publish sonrası ayrıca doğrulanacak.

<!-- ww28-source-ci-2026-11-02 -->
## WW-28/1 — 2 Kasım 2026, CI kapsamı

Kaynak CI için npm check, test/typecheck ve audit komutları; lint kapsamı app/components/hooks/lib, özel/üretilen dizinler hariç. State/effect düzeltmeleri hydration, modal açılışı, seçimden çıkan anchor ve iptal edilen şehir araması akışlarını korur. Ek onay: tests/weather-plan-ui.test.cjs mock'u useSyncExternalStore/server snapshot ve render-phase tekrarını destekleyecek; yarış/kayıt koruma kontrolleri kapatılmayacak.

Bağımlılık sürümü/lock, kişisel anahtarlar, üretim ayarları, manifest, Git görünürlüğü ve eski yayın arşivleri değişmedi. Ayrıntılı kanıt ve kalan işler: ../NOk_Sites&Extensions/NOk-Release-Core/docs/WW28_SECURITY_AND_CI_AUDIT.md. Yerel doğrulama sonuçları aşağıya eklenecek; GitHub koşuları kaynaklar gözden geçirilip ayrıca gönderildikten sonra doğrulanmalı.

### WW-28/1 yerel doğrulama sonucu

2 Kasım 2026: Weathrobe lint 0 hata / 8 mevcut uyarı; typecheck ve temiz Linux üretim build'i geçti. Linux CJS 158 geçti / 0 başarısız / 5 bağlamsal skip; ayrı PostgreSQL grupları 1/1 ve 21/21, Docker rapor grubu 9/9 geçti. Eski 74 ürünlü snapshot testi bu tur çalıştırılmadı. Sentetik Edge TR/EN, kayıt korunumu, modal/arama ve 390px kaynak modalı kontrolleri geçti; fiziksel telefon değildir. Tüm projelerin yeni npm güvenlik eşikleri geçti; orta geliştirme bulguları açık kayıtta. Uzak CI, gerekli check/ruleset ve yeni otomatik CD kabulü henüz yok.

Sonraki adım: gözden geçirilmiş kaynak/CI dosyaları için ayrı commit/push kapsamı ve gerçek GitHub koşularının doğrulanması; ardından WW-28/2 API erişim/kaynak tüketimi ve önbellek/konum gizliliği. Bu kayıt WW-28'in bütünü veya canlı yayın onayı değildir.

<!-- ww28-private-evidence-2026-11-02 -->
## WW-28/1 — private görsel kanıt ayrımı, 2 Kasım 2026

Onaylanan 29 kod/test/belge dosyası ve 33 varlık kopyası + 1 envanter kapsamında uygulama ve private yayın kanıtı ayrıldı. 33 dosyanın toplam 49.317.827 byte kopyası özgünlerle birebir eşleşti; kaynaklar silinmedi. Envanter SHA-256: `08ccdeb037d06ef338fa8bfc6fae9caad38a14110964cee644ca18a11a370029`. Üretim WebP'leri, tasarım ID'leri ve kişisel kayıtlar değiştirilmedi.

- Public testler yalnız runtime varlıkları ve koddan üretilen SVG'leri kontrol ediyor. Kayıtlı HTML/özgün PNG/kabul denetimleri private hedefe taşındı; test sessizce atlanmadı.
- Temiz, özgün/özel kanıt ve gerçek ayar içermeyen Linux Node 24 bağlamında `npm run check`: 152 geçti / 0 başarısız / 5 bağlamsal skip; lint 0 hata / 8 mevcut uyarı, typecheck ve Next üretim build'i geçti. Önceki 163 sayısı ayrımdan önceki toplamdır. Üç DB ve bir Docker kontrolünün önceki ayrı kanıtları korunur; tarihsel 74 ürün restore testi hâlâ çalıştırılmadı. Bu tur veri tabanı/tarayıcı/telefon kontrolü yeniden yapılmadı.
- Private gerçek görsel doğrulaması 9/9, Core kapı testleri 21/21. Eksik/değişmiş özgün, envanter, yanlış kaynak ve değişen doğrulayıcı/test kodu yeni yayını engeller. Kanıt sourceId + envanter + doğrulayıcı ve iki testin ortak hash'i ile makbuza bağlanır. Geçerli eski makbuzla status/resume mevcut işi yalnız izler; yeni yayın başlatmaz.
- Private workflow kesin incelenmiş kaynak commit'i ister; `main` girdisi reddedildi. Public guard'ın sentetik private dosyayı reddi ve gerçek public index'te özel varlık olmaması doğrulandı.

Core/Weathrobe yayın araçları 0.1.1 oldu; uygulama 0.6.0 ve eski değişmez arşivler korundu. Güncel çalışma kaynakları eski 0.6.0 paketinin hazırlık kanıtı gibi kullanılamaz. Commit/push, Core action referanslarını değiştirme, gerçek otomatik yayın veya mağaza işlemi yapılmadı. Doctus'un mevcut taslak PR'ı ve klinik çalışmaları korunur.

**Sıradaki hedef:** gözden geçirilmiş public kaynak/private kanıt/CI dosyaları için ayrı GitHub gönderim kapsamını sun; Core commit'i ve hedef workflow referanslarını eşleştir; kesin kaynak commit'inde gerçek uzak CI/kanıt koşularını doğrula. Sonrasında WW-28/2 API erişim/kullanım sınırları ve konum/önbellek gizliliği ayrı kapsamla ele alınacak. WW-28 bütünü açık; WW-03 gerçek telefon kabulü de açık.

### Ek satır sonu koruması onayı

Kullanıcı aynı aşamada private `.gitattributes` dosyasını da onayladı: mevcut kurallar korunarak `/evidence/ww21/** -text` eklendi. Gerçek dosyalarda dönüşüm veya global Git ayarı değişikliği yapılmadı. Ayrı sentetik Git deposunda core.autocrlf=true ile commit ve yeniden checkout sonrası 34 kanıt/envanter dosyasının hem blob hem çalışma kopyası hash'leri eşleşti. Gerçek depolarda commit/push yapılmadı. Nihai kapsam 30 kod/test/belge dosyası + 33 varlık kopyası + 1 envanterdir.

## 16 Kasım 2026 — Claude incelemesi için WW-28 devri

Yerel dal `codex/ww28-weathrobe`, taban `f8cd86a`. Çalışma kopyası Codex'in ayrı git worktree klasörü. Dalda kaynak, test ve CI değişiklikleri çalışma ağacında bulunuyor. GitHub dalına gönderme ve PR sürecini kullanıcı yürütecek. İnceleme kopyasının 109 dosyalık kapsamı Weathrobe'un yereldeki 0.6.0 uygulama temelini de taşıyor. Yeni WW-28/2 diff'inin odak dosyaları `app/api/ai-stylist/route.ts`, `lib/ai-stylist-input.ts`, `components/WardrobeModal.tsx`, `app/api/geocode/route.ts`, `app/api/route/route.ts`, `app/api/weather/route.ts`, `public/sw.js` ve `tests/ai-stylist-security.test.cjs`.

İnceleme başlıkları: tarayıcı kaynaklı çapraz köken reddi, sunucu Gemini anahtarının anonim istekten kullanılamaması, bozuk ve büyük akış gövdeleri, kişisel Gemini anahtarıyla tek sınırlı istek, sağlayıcı hata içeriğinin ayıklanması, koordinat hassasiyeti ve eski API önbelleğinin temizlenmesi. Sabit oran ve eşzamanlı limitler tek uygulama süreci içindir. Adres/rota sağlayıcıları arayüzden gelen koordinatları, hava sağlayıcıları iki ondalık konumu görür. Dış sağlayıcı saklama politikaları bu diff'in dışında kalır.

İlk `npm run check` doğrulaması: 0 lint hatası, 8 mevcut uyarı, typecheck başarılı, 158 test geçti ve 5 entegrasyon senaryosu varsayılan koşuda atlandı. Next.js üretim derlemesi tamamlandı. İlk Windows derlemesinde paylaşımlı `node_modules` junction'ı standalone trace kopyasına uyarı verdi. npm üretim taraması 0 açık, tam taramada yüksek/kritik 0, aynı `minimatch` bildirimi zincirinde 7 orta seviye npm kaydı. `npm audit fix --dry-run` uyumlu değişiklik önermedi. Yerel kaynak doğrulaması GitHub Actions veya gerçek Gemini çağrısı kanıtı sağlamaz.

Son doğrulama: Windows kopyasında kurulu paket envanteri kilit ile eşleşti (504 kayıt, 0 eksik, 0 uyuşmazlık) ve `standalone/server.js` oluştu. Linux Docker imajı temiz `npm ci` ile üretildi ve ağsız çalışma testi ana sayfada 200, anahtarsız taslakta 200 ve bozuk konumda 400 verdi. PostgreSQL yaşam döngüsü 1/1, sentetik entegrasyon paketi 30/30 geçti. Bu paket, gözden geçirilen katalog içe aktarımını, salt okunur uygulama rolünü ve konteyner değişiminden sonra rapor kalıcılığını kapsıyor. Önceki 74 ürünlük yedek şeması senaryosu geçmiş fixture gerektiriyor. Yerel private stüdyo kanıtı 9/9 geçti. Kaynak kimliği `bee4c82d355998721d5d569f5e9dbddbe022b9da65302e6a5bf8f8210b4fdd93`. Bu, kesin GitHub commit'ine bağlı uzak makbuz yerine kullanılmamalı.

Çalışma ağacında 109 dosya kontrol edildi. Bilinen anahtar biçimleri ve gerçek adres kalıbı için eşleşme 0, kurulum testlerindeki 4 adres RFC dokümantasyon örneği. GitHub bağlayıcısı üç uygulama deposunu gördü, dört private yayın deposu için yeterli erişim vermedi. Geçmiş yayın arşivi ve Actions loglarının tümü ile zorunlu GitHub check ayarları bu oturumda doğrulanmadı. Önce Claude incelemesi, ardından kullanıcı tarafından yayımlanan kesin dal commit'inde CI ve görsel kanıt koşusu. Sonraki ürün hedefi WW-03.

<!-- ww28-2-claude-review-2026-11-16 -->
## 16 Kasım 2026 — WW-28/2 Claude incelemesi ve düzeltme devri

Dal `claude/weathrobe`, taban `main` @ `1c090c0`; commit yok. Codex'in WW-28/2 diff'i incelendi, engelleyici bulgu çıkmadı. Kullanıcı onayıyla beş düzeltme uygulandı; ayrıntı ve sınırlar PROJECT_GOALS.md aynı tarihli bölümde.

- `lib/upstream-policy.ts`: `UPSTREAM_USER_AGENT` (sürüm `lib/release.ts` üzerinden package.json), `roundForReverseGeocode` (3 ondalık), `roundForRouting` (4 ondalık), `createWindowLimit`, `createSpacedQueue`, `createMemo`, `nominatimReverse` ve `tooManyRequests`. `nominatimReverse` çağıranın `fetch`'ini kullanır; böylece istek route içinde kalır ve testlerdeki sahte fetch ile sınanır. Kuyruk gerçek zamanlı `performance.now()` ile aralık bırakır; arka arkaya iki Nominatim çağrısı yaklaşık 1,1 sn bekletir, ilk rota isteği bu yüzden en fazla bu kadar uzar.
- `app/api/geocode/route.ts`: geçersiz koordinat bütçe harcamadan 400; ters ve ileri arama ortak 120/dk bütçe; ters arama yardımcıdan geçer, yanıt istemcinin kendi koordinatını korur.
- `app/api/route/route.ts`: 30/dk bütçe, OSRM'e 4 ondalık, ara durak adları yardımcıdan. Sınırlanan istek sağlayıcıya hiç gitmez.
- `app/api/ai-stylist/route.ts`: eşzamanlılık aşımı `Retry-After: 5`; anahtarlı istek için 30/dk ve pencerede kalan gerçek süre; anahtarlı istekte Origin yoksa 403. İstemci (`WardrobeModal`) aynı köken POST'u kullandığı için tarayıcı Origin'i gönderir.
- Testler: `tests/upstream-policy.test.cjs` (6 test) her yüklemede taze modül durumu kurar; ağ yok, sentetik koordinat/isim. `tests/ai-stylist-security.test.cjs` yeni bütçe anlamına göre güncellendi; `tests/weather-flow.test.cjs` tek assertion 3 ondalık ve User-Agent'ı bekler.
- Windows'ta testler PowerShell'den çalıştırılmalı (Git Bash GNU tar iki yayın testini düşürür). Kanıt: odaklı 26/26, tüm CJS 164 geçti / 0 başarısız / 5 atlama, lint 0 hata / 8 uyarı, typecheck ve build exit 0.

Sıradaki: kullanıcı onayıyla yalnız bu düzeltme dosyalarının commit/push'u ve uzak CI; Codex incelemesi (NOk-Tools `AGENT_NOTES.md` N-021). Sonraki ürün hedefi WW-03.

<!-- ww03-desktop-2026-11-16 -->
## 16 Kasım 2026 — WW-03 masaüstü turu devri

`claude/weathrobe` = `main` @ `3fef9e9`; kod değişmedi. Yerel kurulum: `npm run catalog:local` (146 ürün, mevcut yayınlar korundu, kapsayıcı yeniden oluşturuldu, `weathrobe-local_postgres_data` volume'u korundu), `next start` ile 3000 portu; önizleme için yerel ve commit edilmeyen `.claude/launch.json` (`weathrobe-prod`). Tur sonunda sunucu ve `weathrobe-local-db-1` durduruldu. Tarayıcıdaki localhost test kayıtları (varsayılan dolap + sentetik ekleme, dil) temizlendi. Yerel `.data/reports` içinde sentetik bir rapor kaldı (İngilizce açıklama "Synthetic WW-03 desktop acceptance check").

13 senaryonun 12'si masaüstünde geçti; konum reddi öykünmeyle sınandı. Mobil öykünmede (360 px) M1 (11/10 px giriş yazısı → iOS yakınlaştırma) ve M2 (44 px altı dokunma hedefleri) bulundu; ilgili alanlar konum arama (`LocationSearch`), harita durak arama/saat ve tıklama modu (`RealCityMap`), üst simgeler (`Navbar`) ve stilleri (`app/globals.css`). Düzeltme ayrı kapsam onayı bekliyor. Ayrıntılı matris ve kullanıcı telefon listesi PROJECT_GOALS.md aynı tarihli bölümde.

<!-- ww03-phone-2026-11-16 -->
## 16 Kasım 2026 — WW-03 telefon turu

Kullanıcı canlı 0.6.0'ı telefonunda Firefox ile denedi: izin reddi uyarısı, katalogdan ekleme ve yenilemede saklama, kaydetme/kaldırma, Eşleştir ve 3D, yarın planı (klavye açıkken), EN, geri bildirim önizlemesi ve güvenli alan geçti. M1 (odakta yakınlaşma) Firefox'ta görülmedi; iOS/WebKit riski doğrulanmadı. M2 (küçük dokunma hedefleri) kullanıcı tarafından doğrulandı. Konum saklamada kullanıcı ilkesi: tam konum yok, ilçe/semt düzeyi; saklanacaksa yuvarlanmış koordinat + ilçe etiketi. Sıradaki: M1–M2 düzeltme kapsamı (yalnız `app/globals.css` sonuna dokunmatik ekran bloğu + CSS testi) onaya sunuldu.

<!-- ww03-m1m2-2026-11-16 -->
## 16 Kasım 2026 — WW-03 M1–M2 düzeltmesi (Claude, 16 Kasım 2026, commit yok)

- **Değişiklik:** `app/globals.css` sonuna yalnız `@media (pointer: coarse)` bloğu; masaüstü değerleri aynı kaldı (1024 px'te konum 12 px/39 px, harita arama 11 px/17 px, simge 40×40). Yeni test `tests/mobile-touch-targets.test.cjs` (3 test). `.tsx` dosyası değişmedi.
- **Ölçüm (yerel üretim derlemesi, dokunmatik öykünme):** 360 px'te konum arama 16 px/44 px, harita durak arama 16 px/44 px, durak saati 16 px/104×44, dil seçimi 16 px/54×44 (TR ve EN sığıyor), "Tıkla: durak ekle" 91×44, durak hapı 56×44, konum sonuç satırları 307×44, "Konumumu kullan" 44 px, App Preview 33×44, üst simgeler 38×44 (geri bildirim simgesi 44×44). Harita arama çubuğu 61 → 45 px. Yatay taşma yok (360/375/390/412).
- **Üst çubuk:** 360 ve 375 px'te değişiklikten önce de iki satırdı (122 px); 390 px'te tek satır kalıyor (70 px, TR ve EN); 412 px'te 68 px. Bunun için simgeler 44 yerine 38 px genişlikte bırakıldı; 44 px genişlik 390 px'te çubuğu ikiye bölüyordu.
- **Doğrulanmayan:** harita arama sonuç düğmeleri ve aktif durak saat alanı ekranda ölçülmedi (kural ve testte var); iOS Safari'de gerçek yakınlaşma davranışı telefonda denenmedi.
- **Kontrol:** `npm run check` (PowerShell) exit 0: lint 0 hata / 8 uyarı, typecheck, 172 test (167 geçti / 0 başarısız / 5 atlama), build.

- **Gönderim:** kullanıcı onayıyla yalnız iki dosya `a9645dc` olarak `origin/claude/weathrobe` dalına gönderildi (taban `main` @ `3fef9e9`). PR kullanıcıda; Codex incelemesi N-022.
- **Uzak CI:** "Weathrobe Quality" koşusu 43944402688 (push, `a9645dc`) başarılı.

<!-- ww29-1-2026-11-16 -->
## 16 Kasım 2026 — WW-29/1 ısıl çekirdek ve teşekkür alanı (Claude, 16 Kasım 2026, commit yok)

- **Kullanıcı kararı:** kombin eşleştirme bilimsel temele oturacak (WW-29; araştırma notu yerel `KOMBIN_SISTEMI_ARASTIRMASI.md`). Kullanılan her içerik (MIT dahil) göze sokmadan ayrı bir alanda teşekkür, lisans ve kullanım açıklamasıyla anılacak.
- **Kod:** `lib/thermal-model.ts` (ISO 9920 toplama ve rüzgâr/yürüme düzeltmesi, ISO 11079 IREQ/ICL/DLE; pythermalcomfort MIT kodundan port), `lib/credits.ts` (5 grup, 34 kayıt), "Kaynaklar & gizlilik" içinde kapalı "Teşekkürler ve kaynaklar" bölümü, `THIRD_PARTY_NOTICES.md` (MIT metni), `app/globals.css` sonuna stil, `lib/translations.ts` iki metin. Öneri motoruna bağlanmadı; kullanıcıya görünen öneriler değişmedi.
- **Testler:** `tests/thermal-model.test.cjs` (8; ISO 11079 Tablo F1'in 8 satırı, pythermalcomfort örnekleri), `tests/credits.test.cjs` (3; her bağımlılık doğru lisansla, 9 dış adresin her biri bir teşekkür kaydına bağlı). PowerShell `npm run check` exit 0: 183 test (178 geçti / 0 başarısız / 5 atlama), lint 0 hata / 8 uyarı, typecheck, build. Tarayıcı (390 px): bölüm kapalı açılıyor, TR/EN, 42 dış bağlantı `noopener`, yatay taşma yok; ekran görüntüsü alınamadı (pencere arka planda), kontrol metin/DOM ile.
- **Bulgular:** (1) IREQ sürekli maruziyet içindir; 10 °C yürüyüşte 1,45–1,93 clo ister, "kazak + kot" ~0,8–1,0 clo. Kısa yolculuk DLE ile değerlendirilir (`assessOutfit`, varsayılan 8 saat; 29/2'de rota süresi bağlanacak). (2) 10 °C üstü ISO 11079 dışı; sayı `extended` etiketli, karar `unknown`. Sıcak hava için ayrı model gerekli. (3) Dış giyim (mont, parka, yağmurluk, softshell, rüzgârlık, panço) ve bere/atkı/eldiven için kaynaklı clo yok → `null`. Kaynak adayı: ISO 9920 Ek A (ücretli) veya yayımlanmış manken ölçümleri. (4) motion, @hookform/resolvers, class-variance-authority, @tailwindcss/typography, tw-animate-css kurulu ama kodda kullanılmıyor.
- **Varsayımlar (kodda belgeli):** iç çamaşırı 0,04 clo; rüzgâr 10 m → 1,1 m log profil (z0 0,01 m, ×0,68); hava geçirgenliği 50 l/(m² s); güneş ışınımı yok (ışınım sıcaklığı = hava sıcaklığı); etkinlik: oturma/bekleme 1,2 met, yürüme 2,0 met (0,89 m/s), aktif 2,6 met (1,2 m/s).

- **Gönderim:** kullanıcı onayıyla yalnız 8 dosya `450eed0` olarak `origin/claude/weathrobe` dalına gönderildi (taban `a9645dc`). PR kullanıcıda; Codex incelemesi N-023.
- **Uzak CI:** "Weathrobe Quality" koşusu 43953935753 (push, `450eed0`) başarılı.

<!-- ww29-2a-2026-11-17 -->
## 17 Kasım 2026 — WW-29/2a ısıl çekirdeğin öneriye bağlanması (Claude, 17 Kasım 2026, commit yok)

- **Kararlar (kullanıcı):** dış giyimde ikincil değerler (şişme mont 0,55, palto/parka 0,60–0,70 clo; Engineering ToolBox, "doğrulanmadı"), süre plan aralığından yoksa 1 saat, etkinlik varsayılanı yürüme, sıra 29/2a → 29/2b.
- **Ne değişti:** "Günün kombini", "Eşleştir" ve "Dolabımdan" yolları ≤10 °C'de kombini bütün olarak ISO 11079'a göre değerlendiriyor (`lib/outfit-thermal.ts`). Önce karar sınıfı (yeterli > doğrulanamadı > fazla > yetersiz), kanıtlanamıyorsa kaynaklı parçaların açığı, sonra mevcut tercihten uzaklık. 10 °C üstünde seçim birebir eskisi gibi. Plan için en soğuk saat ve en güçlü rüzgâr kullanılıyor; kişisel ısı ofseti sıcaklığı kaydırıyor. Katalog 1–5 puanı yalnız türün kaynaklı aralığında nokta seçiyor (WW-10). Kartta TR/EN tek satır gerekçe.
- **Önemli bulgu ve karar:** İkincil değerler alt sınır olarak da güvenilir değil: `coat-parka` türü hafif trençkotu da kapsıyor. Tarayıcıda Erzurum'da (0 °C) öneri şişme montu bırakıp varsayılan dolaptaki trençkota geçti. Düzeltme: ikincil değerler hiçbir kararı belirlemiyor; yeterlilik yalnız kaynaklı parçalarla kanıtlanıyor. Sonuç: kışın montlu kombinlerde not "doğrulanamadı". Gerçek karar için kaynaklı dış giyim değeri (ISO 9920 Ek A veya yayımlanmış manken ölçümleri) gerekli. Tür ayrımı (trençkot ≠ parka) ayrı bir taksonomi işi.
- **Testler:** `tests/outfit-thermal.test.cjs` (7, Erzurum regresyonu dahil), `tests/thermal-model.test.cjs` güncellendi (10). PowerShell `npm run check` exit 0: 191 test (186 geçti / 0 başarısız / 5 atlama), lint 0 hata / 8 uyarı, typecheck, build. Kombin araması ~7–11 ms.
- **Tarayıcı:** İstanbul 12 °C "kural tabanlı" notu; Erzurum 0 °C üç sekmede şişme mont ve "doğrulanamadı" notu, TR/EN. Ekran görüntüsü değil, sayfa metni/DOM ile.
- **Sonraki (29/2b):** sıcak hava (SolarCal + ISO 7933 PHS), 10–15 °C boşluğu; kaynaklı dış giyim değeri; trençkot/parka tür ayrımı.

- **Gönderim:** kullanıcı onayıyla yalnız 9 dosya `79666ab` olarak `origin/claude/weathrobe` dalına gönderildi (taban `450eed0`). PR kullanıcıda; Codex incelemesi N-024.
- **Uzak CI:** "Weathrobe Quality" koşusu 43962094843 (push, `79666ab`) başarılı.

<!-- pr9-security-2026-11-17 -->
## 17 Kasım 2026 — PR #9 güvenlik denetimi — bekleme kararı (17 Kasım 2026)

PR #9 (`claude/weathrobe` → `main`, `79666ab`) "Dependency security" işinde kırmızı: `npm audit --audit-level=high` geliştirme zincirinde GHSA-fc5q-39xc-vjpf (picomatch ≤4.0.7, yüksek, düzeltilmiş sürüm yok) ve GHSA-g3hv-75wg-m249 (minimatch, orta, `typescript-eslint` 8.73.0 ile kapanıyor). Üretim denetimi temiz. **Kullanıcı kararı:** güvenlik öncelikli; istisna/gevşetme yok, PR ilerletilmez, ara ara yeniden denenir, çözülünce birleştirilir. İş `claude/weathrobe` dalında sürer (AGENT_NOTES N-025).

<!-- ww29-2b-2026-11-17 -->
## 17 Kasım 2026 — WW-29/2b 10 °C üstü konfor modeli (Claude, 17 Kasım 2026, commit yok)

- **Kararlar (kullanıcı):** model Gagge iki düğümlü (ASHRAE 55 SET*) + SolarCal; hissedilen ±1 kabul edilebilir, ±0,5'e yakın olan tercih; kentte yarı gölge; emilim 0,7; etkinlik yürüme. PHS sonraya; dış giyim kaynağı ve trençkot ayrımı 29/2c.
- **Ne değişti:** Open-Meteo'dan doğrudan normal ışınım (anlık ve saatlik). 10 °C üstündeki her plan saati (plan yoksa anlık değer) için kombinin bir saat sonraki hissi hesaplanıyor; güneş SolarCal ile ışınım sıcaklığına ekleniyor. Plan aralığı 10 °C'nin iki yanına düşerse soğuk (ISO 11079) ve ılık (SET*) kontrolleri birlikte; biri başarısızsa kombin başarısız. Kart notu "SET* modeline göre … rahat (güneş dahil)" / "sıcak gelir; daha hafif bir parça seç" / "serin gelir; bir katman ekle". Kural tabanlı yol artık yalnız hiçbir model uygulanamazsa.
- **Doğrulama:** `tests/comfort-model.test.cjs` (FedericoTartarini/validation-data-comfort-models v1.1.0, MIT: iki düğümlü 10 vaka, SolarCal 27 ASHRAE 55 vakası; pythermalcomfort'tan 4 sabit SolarCal vakası; NOAA güneş yüksekliği), `tests/outfit-thermal.test.cjs` (9; sıcak günde hafifletme, güneş etkisi, plan saatleri ışınımı). PowerShell `npm run check` exit 0: 196 test (191 geçti / 0 başarısız / 5 atlama), lint 0 hata / 8 uyarı, typecheck, build.
- **Tarayıcı (sayfa metni ile):** İstanbul 15 °C gece "SET* modeline göre 60 dk boyunca rahat" (gömlek, denim ceket, chino); Honolulu 24 °C, DNI 413 W/m² "rahat (güneş dahil)" (tişört, şort, kanvas ayakkabı).
- **Sınırlar:** SolarCal dağınık ışınımı 0,2×doğrudan varsayıyor (bulutlu günde güneş etkisi eksik kalabilir); kişinin yönü ve gölge oranı varsayım; giysi rengi emilime henüz bağlı değil; nem yüksek sıcakta PHS güvenlik uyarısı yok.

- **Gönderim:** kullanıcı onayıyla yalnız 13 dosya `9330ce9` olarak `origin/claude/weathrobe` dalına gönderildi (taban `79666ab`); PR #9 N-025 gereği bekliyor. Codex incelemesi N-026.
- **Uzak CI:** 44152045290 (push) ve 44152056782 (PR): Source checks ve Disposable catalogue lifecycle başarılı; Dependency security N-025 bildirimleri nedeniyle kırmızı (yeni bildirim yok, üretim denetimi temiz).

<!-- ww29-2c-2026-11-17 -->
## 17 Kasım 2026 — WW-29/2c CBE manken ölçümleriyle doğrulama (Claude, 17 Kasım 2026, commit yok)

- **Kaynak (kullanıcı onayı, seçenek A):** Lee, Zhang & Arens 2013, CBE UC Berkeley (açık erişim): 40 kombin, oturan kadın termal manken, tüm vücut clo. Yalnız sayılar kaynak gösterilerek `tests/fixtures/cbe-2013-ensembles.json` içinde.
- **Doğrulama:** ISO 9920 toplamamız, türlerimize eşlenebilen 14 ölçülmüş kombinde (0,31–1,07 clo) ortalama mutlak hata 0,089 clo, sapma −0,042 (hafif düşük tahmin), en kötü 0,21. Test bu doğruluğu kilitliyor (0,10 / 0,06 / 0,25).
- **Şişme mont:** aynı alt kombine eklenen dört kışlık mont 0,22–0,35 clo ekliyor → giysi başına 0,26–0,42 (÷0,835). En düşüğü (0,26) ölçülmüş alt değer, üst uç açık: "yeterli"yi kanıtlayabilir, "yetersiz" diyemez. Engineering ToolBox'ın 0,55 değeri artık kullanılmıyor.
- **Kapsamdan sapma:** kaban/parka (trençkot) için temiz karşılaştırma yok (trençkot balıkçı yakayla ölçülmüş; iki farkla ~0,40–0,53 tahmini, tür için güvenilir alt sınır değil). İkincil kaldı, karar vermiyor. Çözüm: trençkot/parka tür ayrımı (WW-30 önerisi; katalog göçü, 36→37 tür, hedefler, çizim/3D, ürünlerin kanıtla yeniden sınıflandırılması, Codex katalog alanı).
- **Sıralama:** yeterlilik kanıtlanamıyorsa olası sıcak dış katmanlı (açık/ikincil) kombin tam kaynaklı ama yetersiz kombinden önce; grup içinde daha sıcak kaynaklı katmanlar. Erzurum regresyon testi geçiyor.
- **Kontrol:** PowerShell `npm run check` exit 0 (200 test: 195 geçti / 0 başarısız / 5 atlama); ilk koşuda değiştirilmemiş geri bildirim testinde bilinen `ENOTEMPTY`, tekrarda geçti. Tarayıcı (sayfa metni): Erzurum 1 °C üç sekmede şişme mont ve "Şişme mont için yalnız ölçülmüş bir alt değer biliniyor (CBE 2013); … daha sıcak bir mont yetebilir."

- **Gönderim:** kullanıcı onayıyla yalnız 8 dosya `64b67ce` olarak `origin/claude/weathrobe` dalına gönderildi (taban `9330ce9`); PR #9 N-025 gereği bekliyor. Codex incelemesi N-027.
- **Uzak CI:** 44165866043 (push) ve 44165880467 (PR): Source checks ve Disposable catalogue lifecycle başarılı; Dependency security N-025 bildirimleri nedeniyle kırmızı (picomatch hâlâ 4.0.7).

<!-- ww30-2026-11-18 -->
## 18 Kasım 2026 — WW-30 trençkot ayrı tür (Claude, 18 Kasım 2026, commit yok)

- **Karar (kullanıcı):** trençkot `coat-parka`dan ayrılır; katalog taksonomisi ortak alan, kullanıcı onayıyla. Katalog hedefi 36 → 37 tür; tür başına 100 ile toplam 3.600 → 3.700 (WW-09).
- **Ne değişti:** `trench-coat` ("Trençkot / Trench coat", dış katman, gövde/kol/uyluk; "trench, trençkot, gabardin") listenin sonuna eklendi. Eski profil `cat-outer-2`, varsayılan dolap `w-outer-trench`, öneri profilleri `s-9`, `p-9` ve "Bej Klasik Trençkot" eşleştirme parçası yeni türde. 5 trençkot tasarımı (kuşaklı klasik, kısa, kruvaze uzun, kapüşonlu, uzun sade); SVG ve 3D'de uzun etek ve kuşak. Kaban/parka tasarımları ve kaydedilmiş tasarım kimlikleri değişmedi.
- **Isıl:** CBE 2013 kısa trençkot, iki aşamalı fark: 1,24 − (0,80 + 0,70 − 0,59) = 0,33 → 0,40 clo alt değer, açık üst sınır ("yeterli"yi kanıtlayabilir, "yetersiz" diyemez). Kaban/parka ikincil kaldı.
- **Veritabanı:** `db/migrations/003_trench_coat.sql` türü ekler ve yalnız `cat-outer-2` eski profilini bağlar; ürünlere dokunmaz. Katalogda `coat-parka` ürünü yoktu. Canlıya ancak sonraki yayında (ayrı onay). Kullanıcıların kendi "Kaban / parka" kayıtları kendiliğinden değişmez; düzenleyicide Trençkot seçilebilir.
- **Testler:** 36→37 tür, 180→185 tasarım, hedef 3.700 (kalan 3.554) güncellendi; yeni `tests/trench-coat.test.cjs` (5). PowerShell `npm run check` exit 0: 205 test (200 geçti / 0 başarısız / 5 atlama); ilk koşuda değiştirilmemiş geri bildirim testlerinde bilinen `ENOTEMPTY`, tekrarda geçti. Docker Desktop kapalı: veritabanı testleri yerelde çalışmadı, CI'da sınanacak.
- **Tarayıcı (sayfa metni):** katalog filtresinde "Trençkot (0)"; dolaptaki trençkot düzenleyicide 5 trençkot tasarımı ve tür listesinde Trençkot.

- **Gönderim:** kullanıcı onayıyla yalnız 20 dosya `4ab45a6` olarak `origin/claude/weathrobe` dalına gönderildi (taban `64b67ce`); PR #9 N-025 gereği bekliyor. Codex incelemesi N-028.
- **Uzak CI:** 44179952643 (push) ve 44179963304 (PR): Source checks ve Disposable catalogue lifecycle başarılı (göç 003 ve 37 tür PostgreSQL üzerinde geçti); Dependency security N-025 bildirimleri nedeniyle kırmızı.

<!-- ww29-3-2026-11-18 -->
## 18 Kasım 2026 — WW-29/3 renk ve resmiyet uyumu (Claude, 18 Kasım 2026, commit yok)

- **Renk:** sRGB → CIELAB (doğrulandı: kırmızı 53,24/80,09/67,20) ve Ou & Luo (2006) iki renk uyumu (denklemler US10107687'deki yeniden yayımdan; özgün makaleye erişilemedi). Model açık renkleri kayırıyor ve giysilerde zayıf (lacivert+bej −0,22, kırmızı+yeşil −0,81). Bu yüzden yalnız en kötü çift CH < −0,3 olduğunda (belirgin çatışma) geri sıralanıyor; kart etiketi: ortalama ≥ 0 "uyumlu", çatışma yoksa "kabul edilebilir", varsa "çatışıyor". Bilinmeyen katalog renkleri ve kişisel çizim renkleri hariç; termal içlik ve çorap görünmez sayılıyor.
- **Resmiyet:** kural tabanlı 1–4 ölçek (Batı kıyafet kuralları, Permanent Style; bilimsel ölçüm değil), görünür parçalarda fark ≥ 3 "karışık".
- **Seçim:** önce ısıl karar ve açık, sonra görünüş, sonra tercihe yakınlık; görünüş ısıl kararı ezmiyor (test). "Eşleştir"teki HSL kuralı kaldırıldı. Kartta ikinci satır: "Görünüş: renkler … (Ou–Luo) · resmiyet … (kural tabanlı)".
- **Yan düzeltme (önceki işlerden kalan hata):** ılık havada alt değeri bilinen dış katmanlar (şişme mont 0,26, trençkot 0,40) sıralamada "hafif" görünüyordu; artık ılık sıralama yalnız tam kaynaklı parçalara bakıyor. Ilık havadaki not "fazla sıcak gelmeyeceği doğrulanamadı" oldu.
- **Açık karar:** varsayılan dolapta 16 °C'de kapüşonlu (1) + trençkot (4) "karışık" sayıldığı için şişme mont (2) seçiliyor.
- **Kontrol:** PowerShell `npm run check` exit 0 (211 test: 206 geçti / 0 başarısız / 5 atlama). Tarayıcı (sayfa metni, İstanbul 16 °C): üç sekmede görünüş satırı TR/EN; "Dolabımdan" yeni ılık hava notu.
- **Karar (kullanıcı, 18 Kasım):** sweatshirt/hoodie resmiyeti 1 → 2 (kapüşonlu + trençkot yaygın sokak kombini). Tam varsayılan dolapla 17 °C İstanbul: "Dolabımdan" kapüşonlu + trençkot, resmiyet tutarlı. `npm run check` exit 0 (206 geçti / 0 başarısız).

- **Gönderim:** kullanıcı onayıyla yalnız 9 dosya `45a24fb` olarak `origin/claude/weathrobe` dalına gönderildi (taban `4ab45a6`); PR #9 N-025 gereği bekliyor. Codex incelemesi N-029.
- **Uzak CI:** 44192021236 (push) ve 44192031584 (PR): Source checks ve Disposable catalogue lifecycle başarılı; Dependency security N-025 bildirimleri nedeniyle kırmızı.

<!-- maint-audit-2026-11-18 -->
## 18 Kasım 2026 — Güvenlik bakımı ve PR #9 engelinin kalkması (Claude, 18 Kasım 2026)

- **Engel:** GHSA-fc5q-39xc-vjpf (picomatch) 18 Kasım 15:38 UTC'de GitHub tarafından geri çekildi (bakımcı: "güvenlik açığı değil"; micromatch/picomatch#235). Bizde picomatch yalnız eslint geliştirme aracında, kendi sabit desenlerimizle.
- **Bakım (`370f1fc`, kullanıcı onayı):** `eslint-config-next` 16.4.1 → 16.4.6 ve `typescript-eslint` 8.71.2 → 8.73.0 yalnız lock ile (minimatch 11.0.9; GHSA-g3hv-75wg-m249 kapandı). Kullanılmayan `motion`, `@hookform/resolvers`, `class-variance-authority`, `@tailwindcss/typography`, `tw-animate-css` kaldırıldı (lock'tan 12 paket). Teşekkür listesi temizlendi; test kaldırılmış paketi listeleyen kaydı yakalıyor.
- **Kontrol:** `npm audit` 0; iki CI audit kapısı yerelde geçti. `npm ci --ignore-scripts` ve PowerShell `npm run check` exit 0 (212 test: 207 geçti / 0 başarısız / 5 atlama; lint 0 hata / 8 uyarı).
- **Not:** npm `eslint@9.39.1` için "desteklenmiyor" uyarısı verdi (güvenlik bildirimi değil; ayrı bakım işi). `bun.lock` eski, değiştirilmedi.
- **Uzak CI:** 44385238269 (push) ve 44385255156 (PR): Source checks, Disposable catalogue lifecycle ve Dependency security başarılı. PR #9 birleştirmeye hazır (`clean`, `370f1fc`); birleştirme kullanıcıda.

<!-- pr9-merged-2026-11-18 -->
### PR #9 birleştirildi (18 Kasım 2026)

Kullanıcı PR #9'u `main`'e birleştirdi (`8827670`). İçerik: WW-03 M1–M2, WW-29/1, 29/2a, 29/2b, 29/2c, WW-30, WW-29/3 ve güvenlik bakımı. Canlı yayın yapılmadı: sürüm 0.6.0, göç 003 canlıda çalışmadı; WW-03 kapanışı (iPhone kontrolü) sonraki yayına bağlı. Codex incelemesi: `git diff 3fef9e9 8827670` (AGENT_NOTES N-022–N-029).

<!-- avatar-reference-2026-11-18 -->
## 18 Kasım 2026 — Kullanıcının hedeflediği giydirilmiş model görünümü — referans (18 Kasım 2026)

- **Referans:** https://willeastcott.github.io/splat-fashion/ — "The Future of Clothes Shopping", PlayCanvas üzerinde Gaussian splat sanal kabin demosu. Kıyafet döngüsü, değişiklik işaretleri, seçilen parçaya yakınlaşma, sepete ekleme, sunum modu, boşta animasyon/kafa kameraya bakma, iskelet ağırlıkları görünümü. Çekim: Christoph Schindelar (SuperSplat), CC BY 4.0; sayfada kaynak depo bağlantısı yok.
- **Kullanıcı notu:** Kıyafet giyen modelimizin baştan beri böyle olmasını umuyordu; ilk tasarımda örnek gösterebileceği bir site yoktu.
- **İlgili hedefler:** WW-25 (avatar kıyafet seçimi tasarımı), WW-14 (3D katman). Bugünkü 3D: Quaternius CC0 gövdeler + türetilmiş giysi yüzeyleri; splat yaklaşımı gerçek çekim (her giysi/kişi için tarama) ve farklı bir oluşturucu ister, lisans ve teşekkür (CC BY 4.0 atıf) gerektirir. Uygulama kapsamı henüz yok; ayrı araştırma ve kullanıcı kararıyla.
- **main CI (8827670):** Source checks, Disposable catalogue lifecycle ve Dependency security başarılı.

<!-- ww11-2026-11-18 -->
## 18 Kasım 2026 — WW-11 "Yanına al" (Claude, 18 Kasım 2026, commit yok)

- **Kararlar (kullanıcı):** plan yokken önümüzdeki 8 saat (yerel gece yarısını geçmeden); ısınma ipucu yok; en fazla bir soğuma + bir yağmur önerisi.
- **Ne yapıyor:** Kombin, gelecek en soğuk saatte aynı modellerle (ISO 11079 / SET*) yeniden değerlendiriliyor; "yetersiz" ise kombine eklenip o saati "yeterli"ye çeviren en hafif tek ara/dış katman öneriliyor. Kanıtlanamıyorsa "doğrulanamadı", hiç yoksa "eklenip yetecek tek katman yok" deniyor. Şimdi kuru ve ileride yağış olasılığı ≥ %40 ise ve kombinde su geçirmez dış katman yoksa su geçirmez parça öneriliyor. Sabitlenen parçalar korunuyor (yalnız ekleme). "Dolabımdan" yalnız kendi dolabından; diğer sekmeler günün kombini havuzundan. Planlı aralıkta öneri yok (kombin tüm aralığa göre seçiliyor).
- **Örnek (test):** 15 °C öğlen, 19:00'da 8 °C → hırka eklenir; 5 °C → tek katman yetmiyor.
- **Kontrol:** yeni `tests/carry-along.test.cjs` (3). PowerShell `npm run check` exit 0 (215 test: 210 geçti / 0 başarısız / 5 atlama). Tarayıcı: gece 23:24'te yanıltıcı "tahmin yok" uyarısı yakalanıp düzeltildi; canlı öneri örneği gözlenemedi (İstanbul gece, Los Angeles ılık akşam).
- **Açık not (WW-07):** "Katmanlar" sekmesi plan yokken sabah/akşamı sabit sapmalarla (−3/−2) tahmin ediyor; ayrı iş.

- **Gönderim:** kullanıcı onayıyla yalnız 4 dosya `921bf07` olarak `origin/claude/weathrobe` dalına gönderildi (taban `main` @ `8827670`). PR kullanıcıda; Codex incelemesi N-030.
- **Uzak CI:** 44396521930 (push, `921bf07`): Source checks, Disposable catalogue lifecycle ve Dependency security başarılı.

## 19 Kasım 2026 — WW-10 B2 taslaklar bilgi uydurmuyor (Claude, 19 Kasım 2026)

- **Sorun:** "AI Taslağı" (Gemini ve yerel kurallar) bilinmeyen ısı/su/rüzgâr/malzeme/renk için varsayılan uyduruyor, taslağı onaysız dolaba yazıyordu; barkod formunda ısı 3/5 ile başlıyordu.
- **Ne yapıyor:** Sunucu artık `{ draft }` döndürüyor: bilinmeyen alan `null`; ısı/su/rüzgâr tahminleri yalnız `suggestions` içinde. Gemini şemasında yalnız ad + kategori zorunlu, tür kimliği taksonomi listesiyle sınırlı; geçersiz değerler `null` oluyor (`lib/garment-draft.ts`). Yerel kurallar yalnız kullanıcının kelimelerini kullanıyor ("yün" → ısı önerisi 4, "su geçirmez" → öneri). Dolaba eklemeden önce düzenlenebilir önizleme (`components/GarmentDraftReview.tsx`): ısı/su/rüzgâr "Bilmiyorum" ile başlıyor, öneri tek dokunuşla uygulanıyor, Vazgeç kaydetmiyor. Kaydedilen parça `dataSource: user`; onaysız malzeme "bilinmiyor", renk bilinmiyorsa `colorType: unknown`. Barkod formunda ısı "Bilmiyorum" ile başlıyor. Mevcut kayıtlara dokunulmadı.
- **Kontrol:** yeni `tests/garment-draft.test.cjs` (6), `ai-stylist-security` yeni yanıt biçimine güncellendi, `mobile-touch-targets` `.draft-suggestion` 44 px kontrolü. PowerShell `npm run check`: 221 test, 216 geçti / 0 başarısız / 5 atlama; build derlendi. Tarayıcı (yerel, sentetik): TR/EN form, öneri uygulama, kayıtta yalnız onaylanan alanlar, Vazgeç, barkod "Bilmiyorum". Gemini yolu yalnız fixture ile.
- **Açık not:** Yerel kurallar Türkçe kelimelerle çalışıyor; İngilizce açıklamada ("wool") malzeme/renk/ısı önerisi çıkmıyor, tür eşleşmesi çalışıyor.

- **Gönderim:** kullanıcı onayıyla yalnız 10 dosya `be797c4` olarak `origin/claude/weathrobe` dalına gönderildi (taban `921bf07`). PR kullanıcıda; Codex incelemesi N-031. Uzak CI (Weathrobe Quality, 43. çalıştırma) gönderim sırasında sürüyordu.

## 19 Kasım 2026 — kullanıcı yokken 5 iş (Claude, yerel commit, push yok)

- **WW-07 `c8558ef`:** `generateLayerTimeline` plan yokken yalnız konumun o günkü (veya `requestedDate`) tarihli saatlerini kullanıyor; dilim özeti planlı yolla ortak `phaseMetrics` (en soğuk saat, en yüksek yağış/rüzgâr); saat aralığı gerçek saatlerden; saati olmayan dilim yok; boş plan için arayüzde açık mesaj. Eski `extractPhaseMetrics` ve −3/+2/−2 yedeği kaldırıldı. Kalan WW-07: `lib/weather-service.ts` çevrimdışı yedeği sabit 18 °C; rota API yedekleri.
- **WW-10 B2 `ab3b360`:** `rulesDraft` İngilizce kelimeleri tam kelime tanıyor; Türkçe kökler kelime başında. Malzeme yazılan dilde.
- **Güneş emilimi:** uygulanmadı; rapor ve A/B/C seçenekleri `KOMBIN_SISTEMI_ARASTIRMASI.md`.
- **`ce1c250`:** `Modal` temizliği açtığı dialog üzerinden; `OutfitRecommendation` `feedbackCount` anahtarı bilinçli (yorum).
- **Kontrol:** PowerShell `npm run check` exit 0 (227 / 222 geçti / 0 başarısız / 5 atlama; lint 7 uyarı).

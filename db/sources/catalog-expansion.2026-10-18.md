# 36 tür hedefi ve 72 yeni model — 18 Ekim 2026

Bu tur **72 yeni gerçek model** eklenip yerel kalıcı PostgreSQL'e yayımlandı. Önceki 74 kayıt korunarak toplam **146 ürün / 146 kaynak gözlemi / 20 incelenmiş grup / 36 tür** oldu. 18 türde gerçek ürün var; 18 tür boş. Hedef **her türde 100**, toplam **3.600** farklı modeldir. **Tamamlanan tür 0, kalan model 3.454**. 180 özgün SVG tasarımı ve 23 eski öneri profili gerçek ürün sayısına dahil değildir.

Güncel tür tablosu [catalog-progress.md](catalog-progress.md); yeniden üretim: `node node_modules/tsx/dist/cli.mjs scripts/catalog/progress.ts --write`. Rapor onaylı JSON manifestini sayar; kalıcı veritabanı yayını ayrıca doğrulandı. Bu, sürekli mağaza senkronizasyonu değildir.

## Kaynak ve veri kararları

- Stanley/Stella EU resmî sayfaları: 65 model. Yalnız yetişkin/unisex modeller alındı. EU kaydı Türkiye'de satılıyor, stokta veya fiyatlı demek değildir.
- Koton resmî sayfaları: 2 bluz. Daha eski sayfa gözlemleri güncel stok olarak kullanılmadı. Üretici model kodu renk/beden son ekinden ayrıldı.
- Decathlon Türkiye resmî sayfaları: 5 panço. MT50 EVA, diğer dördü ana kumaş polyester olarak kaydedildi. Poliüretan kaplama astar/dolguya zorlanmadı; kanıt notunda korundu.
- Yeni grupta **60 açık GSM** var. Toplam katalogda 83. Ağırlık (gram) veya nefes alabilirlik (g/m²/24h), GSM alanına taşınmadı. 38 g/m² yelek dış kumaşı bütün yeleğin ağırlığı veya sıcaklık puanı değildir.
- Yeni 8 DWR/su itici beyanı `repellent`, 5 panço üretici beyanı `waterproof` olarak kaydedildi. Bağımsız laboratuvar doğrulaması veya genel ısı puanı türetilmedi.
- Aynı lifin organik/geri dönüştürülmüş payları toplam lif yüzdesinde birleştirildi. Örneğin 50+50 pamuk toplam %100 pamuktur; bütün renklere organik sertifika atanmadı. Blaker/Stella Etta %60 pamuk/%40 modal, berelerdeki poliamid/elastan karışımları korunur.
- Bucket Hat dış/astar ve Puffer Gilet dış/astar/dolgu ayrı bileşenlerdir. Fielder dış örgüsü %100 pamuk; polar kenar astarının oranı bilinmediği için uydurulmadı.
- STTW962 sayfa SEO başlığında Ava yazsa da ürün H1/kod ve detayları **Stella Mia STTW962** der; kimlik buradan alınır. Önceden erişilemeyen STTU199 için bu tur çalışan en-eu sayfası kullanıldı; en-gb başarısız gözlemi registry'de tarihçe olarak kaldı.
- Tüm yeni modellerin ısı, rüzgâr ve normalize nefes alabilirlik puanı bilinmiyor. Fiyat/teklif, GTIN, çözümlenmiş beden/renk/SKU ve ürün fotoğrafı eklenmedi. Görsel galeri kişisel temsildir; üretici ürünüyle otomatik olarak aynı kesimde sayılmaz.

## Model ve doğrudan kaynak listesi

| Tür | Marka / model | Ana kumaş | g/m² | Kaynak |
|---|---|---|---:|---|
| shirt | Stanley/Stella Stanley Oxford Shirt STWM968 | 100% Cotton | 190 | [Üretici](https://stanleystella.com/en-eu/stanley-oxford-shirt-stwm968) |
| shirt | Stanley/Stella Stella Styler Shirt STWW973 | 100% Cotton | 130 | [Üretici](https://stanleystella.com/en-eu/stella-styler-shirt-stww973) |
| shirt | Stanley/Stella Stanley Styler Shirt STWM969 | 100% Cotton | 130 | [Üretici](https://stanleystella.com/en-eu/stanley-styler-shirt-stwm969) |
| shirt | Stanley/Stella Stella Oxford Shirt STWW971 | 100% Cotton | 190 | [Üretici](https://stanleystella.com/en-eu/stella-oxford-shirt-stww971) |
| shirt | Stanley/Stella Stella Denim Shirt STWW970 | 100% Cotton | 235 | [Üretici](https://stanleystella.com/en-eu/stella-denim-shirt-stww970) |
| shirt | Stanley/Stella Worker STWU975 | 100% Cotton | 285 | [Üretici](https://stanleystella.com/en-eu/worker-stwu975) |
| shirt | Stanley/Stella Stanley Denim Shirt STWM967 | 100% Cotton | 235 | [Üretici](https://stanleystella.com/en-eu/stanley-denim-shirt-stwm967) |
| shirt | Stanley/Stella Stella Harper STWW270 | 100% Cotton | 130 | [Üretici](https://stanleystella.com/en-eu/stella-harper-stww270) |
| polo-shirt | Stanley/Stella Prepster 2.0 STPU222 | 100% Cotton | 240 | [Üretici](https://stanleystella.com/en-eu/prepster-2-0-stpu222) |
| polo-shirt | Stanley/Stella Prepster 2.0 Long Sleeve STPU223 | 100% Cotton | 240 | [Üretici](https://stanleystella.com/en-eu/prepster-2-0-long-sleeve-stpu223) |
| polo-shirt | Stanley/Stella Stella Coaster STPW977 | 100% Cotton | 185 | [Üretici](https://stanleystella.com/en-eu/stella-coaster-stpw977) |
| polo-shirt | Stanley/Stella Stanley Coaster STPM224 | 100% Cotton | 185 | [Üretici](https://stanleystella.com/en-eu/stanley-coaster-stpm224) |
| polo-shirt | Stanley/Stella Coaster Vintage STPU252 | 100% Cotton | 185 | [Üretici](https://stanleystella.com/en-eu/coaster-vintage-stpu252) |
| gilet | Stanley/Stella Puffer Gilet 2.0 STJU293 | 100% Nylon | 38 | [Üretici](https://stanleystella.com/en-eu/puffer-gilet-2-0-stju293) |
| gilet | Stanley/Stella Stanley Climber 2.0 STJM189 | 100% Nylon | 38 | [Üretici](https://stanleystella.com/en-eu/stanley-climber-2-0-stjm189) |
| gilet | Stanley/Stella Stella Climber 2.0 STJW190 | 100% Nylon | 38 | [Üretici](https://stanleystella.com/en-eu/stella-climber-2-0-stjw190) |
| gilet | Stanley/Stella Stella Quester STJW241 | 100% Polyester | 300 | [Üretici](https://stanleystella.com/en-eu/stella-quester-stjw241) |
| gilet | Stanley/Stella Stanley Quester STJM240 | 100% Polyester | 300 | [Üretici](https://stanleystella.com/en-eu/stanley-quester-stjm240) |
| gilet | Stanley/Stella Stanley Trail Blazer STJM235 | 94% Polyester, 6% Elastane | 315 | [Üretici](https://stanleystella.com/en-eu/stanley-trail-blazer-stjm235) |
| gilet | Stanley/Stella Stella Trail Blazer STJW236 | 94% Polyester, 6% Elastane | 315 | [Üretici](https://stanleystella.com/en-eu/stella-trail-blazer-stjw236) |
| gilet | Stanley/Stella Puffer Gilet STJU250 | 100% Polyester | 75 | [Üretici](https://stanleystella.com/en-eu/puffer-gilet-stju250) |
| softshell | Stanley/Stella Stanley Discoverer STJM158 | 94% Polyester, 6% Elastane | 342 | [Üretici](https://stanleystella.com/en-eu/stanley-discoverer-stjm158) |
| softshell | Stanley/Stella Stella Discoverer STJW159 | 94% Polyester, 6% Elastane | 342 | [Üretici](https://stanleystella.com/en-eu/stella-discoverer-stjw159) |
| joggers | Stanley/Stella Barreler STBU276 | 100% Cotton | 400 | [Üretici](https://stanleystella.com/en-eu/barreler-stbu276) |
| joggers | Stanley/Stella Needer STBU274 | 85% Cotton, 15% Polyester | 280 | [Üretici](https://stanleystella.com/en-eu/needer-stbu274) |
| joggers | Stanley/Stella Mover 2.0 STBU185 | 100% Cotton | 350 | [Üretici](https://stanleystella.com/en-eu/mover-2-0-stbu185) |
| joggers | Stanley/Stella Mover Vintage STBU576 | 100% Cotton | 300 | [Üretici](https://stanleystella.com/en-eu/mover-vintage-stbu576) |
| joggers | Stanley/Stella Jammer Dry STBU157 | 100% Cotton | 400 | [Üretici](https://stanleystella.com/en-eu/jammer-dry-stbu157) |
| shorts | Stanley/Stella Trainer 2.0 STBU186 | 85% Cotton, 15% Polyester | 300 | [Üretici](https://stanleystella.com/en-eu/trainer-2-0-stbu186) |
| shorts | Stanley/Stella Boarder Dry STBU944 | 100% Cotton | 400 | [Üretici](https://stanleystella.com/en-eu/boarder-dry-stbu944) |
| beanie | Stanley/Stella Fielder STAU297 | 100% Cotton | Bilinmiyor | [Üretici](https://stanleystella.com/en-eu/fielder-stau297) |
| beanie | Stanley/Stella Fisherman Beanie 2.0 STAU296 | 93% Cotton, 1% Elastane, 6% Polyamide | Bilinmiyor | [Üretici](https://stanleystella.com/en-eu/fisherman-beanie-2-0-stau296) |
| beanie | Stanley/Stella Rib Beanie 2.0 STAU295 | 90% Cotton, 1% Elastane, 9% Polyamide | Bilinmiyor | [Üretici](https://stanleystella.com/en-eu/rib-beanie-2-0-stau295) |
| beanie | Stanley/Stella Fisherman Beanie STAU771 | 95% Cotton, 5% Elastane | Bilinmiyor | [Üretici](https://stanleystella.com/en-eu/fisherman-beanie-stau771) |
| beanie | Stanley/Stella Rib Beanie STAU772 | 80% Cotton, 20% Polyester | Bilinmiyor | [Üretici](https://stanleystella.com/en-eu/rib-beanie-stau772) |
| sun-hat | Stanley/Stella Bucket Hat STAU893 | 80% Cotton, 20% Polyester | 300 | [Üretici](https://stanleystella.com/en-eu/bucket-hat-stau893) |
| short-sleeve-tee | Stanley/Stella Reeser STTU272 | 100% Cotton | 220 | [Üretici](https://stanleystella.com/en-eu/reeser-sttu272) |
| short-sleeve-tee | Stanley/Stella Hazener STTU277 | 100% Cotton | 370 | [Üretici](https://stanleystella.com/en-eu/hazener-sttu277) |
| short-sleeve-tee | Stanley/Stella Freestyler Super Vintage STTU280 | 100% Cotton | 240 | [Üretici](https://stanleystella.com/en-eu/freestyler-super-vintage-sttu280) |
| short-sleeve-tee | Stanley/Stella Stella Nova Vintage STTW283 | 100% Cotton | 155 | [Üretici](https://stanleystella.com/en-eu/stella-nova-vintage-sttw283) |
| short-sleeve-tee | Stanley/Stella Crafter STTU170 | 100% Cotton | 155 | [Üretici](https://stanleystella.com/en-eu/crafter-sttu170) |
| short-sleeve-tee | Stanley/Stella Crafter Vintage STTU976 | 100% Cotton | 155 | [Üretici](https://stanleystella.com/en-eu/crafter-vintage-sttu976) |
| short-sleeve-tee | Stanley/Stella Sparker 2.0 STTU171 | 100% Cotton | 215 | [Üretici](https://stanleystella.com/en-eu/sparker-2-0-sttu171) |
| short-sleeve-tee | Stanley/Stella Blaster 2.0 STTU959 | 100% Cotton | 200 | [Üretici](https://stanleystella.com/en-eu/blaster-2-0-sttu959) |
| short-sleeve-tee | Stanley/Stella Breezer STTU964 | 100% Cotton | 155 | [Üretici](https://stanleystella.com/en-eu/breezer-sttu964) |
| short-sleeve-tee | Stanley/Stella Asher STTU078 | 100% Cotton | 280 | [Üretici](https://stanleystella.com/en-eu/asher-sttu078) |
| short-sleeve-tee | Stanley/Stella Freestyler STTU788 | 100% Cotton | 240 | [Üretici](https://stanleystella.com/en-eu/freestyler-sttu788) |
| short-sleeve-tee | Stanley/Stella Hypster STTU258 | 100% Cotton | 200 | [Üretici](https://stanleystella.com/en-eu/hypster-sttu258) |
| short-sleeve-tee | Stanley/Stella Blaker STTU263 | 60% Cotton, 40% Modal | 155 | [Üretici](https://stanleystella.com/en-eu/blaker-sttu263) |
| short-sleeve-tee | Stanley/Stella Freestyler Vintage STTU073 | 100% Cotton | 240 | [Üretici](https://stanleystella.com/en-eu/freestyler-vintage-sttu073) |
| short-sleeve-tee | Stanley/Stella RE-Creator STTU787 | 100% Cotton | 180 | [Üretici](https://stanleystella.com/en-eu/re-creator-sttu787) |
| short-sleeve-tee | Stanley/Stella Rocker STTU758 | 100% Cotton | 150 | [Üretici](https://stanleystella.com/en-eu/rocker-sttu758) |
| short-sleeve-tee | Stanley/Stella Stella Muser STTW172 | 100% Cotton | 180 | [Üretici](https://stanleystella.com/en-eu/stella-muser-sttw172) |
| short-sleeve-tee | Stanley/Stella Stella Expresser 2.0 STTW079 | 100% Cotton | 155 | [Üretici](https://stanleystella.com/en-eu/stella-expresser-2-0-sttw079) |
| short-sleeve-tee | Stanley/Stella Stella Serena STTW173 | 100% Cotton | 155 | [Üretici](https://stanleystella.com/en-eu/stella-serena-sttw173) |
| short-sleeve-tee | Stanley/Stella Stella Raya STTW259 | 100% Cotton | 200 | [Üretici](https://stanleystella.com/en-eu/stella-raya-sttw259) |
| short-sleeve-tee | Stanley/Stella Stella Etta STTW264 | 60% Cotton, 40% Modal | 155 | [Üretici](https://stanleystella.com/en-eu/stella-etta-sttw264) |
| short-sleeve-tee | Stanley/Stella Stella Nova STTW175 | 100% Cotton | 155 | [Üretici](https://stanleystella.com/en-eu/stella-nova-sttw175) |
| short-sleeve-tee | Stanley/Stella Stella Ella STTW174 | 100% Cotton | 180 | [Üretici](https://stanleystella.com/en-eu/stella-ella-sttw174) |
| short-sleeve-tee | Stanley/Stella Stella Collider STTW089 | 100% Cotton | 155 | [Üretici](https://stanleystella.com/en-eu/stella-collider-sttw089) |
| short-sleeve-tee | Stanley/Stella Stanley Presenter STTM562 | 100% Cotton | 155 | [Üretici](https://stanleystella.com/en-eu/stanley-presenter-sttm562) |
| long-sleeve-tee | Stanley/Stella Creator 2.0 Long Sleeve STTU199 | 100% Cotton | 180 | [Üretici](https://stanleystella.com/en-eu/creator-2-0-long-sleeve-sttu199) |
| tank-top | Stanley/Stella Stella Ava STTW963 | 100% Cotton | 180 | [Üretici](https://stanleystella.com/en-eu/stella-ava-sttw963) |
| tank-top | Stanley/Stella Stella Mia STTW962 | 100% Cotton | 155 | [Üretici](https://stanleystella.com/en-eu/stella-mia-sttw962) |
| tank-top | Stanley/Stella Stanley Stancer STTM961 | 100% Cotton | 180 | [Üretici](https://stanleystella.com/en-eu/stanley-stancer-sttm961) |
| blouse | Koton 5SAK60077EW | 100% Viscose | Bilinmiyor | [Üretici](https://www.koton.com/viskon-kumas-nakis-detayli-uzun-kollu-v-yaka-bluz-ekru-4053129/) |
| blouse | Koton 2YAK66445IW | 100% Cotton | Bilinmiyor | [Üretici](https://www.koton.com/balon-kollu-pamuklu-bluz-siyah-1216501/) |
| rain-poncho | SIMOND MT500 60 L 324443 | 100% Polyester | Bilinmiyor | [Üretici](https://www.decathlon.com.tr/p/outdoor-panco-yagmurluk-60l-siyah-mt500/_/R-p-324443?c=S) |
| rain-poncho | QUECHUA MT50 10 L 339021 | 100% Ethylene vinyl acetate | Bilinmiyor | [Üretici](https://www.decathlon.com.tr/p/outdoor-panco-10l-gri-mt-50/_/R-p-339021?c=MAV%C4%B0&mc=8737843) |
| rain-poncho | FORCLAZ MT100 30 L 307368 | 100% Polyester | Bilinmiyor | [Üretici](https://www.decathlon.com.tr/p/outdoor-panco-yagmurluk-30-l-mavi-mt-100/_/R-p-307368?c=MAV%C4%B0&mc=8544274) |
| rain-poncho | BTWIN 100 City 340456 | 100% Polyester | Bilinmiyor | [Üretici](https://www.decathlon.com.tr/p/100-sehir-bisikleti-pancosu-siyah/_/R-p-340456?c=S%C4%B0YAH&mc=8759248) |
| rain-poncho | BTWIN 540 Cycling 343195 | 100% Polyester | Bilinmiyor | [Üretici](https://www.decathlon.com.tr/p/540-bisiklet-panco-yagmurluk-gri/_/R-p-343195?c=GR%C4%B0&mc=8958852) |

## Bekleyen veri işleri

100 hedefi tamamlanmış değildir. Öncelik boş türler: termal üst, kazak, hırka, hafif ceket, rüzgârlık, şişme mont, kaban/parka, jean, tayt, etek, elbise, günlük spor ayakkabı, sandalet, yağmur botu, kışlık bot, çorap, atkı ve eldiven. Dolu türlerin her biri de 100'e tamamlanmalıdır. Mevcut Stanley/Stella ve outdoor yoğunluğu farklı mağaza/marka, fiyat segmenti ve günlük kullanım örnekleriyle dengelenmelidir. Çocuk modeli, renk veya aynı modelin farklı ülke/satıcı kaydı yetişkin hedefini doldurmaz.

Trendyol araştırması sürer; resmî satıcı API'si platformdaki bütün ürünleri veren genel bir API değildir. Awin/marka feed'i, Printful kullanım kapsamı ve GS1 barkod erişimi için önceki kayıtlı önkoşullar geçerlidir. Hesap, ücretli erişim, görsel veya uygulama yetkisi varmış gibi aktarım açılmadı. Açık sayfalardaki doğrulanabilir modeller artımlı gruplarla eklenebilir; her yeni grup ayrı inceleme ve alan kanıtından geçmelidir.

Bu tur erişilemeyen Koton 7YAK63778EW, 6YAK62123OW, 5SAK60432PW, 3SAK60024PW ve Stanley/Stella STTW176 yayımlanmadı. Koton 7YAK68579PW'de kumaş başlığı polyester, oran alanları viskoz çelişkisi var; 7YAK34278FK ise örgü tank-top/bluz sınırı nedeniyle bu türe zorlanmadı. Bu adayları güncel doğrudan sayfa ve bileşen/tür kapsamı ile yeniden kontrol edin.

3D katman hatası ve yeni SVG silüetlerinin gerçek 3D geometriye bağlanması bu turun dışında açık iştir.


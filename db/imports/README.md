# İlk kaynaklı ürün grubu — 18 Ekim 2026

Dosya: [short-sleeve-tees.tr.2026-10-18.json](short-sleeve-tees.tr.2026-10-18.json).

**10 farklı model, 10 kaynak, tek tür: `short-sleeve-tee`.** Tür başına 10–15 model hedefinin ilk türde alt sınırı sağlandı. Diğer 31 tür bu pakette doldurulmadı. Yedi marka/alt marka adı, üç mağaza alan adı var; bu yedi bağımsız üretici şirket iddiası değildir. DOMYOS/QUECHUA/KIPRUN aynı mağaza ekosistemindedir.

## Ürünler ve kaynaklar

| Kayıt | Marka / model | Ana kumaş | GSM (g/m²) | Kaynak |
| --- | --- | --- | --- | --- |
| domyos-332540 | DOMYOS / 332540 | 100% Cotton | 190 | [Ürün sayfası](https://www.decathlon.com.tr/p/erkek-kisa-kollu-bisiklet-yaka-spor-tisortu-koyu-yesil/_/R-p-332540) |
| domyos-338648 | DOMYOS / 338648 | 100% Cotton | 190 | [Ürün sayfası](https://www.decathlon.com.tr/p/kadin-v-yakali-spor-tisortu-eflatun-fitness/_/R-p-338648) |
| quechua-349961 | QUECHUA / 349961 | 60% Cotton + 40% Polyester | Bilinmiyor | [Ürün sayfası](https://www.decathlon.com.tr/p/erkek-kisa-kollu-outdoor-tisort-bej-nh100/_/R-p-349961) |
| kiprun-355949 | KIPRUN / 355949 | 72% Polyester + 19% Polyamide + 9% Elastane | Bilinmiyor | [Ürün sayfası](https://www.decathlon.com.tr/p/erkek-dikissiz-kosu-tisortu-siyah-fume-500-confort-slim/_/R-p-355949) |
| kiprun-340992 | KIPRUN / 340992 | 68% Polyester + 32% Polyamide | Bilinmiyor | [Ürün sayfası](https://www.decathlon.com.tr/p/erkek-dikissiz-kosu-tisortu-siyah-kiprun-run-500-confort/_/R-p-340992) |
| norfolk-ragnar | NORFOLK / RAGNAR | 100% Merino wool | 150 | [Ürün sayfası](https://www.decathlon.com.tr/p/mp/norfolk/percent100-merinos-yunlu-erkek-outdoor-tisort-ragnar/_/R-p-9b4d0d1a-4311-4fb0-bb4c-480797840de2) |
| lcw-0s2159z8 | LCW EVERYDAY / 0S2159Z8 | 96% Cotton + 4% Elastane | Bilinmiyor | [Ürün sayfası](https://www.lcw.com/duz-basic-pamuklu-kisa-kollu-kadin-tisort-siyah-o-649561) |
| ms-t41002101c | M&S Collection / T41002101C | 50% Modal + 50% Linen | Bilinmiyor | [Ürün sayfası](https://www.marksandspencer.com.tr/kadin-beyaz-keten-karisimli-v-yaka-tisort-10000000878642/) |
| ms-t28004960a | Autograph / T28004960A | 100% Cotton | Bilinmiyor | [Ürün sayfası](https://www.marksandspencer.com.tr/erkek-mavi-pure-supima-r-slim-fit-premium-pamuklu-t-shirt-10000000877156/) |
| ms-t41007738 | M&S Collection / T41007738 | 100% Cotton | Bilinmiyor | [Ürün sayfası](https://www.marksandspencer.com.tr/kadin-siyah-100-pamuklu-slim-fit-kisa-kollu-tisort-10000000979767/) |

GSM yalnız 332540, 338648 ve RAGNAR sayfalarında g/m² olarak açık beyan bulunduğunda kaydedildi. KIPRUN'un 93 g / 0,1 kg ve QUECHUA'nın 0,16 kg ürün ağırlıkları kumaş gramajına çevrilmedi. Lif adları arama için İngilizce ortak adlara normalize edildi; Supima bir pamuk çeşidi olarak Cotton altında, merinos ise Merino wool olarak saklandı.

## Kayıt ve doğrulama yöntemi

- 18 Ekim 2026 Türkiye tarihli taramada resmî ürün sayfalarının web aracına sunulan metni/önbelleği incelendi. Ortak `accessedAt` UTC zaman damgası araştırma oturumunun kayıt zamanıdır; HTTP sunucusunun içerik güncelleme veya canlı stok onay tarihi değildir. UTC'de 17 Ekim akşamı, Türkiye'de 18 Ekim'dir.
- Ürün adları kısa ve tarafımızdan düzenlenmiş TR/EN etiketlerdir; üretici başlıklarının eksiksiz çevirisi oldukları iddia edilmez. Pazarlama paragrafları, yorumlar, fotoğraflar ve sertifika iddiaları kopyalanmadı.
- `manufacturer` dayanağı ürünün ticari beyanını belirtir; etiket fotoğrafı veya bağımsız laboratuvar sonucu değildir. NORFOLK kaynağı, Decathlon pazaryerindeki Norfolk TR satıcı sayfasıdır ve `kind: retailer` olarak ayrılır. Notta bunun satıcı beyanı olduğu açıkça yazılıdır.
- Her modelde yalnız `shell` yani ana kumaş kaydedildi. Ayrı yaka/ribana/örgü parçaları kaynak notlarında belirtilir; ana kumaşa katılmaz. Bu veri, ürünün tamamının tek liften oluştuğunu veya bütün renk varyantlarının aynı bileşime sahip olduğunu doğrulamaz. Yeni varyantın bileşimi yeniden kontrol edilmelidir.
- KIPRUN 340992 ile 355949 farklı model kimliği ve farklı bileşime sahiptir; renk varyantı çoğaltması değildir. Aynı ailede olmaları dokümanda korunur. Kaynak mağaza model kodları evrensel MPN veya GTIN olarak yorumlanmaz.
- DOMYOS, QUECHUA ve M&S bağlantıları farklı renge/bedene yönlenebilir. Kaynakta başlık, renk listesi ve ürün numaraları arasında tutarsızlık görülen alanlar kayda zorlanmadı. Autograph T28004960A için slim/normal kesim çelişkisi bulunduğundan kesim özelliği eklenmedi.
- Her modelde tek `-unresolved` referansı bulunur: GTIN, beden, renk ve SKU açıkça `null`. Bu bir satılabilir SKU, taranabilir barkod veya belirli stok varyantı değildir. Varyantlar model hedefini artırmaz.
- `technical`, sıcaklık puanı, su/rüzgâr koruması ve nefes alabilirlik bu grupta `null`. Kumaştan 1–5 sıcaklık veya pazarlama metninden ölçülmüş teknik seviye türetilmedi.
- `offers: []`: ilk grup fiyat/stok aktarmaz. Sayfa yönlendirmeleri, beden seçimi ve geçmiş kampanyalar güncel fiyat iddiası üretmeye yeterli görülmedi. Gelecekte teklifler doğrulanmış varyant ve gözlem tarihiyle eklenmelidir.

## Dışarıda bırakılan adaylar

LCW S41081Z8, S5N441Z8, S5RC46Z8, S4KA44Z8, Benetton 124P3NLHE4249 ve M&S T28004500M adayları da araştırıldı; bu pakete eklenmedi. Bazılarında yalnız arama dizini özeti bulunabildi veya ürün detayına erişim tutarlı değildi. KIPRUN 145864 bağlantısı kategori sayfasına yönlendi. KALENJI 330591 sonucunda kısa kollu görünen adres uzun kollu ürün metni sundu; yanlış türe alınmadı. Bu adaylar ürün sayısını doldurmak için kullanılmadı.

## Kullanım ve yayın durumu

Bu dosya **yerel testten geçmiş bir içe aktarma adayıdır**. Web uygulamasına veya kalıcı/üretim veritabanına otomatik yayımlanmaz. Toplu veri akışı/API lisansı alındığı iddia edilmez; dış yayından önce kaynak kullanımı ve veri güncelliği mevcut inceleme adımında kontrol edilmelidir. Bu çalışma yalnız olgusal ürün kimliği/ana kumaş beyanlarını ve kaynak bağlantılarını hazırlar.

```sh
npm run catalog:validate -- db/imports/short-sleeve-tees.tr.2026-10-18.json
node --test tests/catalog-data.test.cjs
```

İkinci komutta DB değişkeni yoksa beş veri testi çalışır, PostgreSQL testi açıkça atlanır. Tam kontrol yalnız yeni/boş, loopback üzerinde atılabilir `weathrobe_catalog_data_test` DB'sine ait `CATALOG_DATA_TEST_DATABASE_URL` ayarlanarak yapılır. Kaynaklı grup doğrulanır, taslaklaştırılır ve **yalnız o test DB'sinde** yayımlanarak geri okunur. Test tüm yerel/uzak ortamlar için bağlantı yetkisi vermez.

18 Ekim 2026 çalıştırması: **6/6 başarılı**, PostgreSQL testi atlanmadı. 10 model/10 kaynak, 32 tür içinde yalnız ilk türde 10 model ve 23 eski profilin korunması doğrulandı. Çalışma sonunda geçici test konteyneri durdurulur; JSON kayıtları bu dizinde kalır.

## Sonraki yerel aktarım — 18 Ekim 2026

Kullanıcının açık aktarım onayıyla bu incelenmiş grup **kalıcı yerel `weathrobe-local` PostgreSQL kataloğunda** yayımlandı. `npm run catalog:local` aynı yayını çoğaltmadan korur. Dolabım → Katalog → Gerçek ürünler görünümü 10 modeli, kaynaklı kumaş bilgisini ve TR/EN aramayı sunar. Önceki yalnız-test açıklamaları, bu işlemden önceki durumun kaydıdır.

JSON/kaynak verisi bu UI turunda değiştirilmedi. Teknik null değerler, çözümlenmemiş varyantlar ve boş teklifler korunur. Görseller temsili çizimlerdir; gerçek ürün fotoğrafı veya renk/kesim doğrulaması değildir. Ürünler henüz kişisel dolaba eklenmez veya öneri puanına dönüştürülmez. Yerel DB'nin açılması dış yayın ya da Oracle kurulumu anlamına gelmez.

## Dolap entegrasyonu ve görsel kaynak değerlendirmesi — 18 Ekim 2026

Sonraki kullanıcı onayıyla bu modeller kişisel dolaba eklenebilir ve Eşleştir'de seçilebilir oldu. Kaynaklı gerçekler değiştirilmez; ayrıca verilen kişisel ısı tahmini otomatik sıralamada kullanılabilir. Önceki yalnız-inceleme ifadesi bu entegrasyondan önceki durumdur.

Mevcut kaynak dağılımı **Decathlon Türkiye 6 / LCW 1 / Marks & Spencer Türkiye 3** modeldir. Decathlon'un beş modeli kendi markalarından, NORFOLK ise pazaryeri satıcısından gelir. Veriler ürün sayfası metni/önbelleği incelenerek hazırlanmıştır; otomatik/ücretsiz canlı API bağlantısı kurulmuş değildir.

Ürün fotoğrafları bu gruba indirilmedi veya dış URL ile gömülmedi. Görsellerin kullanımı ayrıca doğrulanmalıdır:

- [Decathlon Türkiye üyelik sözleşmesi, bölüm 6](https://www.decathlon.com.tr/Web-Sitesi-Uyelik-Sozlesmesi_lp-NYUPQA): görsel ve diğer içerik hakları saklıdır. Kamuya açık ürün sayfası, fotoğrafın yeniden yayın iznini tek başına göstermez.
- [LCW kullanım koşulları](https://www.lcw.com/statik/kullanimkosullari): görsel/içerik çoğaltma ve başka mecrada kullanma için önceden yazılı izin belirtilir.
- [Decathlon UK resmî affiliate programı](https://www.decathlon.co.uk/c/lp/affiliate-program-decathlon_5af91ef3-3375-44f9-9c12-dfaf92c62c8d): onaylı iş ortaklarına Awin üzerinden görsel materyal/link ve ürün akışı sunulduğunu açıklar. Bu Birleşik Krallık programıdır; Türkiye ürünleri veya uygulamamız için otomatik izin/ücretsiz erişim iddia edilmez.
- M&S Türkiye için bu tur açık görsel yeniden-kullanım lisansı doğrulanmadı. Mağazayla yazılı anlaşma veya kapsamı uygun veri/görsel akışı ayrıca incelenmelidir.

Gelecekte lisanslı görsel kaydında ürün/varyant eşleşmesi, kaynak URL'si, hak sahibi/izin dayanağı, kontrol tarihi ve gösterim/önbellekleme koşulları birlikte tutulmalı; bağlantı kırılınca mevcut temsili çizim kullanılmalıdır. Bu, henüz uygulanmış bir medya altyapısı değildir.

## İkinci grup: dört yeni kaynak — 18 Ekim 2026

[multi-source-tees.2026-10-18.json](multi-source-tees.2026-10-18.json) **14 yeni model / 14 kaynak gözlemi** içerir: DeFacto 2, Koton 4, Mavi 4, Stanley/Stella 4. Yeni grubun 4 modeli kısa, 10 modeli uzun kolludur. Önceki 10 model değişmedi; toplam kısa kollu **14**, uzun kollu **10**, bütün katalog **24** model oldu. Renkler/ülke sayfaları ayrı model sayılmadı; çocuk modelleriyle yetişkin hedefi tamamlanmadı.

Tam model/kumaş/gramaj/kaynak tablosu, dışarıda kalan çelişkili adaylar ve bütün sağlayıcıların erişim durumları [kaynak takip belgesinde](../sources/README.md), makine kaydı [registry.json](../sources/registry.json) içindedir. Yeni grupta 180/240/200/180 g/m² yalnız STTU169/STTU200/STTM558/STTW219 resmî beyanlarıdır. Diğer GSM ve bütün termal/koruma alanları bilinmiyor kalır. Eski/outlet/0 renk sayfaları satışta olma iddiası üretmez. Printful API gözlemi veri araştırmasıdır; bu import grubuna veya yerel yayın listesine dahil değildir.

[local-approved.json](local-approved.json) yalnız bu iki incelenmiş grubu içerir. `npm run catalog:local` artık bu listeyi okur; her JSON'u otomatik yüklemez. Liste inceleme tarihi eski kaynaklara yeni kontrol zamanı veya ilk yayın tarihi atamaz; ürün kaynaklarının kendi accessedAt alanları korunur. Eski grupların içeriği ve bu belgenin önceki bölümleri tarihsel kayıt olarak değiştirilmedi.

`tests/catalog-sources.test.cjs`: **6/6 başarılı**, ayrı gerçek PostgreSQL testi atlanmadı. Birleştirilmiş kimlik benzersizliği, kaynak/bileşim, yalnız açık GSM, bilinmeyen alanlar, gelecek kaynakların yayın dışında kalması, Printful renk bazlı reçeteleri, idempotent yayın, arama ve 12+12 sayfalama doğrulandı.

## Tam kombin için beş yeni grup — 18 Ekim 2026

| Dosya | Tür | Yeni model |
| --- | --- | --- |
| [sweatshirt](sweatshirt.2026-10-18.json) | Sweatshirt / hoodie | 10 |
| [fleece](fleece.2026-10-18.json) | Polar | 10 |
| [woven-trousers](woven-trousers.2026-10-18.json) | Kumaş pantolon | 10 |
| [rain-jacket](rain-jacket.2026-10-18.json) | Yağmurluk | 10 |
| [running-shoes](running-shoes.2026-10-18.json) | Koşu ayakkabısı | 10 |

Bu 50 model listeye eklenip kalıcı yerel kataloğa yayımlandı. Önceki 24 ile toplam **74 model**, **7 grup**, **7 dolu tür**; kalan **25 tür** için model ekleme gerekir. Her yeni ürünün kaynaklı ana bileşimi var; 16 yeni GSM ile tüm katalogda 23 ürünün gramajı bilinir. Teknik ısı puanı hiçbir yeni ürün için üretilmedi.

Su korumasında 9 üretici su geçirmezlik iddiası ve çelişkili Raincut 134585 için ihtiyatlı su itici kaydı bulunur. Kaplama/taban/takviye ana kumaş oranlarına karıştırılmaz. Marka/model adları ve TR/EN adlar hazırdır; renk/desen/kesim/beden/GTIN/fiyat alanları doğrulanmadığından boş kalır. Her üründeki çözümlenmemiş referans gerçek stok varyantı değildir.

[Model tablosu, istisnalar ve sonraki veri sırası](../sources/complete-outfit-research.2026-10-18.md). Genel kaynak kalite testi yeni toplamı kapsar; yeni `tests/catalog-expansion.test.cjs` 50 modelin ayrı tasarım kodlarını, bileşen sınırlarını, gramajı, ihtiyatlı koruma kayıtlarını ve dolap dönüşümünü denetler. Ayrı PostgreSQL çalıştırmasıyla yeni+genel kaynak paketindeki 10/10 test başarılı, atlanan yoktur.

## 72 model ve güncel kapsam — 18 Ekim 2026

`*.expansion.2026-10-18.json` adlı 13 yeni, ayrı grup yayımlandı: kısa kollu tişört 25, uzun kollu 1, atlet 3, gömlek 8, polo 5, bluz 2, yelek 8, softshell 2, eşofman altı 5, şort 2, bere 5, şapka 1, yağmurluk pançosu 5. Toplam **72**; önceki 74 ile **146 gerçek model**, **20 incelenmiş grup**. Her grup [local-approved.json](local-approved.json) içinde açıkça listelenmiştir; yayınlanan eski JSON içeriği değiştirilmez.

Güncel hedef 36 türün **her birinde 100**, toplam 3.600 modeldir. 18 tür dolu, 18 boş, tamamlanan tür 0; **3.454 model eksik**. Kaynak sayfası gözlemi güncel stok/teklif değildir. Renk/bedenler, çocuk modelleri, aynı modelin ülke/satıcı kopyaları veya 180 SVG tasarımı hedefe eklenmez. Yeni gruptaki 60 GSM ve 13 su koruması beyanının kapsamı [kaynak kararlarında](../sources/catalog-expansion.2026-10-18.md) açıklanmıştır.

Tüm JSON grupları birleşik şema/kimlik testlerinden ve ayrı PostgreSQL yayın/geri okuma/idempotans kontrolünden geçti; ardından kalıcı yerel veritabanına aktarıldı. [Güncel tür tablosu](../sources/catalog-progress.md) açık grupları sayar. Boş türler ve düşük kapsamlı türlerin 100'e tamamlanması devam eden veri toplama işidir.


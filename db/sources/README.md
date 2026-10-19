# Kaynak erişimi ve gelecek işler — 18 Ekim 2026

Makinece okunabilen kayıt: [registry.json](registry.json). Bu dosya **13 sağlayıcının** mevcut durumunu tutar; onaylı verisi olan 7 sağlayıcı ve gelecek erişim/doğrulama işi bulunan 6 sağlayıcı vardır. Bu sayı marka veya ürün sayısı değildir.

Kullanıcı bütün adayları incelemeyi, erişilebilen güvenilir verileri almayı ve kalanları gelecek iş olarak kaydetmeyi onayladı. Yeni 14 model dört kaynaktan alındı: **DeFacto 2, Koton 4, Mavi 4, Stanley/Stella 4**. Önceki Decathlon/LCW/M&S grubu değişmedi. Onaylı toplam **24 model: 14 kısa kollu + 10 uzun kollu**; 32 türün kalan 30'u henüz doldurulmadı.

## Alınan yeni ürünler

Grup: [multi-source-tees.2026-10-18.json](../imports/multi-source-tees.2026-10-18.json). Ana kumaş yüzdeleri ve yalnız açık üretici gramajları kaydedildi. Tablodaki ürün adları/ana kumaş verileri fotoğraf veya mağaza içeriği lisansı alındığı anlamına gelmez.

| Marka / model | Tür | Ana kumaş | g/m² | İncelenen sayfa |
| --- | --- | --- | --- | --- |
| DeFacto / E3431AX | Kısa kol | 100% Cotton | Bilinmiyor | [Kaynak](https://www.defacto.com.tr/regular-fit-bisiklet-yaka-tisort-3208424) |
| Koton / 4SAM10546HK | Kısa kol | 100% Cotton | Bilinmiyor | [Kaynak](https://www.koton.com/dar-kesim-pamuklu-kisa-kollu-bisiklet-yaka-basic-tisort-lacivert-3887369/) |
| Mavi / 0610277 | Kısa kol | 56% Polyester + 41% Cotton + 3% Elastane | Bilinmiyor | [Kaynak](https://www.mavi.com/dokulu-siyah-basic-tisort/p/0610277-900) |
| Stanley/Stella / STTU169 | Kısa kol | 100% Cotton | 180 | [Kaynak](https://stanleystella.com/en-eu/creator-2-0-sttu169?deal=1) |
| DeFacto / I8183AX | Uzun kol | 100% Cotton | Bilinmiyor | [Kaynak](https://www.defacto.com.tr/100-pamuk-dikis-detayli-slim-fit-bisiklet-yaka-uzun-kollu-basic-tisort-3529939) |
| Koton / 6SAM10386MK | Uzun kol | 100% Cotton | Bilinmiyor | [Kaynak](https://www.koton.com/regular-fit-pamuklu-uzun-kollu-bisiklet-yaka-tisort-antrasit-4148103/) |
| Koton / 5WAK50233EK | Uzun kol | 97% Cotton + 3% Elastane | Bilinmiyor | [Kaynak](https://www.koton.com/uzun-kollu-yari-transparan-ajurlu-dik-yaka-tisort-ekru-3976768/) |
| Koton / 1KAM15012LK | Uzun kol | 100% Cotton | Bilinmiyor | [Kaynak](https://www.koton.com/pamuklu-dugmeli-yaka-uzun-kollu-slim-tisort-bordo-sarap-1077167-1/) |
| Mavi / 064622 | Uzun kol | 100% Cotton | Bilinmiyor | [Kaynak](https://www.mavi.com/uzun-kollu-dokulu-beyaz-tisort/p/064622-20454) |
| Mavi / 065755 | Uzun kol | 100% Cotton | Bilinmiyor | [Kaynak](https://www.mavi.com/uzun-kollu-siyah-basic-tisort/p/065755-900) |
| Mavi / 1613323 | Uzun kol | 100% Cotton | Bilinmiyor | [Kaynak](https://www.mavi.com/uzun-kollu-siyah-basic-tisort/p/1613323-900) |
| Stanley/Stella / STTU200 | Uzun kol | 100% Cotton | 240 | [Kaynak](https://stanleystella.com/en-eu/freestyler-long-sleeve-sttu200) |
| Stanley/Stella / STTM558 | Uzun kol | 100% Cotton | 200 | [Kaynak](https://stanleystella.com/en-eu/shifts-dry-sttm558) |
| Stanley/Stella / STTW219 | Uzun kol | 100% Cotton | 180 | [Kaynak](https://stanleystella.com/en-eu/stella-muser-long-sleeve-sttw219) |

Kaynaklı ürün kimliği, ana kumaş ve varsa GSM alanları alınmıştır. Eski 10 modele ek olarak yeni grupta 4 açık GSM beyanı vardır; toplam 7 modelde GSM bilinir. Organik/geri dönüştürülmüş pamuk, Cotton ortak lif adı altında normalize edilir; işleme/sertifika iddiası ölçülmüş teknik performans olarak kullanılmaz. Kaynak notları ürünün evidence alanındadır.

## Gelecekte ele alınacaklar

| Kaynak | Bu tur elde edilen | Bekleyen koşul / sonraki işlem |
| --- | --- | --- |
| **Printful** | Hesapsız GET /products HTTP 200; 571 kayıt gözlendi. Bella + Canvas 3501 ve Gildan 2400 detayları ile seçili renk/bedenlerin kumaş yüzdeleri [araştırma snapshot'ında](printful-probe.2026-10-18.json). | Genel listede giyim dışı ürünler de var. Modelin kumaşı renge göre değiştiği için tek reçeteye zorlanmadı. API'nin bu uygulamadaki katalog kullanımı ve medya kapsamı doğrulanınca varyant bazlı adaptör hazırlanmalı. |
| **Awin** | Ürün/görsel akışı ve marka onayından sonraki materyal kullanımı resmî dokümanda belirtiliyor. | Yayıncı hesabı + ilgili marka/program kabulü + ülke ve uygulama/gösterim/önbellek kapsamı. Belirli bir Türk markasının programda olduğu doğrulanmadı. |
| **Verified by GS1** | GTIN/şirket/temel ürün kimliği hizmeti doğrulandı. Kamu sorguları için resmî sınır 24 saatte 30; API için üye kuruluş yönlendirmesi var. | GS1 Türkiye üyelik/API, maliyet ve yeniden kullanım koşulları. Kumaş/termal performans/fotoğraf kaynağı olduğu varsayılmamalı. Bu tur barkod sorgusu yapılmadı. |
| **adidas Türkiye** | II3180 için ürün sayfası/indeks gözlemi var; güncel açık sayfa metninde kumaş ayrıntısı alınamadı. | Model ve ayrıntılı kumaş alanı birlikte tutarlı erişilince yeniden doğrula; yalnız indeks beyanıyla sayı tamamlanmadı. |
| **Trendyol** | Resmî satıcı ürün/filtreleme API dokümanları incelendi. | Merchant/partner yetkisi veya izinli satıcı/marka akışı. Satıcı API'si tüm platformun açık katalog API'si değildir. |
| **Hepsiburada** | Resmî portalın merchant/entegratör için olduğu doğrulandı. | Uygun satıcı/partner erişimi, kapsam ve maliyet netleşirse yeniden değerlendir. |

**Hiçbir yeni kaynak için hesap açılmadı, sözleşme kabul edilmedi, anahtar alınmadı, ücretli hizmet kullanılmadı veya mesaj gönderilmedi.** Görseller indirilmedi/gömülmedi; mevcut çizimler temsilidir. Printful'un image referansı bulunması veya mockup yardım sayfası, bütün katalog görsellerinin uygulamamızda serbestçe kullanılabileceğinin doğrulaması değildir. API şartları sayfasının metni web aracında eksik alındı; izin varmış gibi işaretlenmedi.

## Yayına alınmayan ürün adayları

- **Mavi 065755 antrasit:** açıklama %100 pamuk derken yüzdeler %50 pamuk/%50 polyester. Siyah 065755-900 kaydı yalnız kendi tutarlı gözlemine dayanır; antrasit bileşimi ona eklenmez.
- **Mavi 1613048:** Kumaş 1 %100 viskoz, Kumaş 2 %77 modal/%23 polyamid. Ana/astar/detay kapsamı açık olmadığı için tek ana kumaşa dönüştürülmedi.
- **Stanley/Stella STTU199:** indekslenmiş üretici ayrıntısı var; güncel doğrudan erişim yönlendirmede başarısız. Aynı aileden başka ülke modelini ayrı model sayarak hedef doldurulmadı.
- **Koton 5WAL10542IK:** ikili/paket açıklaması ile parça bileşimi kapsamı netleşmedi. Tekil kıyafet olarak alınmadı.
- Çocuk/bebek ürünleri yetişkin model hedefini doldurmak için kullanılmadı; yalnız renk farklılıkları ayrı model sayılmadı.

## Veri ve işletim sınırı

- Ürün sayfası metni ve web aracına sunulan önbellek incelendi; bu bir sürekli mağaza API entegrasyonu değildir. Ortak accessedAt araştırma oturumu kayıt zamanıdır; HTTP içerik sürümü veya canlı stok onayı değildir.
- Eski sayfa/outlet/arşiv ürünü kullanıcının sahip olduğu parçayı tanımada yararlı olabilir; katalogda görünmesi halen satıldığı anlamına gelmez. Özellikle STTM558 sayfasında 0 renk göründüğü kaynak notunda belirtilir.
- İncelenen renge ait ana kumaş beyanı bütün renkler için garanti değildir. Perakende sayfa telemetrisindeki fiyat/beden/GTIN otomatik olarak doğrulanmış varyant sayılmadı.
- Isı, su/rüzgâr koruması, nefes alabilirlik ve technical alanları bilinmiyorsa null; fiyat/stok listesi boş. Fotoğrafı bulunmayan kayda benzer bir mağaza fotoğrafı veya AI ürünü eklenmedi.
- [local-approved.json](../imports/local-approved.json) yalnız incelenmiş grupları açıkça listeler. registry/probe/gelecek adayları otomatik yayımlanmaz. reviewedAt bu oturumdaki yerel liste incelemesidir; eski grubun ilk yayın veya yeniden kaynak tarama tarihi değildir.
- Mevcut yerel dolap/geri bildirim kayıtları taşınmaz veya temizlenmez; kişisel ısı tahmini merkezi katalog gerçeğini değiştirmez.

## Resmî erişim belgeleri

- [Printful Catalog API](https://developers.printful.com/docs/) · [API şartları](https://www.printful.com/policies/api) · [Mockup kullanımının bağlamı](https://help.printful.com/hc/en-us/articles/50264186389393-What-are-mockup-images)
- [Awin ürün akışı](https://help.awin.com/developers/docs/product-feed-publisher-guide-intro) · [Görsel kullanım koşulu](https://success.awin.com/s/article/Can-I-use-any-images-from-the-advertiser-s-website?language=en_US)
- [GS1 hizmet ve erişim](https://support.gs1.org/support/solutions/articles/43000734077-what-is-verified-by-gs1-) · [Kamu sorgu koşulları](https://www.gs1.org/docs/verified-by-gs1/public-verified-by-gs1-tou.pdf)
- [Trendyol onaylı ürün filtreleme](https://developers.trendyol.com/docs/%C3%BCr%C3%BCn-filtreleme-onayl%C4%B1-%C3%BCr%C3%BCn-v2) · [Hepsiburada portalı](https://developers.hepsiburada.com/tr/companies/hepsiburada)

Bu kayıt otomasyon veya iş ortaklığı kurulmuş gibi yorumlanmamalıdır. Yeni erişim/izin geldiğinde ilgili kaynak ve test kanıtı güncellenmelidir.

## Yeni türler için kaynak incelemesi — 18 Ekim 2026

[50 model tablosu ve kaynak kararları](complete-outfit-research.2026-10-18.md): Decathlon Türkiye'den 40, Stanley/Stella'dan 10 model eklendi. Güncel dağılım Decathlon 46, Stanley/Stella 14, LCW 1, Marks & Spencer 3, DeFacto 2, Koton 4, Mavi 4 = **74** model. 13 sağlayıcı ve 6 bekleyen kaynağın koşulları korunur; registry.json ürün listeleri genişletildi.

EU ve ABD kodlu Stanley/Stella modelleri ayrı kimliklerle saklanır; Türkiye satışı varsayılmaz. Genel görsel/içerik lisansı veya API izni kurulmadı. Fiyat/stok/varyant doğrulanmadı; kaynak gözlem tarihi stok güncelliği değildir.

Kategoriye yönlenen Run Comfort ve KS900 2 ile tam sayfası açılamayan SOLOGNAC kadın yağmurluk yayımlanmadı. Yeniden inceleme koşulları makine kaydında. Günlük giyim mağazalarıyla mevcut spor/outdoor ağırlığını dengelemek sonraki önceliktir.

## Trendyol giyim araştırmasının derinleştirilmesi — 18 Ekim 2026

[Trendyol araştırma raporu](trendyol-research.2026-10-18.md): dört doğrudan ürün sayfasında kumaş, yaka/kol/kalıp/renk/desen alanları incelendi; beşinci sayfa 410 Gone döndü. Günlük giyim için yararlı adaylar var. Başlıkta çizgili/oversize olup özelliklerde düz/regular görünen örnek nedeniyle alan bazlı çelişki denetimi gerekir.

Resmî API satıcının kendi mağazasını kapsar, açık genel katalog değildir. Affiliate belgesi sosyal medya link/komisyon akışını açıklar; uygulamamız için genel feed/API erişimi doğrulanmadı. API barkodu otomatik olarak GTIN sayılmaz. Önerilen sonraki pilot: boş gömlek, jean/pantolon ve kazak/hırka türlerinden 10'ar ayrı model adayı, marka-model/varyant/satıcı ayrımı ve üretici çapraz kontrolü.

Bu tur araştırma ve registry notları güncellendi; 74 ürünlük katalog, canlı senkronizasyon ve uygulama kodu değişmedi. Fotoğraf/hesap/anahtar kullanılmadı.

## 100 hedefi için 72 yeni gerçek model — 18 Ekim 2026

[Bu turun model/kaynak ve veri kalitesi notları](catalog-expansion.2026-10-18.md), [yeniden üretilebilir ilerleme tablosu](catalog-progress.md). Toplam **146 model**, 36 türün 18'inde kayıt vardır; hedef 3.600, kalan 3.454. Bu sayıların 180 kişisel SVG tasarımıyla ilgisi yoktur. 13 sağlayıcı ve henüz devreye alınmamış API/partner koşulları korunur; canlı senkronizasyon açılmadı.

Yeni dağılım: Stanley/Stella 65, Koton 2, Decathlon 5; önceki 74 kayıt korunur. Registry ilgili ürün/source URL'leriyle genişletildi. STTU199 çalışan en-eu kaynağıyla alındı; eski en-gb erişim hatası tarihçe notuyla tutulur. Başlık/kumaş/tür çelişkisi ve güncel ayrıntısı alınamayan adaylar yayın dışındadır. Günlük giyim ve farklı mağazalarla kaynak dengesinin iyileştirilmesi sürer.



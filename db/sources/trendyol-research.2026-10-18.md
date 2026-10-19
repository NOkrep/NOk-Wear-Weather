# Trendyol giyim kaynağı araştırması — 18 Ekim 2026

Kontrol zamanı: 2026-10-18T13:52:15Z. Kullanıcının talebi kaynak uygunluğunu araştırmaktır. Bu dosya araştırma kaydıdır; katalog import grubu değildir. Yerel katalogdaki 74 ürün, aktarım listesi, uygulama kodu ve kişisel dolap değiştirilmedi. Kamu sayfaları araç önbelleğinden gelebilir; gözlem zamanı canlı stok veya üreticinin güncelleme tarihi değildir.

## Sonuç

Trendyol günlük giyim çeşitliliği ve ayrıntılı görünüm alanları için yararlı bir adaydır. İncelenen örnekler kumaş yüzdesi, renk, yaka, kol, kalıp ve desen alanlarının bulunabildiğini gösteriyor. Bu küçük örneklem tüm platformun veri kalitesini temsil etmez. Alanların doğruluğu ve eşleşmesi ürün/satıcı/varyant düzeyinde ayrıca incelenmelidir.

## Doğrudan sayfa gözlemleri

| Sayfa kimliği | Gözlem | Karar |
| --- | --- | --- |
| [Koton gömlek 1085945134](https://www.trendyol.com/koton/regular-fit-uzun-kollu-dugmeli-klasik-yaka-gomlek-p-1085945134) | Materyal bileşeni %60 pamuk/%40 polyester; klasik yaka, uzun kol, mavi, dokuma alanları var. Başlık Regular Fit derken Kalıp belirtilmemiş. | Kumaş için aday; kalıp tek bir doğrulanmış gerçeğe zorlanmaz. Üreticinin model kodu ve satıcı kimliği ayrıca eşleşmeli. |
| [Tudors gömlek 659663384](https://www.trendyol.com/tudors/slim-fit-uzun-kollu-koton-saten-premium-seri-erkek-gri-gomlek-p-659663384) | Açıklama ve materyal alanında %100 pamuk; saten dokuma, slim, uzun kol. Sayfa göndericiyi Tudors olarak gösteriyor. | İleride gömlek pilotu için güçlü aday. Marka mağazasının kimliği ve gerçek model/renk/beden ilişkisi ayrıca doğrulanmalı. |
| [Koton tişört 884118110](https://www.trendyol.com/koton/bisiklet-yaka-kisa-kollu-pamuk-karisimli-tok-kumas-cizgili-oversize-tisort-p-884118110) | Bileşim %54 polyester/%46 pamuk. Başlık çizgili/oversize; özelliklerde düz/regular. Açılan sayfa /pd yoluna yönleniyor ve tükendi diyor. | Kumaş ve görünüm kanıtları ayrılmalı. Desen/kalıp çelişkili; otomatik görünüm atanmamalı. Eski fiyat/stok canlı değer sayılmaz. |
| [MANGO pantolon 820285004](https://www.trendyol.com/mango/cepli-kargo-jean-pantolon-p-820285004) | Bileşim %100 pamuk; gönderici MANGO. Başlık jean, yapı alanı örme olarak listelenmiş. | Denim/dokuma sınıfını başlıktan çıkarıp kesinleştirmeyin; üretici modeliyle kontrol edin. |
| [Koton elbise 692670314](https://www.trendyol.com/koton/cupli-askili-gipeli-katli-midi-elbise-p-692670314) | Arama önbelleğinde alanlar var; doğrudan açılış 410 Gone döndü. | Yayımlanacak ürün adayı sayılmadı. İndeks metninden güncel kayıt üretilmez. |

Bu gözlemler retailer/mağaza sayfası beyanıdır. URL'de markanın bulunması tek başına üretici doğrulaması veya resmî mağaza kimliği kanıtı değildir. Gramaj, ısı puanı ve teknik koruma bu örneklerden türetilmedi.

## Resmî API erişimi

[Onaylı ürün v2 belgesi](https://developers.trendyol.com/docs/%C3%BCr%C3%BCn-filtreleme-onayl%C4%B1-%C3%BCr%C3%BCn-v2), satıcının kendi mağazasındaki ürünleri listelediğini açıklar. Yanıt modeli içerik/marka/kategori/özellik ve varyant alanları içerir. Bu belge bütün Trendyol kıyafetlerini herkese açan bir arama API'si değildir.

[Yetkilendirme belgesi](https://developers.trendyol.com/v2.0/docs/authorization): supplierId, API key ve secret satıcı panelinden alınır; Basic Auth ve User-Agent gerekir. Satıcı hesabı açmak diğer mağazaların tüm ürünlerine erişim sağladığı anlamına gelmez. Hesap açılmadı, anahtar istenmedi, kimlik doğrulamalı istek atılmadı. API/partner erişiminin Weathrobe için maliyeti ve yeniden kullanım kapsamı doğrulanmış değildir.

V2 örnek yanıtındaki barcode alanında alfanümerik değerler de var. Bu nedenle bu alanı doğrudan doğrulanmış EAN/GTIN saymayın. Gelecekte kaynağa ait ham kimlik ile checksum/kapsam/varyantı doğrulanmış GTIN ayrı tutulmalı. Tek başına platform contentId'si de bütün satıcı/renk/bedenler arasında üretici model kimliği değildir.

## Affiliate ve sürekli veri akışı

[Trendyol Affiliate eğitim belgesi](https://www.trendyol.com/s/trendyol-affiliate-programi) sosyal medya ürün/kolleksiyon bağlantıları ve satış komisyonunu açıklar. Bu belgede Weathrobe gibi bir uygulama için genel katalog API'si veya XML akışı erişimini doğrulayamadım. Affiliate kabulünü otomatik veri/görsel yeniden kullanım hakkı saymayın. Türkiye uygulama/yayıncı kapsamı, ürün akışı, alanlar, güncelleme sıklığı ve maliyet Trendyol veya yetkili marka ile ayrıca netleşmeli.

Önerilen uzun vadeli yol: markanın Weathrobe'ye kullanım kapsamı belirli bir CSV/JSON/XML akışı sağlaması veya uygun partner anlaşması. Satıcının tüm entegrasyon anahtarlarını istemek yerine satıcının kendi tarafında hazırladığı sınırlı ürün dışa aktarımı değerlendirilmelidir. Bu akış mevcut değildir; öneridir.

## Weathrobe için önerilen pilot ve eşleme

1. Önce boş günlük giyim türlerini hedefleyen 10 gömlek + 10 jean/kumaş pantolon + 10 kazak/hırka adayı inceleyin. Bunlar 30 ayrı doğrulanmış model hedefidir; bu araştırmada 30 model toplanmış değildir.
2. Markanın kendi mağazasına öncelik verin, satıcı kimliğini kontrol edin; mümkünse üreticinin resmî sayfası/model koduyla çapraz doğrulayın.
3. Ürün modeli, renk/beden varyantı ve satıcı/fiyat teklifini ayırın. Aynı üretici modelini farklı satıcı/renk altında yeni ürün saymayın. Sayfadaki tek barkodu tüm bedenlere atamayın.
4. Kaynak URL, satıcı, gözlem tarihi ve alan bazlı beyanı saklayın. Çelişkili alan bilinmiyor/inceleme bekliyor kalmalı; tutarlı bir kumaş oranı bütün görünüm alanlarını doğrulamaz.
5. GSM/ısı/koruma yoksa null. Fiyat için satıcı, varyant, ülke/para birimi, tarih ve kampanya koşulu gerekir; kişiye özel/sepette fiyatı koşulsuz teklif yapmayın.
6. Ortak temsili simgeleri kullanın. Görsel URL'sinin sayfada veya API yanıtında bulunması yeniden kullanım kapsamının doğrulandığı anlamına gelmez. Bu tur görsel indirilmedi.
7. İzinli sürekli akış sağlanana kadar otomatik toplu tarama kurulduğunu veya ücretsiz sınırsız erişimi varsaymayın. Gereken erişim/koşul incelemesi henüz tamamlanmadı.

## Mevcut sistemde kalan işler

- Şu an kişisel görünüm ayarları kaynaklı varyant özelliklerinden ayrıdır. Trendyol renk/desen/yaka/kol/kesim bilgileri doğrudan personalAppearance içine üretici gerçeği olarak yazılmamalı; alan kanıtlı varyant modeli gerekir.
- Satıcı kaynak kimliği ve ham platform barkodu, doğrulanmış GTIN'den ayrı bağlanmalı.
- Çelişki kaydı, marka-model yinelenmelerini engelleme, izinli aktarım ve kaynak güncelliği için sınırlı bir adaptör daha sonra ayrı geliştirme kapsamıdır.


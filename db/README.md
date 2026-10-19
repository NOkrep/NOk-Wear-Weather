# Katalog altyapısı — 18 Ekim 2026

Bu ilk sürüm PostgreSQL şemasını, **32 türü** ve tür başına **10–15 farklı gerçek model** hedefini kurar. Başlangıç gerçek ürün sayısı **0**; 23 eski öneri profili ayrı tutulur. `tests/catalog-fixture.cjs` sentetiktir, üretime içe aktarılmaz. Renk/beden sayısı ürün hedefini artırmaz.

## Kapsam ve veri modeli

| Grup | Türler | Hedef |
| --- | --- | --- |
| Temel üst | Kısa kollu tişört, uzun kollu tişört, atlet, gömlek, termal üst | 50–75 |
| Ara katman | Sweatshirt/hoodie, kazak, hırka, polar | 40–60 |
| Dış katman | Hafif ceket, rüzgârlık, yağmurluk, softshell, şişme mont, kaban/parka | 60–90 |
| Alt / tek parça | Jean, kumaş pantolon, eşofman altı, tayt, şort, etek, elbise | 70–105 |
| Ayakkabı | Günlük spor, koşu, sandalet, yağmur botu, kışlık bot | 50–75 |
| Aksesuar | Çorap, bere, şapka, atkı, eldiven | 50–75 |

- `lib/catalog/taxonomy.ts`: sabit kimlikler, TR/EN adlar, arama eş anlamları, vücut bölgeleri. Elbise `one_piece`; tek bir alt giyim parçası olarak zorlanmaz. Bölgeler temel kapsamdır; kol/boy uzunluğu gibi ürün ayrıntıları sonraki aşamadır.
- `products`: marka/model kimliği ve tür. Teknik ürün niteliği fiyat segmentinden bağımsız, bilinmiyorsa `null`.
- `variants`: beden/renk/SKU ve kontrol basamağı doğrulanmış, 14 haneye tamamlanmış GTIN. GTIN küresel olarak tekil; bilinmiyorsa `null`.
- `materials`: dış kumaş, astar ve dolgu ayrı. Bilinen her bölümün lif yüzdeleri toplamı 100. Kısmi/belirsiz etiket bilgisi doğrulanmadan tam bileşim sayılmaz.
- `sources` / `field_evidence`: bağlantı, erişim tarihi, alan bazında dayanak. Üretici/mağaza beyanı, etiket doğrulaması, laboratuvar ölçümü ve sıcaklık tahmini ayrıdır. Yalnız sıcaklık puanı açıklamalı tahmin kabul eder; kumaş veya su koruması tahmin edilmez.
- `offers`: varyant, ülke, para birimi, fiyat, gözlem tarihi ve gözlenen stok durumu. Tarihli gözlemler güncel stok garantisi değildir. Sonraki fiyat güncellemeleri için ayrı ekleme akışı henüz yoktur.
- `legacy_profiles`: eski kimlikleri korur; durum daima `legacy_unverified`. Eski dosyadaki GSM/performans değerleri doğrulanmış ürün bilgisine dönüştürülmez.
- `import_batches`: inceleme taslakları ve yayın durumu. Özel dolap, konum, avatar veya kişisel geri bildirim bu şemaya otomatik taşınmaz. Topluluk katkıları halen ayrı dosya tabanlı pilottur.

## Yerel kullanım ve Docker hazırlığı

Node.js 24+ ve Docker Compose v2 gerekir; kilitli barkod kitaplığı Node 24 ister. Oracle veya başka sağlayıcı hesabı gerekmeden yerelde hazırlanabilir.

`DATABASE_URL` yoksa `npm run dev` eski profillerle çalışır. Veritabanı ayarlanmış ama erişilemiyorsa API bunu açıkça `unavailable` bildirir; ürün sayısı bilinmiyor olarak döner.

Yeni bir ortamda:

```sh
npm ci
npm run catalog:setup
docker compose up -d --build
```

`catalog:setup` yalnız `.env` yoksa iki farklı rastgele parola oluşturur; mevcut dosyayı değiştirmez, parolaları çıktıya yazmaz ve sunucu başlatmaz. Mevcut `.env` için iki farklı 64 karakterlik onaltılık parolayı `POSTGRES_PASSWORD` ve `CATALOG_READER_PASSWORD` alanlarına ekleyin. URI içinde güvenle kullanılabilmeleri için kurulumda alfanümerik parolalar kullanılır. Gerçek parolaları sohbete veya Git'e eklemeyin.

Varsayılan Compose siteyi `127.0.0.1:3000` üzerinde açar; aynı porttaki geliştirme sunucusuyla birlikte başlatmayın. PostgreSQL portu dışarı yayımlanmaz. Kalıcı veriler named volume'larda tutulur. `catalog-migrate`, site başlamadan şemayı kurar ve salt okuma rolünü hazırlar. `catalog-tools` yönetici bağlantısını kullanır; web konteynerine yönetici parolası verilmez.

Doğrudan yönetilen bir PostgreSQL için `DATABASE_URL` ayarlayıp `npm run db:migrate` çalıştırılabilir. CLI `.env` dosyasını okur; Next.js ayrıca `.env.local` dosyasını okuyabilir. Çelişen ayar kaynakları oluşturmayın. Uzak veritabanında doğrulamalı TLS kullanın; bağlantı sertifika kontrolünü kapatmayın.

Geçişler checksum ile izlenir, transaction ve advisory lock kullanır; tekrar çalıştırma kayıtları çoğaltmaz. Uygulanmış SQL dosyasını değiştirmek yerine yeni geçiş ekleyin. Tür/legacy tohumları mevcut satırları sessizce güncellemez.

## Kaynaklı ürün ekleme

İçe aktarma bir JSON dosyasıdır; yapı `lib/catalog/model.ts` içinde tanımlıdır. En fazla 5 MiB dosya ve 1000 model kabul edilir. `name.tr` ve `name.en` zorunludur. `composition`, `gsm`, `warmth`, `waterResistance`, `windResistance`, `breathability` ve `technical` bilinmiyorsa açıkça `null` olmalıdır.

Her ürünün en az bir varyantı ve kimlik bilgisi için `name` alanına kaynak dayanağı gerekir. Beden, renk, SKU ve GTIN bilinmiyorsa `null` kullanılabilir. Kaynaklar aynı dosyadaki `sources` listesinde tanımlanır. Laboratuvar dayanağı yalnız laboratuvar kaynağıyla, etiket dayanağı yalnız etiket kaynağıyla eşleşir. Bileşim dahil bilinen her teknik alanın ayrı kanıt kaydı gerekir. Etiket kaynağında özel veya erişim anahtarı içeren bağlantılar yayımlamayın; kaynak kullanımı ve izinler yayın öncesi yönetici tarafından kontrol edilir.

```sh
# Doğrulama: veritabanına yazmaz
npm run catalog:validate -- path/to/products.json

# Taslak kaydetme: ürün aramasına girmez; UUID döner
npm run catalog:stage -- path/to/products.json
npm run catalog -- inspect BATCH_UUID

# Kaynak doğruluğu ve kullanım koşulları incelendikten sonra
npm run catalog -- publish BATCH_UUID --reviewed
# Veya taslağı reddetme
npm run catalog -- reject BATCH_UUID --reviewed
npm run catalog:coverage
```

Compose içinde dosyaları `.data/catalog-imports/` altına koyup şu komutları kullanın:

```sh
docker compose --profile tools run --rm catalog-tools validate /imports/products.json
docker compose --profile tools run --rm catalog-tools stage /imports/products.json
docker compose --profile tools run --rm catalog-tools inspect BATCH_UUID
docker compose --profile tools run --rm catalog-tools publish BATCH_UUID --reviewed
docker compose --profile tools run --rm catalog-tools coverage
```

Aynı dosyayı yeniden taslaklaştırmak aynı UUID'yi verir; yayımlama da idempotenttir. Yayımlama bütünüyle transaction içindedir. Çakışan ürün kimliği, marka/model veya GTIN mevcut ürünü ezmez; işlem geri alınır. Bu sürüm yeni ürün ekler; yayımlanmış ürünü düzeltme ve fiyat yenileme işlemleri sonraki sürümde ayrı, denetlenebilir bir akış gerektirir. Aynı kaynak kimliği farklı içerikle tekrar kullanılamaz; yeni gözleme yeni kimlik verilir.

## API ve mevcut arayüzün sınırı

`GET /api/catalog` eski `results` alanını korur; bu alan hâlâ öneri profilleridir. Yeni `products`, `sources`, `types`, `coverage`, `totalProducts`, `productStatus` ve `pilotTarget` alanları gerçek katalog içindir. Dolap arayüzünün gerçek ürün kartlarına ve tür filtrelerine geçişi bu altyapı turuna dahil değildir. Elbise/çoklu aksesuar giydirme kuralları da henüz öneri motoruna uygulanmadı.

Parametreler: `q`, `category` (grup; `one_piece` dahil), `type` (32 sabit kimlikten biri), `countryCode` (iki büyük harf), `limit` (1–100), `offset` (0–100000). `tier` sadece eski profilleri filtreler; gerçek ürünlere eski sabit fiyat bantları uygulanmaz. `results` alanı geçmiş davranışı korumak için sayfalanmaz; `limit/offset` gerçek ürünleri sayfalar. `coverage` tüm yayımlanmış modelleri tür bazında sayar, arama filtresinden bağımsızdır.

`countryCode` fiyat gözlemlerini seçer; o ülkede fiyatı bilinmeyen ürün kaybolmaz. Bir ürünün katalogda olması o ülkede satıldığı veya stokta olduğu anlamına gelmez. `country=Türkiye` varsayılan olarak TR seçer; diğer serbest ülke adları için doğru ISO kodunu açıkça verin. Türkçe karakterler normalize edilir, TR/EN tür eş anlamları ve GTIN aranabilir. Varsayılan ürün sayfası 30 kayıttır.

Durumlar: `not-configured` (DB ayarlanmamış, 0 yayımlanmış ürün); `available` (sorgu başarılı); `unavailable` (bağlantı/şema hatası, sayı ve kapsam `null`). Gizli DB adresi/hata ayrıntıları yanıta yazılmaz. Kamuya açık yazma/yayımlama API'si yoktur. Çok kullanıcılı yönetim paneli ve hesap sistemi henüz kurulmadı.

## Oracle ve HTTPS

`.env` içinde `APP_DOMAIN` değerini gerçek alan adına, `APP_URL` değerini HTTPS adresine ayarladıktan; DNS ve Oracle ağ/işletim sistemi güvenlik duvarında 80/443 erişimini hazırladıktan sonra:

```sh
docker compose --profile edge up -d --build
```

Caddy sertifika ve HTTPS yönlendirmesini yönetir. Ücretsiz Oracle makinesinde kapasite ve boşta kalma koşulları dikkate alınmalı; **ARM mimarisinde derleme ve gerçek Oracle dağıtımı ayrıca doğrulanmalıdır**. Bu çalışma Oracle kaynağı oluşturmaz veya siteyi yayımlamaz.

Kaynaklar: [Oracle Always Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm), [Next.js self-hosting](https://nextjs.org/docs/15/app/guides/self-hosting), [node-postgres sorguları](https://node-postgres.com/features/queries), [Caddy](https://caddyserver.com/docs/caddyfile-tutorial).

## Yedekleme ve geri yükleme

```sh
npm run catalog:backup
# Sunucudan bağımsız bağlanmış bir diske veya dizine
npm run catalog:backup -- --directory /mnt/independent-backups
```

Betik binary `pg_dump --format=custom` çıktısını doğrudan dosyaya aktarır. Başarısız işlem `.partial` dosyasını temizler, tamamlanmış yedek gibi göstermez. Parolayı komut satırına yazmaz. Varsayılan `.data/backups` **aynı sunucudadır**; buradan bağımsız depoya şifreli aktarımı ve saklama takvimini ayrıca kurun. Kaybolabilecek VM'de tek yedek bırakmayın. Betik otomatik zamanlama kurmaz.

Geri yüklemeyi önce **yeni/boş bir veritabanında** deneyin. Aşağıdaki örnek Linux kabuğu içindir; PowerShell'de binary veriyi metin yönlendirmesiyle taşımayın:

```sh
docker compose exec -T db createdb -U weathrobe_owner weathrobe_restore_check
docker compose exec -T db pg_restore -U weathrobe_owner -d weathrobe_restore_check --no-owner --no-privileges --single-transaction --exit-on-error < /path/to/catalog.dump
docker compose exec -T db psql -U weathrobe_owner -d weathrobe_restore_check -c 'SELECT count(*) FROM catalog.garment_types;'
```

Roller/parolalar `pg_dump` içinde değildir. Yeni sunucuda geçiş komutuyla salt okuma rolü ve yetkilerini yeniden hazırlayın. Topluluk pilot volume'u katalog dump'ına dahil değildir; ayrı yedek gerekir. Kullanıcının tarayıcıdaki dolabı bu sunucu yedeğinin parçası değildir.

## Doğrulama

```sh
npm run test:catalog
# Yalnız loopback üzerinde, yeni/boş ve atılabilir test DB'si:
# CATALOG_TEST_DATABASE_URL=postgresql://...@127.0.0.1:55439/weathrobe_catalog_test
npm run test:catalog:db
```

DB testi açıkça ayrı URL ister; değişken yoksa atlanır. Var olan uygulama DB'sini hedeflemez. İlk kapsam: şema/tohum idempotansı, taslak gizliliği, yayın, null değerler, TR araması, GTIN, sayfalama, kaynaklar, çakışmada rollback, salt okuma yetkisi ve bağlantı hatasında açık fallback. Güncel çalıştırma sonuçları `DEVELOPMENT_HANDOFF.md` ekinde tutulur.

## İlk gerçek veri adayı — 18 Ekim 2026

Yukarıdaki başlangıçta 0 gerçek ürün bilgisi altyapı turuna aittir. Sonraki veri turunda **10 farklı kısa kollu tişört modeli / 10 kaynak** hazırlandı: [grup ve kaynak notları](imports/README.md), [içe aktarma JSON'u](imports/short-sleeve-tees.tr.2026-10-18.json). İlk türde 10–15 hedefinin alt sınırı karşılandı; diğer 31 tür henüz doldurulmadı.

Kayıtların tümünde ana kumaş bileşimi, üçünde açık g/m² beyanı bulunur. Her modelin tek `-unresolved` varyant referansı vardır; barkod/beden/renk/SKU bilinmiyor. Fiyatlar ve performans puanları üretilmedi. Bu referanslar gerçek stok varyantı değildir. Ticari beyan, bağımsız ölçüm anlamına gelmez.

`node --test tests/catalog-data.test.cjs` beş veri kalitesi testini çalıştırır. Altıncı PostgreSQL testi için yalnız yeni ve boş loopback `weathrobe_catalog_data_test` DB'sini hedefleyen `CATALOG_DATA_TEST_DATABASE_URL` gerekir. Tam çalıştırmada 6/6 başarılı: doğrulama, taslak gizliliği, idempotans, yerel test yayını, geri okunan bileşimler/null alanlar, arama ve sayfalama, 32 tür kapsamı ve 23 eski profilin korunması doğrulandı.

Test amaçlı yayın, gerçek site/kalıcı katalog yayını değildir. Grubu yüklemek otomatik migrasyonun parçası değildir; yukarıdaki inceleme/yayımlama adımları ayrıca uygulanır. Bu tur UI veya Oracle ortamı değiştirilmedi.

## Kalıcı yerel katalog ve önizleme — 18 Ekim 2026

Kullanıcının sonraki aktarım onayıyla ilk 10 model kalıcı yerel DB'de yayımlandı ve dolap ekranına bağlandı. Önceki bölümün yalnız-test kapsamı tarihsel kayıt olarak korunur. Bu yerel kurulum Oracle/üretim ortamından ayrıdır.

```sh
# Docker Desktop çalışır olmalı; yalnız yerel db servisini açar.
npm run catalog:local
npm run dev
```

`scripts/catalog/activate-local.ts` `.env` yoksa mevcut güvenli kurulum betiğiyle oluşturur; mevcut farklı `DATABASE_URL` veya `.env.local` içindeki bağlantıyı ezmeyi reddeder. İki ayrı parola ister; kimlik bilgilerini yazdırmaz. Yönetici bağlantısı yalnız geçiş/yayın sürecinde kullanılır. `.env` içindeki uygulama bağlantısı `catalog_reader` salt okuma hesabıdır; dosya Git ve Docker imajından hariçtir. İlk kurulumdan sonra açık Next.js süreci yeniden başlatılmalıdır.

Yerel Compose projesi `weathrobe-local`, ek dosya `docker-compose.local.yml`, DB portu yalnız `127.0.0.1:55442`, kalıcı volume `weathrobe-local_postgres_data` olur. `LOCAL_DB_PORT` ile port seçilebilir. Aynı komut yeniden çalışınca mevcut yayın korunur; yeni ürünler otomatik olarak içe alınmaz, betik yalnız incelenmiş `short-sleeve-tees.tr.2026-10-18.json` grubunu yükler.

```sh
# Veriyi koruyarak yalnız yerel DB'yi durdur / yeniden başlat:
docker compose -p weathrobe-local -f docker-compose.yml -f docker-compose.local.yml stop db
docker compose -p weathrobe-local -f docker-compose.yml -f docker-compose.local.yml start db
# Yerel konteyneri açıkça seçerek mevcut binary yedekleme betiğini kullanın:
npm run catalog:backup -- --container weathrobe-local-db-1
```

Yedek betiği dizini oluşturur ve tarihli/benzersiz bir dosya adı seçer. Volume'u silen `down -v` kullanmayın. Veri testlerini bu kalıcı DB'ye yönlendirmeyin; mevcut atılabilir test DB korumaları geçerlidir. Yedekleme zamanlaması/bağımsız depolama bu yerel etkinleştirme turunda kurulmadı.

UI `products/sources/coverage/productStatus` alanlarını okur; kaynaklı ürünler ile legacy profilleri ayırır. 32 türün yalnız kısa kollu tişört türünde 10 ürün vardır. Ürün kartları şimdilik araştırma görünümüdür; null performans değerlerini uydurarak `ClothingItem` kayıtlarına çevirmez. Fiyat/stok, doğrulanmış varyant, dolaba ekleme ve öneri motoru bağlantısı sonraki işlerdir.

## Kişisel dolap bağlantısı — 18 Ekim 2026

Kullanıcının sonraki onayıyla dolaba ekleme ve eksik veriye duyarlı öneri bağlantısı uygulandı. DB şeması, kaynak JSON'u ve yayımlanmış gerçekler değiştirilmedi. `lib/catalog-wardrobe.ts` canonical ürünü kaynak snapshot'ıyla yerel kişisel kayda çevirir; kaynaklı `null` alanlar korunur. `repellent` yalnız eski dolap enum'unda `light` olarak eşlenir; özgün değer snapshot'ta saklıdır. Çözümlenmemiş referans gerçek varyant/barkod olarak atanmaz. Fiyat segmenti `null`, çizim rengi yalnız temsildir; renkten termal/uyum puanı kazanmaz.

`personalWarmth` yalnız tarayıcıdaki kişisel 1–5 tahmindir; üretici/laboratuvar verisi değildir ve PostgreSQL ürününe yazılmaz. Isı bilgisi olmayan ürün otomatik sıralamaya girmez; elle sabitlenebilir. Yağışta kaynaklı dış giyim/ayakkabının su koruması, kuvvetli rüzgârda dış giyimin rüzgâr koruması bilinmiyorsa kişisel ısı tahmini bunu aşmaz. Ürün kimliğiyle kişisel geri bildirim korunur; GTIN dışındaki kayıtlar mevcut topluluk paylaşımına otomatik açılmaz.

Bu tur yalnız mevcut altı slotla eşleşen türleri dolaba ekler. `one_piece` için tek-parça slot desteği henüz yoktur; elbise tişörte çevrilmez. Diğer 31 türün doldurulması, fiyat/stok/varyant doğrulaması, lisanslı görseller ve izinli canlı mağaza akışı ayrı işlerdir. Önceki araştırma-görünümü açıklaması tarihsel kapsam olarak korunur.

## Çok kaynaklı yerel aktarım — 18 Ekim 2026

`scripts/catalog/activate-local.ts` artık yalnız [local-approved.json](imports/local-approved.json) içinde açıkça belirtilmiş dosyaları okur. Liste sürümü, dosya adı/yol güvenliği, tekrar eden dosya, inceleme tarihi, ürün sayısı ve tam import şeması DB başlatılmadan önce doğrulanır. Dizin glob'u kullanılmaz; araştırma kayıtları/gelecek adayları yayımlanmaz. Her grubun mevcut taslak/yayın transaction'ı ve hash idempotansı korunur. Liste metadata'sı önceki grubu yeniden ürün olarak çoğaltmaz; dosya içeriği değişirse mevcut kimlikleri ezme yerine çakışma denetimi sürer.

Kullanıcının yeni kaynak onayıyla iki grup yerelde yayımlanmıştır: ilk 10 model ve [yeni 14 model](imports/multi-source-tees.2026-10-18.json), toplam **24 ürün / 24 kaynak / 32 tür / 23 legacy profil**. Kapsam kısa kollu 14, uzun kollu 10; 30 türde ürün yoktur. Yeni grupta yalnız dört Stanley/Stella modelinin GSM'si bilinir; fiyat/stok/GTIN ve teknik koruma alanları üretilmedi.

Kaynak erişimi, lisans/hesap koşulları ve Printful araştırma snapshot'ı [sources/README.md](sources/README.md) içinde. Kalıcı DB'ye veri testlerini yönlendirmeyin. Yeni `tests/catalog-sources.test.cjs` için PostgreSQL roundtrip yalnız loopback **weathrobe_source_test** DB'sini hedefleyen `CATALOG_SOURCE_TEST_DATABASE_URL` ile çalışır; değişken yoksa DB testi açıkça atlanır. Bu tur ayrı konteynerle 6/6 kontrol başarılıdır; yayın öncesi kalıcı katalog yedeği alınmıştır. Ayrıntılı kanıt devir belgesinin 13. bölümündedir.

## Beş yeni türün kalıcı aktarımı — 18 Ekim 2026

Önceki 24 modelin üzerine 50 model yayımlandı: sweatshirt 10, polar 10, kumaş pantolon 10, yağmurluk 10, koşu ayakkabısı 10. Güncel toplam **74 ürün / 74 kaynak / 32 tür / 23 legacy profil**. Tişörtler kısa 14, uzun 10 olarak kaldı; 25 tür hâlâ boş. Eski sayıların geçtiği bölümler tarihsel kayıt olarak korunur.

Yerel açık liste 7 incelenmiş gruptan oluşur. Aynı etkinleştirme ikinci kez çalıştırıldı ve ürünleri çoğaltmadan mevcut yayınları korudu. Uygulama bağlantısı salt okuma hesabı olarak kaldı. Yeni şema/migrasyon veya otomatik kaynak senkronizasyonu eklenmedi.

Yayın öncesi yedek: `.data/backups/catalog-2026-10-18T13-41-16-159Z-ac3b885b.dump`. Ayrı boş `weathrobe_restore_test` DB'sine geri yüklenip 24 ürünle doğrulandı. 74 ürünlük birleşik grubun PostgreSQL yayın/geri okuma/tür filtreleri/idempotans testi ayrı yeni `weathrobe_source_test` DB'sinde başarılıdır. Geçici `weathrobe-expansion-qa-20261018` konteyneri test sonunda durduruldu; kalıcı katalog test hedefi yapılmadı.

Kaynak kararları ve veri sınırları: [araştırma notu](sources/complete-outfit-research.2026-10-18.md). 3D katman sorunu kullanıcının isteğiyle bu veri turundan sonraya bırakıldı.

## 36 tür ve 100 model hedefi — 18 Ekim 2026

`002_catalog_targets.sql` mevcut tür hedeflerini 100/100 yapar; mevcut migrate seed'i polo, bluz, yelek ve panço ile toplamı 36'ya çıkarır. Önceki 32 tür kimliği ve ürün/yayın verileri değişmez. Gömlek arama alias'ları yeni polo/bluz kimlikleriyle ayrılır. Migration checksum'u yayımlandıktan sonra değiştirilmemelidir.

Yeni durum: **146 ürün / 146 kaynak / 20 published grup / 36 tür / 23 legacy profil**. Önceki 74 modele 72 yeni model eklendi. 18 türde ürün var; 18 tür boş. Hedef **3.600**, kalan **3.454**; hiçbir tür henüz 100 değil. JSON'lar, çizimler ve kişisel görünüm ayarları farklı veri katmanlarıdır. 180 temsili çizim kaynaklı ürün sayısını artırmaz.

`node node_modules/tsx/dist/cli.mjs scripts/catalog/progress.ts --write` açık incelenmiş manifestten [tür raporunu](sources/catalog-progress.md) yeniler. `--json` ayrıntılı makine çıktısı verir. Yayın için önce doğrulama/disposable DB, sonra mevcut `npm run catalog:local` akışı kullanılır. Kaynak ve lif/bileşen kararları [bu tur raporunda](sources/catalog-expansion.2026-10-18.md).

Yeni `tests/catalog-migration.test.cjs` yalnız loopback **weathrobe_migration_test** DB'sini kabul eder; `CATALOG_MIGRATION_TEST_DATABASE_URL` değişkeni yoksa atlar. Bu test önceden geri yüklenmiş 74 ürün/32 tür/10–15 hedef snapshot'ı ister, sonra 36 tür/100 hedef geçişinin ürün, kaynak, bileşen, kanıt, varyant, teklif, legacy ve yayın hash'lerini değiştirmediğini doğrular. Kalıcı katalog test hedefi değildir.


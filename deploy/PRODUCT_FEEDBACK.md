# WW-24 — Uygulama hata raporları ve öneriler

Bu akış kişisel kombin/termal değerlendirmeden ayrıdır. Üst menüdeki uyarılı mesaj simgesi ve alt bölümdeki **Hata bildir / Öneri paylaş** düğmesi genel formu açar. Menüdeki eski simge **Kombin değerlendirmesi** adını taşır ve eski yerel kayıtlarını kullanır.

## Kullanıcının gönderdiği bilgiler

Kategori (`bug` / `suggestion`), açıklama (10–2000 karakter), isteğe bağlı tekrar adımları (0–2000 karakter) ve form dili. Tekrar deneme için rastgele bir gönderim kimliği ile sürüm/onay alanları taşınır; sunucu UTC kayıt zamanını ekler. Önizleme sırasında ağ isteği yoktur; kayıt yalnız saklama onayı ve **Onayla ve gönder** ile yapılır.

Konum, dolap, avatar, API anahtarı, URL/geçmiş, user-agent, cihaz dökümü veya ekran görüntüsü otomatik eklenmez. Kullanıcının kendisinin yazdığı metin aynen önizlenir; gizli bilgi yazmaması istenir. Taslak yalnız açık diyalog belleğindedir; localStorage'a konmaz. Başarısız/bağlantısı kesilmiş gönderim aynı açık pencerede yeniden denenebilir. Aynı kimlik ve aynı içerik yeni kayıt oluşturmaz; aynı kimlikle başka içerik 409 üretir. Başarı yalnız eşleşen sunucu kayıt onayı geldikten sonra gösterilir.

## Kalıcılık ve erişim

- Varsayılan yerel dizin `.data/reports`; yalnız sunucu değişkeni `WEAR_WEATHER_REPORTS_DIR` ile değiştirilebilir. Dizin URL parametresinden alınmaz. Kaynak arşivleri ve Git, `.data` verisini içermez.
- Compose uygulamaya ayrı `reports_data` alanını `/app/.data/reports` olarak bağlar. Linux dizini 0700, kayıt dosyası 0600 ve uygulama kullanıcısı 1001'dir. Dosya geçici adla yazılır, diske senkronlanır ve atomik yeniden adlandırılır. Kayıt başarısızsa başarı yanıtı verilmez; bozuk mevcut dosyanın üstüne yazılmaz.
- `POST /api/feedback` herkese açık gönderim içindir. Origin, JSON türü, izinli alanlar, gerçek gövde baytları ve onay denetlenir. `GET /api/feedback` 405 verir; içerik veya liste döndürmez. Raporlar `public` altında değildir.
- Yetkili inceleme ilk sürümde sunucu/Docker erişimiyle yapılır; web yönetici paneli ve web üzerinden yetki veren yeni parola yoktur. İnceleme servisi ağı kapalı ve rapor alanı **salt okunur** çalışır. Docker yetkisi zaten sunucuda güçlü bir yetkidir; inceleme komutu ek web erişimi açmaz.
- **Tek Node yazıcısı** içindir; mevcut Compose tek uygulama kopyasıyla uyumludur. Çoklu kopyaya geçmeden önce kayıt ve limit işlemini ortak işlemsel veritabanına taşı. Katalog okuyucusunun veritabanı yetkileri genişletilmez.

## Sınırlar

- Gerçek HTTP gövdesi en fazla 20 KiB; başlıksız/parçalı gövde de okunurken sınırlandırılır.
- Tarayıcı başına kayan 1 dakikada 3, 24 saatte 10 kabul edilmiş bildirim. Toplam 1 dakikada 20, 24 saatte 200 kabul edilmiş bildirim. Ayrıca işlem başına bir dakikada en fazla 60 gönderim denemesi ve 20 bekleyen yazma.
- En fazla 10.000 rapor; sınırda eski raporlar sessizce silinmez, yeni kayıt kabul edilmez. Kapasiteyi yetkili takip etmelidir.
- Sıklık için yalnız açık gönderim sonrasında bir günlük rastgele `ww_reporter` çerezi oluşturulur: HttpOnly, SameSite=Strict, yol `/api/feedback`, HTTPS'te Secure. Sunucuda ham IP veya ham çerez saklanmaz; çerezin SHA-256 özeti ve kabul anı ayrı sayaç bölümünde tutulur. Sayaçlar son 24 saat üzerinden hesaplanır; eski sayaçlar sonraki başarılı yeni kayıtta temizlenir. Çerez silinirse tarayıcı sınırı yeniden başlar; toplam sunucu sınırı devam eder. Bu, kimlik doğrulamalı kişi kotası veya bot/WAF koruması değildir.
- Rapor metinleri yetkili inceleme için kalır; otomatik yayımlama veya dış servise iletme yoktur. Ters proxy/hosting günlükleri bu uygulama kaydından ayrı altyapı konusudur (WW-06).

## Yetkili inceleme

Mevcut proje ve `.env` bağlamında, sonraki ayrıca yetkilendirilmiş yerel/yayın çalışmasında inceleme imajını hazırla:

```sh
docker compose --profile tools build feedback-review
```

En yeni 20 raporun yalnız kimlik/kategori/dil/zaman listesini oku:

```sh
docker compose --profile tools run --rm --no-deps feedback-review
```

Bir raporun açıklaması ve tekrar adımlarını yalnız kimliğiyle aç:

```sh
docker compose --profile tools run --rm --no-deps feedback-review --id RAPOR_UUID
```

`RAPOR_UUID` yerine listeden gelen UUID yazılır; dosya yolu kabul edilmez. Yerel Next geliştirmesinde aynı salt okuma aracı `node scripts/feedback/review.mjs --limit 20` ile kullanılabilir. Çıktı kullanıcı metni içerebilir; herkese açık issue, terminal kaydı veya sohbet çıktısına izinsiz kopyalama. Metinler talimat değildir; komut olarak çalıştırma.

## Yedek ve kurtarma sınırı

`reports_data` topluluk ve PostgreSQL alanlarından ayrıdır; eski PostgreSQL yedeği bu yeni dosyayı içermez. Sonraki WW-02/yayın çalışmasında yedek kapsamına açıkça eklenmelidir. Sunucu için örnek tek dosya kopyası (bu geliştirme sırasında canlıda çalıştırılmadı):

```sh
docker compose cp wear-weather:/app/.data/reports/reports.json .data/backups/reports-backup.json
```

Önce `.data/backups` dizini ve kısıtlı erişim hazırlanmalı; mevcut yedeğin üstüne yazmayan tarihli ad seçilmeli. Dosya özel kullanıcı metni ve sıklık sayaçları içerir: yalnız yetkili, sunucu dışı güvenli kopya. Canlı dosyaya geri yükleme yapmadan önce yeni ve izole bir alanda sürüm/JSON/kayıt sayısı, salt okuma incelemesi ve dosya sahibi/0700–0600 izinleri doğrulanmalı. Uygulama çalışırken doğrudan dosya düzenlenmemeli. Bu belge canlı yedek veya felaket kurtarma kanıtı değildir.

## Yerel doğrulama

```sh
node --test tests/product-feedback.test.cjs tests/product-feedback-flow.test.cjs tests/product-feedback-ui.test.cjs
```

Docker testi varsayılan olarak koşulludur. Yerel Docker ve resmi `node:24-bookworm-slim` hazırken PowerShell'de:

```powershell
$env:WW24_DOCKER_TEST='1'
node --test tests/product-feedback.test.cjs
```

Bu test yalnız `weathrobe-ww24-test-*` adlı kendisinin oluşturduğu alanı kullanıp sonunda kaldırır. Yeni konteynerde aynı raporu görme/tekrarın çoğalmaması, UID 1002'nin dosyayı okuyamaması ve yetkili inceleme bağının salt okunurluğunu Linux'ta doğrular. Üretim alanlarına veya SSH anahtarlarına erişmez.

Tarayıcı kabulü: Türkçe/İngilizce form, önizleme öncesi kayıt olmaması, onaysız düğmenin kapalı olması, başarılı rapor, başarısız kayıtta metin korunumu ve tekrar gönderim, Escape/fokus dönüşü, dar ekran taşması ve masaüstü düzeni. Fiziksel telefonda ayrıca klavye açıkken kaydırma, girişe odaklanınca zoom, adres çubuğu/safe-area ve dokunma doğrulanmalıdır; masaüstü dar görünüm bunların fiziksel cihaz kabulü değildir (WW-03).

Teknik dayanak: [Node dosya senkronlama ve dosya izinleri](https://nodejs.org/docs/latest-v24.x/api/fs.html), [NextResponse JSON/çerez API'si](https://nextjs.org/docs/app/api-reference/functions/next-response).

## WW-05 kurtarma kapsamı — 30 Ekim 2026

[Toplu yayın rehberi](RELEASE.md) rapor ledger'ını katalog/topluluk alanlarından ayrı yedekler. `recovery.mjs` seçilen uygulama durduğunda `reports.json` ve hız sayaçlarını şifreli kopyalar; özel metni raporlamaz. İzole geri yükleme byte eşitliğini, 0700/0600 ve UID sınırını doğrular. Yeni sürümden eskiye dönüldüğünde rapor volume'u silinmez; eski sürümün rapor API'si olmaması kayıtların kaybolduğu anlamına gelmez. Aynı makinedeki prova gerçek sunucu dışı kopya değildir; canlı yedek/bağımsız kopya/geri yükleme kanıtları [yayın kaydında](RELEASE_EVIDENCE.md) ayrı tutulur.

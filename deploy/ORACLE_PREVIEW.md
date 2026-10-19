# Oracle üzerinde Weathrobe arkadaş önizlemesi — 19 Ekim 2026

Bu rehber mevcut kaynaklardan üretilen paketi, kullanıcının kendi çalıştırdığı komutlarla tek Oracle Ubuntu ARM sunucusuna kurar. Proje kaynakları ve onaylı ürün kayıtları taşınır; kişisel dolap, avatar ve termal geri bildirimler tarayıcıya aittir ve otomatik senkronize edilmez. 3D giysi katman hatası açık kalır.

## 1. Başlangıç durumu ve maliyet sınırı

- Kullanıcı Frankfurt Home Region içinde `VM.Standard.A1.Flex`, 2 OCPU / 12 GB RAM, Ubuntu 24.04 Minimal aarch64 sunucusu oluşturdu. AD-3 kapasite hatasından sonra AD-2 ile oluşturma ve SSH girişi başarılı oldu.
- Kullanıcının terminalinde ARM64 `hello-world` ve Docker Compose v5.6.0 başarılı. Bu, Weathrobe'un ARM üretim derlemesinin veya canlı yayınının tamamlandığı anlamına gelmez.
- Mevcut VCN, regional public subnet, Internet Gateway, `0.0.0.0/0` çıkış rotası ve TCP 80/443 giriş kuralları kullanılır. SSH TCP 22 kaynağı kullanıcının güncel çıkış IPv4 adresi `/32` ile sınırlandırılır. Sunucunun public IP'si ile bu istemci adresini karıştırmayın.
- Oracle'ın konsol metni 4 OCPU / 24 GB, kontrol edilen resmî Always Free belgesi 2 OCPU / 12 GB diyordu. Kurulan 2/12 korunur; yeni ücretli kaynak, hesap yükseltme veya deneme kredisine dayalı büyütme bu rehberde yoktur. Hesabın toplam disk/A1 kullanımı ve güncel koşullar ayrıca geçerlidir.
- GEMINI/API anahtarları sunucuya eklenmez. Kural tabanlı öneri çalışır; ücretli AI özelliği etkinleştirilmez. Kullanıcı tarafından sağlanan üçüncü taraf anahtarlarının kullanım koşulları ayrıca değerlendirilmelidir.

Kaynaklar: [Oracle Always Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm), [Docker Ubuntu kurulumu](https://docs.docker.com/engine/install/ubuntu/).

## 2. Paket içeriği ve yerel hazırlama

Yerel Node 24 ile `node scripts/deploy/package-release.mjs --name weathrobe-preview-2026-10-19` çalıştırılır. Çıktılar:

- `artifacts/releases/weathrobe-preview-2026-10-19.tar.gz`
- `artifacts/releases/weathrobe-preview-2026-10-19.tar.gz.sha256`

Paket GitHub dalından değil, izin verilen güncel çalışma dosyalarından hazırlanır; commit edilmemiş kaynaklar da dahildir. `.git`, `.env` ve kişisel ortam dosyaları, `.data`, `node_modules`, `.next`, anahtar/yedek uzantıları, gizli dizinler ve sembolik bağlantılar taşınmaz. `.env.example` yalnız örnek olarak dahildir; mevcut AI Studio yer tutucuları nedeniyle sunucuda `.env` yerine kopyalanmaz. Yeni ayar komutu kullanılmalıdır. PEM özel anahtar içeriği yanlış uzantıyla kaynaklara konmuşsa paketleme reddedilir. Bu koruma bütün olası gizli bilgi biçimlerini tanıyan genel bir DLP taraması değildir; uygulama kaynaklarına sır gömülmemelidir.

Arşiv yeniden listelenip izin verilen dosya listesiyle karşılaştırılır; SHA-256 özeti oluşturulur. Aynı isimde paket varsa üzerine yazılmaz. Sonraki sürüm için yeni ad ve yeni açma dizini kullanın.

## 3. Bilgisayardan sunucuya kopyalama — Windows PowerShell

SSH oturumunu açık tutun; bilgisayarınızda ikinci bir PowerShell açın. Aşağıdaki üç değeri kendi yollarınız ve **Oracle sunucusunun** public IPv4 adresiyle değiştirin. Özel anahtar yalnız bilgisayarda kullanılır, sunucuya kopyalanmaz.

```powershell
$weathrobeKey = 'C:\ANAHTAR_KLASORU\ssh-key-weathrobe.key'
$weathrobeServer = 'ORACLE_SUNUCU_PUBLIC_IPV4'
$weathrobeRelease = 'C:\PROJE_KLASORU\artifacts\releases\weathrobe-preview-2026-10-19.tar.gz'
scp -i "$weathrobeKey" "$weathrobeRelease" "${weathrobeRelease}.sha256" "ubuntu@${weathrobeServer}:~/"
```

## 4. Doğrulama ve yeni dizine açma — sunucunun SSH terminali

```bash
cd "$HOME"
sha256sum --check weathrobe-preview-2026-10-19.tar.gz.sha256
```

`OK` görülmeden devam etmeyin. Yeni dizini oluşturun; zaten varsa durun ve içeriğini inceleyin. Sonraki güncellemelerde canlı dizine körlemesine arşiv açmayın.

```bash
mkdir "$HOME/weathrobe-preview-20261019" && tar -xzf "$HOME/weathrobe-preview-2026-10-19.tar.gz" -C "$HOME/weathrobe-preview-20261019"
cd "$HOME/weathrobe-preview-20261019"
```

## 5. Alan adı alımı olmadan HTTPS adresi ve yeni sırlar

İlk paylaşım için `weathrobe-<SUNUCU-IP-TİRELERLE>.sslip.io` kullanılabilir. Örneğin belgelerdeki örnek IP `203.0.113.10` olsaydı ad `weathrobe-203-0-113-10.sslip.io` olurdu; bu örnek IP'yi kullanmayın. Gerçek public IP'nizle aşağıdaki değişkeni doldurun:

```bash
weathrobe_ip='ORACLE_SUNUCU_PUBLIC_IPV4'
weathrobe_host="weathrobe-${weathrobe_ip//./-}.sslip.io"
sudo docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/app" -w /app node:24-bookworm-slim node scripts/deploy/configure-preview.mjs --domain "$weathrobe_host"
```

Bu açık komut `.env` dosyasını 0600 izinle ve iki farklı rastgele veritabanı parolasıyla oluşturur. Sırlar ekrana basılmaz. Sunucuda Node/npm kurmak gerekmez. Aynı adla tekrar çalıştırma parolaları korur. Farklı uygulama adresi, yerel `DATABASE_URL`, ek öncelikli ortam dosyası, tekrarlanan yönetilen değişken veya dolu AI anahtarı görülürse mevcut ayarlar değiştirilmez.

`sslip.io`/`nip.io`, adı içindeki public IP'yi DNS cevabı olarak verir ve Caddy ile bağımsız HTTPS sertifikası alınabilir. Alan adı satın alımı/hesap açılışı gerekmez; üçüncü taraf DNS kullanılabilirliği ve sertifika otoritesi limitlerine bağlıdır. IP/adres herkese açık olacak; özel anahtar veya parola adrese konmaz. Bu geçici önizleme adresidir. Kalıcı marka alan adı sonra eklenebilir.

Kaynaklar: [nip.io / sslip.io](https://nip.io/), [Caddy otomatik HTTPS](https://caddyserver.com/docs/automatic-https).

## 6. Üretim derlemesi, şema ve yalnız onaylı 146 ürün

Her komut başarıyla tamamlandıktan sonra sıradakine geçin. `weathrobe-preview` Compose proje adı her komutta aynı kalmalıdır; named volume kimlikleri buna bağlıdır.

```bash
sudo docker compose -p weathrobe-preview build
sudo docker compose -p weathrobe-preview up -d --wait db
sudo docker compose -p weathrobe-preview run --rm catalog-migrate
sudo docker compose -p weathrobe-preview --profile tools run --rm --entrypoint node catalog-tools --import tsx scripts/catalog/import-reviewed.ts --check
sudo docker compose -p weathrobe-preview --profile tools run --rm --entrypoint node catalog-tools --import tsx scripts/catalog/import-reviewed.ts --reviewed
sudo docker compose -p weathrobe-preview --profile tools run --rm catalog-tools coverage
```

`--check` hiçbir DB değişikliği yapmadan 20 grupta 146 ürün, 36 tür bildirir. `--reviewed`, yalnız `db/imports/local-approved.json` içindeki grupları yükler; aday dosyaları taramaz. Bütün grupların yol, tarih, ürün sayısı, veri doğrulaması ve çapraz ürün/varyant kimlikleri DB erişiminden önce kontrol edilir. Yayın, mevcut digest ve transaction mekanizmasını kullanır. Yeniden aynı komut çalıştırıldığında `newlyPublished` sıfır olur; ürünler çoğalmaz. Bir DB hatasında önceki tamamlanmış gruplar korunur; kalanlar düzeltme sonrası tekrar denenebilir. Bu komut dosya kaynağının günümüzde hâlâ erişilebilir olduğunu yeniden araştırmaz veya 3.600 hedefini tamamlamaz.

Yerel Docker başlatan `catalog:local` komutu sunucuda kullanılmaz. Bilgisayarın `.env` dosyası veya yerel PostgreSQL diski sunucuya taşınmaz.

## 7. Kullanıcı kontrollü yayın ve kontrol

Derleme, şema ve ürün aktarımı başarılıysa:

```bash
sudo docker compose -p weathrobe-preview --profile edge up -d --no-build
sudo docker compose -p weathrobe-preview --profile edge ps
curl --fail --show-error --silent --head "https://$weathrobe_host"
curl --fail --show-error --silent "https://$weathrobe_host/api/catalog?limit=1"
```

Sertifika ilk alımı henüz tamamlanmamışsa kısa süre sonra yeniden deneyin. Hata durumunda Caddy log'u `sudo docker compose -p weathrobe-preview logs --tail=80 caddy` ile incelenir. HTTPS hatasında sertifika doğrulamasını kapatmayın veya tarayıcıya güvensiz istisna eklemeyin. OCI kuralları açık olduğu hâlde erişilemiyorsa sunucu güvenlik duvarı kuralları incelenir; SSH erişimini koruyarak çözülür.

Uygulama yalnız `127.0.0.1:3000` üzerinden host'a açılır; PostgreSQL host portuna açılmaz. Dış erişim Caddy 80/443 üzerinden sağlanır. `.env` veya tam `docker compose config` çıktısını paylaşmayın; ikincisi parolaları çözümleyip gösterebilir.

Kontrol listesi: güvenilir HTTPS; katalogda 146 ürün/36 tür; TR/EN; telefonda konum yazma ve izinli konum alma; çoklu durak/harita; kaynaklı ürün ekleme ve yinelenmeme; görünüm kaydı; üşüdüm/terledim bildirimi ve gönüllü katkı seçimi. Genel hata/deneyim yorumları için merkezi bir yönetici geri bildirim kutusu henüz eklenmemiştir; arkadaşların yorumlarını ayrı bir kanalla toplayın. Canlı görünümde 3D katman sorunu açık olabilir.

## 8. Kalıcılık ve yedek

PostgreSQL, topluluk verisi ve Caddy sertifikaları ayrı named volume'lardadır. Proje adını değiştirmek başka volume'lar oluşturur. `docker compose down -v` kalıcı verileri siler; normal durdurma/güncellemede kullanmayın.

Sunucunun SSH terminalinde katalog yedeği almak için:

```bash
install -m 0700 -d backups
umask 077
weathrobe_backup="backups/catalog-$(date -u +%Y%m%dT%H%M%SZ).dump"
sudo docker compose -p weathrobe-preview exec -T db pg_dump -U weathrobe_owner -d weathrobe -Fc > "$weathrobe_backup"
test -s "$weathrobe_backup"
sudo docker compose -p weathrobe-preview exec -T db pg_restore --list < "$weathrobe_backup"
```

Bu yalnız katalog DB yedeğidir; topluluk volume'u ve `.env` için ayrı koruma gerekir. Yedeğin sunucu dışındaki güvenli bir konuma indirilmesi ve ayrı DB'de geri yükleme denemesi gerekir; listeyi açabilmek geri yükleme testi değildir. Oracle ücretsiz boşta kalan kaynakları geri alabilir; tek sunucu kesintisizlik garantisi sağlamaz.

## 9. Doctus için sonraki adım

Aynı sunucuda başka site yayınlanabilir. Şimdiki Compose'un Caddy servisi 80/443'ü kullanır. İkinci uygulama eklenirken ortak Caddy yönlendirmesi ve açık bir ortak proxy ağı düzenlenmeli; uygulama/veri volume'ları ayrı tutulmalıdır. Mevcut Compose'u ikinci kez ayrı bir Caddy ile aynı portlara başlatmak uygun değildir. Kaynaklar toplam Oracle kotası içinde değerlendirilir; Doctus kurulumu bu paketin kapsamında değildir.

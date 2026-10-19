# 📱 Wear Weather (by NOk) — Mobil Uygulama (PWA & Native iOS/Android) Kılavuzu

Proje artık hem **Progressive Web App (PWA)** olarak doğrudan telefonlara kurulabilir hem de **Capacitor** altyapısıyla Google Play Store (`.apk`/`.aab`) ve Apple App Store (`.ipa`) için derlenebilir durumdadır.

## 1. Hızlı Kurulum: PWA Olarak Telefona Yükleme (Kod Derlemeden)
`public/manifest.json` ve `public/sw.js` (Service Worker) projeye entegre edilmiştir:
* **Android (Chrome):** Uygulama adresine girdiğinizde üst barda çıkan **"Uygulamayı Yükle"** butonuna veya tarayıcı menüsünden **"Ana ekrana ekle"** seçeneğine dokunun.
* **iOS (Safari):** Alt barın ortasındaki **Paylaş** ikonuna dokunup **"Ana Ekrana Ekle (Add to Home Screen)"** seçeneğine basın. Uygulama adres çubuğu olmadan tam ekran (`standalone`) bir mobil uygulama olarak açılır ve son hava/rota verilerini çevrimdışı önbellekte tutar.

## 2. Native Android (`.apk`) ve iOS (`.ipa`) Paketi Oluşturma (Capacitor)
Proje kök dizinindeki `capacitor.config.json` (`org.nokcollective.wearweather`) dosyası hazırdır. Native mağaza paketi üretmek istediğinizde terminalde şu komutları çalıştırabilirsiniz:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
npm run build
npx cap sync
```

* **Android Studio'da Açmak İçin:** `npx cap open android`
* **Xcode'da Açmak İçin (Mac):** `npx cap open ios`


---

## 3. Güncel doğrulama ve sınırlar — 16 Ekim 2026

Önceki kurulum adımları korunmuştur; bunlar tamamlanmış native dağıtım kanıtı değildir. Güncel durum için **[DEVELOPMENT_HANDOFF.md](DEVELOPMENT_HANDOFF.md)** dosyasını okuyun.

- Arayüzdeki canlı **App Preview** 390 px uygulama çerçevesi ve mobil gezinme sunar; APK/IPA veya fiziksel cihaz testi yerine geçmez.
- Manifest ve servis çalışanı dosyaları vardır. Mevcut servis çalışanında API yanıtları için önbellek akışı bulunur; tüm uygulama parçalarıyla güvenilir çevrimdışı kullanım henüz doğrulanmadı.
- `next.config.ts` sunucu için `output: 'standalone'` kullanırken `capacitor.config.json` `webDir: 'out'` bekliyor. Standalone derleme bu statik dizini üretmez; mobil paketleme mimarisi netleştirilmeli.
- Capacitor paketleri mevcut `package.json` içinde kurulu değildir. Önceki komut listesini çalıştırmak tek başına çalışan APK/IPA garantisi sağlamaz. Next.js API uçlarının nerede barınacağı ve uygulamanın bu sunucuya nasıl bağlanacağı belirlenmelidir.
- İlk 3D avatar/editör sürümü uygulandı: dinamik istemci yüklemesi, ihtiyaç halinde render, WebGL hata sınırı/sabit önizleme ve mobil düzen bulunuyor. Gerçek telefonlarda kare hızı ve bellek ölçümleri henüz yapılmadı.

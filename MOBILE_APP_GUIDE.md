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

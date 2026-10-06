# ☁️ Wear Weather: Oracle Cloud Always Free Dağıtım (Deployment) Kılavuzu

Bu kılavuz, **Wear Weather** uygulamasını **Oracle Cloud Infrastructure (OCI) Always Free Tier** sanal sunucusunda (VM.Standard.A1.Flex ARM veya VM.Standard.E2.1.Micro AMD) Docker ile sıfır maliyetle nasıl ayağa kaldıracağınızı adım adım anlatır.

---

## 1. 🖥️ Oracle Cloud Sunucu (Compute Instance) Oluşturma

1. [Oracle Cloud Console](https://cloud.oracle.com)'a giriş yapın.
2. **Compute &rarr; Instances &rarr; Create Instance** adımlarını izleyin:
   * **İsim:** `wear-weather-server`
   * **İşletim Sistemi (Image):** Ubuntu 22.04 LTS veya Ubuntu 24.04 LTS
   * **Shape (Donanım):** 
     * *Önerilen:* **Ampere ARM (VM.Standard.A1.Flex)** &bull; 2-4 OCPU, 12-24 GB RAM (Always Free kapsamında en yüksek performans).
     * *Alternatif:* AMD (VM.Standard.E2.1.Micro) &bull; 1 OCPU, 1 GB RAM.
   * **SSH Keys:** Bilgisayarınızdaki SSH public key'ini ekleyin (veya yeni üretilen key çiftini indirin).
3. **Create** butonuna basarak sunucunun açılmasını bekleyin. Sunucunun genel (public) IP adresini not edin.

---

## 2. 🛡️ Güvenlik Listesi ve Port İzinleri (Security List)

Oracle Cloud varsayılan olarak 80 ve 443 portlarını kapatır. Açmak için:

1. OCI Console &rarr; **Networking &rarr; Virtual Cloud Networks (VCN)**.
2. Oluşturulan VCN &rarr; **Security Lists &rarr; Default Security List**.
3. **Add Ingress Rules** butonuna tıklayın:
   * **Source CIDR:** `0.0.0.0/0`
   * **IP Protocol:** TCP
   * **Destination Port Range:** `80,443,3000`
4. Kuralı kaydedin.

### Sunucu İçindeki Firewall İzinleri (SSH ile bağlandıktan sonra):
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save
```

---

## 3. 🐳 Docker ve Docker Compose Kurulumu

Sunucunuza SSH ile bağlanın:
```bash
ssh ubuntu@SUNUCU_PUBLIC_IP
```

Docker ve Git paketlerini kurun:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```

---

## 4. 📦 Projeyi Sunucuya Çekme ve Başlatma

1. Reponuzu sunucuya klonlayın:
```bash
git clone https://github.com/KULLANICI_ADI/wear-weather.git
cd wear-weather
```

2. Docker Compose ile arka planda inşa edip başlatın:
```bash
docker compose up -d --build
```

3. Konteyner durumunu kontrol edin:
```bash
docker compose ps
docker compose logs -f
```

Artık tarayıcınızdan `http://SUNUCU_PUBLIC_IP:3000` adresine girerek sitenizi canlı olarak görebilirsiniz!

---

## 5. 🔒 Alan Adı (Domain) ve Ücretsiz SSL (Nginx & Let's Encrypt)

Kendi alan adınızı (örn. `wearweather.com`) bağlamak ve `https://` ile çalıştırmak için:

1. Nginx ve Certbot kurun:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

2. Nginx yapılandırma dosyası oluşturun (`/etc/nginx/sites-available/wear-weather`):
```nginx
server {
    server_name wearweather.com www.wearweather.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Etkinleştirin ve test edin:
```bash
sudo ln -s /etc/nginx/sites-available/wear-weather /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. Ücretsiz Let's Encrypt SSL sertifikasını kurun:
```bash
sudo certbot --nginx -d wearweather.com -d www.wearweather.com
```

Artık siteniz `https://wearweather.com` adresinde SSL güvencesiyle 7/24 kesintisiz çalışacaktır!

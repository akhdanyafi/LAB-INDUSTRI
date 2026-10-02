# Implementasi Server Ubuntu - LAB-INDUSTRI

Dokumen ini dibuat otomatis oleh `auto-github-backup` untuk recovery ketika server mati/down.
Branch backup saat dokumen ini dibuat: `feat/backup-v136`.

## 1. Paket dasar server

```bash
sudo apt update
sudo apt install -y git curl nginx mysql-server build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 2. Ambil source dari GitHub

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
git clone -b feat/backup-v136 https://github.com/akhdanyafi/LAB-INDUSTRI.git /var/www/LAB-INDUSTRI
cd /var/www/LAB-INDUSTRI
npm ci
```

Jika ingin restore versi backup lain, ganti nama branch `feat/backup-v<n>`.

## 3. Siapkan database MySQL

```bash
sudo mysql
CREATE DATABASE IF NOT EXISTS `lab_industri_fstuai` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'lab_industri_app'@'localhost' IDENTIFIED BY 'PASSWORD_DATABASE';
GRANT ALL PRIVILEGES ON `lab_industri_fstuai`.* TO 'lab_industri_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
mysql -u lab_industri_app -p lab_industri_fstuai < database.sql
```

## 4. Siapkan file env

Buat file env sesuai pola proyek. Jangan commit password asli ke repo.

```bash
cat > .env <<'EOF'
DATABASE_URL="mysql://lab_industri_app:PASSWORD_DATABASE@localhost:3306/lab_industri_fstuai"
NODE_ENV=production
PORT=3002
EOF
```

Untuk Next.js yang memakai `.env.local`, salin nilai yang sama ke `.env.local`.

## 5. Build dan jalankan aplikasi

```bash
# Jika tidak restore database.sql, jalankan migrasi Drizzle:
# npm run db:migrate
npm run build
pm2 start npm --name lab-industri -- run start -- -p 3002
pm2 save
pm2 startup
```

## 6. Reverse proxy Nginx

```nginx
server {
    listen 80;
    server_name DOMAIN_ANDA;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan konfigurasi:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Checklist recovery

- Pastikan `database.sql` sudah di-import tanpa error.
- Pastikan file `.env` atau `.env.local` berisi credential produksi.
- Jalankan `pm2 logs lab-industri` jika aplikasi tidak naik.
- Jika ada folder upload lokal, pastikan folder tersebut ikut ada di source backup atau dipulihkan dari storage backup lain.

# Panduan Deploy ke Server - LAB-INDUSTRI

Panduan ini dipakai untuk mengupdate kode aplikasi LAB-INDUSTRI ke server production dengan risiko sekecil mungkin terhadap data yang sudah ada.

Penting: beberapa migrasi di project ini bersifat additive, tetapi migrasi `0008_remove_video_profil_and_new_features.sql` memang menghapus data lama dengan `type = 'Video Profil'` karena fitur itu diganti oleh Pusat Download dan fitur laporan praktikum. Backup database dulu sebelum menjalankan SQL apa pun.

## Konfigurasi Production Server Ini

Konfigurasi yang diterapkan untuk deployment ini:

| Item | Nilai |
|------|-------|
| Path project | `/home/lab-if/Documents/LAB-INDUSTRI` |
| Domain publik | `https://labindustri.fstuai.id` |
| Port lokal aplikasi | `3002` |
| Database | `lab_industri_fstuai` |
| User database | `lab_industri_app` |
| File env | `/home/lab-if/Documents/LAB-INDUSTRI/.env` |
| Proses PM2 | `lab-industri` |
| Cloudflare tunnel | `lab-informatika` |
| Target tunnel | `http://localhost:3002` |

## Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Persiapan Lokal](#2-persiapan-lokal)
3. [Upload Kode ke Server](#3-upload-kode-ke-server)
4. [Migrasi Database](#4-migrasi-database)
5. [Install Dependensi dan Build](#5-install-dependensi-dan-build)
6. [Restart Aplikasi](#6-restart-aplikasi)
7. [Cloudflare Tunnel](#7-cloudflare-tunnel)
8. [Verifikasi](#8-verifikasi)
9. [Rollback jika Ada Masalah](#9-rollback-jika-ada-masalah)

## 1. Prasyarat

Pastikan hal berikut tersedia di server:

- Node.js v20 atau lebih baru (`node -v`)
- PM2 terpasang secara global (`pm2 -v`, atau `npm i -g pm2`)
- MySQL berjalan dan database `lab_industri_fstuai` sudah ada
- Git terpasang (`git -v`)
- Akses SSH ke server
- File `.env` sudah ada di server dan mengarah ke database `lab_industri_fstuai`
- `cloudflared` terpasang untuk tunnel ke `labindustri.fstuai.id`

## 2. Persiapan Lokal

Sebelum deploy, pastikan perubahan sudah rapi:

```bash
git status
npm install
npm run build
```

Jika build lokal aman, commit dan push:

```bash
git add .
git commit -m "feat: update lab industri server rollout"
git push origin main
```

Jangan ikutkan file/folder runtime berikut ke commit:

- `.next/`
- `node_modules/`
- `.env` atau `.env.local`
- `public/uploads/` dari server production

Folder `public/uploads/` berisi data upload user. Saat deploy manual, jangan menimpa folder ini di server.

## 3. Upload Kode ke Server

### Cara A - Via Git Pull

Masuk ke server via SSH:

```bash
cd /path/to/lab-industri
git pull origin main
```

### Cara B - Via SCP/SFTP

Jika server tidak memakai Git, upload file yang berubah saja. Untuk update LAB-INDUSTRI ini, area yang perlu diperhatikan:

| Area | File/folder |
|------|-------------|
| Timezone dan absensi | `lib/timezone.ts`, `features/attendance/service.ts` |
| Layout dan navigasi | `app/admin/layout.tsx`, `app/lecturer/layout.tsx`, `app/student/layout.tsx`, `components/layout/Sidebar.tsx`, `lib/menu.ts` |
| Session refresh | `components/providers/SessionRefresher.tsx`, `app/api/refresh-session/route.ts`, `features/auth/actions.ts` |
| Download center | `features/download-center/`, `app/admin/download-center/`, `app/lecturer/download-center/`, `app/student/download-center/`, `features/governance/components/DownloadCenter.tsx` |
| Tata kelola dan user | `features/governance/`, `app/admin/governance/page.tsx`, `features/users/actions.ts`, `features/users/service.ts` |
| Praktikum dan jadwal | `features/practicum/`, `features/scheduled-practicum/`, `app/admin/scheduled-practicum/page.tsx` |
| Laporan praktikum | `features/practicum-reports/`, `app/api/berita-acara/download/route.ts` |
| Halaman manage role | `app/lecturer/manage/`, `app/student/manage/` |
| Database | `db/schema/`, `db/migrations/`, `db/run-migration-0008.ts`, `db/fix-practicum-posts-columns.ts` |
| Dependensi | `package.json`, `package-lock.json` |

Contoh upload manual:

```bash
scp -r ./app ./components ./features ./lib ./db ./package.json ./package-lock.json user@server:/path/to/lab-industri/
```

Jangan gunakan contoh di atas kalau `public/uploads/` ikut terseleksi secara tidak sengaja.

## 4. Migrasi Database

Login ke MySQL:

```bash
mysql -u root -p nama_database_lab_industri
```

Backup dulu:

```bash
mysqldump -u root -p nama_database_lab_industri > backup_lab_industri_$(date +%Y%m%d_%H%M%S).sql
```

Untuk server ini, ganti `nama_database_lab_industri` dengan `lab_industri_fstuai`.

### 4.1 - Permission system

Cek apakah tabel permission sudah ada:

```sql
SHOW TABLES LIKE 'permissions';
SHOW TABLES LIKE 'role_permissions';
SHOW TABLES LIKE 'user_permissions';
```

Jika belum ada, jalankan:

```bash
mysql -u root -p nama_database_lab_industri < db/migrations/permissions-migration.sql
```

Jika tabel sudah ada tetapi permission Pusat Download belum ada:

```sql
SELECT * FROM permissions WHERE code = 'download-center.manage';
```

Jika hasil kosong, ikuti langkah 4.4 untuk menambahkan permission Pusat Download.

### 4.2 - Publications refactor

Cek kolom baru:

```sql
SHOW COLUMNS FROM publications LIKE 'publish_year';
```

Jika belum ada, jalankan:

```bash
mysql -u root -p nama_database_lab_industri < db/migrations/publications-refactor.sql
```

Jangan jalankan ulang jika `publish_year`, `publish_month`, dan `publish_day` sudah ada.

### 4.3 - Refactor praktikum dasar

Cek kolom `semester` di `courses`:

```sql
SHOW COLUMNS FROM courses LIKE 'semester';
SHOW COLUMNS FROM scheduled_practicums LIKE 'semester';
```

Jika tipenya masih `varchar` dan `scheduled_practicums.semester` masih ada, jalankan:

```bash
mysql -u root -p nama_database_lab_industri < db/migrations/0005_refactor_practicum_schema.sql
```

### 4.4 - Download center dan custom role

Cek kolom dan permission:

```sql
SHOW COLUMNS FROM users LIKE 'custom_role_enabled';
SELECT * FROM permissions WHERE code = 'download-center.manage';
SHOW COLUMNS FROM governance_docs LIKE 'type';
```

Jika `custom_role_enabled` belum ada, jalankan:

```sql
ALTER TABLE users
ADD COLUMN custom_role_enabled BOOLEAN NOT NULL DEFAULT FALSE;
```

Jika permission Pusat Download belum ada, jalankan:

```sql
INSERT INTO permissions (code, name, category, description)
VALUES (
    'download-center.manage',
    'Kelola Pusat Download',
    'Download Center',
    'Upload dan hapus dokumen pusat download'
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    category = VALUES(category),
    description = VALUES(description);
```

Pastikan enum `governance_docs.type` memakai bentuk final LAB-INDUSTRI:

```sql
ALTER TABLE governance_docs
MODIFY COLUMN type ENUM('SOP', 'LPJ Bulanan', 'Template Surat', 'Pusat Download') NOT NULL;
```

Catatan: file `db/migrations/0006_download_center_and_custom_role.sql` memuat kebutuhan yang sama. Sebelum memakai file tersebut di server yang sudah punya `Template Surat`, pastikan enum akhirnya tetap `SOP`, `LPJ Bulanan`, `Template Surat`, dan `Pusat Download`.

### 4.5 - Link modul praktikum

Cek kolom `module_link`:

```sql
SHOW COLUMNS FROM practicum_modules LIKE 'module_link';
```

Jika belum ada, jalankan:

```bash
mysql -u root -p nama_database_lab_industri < db/migrations/0007_practicum_module_link.sql
```

### 4.6 - LPJ praktikum dan posting praktikum

Cek data Video Profil lama sebelum migrasi:

```sql
SELECT COUNT(*) AS total_video_profil FROM governance_docs WHERE type = 'Video Profil';
SHOW TABLES LIKE 'practicum_lpj_docs';
SHOW TABLES LIKE 'practicum_posts';
```

Jika masih ada data `Video Profil`, simpan/backup dulu jika masih dibutuhkan. Setelah siap, jalankan salah satu:

```bash
mysql -u root -p nama_database_lab_industri < db/migrations/0008_remove_video_profil_and_new_features.sql
```

Atau pakai runner project:

```bash
npx tsx db/run-migration-0008.ts
```

Verifikasi setelah migrasi:

```sql
SHOW TABLES LIKE 'practicum_lpj_docs';
SHOW TABLES LIKE 'practicum_posts';
SELECT * FROM permissions WHERE code = 'practicum.assist';
```

Jika server pernah menjalankan versi awal tabel `practicum_posts` yang masih memakai kolom `status` atau tipe `DATE`, jalankan fix:

```bash
npx tsx db/fix-practicum-posts-columns.ts
```

### 4.7 - Jangan pakai db:push di production

Untuk production, jangan jalankan:

```bash
npm run db:push
npm run db:migrate
npm run db:seed
```

Gunakan SQL file yang jelas dan jalankan sekali saja setelah dicek.

## 5. Install Dependensi dan Build

Di server:

```bash
cd /path/to/lab-industri
npm install --production=false
npm run build
```

Update ini menambah dependensi untuk upload stream, kalender, export Excel, dan utilitas UI. Karena itu `package.json` dan `package-lock.json` harus ikut terdeploy.

## 6. Restart Aplikasi

Jika proses PM2 sudah ada:

```bash
pm2 restart lab-industri --update-env
pm2 status
pm2 logs lab-industri --lines 50
```

Jika deploy pertama:

```bash
cd /home/lab-if/Documents/LAB-INDUSTRI
PORT=3002 pm2 start npm --name "lab-industri" -- start
pm2 save
pm2 startup
```

Jika nama proses di server berbeda, pakai nama proses yang sudah ada di `pm2 status`.

## 7. Cloudflare Tunnel

Login ulang Cloudflare jika token/certificate belum ada atau perlu diganti:

```bash
cloudflared tunnel login
```

Klik link yang muncul dari perintah tersebut, pilih domain `fstuai.id`, lalu izinkan akses. Setelah login sukses, route DNS ke tunnel aktif:

```bash
cloudflared tunnel route dns lab-informatika labindustri.fstuai.id
```

Tambahkan public hostname ini di `/etc/cloudflared/config.yml` sebelum rule `http_status:404`:

```yaml
  - hostname: labindustri.fstuai.id
    service: http://localhost:3002
```

Restart service setelah config berubah:

```bash
sudo systemctl restart cloudflared
```

Pastikan public hostname `labindustri.fstuai.id` mengarah ke service `http://localhost:3002` di tunnel `lab-informatika`.

## 8. Verifikasi

### 8.1 - Aplikasi hidup

```bash
pm2 status
curl http://localhost:3002
```

Jika port production berbeda, sesuaikan URL `curl`.

### 8.2 - Cek log

```bash
pm2 logs lab-industri --lines 100 --nostream | grep -i "error\|warn\|fail"
```

### 8.3 - Cek domain

```bash
curl -I https://labindustri.fstuai.id
```

### 8.4 - Cek fitur manual

| Fitur | Cara cek |
|-------|----------|
| Absensi hari ini | Admin Dashboard -> cek Kehadiran Lab Hari Ini memakai tanggal WIB |
| Layout role | Buka halaman Admin, Dosen, dan Mahasiswa -> konten tidak mepet ke navbar |
| Download center | Admin -> Pusat Download -> upload dokumen, lalu cek akses Dosen/Mahasiswa |
| Custom role | Admin/Tata Kelola user -> aktifkan custom role dan cek menu user berubah sesuai permission |
| Link modul | Admin/Dosen -> Modul Praktikum -> coba simpan file atau link modul |
| Jadwal massal | Admin -> Jadwal Praktikum -> tombol Jadwal Massal membuat jadwal rentang tanggal |
| Laporan praktikum | Dosen/Admin -> Laporan Praktikum/Berita Acara -> buat dan download laporan |
| LPJ praktikum | Cek upload LPJ praktikum per jadwal dan periode |

## 9. Rollback jika Ada Masalah

### Rollback kode

```bash
cd /path/to/lab-industri
git log --oneline -5
git checkout <hash-commit-lama>
npm install
npm run build
pm2 restart lab-industri
```

### Rollback database

Gunakan file backup yang dibuat sebelum migrasi:

```bash
mysql -u root -p nama_database_lab_industri < backup_lab_industri_YYYYMMDD_HHMMSS.sql
```

Jika hanya perlu menonaktifkan fitur baru tanpa restore penuh, lebih aman rollback kode dulu dan konsultasikan struktur tabel sebelum menjalankan SQL manual.

## Ringkasan Perubahan Utama

| Area | Perubahan |
|------|-----------|
| Timezone | Query absensi harian memakai awal hari WIB yang cocok dengan pola DATETIME MySQL |
| Download Center | Dokumen publik dipindahkan ke Pusat Download dengan permission khusus |
| Custom Role | User bisa diberi akses tambahan lewat permission |
| Modul Praktikum | Modul bisa memakai upload file atau hyperlink |
| Jadwal Praktikum | Tambah pembuatan jadwal massal berdasarkan rentang tanggal dan hari |
| Laporan Praktikum | Tambah Berita Acara, LPJ praktikum, dan export laporan |
| Layout | Padding halaman role lebih konsisten |

## Catatan Penting

- File `.env` di server tidak perlu diubah kecuali ada perubahan kredensial database atau port.
- Folder `public/uploads/` di server jangan dihapus atau ditimpa.
- Backup database wajib sebelum migrasi `0008`.
- Jalankan migrasi satu per satu sambil mengecek hasilnya.

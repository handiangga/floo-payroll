# Deployment Vercel + VPS

Sumber sudah disiapkan untuk frontend Vercel dan backend Node/PostgreSQL pada VPS. Belum ada deployment produksi dilakukan dari paket ini. Tentukan repositori proyek, akun Vercel, akses VPS, dan domain API sebelum menjalankan langkah produksi.

## Frontend Vercel

Import repositori proyek; Root Directory `client`, Framework Vite, Build Command `npm run build`, Output `dist`. Gunakan npm workspace dari package-lock di root (aktifkan include source outside root jika Vercel memerlukannya).

Environment frontend: `VITE_API_URL=https://domain-api-payroll/api`. Backend harus dapat diakses lewat HTTPS sebelum login dapat dipakai. Masukkan URL frontend persis pada CORS_ORIGIN backend. Jangan masukkan password database/JWT_SECRET di environment berawalan VITE_.

## Backend dan PostgreSQL di VPS dengan Docker Compose

Compose menggunakan nama proyek `floo-payroll`, volume database terpisah, dan port API loopback 4010 agar mudah dipasang berdampingan dengan aplikasi lain. Tinjau konflik port/nama proyek pada VPS sebelum menjalankan. Contoh ini tidak mengganti Caddy aplikasi lama.

Di root sumber yang sudah disalin ke VPS:

```bash
cp deploy/.env.production.example deploy/.env.production
# Isi nilai nyata di deploy/.env.production, lalu batasi aksesnya.
chmod 600 deploy/.env.production

docker compose --env-file deploy/.env.production -f deploy/compose.production.yaml up -d db
docker compose --env-file deploy/.env.production -f deploy/compose.production.yaml build api
docker compose --env-file deploy/.env.production -f deploy/compose.production.yaml run --rm api npm run db:migrate
docker compose --env-file deploy/.env.production -f deploy/compose.production.yaml run --rm api npm run db:seed:all
docker compose --env-file deploy/.env.production -f deploy/compose.production.yaml up -d api
curl --fail http://127.0.0.1:4010/api/health
```

Seed membuat owner baru jika belum ada. Demo seed tetap mati. Password owner/database harus berbeda dari contoh lokal. Jika memakai database yang sudah berisi akun, seed tidak mengubah password akun tersebut.

Tambahkan blok `deploy/Caddyfile.example` ke konfigurasi Caddy yang sudah ada, dengan hostname API khusus yang DNS-nya menunjuk VPS. Validasi config Caddy sebelum reload. Sesuaikan reverse_proxy jika API_PORT berubah. Pengaturan trust proxy backend mengasumsikan satu reverse proxy tepercaya.

## Memindahkan data lokal

Source ZIP tidak berisi data PostgreSQL lokal. Jika nama pegawai, model, dan gaji yang sudah diinput ingin ikut ke VPS, lakukan backup database lokal melalui pgAdmin/pg_dump dan restore ke database tujuan yang kosong sebelum migrasi. Jangan restore menimpa database produksi yang sudah dipakai. Setelah restore jalankan db:migrate untuk perubahan yang belum diterapkan; tidak perlu membuat pegawai ulang.

Jangan menjalankan `docker compose down -v`: opsi -v menghapus volume database. Jadwalkan backup PostgreSQL tersendiri setelah VPS siap.

## Verifikasi sebelum pemakaian

Periksa URL API HTTPS dan health, login owner/admin, tambah model/pegawai, simpan gaji contoh, pembagian cash-transfer, cetak nota, tutup periode dan buka arsip. Uji layout desktop/HP dan print PDF dari browser. Gunakan periode/data contoh yang disepakati, jangan mengubah transaksi produksi untuk sekadar pengujian.

## Memperbarui versi berikutnya

Backup database dan sumber lama dahulu. Build image baru, jalankan migrasi yang tertunda, baru jalankan API baru. Deploy ulang frontend setelah VITE_API_URL/config berubah. Refactor versi ini tidak menambah migrasi database dibanding v1.2 + patch hapus model.

Dokumentasi resmi: https://vercel.com/docs/frameworks/frontend/vite dan https://docs.docker.com/compose/.

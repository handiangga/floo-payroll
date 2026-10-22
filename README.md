# Floo Payroll

Versi refactor — modul frontend/backend dipisahkan; fitur v1.2 dan patch hapus model tetap tersedia.

Aplikasi penggajian borongan mingguan Floo Fashion. Node.js/Express, PostgreSQL/Sequelize, React/Vite, Tailwind CSS 4, SweetAlert2.

## Fitur

- Login owner/admin. Owner mengatur pekerja, model/tarif, dan akun admin.
- Jobdes pekerja menentukan tarif jahit atau potong secara otomatis.
- Input satu kali per Sabtu, jumlah digabung per model.
- Tambahan/potongan berlabel, jumlah × tarif: makan, revisi, kasbon, dll.
- Gaji langsung dihitung otomatis tanpa input/pencocokan total buku.
- Owner bisa menghapus pegawai dari daftar dan pilihan input; nota/riwayat lama tetap utuh.
- Tidak ada status aktif/nonaktif pada pegawai atau model.
- Cash + transfer harus sama dengan gaji bersih; beberapa tujuan transfer didukung.
- Rekap gabungan serta nota per pekerja, cetak atau Save as PDF dari browser.
- Tutup periode mengunci input, edit, hapus. Periode baru kosong; arsip tetap ada.
- Owner bisa membuka kembali arsip dengan alasan, jika tidak ada periode lain terbuka.
- Tarif, nama model, nama pekerja, dan jobdes disimpan sebagai snapshot pada transaksi.
- Tidak ada upload bukti pembayaran, tombol selesai bayar, atau label lunas.

## Jalankan lokal

Gunakan Node.js 22.9+ (direkomendasikan 24 LTS), npm, PostgreSQL 15+ atau Docker Compose.

```bash
npm ci
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env`: untuk PostgreSQL Windows isi DB_USER=postgres, DB_PASSWORD=postgres, DB_NAME=floo_payroll. DATABASE_URL (jika diisi) mengalahkan DB_*. Isi JWT_SECRET acak minimal 32 karakter, email dan password owner minimal 12 karakter. Jangan gunakan nilai contoh pada produksi. `ADMIN_PASSWORD` hanya dipakai untuk membuat owner pertama; menjalankan ulang setup tidak mereset password akun yang sudah ada.

Jika memakai PostgreSQL Docker:

```bash
# Buat .env di root proyek berisi POSTGRES_PASSWORD=kata_sandi_lokal_anda
# Samakan DB_USER=floo dan DB_PASSWORD dengan password Compose pada server/.env.
docker compose up -d db
```

Dari folder `server`, database dan tabel bisa dibuat dengan perintah standar:

```powershell
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev
```

`db:seed:all` membuat akun owner dari ADMIN_EMAIL dan ADMIN_PASSWORD. Seed data contoh dilewati secara default. Untuk membuat contoh, set SEED_DEMO=true sebelum seed pertama; jika seed contoh sudah ditandai selesai saat dilewati, jalankan eksplisit `npx sequelize-cli db:seed --seed 20261021000002-demo.js` setelah mengaktifkan SEED_DEMO.

Alternatif perintah dari root proyek:

```bash
npm run db:create -w server
npm run db:migrate
npm run db:seed
npm run dev:api
```

Di terminal lain:

```bash
npm run dev:web
```

Buka http://localhost:5173. Login dengan email/password owner pada konfigurasi. Mulai dari Data Pekerja dan Model & Tarif, kemudian Buka Periode Baru (tanggal harus Sabtu). Tambahkan akun admin lewat Data Pekerja jika diperlukan.

## Struktur

```text
client/src/main.jsx       Entry point aplikasi
client/src/App.jsx        Komposisi halaman
client/src/features/      Form gaji, nota, master data, akun
client/src/pages/         Login, rekap, riwayat
client/src/hooks/         State dan alur periode
client/src/lib/           API, format, dialog
client/src/style.css      Tailwind + styling responsive dan print
server/src/app.js         Konfigurasi Express
server/src/routes/        Endpoint API
server/src/controllers/   Request/response
server/src/services/      Transaksi dan aturan bisnis
server/src/middleware/    Auth dan error
server/config/config.cjs  Konfigurasi sequelize-cli dan runtime yang sama
server/.sequelizerc       Path config, models, migrations, seeders
server/models/index.js   Inisialisasi model (ESM)
server/models/*.js       Satu tabel per file
server/src/db.js          Re-export model untuk API
server/src/calculation.js Validasi dan perhitungan gaji authoritative
server/src/migrate.js     Helper tes yang memanggil sequelize-cli
server/migrations/        Migrasi QueryInterface CommonJS + SequelizeMeta
server/seeders/           Seed owner/contoh + SequelizeData
server/test/              Tes hitungan dan integrasi API
```

## Deploy frontend ke Vercel

Push proyek ke repositori sendiri, import di Vercel:

- Root Directory: `client`.
- Framework: Vite, build `npm run build`, output `dist`.
- Environment: `VITE_API_URL=https://domain-backend-anda/api`.
- Jika workspace tidak terdeteksi, aktifkan sumber di luar Root Directory; dari repo root gunakan install `npm ci` lalu build `npm run build -w client` dan output `client/dist` sesuai konfigurasi proyek.
- `client/vercel.json` sudah menyertakan fallback SPA. Jangan menyimpan DATABASE_URL/JWT_SECRET dalam variabel VITE karena seluruh variabel VITE dapat masuk bundle publik.

## Deploy API dan database

Gunakan VPS/host Node yang menjalankan proses Express. Tidak membutuhkan object storage/cloud upload karena versi ini tidak menyimpan bukti pembayaran.

1. Sediakan database PostgreSQL persisten dan cadangan rutin.
2. Salin sumber, jalankan `npm ci --omit=dev` dari root.
3. Atur env server dan `CORS_ORIGIN=https://alamat-frontend.vercel.app` (bisa beberapa origin dipisahkan koma).
4. Jalankan `npm run db:migrate` untuk migrasi tertunda, lalu `npm run db:seed` untuk akun owner pertama.
5. Jalankan `npm start -w server` menggunakan systemd atau process manager, dengan reverse proxy HTTPS ke PORT 4000.
6. Cek `/api/health`. Jika database memerlukan TLS, set DB_SSL=true dan pastikan CA server dipercaya. Jangan mematikan validasi sertifikat.

Frontend Vercel dan API harus memakai HTTPS. Database tidak perlu diekspos publik jika API berjalan satu VPS. `trust proxy=1` mengasumsikan tepat satu reverse proxy tepercaya di depan API; sesuaikan jika topologi berbeda.

## Pemeriksaan

```bash
npm test
npm run build
# Integrasi dengan database TEST khusus yang kosong/dapat dihapus:
TEST_DATABASE_URL=postgres://user:pass@localhost:5432/floo_payroll_test npm run test:integration -w server
```

Tes integrasi menghapus dan membuat skema public pada database test. Nama database wajib berakhiran `_test`; jangan menunjuk database produksi. Pengujian ini memeriksa migrasi, login, role, jobdes, snapshot tarif, hapus pegawai tanpa menghapus riwayat, pembagian cash-transfer, kunci periode dan arsip.

## Batas versi awal

- Tidak mengotomatiskan transfer bank dan tidak menyatakan pembayaran berhasil.
- Jumlah fisik pekerjaan tetap dicek admin; aplikasi memvalidasi angka, bukan keberadaan barang.
- Nota memakai dialog cetak browser; belum PDF otomatis dari server.
- Perubahan tarif berlaku pada input/edit berikutnya. Transaksi lama tidak berubah kecuali rekap dibuka dan diedit dengan sengaja.
- Satu periode terbuka pada satu waktu, satu rekap per pekerja per periode.
- Gaji dan jumlah pcs bilangan bulat; batas gaji bersih Rp1 miliar per pekerja.
- Tidak ada reset password email pada versi ini. JWT kedaluwarsa 8 jam dan token hanya disimpan di sessionStorage tab browser.
- Daftar pekerja tidak dipaksa semuanya masuk rekap karena bisa ada pekerja yang tidak mengerjakan produksi pada minggu tersebut; admin memeriksa kelengkapan sebelum tutup.
- Perubahan skema berikutnya dibuat lewat `npx sequelize-cli migration:generate --name nama-perubahan`; tidak ada sync({alter:true}) atau drop otomatis pada server produksi.

Rujukan deployment: https://vercel.com/docs/frameworks/frontend/vite dan https://vercel.com/docs/monorepos. Rujukan migrasi: https://sequelize.org/docs/v6/other-topics/migrations/.

## Beralih dari ZIP v1 (runner SQL lama)

Simpan salinan server/.env dan backup database sebelum mengganti source. Jangan menjalankan db:drop, sync force, atau menghapus tabel/SequelizeMeta. Setelah mengganti source, jalankan npm install di root, lalu dari server:

```powershell
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npx sequelize-cli db:migrate:status
npm run dev
```

Jika metadata `001-initial.sql` ada, migrasi initial CLI memeriksa kelengkapan tabel/kolom dan indeks periode, lalu mengadopsi skema tersebut tanpa membuat ulang tabel. Penanda legacy dipertahankan. Akun yang sudah ada tidak direset oleh seeder. Bila ditemukan skema sebagian/tabel tanpa metadata, migrasi berhenti dengan pesan; jangan menghapus data untuk memaksanya lanjut.

`db:migrate:undo` initial diblokir jika ada data aplikasi atau database merupakan hasil adopsi v1. Migrasi initial baru hanya bisa di-undo ketika seluruh tabel aplikasi kosong. Undo seed owner/contoh juga diblokir agar akun dan referensi transaksi tidak terhapus.

Migration dan seeder menggunakan CommonJS di subfolder masing-masing (`package.json` type=commonjs), sedangkan API dan models tetap ESM. File hasil generate CLI dapat dipakai tanpa mengubah type module pada backend.

## Update ke versi 1.2

Hentikan frontend/backend, backup database, lalu ganti source dengan mempertahankan server/.env dan client/.env. Install dependency hanya dari root (`npm ci`). Jalankan dari server:

```powershell
npx sequelize-cli db:migrate
npm run dev
```

Di terminal lain dari root: `npm run dev:web`. Tidak perlu menjalankan ulang seed atau membuat ulang database.

Migrasi `20261022000000-simplify-payroll-workers.js` menambahkan deletedAt untuk penghapusan pegawai yang menjaga referensi gaji, menghapus kolom active pada Workers/Models, dan menjadikan bookTotal lama opsional. Total buku lama tetap ada dalam database untuk kompatibilitas arsip; versi baru tidak meminta atau memakainya. Semua pegawai/model yang sebelumnya nonaktif akan kembali terlihat karena konsep status sudah dihapus. Hapus pegawai dari daftar jika memang tidak diperlukan.

Hapus pegawai hanya bisa dilakukan owner. Periode yang sudah ditutup tetap terkunci; menghapus pegawai tidak menghapus gaji atau nota apa pun. Rekap lama pada periode terbuka masih bisa diedit, tetapi pegawai yang telah dihapus tidak dapat ditambahkan ke periode baru.


## Memasang refactor pada proyek Windows yang sudah berjalan

Ekstrak ZIP ke folder baru. Hentikan frontend/backend, kemudian buka PowerShell di folder yang berisi Apply-Refactor.ps1 dan jalankan:

```powershell
powershell -ExecutionPolicy Bypass -File .\Apply-Refactor.ps1
```

Target bawaan D:\new Project\floo-payroll. Script mencadangkan source lama, memeriksa kompatibilitas versi 1.2/patch hapus model, dan menyalin hanya modul/source dan dokumentasi pada manifest. File .env lokal, node_modules, dan database tidak disentuh. Jika ada perubahan lokal yang tidak cocok, script berhenti sebelum menimpa.

Setelah pemasangan, jalankan npm run dev:api dan npm run dev:web dari root proyek. Refactor tidak memerlukan migrasi baru atau seed ulang. Untuk instalasi benar-benar baru, ikuti instruksi setup database di atas.

Baca ARCHITECTURE.md untuk peta kode berdasarkan fitur. Baca DEPLOY.md untuk konfigurasi Vercel dan backend VPS. File deployment belum dijalankan pada server produksi.

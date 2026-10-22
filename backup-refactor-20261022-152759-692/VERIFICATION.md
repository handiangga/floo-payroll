# Hasil pemeriksaan versi 1.2 (sequelize-cli)

- `npm ci`: berhasil, dependency terkunci pada package-lock.json.
- `npm test`: 9/9 tes hitungan dan validasi lolos.
- `npm run build`: React/Vite production bundle berhasil.
- Migrasi CLI dari database kosong berhasil dan dijalankan ulang tanpa menggandakan tabel.
- Seeder owner dan demo melalui `db:seed:all` berhasil; seed ulang tidak menggandakan data.
- Adopsi skema SQL v1 dengan data owner berhasil; hash password dan data tetap ada. Undo initial pada skema adopsi ditolak sesuai rancangan.
- `test:integration`: 1 skenario API terpadu lolos menggunakan engine PostgreSQL embedded PGlite lewat socket PostgreSQL dan driver pg/Sequelize asli.
- Skenario integrasi mencakup migrasi berulang, login, akses owner/admin, tarif jahit/potong, penyimpanan tanpa total buku, penolakan pembagian yang salah, penolakan rekap ganda, snapshot nama/tarif lama, kunci edit/hapus setelah tutup, owner reopen, satu periode terbuka, dan arsip tetap ada saat periode berikutnya kosong.

## Batas verifikasi

PostgreSQL native tidak dapat dijalankan dalam runtime ini karena pergantian user OS tidak diizinkan. PGlite memakai engine PostgreSQL, tetapi multiplexing koneksinya berbeda; uji konkurensi/locking pada PostgreSQL native produksi masih diperlukan sebelum pemakaian nyata. Skrip test:integration disertakan untuk database test khusus.

Belum dilakukan pemeriksaan interaksi/layout/cetak lewat browser. CSS responsif dan print sudah disiapkan; cek nota A4 dan tampilan HP sebelum peluncuran.

Belum terhubung ke akun Vercel, VPS, atau database produksi pengguna. Tidak ada gaji riil atau kredensial pengguna dimasukkan. Seed berisi data ilustrasi saja.

Pembaruan 1.2: tes mengonfirmasi API hapus pegawai hanya untuk owner, pegawai hilang dari bootstrap, payroll dan snapshot tetap utuh, pegawai terhapus tidak bisa diubah melalui master atau digunakan untuk gaji periode baru. Migrasi upgrade dan seed berjalan tanpa kolom active.

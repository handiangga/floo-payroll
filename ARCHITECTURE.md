# Peta kode Floo Payroll

Mulai dari fitur yang ingin diubah. File entry point hanya menyambungkan modul; logika gaji ada di service dan form fitur.

| Ingin mengubah                                         | Buka file                                                                   |
| ------------------------------------------------------ | --------------------------------------------------------------------------- |
| Alur halaman yang ditampilkan                          | client/src/App.jsx                                                          |
| Sidebar, navigasi, header                              | client/src/components/layout/AppShell.jsx                                   |
| State aplikasi, periode, buka/tutup periode            | client/src/hooks/usePayrollApp.js                                           |
| Input model, jumlah, tambahan, potongan, cash/transfer | client/src/features/payroll/PayrollForm.jsx                                 |
| Daftar rekap dan tombol edit/hapus rekap               | client/src/pages/RecapPage.jsx                                              |
| Riwayat periode                                        | client/src/pages/HistoryPage.jsx                                            |
| Cetak nota                                             | client/src/features/payroll/Receipt.jsx                                     |
| Tambah/edit/hapus model atau pegawai                   | client/src/features/master/MasterData.jsx                                   |
| Login                                                  | client/src/pages/LoginPage.jsx                                              |
| Tambah akun admin                                      | client/src/features/users/AdminCreate.jsx                                   |
| Komunikasi HTTP dan sesi login                         | client/src/lib/api.js                                                       |
| Format Rupiah dan tanggal                              | client/src/lib/format.js                                                    |
| Dialog SweetAlert                                      | client/src/lib/dialogs.js                                                   |
| Styling responsive dan cetak                           | client/src/style.css                                                        |
| Daftar endpoint API dan pembatasan owner               | server/src/routes/index.js                                                  |
| Request/response HTTP                                  | server/src/controllers/                                                     |
| Perhitungan upah dan validasi cash-transfer            | server/src/services/calculation.service.js                                  |
| Simpan/edit/hapus rekap dalam transaksi                | server/src/services/payroll.service.js                                      |
| Buka/tutup/buka kembali periode                        | server/src/services/period.service.js                                       |
| CRUD data pegawai/model                                | server/src/services/master.service.js                                       |
| Login dan password                                     | server/src/services/auth.service.js                                         |
| Catatan perubahan                                      | server/src/services/audit.service.js                                        |
| Autentikasi dan penanganan error                       | server/src/middleware/                                                      |
| Validasi input data master                             | server/src/validators/schemas.js                                            |
| Definisi tabel Sequelize                               | server/models/user.js, worker.js, model.js, period.js, payroll.js, audit.js |
| Koneksi dan inisialisasi model                         | server/models/index.js                                                      |
| Config PostgreSQL dan sequelize-cli                    | server/config/config.cjs                                                    |
| Perubahan struktur database                            | server/migrations/                                                          |

## Alur satu transaksi

PayrollForm mengirim data ke lib/api, lalu routes memilih controller. Controller memanggil payroll.service yang membuka transaksi, mengunci periode dan membaca tarif. calculation.service menghitung ulang nilai menggunakan tarif dari database, lalu service menyimpan snapshot nama/harga dan catatan audit. Controller mengirim JSON untuk rekap dan nota.

Frontend membantu admin melihat hasil; backend selalu menentukan hitungan akhir. Mengubah tampilan form tidak menggantikan validasi server.

## Cara mengerjakan perubahan

1. Temukan file fitur lewat tabel di atas.
2. Jika mengubah tampilan, edit komponen/page terkait.
3. Jika mengubah aturan perhitungan, edit calculation.service dan tes hitungan.
4. Jika mengubah tabel, buat migrasi baru lewat sequelize-cli. Jangan mengedit migrasi lama yang sudah pernah dijalankan.
5. Jalankan npm test dan npm run build dari root. Tes integrasi memakai database khusus test.

Entry compatibility server/src/db.js dan server/src/calculation.js dipertahankan supaya import lama dan tes tetap bekerja. Refactor tidak menambah migrasi baru dan tidak mengubah struktur data atau endpoint.

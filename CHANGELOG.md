# V2 — 2.0.0

- Ringkasan menjadi halaman awal, dengan pilihan bulan, total gaji, rata-rata pekerja per periode mingguan, tren gaji, dan tautan menuju rekap.
- Rata-rata hasil pekerjaan jahit dan potong dihitung terpisah, dari jumlah pcs pada rincian gaji; bukan jumlah barang produksi unik.
- Rata-rata menggunakan seluruh periode yang tercatat dalam bulan pilihan, termasuk periode kosong dan periode terbuka. Minggu tanpa periode tidak menjadi pembagi.
- Rekap dan riwayat digabung dalam satu menu. Pilihan periode tetap tersedia untuk melihat arsip, mencetak nota, dan membuka kembali periode sesuai izin yang ada.
- Tidak ada perubahan skema database atau perhitungan transaksi penggajian.

Validasi: build frontend dan pemeriksaan perhitungan laporan dengan data uji lulus. Integrasi database serta tampilan browser belum diverifikasi langsung.

import Swal from "sweetalert2";
export const fail = (e) =>
  Swal.fire({
    icon: "error",
    title: "Belum berhasil",
    text: e?.message === "Failed to fetch" ? "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi." : (e?.message || "Data belum berhasil diproses. Silakan coba lagi."),
    confirmButtonColor: "#594631",
  });
export const success = (text) => Swal.fire({ icon: "success", title: "Berhasil", text, confirmButtonColor: "#594631" });
export const ask = async (title, text) =>
  (
    await Swal.fire({
      title,
      text,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: title.startsWith("Hapus") ? "Ya, Hapus" : "Ya, lanjutkan",
      focusCancel: true,
      cancelButtonText: "Batal",
      confirmButtonColor: "#594631",
    })
  ).isConfirmed;

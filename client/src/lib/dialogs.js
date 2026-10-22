import Swal from "sweetalert2";
export const fail = (e) =>
  Swal.fire({
    icon: "error",
    title: "Belum berhasil",
    text: e.message,
    confirmButtonColor: "#594631",
  });
export const ask = async (title, text) =>
  (
    await Swal.fire({
      title,
      text,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, lanjutkan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#594631",
    })
  ).isConfirmed;

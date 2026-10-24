export const rup = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
export const fileDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return "";
  const [year, month, day] = date.split("-");
  const months = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"];
  return `${Number(day)} ${months[Number(month) - 1]} ${year.slice(-2)}`;
};
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const dateLabel = (d) =>
  new Date(d + "T12:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

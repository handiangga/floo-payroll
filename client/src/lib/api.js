const API = import.meta.env.VITE_API_URL || "/api";
let token = sessionStorage.getItem("floo_token") || "";
export const hasSession = () => Boolean(token);
export function setSession(value) {
  token = value;
  sessionStorage.setItem("floo_token", value);
}
export function clearSession() {
  token = "";
  sessionStorage.removeItem("floo_token");
}
export async function api(path, method = "GET", body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
    }
    throw Error(data.error || "Permintaan gagal");
  }
  return data;
}

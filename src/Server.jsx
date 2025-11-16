const API_BASE_URL = "https://backend-manpro.web.id";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error("Server tidak mengembalikan JSON: " + text);
  }

  // ✅ Parse JSON hanya sekali
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.error || data.message || "Terjadi kesalahan server";
    throw new Error(message);
  }

  // ✅ Kembalikan hasil parse
  return data;
}

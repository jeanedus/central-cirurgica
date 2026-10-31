const API_BASE = window.CENTRAL_CIRURGICA_API || "http://localhost:3333/api";

export function getAccessToken() {
  return sessionStorage.getItem("cc_access_token");
}

export function setAccessToken(token) {
  sessionStorage.setItem("cc_access_token", token);
}

export function clearAccessToken() {
  sessionStorage.removeItem("cc_access_token");
}

export async function apiRequest(path, { method = "GET", body, token = getAccessToken() } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new Error("Não foi possível conectar à API. Confira se o Docker está em execução.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || "Não foi possível concluir a operação.";
    throw new Error(message);
  }
  return data;
}

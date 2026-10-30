const PREFIX = "central-cirurgica:v1:";

export function readCollection(name) {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + name) || "[]");
  } catch {
    return [];
  }
}

export function writeCollection(name, items) {
  localStorage.setItem(PREFIX + name, JSON.stringify(items));
}

export function createId() {
  return globalThis.crypto?.randomUUID?.() || `cc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value + (value.length === 10 ? "T12:00:00" : ""));
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR").format(date);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
}

export function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
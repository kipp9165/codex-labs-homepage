export async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    const message = data && typeof data === "object" && data.message ? String(data.message) : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

export function showAlert(message) {
  const text = String(message || "");
  let region = document.getElementById("app-alert-region");
  if (!region) {
    region = document.createElement("div");
    region.id = "app-alert-region";
    region.setAttribute("role", "alert");
    region.setAttribute("aria-live", "assertive");
    region.style.position = "fixed";
    region.style.top = "16px";
    region.style.left = "50%";
    region.style.transform = "translateX(-50%)";
    region.style.background = "#111827";
    region.style.color = "#ffffff";
    region.style.padding = "10px 14px";
    region.style.borderRadius = "8px";
    region.style.zIndex = "1000";
    region.style.maxWidth = "90vw";
    region.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.2)";
    document.body.appendChild(region);
  }
  region.textContent = text;
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

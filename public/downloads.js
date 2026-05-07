import { fetchJSON, showAlert, escapeHtml } from "./app.js";

const sessionId = localStorage.getItem("sessionId");
if (!sessionId) {
  window.location.href = "/public/login.html";
}

const res = await fetchJSON(`/api/artifacts?sessionId=${encodeURIComponent(sessionId)}`);
if (!res || !res.ok) {
  window.location.href = "/public/login.html";
}

const list = document.getElementById("artifact-list");
for (const artifact of res.artifacts) {
  const li = document.createElement("li");
  li.innerHTML = `<strong>${escapeHtml(artifact.title)}</strong> — v${escapeHtml(artifact.version)} <button data-id="${escapeHtml(artifact.id)}">Download</button>`;
  list.appendChild(li);
}

list.addEventListener("click", async (e) => {
  if (e.target.tagName !== "BUTTON") return;
  const artifactId = e.target.dataset.id;
  const tokenRes = await fetchJSON("/api/artifacts/download-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, artifactId }),
  });
  if (tokenRes && tokenRes.ok && tokenRes.token) {
    window.location.href = `/api/artifacts/download?token=${encodeURIComponent(tokenRes.token)}`;
  } else {
    showAlert("Unable to generate download link");
  }
});

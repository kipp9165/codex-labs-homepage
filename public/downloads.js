import { fetchJSON, showAlert } from "./app.js";

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
  const title = document.createElement("strong");
  title.textContent = artifact.title;
  const version = document.createTextNode(` — v${artifact.version} `);
  const btn = document.createElement("button");
  btn.textContent = "Download";
  btn.dataset.id = artifact.id;
  li.appendChild(title);
  li.appendChild(version);
  li.appendChild(btn);
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

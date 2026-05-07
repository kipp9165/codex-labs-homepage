const sections = [
  { id: "system-status", label: "System Status" },
  { id: "products", label: "Products" },
  { id: "entitlements", label: "Entitlements" },
  { id: "license-verification", label: "License Verification" },
  { id: "customer-portal-state", label: "Customer Portal State" },
  { id: "purchases", label: "Purchases (Baserow)" },
  { id: "fulfillment-records", label: "Fulfillment Records (Baserow)" },
  { id: "discord-sync", label: "Discord Sync" },
  { id: "notion-sync", label: "Notion Sync" }
];

const config = window.__CONFIG__ || {};
const nav = document.getElementById("nav");
const title = document.getElementById("section-title");
const main = document.getElementById("main-content");

async function apiGet(path) {
  const response = await fetch(path);
  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }
  if (!response.ok) {
    throw new Error(JSON.stringify(parsed, null, 2));
  }
  return parsed;
}

async function apiPost(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }
  if (!response.ok) {
    throw new Error(JSON.stringify(parsed, null, 2));
  }
  return parsed;
}

async function fetchBaserow(url) {
  if (!url || !config.BASEROW_API_KEY) {
    return { error: "Missing BASEROW_PURCHASES_URL, BASEROW_FULFILLMENT_URL, or BASEROW_API_KEY in window.__CONFIG__." };
  }
  const response = await fetch(url, {
    headers: {
      Authorization: `Token ${config.BASEROW_API_KEY}`
    }
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }
  if (!response.ok) {
    throw new Error(JSON.stringify(parsed, null, 2));
  }
  return parsed;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderJson(data) {
  const content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  main.innerHTML = `<pre class="json-block">${escapeHtml(content)}</pre>`;
}

function renderError(error) {
  renderJson({ error: error.message || String(error) });
}

function renderForm(label, callback, buttonLabel = "Load") {
  main.innerHTML = `
    <div class="controls">
      <input type="email" id="email" placeholder="Email" aria-label="${label}" />
      <button id="submit">${buttonLabel}</button>
    </div>
    <p class="subtle">Enter an email and run the query.</p>
    <pre class="json-block">{}</pre>
  `;
  const input = document.getElementById("email");
  const button = document.getElementById("submit");
  const output = main.querySelector(".json-block");
  const run = async () => {
    const email = input.value.trim();
    if (!email) {
      output.textContent = JSON.stringify({ error: "Email is required." }, null, 2);
      return;
    }
    output.textContent = "Loading...";
    try {
      const data = await callback(email);
      output.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
      output.textContent = JSON.stringify({ error: error.message || String(error) }, null, 2);
    }
  };
  button.addEventListener("click", run);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      run();
    }
  });
}

function renderLicenseForm() {
  main.innerHTML = `
    <div class="controls">
      <input type="text" id="licenseKey" placeholder="License key" aria-label="License key" />
      <input type="email" id="licenseEmail" placeholder="Email" aria-label="Email" />
      <button id="verify">Verify</button>
    </div>
    <p class="subtle">Verify a license against the API gateway.</p>
    <pre class="json-block">{}</pre>
  `;
  const keyInput = document.getElementById("licenseKey");
  const emailInput = document.getElementById("licenseEmail");
  const button = document.getElementById("verify");
  const output = main.querySelector(".json-block");

  const run = async () => {
    const licenseKey = keyInput.value.trim();
    const email = emailInput.value.trim();
    if (!licenseKey || !email) {
      output.textContent = JSON.stringify({ error: "License key and email are required." }, null, 2);
      return;
    }
    output.textContent = "Loading...";
    try {
      const data = await apiPost("/api/license/verify", { licenseKey, email });
      output.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
      output.textContent = JSON.stringify({ error: error.message || String(error) }, null, 2);
    }
  };

  button.addEventListener("click", run);
  [keyInput, emailInput].forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        run();
      }
    });
  });
}

async function renderSection(id) {
  try {
    if (id === "system-status") {
      renderJson(await apiGet("/api/status"));
      return;
    }
    if (id === "products") {
      renderJson(await apiGet("/api/products"));
      return;
    }
    if (id === "entitlements") {
      renderForm("Entitlements email", (email) => apiGet(`/api/entitlements?email=${encodeURIComponent(email)}`));
      return;
    }
    if (id === "license-verification") {
      renderLicenseForm();
      return;
    }
    if (id === "customer-portal-state") {
      renderForm("Portal email", (email) => apiGet(`/api/portal?email=${encodeURIComponent(email)}`));
      return;
    }
    if (id === "purchases") {
      renderJson(await fetchBaserow(config.BASEROW_PURCHASES_URL));
      return;
    }
    if (id === "fulfillment-records") {
      renderJson(await fetchBaserow(config.BASEROW_FULFILLMENT_URL));
      return;
    }
    if (id === "discord-sync") {
      renderJson({ status: "No dedicated endpoint configured.", source: "Operator Console" });
      return;
    }
    if (id === "notion-sync") {
      renderJson({ status: "No dedicated endpoint configured.", source: "Operator Console" });
      return;
    }
  } catch (error) {
    renderError(error);
  }
}

function selectSection(section) {
  title.textContent = section.label;
  Array.from(nav.querySelectorAll("button")).forEach((button) => {
    button.classList.toggle("active", button.dataset.id === section.id);
  });
  main.innerHTML = "<pre class=\"json-block\">Loading...</pre>";
  renderSection(section.id);
}

function init() {
  sections.forEach((section, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = section.label;
    button.dataset.id = section.id;
    button.addEventListener("click", () => selectSection(section));
    nav.appendChild(button);
    if (index === 0) {
      selectSection(section);
    }
  });
}

init();

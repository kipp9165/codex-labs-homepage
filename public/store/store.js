const script = document.currentScript;
const page = script?.dataset.page || "home";
const statusEl = document.getElementById("store-status");
const ACTIVATION_REDIRECT_DELAY = 1200;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

function formatAmount(amount, code) {
  if (typeof amount !== "number") {
    return "Price on request";
  }
  if (code && code.toUpperCase() !== "USD") {
    return `${(amount / 100).toFixed(2)} ${code.toUpperCase()}`;
  }
  return currency.format(amount / 100);
}

function setStatus(text, className = "") {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.className = `status ${className}`.trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function isSafeRedirectUrl(url) {
  if (typeof url !== "string" || !url.trim()) {
    return false;
  }

  if (url.startsWith("/") && !url.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(url, window.location.origin);
    const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
    return isHttp && parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

function renderHome(products) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  const cards = products.flatMap((product) => {
    const prices = Array.isArray(product.prices) && product.prices.length ? product.prices : [null];
    return prices.map((price) => {
      const tier = price?.tier || "No active tier";
      const encodedProductId = encodeURIComponent(product.id);
      return `
        <article class="card">
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.description || "")}</p>
          <div class="meta-row">
            <span class="chip">${escapeHtml(tier)}</span>
            <span class="chip">${escapeHtml(product.family || "product")}</span>
          </div>
          <strong class="price">${escapeHtml(price ? formatAmount(price.amount, price.currency) : "No current pricing")}</strong>
          <a class="view-link" href="/store/product.html?product=${escapeHtml(encodedProductId)}">View Product</a>
        </article>
      `;
    });
  });

  grid.innerHTML = cards.join("");
  setStatus(`${products.length} product${products.length === 1 ? "" : "s"} loaded.`);
}

function getQueryValue(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function handleCheckout(productId, lookupKey, button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Opening Checkout...";
  try {
    const payload = await fetchJson("/api/checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, lookupKey })
    });
    if (!payload.url) {
      throw new Error("Unable to generate checkout URL. Please try again or contact support.");
    }
    window.location.href = payload.url;
  } catch (error) {
    setStatus(error.message, "error");
    button.disabled = false;
    button.textContent = originalText;
  }
}

function renderProduct(product) {
  const detail = document.getElementById("product-detail");
  if (!detail) return;
  const isActivated = Boolean(getQueryValue("activated"));

  const prices = Array.isArray(product.prices) ? product.prices : [];
  const rows = prices.length
    ? prices
        .map(
          (price) => `
            <div class="price-row">
              <strong>${escapeHtml(price.tier || "default")}</strong>
              <span>${escapeHtml(formatAmount(price.amount, price.currency))}</span>
              <button class="btn" data-lookup-key="${escapeHtml(price.lookup_key)}">Buy</button>
            </div>
          `
        )
        .join("")
    : '<p class="status">No prices are currently available for this product.</p>';

  const activationNotice = isActivated
    ? '<p class="note">Purchase complete. Entering your Activation Ritual now...</p>'
    : "";

  detail.innerHTML = `
    <h1>${escapeHtml(product.name)}</h1>
    <p class="product-description">${escapeHtml(product.description || "")}</p>
    ${activationNotice}
    <section class="price-grid">
      <h3>Select Tier</h3>
      ${rows}
    </section>
  `;

  if (isActivated && isSafeRedirectUrl(product.activationRitualUrl)) {
    window.setTimeout(() => {
      window.location.href = product.activationRitualUrl;
    }, ACTIVATION_REDIRECT_DELAY);
  }

  detail.querySelectorAll("button[data-lookup-key]").forEach((button) => {
    const lookupKey = button.getAttribute("data-lookup-key");
    button.addEventListener("click", () => handleCheckout(product.id, lookupKey, button));
  });

  setStatus("Product ready.");
}

async function bootstrapHome() {
  setStatus("Loading products...");
  const { products } = await fetchJson("/api/products");
  renderHome(products || []);
}

async function bootstrapProduct() {
  const productId = getQueryValue("product");
  if (!productId) {
    setStatus("No product selected.", "error");
    return;
  }
  setStatus("Loading product...");
  const product = await fetchJson(`/api/products/${encodeURIComponent(productId)}`);
  renderProduct(product);
}

(async () => {
  try {
    if (page === "product") {
      await bootstrapProduct();
      return;
    }
    await bootstrapHome();
  } catch (error) {
    setStatus(error.message || "Unable to load store data.", "error");
  }
})();

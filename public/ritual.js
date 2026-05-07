import { fetchJSON, showAlert, escapeHtml } from "./app.js";

const progressEl = document.getElementById("progress");
const step1El = document.getElementById("step-1");
const step2El = document.getElementById("step-2");
const step3El = document.getElementById("step-3");
const emailEl = document.getElementById("email");
const identifyBtnEl = document.getElementById("identify-btn");
const productEl = document.getElementById("product");
const licenseEl = document.getElementById("license");
const verifyBtnEl = document.getElementById("verify-btn");
const revealPanelEl = document.getElementById("reveal-panel");

let identifiedEmail = "";
let selectedProduct = "";
let verifyResult = null;
let portalState = null;

function updateProgress(step) {
  progressEl.textContent = `Step ${step} of 3`;
}

function setStepState(stepEl, { active, complete }) {
  stepEl.classList.toggle("step-active", active);
  stepEl.classList.toggle("step-complete", complete);
}

function normalizeProducts(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.products)) {
    return payload.products;
  }
  return [];
}

function getProductMeta(product) {
  if (typeof product === "string") {
    return { id: product, name: product };
  }
  if (!product || typeof product !== "object") {
    return null;
  }
  const id = product.id || product.product || product.slug || product.code || "";
  const name = product.name || product.title || id;
  if (!id) {
    return null;
  }
  return { id: String(id), name: String(name || id) };
}

function populateProducts(products) {
  productEl.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a product";
  productEl.appendChild(placeholder);

  products
    .map(getProductMeta)
    .filter(Boolean)
    .forEach((product) => {
      const option = document.createElement("option");
      option.value = product.id;
      option.textContent = product.name;
      productEl.appendChild(option);
    });
}

async function loadProducts() {
  try {
    const data = await fetchJSON("/api/products");
    const products = normalizeProducts(data);
    populateProducts(products);
  } catch {
    showAlert("Unable to load products");
  }
}

function unlockStep2() {
  step2El.hidden = false;
  productEl.disabled = false;
  licenseEl.disabled = false;
  verifyBtnEl.disabled = false;
  setStepState(step1El, { active: false, complete: true });
  setStepState(step2El, { active: true, complete: false });
  setStepState(step3El, { active: false, complete: false });
  updateProgress(2);
}

function unlockStep3() {
  step3El.hidden = false;
  setStepState(step2El, { active: false, complete: true });
  setStepState(step3El, { active: true, complete: false });
  updateProgress(3);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function fetchPortalState() {
  if (!identifiedEmail) {
    return null;
  }
  try {
    portalState = await fetchJSON(`/api/portal?email=${encodeURIComponent(identifiedEmail)}`);
  } catch {
    portalState = null;
  }
  return portalState;
}

function normalizeEntitlements(source) {
  const value = source && source.entitlements;
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key);
  }
  return [];
}

function getPortalUrl(source) {
  if (!source || typeof source !== "object") {
    return "";
  }
  return source.portalUrl || source.url || source.portal || "";
}

function isLicenseValid(result) {
  return Boolean(result && (result.valid === true || result.licenseValid === true));
}

function showVerifyError(error) {
  showAlert(error instanceof Error ? error.message : "Verification failed");
}

async function verifyLicense(payload) {
  const endpoints = ["/api/license/verify", "/api/verify"];
  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      return await fetchJSON(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Verification failed");
}

function renderReveal() {
  const valid = isLicenseValid(verifyResult);
  const verifyEntitlements = normalizeEntitlements(verifyResult);
  const entitlements = verifyEntitlements.length ? verifyEntitlements : normalizeEntitlements(portalState);
  const portalUrl = getPortalUrl(portalState) || getPortalUrl(verifyResult);

  const entitlementList = entitlements.length
    ? `<ul class="reveal-list">${entitlements.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "<p>None</p>";

  const portalMarkup = portalUrl
    ? `<a href="${escapeHtml(portalUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(portalUrl)}</a>`
    : "Unavailable";

  revealPanelEl.innerHTML = `
    <div class="reveal-row"><strong>Email:</strong> ${escapeHtml(identifiedEmail)}</div>
    <div class="reveal-row"><strong>Product:</strong> ${escapeHtml(selectedProduct)}</div>
    <div class="reveal-row"><strong>License validity:</strong> ${valid ? "Valid" : "Invalid"}</div>
    <div class="reveal-row"><strong>Entitlements:</strong> ${entitlementList}</div>
    <div class="reveal-row"><strong>Portal URL:</strong> ${portalMarkup}</div>
  `;
}

async function completeVerification() {
  await fetchPortalState();
  unlockStep3();
  renderReveal();
  setStepState(step3El, { active: false, complete: true });
}

identifyBtnEl.addEventListener("click", async () => {
  const email = emailEl.value.trim();
  if (!isValidEmail(email)) {
    showAlert("Please enter a valid email");
    return;
  }
  identifiedEmail = email;
  unlockStep2();
  await fetchPortalState();
});

verifyBtnEl.addEventListener("click", async () => {
  const product = productEl.value.trim();
  const license = licenseEl.value.trim();

  if (!identifiedEmail || !isValidEmail(identifiedEmail)) {
    showAlert("Please complete Step 1");
    return;
  }

  if (!product) {
    showAlert("Please select a product");
    return;
  }

  if (!license) {
    showAlert("Please enter a license");
    return;
  }

  selectedProduct = product;

  const payload = {
    email: identifiedEmail,
    product,
    license
  };

  try {
    verifyResult = await verifyLicense(payload);
  } catch (error) {
    showVerifyError(error);
    return;
  }

  const valid = isLicenseValid(verifyResult);
  if (!valid) {
    showAlert("Invalid license");
    setStepState(step2El, { active: true, complete: false });
    step3El.hidden = true;
    setStepState(step3El, { active: false, complete: false });
    updateProgress(2);
    return;
  }

  await completeVerification();
});

loadProducts();

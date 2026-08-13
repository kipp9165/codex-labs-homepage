const WHALE_BACKEND_BASE_URL = "https://codex-os-runtime-service.onrender.com/api/whale";

function readWhaleStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch (_error) {
    return {};
  }
}

function setJsonContent(elementId, value) {
  const node = document.getElementById(elementId);
  if (node) {
    node.textContent = JSON.stringify(value, null, 2);
  }
}

async function fetchWhaleBackendData() {
  const response = await fetch(`${WHALE_BACKEND_BASE_URL}/data`);

  if (!response.ok) {
    throw new Error(`Backend data request failed with status ${response.status}`);
  }

  const result = await response.json();
  setJsonContent("backendData", result);
  return result;
}

async function sendToRenderBackend() {
  const lead = readWhaleStorage("whale_lead");
  const crm = readWhaleStorage("whale_crm_event");

  const response = await fetch(`${WHALE_BACKEND_BASE_URL}/intake`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      lead,
      crm,
      tier: lead.tier || crm.tier || null,
      referral: lead.referral || crm.referral || null,
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Whale intake failed with status ${response.status}`);
  }

  const result = await response.json();
  setJsonContent("backendData", result);
  alert("Whale data sent to Codex OS Runtime.");
  return result;
}

window.fetchWhaleBackendData = fetchWhaleBackendData;
window.sendToRenderBackend = sendToRenderBackend;
window.readWhaleStorage = readWhaleStorage;
window.setJsonContent = setJsonContent;

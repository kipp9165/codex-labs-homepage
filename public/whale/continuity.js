const WHALE_CONTINUITY_URL = "https://codex-os-runtime-service.onrender.com/api/whale/continuity-score";

function applyContinuityResult(result) {
  const scoreNode = document.getElementById("continuityScore");
  if (scoreNode) {
    scoreNode.innerText = "Continuity Score: " + result.score;
  }

  const detailedScores = result.scores || {};
  const mappings = {
    governanceAlignment: "governanceAlignmentScore",
    continuityStability: "continuityStabilityScore",
    identityLifecycle: "identityLifecycleScore",
    enterpriseReadiness: "enterpriseReadinessScore"
  };

  Object.entries(mappings).forEach(([key, elementId]) => {
    const node = document.getElementById(elementId);
    if (node && detailedScores[key] !== undefined) {
      node.innerText = detailedScores[key];
    }
  });

  if (typeof window.setJsonContent === "function") {
    window.setJsonContent("continuityResponse", result);
  }
}

async function calculateContinuityScore() {
  const lead = typeof window.readWhaleStorage === "function"
    ? window.readWhaleStorage("whale_lead")
    : JSON.parse(localStorage.getItem("whale_lead") || "{}");
  const crm = typeof window.readWhaleStorage === "function"
    ? window.readWhaleStorage("whale_crm_event")
    : JSON.parse(localStorage.getItem("whale_crm_event") || "{}");

  const response = await fetch(WHALE_CONTINUITY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lead, crm })
  });

  if (!response.ok) {
    throw new Error(`Continuity scoring failed with status ${response.status}`);
  }

  const result = await response.json();
  applyContinuityResult(result);
  return result;
}

window.calculateContinuityScore = calculateContinuityScore;
window.applyContinuityResult = applyContinuityResult;

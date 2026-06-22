(function () {
  var AFFILIATE_STORAGE_KEY = "codex_affiliate_ref";
  var REF_PATTERN = /^[a-zA-Z0-9_-]{2,64}$/;

  function sanitizeReferralCode(value) {
    if (!value) {
      return "";
    }

    var normalized = String(value).trim();
    return REF_PATTERN.test(normalized) ? normalized : "";
  }

  function getReferralCodeFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return sanitizeReferralCode(params.get("ref"));
    } catch (_error) {
      return "";
    }
  }

  function getStoredReferralCode() {
    try {
      return sanitizeReferralCode(window.localStorage.getItem(AFFILIATE_STORAGE_KEY) || "");
    } catch (_error) {
      return "";
    }
  }

  function persistReferralCode(ref) {
    if (!ref) {
      return;
    }

    try {
      window.localStorage.setItem(AFFILIATE_STORAGE_KEY, ref);
    } catch (_error) {
      return;
    }
  }

  function getActiveReferralCode() {
    var refFromUrl = getReferralCodeFromUrl();
    if (refFromUrl) {
      persistReferralCode(refFromUrl);
      return refFromUrl;
    }

    return getStoredReferralCode();
  }

  function renderReferralCode(ref) {
    var display = document.getElementById("affiliate-ref-display");
    if (!display || !ref) {
      return;
    }

    display.textContent = "Your referral code: " + ref;
    display.hidden = false;
  }

  function buildReferralEventPayload(ref) {
    if (!ref) {
      return null;
    }

    return {
      ref: ref,
      path: window.location.pathname || "/affiliate.html",
      ts: new Date().toISOString(),
    };
  }

  function initAffiliatePage() {
    var ref = getActiveReferralCode();
    renderReferralCode(ref);

    // Expose a minimal payload builder for later backend or analytics wiring.
    // This keeps the event shape deterministic without sending data anywhere yet.
    window.__codexBuildAffiliateReferralEvent = function () {
      return buildReferralEventPayload(ref);
    };
  }

  document.addEventListener("DOMContentLoaded", initAffiliatePage);
})();

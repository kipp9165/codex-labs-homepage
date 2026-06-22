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
    } catch {
      // Ignore malformed query strings and fall back to stored state.
      return "";
    }
  }

  function getStoredReferralCode() {
    try {
      return sanitizeReferralCode(window.localStorage.getItem(AFFILIATE_STORAGE_KEY) || "");
    } catch {
      // Ignore storage access errors so the page remains functional.
      return "";
    }
  }

  function persistReferralCode(ref) {
    if (!ref) {
      return;
    }

    try {
      window.localStorage.setItem(AFFILIATE_STORAGE_KEY, ref);
    } catch {
      // Ignore storage access errors so referral display stays non-blocking.
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
    display.style.display = "";
    display.setAttribute("aria-hidden", "false");
  }

  function buildAffiliateReferralEvent(ref) {
    if (!ref) {
      return null;
    }

    return {
      ref: ref,
      path: window.location.pathname || "/",
      ts: new Date().toISOString(),
    };
  }

  function initAffiliatePage() {
    var ref = getActiveReferralCode();
    renderReferralCode(ref);

    // Expose a minimal payload builder for future integrations.
    // Consumers can call window.__codexBuildAffiliateReferralEvent() before a
    // fetch beacon or privacy-friendly analytics event to reuse the same shape
    // without mutating page state or sending data automatically from this file.
    window.__codexBuildAffiliateReferralEvent = function () {
      return buildAffiliateReferralEvent(getActiveReferralCode());
    };
  }

  document.addEventListener("DOMContentLoaded", initAffiliatePage);
})();

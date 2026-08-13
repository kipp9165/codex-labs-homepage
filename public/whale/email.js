(function () {
  var WHALE_EVENT_KEY = "whale_crm_event";
  var WHALE_LEAD_KEY = "whale_lead";
  var WHALE_REF_KEY = "whale_ref";
  var AFFILIATE_REF_KEY = "codex_affiliate_ref";
  var REF_PATTERN = /^[a-zA-Z0-9_-]{2,64}$/;

  function safeGetItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  }

  function safeSetItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_error) {
      return false;
    }

    return true;
  }

  function sanitizeRef(value) {
    if (!value) {
      return null;
    }

    var normalized = String(value).trim();
    return REF_PATTERN.test(normalized) ? normalized : null;
  }

  function sanitizeText(value) {
    if (value == null) {
      return "";
    }

    return String(value).trim();
  }

  function getSearchParams() {
    try {
      return new URLSearchParams(window.location.search || "");
    } catch (_error) {
      return new URLSearchParams();
    }
  }

  function getWhaleContext() {
    var params = getSearchParams();
    var ref = sanitizeRef(params.get("ref"))
      || sanitizeRef(safeGetItem(WHALE_REF_KEY))
      || sanitizeRef(safeGetItem(AFFILIATE_REF_KEY));
    var tier = sanitizeText(params.get("tier")) || null;

    if (ref) {
      safeSetItem(WHALE_REF_KEY, ref);
      safeSetItem(AFFILIATE_REF_KEY, ref);
    }

    return { ref: ref, tier: tier };
  }

  function persistWhaleEvent(context) {
    var payload = {
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      referrer: document.referrer || null,
      whale_ref: context.ref || null,
      tier: context.tier || null
    };

    safeSetItem(WHALE_EVENT_KEY, JSON.stringify(payload));
    return payload;
  }

  function setContextText(elementId, value) {
    var node = document.getElementById(elementId);
    if (!node) {
      return;
    }

    node.textContent = value || "Not provided";
  }

  function setStatus(message) {
    var node = document.getElementById("whaleLeadStatus");
    if (!node) {
      return;
    }

    node.textContent = message;
  }

  function updateEmailButtonState() {
    var button = document.getElementById("whaleEmailButton");
    if (!button) {
      return;
    }

    var hasLead = !!safeGetItem(WHALE_LEAD_KEY);
    button.disabled = !hasLead;
    button.setAttribute("aria-disabled", hasLead ? "false" : "true");
  }

  function getStoredLead() {
    try {
      return JSON.parse(safeGetItem(WHALE_LEAD_KEY) || "{}");
    } catch (_error) {
      return {};
    }
  }

  function buildMailtoBody(lead) {
    var lines = [
      "Name: " + sanitizeText(lead.name),
      "Email: " + sanitizeText(lead.email),
      "Message: " + sanitizeText(lead.message),
      "Timestamp: " + sanitizeText(lead.timestamp),
      "Referral: " + sanitizeText(lead.whale_ref),
      "Tier: " + sanitizeText(lead.tier)
    ];

    return lines.join("\n");
  }

  window.sendWhaleEmail = function sendWhaleEmail() {
    var lead = getStoredLead();

    if (!lead.name || !lead.email || !lead.message || !lead.timestamp) {
      setStatus("Save the enterprise request before opening the email draft.");
      return;
    }

    var mailto = "mailto:kippkppwggns@aol.com"
      + "?subject=" + encodeURIComponent("Whale Enterprise Request")
      + "&body=" + encodeURIComponent(buildMailtoBody(lead));

    window.location.href = mailto;
  };

  function bindForm(context) {
    var form = document.getElementById("whaleLeadForm");
    var emailButton = document.getElementById("whaleEmailButton");

    if (emailButton) {
      emailButton.addEventListener("click", window.sendWhaleEmail);
    }

    if (!form) {
      updateEmailButtonState();
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var data = {
        name: sanitizeText(document.getElementById("name") && document.getElementById("name").value),
        email: sanitizeText(document.getElementById("email") && document.getElementById("email").value),
        message: sanitizeText(document.getElementById("message") && document.getElementById("message").value),
        timestamp: new Date().toISOString(),
        whale_ref: context.ref || null,
        tier: context.tier || null
      };

      safeSetItem(WHALE_LEAD_KEY, JSON.stringify(data));
      updateEmailButtonState();
      setStatus("Enterprise request saved. Open the prefilled email to send it.");
      window.alert("Enterprise request submitted.");
    });

    updateEmailButtonState();
  }

  function initWhaleEmailAutomation() {
    var context = getWhaleContext();
    persistWhaleEvent(context);
    setContextText("whaleRefValue", context.ref);
    setContextText("whaleTierValue", context.tier);
    bindForm(context);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWhaleEmailAutomation);
  } else {
    initWhaleEmailAutomation();
  }
})();

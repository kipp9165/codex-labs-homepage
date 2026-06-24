
(function () {
  var SITE_DOMAIN = "https://codex-labs-homepage-4.onrender.com";
  var AFFILIATE_STORAGE_KEY = "codex_affiliate_ref";

  // Affiliate signup URL. Can be overridden by the Render environment via a
  // build-injected global: set window.__AFFILIATE_SIGNUP_URL before this script
  // loads, or configure AFFILIATE_SIGNUP_URL in the site config and inject it
  // at build time. Falls back to the mailto: link in the HTML.
  var AFFILIATE_SIGNUP_URL = (typeof window !== "undefined" && window.__AFFILIATE_SIGNUP_URL)
    ? String(window.__AFFILIATE_SIGNUP_URL).trim()
    : "";

  if (window.__codexCheckoutScriptLoaded) {
    return;
  }
  window.__codexCheckoutScriptLoaded = true;

  // Wire the affiliate signup CTA if a signup URL has been configured.
  function wireAffiliateSignupCta() {
    if (!AFFILIATE_SIGNUP_URL) {
      return;
    }

    document.querySelectorAll("a[href][class*='access-button']").forEach(function (anchor) {
      var text = (anchor.textContent || "").trim().toLowerCase();
      if (text === "email to request an affiliate id" || text === "request affiliate id" || text === "join the affiliate program") {
        anchor.setAttribute("href", AFFILIATE_SIGNUP_URL);
      }
    });
  }

  function safeUrl(input, base) {
    try {
      return new URL(input, base || window.location.origin);
    } catch (_error) {
      return null;
    }
  }

  function sanitizeAffiliateRef(ref) {
    if (!ref) {
      return "";
    }

    var normalized = String(ref).trim();
    if (!/^[a-zA-Z0-9_-]{2,64}$/.test(normalized)) {
      return "";
    }

    return normalized;
  }

  function getAffiliateRefFromLocation() {
    var params = new URLSearchParams(window.location.search || "");
    return sanitizeAffiliateRef(params.get("ref"));
  }

  function getStoredAffiliateRef() {
    try {
      return sanitizeAffiliateRef(window.localStorage.getItem(AFFILIATE_STORAGE_KEY) || "");
    } catch (_error) {
      return "";
    }
  }

  function persistAffiliateRef(ref) {
    if (!ref) {
      return;
    }

    try {
      window.localStorage.setItem(AFFILIATE_STORAGE_KEY, ref);
    } catch (_error) {
      return;
    }
  }

  function getActiveAffiliateRef() {
    var fromUrl = getAffiliateRefFromLocation();
    if (fromUrl) {
      persistAffiliateRef(fromUrl);
      return fromUrl;
    }

    return getStoredAffiliateRef();
  }

  function appendAffiliateRefToHref(href, ref) {
    if (!href || !ref) {
      return href;
    }

    if (href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0 || href.indexOf("javascript:") === 0) {
      return href;
    }

    var parsed = safeUrl(href, window.location.origin);
    if (!parsed) {
      return href;
    }

    if (parsed.origin !== window.location.origin) {
      return href;
    }

    parsed.searchParams.set("ref", ref);
    return parsed.pathname + parsed.search + parsed.hash;
  }

  function normalizeDomainReferences() {
    document.querySelectorAll("a[href]").forEach(function (anchor) {
      var href = (anchor.getAttribute("href") || "").trim();
      if (!href) {
        return;
      }

      if (href.indexOf("codex-labs-homepage.onrender.com") >= 0) {
        anchor.setAttribute("href", href.replace("https://codex-labs-homepage.onrender.com", SITE_DOMAIN).replace("http://codex-labs-homepage.onrender.com", SITE_DOMAIN));
      }
    });
  }

  function formatUsd(amount) {
    var numeric = typeof amount === "number" ? amount : Number(amount);
    if (!Number.isFinite(numeric)) {
      return null;
    }

    return "$" + numeric.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function replacePriceInText(currentText, formattedUsd) {
    if (!currentText || !formattedUsd) {
      return currentText;
    }

    var pricePattern = /\$\s?\d[\d,]*(?:\.\d+)?(?:\s?-\s?\$?\d[\d,]*(?:\.\d+)?)?/;
    if (pricePattern.test(currentText)) {
      return currentText.replace(pricePattern, formattedUsd);
    }

    return currentText;
  }

  function isValidCheckoutUrl(url) {
    if (!url || typeof url !== "string") {
      return false;
    }

    var parsed = safeUrl(url);
    if (!parsed) {
      return false;
    }

    return parsed.protocol === "https:" || parsed.protocol === "http:";
  }

  function disableBrokenCheckoutAnchor(anchor, reason) {
    if (!anchor) {
      return;
    }

    if (anchor.dataset.checkoutDisabled === "1") {
      return;
    }

    anchor.dataset.checkoutDisabled = "1";
    anchor.setAttribute("aria-disabled", "true");
    anchor.removeAttribute("href");
    anchor.addEventListener("click", function (event) {
      event.preventDefault();
      console.error("Checkout anchor disabled:", reason);
    });
  }

  function applyAffiliateRefToInternalLinks() {
    var ref = getActiveAffiliateRef();
    if (!ref) {
      return;
    }

    document.querySelectorAll("a[href]").forEach(function (anchor) {
      var href = (anchor.getAttribute("href") || "").trim();
      if (!href) {
        return;
      }

      if (href.indexOf("#") === 0) {
        return;
      }

      var nextHref = appendAffiliateRefToHref(href, ref);
      if (nextHref && nextHref !== href) {
        anchor.setAttribute("href", nextHref);
      }
    });
  }

  function attachAffiliateLogging() {
    var ref = getActiveAffiliateRef();
    if (!ref) {
      return;
    }

    document.querySelectorAll("a.buy-button, a.access-button").forEach(function (anchor) {
      if (anchor.dataset.affiliateBound === "1") {
        return;
      }

      anchor.dataset.affiliateBound = "1";
      anchor.addEventListener("click", function () {
        console.info("codex_affiliate_ref", {
          ref: ref,
          href: anchor.getAttribute("href") || "",
          product_id: anchor.getAttribute("data-product-id") || "",
          price_id: anchor.getAttribute("data-price-id") || "",
        });
      });
    });
  }

  // The browser checkout surface reads from public/checkout-urls.json so one file owns the live payment link mapping.
  function resolveCheckoutUrl(product, desiredPriceId) {
    if (!product || typeof product !== "object") {
      return { error: "invalid-product" };
    }

    if (Array.isArray(product.prices) && product.prices.length) {
      var chosen = null;

      if (desiredPriceId) {
        chosen = product.prices.find(function (price) {
          return price && price.price_id === desiredPriceId;
        }) || null;

        if (!chosen) {
          return { error: "missing-price-id" };
        }
      }

      if (!chosen) {
        chosen = product.prices
          .filter(function (price) {
            return price && typeof price.amount === "number";
          })
          .sort(function (a, b) {
            return a.amount - b.amount;
          })[0] || product.prices[0];
      }

      if (!chosen || typeof chosen.payment_link_url !== "string" || !chosen.payment_link_url.trim()) {
        return { error: "missing-payment-link" };
      }

      return { url: chosen.payment_link_url, amount: chosen.amount, currency: chosen.currency };
    }

    if (desiredPriceId && product.price_id && product.price_id !== desiredPriceId) {
      return { error: "missing-price-id" };
    }

    if (typeof product.payment_link_url !== "string" || !product.payment_link_url.trim()) {
      return { error: "missing-payment-link" };
    }

    return { url: product.payment_link_url, amount: product.amount, currency: product.currency };
  }

  function updatePriceDisplay(anchor, amount, currency) {
    if (String(currency || "").toLowerCase() !== "usd") {
      return;
    }

    var formattedUsd = formatUsd(amount);
    if (!formattedUsd) {
      return;
    }

    var previousPrice = anchor.previousElementSibling;
    if (previousPrice && previousPrice.classList && previousPrice.classList.contains("product-price")) {
      previousPrice.textContent = replacePriceInText(previousPrice.textContent, formattedUsd);
    }

    var row = anchor.closest("tr");
    if (row && row.cells && row.cells.length >= 2) {
      row.cells[1].textContent = replacePriceInText(row.cells[1].textContent, formattedUsd) || formattedUsd;
    }

    var anchorText = (anchor.textContent || "").trim();
    var nextAnchorText = replacePriceInText(anchorText, formattedUsd);
    if (nextAnchorText !== anchorText) {
      anchor.textContent = nextAnchorText;
    }
  }

  function wireCheckoutButtons(checkoutUrls) {
    document.querySelectorAll("a[data-product-id]").forEach(function (anchor) {
      var productId = anchor.dataset.productId;

      if (!productId || productId.indexOf("prod_") !== 0) {
        return;
      }

      var product = checkoutUrls[productId];
      if (!product) {
        console.error("Missing checkout product for product_id:", productId);
        disableBrokenCheckoutAnchor(anchor, "missing-product-id:" + productId);
        return;
      }

      var resolution = resolveCheckoutUrl(product, anchor.dataset.priceId);
      if (resolution.url) {
        if (!isValidCheckoutUrl(resolution.url)) {
          console.error("Invalid checkout URL for product_id:", productId, resolution.url);
          disableBrokenCheckoutAnchor(anchor, "invalid-url:" + productId);
          return;
        }

        anchor.href = resolution.url;
        updatePriceDisplay(anchor, resolution.amount, resolution.currency);
        return;
      }

      if (resolution.error === "missing-price-id") {
        console.error("Missing checkout price for product_id/price_id:", productId, anchor.dataset.priceId || "(none)");
      } else if (resolution.error === "missing-payment-link") {
        console.error("Missing payment link for product_id:", productId);
      } else {
        console.error("Invalid checkout product record for product_id:", productId);
      }

      disableBrokenCheckoutAnchor(anchor, "unresolved-checkout:" + productId);
    });
  }

  function attachPlausibleTracking() {
    // Plausible only tracks clicks on the existing CTA anchors; no extra analytics wiring lives in the HTML.
    document.querySelectorAll(".buy-button, .access-button").forEach(function (button) {
      if (button.dataset.plausibleBound === "1") {
        return;
      }

      button.dataset.plausibleBound = "1";
      button.addEventListener("click", function () {
        try {
          if (typeof window.plausible !== "function") {
            return;
          }

          window.plausible("cta_click", {
            props: {
              product_id: button.getAttribute("data-product-id") || "",
              price_id: button.getAttribute("data-price-id") || "",
              page: window.location.pathname || "",
            },
          });
        } catch (_error) {
          return;
        }
      });
    });
  }

  function fetchCheckoutUrls(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load checkout URLs from " + url);
      }
      return response.json();
    });
  }

  function loadCheckoutUrls() {
    var paths = ["/checkout-urls.json"];

    if (window.location.protocol === "file:") {
      var segments = window.location.pathname.split("/").filter(Boolean);
      var publicIndex = segments.lastIndexOf("public");
      var directoriesBelowPublic = 0;

      if (publicIndex >= 0) {
        directoriesBelowPublic = Math.max(0, segments.length - publicIndex - 2);
      }

      var prefix = directoriesBelowPublic ? new Array(directoriesBelowPublic + 1).join("../") : "./";
      paths = [prefix + "checkout-urls.json"];
    }

    var attempts = paths.map(function (path) {
      return function () {
        return fetchCheckoutUrls(path);
      };
    });

    return attempts.reduce(function (chain, attempt) {
      return chain.catch(function () {
        return attempt();
      });
    }, Promise.reject(new Error("Checkout URL load not attempted")));
  }

  function initCheckoutWiring() {
    if (window.__codexCheckoutInitialized) {
      return;
    }
    window.__codexCheckoutInitialized = true;

    normalizeDomainReferences();
    wireAffiliateSignupCta();
    applyAffiliateRefToInternalLinks();
    attachAffiliateLogging();
    attachPlausibleTracking();

    loadCheckoutUrls()
      .then(function (checkoutUrls) {
        wireCheckoutButtons(checkoutUrls);
        applyAffiliateRefToInternalLinks();
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  window.__codexInitCheckoutWiring = initCheckoutWiring;

  document.addEventListener("DOMContentLoaded", function () {
    initCheckoutWiring();
  });
})();
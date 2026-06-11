
(function () {
  var SITE_DOMAIN = "https://codex-labs-homepage-4.onrender.com";
  var AFFILIATE_STORAGE_KEY = "codex_affiliate_ref";

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

  function ensureNavLinks() {
    document.querySelectorAll(".nav-links").forEach(function (nav) {
      if (!nav.querySelector('a[href="/invention-radar.html"]')) {
        var inventionLink = document.createElement("a");
        inventionLink.href = "/invention-radar.html";
        inventionLink.textContent = "Invention Radar";
        nav.appendChild(inventionLink);
      }

      if (!nav.querySelector('a[href="/affiliate.html"]')) {
        var affiliateLink = document.createElement("a");
        affiliateLink.href = "/affiliate.html";
        affiliateLink.textContent = "Affiliates";
        nav.appendChild(affiliateLink);
      }
    });
  }

  function normalizeCtaButtons() {
    document.querySelectorAll("a.buy-button, a.access-button").forEach(function (anchor) {
      var text = (anchor.textContent || "").trim();
      var lowerText = text.toLowerCase();
      var productId = anchor.getAttribute("data-product-id") || "";
      var isCheckoutButton = productId.indexOf("prod_") === 0;
      var href = (anchor.getAttribute("href") || "").trim();

      if (isCheckoutButton) {
        anchor.classList.add("buy-button");
        anchor.classList.remove("access-button");
        if (lowerText === "get access" || lowerText === "get access now" || lowerText === "access os") {
          anchor.textContent = "Buy";
        }
        if (href === "" || href === "#") {
          anchor.href = "/pricing.html";
        }
        return;
      }

      if (lowerText.indexOf("get access") >= 0 || lowerText.indexOf("access os") >= 0 || lowerText.indexOf("explore codex labs os") >= 0) {
        anchor.classList.add("access-button");
        anchor.classList.remove("buy-button");
      }

      if ((href === "" || href === "#") && !isCheckoutButton) {
        anchor.href = "/pricing.html";
      }
    });
  }

  function normalizeFooterCtas() {
    document.querySelectorAll(".site-footer .footer-right").forEach(function (container) {
      container.innerHTML = 'Sovereign infrastructure for the age of intelligence. <a class="access-button" href="/os-overview.html">Explore Codex Labs OS</a> <a class="buy-button" href="/pricing.html">View Pricing</a>';
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

      return { url: chosen.payment_link_url };
    }

    if (desiredPriceId && product.price_id && product.price_id !== desiredPriceId) {
      return { error: "missing-price-id" };
    }

    if (typeof product.payment_link_url !== "string" || !product.payment_link_url.trim()) {
      return { error: "missing-payment-link" };
    }

    return { url: product.payment_link_url };
  }

  function wireCheckoutButtons(checkoutUrls) {
    document.querySelectorAll("a[data-product-id]").forEach(function (anchor) {
      var productId = anchor.dataset.productId;
      var existingHref = (anchor.getAttribute("href") || "").trim();

      // Keep deterministic static links intact when HTML already provides a concrete checkout URL.
      if (existingHref && existingHref !== "#" && existingHref !== "/pricing.html") {
        return;
      }

      if (!productId || productId.indexOf("prod_") !== 0) {
        return;
      }

      var product = checkoutUrls[productId];
      if (!product) {
        console.error("Missing checkout product for product_id:", productId);
        return;
      }

      var resolution = resolveCheckoutUrl(product, anchor.dataset.priceId);
      if (resolution.url) {
        anchor.href = resolution.url;
        return;
      }

      if (resolution.error === "missing-price-id") {
        console.error("Missing checkout price for product_id/price_id:", productId, anchor.dataset.priceId || "(none)");
      } else if (resolution.error === "missing-payment-link") {
        console.error("Missing payment link for product_id:", productId);
      } else {
        console.error("Invalid checkout product record for product_id:", productId);
      }
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

  document.addEventListener("DOMContentLoaded", function () {
    normalizeDomainReferences();
    ensureNavLinks();
    normalizeCtaButtons();
    normalizeFooterCtas();
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
  });
})();
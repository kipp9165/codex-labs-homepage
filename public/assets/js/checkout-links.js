
(function () {
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
    document.querySelectorAll(".buy-button").forEach(function (button) {
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
    attachPlausibleTracking();

    loadCheckoutUrls()
      .then(function (checkoutUrls) {
        wireCheckoutButtons(checkoutUrls);
      })
      .catch(function (error) {
        console.error(error);
      });
  });
})();
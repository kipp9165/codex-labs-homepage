
(function () {
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
      if (!productId) {
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

  function fetchCheckoutUrls(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load checkout URLs from " + url);
      }
      return response.json();
    });
  }

  function loadCheckoutUrls() {
    var paths = window.location.protocol === "file:" ? ["./checkout-urls.json", "../checkout-urls.json"] : ["/checkout-urls.json"];

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
    loadCheckoutUrls()
      .then(function (checkoutUrls) {
        wireCheckoutButtons(checkoutUrls);
      })
      .catch(function (error) {
        console.error(error);
      });
  });
})();
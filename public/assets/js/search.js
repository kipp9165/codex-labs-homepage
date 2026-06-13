(function () {
  var SEARCH_INDEX = [
    { title: "Codex Labs Home", url: "/index.html", tags: ["home", "codex labs os", "founder"] },
    { title: "Codex Labs OS Overview", url: "/os-overview.html", tags: ["os", "overview", "system"] },
    { title: "Invention Radar", url: "/invention-radar.html", tags: ["invention", "radar", "stripe", "subscription"] },
    { title: "Pricing", url: "/pricing.html", tags: ["pricing", "buy", "checkout", "sku"] },
    { title: "Scroll Canon", url: "/scroll-canon.html", tags: ["scroll", "canon", "architecture"] },
    { title: "Scroll Library", url: "/scrolls/index.html", tags: ["scrolls", "library", "detail"] },
    { title: "Store", url: "/store/index.html", tags: ["store", "products", "checkout"] },
    { title: "Bundles", url: "/bundles.html", tags: ["bundles", "offers", "packages"] },
    { title: "DeerSafe", url: "/deersafe.html", tags: ["safety", "guardian", "road"] },
    { title: "Stove Timer", url: "/stove-timer.html", tags: ["safety", "kitchen", "timer"] },
    { title: "Execution Stabilization System", url: "/execution-stabilization-system.html", tags: ["execution", "stability", "operations"] },
    { title: "High-Clarity Decision Protocol", url: "/high-clarity-decision-protocol.html", tags: ["decision", "clarity", "protocol"] },
    { title: "Decision Stabilization Loop", url: "/os-overview.html#invention-loop", tags: ["new artifact", "loop", "founder"] },
    { title: "Founder Clarity Pass", url: "/index.html#new-artifacts", tags: ["new artifact", "pass", "clarity"] },
    { title: "Affiliate Program", url: "/affiliate.html", tags: ["affiliate", "referral", "partners"] }
  ];

  function scoreEntry(entry, query) {
    var title = entry.title.toLowerCase();
    if (title.indexOf(query) >= 0) {
      return 100;
    }

    var tagScore = 0;
    (entry.tags || []).forEach(function (tag) {
      if (tag.toLowerCase().indexOf(query) >= 0) {
        tagScore += 10;
      }
    });

    return tagScore;
  }

  function normalizeQuery(query) {
    return String(query || "").trim().toLowerCase();
  }

  function renderResults(resultsEl, results) {
    resultsEl.innerHTML = "";

    if (!results.length) {
      resultsEl.classList.remove("is-visible");
      return;
    }

    results.forEach(function (entry) {
      var link = document.createElement("a");
      link.className = "site-search-result";
      link.href = entry.url;
      link.textContent = entry.title;

      var tags = document.createElement("span");
      tags.textContent = (entry.tags || []).slice(0, 3).join(" • ");
      link.appendChild(tags);
      resultsEl.appendChild(link);
    });

    resultsEl.classList.add("is-visible");
  }

  function wireSearch(input, resultsEl) {
    input.addEventListener("input", function () {
      var query = normalizeQuery(input.value);
      if (!query) {
        resultsEl.innerHTML = "";
        resultsEl.classList.remove("is-visible");
        return;
      }

      var ranked = SEARCH_INDEX
        .map(function (entry) {
          return { entry: entry, score: scoreEntry(entry, query) };
        })
        .filter(function (candidate) {
          return candidate.score > 0;
        })
        .sort(function (a, b) {
          return b.score - a.score;
        })
        .slice(0, 6)
        .map(function (candidate) {
          return candidate.entry;
        });

      renderResults(resultsEl, ranked);
    });

    document.addEventListener("click", function (event) {
      if (event.target === input || resultsEl.contains(event.target)) {
        return;
      }
      resultsEl.classList.remove("is-visible");
    });
  }

  function ensureCheckoutWiring() {
    if (!document.querySelector("a[data-product-id^='prod_']")) {
      return;
    }

    if (typeof window.__codexInitCheckoutWiring === "function") {
      window.__codexInitCheckoutWiring();
      return;
    }

    if (window.__codexCheckoutScriptLoading || window.__codexCheckoutScriptLoaded) {
      return;
    }

    window.__codexCheckoutScriptLoading = true;

    var script = document.createElement("script");
    script.src = "./assets/js/checkout-links.js";
    script.onload = function () {
      window.__codexCheckoutScriptLoading = false;
      if (typeof window.__codexInitCheckoutWiring === "function") {
        window.__codexInitCheckoutWiring();
      }
    };
    script.onerror = function () {
      window.__codexCheckoutScriptLoading = false;
      console.warn("Failed to load checkout-links.js for dynamic checkout wiring.");
    };
    document.head.appendChild(script);
  }

  document.addEventListener("DOMContentLoaded", function () {
    ensureCheckoutWiring();

    var input = document.getElementById("site-search");
    if (!input) {
      return;
    }

    var resultsEl = document.getElementById("site-search-results");
    if (!resultsEl) {
      resultsEl = document.createElement("div");
      resultsEl.id = "site-search-results";
      resultsEl.className = "site-search-results";
      input.parentNode.appendChild(resultsEl);
    }

    wireSearch(input, resultsEl);
  });
})();

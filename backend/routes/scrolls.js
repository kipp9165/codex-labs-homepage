const DEFAULT_SCROLL_INDEX = "/public/scrolls/index.html";
const DOMAIN_SCROLLS = {
  authority: "/public/whale/protocol.html",
  admissibility: "/public/whale/scroll.html",
  continuity: "/public/whale/index.html",
  consequence: "/public/scrolls/detail.html?slug=consequence",
  interoperability: "/public/scrolls/detail.html?slug=interoperability",
};

export function multiScrollRouter(slug, tier) {
  const normalizedSlug = typeof slug === "string" && slug.trim() ? slug.trim().toLowerCase() : "admissibility";
  const primary = DOMAIN_SCROLLS[normalizedSlug] || `${DEFAULT_SCROLL_INDEX}?slug=${encodeURIComponent(normalizedSlug)}`;
  const baseRoute = {
    slug: normalizedSlug,
    primary,
    metadata: {
      depth: tier === "whale" ? "deep" : "standard",
      routing: tier === "whale" ? "multi_scroll" : "single_scroll",
    },
    cross_navigation: [primary, DEFAULT_SCROLL_INDEX],
  };

  if (tier !== "whale") {
    return baseRoute;
  }

  return {
    ...baseRoute,
    deeper_scroll_frames: [
      "/public/whale/scroll.html",
      "/public/whale/protocol.html",
      "/public/whale/advisory.html",
    ],
    extended_metadata: {
      constitutional_overlay: "active",
      founder_continuity: "available",
      tier,
    },
    constitutional_overlays: ["advisory", "drift", "continuity", "admissibility_t0"],
  };
}

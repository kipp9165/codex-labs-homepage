const JOBS = [
  { name: "healthcheck", label: "Healthcheck: Core Services" },
  { name: "sync_discord_roles", label: "Sync: Discord Roles" },
  { name: "sync_notion_purchases", label: "Sync: Notion Purchases" }
];

const normalizeError = (err) => {
  if (typeof err === "string" && err) {
    return err;
  }
  if (err && typeof err.message === "string" && err.message) {
    return err.message;
  }
  return "unknown_error";
};

const loadModule = async (path) => {
  try {
    return await import(path);
  } catch {
    return null;
  }
};

const findFunction = (module, predicates) => {
  for (const key of Object.keys(module)) {
    const value = module[key];
    if (typeof value !== "function") {
      continue;
    }
    if (predicates.some((predicate) => predicate(key))) {
      return value;
    }
  }
  return null;
};

const successResult = (name, startedAt, details) => ({
  ok: true,
  name,
  startedAt,
  finishedAt: new Date().toISOString(),
  details
});

const runHealthcheck = async () => {
  const productBrain = await loadModule("../product-brain/index.js");
  if (!productBrain || typeof productBrain.listProducts !== "function") {
    throw new Error("product_brain_list_products_unavailable");
  }
  const products = await productBrain.listProducts();
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("products_unavailable");
  }
  const access = await loadModule("../access/index.js");
  if (access) {
    const optionalFn = findFunction(access, [
      (name) => /health|status|ping|check/i.test(name),
      (name) => /^list/i.test(name),
      (name) => /^get/i.test(name)
    ]);
    if (optionalFn) {
      try {
        await optionalFn();
      } catch {
      }
    }
  }
  return { productsCount: products.length };
};

const runSyncDiscordRoles = async () => {
  const discord = await loadModule("../discord/index.js");
  if (!discord) {
    return { ok: false, error: "not_implemented" };
  }
  const syncFn = findFunction(discord, [
    (name) => /^syncDiscordRolesForAll$/i.test(name),
    (name) => /^syncDiscordRoles$/i.test(name),
    (name) => /sync/i.test(name) && /discord/i.test(name) && /role/i.test(name)
  ]);
  if (!syncFn) {
    return { ok: false, error: "not_implemented" };
  }
  await syncFn();
  return { ok: true, details: { synced: true } };
};

const runSyncNotionPurchases = async () => {
  const notion = await loadModule("../notion/index.js");
  if (!notion) {
    return { ok: false, error: "not_implemented" };
  }
  const syncFn = findFunction(notion, [
    (name) => /^syncAllPurchases$/i.test(name),
    (name) => /^syncNotionPurchases$/i.test(name),
    (name) => /sync/i.test(name) && /notion/i.test(name) && /purchase/i.test(name)
  ]);
  if (!syncFn) {
    return { ok: false, error: "not_implemented" };
  }
  await syncFn();
  return { ok: true, details: { synced: true } };
};

export const listJobs = () => JOBS.map((job) => ({ ...job }));

export const runJob = async (name) => {
  const startedAt = new Date().toISOString();
  try {
    if (name === "healthcheck") {
      const details = await runHealthcheck();
      return successResult(name, startedAt, details);
    }
    if (name === "sync_discord_roles") {
      const result = await runSyncDiscordRoles();
      if (!result.ok) {
        return { ok: false, name, error: result.error };
      }
      return successResult(name, startedAt, result.details);
    }
    if (name === "sync_notion_purchases") {
      const result = await runSyncNotionPurchases();
      if (!result.ok) {
        return { ok: false, name, error: result.error };
      }
      return successResult(name, startedAt, result.details);
    }
    return { ok: false, name, error: "unknown_job" };
  } catch (err) {
    return { ok: false, name, error: normalizeError(err) };
  }
};

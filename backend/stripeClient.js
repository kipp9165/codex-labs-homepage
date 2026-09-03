import Stripe from "stripe";

const STRIPE_RENDER_HINT = "Check the Render STRIPE_SECRET_KEY value for surrounding quotes, trailing spaces, or newline characters.";
const loggedStripeMessages = new Set();

function logStripeMessageOnce(level, message) {
  if (loggedStripeMessages.has(message)) {
    return;
  }

  loggedStripeMessages.add(message);
  console[level](message);
}

function stripMatchingQuotes(value) {
  const quote = value[0];
  if (!["\"", "'", "`"].includes(quote) || value[value.length - 1] !== quote) {
    return value;
  }
  return value.slice(1, -1);
}

export function sanitizeStripeSecretKey(value) {
  if (typeof value !== "string") {
    return "";
  }

  return stripMatchingQuotes(value.trim()).trim();
}

export function validateStripeSecretKey(value) {
  if (!value) {
    return "Invalid STRIPE_SECRET_KEY: missing or empty after sanitization";
  }

  if (/\s/.test(value)) {
    return "Invalid STRIPE_SECRET_KEY: contains whitespace or formatting artifacts";
  }

  if (/["'`]/.test(value)) {
    return "Invalid STRIPE_SECRET_KEY: contains quote characters";
  }

  return "";
}

export function resolveStripeSecretKey(value = process.env.STRIPE_SECRET_KEY, { logSanitization = false } = {}) {
  const sanitizedKey = sanitizeStripeSecretKey(value);
  const validationError = validateStripeSecretKey(sanitizedKey);

  if (validationError) {
    logStripeMessageOnce("error", `[Stripe] ${validationError}. ${STRIPE_RENDER_HINT}`);
    return {
      sanitizedKey: "",
      validationError,
      wasSanitized: false,
    };
  }

  const wasSanitized = typeof value === "string" && value !== sanitizedKey;
  if (wasSanitized && logSanitization) {
    logStripeMessageOnce(
      "warn",
      "[Stripe] Sanitized STRIPE_SECRET_KEY before Stripe client initialization. Update Render to remove quotes and trailing whitespace."
    );
  }

  return {
    sanitizedKey,
    validationError: "",
    wasSanitized,
  };
}

export function createStripeClient(secretKey = process.env.STRIPE_SECRET_KEY, options = {}) {
  const { sanitizedKey, validationError } = resolveStripeSecretKey(secretKey);
  if (validationError || !sanitizedKey) {
    return null;
  }

  return new Stripe(sanitizedKey.trim(), options);
}

import Stripe from "stripe";

const STRIPE_RENDER_HINT = "Check the Render STRIPE_SECRET_KEY value for surrounding quotes, trailing spaces, or newline characters.";
const loggedStripeMessages = new Set();
const STRIPE_SECRET_KEY_INVALID_CHARACTERS = /[^A-Za-z0-9_]/;
const STRIPE_SECRET_KEY_FORMATTING_ARTIFACTS = /[\s"'`]/;

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

  const trimmedValue = value.trim();
  const withoutWrappingQuotes = stripMatchingQuotes(trimmedValue);
  return withoutWrappingQuotes.replace(/[\s"'`]+/g, "").trim();
}

export function validateStripeSecretKey(value) {
  if (!value) {
    return "Invalid STRIPE_SECRET_KEY: missing or empty after sanitization";
  }

  if (STRIPE_SECRET_KEY_INVALID_CHARACTERS.test(value)) {
    return "Invalid STRIPE_SECRET_KEY: contains invalid characters";
  }

  return "";
}

export function resolveStripeSecretKey(value = process.env.STRIPE_SECRET_KEY, { logSanitization = false } = {}) {
  if (typeof value === "undefined") {
    const validationError = "Invalid STRIPE_SECRET_KEY: undefined";
    logStripeMessageOnce("error", `[Stripe] ${validationError}. ${STRIPE_RENDER_HINT}`);
    return {
      sanitizedKey: "",
      validationError,
      wasSanitized: false,
    };
  }

  const sanitizedKey = sanitizeStripeSecretKey(value);
  const validationError = validateStripeSecretKey(sanitizedKey);
  const hadFormattingArtifacts = typeof value === "string" && STRIPE_SECRET_KEY_FORMATTING_ARTIFACTS.test(value);

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
      hadFormattingArtifacts
        ? "[Stripe] Sanitized STRIPE_SECRET_KEY before Stripe client initialization by removing quotes or whitespace artifacts. Update Render to store the key without formatting characters."
        : "[Stripe] Sanitized STRIPE_SECRET_KEY before Stripe client initialization."
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

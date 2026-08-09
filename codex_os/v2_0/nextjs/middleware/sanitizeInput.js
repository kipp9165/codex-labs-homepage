export function sanitizeInput(req, res, next) {
  const sanitize = (value) => {
    if (typeof value === "string") {
      return value.replace(/<[^>]*>?/gm, "").normalize();
    }
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    if (typeof value === "object" && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, sanitize(v)])
      );
    }
    return value;
  };

  req.body = sanitize(req.body);
  next();
}

export async function sendMagicLink(email, token) {
  const url = process.env.MAILBRIDGE_URL;
  const publicBaseUrl = process.env.PUBLIC_BASE_URL;
  if (!url) {
    console.error("mailbridge_url_missing");
    return;
  }
  if (!publicBaseUrl) {
    console.error("public_base_url_missing");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        token,
        link: `${publicBaseUrl}/login.html?token=${encodeURIComponent(token)}`
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.error("magic_link_send_failed", response.status);
    }
  } catch (error) {
    console.error("magic_link_send_error", error && error.message ? error.message : error);
  } finally {
    clearTimeout(timeout);
  }
}

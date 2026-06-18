/**
 * Codex Labs Intake Worker
 *
 * Accepts POST from /intake.html, writes a row to Baserow,
 * sends a founder notification email via Resend, then redirects
 * the browser to the success page.
 *
 * Required environment variables (set in wrangler.toml or Cloudflare dashboard):
 *   BASEROW_API_TOKEN  – Baserow database token
 *   BASEROW_TABLE_ID   – numeric table ID in Baserow
 *   FOUNDER_EMAIL      – destination address for notification emails
 *   RESEND_API_KEY     – Resend API key for outbound email
 */

const REQUIRED_FIELDS = [
  "full_name",
  "email",
  "current_state",
  "desired_state",
  "constraints",
  "timeline",
];

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Parse application/x-www-form-urlencoded body
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid form data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const fields = {
      full_name: formData.get("full_name") || "",
      email: formData.get("email") || "",
      organization: formData.get("organization") || "",
      current_state: formData.get("current_state") || "",
      desired_state: formData.get("desired_state") || "",
      constraints: formData.get("constraints") || "",
      timeline: formData.get("timeline") || "",
      additional_notes: formData.get("additional_notes") || "",
    };

    // Validate required fields
    const missing = REQUIRED_FIELDS.filter((f) => !fields[f].trim());
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Missing required fields: ${missing.join(", ")}`,
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // Write row to Baserow
    const baserowRes = await fetch(
      `https://api.baserow.io/api/database/rows/table/${env.BASEROW_TABLE_ID}/?user_field_names=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${env.BASEROW_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "Full Name": fields.full_name,
          Email: fields.email,
          Organization: fields.organization,
          "Current State": fields.current_state,
          "Desired State": fields.desired_state,
          Constraints: fields.constraints,
          Timeline: fields.timeline,
          "Additional Notes": fields.additional_notes,
        }),
      }
    );

    if (!baserowRes.ok) {
      const errText = await baserowRes.text();
      console.error("Baserow error:", errText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save intake" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Send founder notification via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "intake@codex-labs.io",
        to: env.FOUNDER_EMAIL,
        subject: `New Codex Labs Intake: ${fields.full_name}`,
        html: `
          <h2>New Intake Submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(fields.full_name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(fields.email)}</p>
          <p><strong>Organization:</strong> ${escapeHtml(fields.organization)}</p>
          <hr>
          <p><strong>Current State:</strong><br>${escapeHtml(fields.current_state)}</p>
          <p><strong>Desired State:</strong><br>${escapeHtml(fields.desired_state)}</p>
          <p><strong>Constraints:</strong><br>${escapeHtml(fields.constraints)}</p>
          <p><strong>Timeline:</strong><br>${escapeHtml(fields.timeline)}</p>
          <p><strong>Additional Notes:</strong><br>${escapeHtml(fields.additional_notes)}</p>
        `,
      }),
    });

    if (!emailRes.ok) {
      // Log but don't fail the request — row is already saved
      const errText = await emailRes.text();
      console.error("Resend error:", errText);
    }

    // Redirect browser to success page
    return Response.redirect("/intake-success.html", 302);
  },
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

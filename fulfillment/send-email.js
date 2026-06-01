export async function sendEmail({ to, subject, body }) {
  const payload = {
    body: body || "",
    subject: subject || "",
    to: to || "",
  };

  console.log(JSON.stringify({ level: "info", message: "email_stub_send", payload }));
  return { accepted: true, messageId: null };
}

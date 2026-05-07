import { randomUUID } from "crypto";
import { sendMagicLink } from "./mailer.js";
import { generateLoginToken, verifyLoginToken } from "./tokens.js";

const sessions = new Map();

export async function requestLogin(email) {
  const token = generateLoginToken(email);
  await sendMagicLink(email, token);
  return { ok: true };
}

export async function completeLogin(token) {
  const email = verifyLoginToken(token);
  if (!email) {
    return { ok: false };
  }

  const sessionId = randomUUID();
  sessions.set(sessionId, { email, createdAt: Date.now() });
  return { ok: true, sessionId };
}

export function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    return { ok: false };
  }

  return { ok: true, email: session.email };
}

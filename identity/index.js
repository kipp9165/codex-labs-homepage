import { randomUUID } from "crypto";
import { sendMagicLink } from "./mailer.js";
import { generateLoginToken, verifyLoginToken } from "./tokens.js";

const sessions = new Map();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function pruneSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(sessionId);
    }
  }
}

export async function requestLogin(email) {
  const token = generateLoginToken(email);
  await sendMagicLink(email, token);
  return { ok: true };
}

export async function completeLogin(token) {
  pruneSessions();
  const email = verifyLoginToken(token);
  if (!email) {
    return { ok: false };
  }

  const sessionId = randomUUID();
  sessions.set(sessionId, { email, createdAt: Date.now() });
  return { ok: true, sessionId };
}

export function getSession(sessionId) {
  pruneSessions();
  const session = sessions.get(sessionId);
  if (!session) {
    return { ok: false };
  }

  return { ok: true, email: session.email };
}

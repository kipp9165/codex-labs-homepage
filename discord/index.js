import { readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { getUserEntitlements } from "../access/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TIMEOUT = 10000;

export async function syncDiscordRoles({ email }) {
  try {
    const roleMap = JSON.parse(await readFile(join(__dirname, "roles.json"), "utf8"));
    const access = await getUserEntitlements(email);
    if (!access.ok) {
      console.error("discord_sync_access_error", access.error);
      return;
    }
    const roleIds = access.entitlements.flatMap((e) => (roleMap[e] ? [roleMap[e]] : []));
    const guildId = process.env.DISCORD_GUILD_ID;
    const userId = process.env.DISCORD_USER_ID_OVERRIDE;
    if (!guildId || !userId) {
      console.error("discord_sync_missing_env", { guildId: !!guildId, userId: !!userId });
      return;
    }
    for (const roleId of roleIds) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT);
      try {
        const res = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              "Content-Length": "0",
            },
            signal: controller.signal,
          }
        );
        clearTimeout(timer);
        if (!res.ok) {
          const body = await res.text();
          console.error("discord_role_add_failed", { roleId, status: res.status, body });
        }
      } catch (e) {
        clearTimeout(timer);
        console.error("discord_role_request_error", { roleId, error: e.message });
      }
    }
  } catch (e) {
    console.error("discord_sync_error", e.message);
  }
}

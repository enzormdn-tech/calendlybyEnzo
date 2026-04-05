import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { and, eq, gt, lte } from "drizzle-orm";

interface ReminderBooking {
  name: string;
  email: string;
  startTime: string;
  endTime: string;
}

/**
 * Format booking date/time for reminder email display.
 */
function formatForEmail(isoString: string): { date: string; time: string } {
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
 * Build the HTML for the reminder email.
 */
function buildReminderHTML(booking: ReminderBooking): string {
  const { date, time } = formatForEmail(booking.startTime);
  const firstName = booking.name.split(" ")[0];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel : votre appel decouverte est demain</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafaf8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1c1c1c; line-height: 1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafaf8;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e8e5e0;">

          <!-- Header -->
          <tr>
            <td style="padding: 36px 32px 24px; text-align: center;">
              <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 400; color: #1c1c1c; letter-spacing: -0.02em;">
                Rappel : ton appel est demain\u00a0!
              </h1>
              <p style="margin: 0; font-size: 14px; color: #6b6b6b; font-weight: 300;">
                Mini-Coaching avec Enzo Remidene
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: none; border-top: 1px solid #e8e5e0; margin: 0;">
            </td>
          </tr>

          <!-- Booking details -->
          <tr>
            <td style="padding: 24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 12px; font-weight: 400; color: #6b6b6b; text-transform: uppercase; letter-spacing: 0.08em;">Date</span><br>
                    <span style="font-size: 16px; font-weight: 400; color: #1c1c1c;">${date}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 12px; font-weight: 400; color: #6b6b6b; text-transform: uppercase; letter-spacing: 0.08em;">Heure</span><br>
                    <span style="font-size: 16px; font-weight: 400; color: #1c1c1c;">${time}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 12px; font-weight: 400; color: #6b6b6b; text-transform: uppercase; letter-spacing: 0.08em;">Duree</span><br>
                    <span style="font-size: 16px; font-weight: 400; color: #1c1c1c;">30 minutes</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: none; border-top: 1px solid #e8e5e0; margin: 0;">
            </td>
          </tr>

          <!-- Reminder tips -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 12px; font-size: 15px; font-weight: 400; color: #1c1c1c; letter-spacing: -0.01em;">
                Petit rappel
              </h2>
              <ul style="margin: 0; padding: 0 0 0 18px; font-size: 14px; font-weight: 300; color: #3a3a3a;">
                <li style="padding: 4px 0;">Installe-toi dans un endroit calme</li>
                <li style="padding: 4px 0;">Prepare 1 ou 2 questions que tu aimerais explorer</li>
                <li style="padding: 4px 0;">Pas besoin de camera — un appel audio suffit</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 36px; text-align: center;">
              <p style="margin: 0; font-size: 14px; font-weight: 300; color: #6b6b6b;">
                A demain ${firstName}\u00a0!
              </p>
              <p style="margin: 8px 0 0; font-size: 13px; font-weight: 300; color: #9a9a9a;">
                Enzo Remidene — Coach
              </p>
            </td>
          </tr>

        </table>

        <!-- Sub-footer -->
        <p style="margin: 24px 0 0; font-size: 11px; color: #9a9a9a; font-weight: 300; text-align: center;">
          Tu recois cet email car tu as reserve un appel decouverte.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send a reminder email via Brevo SMTP API.
 * Never throws — all errors are caught and logged.
 */
async function sendReminderEmail(booking: ReminderBooking): Promise<boolean> {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.warn("[Reminder] Missing BREVO_API_KEY — skipping reminder email");
      return false;
    }

    const htmlContent = buildReminderHTML(booking);
    const { date, time } = formatForEmail(booking.startTime);

    const payload = {
      sender: {
        name: "Mini-Coaching Remidene Enzo",
        email: "contact@remidene-enzo.com",
      },
      to: [
        {
          name: booking.name,
          email: booking.email,
        },
      ],
      subject: `Rappel — Appel decouverte demain a ${time} (${date})`,
      htmlContent,
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[Reminder] Brevo API error ${response.status}: ${body}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Reminder] Failed to send reminder email:", error);
    return false;
  }
}

/**
 * GET /api/cron/reminders
 *
 * Vercel Cron triggers via GET.
 * Finds confirmed bookings within the next 24 hours that haven't been reminded,
 * sends reminder emails, and marks them as reminded.
 */
export async function GET(request: NextRequest) {
  // Verify CRON_SECRET for security
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find bookings starting within next 24h, not yet reminded, confirmed
    const pendingReminders = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          eq(bookings.reminded, false),
          gt(bookings.startTime, now.toISOString()),
          lte(bookings.startTime, in24Hours.toISOString())
        )
      );

    let sent = 0;
    let failed = 0;

    for (const booking of pendingReminders) {
      const success = await sendReminderEmail({
        name: booking.prospectName,
        email: booking.prospectEmail,
        startTime: booking.startTime,
        endTime: booking.endTime,
      });

      if (success) {
        await db
          .update(bookings)
          .set({ reminded: true })
          .where(eq(bookings.id, booking.id));
        sent++;
      } else {
        failed++;
      }
    }

    console.log(
      `[Cron/Reminders] Processed ${pendingReminders.length} bookings: ${sent} sent, ${failed} failed`
    );

    return NextResponse.json({
      processed: pendingReminders.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error("[Cron/Reminders] Error:", error);
    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 }
    );
  }
}

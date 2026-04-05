/**
 * Confirmation email via Brevo SMTP API.
 * Fire-and-forget: errors are logged but never thrown.
 */

import { generateICS } from "./ics";

interface EmailBooking {
  name: string;
  email: string;
  startTime: string;
  endTime: string;
}

/**
 * Format booking date/time for email display.
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
 * Build the HTML email content.
 * Inline CSS only (email clients don't support external stylesheets).
 */
function buildEmailHTML(booking: EmailBooking): string {
  const { date, time } = formatForEmail(booking.startTime);
  const firstName = booking.name.split(" ")[0];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de votre appel d\u00e9couverte</title>
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
                Votre appel d\u00e9couverte est confirm\u00e9\u00a0!
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
                    <span style="font-size: 12px; font-weight: 400; color: #6b6b6b; text-transform: uppercase; letter-spacing: 0.08em;">Dur\u00e9e</span><br>
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

          <!-- What to expect -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 12px; font-size: 15px; font-weight: 400; color: #1c1c1c; letter-spacing: -0.01em;">
                Comment te pr\u00e9parer
              </h2>
              <ul style="margin: 0; padding: 0 0 0 18px; font-size: 14px; font-weight: 300; color: #3a3a3a;">
                <li style="padding: 4px 0;">Installe-toi dans un endroit calme</li>
                <li style="padding: 4px 0;">Pr\u00e9pare 1 ou 2 questions que tu aimerais explorer</li>
                <li style="padding: 4px 0;">Pas besoin de cam\u00e9ra \u2014 un appel audio suffit</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 36px; text-align: center;">
              <p style="margin: 0; font-size: 14px; font-weight: 300; color: #6b6b6b;">
                \u00c0 tr\u00e8s vite ${firstName}\u00a0!
              </p>
              <p style="margin: 8px 0 0; font-size: 13px; font-weight: 300; color: #9a9a9a;">
                Enzo Remidene \u2014 Coach
              </p>
            </td>
          </tr>

        </table>

        <!-- Sub-footer -->
        <p style="margin: 24px 0 0; font-size: 11px; color: #9a9a9a; font-weight: 300; text-align: center;">
          Tu re\u00e7ois cet email suite \u00e0 ta r\u00e9servation d'un appel d\u00e9couverte.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send a confirmation email to the prospect via Brevo SMTP API.
 * Includes .ics calendar attachment.
 * Never throws — all errors are caught and logged.
 */
export async function sendConfirmationEmail(booking: EmailBooking): Promise<void> {
  try {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      console.warn("[Email] Missing BREVO_API_KEY — skipping confirmation email");
      return;
    }

    const icsContent = generateICS(booking);
    const icsBase64 = Buffer.from(icsContent).toString("base64");
    const htmlContent = buildEmailHTML(booking);
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
      subject: `Appel d\u00e9couverte confirm\u00e9 \u2014 ${date} \u00e0 ${time}`,
      htmlContent,
      attachment: [
        {
          content: icsBase64,
          name: "appel-decouverte.ics",
        },
      ],
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
      console.error(`[Email] Brevo API error ${response.status}: ${body}`);
    }
  } catch (error) {
    console.error("[Email] Failed to send confirmation email:", error);
  }
}

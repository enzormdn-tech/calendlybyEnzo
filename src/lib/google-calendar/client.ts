import { google } from "googleapis";

/**
 * Create an authenticated Google Calendar client using OAuth2 refresh token.
 *
 * Requires environment variables:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REFRESH_TOKEN
 *
 * Token refresh is handled automatically by the googleapis library.
 */
function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google OAuth2 credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN environment variables."
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return oauth2Client;
}

/** Authenticated Google Calendar v3 client (singleton per cold start) */
let calendarClient: ReturnType<typeof google.calendar> | null = null;

export function getCalendarClient() {
  if (!calendarClient) {
    const auth = createOAuth2Client();
    calendarClient = google.calendar({ version: "v3", auth });
  }
  return calendarClient;
}

/** Calendar ID to query — defaults to primary calendar */
export function getCalendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || "primary";
}

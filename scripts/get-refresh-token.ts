/**
 * One-time script to obtain a Google OAuth2 refresh token.
 *
 * Usage:
 *   npx tsx scripts/get-refresh-token.ts
 *
 * Prerequisites:
 *   1. Create a Google Cloud project at https://console.cloud.google.com
 *   2. Enable the Google Calendar API
 *   3. Create OAuth 2.0 credentials (Desktop app type)
 *   4. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file
 *
 * This script will:
 *   1. Open your browser for Google consent
 *   2. Start a local server to receive the callback
 *   3. Exchange the authorization code for tokens
 *   4. Print the refresh token to copy into your .env
 *
 * IMPORTANT: Make sure your Google Cloud project is in "production" publishing
 * status (not "testing") — testing mode tokens expire after 7 days.
 */

import { google } from "googleapis";
import { createServer } from "http";
import { URL } from "url";

const PORT = 3333;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.events",
];

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error(
      "ERROR: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file first.\n" +
        "Then run: npx tsx scripts/get-refresh-token.ts"
    );
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Force consent to always get a refresh token
  });

  console.log("\n--- Google Calendar OAuth Setup ---\n");
  console.log("1. Open this URL in your browser:\n");
  console.log(`   ${authUrl}\n`);
  console.log("2. Sign in with your Google account and grant permissions.");
  console.log("3. You will be redirected back here automatically.\n");
  console.log(`Waiting for callback on http://localhost:${PORT}...\n`);

  // Try to open the browser automatically
  const { exec } = await import("child_process");
  const openCmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  exec(`${openCmd} "${authUrl}"`);

  // Start local server to receive the OAuth callback
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${PORT}`);

    if (url.pathname !== "/callback") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h1>Authorization failed</h1><p>Error: ${error}</p>`);
      console.error(`\nAuthorization failed: ${error}`);
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>No authorization code received</h1>");
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        "<h1>Success!</h1><p>You can close this tab. Check your terminal for the refresh token.</p>"
      );

      console.log("--- SUCCESS ---\n");
      console.log("Add this to your .env file:\n");
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);

      if (tokens.access_token) {
        console.log("(Access token also received — it will auto-refresh, no need to save it.)\n");
      }

      console.log(
        "REMINDER: Make sure your Google Cloud project is in 'production' publishing status.\n" +
          "Testing mode tokens expire after 7 days.\n"
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>Token exchange failed</h1><p>Check your terminal for details.</p>");
      console.error("\nToken exchange failed:", err);
    }

    server.close();
  });

  server.listen(PORT);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

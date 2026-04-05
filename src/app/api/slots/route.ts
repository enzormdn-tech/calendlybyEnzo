import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { getAvailableSlots } from "@/lib/availability/engine";
import { DEFAULT_CONFIG } from "@/lib/availability/config";
import { getFreeBusyPeriods } from "@/lib/google-calendar";

/**
 * GET /api/slots
 *
 * Returns available booking slots for the next 2 weeks.
 * Combines Enzo's availability config with real Google Calendar busy times.
 */
export async function GET() {
  try {
    const now = new Date();
    const rangeEnd = addDays(now, DEFAULT_CONFIG.maxFutureDays);

    // Fetch real busy periods from Google Calendar
    const busyPeriods = await getFreeBusyPeriods(now, rangeEnd);

    // Compute available slots using the pure availability engine
    const slots = getAvailableSlots(DEFAULT_CONFIG, busyPeriods, now);

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("[GET /api/slots] Google Calendar error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    // Don't leak raw Google API errors to the client
    if (message.includes("credentials") || message.includes("OAuth")) {
      return NextResponse.json(
        { error: "Calendar service is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch available slots. Please try again later." },
      { status: 500 }
    );
  }
}

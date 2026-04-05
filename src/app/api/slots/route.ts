import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { getAvailableSlots } from "@/lib/availability/engine";
import { DEFAULT_CONFIG } from "@/lib/availability/config";
import { getFreeBusyPeriods } from "@/lib/google-calendar";
import { db } from "@/db";
import { availabilityWindows } from "@/db/schema";
import type { AvailabilityConfig } from "@/lib/availability/types";

/**
 * Build an AvailabilityConfig from DB windows, falling back to DEFAULT_CONFIG
 * if no windows are configured in the database.
 */
async function getConfig(): Promise<AvailabilityConfig> {
  const dbWindows = await db.select().from(availabilityWindows);

  if (dbWindows.length === 0) {
    return DEFAULT_CONFIG;
  }

  return {
    ...DEFAULT_CONFIG,
    windows: dbWindows.map((w) => ({
      dayOfWeek: w.dayOfWeek,
      startTime: w.startTime,
      endTime: w.endTime,
    })),
  };
}

/**
 * GET /api/slots
 *
 * Returns available booking slots for the next 2 weeks.
 * Combines Enzo's availability config (from DB or defaults) with real Google Calendar busy times.
 */
export async function GET() {
  try {
    const config = await getConfig();
    const now = new Date();
    const rangeEnd = addDays(now, config.maxFutureDays);

    // Fetch real busy periods from Google Calendar
    const busyPeriods = await getFreeBusyPeriods(now, rangeEnd);

    // Compute available slots using the pure availability engine
    const slots = getAvailableSlots(config, busyPeriods, now);

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("[GET /api/slots] Error:", error);

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

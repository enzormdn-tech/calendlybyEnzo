import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { asc, desc, gt, lte } from "drizzle-orm";

/**
 * GET /api/bookings
 *
 * Returns upcoming and past bookings. Protected by CRON_SECRET (shared with Enzo OS).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date().toISOString();

    const upcoming = await db
      .select()
      .from(bookings)
      .where(gt(bookings.startTime, now))
      .orderBy(asc(bookings.startTime));

    const past = await db
      .select()
      .from(bookings)
      .where(lte(bookings.startTime, now))
      .orderBy(desc(bookings.startTime));

    return NextResponse.json({ upcoming, past });
  } catch (error) {
    console.error("[GET /api/bookings] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

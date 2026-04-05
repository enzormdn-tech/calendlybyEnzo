import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { getFreeBusyPeriods, createBookingEvent } from "@/lib/google-calendar";
import { db } from "@/db";
import { bookings } from "@/db/schema";

/** Request body schema for booking a slot */
const bookingRequestSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  email: z.email("Invalid email address"),
  startTime: z.iso.datetime({ message: "startTime must be a valid ISO 8601 datetime" }),
  endTime: z.iso.datetime({ message: "endTime must be a valid ISO 8601 datetime" }),
});

/**
 * POST /api/book
 *
 * Create a booking: validates input, re-checks Google Calendar for race condition
 * prevention, creates the calendar event, and stores the booking in Turso.
 */
export async function POST(request: Request) {
  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: z.prettifyError(parsed.error) },
      { status: 400 }
    );
  }

  const { name, email, startTime, endTime } = parsed.data;

  // Validate that endTime is after startTime
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end <= start) {
    return NextResponse.json(
      { error: "endTime must be after startTime" },
      { status: 400 }
    );
  }

  try {
    // Race condition guard: re-check Google Calendar FreeBusy for the exact slot
    const busyPeriods = await getFreeBusyPeriods(start, end);

    if (busyPeriods.length > 0) {
      return NextResponse.json(
        {
          error: "This slot is no longer available. Please choose another time.",
        },
        { status: 409 }
      );
    }

    // Slot is free — create the Google Calendar event
    const { eventId, htmlLink } = await createBookingEvent(
      { name, email },
      startTime,
      endTime
    );

    // Store booking in Turso database
    await db.insert(bookings).values({
      prospectName: name,
      prospectEmail: email,
      startTime,
      endTime,
      status: "confirmed",
    });

    return NextResponse.json(
      {
        success: true,
        booking: {
          name,
          email,
          startTime,
          endTime,
          eventId,
          htmlLink,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/book] Error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    if (message.includes("credentials") || message.includes("OAuth")) {
      return NextResponse.json(
        { error: "Calendar service is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create booking. Please try again later." },
      { status: 500 }
    );
  }
}

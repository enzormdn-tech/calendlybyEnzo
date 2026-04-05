import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/db";
import { availabilityWindows } from "@/db/schema";

const addWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm requis"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm requis"),
});

/**
 * GET /api/availability
 * List all availability windows.
 */
export async function GET() {
  try {
    const windows = await db.select().from(availabilityWindows);
    return NextResponse.json({ windows });
  } catch (error) {
    console.error("[GET /api/availability] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability windows" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/availability
 * Add a new availability window.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = addWindowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: z.prettifyError(parsed.error) },
      { status: 400 }
    );
  }

  const { dayOfWeek, startTime, endTime } = parsed.data;

  // Validate that endTime is after startTime
  if (endTime <= startTime) {
    return NextResponse.json(
      { error: "L'heure de fin doit etre apres l'heure de debut" },
      { status: 400 }
    );
  }

  try {
    await db.insert(availabilityWindows).values({ dayOfWeek, startTime, endTime });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/availability] Error:", error);
    return NextResponse.json(
      { error: "Failed to add availability window" },
      { status: 500 }
    );
  }
}

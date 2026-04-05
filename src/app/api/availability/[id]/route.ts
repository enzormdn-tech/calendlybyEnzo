import { NextResponse } from "next/server";
import { db } from "@/db";
import { availabilityWindows } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * DELETE /api/availability/[id]
 * Delete an availability window by ID.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await db.delete(availabilityWindows).where(eq(availabilityWindows.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /api/availability/${id}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to delete availability window" },
      { status: 500 }
    );
  }
}

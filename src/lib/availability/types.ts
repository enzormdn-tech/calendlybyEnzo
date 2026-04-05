import { z } from "zod/v4";

// --- Zod Schemas ---

export const availabilityWindowSchema = z.object({
  /** Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
  dayOfWeek: z.number().int().min(0).max(6),
  /** Start time in HH:mm format (Europe/Paris local time) */
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:mm format"),
  /** End time in HH:mm format (Europe/Paris local time) */
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:mm format"),
});

export const busyPeriodSchema = z.object({
  /** ISO 8601 start datetime */
  start: z.iso.datetime(),
  /** ISO 8601 end datetime */
  end: z.iso.datetime(),
});

export const slotSchema = z.object({
  /** ISO 8601 start datetime */
  start: z.string(),
  /** ISO 8601 end datetime */
  end: z.string(),
});

export const availabilityConfigSchema = z.object({
  /** Weekly availability windows */
  windows: z.array(availabilityWindowSchema),
  /** Slot duration in minutes */
  slotDuration: z.number().int().positive().default(30),
  /** Buffer time between slots in minutes */
  bufferMinutes: z.number().int().min(0).default(15),
  /** Minimum notice before a slot can be booked, in hours */
  minNoticeHours: z.number().positive().default(24),
  /** Maximum days in the future for bookable slots */
  maxFutureDays: z.number().int().positive().default(14),
});

// --- TypeScript Types ---

export type AvailabilityWindow = z.infer<typeof availabilityWindowSchema>;
export type BusyPeriod = z.infer<typeof busyPeriodSchema>;
export type Slot = z.infer<typeof slotSchema>;
export type AvailabilityConfig = z.infer<typeof availabilityConfigSchema>;

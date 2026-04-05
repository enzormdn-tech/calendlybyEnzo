import type { AvailabilityConfig } from "./types";

/**
 * Default availability configuration for Enzo.
 *
 * Tuesday (2) and Thursday (4), 14:00-18:00 Europe/Paris.
 * 30-minute slots with 15-minute buffer.
 * Bookable from 24h to 14 days in the future.
 *
 * This will be configurable from the dashboard in Phase 8 (AVAIL-01).
 * For now, hardcoded is fine per ARCHITECTURE.md Anti-Pattern 4.
 */
export const DEFAULT_CONFIG: AvailabilityConfig = {
  windows: [
    { dayOfWeek: 2, startTime: "14:00", endTime: "18:00" }, // Tuesday
    { dayOfWeek: 4, startTime: "14:00", endTime: "18:00" }, // Thursday
  ],
  slotDuration: 30,
  bufferMinutes: 15,
  minNoticeHours: 24,
  maxFutureDays: 14,
};

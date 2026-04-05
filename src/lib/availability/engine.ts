import { addDays, addMinutes, startOfDay, isBefore, isAfter, isEqual } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import type { AvailabilityConfig, BusyPeriod, Slot } from "./types";

const TIMEZONE = "Europe/Paris";

/**
 * Compute available booking slots given availability config and busy periods.
 *
 * Pure function — no side effects, no API calls.
 * All computations are done in Europe/Paris timezone.
 *
 * @param config - Availability configuration (windows, slot duration, buffer, etc.)
 * @param busyPeriods - Array of busy periods (from Google Calendar or other sources)
 * @param now - Current time (injectable for testing). Defaults to Date.now().
 * @returns Sorted array of available slots as ISO 8601 strings
 */
export function getAvailableSlots(
  config: AvailabilityConfig,
  busyPeriods: BusyPeriod[],
  now: Date = new Date()
): Slot[] {
  const { windows, slotDuration, bufferMinutes, minNoticeHours, maxFutureDays } = config;

  // Boundaries in UTC
  const earliestStart = addMinutes(now, minNoticeHours * 60);
  const latestEnd = addDays(now, maxFutureDays);

  // Parse busy periods to Date objects once
  const busy = busyPeriods.map((bp) => ({
    start: new Date(bp.start),
    end: new Date(bp.end),
  }));

  const slots: Slot[] = [];

  // Iterate over each day in the booking window
  for (let dayOffset = 0; dayOffset <= maxFutureDays; dayOffset++) {
    const utcDay = addDays(now, dayOffset);
    // Get the start of this day in Paris timezone
    const parisDay = toZonedTime(utcDay, TIMEZONE);
    const parisStartOfDay = startOfDay(parisDay);

    // Check which availability windows apply to this day of week
    const dayOfWeek = parisStartOfDay.getDay();
    const applicableWindows = windows.filter((w) => w.dayOfWeek === dayOfWeek);

    for (const window of applicableWindows) {
      // Parse window start/end times in Paris timezone
      const [startHour, startMin] = window.startTime.split(":").map(Number);
      const [endHour, endMin] = window.endTime.split(":").map(Number);

      // Build the window boundaries as Paris local times, then convert to UTC
      const windowStartParis = new Date(parisStartOfDay);
      windowStartParis.setHours(startHour, startMin, 0, 0);
      const windowStartUtc = fromZonedTime(windowStartParis, TIMEZONE);

      const windowEndParis = new Date(parisStartOfDay);
      windowEndParis.setHours(endHour, endMin, 0, 0);
      const windowEndUtc = fromZonedTime(windowEndParis, TIMEZONE);

      // Generate candidate slots within this window
      let candidateStart = windowStartUtc;

      while (true) {
        const candidateEnd = addMinutes(candidateStart, slotDuration);

        // Slot must fit within the window
        if (isAfter(candidateEnd, windowEndUtc)) break;

        // Apply min notice filter
        if (isBefore(candidateStart, earliestStart)) {
          candidateStart = addMinutes(candidateEnd, bufferMinutes);
          continue;
        }

        // Apply max future filter
        if (isAfter(candidateStart, latestEnd) || isEqual(candidateStart, latestEnd)) {
          break;
        }

        // Check for overlap with busy periods (including buffer)
        const slotWithBufferStart = addMinutes(candidateStart, -bufferMinutes);
        const slotWithBufferEnd = addMinutes(candidateEnd, bufferMinutes);

        const hasConflict = busy.some(
          (b) =>
            isBefore(b.start, slotWithBufferEnd) && isAfter(b.end, slotWithBufferStart)
        );

        if (!hasConflict) {
          slots.push({
            start: candidateStart.toISOString(),
            end: candidateEnd.toISOString(),
          });
        }

        // Move to next candidate: slot duration + buffer
        candidateStart = addMinutes(candidateEnd, bufferMinutes);
      }
    }
  }

  // Sort by start time (should already be sorted, but ensure it)
  slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return slots;
}

import { describe, it, expect } from "vitest";
import { getAvailableSlots } from "../engine";
import type { AvailabilityConfig, BusyPeriod } from "../types";

// Helper: create a config with sensible defaults
function makeConfig(overrides: Partial<AvailabilityConfig> = {}): AvailabilityConfig {
  return {
    windows: [
      // Tuesday 14:00-18:00 Paris time
      { dayOfWeek: 2, startTime: "14:00", endTime: "18:00" },
      // Thursday 14:00-18:00 Paris time
      { dayOfWeek: 4, startTime: "14:00", endTime: "18:00" },
    ],
    slotDuration: 30,
    bufferMinutes: 15,
    minNoticeHours: 24,
    maxFutureDays: 14,
    ...overrides,
  };
}

// Helper: find next occurrence of a day of week from a given date
function nextDayOfWeek(from: Date, dayOfWeek: number): Date {
  const d = new Date(from);
  const diff = (dayOfWeek - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + (diff === 0 ? 7 : diff));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

describe("getAvailableSlots", () => {
  // Fixed "now" on a Monday so next Tuesday and Thursday are within range
  // 2026-04-06 is a Monday. Use 08:00 UTC (10:00 Paris CEST)
  const now = new Date("2026-04-06T08:00:00Z");

  describe("normal day with free slots", () => {
    it("returns slots for available days within the window", () => {
      const config = makeConfig();
      const slots = getAvailableSlots(config, [], now);

      expect(slots.length).toBeGreaterThan(0);

      // All slots should be on Tuesday (2) or Thursday (4)
      for (const slot of slots) {
        const start = new Date(slot.start);
        // Convert to Paris time to check day of week
        // In April 2026, Paris is UTC+2 (CEST)
        const parisHour = start.getUTCHours() + 2;
        const parisDay = new Date(start);
        if (parisHour >= 24) {
          parisDay.setUTCDate(parisDay.getUTCDate() + 1);
        }
        const dow = parisDay.getUTCDay();
        expect([2, 4]).toContain(dow);
      }
    });

    it("generates correct number of slots for a 4-hour window with 30min slots and 15min buffer", () => {
      // 4 hours = 240 minutes
      // Each slot takes 30min + 15min buffer = 45min (except possibly the last one)
      // 240 / 45 = 5.33 -> 5 slots with buffer, but the last slot doesn't need trailing buffer
      // Actually: 14:00-14:30, 14:45-15:15, 15:30-16:00, 16:15-16:45, 17:00-17:30, 17:45-18:15 (NO, 18:15 > 18:00)
      // So: 14:00, 14:45, 15:30, 16:15, 17:00, 17:45 -> but 17:45+30=18:15 > 18:00, doesn't fit
      // Expected: 5 slots per day (14:00, 14:45, 15:30, 16:15, 17:00) — wait, 17:00+30=17:30 fits
      // 17:30+15=17:45 start, 17:45+30=18:15 > 18:00, so last is 17:00
      // That's 5 slots per applicable day

      const config = makeConfig({
        windows: [{ dayOfWeek: 2, startTime: "14:00", endTime: "18:00" }],
        minNoticeHours: 0, // no min notice to simplify
        maxFutureDays: 7,
      });

      // Use a time just before midnight so next Tuesday is in range
      const monday = new Date("2026-04-06T08:00:00Z");
      const slots = getAvailableSlots(config, [], monday);

      // Should have exactly 5 slots for the one Tuesday in range (April 7)
      const tuesdaySlots = slots.filter((s) => {
        const d = new Date(s.start);
        return d.getUTCDate() === 7; // April 7 is Tuesday
      });

      expect(tuesdaySlots).toHaveLength(5);

      // Verify first slot starts at 14:00 Paris = 12:00 UTC (CEST = UTC+2)
      expect(tuesdaySlots[0].start).toBe("2026-04-07T12:00:00.000Z");
      expect(tuesdaySlots[0].end).toBe("2026-04-07T12:30:00.000Z");

      // Verify second slot starts at 14:45 Paris = 12:45 UTC
      expect(tuesdaySlots[1].start).toBe("2026-04-07T12:45:00.000Z");

      // Verify last slot starts at 17:00 Paris = 15:00 UTC
      expect(tuesdaySlots[4].start).toBe("2026-04-07T15:00:00.000Z");
      expect(tuesdaySlots[4].end).toBe("2026-04-07T15:30:00.000Z");
    });
  });

  describe("busy period filtering", () => {
    it("removes slots that overlap with busy periods", () => {
      const config = makeConfig({
        windows: [{ dayOfWeek: 2, startTime: "14:00", endTime: "18:00" }],
        minNoticeHours: 0,
        maxFutureDays: 7,
      });

      // Busy from 14:30 to 15:30 Paris (12:30-13:30 UTC) on April 7
      const busy: BusyPeriod[] = [
        { start: "2026-04-07T12:30:00Z", end: "2026-04-07T13:30:00Z" },
      ];

      const slots = getAvailableSlots(config, busy, now);
      const tuesdaySlots = slots.filter((s) => new Date(s.start).getUTCDate() === 7);

      // The 14:00 slot (12:00-12:30 UTC) should still be available
      // But 14:45 (12:45-13:15 UTC) overlaps with busy (buffer extends it)
      // And 15:30 (13:30-14:00 UTC) — busy end at 13:30 + buffer 15min = 13:45, slot at 13:30 overlaps buffer
      // So 14:00 should exist, 14:45 and 15:30 might be blocked
      // Let's just verify no slot overlaps with the busy period
      for (const slot of tuesdaySlots) {
        const slotStart = new Date(slot.start).getTime();
        const slotEnd = new Date(slot.end).getTime();
        const busyStart = new Date(busy[0].start).getTime();
        const busyEnd = new Date(busy[0].end).getTime();

        // No overlap: slot ends before busy starts OR slot starts after busy ends
        // (without considering buffer in this basic check)
        const overlaps = slotStart < busyEnd && slotEnd > busyStart;
        expect(overlaps).toBe(false);
      }

      // Should have fewer slots than without busy periods
      const allSlots = getAvailableSlots(config, [], now);
      const allTuesdaySlots = allSlots.filter(
        (s) => new Date(s.start).getUTCDate() === 7
      );
      expect(tuesdaySlots.length).toBeLessThan(allTuesdaySlots.length);
    });

    it("returns zero slots when entire day is busy", () => {
      const config = makeConfig({
        windows: [{ dayOfWeek: 2, startTime: "14:00", endTime: "18:00" }],
        minNoticeHours: 0,
        maxFutureDays: 7,
      });

      // Busy all day on April 7
      const busy: BusyPeriod[] = [
        { start: "2026-04-07T00:00:00Z", end: "2026-04-07T23:59:59Z" },
      ];

      const slots = getAvailableSlots(config, busy, now);
      const tuesdaySlots = slots.filter((s) => new Date(s.start).getUTCDate() === 7);

      expect(tuesdaySlots).toHaveLength(0);
    });
  });

  describe("buffer time enforcement", () => {
    it("prevents slots too close to an existing event", () => {
      const config = makeConfig({
        windows: [{ dayOfWeek: 2, startTime: "14:00", endTime: "18:00" }],
        bufferMinutes: 15,
        minNoticeHours: 0,
        maxFutureDays: 7,
      });

      // Event from 14:30 to 15:00 Paris (12:30-13:00 UTC) on April 7
      // Buffer means no slot should start within 15min before or end within 15min after
      const busy: BusyPeriod[] = [
        { start: "2026-04-07T12:30:00Z", end: "2026-04-07T13:00:00Z" },
      ];

      const slots = getAvailableSlots(config, busy, now);
      const tuesdaySlots = slots.filter((s) => new Date(s.start).getUTCDate() === 7);

      // No slot should be within buffer distance of the busy period
      for (const slot of tuesdaySlots) {
        const slotStart = new Date(slot.start).getTime();
        const slotEnd = new Date(slot.end).getTime();
        const busyStart = new Date(busy[0].start).getTime();
        const busyEnd = new Date(busy[0].end).getTime();
        const bufferMs = 15 * 60 * 1000;

        // Slot end + buffer should not overlap busy start
        // Busy end + buffer should not overlap slot start
        const tooClose =
          slotStart < busyEnd + bufferMs && slotEnd > busyStart - bufferMs;
        expect(tooClose).toBe(false);
      }
    });
  });

  describe("minimum notice enforcement", () => {
    it("excludes slots within the next 24 hours", () => {
      const config = makeConfig({
        windows: [
          { dayOfWeek: 1, startTime: "14:00", endTime: "18:00" }, // Monday
          { dayOfWeek: 2, startTime: "14:00", endTime: "18:00" }, // Tuesday
        ],
        minNoticeHours: 24,
        maxFutureDays: 14,
      });

      // "now" is Monday 2026-04-06 08:00 UTC (10:00 Paris)
      // 24h from now = Tuesday 2026-04-07 08:00 UTC (10:00 Paris)
      // Tuesday slots start at 14:00 Paris = 12:00 UTC — that's > 24h from now, so they should be included
      // Monday slots at 14:00 Paris = 12:00 UTC — that's only 4h from now, excluded

      const slots = getAvailableSlots(config, [], now);

      // No slot should start before 24h from now
      const minTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      for (const slot of slots) {
        expect(new Date(slot.start).getTime()).toBeGreaterThanOrEqual(minTime.getTime());
      }
    });

    it("includes slots exactly at the 24h boundary", () => {
      // "now" at a time such that a slot falls exactly at the 24h mark
      const preciseNow = new Date("2026-04-06T12:00:00Z"); // Tuesday 14:00 Paris is exactly 24h later
      const config = makeConfig({
        windows: [{ dayOfWeek: 2, startTime: "14:00", endTime: "18:00" }],
        minNoticeHours: 24,
        maxFutureDays: 14,
      });

      const slots = getAvailableSlots(config, [], preciseNow);
      // The first Tuesday slot at 14:00 Paris (12:00 UTC Apr 7) is exactly 24h from now
      // It should be included (>= boundary)
      const firstTuesday = slots.find((s) => s.start.includes("2026-04-07"));
      expect(firstTuesday).toBeDefined();
      expect(firstTuesday!.start).toBe("2026-04-07T12:00:00.000Z");
    });
  });

  describe("maximum window enforcement", () => {
    it("excludes slots beyond maxFutureDays", () => {
      const config = makeConfig({
        windows: [{ dayOfWeek: 2, startTime: "14:00", endTime: "18:00" }],
        minNoticeHours: 0,
        maxFutureDays: 7,
      });

      const slots = getAvailableSlots(config, [], now);
      const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      for (const slot of slots) {
        expect(new Date(slot.start).getTime()).toBeLessThan(maxDate.getTime());
      }
    });

    it("does not return slots for a Tuesday beyond 7 days when maxFutureDays=7", () => {
      const config = makeConfig({
        windows: [{ dayOfWeek: 2, startTime: "14:00", endTime: "18:00" }],
        minNoticeHours: 0,
        maxFutureDays: 7,
      });

      // now = Monday April 6. Next Tuesday = April 7 (1 day). Following Tuesday = April 14 (8 days > 7)
      const slots = getAvailableSlots(config, [], now);

      const april14Slots = slots.filter((s) => s.start.includes("2026-04-14"));
      expect(april14Slots).toHaveLength(0);
    });
  });

  describe("DST transition handling", () => {
    it("generates correct slots during spring DST transition (CET -> CEST)", () => {
      // In 2026, France changes clocks on March 29 (last Sunday of March)
      // CET (UTC+1) -> CEST (UTC+2) at 2:00 AM local time
      // Use a Monday before the transition
      const preDstNow = new Date("2026-03-27T08:00:00Z"); // Friday before DST

      const config = makeConfig({
        windows: [
          { dayOfWeek: 2, startTime: "14:00", endTime: "18:00" }, // Tuesday March 31
        ],
        minNoticeHours: 0,
        maxFutureDays: 14,
      });

      const slots = getAvailableSlots(config, [], preDstNow);

      // Find slots on March 31 (Tuesday after DST change)
      // After DST: Paris is UTC+2, so 14:00 Paris = 12:00 UTC
      const march31Slots = slots.filter((s) => s.start.includes("2026-03-31"));

      expect(march31Slots.length).toBeGreaterThan(0);
      // First slot should be at 12:00 UTC (14:00 CEST)
      expect(march31Slots[0].start).toBe("2026-03-31T12:00:00.000Z");
    });

    it("generates correct slots before DST transition (still CET)", () => {
      // March 27 is Friday, CET still active (UTC+1)
      // Check Tuesday March 24 slots if we go back further
      const preDstNow = new Date("2026-03-23T08:00:00Z"); // Monday before DST

      const config = makeConfig({
        windows: [
          { dayOfWeek: 2, startTime: "14:00", endTime: "18:00" }, // Tuesday March 24
        ],
        minNoticeHours: 0,
        maxFutureDays: 14,
      });

      const slots = getAvailableSlots(config, [], preDstNow);

      // Before DST: Paris is UTC+1, so 14:00 Paris = 13:00 UTC
      const march24Slots = slots.filter((s) => s.start.includes("2026-03-24"));

      expect(march24Slots.length).toBeGreaterThan(0);
      expect(march24Slots[0].start).toBe("2026-03-24T13:00:00.000Z");
    });
  });

  describe("edge cases", () => {
    it("returns empty array when no windows are configured", () => {
      const config = makeConfig({ windows: [] });
      const slots = getAvailableSlots(config, [], now);
      expect(slots).toHaveLength(0);
    });

    it("returns sorted slots across multiple days", () => {
      const config = makeConfig({
        minNoticeHours: 0,
        maxFutureDays: 14,
      });

      const slots = getAvailableSlots(config, [], now);

      for (let i = 1; i < slots.length; i++) {
        expect(new Date(slots[i].start).getTime()).toBeGreaterThanOrEqual(
          new Date(slots[i - 1].start).getTime()
        );
      }
    });

    it("handles multiple busy periods on the same day", () => {
      const config = makeConfig({
        windows: [{ dayOfWeek: 2, startTime: "14:00", endTime: "18:00" }],
        minNoticeHours: 0,
        maxFutureDays: 7,
      });

      // Two separate busy blocks on April 7
      const busy: BusyPeriod[] = [
        { start: "2026-04-07T12:00:00Z", end: "2026-04-07T12:45:00Z" }, // 14:00-14:45 Paris
        { start: "2026-04-07T14:30:00Z", end: "2026-04-07T15:30:00Z" }, // 16:30-17:30 Paris
      ];

      const slots = getAvailableSlots(config, busy, now);
      const tuesdaySlots = slots.filter((s) => new Date(s.start).getUTCDate() === 7);

      // Should have some slots but not all
      expect(tuesdaySlots.length).toBeGreaterThan(0);
      expect(tuesdaySlots.length).toBeLessThan(5); // Less than full day's 5 slots
    });
  });
});

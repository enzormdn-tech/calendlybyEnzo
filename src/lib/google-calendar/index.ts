import { getCalendarClient, getCalendarId } from "./client";
import type { BusyPeriod } from "../availability/types";

export { getCalendarClient, getCalendarId } from "./client";

/**
 * Query Google Calendar FreeBusy API for busy periods in a date range.
 *
 * Uses freebusy.query (not events.list) to avoid leaking private event details.
 * Returns an array of BusyPeriod objects with ISO 8601 start/end strings.
 */
export async function getFreeBusyPeriods(
  startDate: Date,
  endDate: Date
): Promise<BusyPeriod[]> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const calendars = response.data.calendars;
  if (!calendars) {
    return [];
  }

  const calendarData = calendars[calendarId];
  if (!calendarData?.busy) {
    return [];
  }

  return calendarData.busy
    .filter(
      (period): period is { start: string; end: string } =>
        typeof period.start === "string" && typeof period.end === "string"
    )
    .map((period) => ({
      start: period.start,
      end: period.end,
    }));
}

/**
 * Create a booking event in Google Calendar with prospect details.
 *
 * The event summary and description include the prospect's name and email
 * so Enzo has full context when viewing his calendar.
 */
export async function createBookingEvent(
  prospect: { name: string; email: string },
  startTime: string,
  endTime: string
): Promise<{ eventId: string; htmlLink: string }> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `Discovery Call - ${prospect.name}`,
      description: [
        `Prospect: ${prospect.name}`,
        `Email: ${prospect.email}`,
        "",
        "30-minute discovery coaching call booked via CalendlyByEnzo.",
      ].join("\n"),
      start: {
        dateTime: startTime,
        timeZone: "Europe/Paris",
      },
      end: {
        dateTime: endTime,
        timeZone: "Europe/Paris",
      },
      attendees: [{ email: prospect.email, displayName: prospect.name }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 30 },
          { method: "popup", minutes: 10 },
        ],
      },
    },
  });

  return {
    eventId: response.data.id || "",
    htmlLink: response.data.htmlLink || "",
  };
}

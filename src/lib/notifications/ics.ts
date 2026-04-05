/**
 * iCalendar (.ics) file generation for booking confirmations.
 */

interface ICSBooking {
  startTime: string;
  endTime: string;
  name: string;
}

/**
 * Format a Date to iCalendar datetime string (YYYYMMDDTHHmmss).
 * Uses UTC format with Z suffix.
 */
function toICSDateTime(isoString: string): string {
  const dt = new Date(isoString);
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  const hours = String(dt.getUTCHours()).padStart(2, "0");
  const minutes = String(dt.getUTCMinutes()).padStart(2, "0");
  const seconds = String(dt.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate a valid iCalendar (.ics) file content for a booking.
 * Returns the raw .ics string.
 */
export function generateICS(booking: ICSBooking): string {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@calendly-enzo`;
  const now = toICSDateTime(new Date().toISOString());
  const dtStart = toICSDateTime(booking.startTime);
  const dtEnd = toICSDateTime(booking.endTime);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CalendlyByEnzo//Booking//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Appel D\u00e9couverte - Mini Coaching`,
    `DESCRIPTION:Appel d\u00e9couverte avec ${booking.name}. Dur\u00e9e: 30 minutes.`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

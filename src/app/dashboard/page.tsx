import { db } from "@/db";
import { bookings } from "@/db/schema";
import { desc, asc, gt, lte } from "drizzle-orm";

const DAY_NAMES = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

function formatDate(isoString: string): string {
  const dt = new Date(isoString);
  const day = DAY_NAMES[dt.getDay()];
  return `${day} ${dt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  })}`;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #444",
  color: "#888",
  fontWeight: 400,
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #2a2a2a",
  fontWeight: 300,
};

function BookingTable({
  rows,
}: {
  rows: {
    id: number;
    prospectName: string;
    prospectEmail: string;
    startTime: string;
    endTime: string;
    status: string;
  }[];
}) {
  if (rows.length === 0) {
    return (
      <p style={{ color: "#666", fontWeight: 300, fontSize: "14px" }}>
        Aucun rendez-vous.
      </p>
    );
  }

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>Nom</th>
          <th style={thStyle}>Email</th>
          <th style={thStyle}>Date</th>
          <th style={thStyle}>Heure</th>
          <th style={thStyle}>Statut</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((b) => (
          <tr key={b.id}>
            <td style={tdStyle}>{b.prospectName}</td>
            <td style={tdStyle}>{b.prospectEmail}</td>
            <td style={tdStyle}>{formatDate(b.startTime)}</td>
            <td style={tdStyle}>{formatTime(b.startTime)}</td>
            <td style={tdStyle}>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  backgroundColor:
                    b.status === "confirmed" ? "#1a3a2a" : "#3a1a1a",
                  color: b.status === "confirmed" ? "#4ade80" : "#f87171",
                }}
              >
                {b.status === "confirmed" ? "Confirme" : "Annule"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  return (
    <div>
      <section style={{ marginBottom: "3rem" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 400,
            marginBottom: "1rem",
            letterSpacing: "-0.01em",
          }}
        >
          Prochains rendez-vous
        </h2>
        <BookingTable rows={upcoming} />
      </section>

      <section>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 400,
            marginBottom: "1rem",
            letterSpacing: "-0.01em",
          }}
        >
          Rendez-vous passes
        </h2>
        <BookingTable rows={past} />
      </section>
    </div>
  );
}

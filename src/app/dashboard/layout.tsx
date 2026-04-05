import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard — CalendlyByEnzo",
  robots: "noindex, nofollow",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#1c1c1c",
        color: "#fafaf8",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2rem",
          padding: "1rem 2rem",
          borderBottom: "1px solid #333",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 400,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#888",
          }}
        >
          Dashboard
        </span>
        <Link
          href="/dashboard"
          style={{
            color: "#fafaf8",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 300,
          }}
        >
          Rendez-vous
        </Link>
        <Link
          href="/dashboard/availability"
          style={{
            color: "#fafaf8",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 300,
          }}
        >
          Disponibilites
        </Link>
      </nav>
      <main style={{ padding: "2rem" }}>{children}</main>
    </div>
  );
}

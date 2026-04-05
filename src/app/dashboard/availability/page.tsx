"use client";

import { useEffect, useState } from "react";

interface AvailabilityWindow {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const DAY_LABELS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export default function AvailabilityPage() {
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday default
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("18:00");
  const [error, setError] = useState("");

  async function fetchWindows() {
    try {
      const res = await fetch("/api/availability");
      const data = await res.json();
      setWindows(data.windows ?? []);
    } catch {
      console.error("[Availability] Failed to fetch windows");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWindows();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek, startTime, endTime }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'ajout");
        return;
      }

      await fetchWindows();
      // Reset form
      setStartTime("14:00");
      setEndTime("18:00");
    } catch {
      setError("Erreur reseau");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/availability/${id}`, { method: "DELETE" });
      if (res.ok) {
        setWindows((prev) => prev.filter((w) => w.id !== id));
      }
    } catch {
      console.error("[Availability] Failed to delete window");
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "8px 12px",
    backgroundColor: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "6px",
    color: "#fafaf8",
    fontSize: "14px",
    fontFamily: "inherit",
  };

  const btnStyle: React.CSSProperties = {
    padding: "8px 16px",
    backgroundColor: "#fafaf8",
    color: "#1c1c1c",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 400,
    cursor: "pointer",
  };

  return (
    <div>
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 400,
          marginBottom: "1.5rem",
          letterSpacing: "-0.01em",
        }}
      >
        Creneaux de disponibilite
      </h2>

      {/* Current windows */}
      {loading ? (
        <p style={{ color: "#666", fontSize: "14px" }}>Chargement...</p>
      ) : windows.length === 0 ? (
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "2rem" }}>
          Aucun creneau configure. Les creneaux par defaut seront utilises (mardi et jeudi, 14h-18h).
        </p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
            marginBottom: "2rem",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderBottom: "1px solid #444",
                  color: "#888",
                  fontWeight: 400,
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Jour
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderBottom: "1px solid #444",
                  color: "#888",
                  fontWeight: 400,
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Debut
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderBottom: "1px solid #444",
                  color: "#888",
                  fontWeight: 400,
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Fin
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "10px 12px",
                  borderBottom: "1px solid #444",
                  color: "#888",
                  fontWeight: 400,
                  fontSize: "12px",
                }}
              >
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody>
            {windows.map((w) => (
              <tr key={w.id}>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #2a2a2a",
                    fontWeight: 300,
                  }}
                >
                  {DAY_LABELS[w.dayOfWeek]}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #2a2a2a",
                    fontWeight: 300,
                  }}
                >
                  {w.startTime}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #2a2a2a",
                    fontWeight: 300,
                  }}
                >
                  {w.endTime}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #2a2a2a",
                    textAlign: "right",
                  }}
                >
                  <button
                    onClick={() => handleDelete(w.id)}
                    style={{
                      padding: "4px 10px",
                      backgroundColor: "transparent",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      color: "#f87171",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add form */}
      <div
        style={{
          padding: "1.5rem",
          backgroundColor: "#242424",
          borderRadius: "8px",
          border: "1px solid #333",
        }}
      >
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 400,
            marginBottom: "1rem",
            color: "#ccc",
          }}
        >
          Ajouter un creneau
        </h3>

        <form
          onSubmit={handleAdd}
          style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#888",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Jour
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              style={inputStyle}
            >
              {DAY_LABELS.map((label, i) => (
                <option key={i} value={i}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#888",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Debut
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#888",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Fin
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <button type="submit" disabled={saving} style={btnStyle}>
            {saving ? "..." : "Ajouter"}
          </button>
        </form>

        {error && (
          <p style={{ color: "#f87171", fontSize: "13px", marginTop: "0.5rem" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Set the cookie client-side and redirect
    document.cookie = `dashboard_auth=${encodeURIComponent(password)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;

    // Try accessing dashboard to verify password
    const res = await fetch("/dashboard", { redirect: "manual" });

    if (res.status === 200 || res.type === "opaqueredirect") {
      router.push("/dashboard");
    } else {
      // Clear invalid cookie
      document.cookie = "dashboard_auth=; path=/; max-age=0";
      setError("Mot de passe incorrect");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1c1c1c",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "360px",
          padding: "2rem",
        }}
      >
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 400,
            color: "#fafaf8",
            marginBottom: "1.5rem",
            textAlign: "center",
            letterSpacing: "-0.01em",
          }}
        >
          Dashboard
        </h1>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          required
          autoFocus
          style={{
            width: "100%",
            padding: "10px 14px",
            backgroundColor: "#2a2a2a",
            border: "1px solid #444",
            borderRadius: "8px",
            color: "#fafaf8",
            fontSize: "14px",
            fontFamily: "inherit",
            boxSizing: "border-box",
            marginBottom: "1rem",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 16px",
            backgroundColor: "#fafaf8",
            color: "#1c1c1c",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 400,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "..." : "Connexion"}
        </button>

        {error && (
          <p
            style={{
              color: "#f87171",
              fontSize: "13px",
              textAlign: "center",
              marginTop: "1rem",
            }}
          >
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

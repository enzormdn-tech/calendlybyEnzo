"use client";

import { useState } from "react";
import { z } from "zod/v4";

const bookingFormSchema = z.object({
  name: z.string().min(1, "Le prénom est requis"),
  email: z.email("Adresse email invalide"),
});

interface BookingFormProps {
  selectedSlot: { start: string; end: string };
  onBack: () => void;
  onSuccess: (booking: { name: string; startTime: string; endTime: string }) => void;
}

/** Format an ISO datetime to French readable: "Mardi 8 avril a 14h30" */
function formatSlotSummary(isoDatetime: string): string {
  const date = new Date(isoDatetime);
  const weekdays = [
    "Dimanche", "Lundi", "Mardi", "Mercredi",
    "Jeudi", "Vendredi", "Samedi",
  ];
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];
  const weekday = weekdays[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${weekday} ${day} ${month} à ${hours}h${minutes}`;
}

export default function BookingForm({
  selectedSlot,
  onBack,
  onSuccess,
}: BookingFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setServerError(null);
    setIsConflict(false);

    // Client-side validation
    const result = bookingFormSchema.safeParse({ name, email });
    if (!result.success) {
      const fieldErrors: { name?: string; email?: string } = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as "name" | "email";
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.data.name,
          email: result.data.email,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
        }),
      });

      if (res.status === 409) {
        setIsConflict(true);
        setServerError(
          "Ce créneau vient d'être réservé. Choisis-en un autre."
        );
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        setServerError(
          "Une erreur est survenue. Réessaie dans quelques instants."
        );
        setSubmitting(false);
        return;
      }

      // Success
      onSuccess({
        name: result.data.name,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
      });
    } catch {
      setServerError(
        "Impossible de contacter le serveur. Vérifie ta connexion."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Slot summary */}
      <div className="border-t border-border pt-5">
        <p className="text-[10px] tracking-[0.08em] uppercase text-sub mb-3">
          Ton créneau
        </p>
        <p className="text-[15px] text-text leading-[1.4]">
          {formatSlotSummary(selectedSlot.start)}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="booking-name"
            className="text-[12px] tracking-[0.04em] text-sub"
          >
            Prénom
          </label>
          <input
            id="booking-name"
            type="text"
            required
            disabled={submitting}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ton prénom"
            className="w-full px-4 py-3 rounded-lg border border-border bg-bg text-text text-[15px]
                       placeholder:text-sub/50 outline-none
                       focus:border-text/30 transition-colors duration-200
                       disabled:opacity-50"
          />
          {errors.name && (
            <p className="text-[12px] text-level-red">{errors.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="booking-email"
            className="text-[12px] tracking-[0.04em] text-sub"
          >
            Email
          </label>
          <input
            id="booking-email"
            type="email"
            required
            disabled={submitting}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            className="w-full px-4 py-3 rounded-lg border border-border bg-bg text-text text-[15px]
                       placeholder:text-sub/50 outline-none
                       focus:border-text/30 transition-colors duration-200
                       disabled:opacity-50"
          />
          {errors.email && (
            <p className="text-[12px] text-level-red">{errors.email}</p>
          )}
        </div>

        {/* Server error */}
        {serverError && (
          <div className="flex flex-col items-center gap-3 py-3 animate-fade-in">
            <p className="text-[13px] text-level-red text-center tracking-[0.01em]">
              {serverError}
            </p>
            {isConflict ? (
              <button
                type="button"
                onClick={onBack}
                className="text-[13px] text-text underline underline-offset-4 cursor-pointer"
              >
                Choisir un autre créneau
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit as unknown as () => void}
                className="text-[13px] text-text underline underline-offset-4 cursor-pointer"
              >
                Réessayer
              </button>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col items-center gap-3 mt-2">
          <button
            type="submit"
            disabled={submitting}
            className={`
              inline-flex items-center justify-center gap-2
              px-9 py-4 rounded-full w-full
              font-normal text-[15px] tracking-[0.01em]
              transition-all duration-300 ease-out
              ${
                submitting
                  ? "bg-btn-idle text-sub cursor-wait opacity-70"
                  : "bg-accent text-bg cursor-pointer hover:opacity-[0.82] hover:-translate-y-px active:translate-y-0 active:opacity-100"
              }
            `}
          >
            {submitting && (
              <span className="w-4 h-4 border-2 border-sub/30 border-t-bg rounded-full animate-spin" />
            )}
            {submitting ? "Confirmation en cours..." : "Confirmer mon créneau"}
          </button>

          {!submitting && (
            <button
              type="button"
              onClick={onBack}
              className="text-[12px] text-sub tracking-[0.02em] cursor-pointer hover:text-text transition-colors duration-200"
            >
              Revenir aux créneaux
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

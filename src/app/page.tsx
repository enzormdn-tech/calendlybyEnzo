"use client";

import { useState } from "react";
import ChecklistItem from "@/components/ChecklistItem";
import SlotPicker from "@/components/SlotPicker";
import BookingForm from "@/components/BookingForm";
import BookingConfirmation from "@/components/BookingConfirmation";
import type { SelectedSlot } from "@/components/SlotPicker";

type FlowStep = "picking" | "checklist" | "booking" | "confirmed";

interface BookingDetails {
  name: string;
  startTime: string;
  endTime: string;
}

const CHECKLIST_ITEMS = [
  { id: "time", label: "J'ai 30 minutes devant moi" },
  { id: "quiet", label: "Je suis dans un endroit calme" },
  {
    id: "ready",
    label: "Je suis pret(e) a parler ouvertement de ma situation",
  },
] as const;

export default function BookingPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({
    time: false,
    quiet: false,
    ready: false,
  });
  const [flowStep, setFlowStep] = useState<FlowStep>("picking");
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);

  const allChecked = CHECKLIST_ITEMS.every((item) => checked[item.id]);

  function handleSlotSelected(slot: SelectedSlot | null) {
    setSelectedSlot(slot);
    if (slot) {
      setFlowStep("checklist");
      // Scroll to top for the checklist
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  }

  function handleChecklistConfirm() {
    setFlowStep("booking");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBookingBack() {
    setSelectedSlot(null);
    setChecked({ time: false, quiet: false, ready: false });
    setFlowStep("picking");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBookingSuccess(details: BookingDetails) {
    setBookingDetails(details);
    setFlowStep("confirmed");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleItem(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Confirmation screen — standalone, no sales content
  if (flowStep === "confirmed" && bookingDetails) {
    return (
      <main className="max-w-[680px] mx-auto px-7 py-16 md:py-24">
        <BookingConfirmation
          name={bookingDetails.name}
          startTime={bookingDetails.startTime}
        />

        <footer className="mt-20 pt-5 border-t border-border text-center">
          <p className="text-[11px] text-border tracking-[0.02em] leading-[1.55]">
            Enzo Remidene &middot; Coaching personnel
          </p>
        </footer>
      </main>
    );
  }

  // Checklist — after slot selected, before booking form
  if (flowStep === "checklist" && selectedSlot) {
    return (
      <main className="max-w-[680px] mx-auto px-7 py-16 md:py-24">
        <section className="flex flex-col items-center text-center gap-3.5 mb-10">
          <h1 className="text-2xl md:text-[28px] font-normal tracking-[-0.02em] leading-[1.2]">
            Avant votre coaching
          </h1>
          <p className="text-sub text-[15px] leading-relaxed max-w-[380px]">
            Pour profiter pleinement de ces 30 minutes, assurez-vous de remplir ces conditions.
          </p>
        </section>

        <section className="mb-10">
          <div className="flex flex-col gap-2">
            {CHECKLIST_ITEMS.map((item) => (
              <ChecklistItem
                key={item.id}
                label={item.label}
                checked={checked[item.id]}
                onToggle={() => toggleItem(item.id)}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center">
          <button
            type="button"
            disabled={!allChecked}
            onClick={handleChecklistConfirm}
            className={`
              inline-flex items-center justify-center
              px-9 py-4 rounded-full
              font-normal text-[15px] tracking-[0.01em]
              transition-all duration-300 ease-out
              ${
                allChecked
                  ? "bg-accent text-bg cursor-pointer hover:opacity-[0.82] hover:-translate-y-px active:translate-y-0 active:opacity-100"
                  : "bg-btn-idle text-sub cursor-not-allowed opacity-60"
              }
            `}
          >
            Confirmer mon creneau
          </button>

          {!allChecked && (
            <p className="text-[11px] text-border tracking-[0.02em] mt-3 transition-opacity duration-300">
              Cochez les 3 cases pour continuer
            </p>
          )}

          <button
            type="button"
            onClick={() => { setSelectedSlot(null); setFlowStep("picking"); }}
            className="mt-4 text-sub text-[13px] underline underline-offset-2 hover:text-text transition-colors"
          >
            Choisir un autre creneau
          </button>
        </section>

        <footer className="mt-20 pt-5 border-t border-border text-center">
          <p className="text-[11px] text-border tracking-[0.02em] leading-[1.55]">
            Enzo Remidene &middot; Coaching personnel
          </p>
        </footer>
      </main>
    );
  }

  // Booking form — standalone, no sales content
  if (flowStep === "booking" && selectedSlot) {
    return (
      <main className="max-w-[680px] mx-auto px-7 py-16 md:py-24">
        <section className="flex flex-col items-center text-center gap-3.5 mb-10">
          <h1 className="text-2xl md:text-[28px] font-normal tracking-[-0.02em] leading-[1.2]">
            Plus qu&apos;une etape.
          </h1>
          <p className="text-sub text-[15px] leading-relaxed max-w-[380px]">
            Renseignez vos coordonnees pour confirmer votre creneau.
          </p>
        </section>

        <BookingForm
          selectedSlot={selectedSlot}
          onBack={handleBookingBack}
          onSuccess={handleBookingSuccess}
        />

        <footer className="mt-20 pt-5 border-t border-border text-center">
          <p className="text-[11px] text-border tracking-[0.02em] leading-[1.55]">
            Enzo Remidene &middot; Coaching personnel
          </p>
        </footer>
      </main>
    );
  }

  return (
    <main className="max-w-[680px] mx-auto px-7 py-16 md:py-24">
      {/* ── Hero / Sales Section ── */}
      <section className="flex flex-col items-center text-center gap-3.5 mb-16">
        <h1 className="text-2xl md:text-[28px] font-normal tracking-[-0.02em] leading-[1.2]">
          30 minutes pour reprendre le controle.
        </h1>

        <p className="text-sub text-base leading-relaxed max-w-[420px]">
          Un appel. Pas de blabla, pas de methode generique.
          Juste un echange sincere sur ta situation — et des pistes concretes
          pour avancer.
        </p>
      </section>

      {/* ── What you get ── */}
      <section className="mb-16">
        <div className="border-t border-border pt-5">
          <p className="text-[10px] tracking-[0.08em] uppercase text-sub mb-3">
            Ce que tu obtiens
          </p>
          <ul className="flex flex-col gap-[5px]">
            <li className="text-[15px] leading-[1.4] text-text flex items-baseline gap-2">
              <span className="text-sub text-[11px] flex-shrink-0">&rarr;</span>
              De la clarte sur ta situation actuelle
            </li>
            <li className="text-[15px] leading-[1.4] text-text flex items-baseline gap-2">
              <span className="text-sub text-[11px] flex-shrink-0">&rarr;</span>
              Des recommandations personnalisees
            </li>
            <li className="text-[15px] leading-[1.4] text-text flex items-baseline gap-2">
              <span className="text-sub text-[11px] flex-shrink-0">&rarr;</span>
              Des prochaines etapes concretes
            </li>
            <li className="text-[15px] leading-[1.4] text-text flex items-baseline gap-2">
              <span className="text-sub text-[11px] flex-shrink-0">&rarr;</span>
              Zero engagement, zero frais
            </li>
          </ul>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mb-16">
        <div className="border-t border-border pt-5">
          <p className="text-[10px] tracking-[0.08em] uppercase text-sub mb-3">
            Comment ca se passe
          </p>
          <p className="text-[15px] leading-[1.65] text-sub">
            Tu choisis un creneau, tu recois un lien Google Meet, et on parle
            pendant 30 minutes. Je t&apos;ecoute, je te pose les bonnes
            questions, et on definit ensemble ce qui ferait vraiment la
            difference pour toi.
          </p>
        </div>
      </section>

      {/* ── Slot Picker ── */}
      <section className="mb-10">
        <SlotPicker onSelect={handleSlotSelected} />
      </section>

      {/* ── Footer ── */}
      <footer className="mt-20 pt-5 border-t border-border text-center">
        <p className="text-[11px] text-border tracking-[0.02em] leading-[1.55]">
          Enzo Remidene &middot; Coaching personnel
        </p>
      </footer>
    </main>
  );
}

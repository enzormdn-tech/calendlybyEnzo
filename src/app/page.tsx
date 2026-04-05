"use client";

import { useRef, useState } from "react";
import ChecklistItem from "@/components/ChecklistItem";
import SlotPicker from "@/components/SlotPicker";
import type { SelectedSlot } from "@/components/SlotPicker";

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
  const [showSlots, setShowSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const slotPickerRef = useRef<HTMLDivElement>(null);

  const allChecked = CHECKLIST_ITEMS.every((item) => checked[item.id]);

  function handleShowSlots() {
    setShowSlots(true);
    // Scroll to slot picker after render
    setTimeout(() => {
      slotPickerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function toggleItem(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
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

      {/* ── Readiness Checklist ── */}
      <section className="mb-10">
        <div className="border-t border-border pt-5">
          <p className="text-[10px] tracking-[0.08em] uppercase text-sub mb-4">
            Avant de reserver
          </p>
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
        </div>
      </section>

      {/* ── CTA Button ── */}
      {!showSlots && (
        <section className="flex flex-col items-center">
          <button
            type="button"
            disabled={!allChecked}
            onClick={handleShowSlots}
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
            Voir les creneaux disponibles
          </button>

          {!allChecked && (
            <p className="text-[11px] text-border tracking-[0.02em] mt-3 transition-opacity duration-300">
              Coche les 3 cases pour continuer
            </p>
          )}
        </section>
      )}

      {/* ── Slot Picker ── */}
      {showSlots && (
        <section
          ref={slotPickerRef}
          className="mb-10 animate-fade-in"
        >
          <SlotPicker onSelect={setSelectedSlot} />
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="mt-20 pt-5 border-t border-border text-center">
        <p className="text-[11px] text-border tracking-[0.02em] leading-[1.55]">
          Enzo Remidene &middot; Coaching personnel
        </p>
      </footer>
    </main>
  );
}

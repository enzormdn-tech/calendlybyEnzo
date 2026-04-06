"use client";

interface BookingConfirmationProps {
  name: string;
  startTime: string;
}

/** Format an ISO datetime to French: "Mardi 8 avril" */
function formatDate(isoDatetime: string): string {
  const date = new Date(isoDatetime);
  const weekdays = [
    "Dimanche", "Lundi", "Mardi", "Mercredi",
    "Jeudi", "Vendredi", "Samedi",
  ];
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];
  return `${weekdays[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

/** Format an ISO datetime to "14h30" */
function formatTime(isoDatetime: string): string {
  const date = new Date(isoDatetime);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}h${minutes}`;
}

export default function BookingConfirmation({
  name,
  startTime,
}: BookingConfirmationProps) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-8 animate-fade-in">
      {/* Checkmark */}
      <div className="w-16 h-16 rounded-full bg-level-green/10 flex items-center justify-center animate-scale-in">
        <svg
          className="w-8 h-8 text-level-green"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Main heading */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl md:text-2xl font-normal tracking-[-0.02em] leading-[1.2]">
          Votre appel découverte est confirmé !
        </h2>
        <p className="text-[15px] text-sub leading-relaxed">
          Merci {name}, votre créneau est réservé.
        </p>
      </div>

      {/* Booking details */}
      <div className="w-full max-w-[320px] border border-border rounded-lg px-5 py-4 flex flex-col gap-2">
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] tracking-[0.04em] text-sub">Date</span>
          <span className="text-[15px] text-text">{formatDate(startTime)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] tracking-[0.04em] text-sub">Heure</span>
          <span className="text-[15px] text-text">{formatTime(startTime)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] tracking-[0.04em] text-sub">Durée</span>
          <span className="text-[15px] text-text">30 minutes</span>
        </div>
      </div>

      {/* What to expect */}
      <div className="w-full border-t border-border pt-5 mt-2">
        <p className="text-[10px] tracking-[0.08em] uppercase text-sub mb-3">
          Ce qui vous attend
        </p>
        <p className="text-[15px] leading-[1.65] text-sub max-w-[420px] mx-auto">
          30 minutes d&apos;échange sincère sur votre situation.
          Pas de méthode générique — juste une écoute attentive
          et des pistes concrètes adaptées à vous.
        </p>
      </div>

      {/* Warm closing */}
      <p className="text-[17px] text-text tracking-[-0.01em] mt-2">
        À très bientôt !
      </p>
    </div>
  );
}

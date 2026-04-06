"use client";

interface TimeSlotProps {
  time: string;
  selected: boolean;
  onClick: () => void;
}

export default function TimeSlot({ time, selected, onClick }: TimeSlotProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Réserver à ${time}`}
      className={`
        px-5 py-3 rounded-xl
        text-[15px] font-light tracking-[0.01em]
        transition-all duration-200 ease-out
        cursor-pointer select-none
        ${
          selected
            ? "bg-btn-selected text-btn-selected-text"
            : "bg-btn-idle text-text hover:bg-btn-hover"
        }
      `}
    >
      {time}
    </button>
  );
}

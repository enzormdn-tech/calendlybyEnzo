"use client";

interface DateChipProps {
  date: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function DateChip({
  date,
  label,
  selected,
  onClick,
}: DateChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Voir les créneaux du ${label}`}
      className={`
        flex-shrink-0 px-4 py-2.5 rounded-full
        text-[13px] tracking-[0.01em] whitespace-nowrap
        transition-all duration-200 ease-out
        cursor-pointer select-none
        ${
          selected
            ? "bg-btn-selected text-btn-selected-text"
            : "bg-btn-idle text-sub hover:bg-btn-hover"
        }
      `}
    >
      {label}
    </button>
  );
}

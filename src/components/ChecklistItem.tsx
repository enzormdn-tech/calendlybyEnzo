"use client";

interface ChecklistItemProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

export default function ChecklistItem({
  label,
  checked,
  onToggle,
}: ChecklistItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        w-full flex items-center gap-4 px-5 py-4 rounded-xl
        border transition-all duration-200 ease-out text-left
        cursor-pointer select-none
        ${
          checked
            ? "bg-btn-selected text-btn-selected-text border-btn-selected"
            : "bg-btn-idle border-transparent hover:bg-btn-hover hover:border-border"
        }
      `}
      aria-pressed={checked}
    >
      <span
        className={`
          flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center
          transition-all duration-200
          ${
            checked
              ? "bg-btn-selected-text border-btn-selected-text"
              : "border-sub/30 bg-transparent"
          }
        `}
      >
        {checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-btn-selected"
          >
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="text-[15px] font-light tracking-[0.01em]">{label}</span>
    </button>
  );
}

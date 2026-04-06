"use client";

import { useEffect, useState } from "react";
import DateChip from "@/components/DateChip";
import TimeSlot from "@/components/TimeSlot";

interface Slot {
  start: string;
  end: string;
}

interface GroupedSlots {
  [date: string]: Slot[];
}

/** Format an ISO date string to French short date: "Mar 8 avr." */
function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  const weekdays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const months = [
    "janv.", "fevr.", "mars", "avr.", "mai", "juin",
    "juil.", "août", "sept.", "oct.", "nov.", "déc.",
  ];
  const weekday = weekdays[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  return `${weekday} ${day} ${month}`;
}

/** Extract "HH:mm" from an ISO datetime string */
function formatTime(isoDatetime: string): string {
  const date = new Date(isoDatetime);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Extract "YYYY-MM-DD" from an ISO datetime string */
function extractDate(isoDatetime: string): string {
  return isoDatetime.slice(0, 10);
}

/** Group slots by date, sorted chronologically */
function groupSlotsByDate(slots: Slot[]): GroupedSlots {
  const grouped: GroupedSlots = {};
  for (const slot of slots) {
    const date = extractDate(slot.start);
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(slot);
  }
  // Sort slots within each day by start time
  for (const date of Object.keys(grouped)) {
    grouped[date].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }
  return grouped;
}

export interface SelectedSlot {
  start: string;
  end: string;
}

interface SlotPickerProps {
  onSelect: (slot: SelectedSlot | null) => void;
}

export default function SlotPicker({ onSelect }: SlotPickerProps) {
  const [slots, setSlots] = useState<GroupedSlots>({});
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSlots() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/slots");
        if (!res.ok) {
          throw new Error("Impossible de charger les créneaux");
        }
        const data = await res.json();
        const grouped = groupSlotsByDate(data.slots || []);
        const sortedDates = Object.keys(grouped).sort();
        setSlots(grouped);
        setDates(sortedDates);
        // Auto-select first available date
        if (sortedDates.length > 0) {
          setSelectedDate(sortedDates[0]);
        }
      } catch {
        setError("Impossible de charger les créneaux. Réessayez plus tard.");
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, []);

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    onSelect(null);
  }

  function handleSlotSelect(slot: Slot) {
    const slotKey = slot.start;
    if (selectedSlot === slotKey) {
      // Deselect
      setSelectedSlot(null);
      onSelect(null);
    } else {
      setSelectedSlot(slotKey);
      onSelect({ start: slot.start, end: slot.end });
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <div className="w-5 h-5 border-2 border-sub/30 border-t-text rounded-full animate-spin" />
        <p className="text-[13px] text-sub tracking-[0.02em]">
          Chargement des créneaux...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-[13px] text-sub tracking-[0.02em]">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-[13px] text-text underline underline-offset-4 cursor-pointer"
        >
          Reessayer
        </button>
      </div>
    );
  }

  // Empty state
  if (dates.length === 0) {
    return (
      <div className="flex flex-col items-center py-10">
        <p className="text-[13px] text-sub tracking-[0.02em]">
          Aucun créneau disponible pour le moment.
        </p>
      </div>
    );
  }

  const currentSlots = selectedDate ? slots[selectedDate] || [] : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Section label */}
      <div className="border-t border-border pt-5">
        <p className="text-[10px] tracking-[0.08em] uppercase text-sub mb-4">
          Choisissez un créneau
        </p>

        {/* Date chips — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {dates.map((date) => (
            <DateChip
              key={date}
              date={date}
              label={formatDateLabel(date)}
              selected={selectedDate === date}
              onClick={() => handleDateSelect(date)}
            />
          ))}
        </div>
      </div>

      {/* Time slots grid */}
      {selectedDate && currentSlots.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {currentSlots.map((slot) => (
            <TimeSlot
              key={slot.start}
              time={formatTime(slot.start)}
              selected={selectedSlot === slot.start}
              onClick={() => handleSlotSelect(slot)}
            />
          ))}
        </div>
      )}

      {/* Selected slot confirmation */}
      {selectedSlot && selectedDate && (
        <p className="text-[13px] text-sub tracking-[0.02em] text-center animate-fade-in">
          Creneau selectionne :{" "}
          <span className="text-text font-normal">
            {formatDateLabel(selectedDate)} a {formatTime(selectedSlot)}
          </span>
        </p>
      )}
    </div>
  );
}

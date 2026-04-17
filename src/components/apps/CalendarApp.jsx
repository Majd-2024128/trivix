import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CalendarApp() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isSelected = (d) =>
    d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false });
  }

  return (
    <div className="flex flex-col h-full bg-[#1c1c1e] text-white font-space">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h2 className="text-xl font-semibold">{MONTHS[month]}</h2>
          <span className="text-sm text-white/40">{year}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-md hover:bg-white/10 transition-colors">
            Today
          </button>
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-4 pb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs text-white/30 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 px-4 flex-1">
        {cells.map((cell, i) => (
          <button
            key={i}
            onClick={() => cell.current && setSelectedDate(new Date(year, month, cell.day))}
            className={`flex items-center justify-center text-sm rounded-full aspect-square mx-auto w-9 h-9 transition-all ${
              !cell.current
                ? "text-white/15"
                : isSelected(cell.day)
                ? "bg-red-500 text-white font-semibold"
                : isToday(cell.day)
                ? "bg-white/10 text-red-400 font-semibold"
                : "text-white/80 hover:bg-white/10"
            }`}
            disabled={!cell.current}
          >
            {cell.day}
          </button>
        ))}
      </div>

      {/* Selected date info */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-sm text-white/50">
          {selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <p className="text-xs text-white/25 mt-1">No events scheduled</p>
      </div>

      <div className="px-5 py-2 border-t border-white/10 text-center">
        <p className="text-white/25 text-[10px] font-space">Copyright © 2026 Tejt</p>
      </div>
    </div>
  );
}

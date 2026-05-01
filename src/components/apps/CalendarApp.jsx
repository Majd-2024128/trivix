import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarApp() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const { isDark } = useTheme();
  const t = themed(isDark);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => { setViewDate(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(today); };

  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isSelected = (d) => d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, current: false });

  return (
    <div className={`flex flex-col h-full ${isDark ? "bg-[#1c1c1e] text-white" : "bg-[#f5f5f7] text-[#1c1c1e]"} font-space`}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h2 className="text-xl font-semibold">{MONTHS[month]}</h2>
          <span className={`text-sm ${t.textSubtle}`}>{year}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className={`text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-md ${t.hover} transition-colors`}>Today</button>
          <button onClick={prevMonth} className={`p-1.5 rounded-lg ${t.hover} transition-colors`}>
            <ChevronLeft className={`w-4 h-4 ${t.textMuted}`} />
          </button>
          <button onClick={nextMonth} className={`p-1.5 rounded-lg ${t.hover} transition-colors`}>
            <ChevronRight className={`w-4 h-4 ${t.textMuted}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 px-4 pb-1">
        {DAYS.map((d) => (
          <div key={d} className={`text-center text-xs ${t.textFaint} font-medium py-1`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 px-4 flex-1">
        {cells.map((cell, i) => (
          <button
            key={i}
            onClick={() => cell.current && setSelectedDate(new Date(year, month, cell.day))}
            className={`flex items-center justify-center text-sm rounded-full aspect-square mx-auto w-9 h-9 transition-all ${
              !cell.current
                ? isDark ? "text-white/15" : "text-black/20"
                : isSelected(cell.day)
                ? "bg-red-500 text-white font-semibold"
                : isToday(cell.day)
                ? `${isDark ? "bg-white/10" : "bg-black/5"} text-red-400 font-semibold`
                : `${isDark ? "text-white/80 hover:bg-white/10" : "text-black/80 hover:bg-black/5"}`
            }`}
            disabled={!cell.current}
          >
            {cell.day}
          </button>
        ))}
      </div>

      <div className={`px-5 py-4 border-t ${t.border}`}>
        <p className={`text-sm ${t.textMuted}`}>
          {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
        <p className={`text-xs ${t.textFaint} mt-1`}>No events scheduled</p>
      </div>

      <div className={`px-5 py-2 border-t ${t.border} text-center`}>
        <p className={`${t.textFaint} text-[10px] font-space`}>Copyright © 2026 Tejt</p>
      </div>
    </div>
  );
}

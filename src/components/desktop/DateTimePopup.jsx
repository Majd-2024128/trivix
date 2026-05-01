import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/ThemeContext";

export default function DateTimePopup({ onClose }) {
  const [time, setTime] = useState(new Date());
  const { isDark } = useTheme();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formattedTime = time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  const year = time.getFullYear();
  const month = time.getMonth();
  const today = time.getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = time.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const bg = isDark ? "rgba(30,30,32,0.92)" : "rgba(255,255,255,0.92)";
  const text = isDark ? "text-white" : "text-[#1c1c1e]";
  const muted = isDark ? "text-white/50" : "text-black/50";

  return (
    <div className="fixed inset-0 z-[85]" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`fixed bottom-16 right-3 w-[280px] rounded-2xl shadow-2xl font-space overflow-hidden ${text}`}
        style={{ background: bg, backdropFilter: "blur(30px)", border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.1)" }}
      >
        <div className="px-4 pt-4 pb-2 text-center">
          <div className="text-2xl font-bold tracking-tight">{formattedTime}</div>
        </div>
        <div className="px-3 pb-3">
          <div className={`text-xs font-medium text-center mb-2 ${muted}`}>{monthName}</div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {dayNames.map((d) => <div key={d} className={`text-[9px] font-medium ${muted} py-0.5`}>{d}</div>)}
            {cells.map((d, i) => (
              <div key={i} className={`text-xs py-1 rounded ${d === today ? "bg-blue-500 text-white font-bold" : ""}`}>
                {d || ""}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

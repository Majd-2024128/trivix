import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Clock as ClockIcon } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarApp({ onNotify }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents] = useState(() => {
    try { const s = localStorage.getItem("trivix_calendar_events"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [contextMenu, setContextMenu] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", time: "09:00" });
  const { isDark } = useTheme();
  const t = themed(isDark);

  useEffect(() => {
    localStorage.setItem("trivix_calendar_events", JSON.stringify(events));
  }, [events]);

  // Check for event notifications
  useEffect(() => {
    const iv = setInterval(() => {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      events.forEach((evt) => {
        if (evt.date === dateStr && evt.time === timeStr && now.getSeconds() === 0) {
          onNotify?.({ title: "Calendar", body: evt.title });
        }
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [events, onNotify]);

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

  const getDateStr = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const getEventsForDate = (d) => events.filter((e) => e.date === getDateStr(d));

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, current: false });

  const handleContextMenu = (e, day) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDate(new Date(year, month, day));
    setContextMenu({ x: e.clientX, y: e.clientY, day });
  };

  const addEvent = () => {
    if (!newEvent.title.trim()) return;
    const dateStr = getDateStr(contextMenu?.day || selectedDate.getDate());
    setEvents((prev) => [...prev, { id: Date.now(), date: dateStr, title: newEvent.title, time: newEvent.time }]);
    setNewEvent({ title: "", time: "09:00" });
    setShowAddEvent(false);
    setContextMenu(null);
  };

  const removeEvent = (id) => setEvents((prev) => prev.filter((e) => e.id !== id));

  // Dismiss context menu
  useEffect(() => {
    if (!contextMenu) return;
    const dismiss = () => setContextMenu(null);
    const onKey = (e) => { if (e.key === "Escape") setContextMenu(null); };
    const timer = setTimeout(() => {
      window.addEventListener("mousedown", dismiss);
      window.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", dismiss);
      window.removeEventListener("keydown", onKey);
    };
  }, [contextMenu]);

  const selectedDateStr = getDateStr(selectedDate.getDate());
  const selectedEvents = events.filter((e) => e.date === selectedDateStr);

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
        {cells.map((cell, i) => {
          const hasEvents = cell.current && getEventsForDate(cell.day).length > 0;
          return (
            <button
              key={i}
              onClick={() => cell.current && setSelectedDate(new Date(year, month, cell.day))}
              onContextMenu={(e) => cell.current && handleContextMenu(e, cell.day)}
              className={`flex flex-col items-center justify-center text-sm rounded-full aspect-square mx-auto w-9 h-9 transition-all relative ${
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
              {hasEvents && <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-blue-400" />}
            </button>
          );
        })}
      </div>

      <div className={`px-5 py-4 border-t ${t.border}`}>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-sm ${t.textMuted}`}>
            {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
          <button onClick={() => setShowAddEvent(true)} className={`p-1 rounded-lg ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
            <Plus className={`w-4 h-4 ${t.textMuted}`} />
          </button>
        </div>
        {selectedEvents.length > 0 ? (
          <div className="space-y-1.5 max-h-24 overflow-y-auto">
            {selectedEvents.map((evt) => (
              <div key={evt.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDark ? "bg-white/5" : "bg-black/5"} group`}>
                <ClockIcon className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="text-xs flex-1">{evt.time} — {evt.title}</span>
                <button onClick={() => removeEvent(evt.id)} className="opacity-0 group-hover:opacity-100">
                  <X className={`w-3 h-3 ${isDark ? "text-white/40" : "text-black/40"}`} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-xs ${t.textFaint}`}>No events scheduled</p>
        )}
      </div>

      {/* Add event modal */}
      {showAddEvent && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className={`w-72 rounded-xl border p-4 shadow-2xl ${isDark ? "bg-[#2c2c2e] border-white/10 text-white" : "bg-white border-black/10 text-[#1c1c1e]"}`}>
            <h3 className="text-sm font-semibold mb-3">New Event</h3>
            <input autoFocus value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Event title"
              className={`w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none ${isDark ? "bg-white/10" : "bg-black/5"}`}
              onKeyDown={(e) => e.key === "Enter" && addEvent()} />
            <input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              className={`w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none ${isDark ? "bg-white/10" : "bg-black/5"}`}
              style={{ colorScheme: isDark ? "dark" : "light" }} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddEvent(false)} className="px-3 py-1.5 text-xs rounded-lg hover:bg-black/10">Cancel</button>
              <button onClick={addEvent} className="px-3 py-1.5 text-xs rounded-lg bg-blue-500 text-white">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div onMouseDown={(e) => e.stopPropagation()} className="fixed z-[250] rounded-lg overflow-hidden shadow-2xl min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y, background: isDark ? "rgba(30,30,30,0.95)" : "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.12)" }}>
          <button onClick={() => { setShowAddEvent(true); }} className={`w-full px-4 py-2.5 text-left text-sm ${isDark ? "text-white/90 hover:bg-white/10" : "text-black/80 hover:bg-black/5"} font-space`}>
            Add Event
          </button>
        </div>
      )}

      <div className={`px-5 py-2 border-t ${t.border} text-center`}>
        <p className={`${t.textFaint} text-[10px] font-space`}>Copyright © 2026 Tejt</p>
      </div>
    </div>
  );
}

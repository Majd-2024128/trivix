import { useEffect, useState } from "react";
import { WIDGET_DEFS } from "@/lib/widgetDefs";
import { CLOCK_STYLES } from "@/components/widgets/ClockWidget";
import { useTheme } from "@/lib/ThemeContext";
import { CloudSun, StickyNote, Calendar, Clock as ClockIcon, Calculator as CalcIcon, ChevronLeft } from "lucide-react";

const ICONS = {
  weather:    CloudSun,
  notes:      StickyNote,
  calendar:   Calendar,
  clock:      ClockIcon,
  calculator: CalcIcon,
};

// Centered, non-movable, non-resizable pop-up. Closes when clicking outside (handled
// by the desktop's outside-click listener) — no close button, no Alt+C.
export default function WidgetPicker({ onAddWidget, onClose }) {
  const { isDark } = useTheme();
  const [pickingClock, setPickingClock] = useState(false);

  // Stop propagation so clicking inside the popup doesn't dismiss it.
  const stop = (e) => e.stopPropagation();

  const choose = (def, extraMeta = {}) => {
    onAddWidget(def.id, extraMeta);
    onClose();
  };

  const surface = isDark ? "bg-[#1c1c1e]/95 text-white border-white/10" : "bg-white/95 text-[#1c1c1e] border-black/10";
  const tile = isDark ? "bg-white/5 hover:bg-white/10 border-white/10" : "bg-black/5 hover:bg-black/10 border-black/10";
  const muted = isDark ? "text-white/55" : "text-black/55";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      onMouseDown={(e) => { /* outside-click dismiss handled by Desktop */ }}
    >
      <div
        onMouseDown={stop}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative rounded-2xl border ${surface} shadow-2xl backdrop-blur-2xl p-5 w-[480px] max-w-[92vw] font-space`}
      >
        <div className="flex items-center gap-2 mb-4">
          {pickingClock && (
            <button onClick={() => setPickingClock(false)} className={`p-1 rounded ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <h2 className="text-base font-semibold">{pickingClock ? "Choose Clock Style" : "Add Widget"}</h2>
          <span className={`text-[10px] ml-auto ${muted}`}>Click outside to dismiss</span>
        </div>

        {!pickingClock ? (
          <div className="grid grid-cols-3 gap-2.5">
            {WIDGET_DEFS.map((def) => {
              const Icon = ICONS[def.id] || CalcIcon;
              return (
                <button
                  key={def.id}
                  onClick={() => {
                    if (def.requiresPick === "clockStyle") setPickingClock(true);
                    else choose(def);
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${tile} transition-colors`}
                >
                  <Icon className="w-7 h-7" />
                  <span className="text-xs font-medium">{def.name}</span>
                  <span className={`text-[10px] ${muted}`}>{def.defaultSize.w}×{def.defaultSize.h}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {CLOCK_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => choose(WIDGET_DEFS.find((d) => d.id === "clock"), { clockStyle: s.id })}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${tile} text-sm transition-colors`}
              >
                <span>{s.label}</span>
                <span className={`text-[10px] ${muted}`}>›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

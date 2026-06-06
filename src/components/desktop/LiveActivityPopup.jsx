import { useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";

export default function LiveActivityPopup({ activity, onClose }) {
  const { isDark } = useTheme();
  useEffect(() => {
    const dismiss = (e) => {
      const el = document.querySelector("[data-live-popup]");
      if (el && el.contains(e.target)) return;
      if (e.target.closest?.("[data-live-trigger]")) return;
      onClose();
    };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const t = setTimeout(() => {
      window.addEventListener("mousedown", dismiss);
      window.addEventListener("keydown", onKey);
    }, 0);
    return () => { clearTimeout(t); window.removeEventListener("mousedown", dismiss); window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  if (!activity) return null;
  const bg = isDark ? "bg-[#1c1c1e]/95" : "bg-white/95";
  const border = isDark ? "border-white/10" : "border-black/10";
  const Icon = activity.icon;

  return (
    <div data-live-popup className={`fixed top-8 right-16 z-[260] w-80 rounded-xl border ${border} ${bg} shadow-2xl backdrop-blur-2xl overflow-hidden font-space ${isDark ? "text-white" : "text-black"}`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? "border-white/10" : "border-black/10"}`}>
        {Icon && <Icon className="w-4 h-4" style={activity.color ? { color: activity.color } : undefined} />}
        <span className="text-sm font-semibold flex-1 truncate">{activity.label}</span>
      </div>
      <div className="px-4 py-4 text-xs space-y-2">
        {activity.details ? (
          typeof activity.details === "string" ? <p className="opacity-80 leading-relaxed">{activity.details}</p> : activity.details
        ) : (
          <p className="opacity-60">No additional details.</p>
        )}
        {activity.actions && (
          <div className="flex gap-2 pt-2">
            {activity.actions.map((a, i) => (
              <button key={i} onClick={() => { a.onClick?.(); onClose(); }}
                className={`px-3 py-1.5 text-xs rounded-lg ${isDark ? "bg-white/10 hover:bg-white/15" : "bg-black/10 hover:bg-black/15"}`}>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { Bell, Trash2 } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";

export default function NotificationCenter({ notifications = [], onClose, onClear }) {
  const { isDark } = useTheme();
  const t = themed(isDark);

  useEffect(() => {
    const dismiss = (e) => {
      const el = document.querySelector("[data-notif-center]");
      if (el && el.contains(e.target)) return;
      // Ignore clicks on the bell trigger so it can toggle closed itself
      if (e.target.closest?.("[data-notif-trigger]")) return;
      onClose();
    };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const timer = setTimeout(() => {
      window.addEventListener("mousedown", dismiss);
      window.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", dismiss);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const bg = isDark ? "bg-[#1c1c1e]/95" : "bg-white/95";
  const border = isDark ? "border-white/10" : "border-black/10";

  return (
    <div data-notif-center className={`fixed top-8 right-16 z-[250] w-80 max-h-96 rounded-xl border ${border} ${bg} shadow-2xl backdrop-blur-2xl overflow-hidden font-space`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-white/10" : "border-black/10"}`}>
        <span className="text-sm font-semibold">Notifications</span>
        {notifications.length > 0 && (
          <button onClick={onClear} className="text-xs text-red-400 hover:text-red-300">
            Clear All
          </button>
        )}
      </div>
      <div className="overflow-y-auto max-h-72">
        {notifications.length === 0 ? (
          <div className={`py-8 text-center ${isDark ? "text-white/30" : "text-black/30"}`}>
            <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`px-4 py-3 border-b ${isDark ? "border-white/5" : "border-black/5"}`}>
              <div className="flex items-start justify-between">
                <div className="text-xs font-medium">{n.title}</div>
                <span className={`text-[10px] ${isDark ? "text-white/30" : "text-black/30"}`}>
                  {n.time?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                </span>
              </div>
              {n.body && <p className={`text-xs mt-0.5 ${isDark ? "text-white/50" : "text-black/50"}`}>{n.body}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

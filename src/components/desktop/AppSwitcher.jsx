import { useEffect, useState } from "react";
import { APP_DEFS } from "./Dock";
import { useTheme } from "@/lib/ThemeContext";

export default function AppSwitcher({ openApps = [], focusedAppId, onSelect, visible }) {
  const { isDark } = useTheme();
  const [activeId, setActiveId] = useState(focusedAppId);

  useEffect(() => {
    if (visible) setActiveId(focusedAppId);
  }, [visible, focusedAppId]);

  useEffect(() => { setActiveId(focusedAppId); }, [focusedAppId]);

  if (!visible || openApps.length < 2) return null;

  const apps = openApps.map((id) => APP_DEFS.find((a) => a.id === id)).filter(Boolean);
  const active = apps.find((a) => a.id === activeId) || apps[0];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none">
      <div className={`flex flex-col items-center gap-3 rounded-2xl px-6 py-5 shadow-2xl backdrop-blur-2xl ${isDark ? "bg-black/60 border border-white/10" : "bg-white/80 border border-black/10"}`}>
        <div className="flex items-center gap-3">
          {apps.map((app) => (
            <div key={app.id} className={`rounded-xl p-1.5 transition ${app.id === active.id ? "bg-blue-500/30 ring-2 ring-blue-400" : "opacity-60"}`}>
              <img src={isDark ? app.iconDark : app.iconLight} alt={app.name} className="h-12 w-12 rounded-lg" />
            </div>
          ))}
        </div>
        <div className={`text-sm font-space font-semibold ${isDark ? "text-white" : "text-black"}`}>{active.name}</div>
      </div>
    </div>
  );
}

import { X, ArrowDown, Maximize2, Bell } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

export default function MenuBar({ controls, onNotifClick, notifCount = 0 }) {
  const { isDark } = useTheme();
  const displayName = controls?.appName === "Settings" ? "System" : controls?.appName;
  const labelColor = isDark ? "text-white/60" : "text-black/70";
  const inactiveX = isDark ? "text-red-400" : "text-red-500";
  const inactiveArrow = isDark ? "text-white" : "text-black/70";

  return (
    <div
      className="fixed top-0 left-0 right-0 h-7 flex items-center justify-between px-4 z-[200] select-none"
      style={{
        background: isDark ? "rgba(30, 40, 30, 0.65)" : "rgba(245, 245, 247, 0.75)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <div className="flex items-center gap-1">
        {controls ? (
          <>
            <button onClick={controls.close} className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-3 h-3 text-red-500" strokeWidth={3} />
            </button>
            <button onClick={controls.minimize} className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/10 transition-colors">
              <ArrowDown className={`w-3 h-3 ${isDark ? "text-white" : "text-black/80"}`} strokeWidth={2.5} />
            </button>
            <button onClick={(e) => controls.maximize?.(e)} className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/10 transition-colors">
              <Maximize2 className={`w-3 h-3 ${isDark ? "text-green-400" : "text-green-600"}`} strokeWidth={2.5} />
            </button>
            {displayName && (
              <span className={`${labelColor} text-xs font-space font-medium ml-1`}>{displayName}</span>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-7 h-7 opacity-25">
              <X className={`w-3 h-3 ${inactiveX}`} strokeWidth={3} />
            </div>
            <div className="flex items-center justify-center w-7 h-7 opacity-25">
              <ArrowDown className={`w-3 h-3 ${inactiveArrow}`} strokeWidth={2.5} />
            </div>
            <div className="flex items-center justify-center w-7 h-7 opacity-25">
              <Maximize2 className={`w-3 h-3 ${isDark ? "text-green-400" : "text-green-600"}`} strokeWidth={2.5} />
            </div>
          </>
        )}
      </div>

      {/* Right side: notification bell */}
      <div className="flex items-center gap-2">
        <button data-notif-trigger onClick={onNotifClick} className="relative flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/10 transition-colors">
          <Bell className={`w-3.5 h-3.5 ${isDark ? "text-white/70" : "text-black/60"}`} />
          {notifCount > 0 && (
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
      </div>
    </div>
  );
}

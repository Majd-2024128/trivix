import { X, ArrowDown, Maximize2 } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

export default function MenuBar({ controls }) {
  const { isDark } = useTheme();
  const displayName = controls?.appName === "Settings" ? "System" : controls?.appName;
  const labelColor = isDark ? "text-white/60" : "text-black/70";
  const inactiveX = isDark ? "text-red-400" : "text-red-500";
  const inactiveArrow = isDark ? "text-white" : "text-black/70";

  return (
    <div
      className="fixed top-0 left-0 right-0 h-7 flex items-center px-4 z-50 select-none"
      style={{
        background: isDark ? "rgba(30, 40, 30, 0.65)" : "rgba(245, 245, 247, 0.75)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <div className="flex items-center gap-3">
        {controls ? (
          <>
            <button onClick={controls.close} className="flex items-center justify-center hover:opacity-70 transition-opacity">
              <X className="w-3 h-3 text-red-500" strokeWidth={3} />
            </button>
            <button onClick={controls.minimize} className="flex items-center justify-center hover:opacity-70 transition-opacity">
              <ArrowDown className={`w-3 h-3 ${isDark ? "text-white" : "text-black/80"}`} strokeWidth={2.5} />
            </button>
            <button onClick={controls.maximize} className="flex items-center justify-center hover:opacity-70 transition-opacity">
              <Maximize2 className={`w-3 h-3 ${isDark ? "text-green-400" : "text-green-600"}`} strokeWidth={2.5} />
            </button>
            {displayName && (
              <span className={`${labelColor} text-xs font-space font-medium ml-1`}>{displayName}</span>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-center opacity-25">
              <X className={`w-3 h-3 ${inactiveX}`} strokeWidth={3} />
            </div>
            <div className="flex items-center justify-center opacity-25">
              <ArrowDown className={`w-3 h-3 ${inactiveArrow}`} strokeWidth={2.5} />
            </div>
            <div className="flex items-center justify-center opacity-25">
              <Maximize2 className={`w-3 h-3 ${isDark ? "text-green-400" : "text-green-600"}`} strokeWidth={2.5} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

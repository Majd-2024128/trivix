import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import systemIcon from "@/assets/system-icon.png";
import systemIconLight from "@/assets/system-icon-light.png";
import { useTheme } from "@/lib/ThemeContext";

export default function SystemDock({ onOpenSettings, isSettingsOpen, onCloseSettings, onLock, dockHidden = false, activities = [] }) {
  const { isDark } = useTheme();
  const [hovered, setHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState(false);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(true);
  };

  useEffect(() => {
    if (!contextMenu) return;
    const dismiss = () => setContextMenu(false);
    const onKey = (e) => { if (e.key === "Escape") setContextMenu(false); };
    const t = setTimeout(() => {
      window.addEventListener("mousedown", dismiss);
      window.addEventListener("contextmenu", dismiss);
      window.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousedown", dismiss);
      window.removeEventListener("contextmenu", dismiss);
      window.removeEventListener("keydown", onKey);
    };
  }, [contextMenu]);

  return (
    <div className="fixed bottom-3 left-3 z-50">
      <div className="flex items-center gap-2 rounded-[20px] border border-white/15 bg-white/[0.18] px-3 py-2 shadow-2xl shadow-black/25 backdrop-blur-2xl">
        {activities.slice(0, 1).map((activity) => (
          <div key={activity.id} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums ${isDark ? "bg-white/10 text-white/85" : "bg-black/10 text-black/75"}`}>
            {activity.label} {activity.value}
          </div>
        ))}
        <div className="relative flex flex-col items-center">
          <AnimatePresence>
            {contextMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute bottom-full left-full ml-3 mb-0 z-50 rounded-lg overflow-hidden shadow-xl min-w-[140px]"
                style={{
                  background: "rgba(30,30,30,0.92)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div className="px-3 py-1.5 text-white/40 text-xs font-space border-b border-white/10">System</div>
                {isSettingsOpen ? (
                  <button
                    onClick={() => { setContextMenu(false); onCloseSettings(); }}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 font-space transition-colors"
                  >
                    Close Window
                  </button>
                ) : (
                  <button
                    onClick={() => { setContextMenu(false); onOpenSettings(); }}
                    className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 font-space transition-colors"
                  >
                    Open
                  </button>
                )}
                <div className="h-px bg-white/10" />
                <button
                  onClick={() => { setContextMenu(false); onLock?.(); }}
                  className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 font-space transition-colors"
                >
                  Lock
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {hovered && !contextMenu && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-9 px-3 py-1 rounded-md text-xs font-space font-medium text-white whitespace-nowrap pointer-events-none"
              style={{ background: "rgba(30,30,30,0.85)", backdropFilter: "blur(12px)" }}
            >
              System
            </motion.div>
          )}

          <button
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onOpenSettings}
            onContextMenu={handleContextMenu}
            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-card shadow-lg ring-1 ring-white/10 transition-transform active:scale-95"
            style={{ transform: dockHidden ? "translateY(120px)" : "translateY(0)", opacity: dockHidden ? 0 : 1, transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.25s" }}
          >
            <div className="relative h-full w-full">
              <img src={systemIcon} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover pointer-events-none" draggable={false} style={{ opacity: isDark ? 1 : 0 }} />
              <img src={systemIconLight} alt="System" className="absolute inset-0 h-full w-full object-cover pointer-events-none" draggable={false} style={{ opacity: isDark ? 0 : 1 }} />
            </div>
          </button>

          {isSettingsOpen && (
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-[2px] rounded-full bg-white/85" />
          )}
        </div>
      </div>
    </div>
  );
}

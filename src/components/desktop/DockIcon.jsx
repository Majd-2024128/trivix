import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DockIcon({ app, onClick, isOpen, onClose }) {
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState(false);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(true);
  };

  // Dismiss on any global click/contextmenu/escape
  useEffect(() => {
    if (!contextMenu) return;
    const dismiss = () => setContextMenu(false);
    const onKey = (e) => { if (e.key === "Escape") setContextMenu(false); };
    // delay to avoid catching the opening click
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
    <div className="relative flex flex-col items-center">
      {/* Tooltip */}
      {isHovered && !contextMenu && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-9 px-3 py-1 rounded-md text-xs font-space font-medium text-white whitespace-nowrap z-50 pointer-events-none"
          style={{ background: "rgba(30,30,30,0.85)", backdropFilter: "blur(12px)" }}
        >
          {app.name}
        </motion.div>
      )}

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute bottom-full mb-3 z-50 rounded-lg overflow-hidden shadow-xl min-w-[140px]"
            style={{
              background: "rgba(30,30,30,0.92)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="px-3 py-1.5 text-white/40 text-xs font-space border-b border-white/10">{app.name}</div>
            {isOpen ? (
              <button
                onClick={() => { setContextMenu(false); onClose(); }}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 font-space transition-colors"
              >
                Close Window
              </button>
            ) : (
              <button
                onClick={() => { setContextMenu(false); onClick(); }}
                className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 font-space transition-colors"
              >
                Open
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-card shadow-lg ring-1 ring-white/10"
      >
        {app.iconDark && app.iconLight ? (
          <div className="relative w-full h-full">
            {/* Both icons stay in DOM; only opacity flips for instant theme swap */}
            <img src={app.iconDark} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} style={{ opacity: app.useDark ? 1 : 0 }} />
            <img src={app.iconLight} alt={app.name} className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} style={{ opacity: app.useDark ? 0 : 1 }} />
          </div>
        ) : typeof app.icon === "string" ? (
          <img src={app.icon} alt={app.name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
        ) : (
          <span className="text-2xl">{app.icon}</span>
        )}
      </motion.button>

      {/* Indicator: absolute, doesn't change dock height */}
      {isOpen && (
        <div
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-[2px] rounded-full bg-white/85"
        />
      )}
    </div>
  );
}

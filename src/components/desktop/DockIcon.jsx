import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DockIcon({ app, onClick, isOpen, onClose }) {
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState(false);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu(true);
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Tooltip */}
      {isHovered && !contextMenu && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-9 px-3 py-1 rounded-md text-xs font-space font-medium text-white whitespace-nowrap z-50"
          style={{ background: "rgba(30,30,30,0.85)", backdropFilter: "blur(12px)" }}
        >
          {app.name}
        </motion.div>
      )}

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setContextMenu(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute -top-20 z-50 rounded-lg overflow-hidden shadow-xl min-w-[140px]"
              style={{
                background: "rgba(30,30,30,0.92)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="px-3 py-1.5 text-white/40 text-xs font-space border-b border-white/10">{app.name}</div>
              {isOpen ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setContextMenu(false); onClose(); }}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 font-space transition-colors"
                >
                  Close Window
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setContextMenu(false); onClick(); }}
                  className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 font-space transition-colors"
                >
                  Open
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shadow-lg"
        style={{ background: app.color, boxShadow: `0 4px 15px ${app.color}66` }}
      >
        {app.icon.startsWith("http") ? (
          <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">{app.icon}</span>
        )}
      </motion.button>

      {isOpen && (
        <div className="w-1 h-1 rounded-full bg-white/80 mt-1" />
      )}
    </div>
  );
}
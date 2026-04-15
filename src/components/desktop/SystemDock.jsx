import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function SystemDock({ onOpenSettings, isSettingsOpen, onCloseSettings }) {
  const [hovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState(false);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu(true);
  };

  return (
    <div className="fixed bottom-3 left-3 z-50">
      <div className="px-3 py-2 rounded-[20px] flex items-center"

      style={{
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)"
      }}>
        
        <div className="relative flex flex-col items-center">
          <AnimatePresence>
            {contextMenu &&
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
                  border: "1px solid rgba(255,255,255,0.1)"
                }}>
                
                  <div className="px-3 py-1.5 text-white/40 text-xs font-space border-b border-white/10">System</div>
                  {isSettingsOpen ?
                <button
                  onClick={(e) => {e.stopPropagation();setContextMenu(false);onCloseSettings();}}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 font-space transition-colors">
                  
                      Close Window
                    </button> :

                <button
                  onClick={(e) => {e.stopPropagation();setContextMenu(false);onOpenSettings();}}
                  className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 font-space transition-colors">
                  
                      Open
                    </button>
                }
                </motion.div>
              </>
            }
          </AnimatePresence>

          {hovered && !contextMenu &&
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-9 px-3 py-1 rounded-md text-xs font-space font-medium text-white whitespace-nowrap"
            style={{ background: "rgba(30,30,30,0.85)", backdropFilter: "blur(12px)" }}>
            
              System
            </motion.div>
          }
          <motion.button
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onOpenSettings}
            onContextMenu={handleContextMenu}
            whileHover={{ scale: 1.25, y: -10 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }} className="rounded-xl w-12 h-12 flex items-center justify-center overflow-hidden shadow-lg"

            style={{ background: "rgba(255,255,255,0.15)" }}>
            
            <img src="https://media.db.com/images/public/69da4028252efa86ced524b1/3568a96a4_image-removebg-preview.png"

            alt="Settings" className="w-9 h-9 object-contain" />

            
          </motion.button>
          {isSettingsOpen &&
          <div className="w-1 h-1 rounded-full bg-white/80 mt-1" />
          }
        </div>
      </div>
    </div>);

}
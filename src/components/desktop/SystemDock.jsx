import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import systemIcon from "@/assets/system-icon.png";

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

      className="rounded-[20px] border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-2xl shadow-2xl shadow-black/25">
        
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
            transition={{ type: "spring", stiffness: 400, damping: 17 }} className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-card shadow-lg ring-1 ring-white/10">
            
            <img src={systemIcon}
            alt="Settings" className="h-full w-full object-cover" />

            
          </motion.button>
          {isSettingsOpen &&
          <div className="w-1 h-1 rounded-full bg-white/80 mt-1" />
          }
        </div>
      </div>
    </div>);

}
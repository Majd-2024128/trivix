import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Wifi, WifiOff, Bluetooth, BluetoothOff } from "lucide-react";
import systemIcon from "@/assets/system-icon.png";
import systemIconLight from "@/assets/system-icon-light.png";
import { useTheme } from "@/lib/ThemeContext";
import { useConnections, connections } from "@/lib/connectionsStore";

export default function SystemDock({ onOpenSettings, isSettingsOpen, onCloseSettings, onLock, dockHidden = false }) {
  const { isDark } = useTheme();
  const conn = useConnections();
  const [hovered, setHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState(false);
  const [openPanel, setOpenPanel] = useState(null); // 'wifi' | 'bluetooth' | null

  useEffect(() => {
    if (!openPanel) return;
    const onClick = (e) => { if (!e.target.closest("[data-conn-panel]")) setOpenPanel(null); };
    setTimeout(() => window.addEventListener("mousedown", onClick), 0);
    return () => window.removeEventListener("mousedown", onClick);
  }, [openPanel]);

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

  const containerCls = isDark
    ? "border-white/15 bg-white/[0.18] shadow-black/25"
    : "border-black/10 bg-white/55 shadow-black/15";

  return (
    <div className="fixed bottom-3 left-3 z-50">
      <div className={`flex items-center gap-2 rounded-[20px] border px-3 py-2 shadow-2xl backdrop-blur-2xl ${containerCls}`}>
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

        {/* WiFi */}
        <div className="relative" data-conn-panel>
          <button onClick={(e) => { e.stopPropagation(); setOpenPanel(openPanel === "wifi" ? null : "wifi"); }}
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${isDark ? "bg-white/10 hover:bg-white/15" : "bg-black/5 hover:bg-black/10"} transition-colors`}
            title="Wi-Fi">
            {conn.wifi.enabled ? <Wifi className={`w-5 h-5 ${isDark ? "text-white" : "text-[#1c1c1e]"}`} /> : <WifiOff className={`w-5 h-5 ${isDark ? "text-white/40" : "text-black/40"}`} />}
          </button>
          <AnimatePresence>
            {openPanel === "wifi" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute bottom-full mb-3 left-0 z-50 rounded-xl shadow-2xl min-w-[220px] p-3 font-space"
                style={{ background: isDark ? "rgba(28,28,30,0.95)" : "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`, color: isDark ? "#fff" : "#1c1c1e" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Wi-Fi</span>
                  <button onClick={() => connections.toggleWifi()} className={`relative w-9 h-5 rounded-full ${conn.wifi.enabled ? "bg-blue-500" : isDark ? "bg-white/15" : "bg-black/15"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${conn.wifi.enabled ? "left-[20px]" : "left-0.5"}`} />
                  </button>
                </div>
                {conn.wifi.enabled && (
                  <div className={`text-[11px] px-2 py-1.5 rounded-lg ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                    <div className="flex items-center gap-2"><Wifi className="w-3 h-3 text-blue-400" /><span className="truncate">{conn.wifi.ssid}</span><span className="ml-auto opacity-60">●●●●</span></div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bluetooth */}
        <div className="relative" data-conn-panel>
          <button onClick={(e) => { e.stopPropagation(); setOpenPanel(openPanel === "bluetooth" ? null : "bluetooth"); }}
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${isDark ? "bg-white/10 hover:bg-white/15" : "bg-black/5 hover:bg-black/10"} transition-colors`}
            title="Bluetooth">
            {conn.bluetooth.enabled ? <Bluetooth className={`w-5 h-5 ${isDark ? "text-white" : "text-[#1c1c1e]"}`} /> : <BluetoothOff className={`w-5 h-5 ${isDark ? "text-white/40" : "text-black/40"}`} />}
          </button>
          <AnimatePresence>
            {openPanel === "bluetooth" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute bottom-full mb-3 left-0 z-50 rounded-xl shadow-2xl min-w-[240px] p-3 font-space"
                style={{ background: isDark ? "rgba(28,28,30,0.95)" : "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`, color: isDark ? "#fff" : "#1c1c1e" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Bluetooth</span>
                  <button onClick={() => connections.toggleBluetooth()} className={`relative w-9 h-5 rounded-full ${conn.bluetooth.enabled ? "bg-blue-500" : isDark ? "bg-white/15" : "bg-black/15"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${conn.bluetooth.enabled ? "left-[20px]" : "left-0.5"}`} />
                  </button>
                </div>
                {conn.bluetooth.enabled && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {conn.bluetooth.devices.map((d) => (
                      <button key={d.id} onClick={() => connections.toggleDevice(d.id)}
                        className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-[11px] ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
                        <span className="truncate flex-1 text-left">{d.name}</span>
                        <span className={`text-[10px] tabular-nums ${d.connected ? "text-green-400" : "opacity-50"}`}>{d.connected ? `${d.battery}%` : "off"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

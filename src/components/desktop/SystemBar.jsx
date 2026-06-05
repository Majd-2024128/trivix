import { useState, useEffect, useRef } from "react";
import { BatteryFull, BatteryMedium, BatteryLow, BatteryCharging, Wifi, WifiOff, Bluetooth, BluetoothOff, Loader2, Search } from "lucide-react";
import { useConnections, connections } from "@/lib/connectionsStore";

async function isAreaLight(rect) {
  try {
    const desktop = document.querySelector('[data-desktop-bg="true"]');
    if (!desktop) return false;
    const cs = getComputedStyle(desktop);
    const bgImage = cs.backgroundImage;
    const bgColor = cs.backgroundColor;
    const urlMatch = bgImage && bgImage.match(/url\((['"]?)(.*?)\1\)/);
    if (urlMatch) {
      const src = urlMatch[2];
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
      const canvas = document.createElement("canvas");
      const cw = 64, ch = 64;
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext("2d");
      const dRatio = window.innerWidth / window.innerHeight;
      const iRatio = img.width / img.height;
      let sx, sy, sw, sh;
      if (iRatio > dRatio) { sh = img.height; sw = img.height * dRatio; sx = (img.width - sw) / 2; sy = 0; }
      else { sw = img.width; sh = img.width / dRatio; sx = 0; sy = (img.height - sh) / 2; }
      const rx = sx + (rect.left / window.innerWidth) * sw;
      const ry = sy + (rect.top / window.innerHeight) * sh;
      const rw = (rect.width / window.innerWidth) * sw;
      const rh = (rect.height / window.innerHeight) * sh;
      ctx.drawImage(img, rx, ry, rw, rh, 0, 0, cw, ch);
      const data = ctx.getImageData(0, 0, cw, ch).data;
      let total = 0, count = 0;
      for (let i = 0; i < data.length; i += 16) {
        total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        count++;
      }
      return total / count > 120;
    }
    const colors = (bgImage + " " + bgColor).match(/#([0-9a-f]{3,8})\b|rgba?\([^)]+\)/gi) || [];
    if (colors.length === 0) return false;
    let total = 0, count = 0;
    for (const c of colors) {
      const rgb = parseColor(c);
      if (!rgb) continue;
      total += 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
      count++;
    }
    if (!count) return false;
    return total / count > 120;
  } catch { return false; }
}

function parseColor(str) {
  if (str.startsWith("#")) {
    let hex = str.slice(1);
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length < 6) return null;
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }
  const m = str.match(/rgba?\(([^)]+)\)/i);
  if (m) { const parts = m[1].split(",").map((s) => parseFloat(s.trim())); return [parts[0], parts[1], parts[2]]; }
  return null;
}

export default function SystemBar({ onDateClick, dockHidden = false }) {
  const [time, setTime] = useState(new Date());
  const [battery, setBattery] = useState(null);
  const [charging, setCharging] = useState(false);
  const [light, setLight] = useState(false);
  const [showBatt, setShowBatt] = useState(false);
  const conn = useConnections();
  const ref = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (navigator.getBattery) {
      navigator.getBattery().then((bat) => {
        setBattery(Math.round(bat.level * 100));
        setCharging(bat.charging);
        bat.addEventListener("levelchange", () => setBattery(Math.round(bat.level * 100)));
        bat.addEventListener("chargingchange", () => setCharging(bat.charging));
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const sample = async () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const result = await isAreaLight(rect);
      if (!cancelled) setLight(result);
    };
    sample();
    const interval = setInterval(sample, 3000);
    const desktop = document.querySelector('[data-desktop-bg="true"]');
    let observer;
    if (desktop && "MutationObserver" in window) {
      observer = new MutationObserver(() => sample());
      observer.observe(desktop, { attributes: true, attributeFilter: ["style", "class"] });
    }
    window.addEventListener("resize", sample);
    return () => { cancelled = true; clearInterval(interval); observer?.disconnect(); window.removeEventListener("resize", sample); };
  }, []);

  useEffect(() => {
    if (!showBatt) return;
    const dismiss = (e) => { if (!e.target.closest?.("[data-batt-popup]") && !e.target.closest?.("[data-batt-trigger]")) setShowBatt(false); };
    const t = setTimeout(() => window.addEventListener("mousedown", dismiss), 0);
    return () => { clearTimeout(t); window.removeEventListener("mousedown", dismiss); };
  }, [showBatt]);

  const formattedTime = time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const formattedDate = time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const textPrimary = light ? "text-black/90" : "text-white/95";
  const textSecondary = light ? "text-black/60" : "text-white/65";
  const dividerCls = light ? "bg-black/20" : "bg-white/20";
  const batteryNeutral = light ? "text-black/70" : "text-white/70";

  const getBatteryIcon = () => {
    if (charging) return <BatteryCharging className="w-4 h-4 text-green-500" />;
    if (battery === null) return null;
    if (battery > 60) return <BatteryFull className={`w-4 h-4 ${batteryNeutral}`} />;
    if (battery > 20) return <BatteryMedium className="w-4 h-4 text-yellow-500" />;
    return <BatteryLow className="w-4 h-4 text-red-500" />;
  };

  const containerStyle = light
    ? { background: "rgba(255,255,255,0.55)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(0,0,0,0.12)", boxShadow: "0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)" }
    : { background: "rgba(0,0,0,0.35)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)" };

  const battColor = charging ? "from-green-400 to-green-600" : battery > 60 ? "from-green-400 to-emerald-500" : battery > 20 ? "from-yellow-400 to-orange-500" : "from-red-500 to-red-600";

  const popupTone = light ? "text-[#1c1c1e]" : "text-white";
  const subtleBg = light ? "bg-black/5" : "bg-white/5";
  const subtleHover = light ? "hover:bg-black/10" : "hover:bg-white/10";

  return (
    <div ref={ref} className="fixed bottom-3 right-3 z-50" style={{ transform: dockHidden ? "translateY(120px)" : "translateY(0)", opacity: dockHidden ? 0 : 1, transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.25s" }}>
      <div className="px-4 py-2 rounded-[20px] flex flex-row items-center gap-3" style={containerStyle}>
        <button data-batt-trigger onClick={() => setShowBatt((v) => !v)} className="flex items-center gap-1.5 rounded-md hover:bg-white/10 px-1 py-0.5 transition">
          {getBatteryIcon()}
          <span className={`text-xs font-space font-medium ${textPrimary}`}>{battery !== null ? `${battery}%` : "—"}</span>
        </button>
        <div className={`w-px h-4 ${dividerCls}`} />
        <button onClick={onDateClick} className="flex flex-col items-end">
          <span className={`${textPrimary} text-xs font-space font-semibold leading-none`}>{formattedTime}</span>
          <span className={`${textSecondary} text-xs font-space mt-0.5`}>{formattedDate}</span>
        </button>
      </div>

      {showBatt && (
        <div data-batt-popup className={`absolute bottom-full right-0 mb-2 w-72 rounded-2xl p-4 shadow-2xl font-space ${popupTone}`} style={containerStyle}>
          {/* Battery */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Battery</span>
            {charging && <BatteryCharging className="w-4 h-4 text-green-400" />}
          </div>
          <div className="text-2xl font-bold">{battery !== null ? `${battery}%` : "—"}</div>
          <div className={`mt-3 h-3 w-full rounded-full overflow-hidden ${light ? "bg-black/10" : "bg-white/10"}`}>
            <div className={`h-full rounded-full bg-gradient-to-r ${battColor} transition-all`} style={{ width: `${battery ?? 0}%` }} />
          </div>
          <div className={`mt-1 text-[11px] ${textSecondary}`}>{charging ? "Charging" : battery > 20 ? "On battery" : "Low battery"}</div>

          {/* WiFi */}
          <div className={`mt-4 pt-3 border-t ${light ? "border-black/10" : "border-white/10"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {conn.wifi.enabled ? <Wifi className="w-4 h-4 text-blue-400" /> : <WifiOff className="w-4 h-4 opacity-50" />}
                <span className="text-xs font-medium">Wi-Fi</span>
              </div>
              <button onClick={() => connections.toggleWifi()} className={`relative w-9 h-5 rounded-full ${conn.wifi.enabled ? "bg-blue-500" : light ? "bg-black/15" : "bg-white/15"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${conn.wifi.enabled ? "left-[20px]" : "left-0.5"}`} />
              </button>
            </div>
            {conn.wifi.enabled && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {conn.wifi.networks.map((n) => {
                  const isActive = conn.wifi.activeSsid === n.ssid;
                  const isConn = conn.wifi.connecting === n.ssid;
                  return (
                    <button key={n.ssid} onClick={() => isActive ? connections.disconnectWifi() : connections.connectWifi(n.ssid)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] ${subtleHover} ${isActive ? subtleBg : ""}`}>
                      <div className="flex items-center gap-1.5 truncate">
                        <Wifi className={`w-3 h-3 ${isActive ? "text-blue-400" : ""}`} style={{ opacity: 0.4 + n.strength * 0.15 }} />
                        <span className="truncate">{n.ssid}</span>
                      </div>
                      <span className={`text-[10px] ${isActive ? "text-green-400" : "opacity-50"}`}>
                        {isConn ? <Loader2 className="w-3 h-3 animate-spin" /> : isActive ? "Connected" : n.security}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bluetooth */}
          <div className={`mt-3 pt-3 border-t ${light ? "border-black/10" : "border-white/10"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {conn.bluetooth.enabled ? <Bluetooth className="w-4 h-4 text-blue-400" /> : <BluetoothOff className="w-4 h-4 opacity-50" />}
                <span className="text-xs font-medium">Bluetooth</span>
              </div>
              <div className="flex items-center gap-1">
                {conn.bluetooth.enabled && (
                  <button onClick={() => connections.scanBluetooth()} disabled={conn.bluetooth.scanning}
                    className={`p-1 rounded ${subtleHover} disabled:opacity-50`} title="Scan for devices">
                    {conn.bluetooth.scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                  </button>
                )}
                <button onClick={() => connections.toggleBluetooth()} className={`relative w-9 h-5 rounded-full ${conn.bluetooth.enabled ? "bg-blue-500" : light ? "bg-black/15" : "bg-white/15"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${conn.bluetooth.enabled ? "left-[20px]" : "left-0.5"}`} />
                </button>
              </div>
            </div>
            {conn.bluetooth.enabled && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {conn.bluetooth.devices.map((d) => (
                  <button key={d.id} onClick={() => connections.toggleDevice(d.id)}
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-[11px] ${subtleHover}`}>
                    <span className="truncate flex-1 text-left flex items-center gap-1.5">
                      {d.name}
                      {!d.simulated && <span className="text-[9px] px-1 rounded bg-green-500/20 text-green-400">REAL</span>}
                    </span>
                    <span className={`text-[10px] tabular-nums ${d.connected ? "text-green-400" : "opacity-50"}`}>
                      {d.connected ? (d.battery != null ? `${d.battery}%` : "on") : "off"}
                    </span>
                  </button>
                ))}
                {conn.bluetooth.devices.length === 0 && (
                  <button onClick={() => connections.scanBluetooth()} disabled={conn.bluetooth.scanning}
                    className={`w-full text-[11px] text-center py-2 rounded-lg ${subtleHover} ${subtleBg}`}>
                    {conn.bluetooth.scanning ? "Scanning..." : "Click to scan for devices"}
                  </button>
                )}
                {conn.bluetooth.lastError && (
                  <div className="text-[10px] text-red-400 px-2 pt-1">{conn.bluetooth.lastError}</div>
                )}
              </div>
            )}
            <div className={`text-[10px] mt-2 ${textSecondary}`}>Wi-Fi list is simulated — browsers can't scan real networks.</div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { BatteryFull, BatteryMedium, BatteryLow, BatteryCharging } from "lucide-react";

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
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = src;
      });
      const canvas = document.createElement("canvas");
      const cw = 64, ch = 64;
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext("2d");
      const dRatio = window.innerWidth / window.innerHeight;
      const iRatio = img.width / img.height;
      let sx, sy, sw, sh;
      if (iRatio > dRatio) {
        sh = img.height; sw = img.height * dRatio;
        sx = (img.width - sw) / 2; sy = 0;
      } else {
        sw = img.width; sh = img.width / dRatio;
        sx = 0; sy = (img.height - sh) / 2;
      }
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
      return total / count > 120; // lowered threshold for better sensitivity
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
  } catch {
    return false;
  }
}

function parseColor(str) {
  if (str.startsWith("#")) {
    let hex = str.slice(1);
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length < 6) return null;
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }
  const m = str.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
    return [parts[0], parts[1], parts[2]];
  }
  return null;
}

export default function SystemBar({ onDateClick, dockHidden = false }) {
  const [time, setTime] = useState(new Date());
  const [battery, setBattery] = useState(null);
  const [charging, setCharging] = useState(false);
  const [light, setLight] = useState(false);
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
    const interval = setInterval(sample, 3000); // re-sample periodically
    const desktop = document.querySelector('[data-desktop-bg="true"]');
    let observer;
    if (desktop && "MutationObserver" in window) {
      observer = new MutationObserver(() => sample());
      observer.observe(desktop, { attributes: true, attributeFilter: ["style", "class"] });
    }
    window.addEventListener("resize", sample);
    return () => {
      cancelled = true;
      clearInterval(interval);
      observer?.disconnect();
      window.removeEventListener("resize", sample);
    };
  }, []);

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
    ? {
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(0,0,0,0.12)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
      }
    : {
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
      };

  const [showBatt, setShowBatt] = useState(false);
  useEffect(() => {
    if (!showBatt) return;
    const dismiss = (e) => { if (!e.target.closest?.("[data-batt-popup]")) setShowBatt(false); };
    const t = setTimeout(() => window.addEventListener("mousedown", dismiss), 0);
    return () => { clearTimeout(t); window.removeEventListener("mousedown", dismiss); };
  }, [showBatt]);

  const battColor = charging ? "from-green-400 to-green-600" : battery > 60 ? "from-green-400 to-emerald-500" : battery > 20 ? "from-yellow-400 to-orange-500" : "from-red-500 to-red-600";

  return (
    <div ref={ref} className="fixed bottom-3 right-3 z-50" style={{ transform: dockHidden ? "translateY(120px)" : "translateY(0)", opacity: dockHidden ? 0 : 1, transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.25s" }}>
      <div className="px-4 py-2 rounded-[20px] flex flex-row items-center gap-3" style={containerStyle}>
        <button onClick={() => setShowBatt((v) => !v)} className="flex items-center gap-1.5 rounded-md hover:bg-white/10 px-1 py-0.5 transition">
          {getBatteryIcon()}
          <span className={`text-xs font-space font-medium ${textPrimary}`}>
            {battery !== null ? `${battery}%` : "—"}
          </span>
        </button>

        <div className={`w-px h-4 ${dividerCls}`} />

        <button onClick={onDateClick} className="flex flex-col items-end">
          <span className={`${textPrimary} text-xs font-space font-semibold leading-none`}>{formattedTime}</span>
          <span className={`${textSecondary} text-xs font-space mt-0.5`}>{formattedDate}</span>
        </button>
      </div>

      {showBatt && (
        <div data-batt-popup className="absolute bottom-full right-0 mb-2 w-64 rounded-2xl p-4 shadow-2xl font-space" style={containerStyle}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${textPrimary}`}>Battery</span>
            {charging && <BatteryCharging className="w-4 h-4 text-green-400" />}
          </div>
          <div className={`text-2xl font-bold ${textPrimary}`}>{battery !== null ? `${battery}%` : "—"}</div>
          <div className={`mt-3 h-3 w-full rounded-full overflow-hidden ${light ? "bg-black/10" : "bg-white/10"}`}>
            <div className={`h-full rounded-full bg-gradient-to-r ${battColor} transition-all`} style={{ width: `${battery ?? 0}%` }} />
          </div>
          <div className={`mt-2 text-[11px] ${textSecondary}`}>{charging ? "Charging" : battery > 20 ? "On battery" : "Low battery"}</div>
        </div>
      )}
    </div>
  );
}

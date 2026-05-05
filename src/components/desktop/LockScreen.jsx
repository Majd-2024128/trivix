import { useEffect, useState } from "react";
import { BatteryFull, BatteryMedium, BatteryLow, BatteryCharging } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

export default function LockScreen({ wallpaper, fit = "cover", settings = {}, onUnlock }) {
  const { isDark } = useTheme();
  const [time, setTime] = useState(new Date());
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [battery, setBattery] = useState(null);
  const [charging, setCharging] = useState(false);
  const hasPassword = !!settings.password;

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
    const key = (e) => {
      if (e.code === "Space" && !hasPassword) onUnlock?.();
      if (e.key === "Enter" && hasPassword) {
        if (password === settings.password) onUnlock?.();
        else { setError(true); setPassword(""); }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [hasPassword, onUnlock, password, settings.password]);

  const clockSize = settings.size || 92;
  const style = settings.style || "bold";

  const hours = time.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }).replace(/\s?(AM|PM)/i, "");
  const minutes = time.toLocaleTimeString("en-US", { minute: "2-digit" }).padStart(2, "0");
  const ampm = time.getHours() >= 12 ? "PM" : "AM";

  const getBatteryIcon = () => {
    if (charging) return <BatteryCharging className="w-4 h-4 text-green-400" />;
    if (battery === null) return null;
    if (battery > 60) return <BatteryFull className="w-4 h-4 text-white/70" />;
    if (battery > 20) return <BatteryMedium className="w-4 h-4 text-yellow-400" />;
    return <BatteryLow className="w-4 h-4 text-red-400" />;
  };

  return (
    <div className="fixed inset-0 z-[999] overflow-hidden font-space text-white" style={{ backgroundImage: wallpaper, backgroundSize: fit, backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundColor: "#030814" }}>
      <div className="absolute inset-0 bg-black/25" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        {/* Battery at top */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          {getBatteryIcon()}
          <span className="text-xs text-white/80 font-medium">{battery !== null ? `${battery}%` : ""}</span>
        </div>

        <div className="tabular-nums leading-none drop-shadow-2xl flex items-baseline gap-1" style={{ fontSize: clockSize, fontWeight: style === "thin" ? 300 : 800 }}>
          <span>{hours}:{minutes}</span>
          <span style={{ fontSize: Math.max(16, clockSize * 0.22), fontWeight: 500, opacity: 0.6 }}>{ampm}</span>
        </div>
        <div className="mt-4 text-lg font-medium text-white/80">{time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>

        {hasPassword ? (
          <div className="mt-10 w-64">
            <input autoFocus type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} placeholder="Password" className="w-full rounded-full border border-white/20 bg-white/15 px-5 py-2.5 text-center text-white placeholder:text-white/50 outline-none backdrop-blur-xl" />
            {error && <div className="mt-2 text-xs text-red-200">Wrong password</div>}
          </div>
        ) : null}

        {/* Press space at bottom */}
        {!hasPassword && (
          <div className="absolute bottom-12 left-0 right-0 text-center">
            <span className="text-sm text-white/55">Press Space to unlock</span>
          </div>
        )}
      </div>
    </div>
  );
}

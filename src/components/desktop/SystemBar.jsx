import { useState, useEffect } from "react";
import { BatteryFull, BatteryMedium, BatteryLow, BatteryCharging } from "lucide-react";

export default function SystemBar() {
  const [time, setTime] = useState(new Date());
  const [battery, setBattery] = useState(null);
  const [charging, setCharging] = useState(false);

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

  const formattedTime = time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const formattedDate = time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const getBatteryIcon = () => {
    if (charging) return <BatteryCharging className="w-4 h-4 text-green-400" />;
    if (battery === null) return null;
    if (battery > 60) return <BatteryFull className="w-4 h-4 text-white/70" />;
    if (battery > 20) return <BatteryMedium className="w-4 h-4 text-yellow-400" />;
    return <BatteryLow className="w-4 h-4 text-red-400" />;
  };

  const batteryColor = charging ? "text-green-400" : battery === null ? "text-white/50" : battery > 60 ? "text-white/80" : battery > 20 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="fixed bottom-3 right-3 z-50">
      <div className="px-4 py-2 rounded-[20px] flex flex-row items-center gap-3"

      style={{
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)"
      }}>
        
        <div className="flex items-center gap-1.5">
          {getBatteryIcon()}
          <span className="text-xs font-space font-medium text-white/90">
            {battery !== null ? `${battery}%` : "—"}
          </span>
        </div>

        <div className="w-px h-4 bg-white/20" />

        <div className="flex flex-col items-end">
          <span className="text-white/90 text-xs font-space font-semibold leading-none">{formattedTime}</span>
          <span className="text-white/60 text-xs font-space mt-0.5">{formattedDate}</span>
        </div>
      </div>
    </div>);

}
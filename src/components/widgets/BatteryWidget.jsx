import { useEffect, useState } from "react";
import { Battery, BatteryCharging, Zap } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

export default function BatteryWidget() {
  const { isDark } = useTheme();
  const [level, setLevel] = useState(0.8);
  const [charging, setCharging] = useState(false);

  useEffect(() => {
    let bat;
    const apply = (b) => { setLevel(b.level); setCharging(b.charging); };
    if (navigator.getBattery) {
      navigator.getBattery().then((b) => {
        bat = b; apply(b);
        b.addEventListener("levelchange", () => apply(b));
        b.addEventListener("chargingchange", () => apply(b));
      });
    }
    return () => { if (bat) { /* listeners cleared on gc */ } };
  }, []);

  const pct = Math.round(level * 100);
  const grad = pct >= 70 ? "from-green-500 to-emerald-400"
    : pct >= 35 ? "from-yellow-500 to-amber-400"
    : "from-red-600 to-orange-500";

  const bg = isDark ? "bg-white/10" : "bg-black/5";

  return (
    <div className={`h-full w-full rounded-2xl ${isDark ? "bg-[#1c1c1e]/70" : "bg-white/70"} backdrop-blur-md p-4 flex flex-col font-space ${isDark ? "text-white" : "text-[#1c1c1e]"}`}>
      <div className="flex items-center gap-2 mb-3">
        {charging ? <BatteryCharging className="w-4 h-4 text-green-400" /> : <Battery className="w-4 h-4 opacity-70" />}
        <span className="text-xs font-medium opacity-70">Battery</span>
        {charging && <Zap className="w-3 h-3 text-yellow-400 ml-auto" />}
      </div>
      <div className="text-3xl font-bold tabular-nums mb-3">{pct}%</div>
      <div className={`h-3 rounded-full overflow-hidden ${bg}`}>
        <div className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-auto text-[10px] opacity-60 pt-3">
        {charging ? "Charging…" : pct > 20 ? "On battery power" : "Low battery"}
      </div>
    </div>
  );
}

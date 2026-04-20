import { useEffect, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";

export default function CalendarWidget() {
  const { isDark } = useTheme();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(iv);
  }, []);

  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const month = now.toLocaleDateString("en-US", { month: "long" });
  const day = now.getDate();
  const year = now.getFullYear();

  const bg = isDark
    ? "bg-gradient-to-br from-[#1c1c1e] to-[#2c2c2e]"
    : "bg-gradient-to-br from-white to-[#f1f5f9]";
  const accentRed = "text-red-500";
  const text = isDark ? "text-white" : "text-[#1c1c1e]";
  const muted = isDark ? "text-white/60" : "text-black/55";
  const faint = isDark ? "text-white/35" : "text-black/35";

  return (
    <div className={`w-full h-full ${bg} ${text} p-4 flex flex-col justify-center items-center font-space`}>
      <p className={`text-[10px] uppercase tracking-[0.2em] ${accentRed} font-semibold`}>{weekday}</p>
      <p className={`text-6xl font-light leading-none mt-1 tabular-nums`}>{day}</p>
      <p className={`text-sm ${muted} mt-1`}>{month} {year}</p>
      <div className={`mt-2 w-10 h-px ${isDark ? "bg-white/20" : "bg-black/20"}`} />
      <p className={`text-[10px] ${faint} mt-2 uppercase tracking-wider`}>Today</p>
    </div>
  );
}

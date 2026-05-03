import { useEffect, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";

export default function LockScreen({ wallpaper, fit = "cover", settings = {}, onUnlock }) {
  const { isDark } = useTheme();
  const [time, setTime] = useState(new Date());
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const hasPassword = !!settings.password;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
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

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden font-space text-white" style={{ backgroundImage: wallpaper, backgroundSize: fit, backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundColor: "#030814" }}>
      <div className="absolute inset-0 bg-black/25" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="tabular-nums leading-none drop-shadow-2xl" style={{ fontSize: clockSize, fontWeight: style === "thin" ? 300 : style === "rounded" ? 700 : 800, letterSpacing: 0 }}>
          {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </div>
        <div className="mt-4 text-lg font-medium text-white/80">{time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        {hasPassword ? (
          <div className="mt-10 w-64">
            <input autoFocus type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} placeholder="Password" className="w-full rounded-full border border-white/20 bg-white/15 px-5 py-2.5 text-center text-white placeholder:text-white/50 outline-none backdrop-blur-xl" />
            {error && <div className="mt-2 text-xs text-red-200">Wrong password</div>}
          </div>
        ) : <div className="mt-10 text-sm text-white/65">Press Space to unlock</div>}
      </div>
      <div className={`absolute left-0 right-0 top-0 h-7 ${isDark ? "bg-black/15" : "bg-white/10"}`} />
    </div>
  );
}
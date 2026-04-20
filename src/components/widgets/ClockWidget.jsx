import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { Play, Pause, RotateCcw } from "lucide-react";

export const CLOCK_STYLES = [
  { id: "analog",         label: "Analog Clock" },
  { id: "digital",        label: "Digital Clock" },
  { id: "digital-analog", label: "Digital + Analog Hands" },
  { id: "stopwatch",      label: "Stopwatch" },
  { id: "timer",          label: "Timer" },
];

function Analog({ time, isDark, size, showCenterDigital = false }) {
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 6;
  const h = time.getHours(), m = time.getMinutes(), s = time.getSeconds();
  const hourDeg = ((h % 12) + m / 60) * 30;
  const minDeg  = (m + s / 60) * 6;
  const secDeg  = s * 6;
  const tick = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.55)";
  const ring = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.18)";
  const main = isDark ? "white" : "#1c1c1e";
  const minor = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={ring} strokeWidth="2" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 - 90) * (Math.PI / 180);
        const outer = r - 2;
        const inner = i % 3 === 0 ? r - 12 : r - 8;
        return <line key={i}
          x1={cx + Math.cos(a) * inner} y1={cy + Math.sin(a) * inner}
          x2={cx + Math.cos(a) * outer} y2={cy + Math.sin(a) * outer}
          stroke={tick} strokeWidth={i % 3 === 0 ? 2 : 1} strokeLinecap="round" />;
      })}
      <line x1={cx} y1={cy}
        x2={cx + Math.cos((hourDeg - 90) * Math.PI / 180) * (r * 0.5)}
        y2={cy + Math.sin((hourDeg - 90) * Math.PI / 180) * (r * 0.5)}
        stroke={main} strokeWidth="3" strokeLinecap="round" />
      <line x1={cx} y1={cy}
        x2={cx + Math.cos((minDeg - 90) * Math.PI / 180) * (r * 0.72)}
        y2={cy + Math.sin((minDeg - 90) * Math.PI / 180) * (r * 0.72)}
        stroke={minor} strokeWidth="2" strokeLinecap="round" />
      <line x1={cx} y1={cy}
        x2={cx + Math.cos((secDeg - 90) * Math.PI / 180) * (r * 0.8)}
        y2={cy + Math.sin((secDeg - 90) * Math.PI / 180) * (r * 0.8)}
        stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={3} fill="#ef4444" />
      {showCenterDigital && (
        <text x={cx} y={cy + r * 0.45} textAnchor="middle"
          fill={isDark ? "white" : "#1c1c1e"}
          style={{ font: `600 ${Math.max(10, size * 0.1)}px 'Space Grotesk', sans-serif` }}>
          {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </text>
      )}
    </svg>
  );
}

function DigitalClock({ time, isDark }) {
  const text = isDark ? "text-white" : "text-[#1c1c1e]";
  const muted = isDark ? "text-white/55" : "text-black/55";
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className={`${text} text-4xl font-light tabular-nums tracking-tight`}>
        {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
      </div>
      <div className={`${muted} text-xs mt-1 tabular-nums`}>
        {time.toLocaleTimeString("en-US", { hour12: false })}
      </div>
      <div className={`${muted} text-[10px] mt-2 uppercase tracking-wider`}>
        {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
      </div>
    </div>
  );
}

function StopwatchView({ isDark }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef(0);
  const ivRef = useRef(null);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed;
      ivRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 50);
    } else {
      clearInterval(ivRef.current);
    }
    return () => clearInterval(ivRef.current);
  }, [running]);

  const fmt = (ms) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };

  const text = isDark ? "text-white" : "text-[#1c1c1e]";
  const btnBg = isDark ? "bg-white/10 hover:bg-white/15" : "bg-black/10 hover:bg-black/15";

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2">
      <div className={`${text} text-3xl font-light tabular-nums`}>{fmt(elapsed)}</div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => { setRunning(false); setElapsed(0); }} className={`w-9 h-9 rounded-full ${btnBg} flex items-center justify-center`}>
          <RotateCcw className={`w-3.5 h-3.5 ${isDark ? "text-white/70" : "text-black/70"}`} />
        </button>
        <button
          onClick={() => setRunning(!running)}
          className={`w-9 h-9 rounded-full flex items-center justify-center ${running ? "bg-red-500/25 text-red-400" : "bg-green-500/25 text-green-500"}`}
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
      </div>
    </div>
  );
}

function TimerView({ isDark, getMeta, setMeta }) {
  const meta = getMeta() || {};
  const initial = meta.timerSeconds ?? 300;
  const [totalSec, setTotalSec] = useState(initial);
  const [remaining, setRemaining] = useState(initial);
  const [running, setRunning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(`${Math.floor(initial / 60)}:${String(initial % 60).padStart(2, "0")}`);
  const ivRef = useRef(null);

  useEffect(() => {
    if (running && remaining > 0) {
      ivRef.current = setInterval(() => {
        setRemaining((r) => { if (r <= 1) { setRunning(false); return 0; } return r - 1; });
      }, 1000);
    } else clearInterval(ivRef.current);
    return () => clearInterval(ivRef.current);
  }, [running, remaining]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const text = isDark ? "text-white" : "text-[#1c1c1e]";
  const btnBg = isDark ? "bg-white/10 hover:bg-white/15" : "bg-black/10 hover:bg-black/15";
  const muted = isDark ? "text-white/55" : "text-black/55";

  const commitEdit = () => {
    const m = draft.match(/^(\d+):(\d{1,2})$/) || draft.match(/^(\d+)$/);
    if (m) {
      const minutes = parseInt(m[1] || "0", 10);
      const seconds = m[2] ? parseInt(m[2], 10) : 0;
      const next = Math.min(3600, Math.max(0, minutes * 60 + seconds));
      setTotalSec(next);
      setRemaining(next);
      setMeta({ ...(getMeta() || {}), timerSeconds: next });
    }
    setEditing(false);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2">
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === "Enter" && commitEdit()}
          placeholder="mm:ss"
          className={`bg-transparent ${text} text-3xl font-light tabular-nums text-center outline-none w-32 border-b ${isDark ? "border-white/30" : "border-black/30"}`}
        />
      ) : (
        <button onClick={() => { if (!running) setEditing(true); }} className={`${text} text-3xl font-light tabular-nums`} title={running ? "Stop to edit" : "Click to edit"}>
          {fmt(remaining)}
        </button>
      )}
      <p className={`${muted} text-[10px] mt-1`}>Click time to edit</p>
      <div className="flex gap-2 mt-2">
        <button onClick={() => { setRunning(false); setRemaining(totalSec); }} className={`w-9 h-9 rounded-full ${btnBg} flex items-center justify-center`}>
          <RotateCcw className={`w-3.5 h-3.5 ${isDark ? "text-white/70" : "text-black/70"}`} />
        </button>
        <button
          onClick={() => remaining > 0 && setRunning(!running)}
          className={`w-9 h-9 rounded-full flex items-center justify-center ${running ? "bg-red-500/25 text-red-400" : "bg-green-500/25 text-green-500"}`}
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
      </div>
      {remaining === 0 && <p className="text-red-400 text-xs mt-2 animate-pulse">Time's up!</p>}
    </div>
  );
}

export default function ClockWidget({ getMeta, setMeta, size }) {
  const { isDark } = useTheme();
  const meta = getMeta() || {};
  const style = meta.clockStyle || "analog";
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const bg = isDark ? "bg-[#1c1c2e]" : "bg-[#f5f5f7]";
  const text = isDark ? "text-white" : "text-[#1c1c1e]";

  return (
    <div className={`w-full h-full ${bg} ${text} flex items-center justify-center font-space p-2`}>
      {style === "analog" && (
        <Analog time={time} isDark={isDark} size={Math.min(size?.w || 160, size?.h || 160) - 16} />
      )}
      {style === "digital" && <DigitalClock time={time} isDark={isDark} />}
      {style === "digital-analog" && (
        <Analog time={time} isDark={isDark} size={Math.min(size?.w || 160, size?.h || 160) - 16} showCenterDigital />
      )}
      {style === "stopwatch" && <StopwatchView isDark={isDark} />}
      {style === "timer" && <TimerView isDark={isDark} getMeta={getMeta} setMeta={setMeta} />}
    </div>
  );
}

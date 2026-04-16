import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, Timer, Hourglass, Bell, Play, Pause, RotateCcw, Plus, Trash2 } from "lucide-react";

const TABS = [
  { id: "clock", label: "Clock", icon: Clock },
  { id: "stopwatch", label: "Stopwatch", icon: Hourglass },
  { id: "timer", label: "Timer", icon: Timer },
  { id: "alarm", label: "Alarm", icon: Bell },
];

function AnalogClock({ time }) {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const hourDeg = ((hours % 12) + minutes / 60) * 30;
  const minDeg = (minutes + seconds / 60) * 6;
  const secDeg = seconds * 6;

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mb-4">
      <circle cx={cx} cy={cy} r={95} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
      {/* Hour markers */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const outer = 90;
        const inner = i % 3 === 0 ? 78 : 82;
        return (
          <line
            key={i}
            x1={cx + Math.cos(angle) * inner}
            y1={cy + Math.sin(angle) * inner}
            x2={cx + Math.cos(angle) * outer}
            y2={cy + Math.sin(angle) * outer}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={i % 3 === 0 ? 2 : 1}
            strokeLinecap="round"
          />
        );
      })}
      {/* Hour hand */}
      <line
        x1={cx} y1={cy}
        x2={cx + Math.cos((hourDeg - 90) * Math.PI / 180) * 50}
        y2={cy + Math.sin((hourDeg - 90) * Math.PI / 180) * 50}
        stroke="white" strokeWidth="3" strokeLinecap="round"
      />
      {/* Minute hand */}
      <line
        x1={cx} y1={cy}
        x2={cx + Math.cos((minDeg - 90) * Math.PI / 180) * 70}
        y2={cy + Math.sin((minDeg - 90) * Math.PI / 180) * 70}
        stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"
      />
      {/* Second hand */}
      <line
        x1={cx} y1={cy}
        x2={cx + Math.cos((secDeg - 90) * Math.PI / 180) * 78}
        y2={cy + Math.sin((secDeg - 90) * Math.PI / 180) * 78}
        stroke="#ef4444" strokeWidth="1" strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={3} fill="#ef4444" />
    </svg>
  );
}

function ClockTab() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-4">
      <AnalogClock time={time} />
      <div className="text-3xl font-light tracking-wider mb-1">
        {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
      </div>
      <div className="text-white/40 text-sm mb-6">
        {time.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </div>
      <div className="w-full max-w-xs space-y-1.5">
        {[
          { city: "London", tz: "Europe/London" },
          { city: "New York", tz: "America/New_York" },
          { city: "Tokyo", tz: "Asia/Tokyo" },
        ].map(({ city, tz }) => (
          <div key={city} className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-white/5">
            <span className="text-white/50 text-xs">{city}</span>
            <span className="text-white/80 text-xs font-medium">
              {time.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StopwatchTab() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now() - elapsed;
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current);
      }, 10);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const fmt = (ms) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };

  const reset = () => { setRunning(false); setElapsed(0); setLaps([]); };
  const lap = () => setLaps([elapsed, ...laps]);

  return (
    <div className="flex flex-col items-center flex-1 p-6">
      <div className="text-5xl font-light tracking-wider mb-8 tabular-nums">{fmt(elapsed)}</div>
      <div className="flex gap-4 mb-6">
        <button onClick={running ? lap : reset} className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-xs font-medium hover:bg-white/15 transition-colors">
          {running ? "Lap" : <RotateCcw className="w-5 h-5" />}
        </button>
        <button onClick={() => setRunning(!running)} className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${running ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-green-500/20 text-green-400 hover:bg-green-500/30"}`}>
          {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
      </div>
      {laps.length > 0 && (
        <div className="w-full max-w-xs overflow-y-auto max-h-40 space-y-1">
          {laps.map((l, i) => (
            <div key={i} className="flex justify-between px-3 py-1.5 bg-white/5 rounded text-xs">
              <span className="text-white/40">Lap {laps.length - i}</span>
              <span className="text-white/80 tabular-nums">{fmt(l)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimerTab() {
  const [totalSec, setTotalSec] = useState(300);
  const [remaining, setRemaining] = useState(300);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) { setRunning(false); return 0; }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, remaining]);

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const adjustTime = (delta) => {
    if (!running) {
      const next = Math.max(0, Math.min(3600, totalSec + delta));
      setTotalSec(next);
      setRemaining(next);
    }
  };

  const reset = () => { setRunning(false); setRemaining(totalSec); };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6">
      <div className="text-6xl font-light tracking-wider mb-2 tabular-nums">{fmt(remaining)}</div>
      {!running && (
        <div className="flex gap-3 mb-6">
          {[{label: "-1m", delta: -60}, {label: "-10s", delta: -10}, {label: "+10s", delta: 10}, {label: "+1m", delta: 60}].map(({label, delta}) => (
            <button key={label} onClick={() => adjustTime(delta)} className="px-2 py-1 text-xs text-white/50 bg-white/5 rounded hover:bg-white/10 transition-colors">{label}</button>
          ))}
        </div>
      )}
      <div className="flex gap-4">
        <button onClick={reset} className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
          <RotateCcw className="w-5 h-5 text-white/60" />
        </button>
        <button onClick={() => remaining > 0 && setRunning(!running)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${running ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
          {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
      </div>
      {remaining === 0 && <p className="mt-4 text-red-400 text-sm animate-pulse">Time's up!</p>}
    </div>
  );
}

function AlarmTab() {
  const [alarms, setAlarms] = useState([
    { id: 1, time: "07:00", label: "Wake Up", enabled: true },
    { id: 2, time: "08:30", label: "Meeting", enabled: false },
  ]);

  const toggle = (id) => setAlarms(alarms.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));
  const remove = (id) => setAlarms(alarms.filter((a) => a.id !== id));
  const addAlarm = () => {
    setAlarms([...alarms, { id: Date.now(), time: "12:00", label: "Alarm", enabled: true }]);
  };

  const updateAlarm = (id, field, value) => {
    setAlarms(alarms.map((a) => a.id === id ? { ...a, [field]: value } : a));
  };

  return (
    <div className="flex flex-col flex-1 p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-white/50">Alarms</span>
        <button onClick={addAlarm} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <Plus className="w-4 h-4 text-white/60" />
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {alarms.map((alarm) => (
          <div key={alarm.id} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5">
            <div className="flex-1">
              <input
                type="time"
                value={alarm.time}
                onChange={(e) => updateAlarm(alarm.id, "time", e.target.value)}
                className="bg-transparent text-2xl font-light text-white outline-none"
                style={{ colorScheme: "dark" }}
              />
              <input
                type="text"
                value={alarm.label}
                onChange={(e) => updateAlarm(alarm.id, "label", e.target.value)}
                className="bg-transparent text-xs text-white/40 outline-none block mt-0.5 w-full"
              />
            </div>
            <button onClick={() => toggle(alarm.id)} className={`w-10 h-6 rounded-full transition-colors relative ${alarm.enabled ? "bg-green-500" : "bg-white/20"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${alarm.enabled ? "left-[18px]" : "left-0.5"}`} />
            </button>
            <button onClick={() => remove(alarm.id)} className="p-1 hover:bg-white/10 rounded transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-white/30" />
            </button>
          </div>
        ))}
        {alarms.length === 0 && (
          <div className="text-center text-white/25 text-sm mt-8">No alarms set</div>
        )}
      </div>
    </div>
  );
}

export default function ClockApp() {
  const [tab, setTab] = useState("clock");

  return (
    <div className="flex flex-col h-full bg-[#1c1c2e] text-white font-space">
      <div className="flex-1 overflow-y-auto">
        {tab === "clock" && <ClockTab />}
        {tab === "stopwatch" && <StopwatchTab />}
        {tab === "timer" && <TimerTab />}
        {tab === "alarm" && <AlarmTab />}
      </div>
      {/* Tab bar */}
      <div className="flex border-t border-white/10 bg-black/30">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${tab === id ? "text-orange-400" : "text-white/30 hover:text-white/50"}`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

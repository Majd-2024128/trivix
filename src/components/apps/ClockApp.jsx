import { useState, useEffect, useRef } from "react";
import { Clock, Timer, Hourglass, Bell, Play, Pause, RotateCcw, Plus, Trash2, Search, X, VolumeX } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";
import alarmSound from "@/assets/alarm-timer.mp3";

let _activeAudio = null;
function playAlarm() {
  try {
    stopAlarm();
    const a = new Audio(alarmSound);
    a.loop = true;
    a.play().catch(() => {});
    _activeAudio = a;
  } catch {}
}
function stopAlarm() {
  if (_activeAudio) { try { _activeAudio.pause(); _activeAudio.currentTime = 0; } catch {} _activeAudio = null; }
}

const TABS = [
  { id: "clock", label: "Clock", icon: Clock },
  { id: "stopwatch", label: "Stopwatch", icon: Hourglass },
  { id: "timer", label: "Timer", icon: Timer },
  { id: "alarm", label: "Alarm", icon: Bell },
];

const CITY_DATABASE = [
  { city: "London", tz: "Europe/London" },
  { city: "New York", tz: "America/New_York" },
  { city: "Tokyo", tz: "Asia/Tokyo" },
  { city: "Paris", tz: "Europe/Paris" },
  { city: "Dubai", tz: "Asia/Dubai" },
  { city: "Sydney", tz: "Australia/Sydney" },
  { city: "Los Angeles", tz: "America/Los_Angeles" },
  { city: "Chicago", tz: "America/Chicago" },
  { city: "Berlin", tz: "Europe/Berlin" },
  { city: "Moscow", tz: "Europe/Moscow" },
  { city: "Beijing", tz: "Asia/Shanghai" },
  { city: "Mumbai", tz: "Asia/Kolkata" },
  { city: "São Paulo", tz: "America/Sao_Paulo" },
  { city: "Cairo", tz: "Africa/Cairo" },
  { city: "Istanbul", tz: "Europe/Istanbul" },
  { city: "Seoul", tz: "Asia/Seoul" },
  { city: "Singapore", tz: "Asia/Singapore" },
  { city: "Hong Kong", tz: "Asia/Hong_Kong" },
  { city: "Toronto", tz: "America/Toronto" },
  { city: "Riyadh", tz: "Asia/Riyadh" },
  { city: "Bangkok", tz: "Asia/Bangkok" },
  { city: "Rome", tz: "Europe/Rome" },
  { city: "Madrid", tz: "Europe/Madrid" },
  { city: "Amsterdam", tz: "Europe/Amsterdam" },
  { city: "Doha", tz: "Asia/Qatar" },
];

function AnalogClock({ time, isDark }) {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const hourDeg = ((hours % 12) + minutes / 60) * 30;
  const minDeg = (minutes + seconds / 60) * 6;
  const secDeg = seconds * 6;
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.55)";
  const ringStroke = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
  const handMain = isDark ? "white" : "#1c1c1e";
  const handMinor = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mb-4">
      <circle cx={cx} cy={cy} r={95} fill="none" stroke={ringStroke} strokeWidth="2" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const outer = 90;
        const inner = i % 3 === 0 ? 78 : 82;
        return (
          <line key={i}
            x1={cx + Math.cos(angle) * inner} y1={cy + Math.sin(angle) * inner}
            x2={cx + Math.cos(angle) * outer} y2={cy + Math.sin(angle) * outer}
            stroke={stroke} strokeWidth={i % 3 === 0 ? 2 : 1} strokeLinecap="round"
          />
        );
      })}
      <line x1={cx} y1={cy} x2={cx + Math.cos((hourDeg - 90) * Math.PI / 180) * 50} y2={cy + Math.sin((hourDeg - 90) * Math.PI / 180) * 50} stroke={handMain} strokeWidth="3" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + Math.cos((minDeg - 90) * Math.PI / 180) * 70} y2={cy + Math.sin((minDeg - 90) * Math.PI / 180) * 70} stroke={handMinor} strokeWidth="2" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + Math.cos((secDeg - 90) * Math.PI / 180) * 78} y2={cy + Math.sin((secDeg - 90) * Math.PI / 180) * 78} stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={3} fill="#ef4444" />
    </svg>
  );
}

function ClockTab({ isDark, t }) {
  const [time, setTime] = useState(new Date());
  const [cities, setCities] = useState(() => {
    try { const s = localStorage.getItem("trivix_clock_cities"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    localStorage.setItem("trivix_clock_cities", JSON.stringify(cities));
  }, [cities]);

  const filtered = search.trim() ? CITY_DATABASE.filter((c) => c.city.toLowerCase().includes(search.toLowerCase()) && !cities.some((p) => p.tz === c.tz)) : [];

  const addCity = (city) => {
    if (cities.length >= 5) return;
    setCities((prev) => [...prev, city]);
    setSearch("");
    setShowSearch(false);
  };

  const removeCity = (tz) => setCities((prev) => prev.filter((c) => c.tz !== tz));

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-4">
      <AnalogClock time={time} isDark={isDark} />
      <div className="text-3xl font-light tracking-wider mb-1">
        {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
      </div>
      <div className={`${t.textSubtle} text-sm mb-6`}>
        {time.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </div>
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs ${t.textSubtle}`}>World Clocks ({cities.length}/5)</span>
          {cities.length < 5 && (
            <button onClick={() => setShowSearch(!showSearch)} className={`p-1 rounded-lg ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
              {showSearch ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        {showSearch && (
          <div className="mb-2 relative">
            <Search className={`absolute left-2.5 top-2 w-3.5 h-3.5 ${isDark ? "text-white/40" : "text-black/40"}`} />
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search city..."
              className={`w-full rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none ${isDark ? "bg-white/10 text-white placeholder:text-white/40" : "bg-black/5 text-black placeholder:text-black/40"}`} />
            {filtered.length > 0 && (
              <div className={`absolute left-0 right-0 top-full mt-1 z-10 rounded-lg overflow-hidden shadow-xl max-h-32 overflow-y-auto ${isDark ? "bg-[#2c2c2e] border border-white/10" : "bg-white border border-black/10"}`}>
                {filtered.slice(0, 8).map((c) => (
                  <button key={c.tz} onClick={() => addCity(c)} className={`w-full text-left px-3 py-1.5 text-xs ${isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-black/5 text-black/80"}`}>
                    {c.city}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="space-y-1.5">
          {cities.map(({ city, tz }) => (
            <div key={tz} className={`flex justify-between items-center px-3 py-1.5 rounded-lg ${isDark ? "bg-white/5" : "bg-black/5"} group`}>
              <span className={`${t.textSubtle} text-xs`}>{city}</span>
              <div className="flex items-center gap-2">
                <span className={`${t.textMuted} text-xs font-medium`}>
                  {time.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true })}
                </span>
                <button onClick={() => removeCity(tz)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className={`w-3 h-3 ${isDark ? "text-white/40" : "text-black/40"}`} />
                </button>
              </div>
            </div>
          ))}
          {cities.length === 0 && !showSearch && (
            <div className={`text-center text-xs py-4 ${isDark ? "text-white/25" : "text-black/30"}`}>
              Add cities to see their time
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StopwatchTab({ isDark }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now() - elapsed;
      intervalRef.current = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 10);
    } else clearInterval(intervalRef.current);
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

  const btnBg = isDark ? "bg-white/10 hover:bg-white/15" : "bg-black/10 hover:bg-black/15";

  return (
    <div className="flex flex-col items-center flex-1 p-6">
      <div className="text-5xl font-light tracking-wider mb-8 tabular-nums">{fmt(elapsed)}</div>
      <div className="flex gap-4 mb-6">
        <button onClick={running ? lap : reset} className={`w-16 h-16 rounded-full ${btnBg} flex items-center justify-center text-xs font-medium transition-colors`}>
          {running ? "Lap" : <RotateCcw className="w-5 h-5" />}
        </button>
        <button onClick={() => setRunning(!running)} className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${running ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-green-500/20 text-green-500 hover:bg-green-500/30"}`}>
          {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
      </div>
      {laps.length > 0 && (
        <div className="w-full max-w-xs overflow-y-auto max-h-40 space-y-1">
          {laps.map((l, i) => (
            <div key={i} className={`flex justify-between px-3 py-1.5 ${isDark ? "bg-white/5" : "bg-black/5"} rounded text-xs`}>
              <span className={isDark ? "text-white/40" : "text-black/40"}>Lap {laps.length - i}</span>
              <span className="tabular-nums">{fmt(l)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimerTab({ isDark, onNotify }) {
  const [totalSec, setTotalSec] = useState(300);
  const [remaining, setRemaining] = useState(300);
  const [running, setRunning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("5:00");
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            setRunning(false);
            playAlarm();
            onNotify?.({ title: "Timer", body: "Time's up!" });
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running, remaining, onNotify]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const commitEdit = () => {
    const match = draft.match(/^(\d+)(?::(\d{1,2}))?$/);
    if (match) {
      const next = Math.min(24 * 3600, Math.max(1, Number(match[1]) * 60 + Number(match[2] || 0)));
      setTotalSec(next); setRemaining(next); setDraft(`${Math.floor(next / 60)}:${String(next % 60).padStart(2, "0")}`);
    }
    setEditing(false);
  };
  const adjustTime = (delta) => { if (!running) { const next = Math.max(0, Math.min(3600, totalSec + delta)); setTotalSec(next); setRemaining(next); } };
  const reset = () => { setRunning(false); setRemaining(totalSec); };
  const chipBg = isDark ? "bg-white/5 hover:bg-white/10 text-white/50" : "bg-black/5 hover:bg-black/10 text-black/60";
  const btnBg = isDark ? "bg-white/10 hover:bg-white/15" : "bg-black/10 hover:bg-black/15";

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6">
      {editing ? (
        <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => e.key === "Enter" && commitEdit()}
          className={`w-52 bg-transparent text-6xl font-light tracking-wider mb-2 tabular-nums text-center outline-none border-b ${isDark ? "border-white/25" : "border-black/25"}`} />
      ) : (
        <button onClick={() => !running && setEditing(true)} className="text-6xl font-light tracking-wider mb-2 tabular-nums">{fmt(remaining)}</button>
      )}
      {!running && (
        <div className="flex gap-3 mb-6">
          {[{label:"-1m",delta:-60},{label:"-10s",delta:-10},{label:"+10s",delta:10},{label:"+1m",delta:60}].map(({label,delta}) => (
            <button key={label} onClick={() => adjustTime(delta)} className={`px-2 py-1 text-xs rounded transition-colors ${chipBg}`}>{label}</button>
          ))}
        </div>
      )}
      <div className="flex gap-4">
        <button onClick={reset} className={`w-14 h-14 rounded-full ${btnBg} flex items-center justify-center transition-colors`}>
          <RotateCcw className={`w-5 h-5 ${isDark ? "text-white/60" : "text-black/60"}`} />
        </button>
        <button onClick={() => remaining > 0 && setRunning(!running)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${running ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-500"}`}>
          {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
      </div>
      <div className="flex gap-3 items-center">
      {remaining === 0 && <button onClick={stopAlarm} className="text-red-400 text-xs flex items-center gap-1 hover:text-red-300"><VolumeX className="w-3 h-3" /> Stop</button>}
      </div>
      {remaining === 0 && <p className="mt-4 text-red-400 text-sm animate-pulse">Time's up!</p>}
    </div>
  );
}

function AlarmTab({ isDark, onNotify }) {
  const [alarms, setAlarms] = useState([]);
  const toggle = (id) => setAlarms(alarms.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));
  const remove = (id) => setAlarms(alarms.filter((a) => a.id !== id));
  const addAlarm = () => setAlarms([...alarms, { id: Date.now(), time: "12:00", label: "Alarm", enabled: true }]);
  const updateAlarm = (id, field, value) => setAlarms(alarms.map((a) => a.id === id ? { ...a, [field]: value } : a));

  // Check alarms
  useEffect(() => {
    const iv = setInterval(() => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      alarms.forEach((a) => {
        if (a.enabled && a.time === hhmm && now.getSeconds() === 0) {
          playAlarm();
          onNotify?.({ title: "Alarm", body: a.label });
        }
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [alarms, onNotify]);

  return (
    <div className="flex flex-col flex-1 p-4">
      <div className="flex items-center justify-between mb-4">
        <span className={`text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>Alarms</span>
        <button onClick={addAlarm} className={`p-1.5 rounded-lg ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"} transition-colors`}>
          <Plus className={`w-4 h-4 ${isDark ? "text-white/60" : "text-black/60"}`} />
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {alarms.map((alarm) => (
          <div key={alarm.id} className={`flex items-center gap-3 px-3 py-3 rounded-xl ${isDark ? "bg-white/5" : "bg-black/5"}`}>
            <div className="flex-1">
              <input type="time" value={alarm.time} onChange={(e) => updateAlarm(alarm.id, "time", e.target.value)}
                className="bg-transparent text-2xl font-light outline-none" style={{ colorScheme: isDark ? "dark" : "light" }} />
              <input type="text" value={alarm.label} onChange={(e) => updateAlarm(alarm.id, "label", e.target.value)}
                className={`bg-transparent text-xs ${isDark ? "text-white/40" : "text-black/50"} outline-none block mt-0.5 w-full`} />
            </div>
            <button onClick={() => toggle(alarm.id)} className={`w-10 h-6 rounded-full transition-colors relative ${alarm.enabled ? "bg-green-500" : isDark ? "bg-white/20" : "bg-black/20"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${alarm.enabled ? "left-[18px]" : "left-0.5"}`} />
            </button>
            <button onClick={() => remove(alarm.id)} className={`p-1 rounded transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
              <Trash2 className={`w-3.5 h-3.5 ${isDark ? "text-white/30" : "text-black/40"}`} />
            </button>
          </div>
        ))}
        {alarms.length === 0 && <div className={`text-center text-sm mt-8 ${isDark ? "text-white/25" : "text-black/30"}`}>No alarms set</div>}
      </div>
    </div>
  );
}

export default function ClockApp({ onNotify }) {
  const [tab, setTab] = useState("clock");
  const { isDark } = useTheme();
  const t = themed(isDark);

  return (
    <div className={`flex flex-col h-full ${isDark ? "bg-[#1c1c2e] text-white" : "bg-[#f5f5f7] text-[#1c1c1e]"} font-space`}>
      <div className="flex-1 overflow-y-auto">
        {tab === "clock" && <ClockTab isDark={isDark} t={t} />}
        {tab === "stopwatch" && <StopwatchTab isDark={isDark} />}
        {tab === "timer" && <TimerTab isDark={isDark} onNotify={onNotify} />}
        {tab === "alarm" && <AlarmTab isDark={isDark} onNotify={onNotify} />}
      </div>
      <div className={`flex border-t ${t.border} ${isDark ? "bg-black/30" : "bg-black/5"}`}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${tab === id ? "text-orange-400" : isDark ? "text-white/30 hover:text-white/50" : "text-black/40 hover:text-black/60"}`}>
            <Icon className="w-4 h-4" />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </div>
      <div className={`py-1.5 border-t ${t.border} text-center ${isDark ? "bg-black/40" : "bg-black/5"}`}>
        <p className={`${t.textFaint} text-[10px] font-space`}>Copyright © 2026 Tejt</p>
      </div>
    </div>
  );
}

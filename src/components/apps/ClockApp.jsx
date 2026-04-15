import { useState, useEffect } from "react";

export default function ClockApp() {
  const [time, setTime] = useState(new Date());
  const [tab, setTab] = useState("clock"); // clock | stopwatch | timer

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourDeg = ((hours % 12) + minutes / 60) * 30;
  const minDeg = (minutes + seconds / 60) * 6;
  const secDeg = seconds * 6;

  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col h-full bg-[#1c1c2e] text-white font-space items-center justify-center p-6">
      {/* Analog Clock */}
      <div className="relative w-56 h-56 rounded-full border-2 border-white/20 mb-6">
        {/* Hour markers */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 bg-white/40"
            style={{
              height: i % 3 === 0 ? 12 : 6,
              top: i % 3 === 0 ? 8 : 11,
              left: "50%",
              transformOrigin: "50% 104px",
              transform: `translateX(-50%) rotate(${i * 30}deg)`,
            }}
          />
        ))}

        {/* Hour hand */}
        <div
          className="absolute bg-white rounded-full"
          style={{
            width: 3,
            height: 55,
            bottom: "50%",
            left: "50%",
            transformOrigin: "50% 100%",
            transform: `translateX(-50%) rotate(${hourDeg}deg)`,
          }}
        />

        {/* Minute hand */}
        <div
          className="absolute bg-white/80 rounded-full"
          style={{
            width: 2,
            height: 75,
            bottom: "50%",
            left: "50%",
            transformOrigin: "50% 100%",
            transform: `translateX(-50%) rotate(${minDeg}deg)`,
          }}
        />

        {/* Second hand */}
        <div
          className="absolute bg-red-500 rounded-full"
          style={{
            width: 1,
            height: 80,
            bottom: "50%",
            left: "50%",
            transformOrigin: "50% 100%",
            transform: `translateX(-50%) rotate(${secDeg}deg)`,
          }}
        />

        {/* Center dot */}
        <div className="absolute w-2 h-2 bg-red-500 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Digital time */}
      <div className="text-4xl font-light tracking-wider mb-2">{formattedTime}</div>
      <div className="text-white/50 text-sm">{formattedDate}</div>

      {/* World clocks */}
      <div className="mt-8 w-full max-w-xs space-y-2">
        {[
          { city: "London", tz: "Europe/London" },
          { city: "New York", tz: "America/New_York" },
          { city: "Tokyo", tz: "Asia/Tokyo" },
        ].map(({ city, tz }) => (
          <div key={city} className="flex justify-between items-center px-4 py-2 rounded-lg bg-white/5">
            <span className="text-white/60 text-sm">{city}</span>
            <span className="text-white/90 text-sm font-medium">
              {time.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
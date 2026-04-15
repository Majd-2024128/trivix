import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Eye, Thermometer } from "lucide-react";

const MOCK_WEATHER = {
  city: "San Francisco",
  temp: 18,
  feels_like: 16,
  condition: "Partly Cloudy",
  humidity: 65,
  wind: 14,
  visibility: 10,
  uv: 5,
  high: 21,
  low: 13,
  hourly: [
    { time: "Now", temp: 18, icon: "cloud-sun" },
    { time: "1PM", temp: 19, icon: "sun" },
    { time: "2PM", temp: 20, icon: "sun" },
    { time: "3PM", temp: 21, icon: "sun" },
    { time: "4PM", temp: 20, icon: "cloud" },
    { time: "5PM", temp: 18, icon: "cloud" },
    { time: "6PM", temp: 17, icon: "cloud" },
    { time: "7PM", temp: 16, icon: "cloud" },
  ],
  daily: [
    { day: "Today", high: 21, low: 13, icon: "cloud-sun" },
    { day: "Tue", high: 23, low: 14, icon: "sun" },
    { day: "Wed", high: 22, low: 15, icon: "sun" },
    { day: "Thu", high: 19, low: 12, icon: "rain" },
    { day: "Fri", high: 17, low: 11, icon: "rain" },
    { day: "Sat", high: 20, low: 13, icon: "cloud" },
    { day: "Sun", high: 22, low: 14, icon: "sun" },
  ],
};

const WeatherIcon = ({ type, className = "w-5 h-5" }) => {
  switch (type) {
    case "sun": return <Sun className={className} />;
    case "rain": return <CloudRain className={className} />;
    case "snow": return <CloudSnow className={className} />;
    case "cloud": return <Cloud className={className} />;
    case "cloud-sun":
    default:
      return (
        <div className={`relative ${className}`}>
          <Cloud className="w-full h-full" />
        </div>
      );
  }
};

export default function WeatherApp() {
  const [weather] = useState(MOCK_WEATHER);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0c4a6e] to-[#075985] text-white font-space overflow-y-auto">
      {/* Header */}
      <div className="text-center pt-6 pb-4">
        <p className="text-white/60 text-sm">{weather.city}</p>
        <p className="text-7xl font-thin mt-1">{weather.temp}°</p>
        <p className="text-white/70 text-sm mt-1">{weather.condition}</p>
        <p className="text-white/50 text-sm">
          H:{weather.high}° L:{weather.low}°
        </p>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Hourly forecast */}
        <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
          <p className="text-xs text-white/50 mb-3 border-b border-white/10 pb-2">HOURLY FORECAST</p>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {weather.hourly.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[40px]">
                <span className="text-xs text-white/70">{h.time}</span>
                <WeatherIcon type={h.icon} className="w-5 h-5 text-white/80" />
                <span className="text-sm font-medium">{h.temp}°</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily forecast */}
        <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
          <p className="text-xs text-white/50 mb-2 border-b border-white/10 pb-2">7-DAY FORECAST</p>
          <div className="space-y-2">
            {weather.daily.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm w-12 text-white/70">{d.day}</span>
                <WeatherIcon type={d.icon} className="w-4 h-4 text-white/70" />
                <span className="text-xs text-white/40 w-8">{d.low}°</span>
                <div className="flex-1 h-1 rounded-full bg-white/10 relative overflow-hidden">
                  <div
                    className="absolute h-full rounded-full bg-gradient-to-r from-blue-400 to-orange-400"
                    style={{
                      left: `${((d.low - 10) / 20) * 100}%`,
                      right: `${100 - ((d.high - 10) / 20) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-white/90 w-8">{d.high}°</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Droplets className="w-4 h-4" />, label: "HUMIDITY", value: `${weather.humidity}%` },
            { icon: <Wind className="w-4 h-4" />, label: "WIND", value: `${weather.wind} km/h` },
            { icon: <Thermometer className="w-4 h-4" />, label: "FEELS LIKE", value: `${weather.feels_like}°` },
            { icon: <Eye className="w-4 h-4" />, label: "VISIBILITY", value: `${weather.visibility} km` },
          ].map((item, i) => (
            <div key={i} className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
              <div className="flex items-center gap-1 text-white/50 text-xs mb-1">
                {item.icon}
                {item.label}
              </div>
              <p className="text-2xl font-light">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
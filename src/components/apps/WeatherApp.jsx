import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Eye, Thermometer, CloudLightning, CloudDrizzle, Loader2 } from "lucide-react";

const API_KEY = "e340ed175acb50d6875920e74c14558a";

const iconMap = {
  "01d": "sun", "01n": "sun",
  "02d": "cloud-sun", "02n": "cloud-sun",
  "03d": "cloud", "03n": "cloud",
  "04d": "cloud", "04n": "cloud",
  "09d": "drizzle", "09n": "drizzle",
  "10d": "rain", "10n": "rain",
  "11d": "thunder", "11n": "thunder",
  "13d": "snow", "13n": "snow",
  "50d": "cloud", "50n": "cloud",
};

const WeatherIcon = ({ type, className = "w-5 h-5" }) => {
  switch (type) {
    case "sun": return <Sun className={className} />;
    case "rain": return <CloudRain className={className} />;
    case "drizzle": return <CloudDrizzle className={className} />;
    case "snow": return <CloudSnow className={className} />;
    case "thunder": return <CloudLightning className={className} />;
    case "cloud": return <Cloud className={className} />;
    case "cloud-sun":
    default: return <Cloud className={className} />;
  }
};

export default function WeatherApp() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [city, setCity] = useState("San Francisco");

  useEffect(() => {
    fetchWeather(city);
  }, []);

  const fetchWeather = async (q) => {
    setLoading(true);
    setError(null);
    try {
      const [wRes, fRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(q)}&appid=${API_KEY}&units=metric`),
      ]);
      if (!wRes.ok) throw new Error("City not found");
      const wData = await wRes.json();
      const fData = await fRes.json();
      setWeather(wData);
      setForecast(fData);
      setCity(wData.name);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      fetchWeather(e.target.value.trim());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-[#0c4a6e] to-[#075985]">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-[#0c4a6e] to-[#075985] text-white gap-4">
        <p className="text-white/60">{error || "Failed to load weather"}</p>
        <input
          type="text"
          placeholder="Search city..."
          onKeyDown={handleSearch}
          className="bg-white/10 text-white text-sm px-3 py-2 rounded-lg outline-none placeholder:text-white/30 w-48"
        />
      </div>
    );
  }

  const hourly = forecast?.list?.slice(0, 8).map((item) => ({
    time: new Date(item.dt * 1000).toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
    temp: Math.round(item.main.temp),
    icon: iconMap[item.weather[0].icon] || "cloud",
  })) || [];

  // Group forecast by day
  const dailyMap = {};
  forecast?.list?.forEach((item) => {
    const day = new Date(item.dt * 1000).toLocaleDateString("en-US", { weekday: "short" });
    if (!dailyMap[day]) dailyMap[day] = { temps: [], icon: item.weather[0].icon };
    dailyMap[day].temps.push(item.main.temp);
  });
  const daily = Object.entries(dailyMap).slice(0, 7).map(([day, d]) => ({
    day,
    high: Math.round(Math.max(...d.temps)),
    low: Math.round(Math.min(...d.temps)),
    icon: iconMap[d.icon] || "cloud",
  }));

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0c4a6e] to-[#075985] text-white font-space overflow-y-auto">
      <div className="px-4 pt-3">
        <input
          type="text"
          defaultValue={city}
          onKeyDown={handleSearch}
          className="bg-white/10 text-white text-xs px-3 py-1.5 rounded-lg outline-none placeholder:text-white/30 w-full"
          placeholder="Search city..."
        />
      </div>
      <div className="text-center pt-4 pb-3">
        <p className="text-white/60 text-sm">{weather.name}</p>
        <p className="text-7xl font-thin mt-1">{Math.round(weather.main.temp)}°</p>
        <p className="text-white/70 text-sm mt-1 capitalize">{weather.weather[0].description}</p>
        <p className="text-white/50 text-sm">H:{Math.round(weather.main.temp_max)}° L:{Math.round(weather.main.temp_min)}°</p>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
          <p className="text-xs text-white/50 mb-3 border-b border-white/10 pb-2">HOURLY FORECAST</p>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {hourly.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[40px]">
                <span className="text-xs text-white/70">{i === 0 ? "Now" : h.time}</span>
                <WeatherIcon type={h.icon} className="w-5 h-5 text-white/80" />
                <span className="text-sm font-medium">{h.temp}°</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
          <p className="text-xs text-white/50 mb-2 border-b border-white/10 pb-2">FORECAST</p>
          <div className="space-y-2">
            {daily.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm w-12 text-white/70">{d.day}</span>
                <WeatherIcon type={d.icon} className="w-4 h-4 text-white/70" />
                <span className="text-xs text-white/40 w-8">{d.low}°</span>
                <div className="flex-1 h-1 rounded-full bg-white/10 relative overflow-hidden">
                  <div className="absolute h-full rounded-full bg-gradient-to-r from-blue-400 to-orange-400" style={{
                    left: `${((d.low - (d.low - 5)) / 30) * 100}%`,
                    right: `${100 - ((d.high - (d.low - 5)) / 30) * 100}%`,
                  }} />
                </div>
                <span className="text-sm text-white/90 w-8">{d.high}°</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Droplets className="w-4 h-4" />, label: "HUMIDITY", value: `${weather.main.humidity}%` },
            { icon: <Wind className="w-4 h-4" />, label: "WIND", value: `${Math.round(weather.wind.speed * 3.6)} km/h` },
            { icon: <Thermometer className="w-4 h-4" />, label: "FEELS LIKE", value: `${Math.round(weather.main.feels_like)}°` },
            { icon: <Eye className="w-4 h-4" />, label: "VISIBILITY", value: `${(weather.visibility / 1000).toFixed(1)} km` },
          ].map((item, i) => (
            <div key={i} className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
              <div className="flex items-center gap-1 text-white/50 text-xs mb-1">{item.icon}{item.label}</div>
              <p className="text-2xl font-light">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 pb-2 text-center">
          <p className="text-white/30 text-[10px] font-space">Copyright © 2026 Tejt</p>
        </div>
      </div>
    </div>
  );
}

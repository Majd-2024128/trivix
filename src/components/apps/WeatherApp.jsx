import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Eye, Thermometer, CloudLightning, CloudDrizzle, Loader2, Search, Star, X, MapPin } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { supabase } from "@/integrations/supabase/client";


const iconMap = {
  "01d": "sun", "01n": "sun", "02d": "cloud-sun", "02n": "cloud-sun",
  "03d": "cloud", "03n": "cloud", "04d": "cloud", "04n": "cloud",
  "09d": "drizzle", "09n": "drizzle", "10d": "rain", "10n": "rain",
  "11d": "thunder", "11n": "thunder", "13d": "snow", "13n": "snow",
  "50d": "cloud", "50n": "cloud",
};

const WeatherIcon = ({ type, className = "w-5 h-5" }) => {
  switch (type) {
    case "sun": return <Sun className={className} />;
    case "rain": return <CloudRain className={className} />;
    case "drizzle": return <CloudDrizzle className={className} />;
    case "snow": return <CloudSnow className={className} />;
    case "thunder": return <CloudLightning className={className} />;
    default: return <Cloud className={className} />;
  }
};

export default function WeatherApp() {
  const { isDark } = useTheme();
  const [pinnedCities, setPinnedCities] = useState(() => {
    try { return JSON.parse(localStorage.getItem("trivix_weather_pins")) || []; } catch { return []; }
  });
  const [activeCity, setActiveCity] = useState(null);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { localStorage.setItem("trivix_weather_pins", JSON.stringify(pinnedCities)); }, [pinnedCities]);
  useEffect(() => { if (activeCity) fetchWeather(activeCity); }, [activeCity]);

  const fetchWeather = async (q) => {
    setLoading(true); setError(null);
    try {
      const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weather`;
      const headers = {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      };
      const [w, f] = await Promise.all([
        fetch(`${base}?endpoint=weather&q=${encodeURIComponent(q)}`, { headers }),
        fetch(`${base}?endpoint=forecast&q=${encodeURIComponent(q)}`, { headers }),
      ]);
      if (!w.ok) throw new Error("City not found");
      const wData = await w.json();
      const fData = await f.json();
      setWeather(wData); setForecast(fData);
    } catch (e) { setError(e.message); setWeather(null); setForecast(null); }
    setLoading(false);
  };



  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setActiveCity(searchQuery.trim());
      setSearchQuery("");
    }
  };

  const pinCity = () => {
    if (!weather || pinnedCities.length >= 5) return;
    const name = weather.name;
    if (pinnedCities.includes(name)) return;
    setPinnedCities((prev) => [...prev, name]);
  };

  const unpinCity = (city) => {
    setPinnedCities((prev) => prev.filter((c) => c !== city));
    if (activeCity === city && pinnedCities.length > 1) {
      setActiveCity(pinnedCities.find((c) => c !== city) || null);
    } else if (pinnedCities.length <= 1) {
      setActiveCity(null); setWeather(null); setForecast(null);
    }
  };

  const isPinned = weather && pinnedCities.includes(weather.name);
  const bgClass = isDark ? "bg-gradient-to-b from-[#0c4a6e] to-[#075985]" : "bg-gradient-to-b from-[#0099C9] to-[#38bdf8]";

  // No active city - show landing
  if (!activeCity) {
    return (
      <div className={`flex flex-col h-full ${bgClass} text-white font-space`}>
        <div className="px-4 pt-4">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch}
            placeholder="Search city..." className="bg-white/15 text-white text-sm px-3 py-2 rounded-lg outline-none placeholder:text-white/40 w-full" />
        </div>
        {pinnedCities.length > 0 ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {pinnedCities.map((city) => (
              <button key={city} onClick={() => setActiveCity(city)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-white/60" />
                  <span className="text-sm font-medium">{city}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); unpinCity(city); }} className="p-1 hover:bg-white/20 rounded">
                  <X className="w-3 h-3 text-white/60" />
                </button>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/50 gap-2">
            <Search className="w-8 h-8 opacity-40" />
            <span className="text-sm">Search and pin your favorite cities</span>
            <span className="text-xs text-white/30">Up to 5 cities</span>
          </div>
        )}
        <div className="px-4 py-2 text-center">
          <p className="text-white/40 text-[10px]">Copyright © 2026 Tejt</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className={`flex items-center justify-center h-full ${bgClass}`}><Loader2 className="w-8 h-8 text-white/70 animate-spin" /></div>;
  }

  if (error || !weather) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${bgClass} text-white gap-4`}>
        <p className="text-white/70">{error || "Failed to load weather"}</p>
        <input type="text" placeholder="Search city..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch}
          className="bg-white/20 text-white text-sm px-3 py-2 rounded-lg outline-none placeholder:text-white/50 w-48" />
        {pinnedCities.length > 0 && <button onClick={() => { setActiveCity(null); setError(null); }} className="text-xs text-white/50 hover:text-white/80">Back to cities</button>}
      </div>
    );
  }

  const hourly = forecast?.list?.slice(0, 8).map((item) => ({
    time: new Date(item.dt * 1000).toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
    temp: Math.round(item.main.temp),
    icon: iconMap[item.weather[0].icon] || "cloud",
  })) || [];

  const dailyMap = {};
  forecast?.list?.forEach((item) => {
    const day = new Date(item.dt * 1000).toLocaleDateString("en-US", { weekday: "short" });
    if (!dailyMap[day]) dailyMap[day] = { temps: [], icon: item.weather[0].icon };
    dailyMap[day].temps.push(item.main.temp);
  });
  const daily = Object.entries(dailyMap).slice(0, 7).map(([day, d]) => ({
    day, high: Math.round(Math.max(...d.temps)), low: Math.round(Math.min(...d.temps)),
    icon: iconMap[d.icon] || "cloud",
  }));

  return (
    <div className={`flex flex-col h-full ${bgClass} text-white font-space overflow-y-auto`}>
      <div className="px-4 pt-3 flex items-center gap-2">
        {pinnedCities.length > 0 && (
          <button onClick={() => { setActiveCity(null); setWeather(null); }} className="p-1.5 rounded-lg hover:bg-white/15">
            <MapPin className="w-4 h-4" />
          </button>
        )}
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch}
          className="bg-white/15 text-white text-xs px-3 py-1.5 rounded-lg outline-none placeholder:text-white/40 flex-1" placeholder="Search city..." />
        <button onClick={pinCity} disabled={isPinned || pinnedCities.length >= 5} title={isPinned ? "Already pinned" : pinnedCities.length >= 5 ? "Max 5 cities" : "Pin city"}
          className={`p-1.5 rounded-lg hover:bg-white/15 disabled:opacity-30`}>
          <Star className={`w-4 h-4 ${isPinned ? "text-yellow-400 fill-yellow-400" : ""}`} />
        </button>
      </div>

      {/* Pinned city tabs */}
      {pinnedCities.length > 1 && (
        <div className="flex gap-1 px-4 pt-2 overflow-x-auto">
          {pinnedCities.map((city) => (
            <button key={city} onClick={() => setActiveCity(city)}
              className={`px-2.5 py-1 rounded-full text-[11px] shrink-0 transition-colors ${activeCity === city ? "bg-white/25 text-white" : "bg-white/10 text-white/60 hover:bg-white/15"}`}>
              {city}
            </button>
          ))}
        </div>
      )}

      <div className="text-center pt-4 pb-3">
        <p className="text-white/70 text-sm">{weather.name}</p>
        <p className="text-7xl font-thin mt-1">{Math.round(weather.main.temp)}°</p>
        <p className="text-white/80 text-sm mt-1 capitalize">{weather.weather[0].description}</p>
        <p className="text-white/60 text-sm">H:{Math.round(weather.main.temp_max)}° L:{Math.round(weather.main.temp_min)}°</p>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="rounded-xl bg-white/15 backdrop-blur-sm p-3">
          <p className="text-xs text-white/60 mb-3 border-b border-white/15 pb-2">HOURLY FORECAST</p>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {hourly.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[40px]">
                <span className="text-xs text-white/80">{i === 0 ? "Now" : h.time}</span>
                <WeatherIcon type={h.icon} className="w-5 h-5 text-white/90" />
                <span className="text-sm font-medium">{h.temp}°</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white/15 backdrop-blur-sm p-3">
          <p className="text-xs text-white/60 mb-2 border-b border-white/15 pb-2">FORECAST</p>
          <div className="space-y-2">
            {daily.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm w-12 text-white/80">{d.day}</span>
                <WeatherIcon type={d.icon} className="w-4 h-4 text-white/80" />
                <span className="text-xs text-white/50 w-8">{d.low}°</span>
                <div className="flex-1 h-1 rounded-full bg-white/15 relative overflow-hidden">
                  <div className="absolute h-full rounded-full bg-gradient-to-r from-blue-400 to-orange-400" style={{
                    left: `${((d.low - (d.low - 5)) / 30) * 100}%`,
                    right: `${100 - ((d.high - (d.low - 5)) / 30) * 100}%`,
                  }} />
                </div>
                <span className="text-sm text-white w-8">{d.high}°</span>
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
            <div key={i} className="rounded-xl bg-white/15 backdrop-blur-sm p-3">
              <div className="flex items-center gap-1 text-white/60 text-xs mb-1">{item.icon}{item.label}</div>
              <p className="text-2xl font-light">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 pb-2 text-center">
          <p className="text-white/40 text-[10px] font-space">Copyright © 2026 Tejt</p>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useWeatherCity } from "@/lib/weatherStore";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Loader2 } from "lucide-react";

const WEATHER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weather`;
const WEATHER_HEADERS = {
  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
};
const iconMap = {
  "01d": "sun", "01n": "sun", "02d": "cloud-sun", "02n": "cloud-sun",
  "03d": "cloud", "03n": "cloud", "04d": "cloud", "04n": "cloud",
  "09d": "drizzle", "09n": "drizzle", "10d": "rain", "10n": "rain",
  "11d": "thunder", "11n": "thunder", "13d": "snow", "13n": "snow",
  "50d": "cloud", "50n": "cloud",
};

const WIcon = ({ type, className }) => {
  switch (type) {
    case "sun": return <Sun className={className} />;
    case "rain": return <CloudRain className={className} />;
    case "drizzle": return <CloudDrizzle className={className} />;
    case "snow": return <CloudSnow className={className} />;
    case "thunder": return <CloudLightning className={className} />;
    default: return <Cloud className={className} />;
  }
};

export default function WeatherWidget() {
  const { isDark } = useTheme();
  const city = useWeatherCity();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [city]);

  const bg = isDark
    ? "bg-gradient-to-br from-[#0c4a6e] to-[#075985]"
    : "bg-gradient-to-br from-[#7dd3fc] to-[#38bdf8]";

  return (
    <div className={`w-full h-full ${bg} text-white p-3 flex flex-col justify-between font-space`}>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-white/70" />
        </div>
      ) : data ? (
        <>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-white/70 truncate max-w-[8rem]">{data.name}</p>
              <p className="text-3xl font-light leading-none mt-1">{Math.round(data.main.temp)}°</p>
            </div>
            <WIcon type={iconMap[data.weather[0].icon] || "cloud"} className="w-8 h-8 text-white/90" />
          </div>
          <div>
            <p className="text-xs text-white/80 capitalize truncate">{data.weather[0].description}</p>
            <p className="text-[10px] text-white/60">H:{Math.round(data.main.temp_max)}° L:{Math.round(data.main.temp_min)}°</p>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-white/70">No data</div>
      )}
      <p className="text-[9px] text-white/50 text-center mt-1">Open Weather app to change city</p>
    </div>
  );
}

import { useState, useEffect } from "react";
import { X, ArrowDown, Maximize2 } from "lucide-react";

export default function MenuBar({ controls }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });

  return (
    <div
      className="fixed top-0 left-0 right-0 h-7 flex items-center justify-between px-4 z-50 select-none"
      style={{
        background: "rgba(30, 40, 30, 0.65)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)"
      }}>
      
      <div className="flex items-center gap-3">
        {controls ? (
          <>
            <button onClick={controls.close} className="flex items-center justify-center hover:opacity-70 transition-opacity">
              <X className="w-3 h-3 text-red-500" strokeWidth={3} />
            </button>
            <button onClick={controls.minimize} className="flex items-center justify-center hover:opacity-70 transition-opacity">
              <ArrowDown className="w-3 h-3 text-white" strokeWidth={2.5} />
            </button>
            <button onClick={controls.maximize} className="flex items-center justify-center hover:opacity-70 transition-opacity">
              <Maximize2 className="w-3 h-3 text-green-400" strokeWidth={2.5} />
            </button>
            {controls.appName && (
              <span className="text-white/60 text-xs font-space font-medium ml-1">{controls.appName}</span>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-center opacity-20">
              <X className="w-3 h-3 text-red-400" strokeWidth={3} />
            </div>
            <div className="flex items-center justify-center opacity-20">
              <ArrowDown className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex items-center justify-center opacity-20">
              <Maximize2 className="w-3 h-3 text-green-400" strokeWidth={2.5} />
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-4" />
    </div>);

}
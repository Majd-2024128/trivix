import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { APP_DEFS } from "./Dock";
import { useTheme } from "@/lib/ThemeContext";

export default function QuestBar({ onOpenApp, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = query.trim()
    ? APP_DEFS.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))
    : APP_DEFS;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[20vh]" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-[480px] max-w-[90vw] rounded-2xl overflow-hidden shadow-2xl font-space animate-scale-in"
        style={{
          background: isDark ? "rgba(30,30,32,0.88)" : "rgba(255,255,255,0.88)",
          backdropFilter: "blur(40px)",
          border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className={`w-5 h-5 ${isDark ? "text-white/40" : "text-black/40"}`} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps and folders..."
            className={`flex-1 bg-transparent outline-none text-base ${isDark ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"}`}
          />
        </div>
        {results.length > 0 && (
          <div className={`border-t ${isDark ? "border-white/10" : "border-black/10"} max-h-[300px] overflow-y-auto`}>
            {results.map((app) => (
              <button
                key={app.id}
                onClick={() => {
                  onOpenApp({ id: app.id, name: app.name, iconDark: app.iconDark, iconLight: app.iconLight });
                  onClose();
                }}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-white/80 hover:bg-white/10" : "text-black/80 hover:bg-black/5"}`}
              >
                <img src={isDark ? app.iconDark : app.iconLight} alt="" className="w-8 h-8 rounded-lg object-cover" />
                <span>{app.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

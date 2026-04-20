import { useState, useRef } from "react";
import { Sun, Moon, Volume2, Image, Upload } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";
import { WALLPAPERS, gradientForTheme } from "@/lib/wallpapers";

export default function SettingsApp({
  onSelectWallpaper,
  onUploadWallpaper,
  currentWallpaperId,
  isCustomWallpaper,
  brightness,
  onBrightnessChange,
  volume,
  onVolumeChange,
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toggle, isDark } = useTheme();
  const t = themed(isDark);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageUrl = typeof ev.target?.result === "string" ? `url("${ev.target.result}")` : null;
      if (imageUrl) onUploadWallpaper(imageUrl);
      setUploading(false);
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? "bg-black text-white" : "bg-white text-[#1c1c1e]"} font-space overflow-y-auto`}>
      <div className={`px-6 pt-5 pb-4 border-b ${t.border}`}>
        <h1 className="text-lg font-semibold">System</h1>
      </div>

      <div className="flex-1 px-6 py-5 space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-3">
            {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span className={`text-sm font-medium ${t.textMuted}`}>Appearance</span>
          </div>
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}>
            <div>
              <div className="text-sm font-medium">Dark Mode</div>
              <div className={`text-xs ${t.textSubtle}`}>{isDark ? "Apps use a dark interface" : "Apps use a light interface"}</div>
            </div>
            <button
              onClick={toggle}
              className={`relative w-12 h-7 rounded-full transition-colors ${isDark ? "bg-indigo-500" : "bg-black/15"}`}
              aria-label="Toggle dark mode"
            >
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${isDark ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Image className="w-4 h-4 text-green-400" />
            <span className={`text-sm font-medium ${t.textMuted}`}>Wallpaper</span>
            <span className={`ml-auto text-[10px] ${t.textFaint}`}>Auto-adapts to theme</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {WALLPAPERS.map((wp) => {
              const preview = gradientForTheme(wp, isDark);
              const selected = !isCustomWallpaper && currentWallpaperId === wp.id;
              return (
                <button
                  key={wp.id}
                  onClick={() => onSelectWallpaper(wp.id)}
                  className={`h-14 rounded-lg transition-all ${selected ? "ring-2 ring-green-400 scale-95" : "hover:scale-95 opacity-80 hover:opacity-100"}`}
                  style={{ background: preview }}
                  title={wp.label}
                />
              );
            })}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`h-14 rounded-lg border ${isDark ? "border-white/20" : "border-black/20"} flex flex-col items-center justify-center gap-1 ${t.hover} transition-colors disabled:opacity-50 ${isCustomWallpaper ? "ring-2 ring-green-400" : ""}`}
            >
              <Upload className={`w-4 h-4 ${t.textMuted}`} />
              <span className={`${t.textSubtle} text-xs`}>{uploading ? "Loading..." : "Custom"}</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4 text-yellow-400" />
            <span className={`text-sm font-medium ${t.textMuted}`}>Brightness</span>
            <span className={`ml-auto text-sm ${t.textSubtle}`}>{brightness}%</span>
          </div>
          <input type="range" min={20} max={100} value={brightness} onChange={(e) => onBrightnessChange(Number(e.target.value))} className="w-full accent-yellow-400 cursor-pointer" />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="w-4 h-4 text-blue-400" />
            <span className={`text-sm font-medium ${t.textMuted}`}>Volume</span>
            <span className={`ml-auto text-sm ${t.textSubtle}`}>{volume}%</span>
          </div>
          <input type="range" min={0} max={100} value={volume} onChange={(e) => onVolumeChange(Number(e.target.value))} className="w-full accent-blue-400 cursor-pointer" />
        </section>
      </div>

      <div className={`px-6 py-4 border-t ${t.border} text-center`}>
        <p className={`${t.textFaint} text-xs font-space`}>Copyright © 2026 Trivix</p>
      </div>
    </div>
  );
}

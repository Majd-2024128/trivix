import { useState, useRef } from "react";
import { Sun, Moon, Volume2, Image, Upload } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";

const WALLPAPERS = [
  { id: "green", label: "Forest Green", style: "linear-gradient(145deg, #1a472a 0%, #2d6a4f 25%, #40916c 50%, #52b788 75%, #74c69d 100%)" },
  { id: "ocean", label: "Deep Ocean", style: "linear-gradient(145deg, #03045e 0%, #0077b6 40%, #00b4d8 100%)" },
  { id: "sunset", label: "Sunset", style: "linear-gradient(145deg, #370617 0%, #9d0208 30%, #f48c06 70%, #ffba08 100%)" },
  { id: "night", label: "Midnight", style: "linear-gradient(145deg, #03001C 0%, #1a0533 40%, #301060 100%)" },
  { id: "rose", label: "Rose", style: "linear-gradient(145deg, #590d22 0%, #a4133c 40%, #ff4d6d 80%, #ffb3c1 100%)" },
  { id: "slate", label: "Slate", style: "linear-gradient(145deg, #1b263b 0%, #415a77 50%, #778da9 100%)" },
  { id: "aurora", label: "Aurora", style: "linear-gradient(145deg, #00251a 0%, #006d77 35%, #83c5be 70%, #edf6f9 100%)" },
  { id: "lava", label: "Lava", style: "linear-gradient(145deg, #03071e 0%, #6a040f 40%, #dc2f02 75%, #faa307 100%)" },
  { id: "violet", label: "Violet Dream", style: "linear-gradient(145deg, #240046 0%, #5a189a 35%, #9d4edd 70%, #c77dff 100%)" },
  { id: "mint", label: "Mint Cream", style: "linear-gradient(145deg, #d8f3dc 0%, #95d5b2 50%, #52b788 100%)" },
  { id: "peach", label: "Peach", style: "linear-gradient(145deg, #ffe5d9 0%, #ffcad4 40%, #f4acb7 80%, #9d8189 100%)" },
  { id: "sky", label: "Sky", style: "linear-gradient(145deg, #caf0f8 0%, #90e0ef 40%, #00b4d8 80%, #0077b6 100%)" },
  { id: "graphite", label: "Graphite", style: "linear-gradient(145deg, #212529 0%, #495057 50%, #adb5bd 100%)" },
  { id: "monochrome", label: "Monochrome", style: "linear-gradient(145deg, #000000 0%, #2d2d2d 50%, #595959 100%)" },
  { id: "cherry", label: "Cherry Blossom", style: "linear-gradient(145deg, #ff9aa2 0%, #ffb7b2 30%, #ffdac1 60%, #e2f0cb 100%)" },
];

export default function SettingsApp({ onWallpaperChange, currentWallpaper, brightness, onBrightnessChange, volume, onVolumeChange }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { theme, toggle, isDark } = useTheme();
  const t = themed(isDark);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageUrl = typeof ev.target?.result === "string" ? `url("${ev.target.result}")` : null;
      if (imageUrl) onWallpaperChange(imageUrl);
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
        {/* Appearance / Dark mode */}
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
          </div>
          <div className="grid grid-cols-3 gap-2">
            {WALLPAPERS.map((wp) => (
              <button
                key={wp.id}
                onClick={() => onWallpaperChange(wp.style)}
                className={`h-14 rounded-lg transition-all ${currentWallpaper === wp.style ? "ring-2 ring-green-400 scale-95" : "hover:scale-95 opacity-80 hover:opacity-100"}`}
                style={{ background: wp.style }}
                title={wp.label}
              />
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`h-14 rounded-lg border ${isDark ? "border-white/20" : "border-black/20"} flex flex-col items-center justify-center gap-1 ${t.hover} transition-colors disabled:opacity-50`}
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

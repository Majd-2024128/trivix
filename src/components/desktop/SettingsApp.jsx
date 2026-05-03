import { useState, useRef } from "react";
import { Sun, Image, Upload, Monitor, Info, Layout, RotateCcw, Lock } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";
import { WALLPAPERS, gradientForTheme } from "@/lib/wallpapers";

const SECTIONS = [
  { id: "wallpaper", label: "Wallpaper", Icon: Image },
  { id: "display", label: "Display", Icon: Monitor },
  { id: "desktop-dock", label: "Desktop & Dock", Icon: Layout },
  { id: "lock", label: "Lock Screen", Icon: Lock },
  { id: "about", label: "About", Icon: Info },
];

export default function SettingsApp({
  onSelectWallpaper, onUploadWallpaper, currentWallpaperId, isCustomWallpaper,
  brightness, onBrightnessChange, dockAutoHide, onDockAutoHideChange, onReset,
  wallpaperFit = "cover", onWallpaperFitChange, lockSettings = {}, onLockSettingsChange,
}) {
  const [section, setSection] = useState("wallpaper");
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
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
  };

  const bg = isDark ? "bg-[#1c1c1e]" : "bg-white";
  const sidebarBg = isDark ? "bg-[#151517]" : "bg-[#f0f0f2]";
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  return (
    <div className={`flex h-full ${bg} text-${isDark ? "white" : "[#1c1c1e]"} font-space overflow-hidden`}>
      {/* Sidebar */}
      <div className={`w-44 shrink-0 ${sidebarBg} border-r ${t.border} flex flex-col`}>
        <div className={`px-4 pt-4 pb-3 border-b ${t.border}`}>
          <h1 className="text-sm font-semibold">System</h1>
        </div>
        <div className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {SECTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                section === id
                  ? isDark ? "bg-white/10 text-white" : "bg-black/10 text-[#1c1c1e]"
                  : isDark ? "text-white/60 hover:bg-white/5" : "text-black/60 hover:bg-black/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
        <div className={`px-3 py-3 border-t ${t.border}`}>
          <button
            onClick={onReset}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset All
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {section === "wallpaper" && (
          <div className="p-6 space-y-4">
            <h2 className="text-base font-semibold mb-4">Wallpaper</h2>
            <div className="grid grid-cols-3 gap-2">
              {WALLPAPERS.map((wp) => {
                const preview = gradientForTheme(wp, isDark);
                const selected = !isCustomWallpaper && currentWallpaperId === wp.id;
                return (
                  <button
                    key={wp.id}
                    onClick={() => onSelectWallpaper(wp.id)}
                    className={`h-16 rounded-lg transition-all ${selected ? "ring-2 ring-green-400 scale-95" : "hover:scale-95 opacity-80 hover:opacity-100"}`}
                    style={wp.isImage ? { backgroundImage: preview, backgroundSize: "cover", backgroundPosition: "center" } : { background: preview }}
                    title={wp.label}
                  />
                );
              })}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`h-16 rounded-lg border ${isDark ? "border-white/20" : "border-black/20"} flex flex-col items-center justify-center gap-1 ${t.hover} transition-colors disabled:opacity-50 ${isCustomWallpaper ? "ring-2 ring-green-400" : ""}`}
              >
                <Upload className={`w-4 h-4 ${t.textMuted}`} />
                <span className={`${t.textSubtle} text-xs`}>{uploading ? "..." : "Custom"}</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
            <div className="rounded-xl px-4 py-3" style={{ background: cardBg }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Wallpaper Fit</div>
                  <div className={`text-xs ${t.textSubtle}`}>{wallpaperFit === "cover" ? "Fill screen" : "Show full image"}</div>
                </div>
                <div className={`flex rounded-lg p-0.5 ${isDark ? "bg-white/10" : "bg-black/10"}`}>
                  {["cover", "contain"].map((fit) => <button key={fit} onClick={() => onWallpaperFitChange?.(fit)} className={`px-3 py-1.5 text-xs rounded-md capitalize ${wallpaperFit === fit ? isDark ? "bg-white text-black" : "bg-black text-white" : t.textMuted}`}>{fit}</button>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {section === "display" && (
          <div className="p-6 space-y-6">
            <h2 className="text-base font-semibold mb-4">Display</h2>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sun className="w-4 h-4 text-yellow-400" />
                <span className={`text-sm font-medium ${t.textMuted}`}>Brightness</span>
                <span className={`ml-auto text-sm ${t.textSubtle}`}>{brightness}%</span>
              </div>
              <input type="range" min={20} max={100} value={brightness} onChange={(e) => onBrightnessChange(Number(e.target.value))} className="w-full accent-yellow-400 cursor-pointer" />
            </div>
            <div className="rounded-xl px-4 py-3" style={{ background: cardBg }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Dark Mode</div>
                  <div className={`text-xs ${t.textSubtle}`}>{isDark ? "Dark interface" : "Light interface"}</div>
                </div>
                <button onClick={toggle} className={`relative w-12 h-7 rounded-full transition-colors ${isDark ? "bg-indigo-500" : "bg-black/15"}`}>
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${isDark ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {section === "desktop-dock" && (
          <div className="p-6 space-y-6">
            <h2 className="text-base font-semibold mb-4">Desktop & Dock</h2>
            <div className="rounded-xl px-4 py-3" style={{ background: cardBg }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Auto-hide Dock</div>
                  <div className={`text-xs ${t.textSubtle}`}>{dockAutoHide ? "Dock appears on hover" : "Dock always visible"}</div>
                </div>
                <button onClick={() => onDockAutoHideChange(!dockAutoHide)} className={`relative w-12 h-7 rounded-full transition-colors ${dockAutoHide ? "bg-green-500" : "bg-black/15"}`}>
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${dockAutoHide ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {section === "lock" && (
          <div className="p-6 space-y-6">
            <h2 className="text-base font-semibold mb-4">Lock Screen</h2>
            <div className="rounded-xl px-4 py-3 space-y-4" style={{ background: cardBg }}>
              <label className="block text-sm font-medium">Clock Style</label>
              <div className={`flex rounded-lg p-0.5 ${isDark ? "bg-white/10" : "bg-black/10"}`}>
                {["bold", "thin", "rounded"].map((style) => <button key={style} onClick={() => onLockSettingsChange?.({ ...lockSettings, style })} className={`flex-1 px-3 py-1.5 text-xs rounded-md capitalize ${lockSettings.style === style ? isDark ? "bg-white text-black" : "bg-black text-white" : t.textMuted}`}>{style}</button>)}
              </div>
              <label className="block text-sm font-medium">Clock Size</label>
              <input type="range" min="64" max="132" value={lockSettings.size || 92} onChange={(e) => onLockSettingsChange?.({ ...lockSettings, size: Number(e.target.value) })} className="w-full accent-cyan-400" />
              <label className="block text-sm font-medium">Password</label>
              <input type="password" value={lockSettings.password || ""} onChange={(e) => onLockSettingsChange?.({ ...lockSettings, password: e.target.value })} placeholder="Optional" className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${t.inputBg}`} />
            </div>
          </div>
        )}

        {section === "about" && (
          <div className="p-6 flex flex-col items-center justify-center h-full">
            <h2 className="text-xl font-bold mb-2">Trivix OS</h2>
            <p className={`text-sm ${t.textMuted} mb-1`}>Version 1.0</p>
            <p className={`text-[10px] ${t.textFaint}`}>Copyright © 2026 Tejt</p>
          </div>
        )}
      </div>
    </div>
  );
}

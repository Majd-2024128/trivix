import { useState, useRef } from "react";
import { Sun, Volume2, Image, Upload } from "lucide-react";

const WALLPAPERS = [
  { id: "green", label: "Forest Green", style: "linear-gradient(145deg, #1a472a 0%, #2d6a4f 25%, #40916c 50%, #52b788 75%, #74c69d 100%)" },
  { id: "ocean", label: "Deep Ocean", style: "linear-gradient(145deg, #03045e 0%, #0077b6 40%, #00b4d8 100%)" },
  { id: "sunset", label: "Sunset", style: "linear-gradient(145deg, #370617 0%, #9d0208 30%, #f48c06 70%, #ffba08 100%)" },
  { id: "night", label: "Midnight", style: "linear-gradient(145deg, #03001C 0%, #1a0533 40%, #301060 100%)" },
  { id: "rose", label: "Rose", style: "linear-gradient(145deg, #590d22 0%, #a4133c 40%, #ff4d6d 80%, #ffb3c1 100%)" },
  { id: "slate", label: "Slate", style: "linear-gradient(145deg, #1b263b 0%, #415a77 50%, #778da9 100%)" },
];

export default function SettingsApp({ onWallpaperChange, currentWallpaper, brightness, onBrightnessChange, volume, onVolumeChange }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      // Lazy-load supabase only when needed for upload
      const { supabase } = await import("@/integrations/supabase/client");
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('wallpapers').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('wallpapers').getPublicUrl(fileName);
      onWallpaperChange(`url(${publicUrl}) center/cover no-repeat`);
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  return (
    <div className="flex flex-col h-full bg-black text-white font-space overflow-y-auto">
      <div className="px-6 pt-5 pb-4 border-b border-white/10">
        <h1 className="text-lg font-semibold">System</h1>
      </div>

      <div className="flex-1 px-6 py-5 space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Image className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-white/80">Wallpaper</span>
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
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              className="h-14 rounded-lg border border-white/20 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-white/60" />
              <span className="text-white/40 text-xs">{uploading ? "Uploading..." : "Custom"}</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-white/80">Brightness</span>
            <span className="ml-auto text-sm text-white/40">{brightness}%</span>
          </div>
          <input type="range" min={20} max={100} value={brightness} onChange={(e) => onBrightnessChange(Number(e.target.value))} className="w-full accent-yellow-400 cursor-pointer" />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white/80">Volume</span>
            <span className="ml-auto text-sm text-white/40">{volume}%</span>
          </div>
          <input type="range" min={0} max={100} value={volume} onChange={(e) => onVolumeChange(Number(e.target.value))} className="w-full accent-blue-400 cursor-pointer" />
        </section>
      </div>

      <div className="px-6 py-4 border-t border-white/10 text-center">
        <p className="text-white/25 text-xs font-space">Copyright © 2026 Tejt</p>
      </div>
    </div>
  );
}
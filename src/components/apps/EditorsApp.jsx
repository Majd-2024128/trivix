import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Play, Pause, Download, Trash2, Type, Square, Circle, Scissors, Image as ImageIcon, Film, Star } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaultOverlay = (type) => ({
  id: uid(),
  type,
  text: type === "text" ? "Title" : "",
  shape: type,
  x: 50,
  y: 42,
  w: type === "text" ? 180 : type === "rectangle" ? 160 : 120,
  h: type === "text" ? 44 : type === "rectangle" ? 80 : 120,
  color: type === "text" ? "#ffffff" : "#0099C9",
  background: type === "text" ? "rgba(0,0,0,0.35)" : "rgba(0,153,201,0.55)",
});

export default function EditorsApp() {
  const { isDark } = useTheme();
  const t = themed(isDark);
  const [clips, setClips] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  const clip = clips.find((c) => c.id === selectedClip) || clips[0];
  const overlays = clip?.overlays || [];
  const overlay = overlays.find((o) => o.id === selectedOverlay) || overlays[0];

  useEffect(() => {
    if (!selectedClip && clips[0]) setSelectedClip(clips[0].id);
  }, [clips, selectedClip]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !clip || clip.type !== "video") return;
    const onTime = () => {
      if (video.currentTime > clip.trimEnd) video.currentTime = clip.trimStart;
    };
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, [clip]);

  const handleFiles = (files) => {
    const accepted = Array.from(files || []).filter((f) => f.type.startsWith("video/") || f.type.startsWith("image/"));
    const next = accepted.map((f) => ({
      id: uid(),
      name: f.name,
      type: f.type.startsWith("image/") ? "image" : "video",
      url: URL.createObjectURL(f),
      file: f,
      duration: f.type.startsWith("image/") ? 5 : 10,
      trimStart: 0,
      trimEnd: f.type.startsWith("image/") ? 5 : 10,
      overlays: [],
    }));
    setClips((prev) => [...prev, ...next]);
  };

  const updateClip = (id, patch) => setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const updateOverlay = (patch) => {
    if (!clip || !overlay) return;
    updateClip(clip.id, { overlays: clip.overlays.map((o) => (o.id === overlay.id ? { ...o, ...patch } : o)) });
  };
  const addOverlay = (type) => {
    if (!clip) return;
    const next = defaultOverlay(type);
    updateClip(clip.id, { overlays: [...clip.overlays, next] });
    setSelectedOverlay(next.id);
  };
  const removeClip = (id) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
    if (selectedClip === id) setSelectedClip(null);
  };

  const setVideoDuration = () => {
    const video = videoRef.current;
    if (!video || !clip || !Number.isFinite(video.duration)) return;
    const end = clip.trimEnd === 10 ? video.duration : Math.min(clip.trimEnd, video.duration);
    updateClip(clip.id, { duration: video.duration, trimEnd: end });
  };

  const exportPoster = async () => {
    if (!clip) return;
    setExporting(true);
    const canvas = document.createElement("canvas");
    canvas.width = 1280; canvas.height = 720;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#101014"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const media = clip.type === "video" ? videoRef.current : imageRef.current;
    if (media) {
      const ratio = Math.min(canvas.width / media.videoWidth || canvas.width / media.naturalWidth, canvas.height / media.videoHeight || canvas.height / media.naturalHeight);
      const mw = (media.videoWidth || media.naturalWidth) * ratio;
      const mh = (media.videoHeight || media.naturalHeight) * ratio;
      ctx.drawImage(media, (canvas.width - mw) / 2, (canvas.height - mh) / 2, mw, mh);
    }
    overlays.forEach((o) => {
      const x = (o.x / 100) * canvas.width, y = (o.y / 100) * canvas.height, w = (o.w / 1000) * canvas.width, h = (o.h / 560) * canvas.height;
      ctx.fillStyle = o.background;
      if (o.type === "circle") { ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillRect(x, y, w, h); }
      if (o.type === "text") { ctx.fillStyle = o.color; ctx.font = "48px Space Grotesk, sans-serif"; ctx.fillText(o.text, x + 22, y + h / 2 + 16); }
    });
    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "trivix-edit-poster.png";
      a.click();
      setExporting(false);
    }, "image/png");
  };

  const totalDuration = useMemo(() => clips.reduce((sum, c) => sum + Math.max(0, c.trimEnd - c.trimStart), 0), [clips]);
  const panel = isDark ? "bg-[#151518] border-white/10" : "bg-[#f2f3f5] border-black/10";
  const button = isDark ? "bg-white/10 hover:bg-white/15" : "bg-black/5 hover:bg-black/10";

  return (
    <div className={`grid h-full grid-rows-[44px_1fr_156px_24px] ${isDark ? "bg-[#0f0f12] text-white" : "bg-white text-[#1c1c1e]"} font-space`}>
      <div className={`flex items-center gap-2 px-3 border-b ${t.border} ${isDark ? "bg-[#18181b]" : "bg-[#f7f8fa]"}`}>
        <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs ${button}`}><Upload className="w-3.5 h-3.5" /> Import</button>
        <button onClick={() => addOverlay("text")} disabled={!clip} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs disabled:opacity-40 ${button}`}><Type className="w-3.5 h-3.5" /> Text</button>
        <button onClick={() => addOverlay("shape")} disabled={!clip} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs disabled:opacity-40 ${button}`}><Square className="w-3.5 h-3.5" /> Shape</button>
        <button onClick={() => addOverlay("circle")} disabled={!clip} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs disabled:opacity-40 ${button}`}><Circle className="w-3.5 h-3.5" /> Circle</button>
        <div className="flex-1" />
        <button onClick={exportPoster} disabled={!clip || exporting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-[#0099C9] hover:bg-[#0088b4] text-white disabled:opacity-40"><Download className="w-3.5 h-3.5" /> {exporting ? "Exporting" : "Export Poster"}</button>
        <input ref={fileInputRef} type="file" accept="video/*,image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      <div className="grid grid-cols-[160px_1fr_220px] min-h-0">
        <div className={`border-r ${panel} p-3 overflow-y-auto`} onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }} onDragOver={(e) => e.preventDefault()}>
          <div className={`text-[10px] uppercase mb-2 ${t.textSubtle}`}>Media Bin</div>
          <div className="space-y-2">
            {clips.map((c) => <button key={c.id} onClick={() => setSelectedClip(c.id)} className={`w-full flex items-center gap-2 rounded-md px-2 py-2 text-left text-xs ${selectedClip === c.id ? "bg-[#0099C9] text-white" : button}`}>
              {c.type === "video" ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}<span className="truncate">{c.name}</span>
            </button>)}
            {clips.length === 0 && <div className={`h-28 rounded-lg border border-dashed ${t.border} flex items-center justify-center text-center px-3 text-xs ${t.textSubtle}`}>Drop videos or photos here</div>}
          </div>
        </div>

        <div className="relative flex items-center justify-center bg-black overflow-hidden" onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }} onDragOver={(e) => e.preventDefault()}>
          {clip?.type === "video" && <video key={clip.id} ref={videoRef} src={clip.url} className="max-w-full max-h-full" controls onLoadedMetadata={setVideoDuration} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />}
          {clip?.type === "image" && <img ref={imageRef} src={clip.url} alt="Preview" className="max-w-full max-h-full object-contain" />}
          {!clip && <div className="text-white/40 text-sm">Import media to start editing</div>}
          <div className="absolute inset-0 pointer-events-none">
            {overlays.map((o) => <button key={o.id} onClick={() => setSelectedOverlay(o.id)} className="absolute pointer-events-auto border border-white/30" style={{ left: `${o.x}%`, top: `${o.y}%`, width: o.w, height: o.h, color: o.color, background: o.background, borderRadius: o.type === "circle" ? "999px" : 6 }}>
              {o.type === "text" ? o.text : null}
            </button>)}
          </div>
        </div>

        <div className={`border-l ${panel} p-3 overflow-y-auto`}>
          <div className={`text-[10px] uppercase mb-3 ${t.textSubtle}`}>Inspector</div>
          {clip && <div className="space-y-3">
            <label className="block text-xs"><span className={t.textMuted}>Trim start</span><input type="range" min="0" max={clip.duration} step="0.1" value={clip.trimStart} onChange={(e) => updateClip(clip.id, { trimStart: Math.min(Number(e.target.value), clip.trimEnd - 0.1) })} className="w-full accent-[#0099C9]" /></label>
            <label className="block text-xs"><span className={t.textMuted}>Trim end</span><input type="range" min="0" max={clip.duration} step="0.1" value={clip.trimEnd} onChange={(e) => updateClip(clip.id, { trimEnd: Math.max(Number(e.target.value), clip.trimStart + 0.1) })} className="w-full accent-[#0099C9]" /></label>
            <div className={`text-xs ${t.textSubtle}`}>{clip.trimStart.toFixed(1)}s — {clip.trimEnd.toFixed(1)}s</div>
            {overlay && <div className={`border-t ${t.border} pt-3 space-y-2`}>
              {overlay.type === "text" && <input value={overlay.text} onChange={(e) => updateOverlay({ text: e.target.value })} className={`w-full rounded px-2 py-1 text-xs outline-none ${isDark ? "bg-white/10" : "bg-black/5"}`} />}
              <label className="block text-xs"><span className={t.textMuted}>X</span><input type="range" min="0" max="90" value={overlay.x} onChange={(e) => updateOverlay({ x: Number(e.target.value) })} className="w-full accent-[#0099C9]" /></label>
              <label className="block text-xs"><span className={t.textMuted}>Y</span><input type="range" min="0" max="85" value={overlay.y} onChange={(e) => updateOverlay({ y: Number(e.target.value) })} className="w-full accent-[#0099C9]" /></label>
              <input type="color" value={overlay.type === "text" ? overlay.color : "#0099C9"} onChange={(e) => updateOverlay(overlay.type === "text" ? { color: e.target.value } : { background: `${e.target.value}88` })} />
            </div>}
          </div>}
        </div>
      </div>

      <div className={`border-t ${t.border} ${isDark ? "bg-[#17171a]" : "bg-[#eef0f3]"} p-3`}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => videoRef.current?.[playing ? "pause" : "play"]?.()} disabled={clip?.type !== "video"} className={`w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40 ${button}`}>{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}</button>
          <Scissors className={`w-4 h-4 ${t.textSubtle}`} /><span className={`text-xs ${t.textSubtle}`}>{totalDuration.toFixed(1)}s timeline</span>
        </div>
        <div className="flex gap-2 h-20 overflow-x-auto">
          {clips.map((c) => <div key={c.id} onClick={() => setSelectedClip(c.id)} className={`relative min-w-[160px] rounded-md border px-3 py-2 cursor-pointer ${selectedClip === c.id ? "border-[#0099C9] bg-[#0099C9]/15" : isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
            <div className="flex items-center gap-2 text-xs"><span>{c.type === "video" ? "🎞" : "🖼"}</span><span className="truncate">{c.name}</span></div>
            <div className={`absolute left-3 right-3 bottom-3 h-2 rounded ${isDark ? "bg-white/10" : "bg-black/10"}`}><div className="h-full rounded bg-[#0099C9]" style={{ width: `${Math.max(8, ((c.trimEnd - c.trimStart) / c.duration) * 100)}%` }} /></div>
            <button onClick={(e) => { e.stopPropagation(); removeClip(c.id); }} className="absolute right-2 top-2 opacity-60 hover:opacity-100"><Trash2 className="w-3 h-3 text-red-400" /></button>
          </div>)}
        </div>
      </div>

      <div className={`border-t ${t.border} text-center ${isDark ? "bg-[#111114]" : "bg-[#f7f7f8]"}`}><p className={`${t.textFaint} text-[10px] leading-6`}>Copyright © 2026 Tejt</p></div>
    </div>
  );
}

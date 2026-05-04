import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Film, Image as ImageIcon, Layers3, Pause, Play, Plus, Scissors, Shapes, Trash2, Type, Upload } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const SHAPES = ["circle", "square", "triangle", "rectangle", "star", "diamond", "moon"];
const readDataUrl = (file) => new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target?.result); reader.onerror = () => resolve(null); reader.readAsDataURL(file); });

const defaultOverlay = (type) => ({
  id: uid(),
  type: type === "text" ? "text" : "shape",
  shape: type,
  text: type === "text" ? "Title" : "",
  x: 18,
  y: 18,
  w: type === "text" ? 34 : 18,
  h: type === "text" ? 11 : 20,
  color: type === "text" ? "#ffffff" : "#00a8d6",
  background: type === "text" ? "rgba(0,0,0,0.42)" : "rgba(0,168,214,0.62)",
});

function shapeClipPath(shape) {
  if (shape === "triangle") return "polygon(50% 0, 0 100%, 100% 100%)";
  if (shape === "diamond") return "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)";
  if (shape === "star") return "polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
  return undefined;
}

export default function EditorsApp() {
  const { isDark } = useTheme();
  const t = themed(isDark);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [clips, setClips] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [showShapes, setShowShapes] = useState(false);
  const [exporting, setExporting] = useState(false);

  const clip = clips.find((c) => c.id === selectedClip) || clips[0];
  const overlay = clip?.overlays?.find((o) => o.id === selectedOverlay) || null;
  const totalDuration = useMemo(() => clips.reduce((sum, c) => sum + Math.max(0.2, c.trimEnd - c.trimStart), 0), [clips]);

  useEffect(() => { if (!selectedClip && clips[0]) setSelectedClip(clips[0].id); }, [clips, selectedClip]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !clip || clip.type !== "video") return;
    video.currentTime = clip.trimStart || 0;
    const onTime = () => { if (video.currentTime >= clip.trimEnd) { video.currentTime = clip.trimStart; video.pause(); setPlaying(false); } };
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, [clip]);

  const updateClip = (id, patch) => setClips((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
  const updateOverlay = (patch) => {
    if (!clip || !overlay) return;
    updateClip(clip.id, { overlays: clip.overlays.map((o) => o.id === overlay.id ? { ...o, ...patch } : o) });
  };

  const handleFiles = async (files) => {
    const accepted = Array.from(files || []).filter((f) => f.type.startsWith("video/") || f.type.startsWith("image/"));
    if (!accepted.length) return;
    const imported = await Promise.all(accepted.map(async (file) => ({
      id: uid(),
      name: file.name,
      type: file.type.startsWith("image/") ? "image" : "video",
      url: URL.createObjectURL(file),
      dataUrl: await readDataUrl(file),
      duration: file.type.startsWith("image/") ? 5 : 12,
      trimStart: 0,
      trimEnd: file.type.startsWith("image/") ? 5 : 12,
      overlays: [],
    })));
    setClips((prev) => [...prev, ...imported]);
    setSelectedClip(imported[0].id);
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
    updateClip(clip.id, { duration: video.duration, trimEnd: Math.min(clip.trimEnd || video.duration, video.duration) });
  };

  const exportProject = async () => {
    if (!clips.length) return;
    setExporting(true);
    const payload = JSON.stringify({ clips: clips.map(({ url, ...c }) => c), exportedAt: new Date().toISOString() });
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Trivix Editors Project</title><style>body{margin:0;background:#111;color:white;font-family:system-ui}.stage{width:100vw;height:100vh;display:grid;place-items:center;overflow:hidden}.clip{position:relative;width:min(100vw,1280px);aspect-ratio:16/9;background:#000;display:none}.clip.active{display:block}.clip>img,.clip>video{width:100%;height:100%;object-fit:contain}.ov{position:absolute;display:grid;place-items:center;font-weight:700}.bar{position:fixed;left:16px;right:16px;bottom:14px;height:6px;background:#ffffff22;border-radius:99px}.fill{height:100%;background:#00a8d6;border-radius:99px}</style></head><body><div class="stage" id="stage"></div><div class="bar"><div class="fill" id="fill"></div></div><script>const project=${payload};const stage=document.getElementById('stage');let i=0,start=Date.now();function shape(s){if(s==='triangle')return'polygon(50% 0,0 100%,100% 100%)';if(s==='diamond')return'polygon(50% 0,100% 50%,50% 100%,0 50%)';if(s==='star')return'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)';return''}function show(){stage.innerHTML='';const c=project.clips[i];const wrap=document.createElement('div');wrap.className='clip active';const media=document.createElement(c.type==='video'?'video':'img');media.src=c.dataUrl;media.autoplay=true;media.controls=true;media.muted=true;if(c.type==='video'){media.currentTime=c.trimStart||0;media.play().catch(()=>{})}wrap.appendChild(media);(c.overlays||[]).forEach(o=>{const el=document.createElement('div');el.className='ov';el.textContent=o.text||'';Object.assign(el.style,{left:o.x+'%',top:o.y+'%',width:o.w+'%',height:o.h+'%',color:o.color,background:o.background,borderRadius:o.shape==='circle'||o.shape==='moon'?'999px':'8px',clipPath:shape(o.shape),boxShadow:o.shape==='moon'?'inset 28px 0 0 rgba(0,0,0,.45)':''});wrap.appendChild(el)});stage.appendChild(wrap);start=Date.now();setTimeout(()=>{i=(i+1)%project.clips.length;show()},Math.max(.5,(c.trimEnd-c.trimStart))*1000)}setInterval(()=>{const c=project.clips[i];document.getElementById('fill').style.width=Math.min(100,(Date.now()-start)/(Math.max(.5,c.trimEnd-c.trimStart)*10))+'%'},100);show();</script></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "trivix-editors-project.html";
    a.click();
    setExporting(false);
  };

  const dropZone = (e) => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); };
  const panel = isDark ? "bg-[#141417] border-white/10" : "bg-[#f2f3f6] border-black/10";
  const button = isDark ? "bg-white/10 hover:bg-white/15 text-white/85" : "bg-black/5 hover:bg-black/10 text-black/80";

  return (
    <div className={`grid h-full grid-rows-[46px_1fr_178px_24px] font-space ${isDark ? "bg-[#0d0d10] text-white" : "bg-white text-[#1c1c1e]"}`} onDrop={dropZone} onDragOver={(e) => e.preventDefault()}>
      <div className={`flex items-center gap-2 border-b px-3 ${t.border} ${isDark ? "bg-[#16161a]" : "bg-[#f7f8fa]"}`}>
        <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs ${button}`}><Upload className="h-3.5 w-3.5" /> Import</button>
        <button onClick={() => addOverlay("text")} disabled={!clip} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs disabled:opacity-40 ${button}`}><Type className="h-3.5 w-3.5" /> Text</button>
        <div className="relative">
          <button onClick={() => setShowShapes((v) => !v)} disabled={!clip} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs disabled:opacity-40 ${button}`}><Shapes className="h-3.5 w-3.5" /> Shapes</button>
          {showShapes && <div className={`absolute top-full z-30 mt-2 w-36 overflow-hidden rounded-lg border shadow-2xl ${panel}`}>{SHAPES.map((shape) => <button key={shape} onClick={() => { addOverlay(shape); setShowShapes(false); }} className={`block w-full px-3 py-2 text-left text-xs capitalize ${button}`}>{shape}</button>)}</div>}
        </div>
        <div className="ml-2 flex items-center gap-1 text-[11px] opacity-55"><Layers3 className="h-3.5 w-3.5" /> {clips.length} clips · {totalDuration.toFixed(1)}s</div>
        <div className="flex-1" />
        <button onClick={exportProject} disabled={!clips.length || exporting} className="flex items-center gap-1.5 rounded-md bg-cyan-600 px-3 py-1.5 text-xs text-white hover:bg-cyan-700 disabled:opacity-40"><Download className="h-3.5 w-3.5" /> {exporting ? "Exporting" : "Export Project"}</button>
        <input ref={fileInputRef} type="file" accept="video/*,image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      <div className="grid min-h-0 grid-cols-[190px_1fr_250px]">
        <aside className={`overflow-y-auto border-r p-3 ${panel}`}>
          <div className={`mb-2 text-[10px] uppercase ${t.textSubtle}`}>Media Browser</div>
          <div className="space-y-2">
            {clips.map((c) => <button key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("trivix/editor-clip", c.id)} onClick={() => setSelectedClip(c.id)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs ${selectedClip === c.id ? "bg-cyan-600 text-white" : button}`}>{c.type === "video" ? <Film className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}<span className="truncate">{c.name}</span></button>)}
            {!clips.length && <button onClick={() => fileInputRef.current?.click()} className={`flex h-36 w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center text-xs ${t.border} ${t.textSubtle}`}><Plus className="mb-2 h-5 w-5" />Drop videos and images here</button>}
          </div>
        </aside>

        <main className="relative flex items-center justify-center overflow-hidden bg-black">
          {clip?.type === "video" && <video key={clip.id} ref={videoRef} src={clip.url} className="max-h-full max-w-full" controls onLoadedMetadata={setVideoDuration} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />}
          {clip?.type === "image" && <img src={clip.url} alt="Preview" className="max-h-full max-w-full object-contain" />}
          {!clip && <div className="text-sm text-white/45">Drop media anywhere to start a project</div>}
          <div className="absolute inset-0">
            {(clip?.overlays || []).map((o) => <button key={o.id} onClick={() => setSelectedOverlay(o.id)} className={`absolute grid place-items-center border text-sm font-semibold ${selectedOverlay === o.id ? "border-cyan-300" : "border-white/35"}`} style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%`, height: `${o.h}%`, color: o.color, background: o.background, borderRadius: o.shape === "circle" || o.shape === "moon" ? "999px" : 8, clipPath: shapeClipPath(o.shape), boxShadow: o.shape === "moon" ? "inset 28px 0 0 rgba(0,0,0,0.45)" : undefined }}>{o.type === "text" ? o.text : null}</button>)}
          </div>
        </main>

        <aside className={`overflow-y-auto border-l p-3 ${panel}`}>
          <div className={`mb-3 text-[10px] uppercase ${t.textSubtle}`}>Inspector</div>
          {clip ? <div className="space-y-3 text-xs">
            <div className="truncate font-medium">{clip.name}</div>
            <label className="block"><span className={t.textMuted}>Trim start {clip.trimStart.toFixed(1)}s</span><input type="range" min="0" max={clip.duration} step="0.1" value={clip.trimStart} onChange={(e) => updateClip(clip.id, { trimStart: Math.min(Number(e.target.value), clip.trimEnd - 0.1) })} className="w-full accent-cyan-500" /></label>
            <label className="block"><span className={t.textMuted}>Trim end {clip.trimEnd.toFixed(1)}s</span><input type="range" min="0" max={clip.duration} step="0.1" value={clip.trimEnd} onChange={(e) => updateClip(clip.id, { trimEnd: Math.max(Number(e.target.value), clip.trimStart + 0.1) })} className="w-full accent-cyan-500" /></label>
            <div className={`h-8 rounded ${isDark ? "bg-white/10" : "bg-black/10"}`}><div className="h-full rounded bg-cyan-600/80" style={{ marginLeft: `${(clip.trimStart / clip.duration) * 100}%`, width: `${((clip.trimEnd - clip.trimStart) / clip.duration) * 100}%` }} /></div>
            {overlay && <div className={`space-y-2 border-t pt-3 ${t.border}`}>
              {overlay.type === "text" && <input value={overlay.text} onChange={(e) => updateOverlay({ text: e.target.value })} className={`w-full rounded px-2 py-1 outline-none ${isDark ? "bg-white/10" : "bg-black/5"}`} />}
              {[["X", "x", 0, 92], ["Y", "y", 0, 88], ["Width", "w", 6, 70], ["Height", "h", 5, 60]].map(([label, key, min, max]) => <label key={key} className="block"><span className={t.textMuted}>{label}</span><input type="range" min={min} max={max} value={overlay[key]} onChange={(e) => updateOverlay({ [key]: Number(e.target.value) })} className="w-full accent-cyan-500" /></label>)}
              <input type="color" value={overlay.type === "text" ? overlay.color : "#00a8d6"} onChange={(e) => updateOverlay(overlay.type === "text" ? { color: e.target.value } : { background: `${e.target.value}99` })} />
              <button onClick={() => { updateClip(clip.id, { overlays: clip.overlays.filter((o) => o.id !== overlay.id) }); setSelectedOverlay(null); }} className="block text-red-400">Remove overlay</button>
            </div>}
          </div> : <div className={`text-xs ${t.textSubtle}`}>Select a clip to edit.</div>}
        </aside>
      </div>

      <div className={`border-t p-3 ${t.border} ${isDark ? "bg-[#17171b]" : "bg-[#eef0f3]"}`}>
        <div className="mb-2 flex items-center gap-3"><button onClick={() => videoRef.current?.[playing ? "pause" : "play"]?.()} disabled={clip?.type !== "video"} className={`grid h-8 w-8 place-items-center rounded-full disabled:opacity-40 ${button}`}>{playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}</button><Scissors className={`h-4 w-4 ${t.textSubtle}`} /><span className={`text-xs ${t.textSubtle}`}>Magnetic timeline</span></div>
        <div className="flex h-24 gap-2 overflow-x-auto" onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("trivix/editor-clip"); if (!id) return; const target = e.target.closest("[data-clip-id]")?.dataset.clipId; if (!target || target === id) return; setClips((prev) => { const list = [...prev]; const from = list.findIndex((c) => c.id === id); const to = list.findIndex((c) => c.id === target); const [moved] = list.splice(from, 1); list.splice(to, 0, moved); return list; }); }} onDragOver={(e) => e.preventDefault()}>
          {clips.map((c) => <div key={c.id} data-clip-id={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("trivix/editor-clip", c.id)} onClick={() => setSelectedClip(c.id)} className={`relative min-w-[190px] rounded-lg border p-2 ${selectedClip === c.id ? "border-cyan-400 bg-cyan-500/15" : isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}><div className="flex items-center gap-2 text-xs"><span>{c.type === "video" ? "🎞" : "🖼"}</span><span className="truncate">{c.name}</span></div><div className="absolute bottom-3 left-3 right-3 h-3 rounded bg-black/20"><div className="h-full rounded bg-cyan-500" style={{ marginLeft: `${(c.trimStart / c.duration) * 100}%`, width: `${Math.max(5, ((c.trimEnd - c.trimStart) / c.duration) * 100)}%` }} /></div><button onClick={(e) => { e.stopPropagation(); removeClip(c.id); }} className="absolute right-2 top-2 opacity-60 hover:opacity-100"><Trash2 className="h-3 w-3 text-red-400" /></button></div>)}
        </div>
      </div>

      <div className={`border-t text-center ${t.border} ${isDark ? "bg-[#111114]" : "bg-[#f7f7f8]"}`}><p className={`${t.textFaint} text-[10px] leading-6`}>Copyright © 2026 Tejt</p></div>
    </div>
  );
}

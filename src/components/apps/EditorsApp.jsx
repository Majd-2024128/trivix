import { useState, useRef, useCallback } from "react";
import { Upload, Scissors, Play, Download, Plus, Trash2, GripVertical } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";

export default function EditorsApp() {
  const { isDark } = useTheme();
  const t = themed(isDark);
  const [clips, setClips] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const handleFiles = (files) => {
    const videoFiles = Array.from(files).filter((f) => f.type.startsWith("video/"));
    const newClips = videoFiles.map((f) => ({
      id: Date.now() + Math.random(),
      name: f.name,
      url: URL.createObjectURL(f),
      file: f,
      trimStart: 0,
      trimEnd: 100,
    }));
    setClips((prev) => [...prev, ...newClips]);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  const removeClip = (id) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
    if (selectedClip === id) setSelectedClip(null);
  };

  const handleExport = async () => {
    if (clips.length === 0) return;
    setExporting(true);
    // Simple export: download the first clip (full video editing would require server-side processing)
    const clip = clips[0];
    const a = document.createElement("a");
    a.href = clip.url;
    a.download = clip.name || "export.mp4";
    a.click();
    setExporting(false);
  };

  const sel = clips.find((c) => c.id === selectedClip);

  return (
    <div className={`flex flex-col h-full ${isDark ? "bg-[#1c1c1e] text-white" : "bg-white text-[#1c1c1e]"} font-space`}>
      {/* Toolbar */}
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${t.border}`}>
        <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${isDark ? "bg-white/10 hover:bg-white/15" : "bg-black/5 hover:bg-black/10"}`}>
          <Upload className="w-3.5 h-3.5" /> Import
        </button>
        <div className="flex-1" />
        <button onClick={handleExport} disabled={clips.length === 0 || exporting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40">
          <Download className="w-3.5 h-3.5" /> {exporting ? "Exporting..." : "Export"}
        </button>
        <input ref={fileInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0">
        {/* Preview */}
        <div className="flex-1 flex items-center justify-center p-4"
          ref={dropRef} onDrop={handleDrop} onDragOver={handleDragOver}
        >
          {sel ? (
            <video src={sel.url} controls className="max-w-full max-h-full rounded-lg shadow-lg" />
          ) : (
            <div className={`flex flex-col items-center gap-3 ${t.textSubtle}`} onDrop={handleDrop} onDragOver={handleDragOver}>
              <Upload className="w-12 h-12 opacity-30" />
              <p className="text-sm">Drop video files here or click Import</p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className={`border-t ${t.border} px-4 py-3`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-medium ${t.textMuted}`}>Timeline</span>
          <span className={`text-[10px] ${t.textSubtle}`}>{clips.length} clip{clips.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {clips.map((clip) => (
            <div
              key={clip.id}
              onClick={() => setSelectedClip(clip.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer shrink-0 transition-colors ${
                selectedClip === clip.id
                  ? "border-blue-500 bg-blue-500/10"
                  : isDark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-black/10 bg-black/5 hover:bg-black/10"
              }`}
            >
              <Play className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[120px]">{clip.name}</span>
              <button onClick={(e) => { e.stopPropagation(); removeClip(clip.id); }}>
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ))}
          {clips.length === 0 && (
            <div className={`text-xs ${t.textSubtle} py-2`}>No clips added yet</div>
          )}
        </div>
      </div>

      <div className={`px-4 py-2 border-t ${t.border} text-center`}>
        <p className={`${t.textFaint} text-[10px]`}>Copyright © 2026 Tejt</p>
      </div>
    </div>
  );
}

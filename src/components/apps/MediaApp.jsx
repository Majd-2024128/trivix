import { useState, useEffect, useMemo, useRef } from "react";
import { Music, Video as VideoIcon, Play, Pause, SkipForward, SkipBack, ArrowLeftRight, Disc3 } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";
import { readFs, getNode, flattenFs } from "@/lib/fileStore";
import { liveActivity } from "@/lib/liveActivityStore";

const isAudio = (e) => e?.type?.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(e?.name || "");
const isVideo = (e) => e?.type?.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi)$/i.test(e?.name || "");

export default function MediaApp({ file, name }) {
  const { isDark } = useTheme();
  const t = themed(isDark);
  const [fs, setFs] = useState(readFs);
  const initialMode = file ? (isVideo(file) ? "video" : "audio") : null;
  const [mode, setMode] = useState(initialMode);
  const [current, setCurrent] = useState(file ? { entry: file, name: name || file.name } : null);
  const [playing, setPlaying] = useState(false);
  const mediaRef = useRef(null);

  useEffect(() => {
    const sync = () => setFs(readFs());
    window.addEventListener("trivix-fs-change", sync);
    return () => window.removeEventListener("trivix-fs-change", sync);
  }, []);

  const library = useMemo(() => {
    const all = flattenFs(fs).filter((i) => i.kind === "file");
    return {
      audio: all.filter((i) => isAudio(i.entry)),
      video: all.filter((i) => isVideo(i.entry)),
    };
  }, [fs]);

  useEffect(() => {
    if (!mediaRef.current) return;
    if (playing) mediaRef.current.play().catch(() => setPlaying(false));
    else mediaRef.current.pause();
  }, [playing, current]);

  // Publish live activity to the menu bar
  useEffect(() => {
    if (playing && current) {
      liveActivity.set("media", { icon: Disc3, label: current.name, color: "#ec4899" });
    } else {
      liveActivity.clear("media");
    }
    return () => liveActivity.clear("media");
  }, [playing, current]);

  const playItem = (item) => { setCurrent(item); setPlaying(true); };
  const switchMode = () => { setMode((m) => (m === "audio" ? "video" : "audio")); setCurrent(null); setPlaying(false); };

  // Landing chooser
  if (!mode) {
    return (
      <div className={`flex h-full w-full items-center justify-center gap-8 font-space ${isDark ? "bg-[#111] text-white" : "bg-white text-[#1c1c1e]"}`}>
        <button onClick={() => setMode("audio")} className={`flex flex-col items-center gap-3 rounded-2xl px-10 py-8 transition ${t.hover}`}>
          <Music className="h-16 w-16 text-pink-400" />
          <span className="text-sm font-semibold">Audio</span>
        </button>
        <button onClick={() => setMode("video")} className={`flex flex-col items-center gap-3 rounded-2xl px-10 py-8 transition ${t.hover}`}>
          <VideoIcon className="h-16 w-16 text-blue-400" />
          <span className="text-sm font-semibold">Video</span>
        </button>
      </div>
    );
  }

  const items = mode === "audio" ? library.audio : library.video;

  return (
    <div className={`flex h-full w-full flex-col font-space ${isDark ? "bg-[#111] text-white" : "bg-white text-[#1c1c1e]"}`}>
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${t.border}`}>
        <button onClick={switchMode} className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${t.hover}`}>
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Switch to {mode === "audio" ? "Video" : "Audio"}
        </button>
        <div className={`ml-auto text-xs ${t.textMuted}`}>{items.length} item{items.length === 1 ? "" : "s"}</div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className={`w-56 overflow-y-auto border-r ${t.border}`}>
          {items.length === 0 ? (
            <div className={`p-4 text-xs ${t.textMuted}`}>No {mode} files. Add some to Music/ or Video/ in Files.</div>
          ) : (
            items.map((it) => (
              <button key={`${it.path.join("/")}/${it.name}`} onClick={() => playItem(it)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition ${t.hover} ${current?.name === it.name ? (isDark ? "bg-white/10" : "bg-black/10") : ""}`}>
                {mode === "audio" ? <Music className="h-3.5 w-3.5 text-pink-400" /> : <VideoIcon className="h-3.5 w-3.5 text-blue-400" />}
                <span className="truncate">{it.name}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center bg-black/60 p-6">
          {!current ? (
            <div className="text-sm text-white/40">Select a file to play</div>
          ) : mode === "video" ? (
            <video ref={mediaRef} src={current.entry?.dataUrl} controls className="max-h-full max-w-full rounded-lg shadow-2xl" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className={`relative h-48 w-48 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 shadow-2xl flex items-center justify-center ${playing ? "animate-spin-slow" : ""}`}>
                <Disc3 className="h-24 w-24 text-white/80" />
                <div className="absolute h-6 w-6 rounded-full bg-black" />
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-white">{current.name}</div>
              </div>
              <audio ref={mediaRef} src={current.entry?.dataUrl} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} className="hidden" />
              <div className="flex items-center gap-4">
                <button onClick={() => { const idx = items.findIndex((i) => i.name === current.name); if (idx > 0) playItem(items[idx - 1]); }} className="rounded-full p-2 text-white/80 hover:bg-white/10"><SkipBack className="h-5 w-5" /></button>
                <button onClick={() => setPlaying((p) => !p)} className="rounded-full bg-white p-3 text-black shadow-xl hover:scale-105 transition">
                  {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </button>
                <button onClick={() => { const idx = items.findIndex((i) => i.name === current.name); if (idx < items.length - 1) playItem(items[idx + 1]); }} className="rounded-full p-2 text-white/80 hover:bg-white/10"><SkipForward className="h-5 w-5" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

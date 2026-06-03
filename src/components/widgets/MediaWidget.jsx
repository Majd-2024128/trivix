import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Music } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { readFs, getNode } from "@/lib/fileStore";

const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|flac|aac)$/i;

function listTracks() {
  const fs = readFs();
  const music = getNode(fs, ["Music"]) || {};
  return Object.entries(music)
    .filter(([n, v]) => v?.__file && AUDIO_EXT.test(n))
    .map(([n, v]) => ({ name: n, url: v.url || v.dataUrl || "" }));
}

export default function MediaWidget() {
  const { isDark } = useTheme();
  const [tracks, setTracks] = useState(listTracks);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTracks(listTracks()), 4000);
    return () => clearInterval(t);
  }, []);

  const current = tracks[idx];

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  };
  const next = () => { setIdx((i) => (i + 1) % Math.max(tracks.length, 1)); setPlaying(false); };
  const prev = () => { setIdx((i) => (i - 1 + tracks.length) % Math.max(tracks.length, 1)); setPlaying(false); };

  const bg = isDark ? "bg-gradient-to-br from-purple-900/60 to-pink-900/60" : "bg-gradient-to-br from-purple-200/80 to-pink-200/80";
  const text = isDark ? "text-white" : "text-[#1c1c1e]";

  return (
    <div className={`h-full w-full rounded-2xl ${bg} ${text} p-4 flex flex-col items-center justify-center gap-3 backdrop-blur-md font-space`}>
      <div className={`relative h-20 w-20 rounded-full overflow-hidden border-2 ${isDark ? "border-white/30" : "border-black/20"} ${playing ? "animate-spin-slow" : ""}`}
        style={{ background: "radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.9) 30%, #222 100%)" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Music className="w-8 h-8 opacity-80 text-white" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/40" />
      </div>
      <div className="text-xs font-medium truncate w-full text-center">
        {current ? current.name : "No tracks in Music/"}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={prev} disabled={!current} className="p-1.5 rounded-full hover:bg-white/20 transition-colors disabled:opacity-30">
          <SkipBack className="w-4 h-4" />
        </button>
        <button onClick={toggle} disabled={!current} className="p-2 rounded-full bg-white/30 hover:bg-white/40 transition-colors disabled:opacity-30">
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button onClick={next} disabled={!current} className="p-1.5 rounded-full hover:bg-white/20 transition-colors disabled:opacity-30">
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
      {current?.url && (
        <audio ref={audioRef} src={current.url} onEnded={() => { setPlaying(false); next(); }} />
      )}
    </div>
  );
}

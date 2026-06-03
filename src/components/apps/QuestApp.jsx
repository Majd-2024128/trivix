import { useState, useRef, useEffect, useCallback } from "react";
import { Search, ArrowLeft, ArrowRight, RotateCw, Home, Globe, Plus, X, ExternalLink, Star, Bookmark, ZoomIn, ZoomOut } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";
import { getNode, readFs, uniqueName, writeFs } from "@/lib/fileStore";

const GOOGLE_SEARCH_URL = "https://www.google.com/search?igu=1&q=";
const HOME_URL = "https://www.google.com/webhp?igu=1";
const EXTENSION_URL = "https://chromewebstore.google.com/detail/ignore-x-frame-headers/gleekbfjekiniecknbkamfmkohkpodhe";
const EXTENSION_DISMISSED_KEY = "quest_extension_dismissed";

const buildUrl = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed) return HOME_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(trimmed)) return "https://" + trimmed;
  return GOOGLE_SEARCH_URL + encodeURIComponent(trimmed);
};

const newTab = () => ({ id: Date.now() + Math.random(), url: HOME_URL, inputValue: "", title: "New Tab", loading: true, zoom: 0.85 });

const extractTitle = (url) => {
  try {
    if (url === HOME_URL) return "Google";
    if (url.startsWith(GOOGLE_SEARCH_URL)) {
      const q = decodeURIComponent(url.replace(GOOGLE_SEARCH_URL, ""));
      return q.length > 30 ? q.slice(0, 30) + "…" : q;
    }
    const u = new URL(url);
    return u.hostname.replace("www.", "");
  } catch { return "New Tab"; }
};

export default function QuestApp({ onRequestClose, onDragStart }) {
  const [tabs, setTabs] = useState([newTab()]);
  const [activeId, setActiveId] = useState(tabs[0].id);
  const [showExtPopup, setShowExtPopup] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("quest_bookmarks")) || []; } catch { return []; }
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const iframeRefs = useRef({});
  const { isDark } = useTheme();
  const t = themed(isDark);

  const activeTab = tabs.find((tb) => tb.id === activeId) || tabs[0];

  useEffect(() => { localStorage.setItem("quest_bookmarks", JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => {
    const nextTab = () => {
      setActiveId((current) => {
        const index = tabs.findIndex((tb) => tb.id === current);
        return tabs[(index + 1) % tabs.length]?.id || current;
      });
    };
    window.addEventListener("trivix-quest-next-tab", nextTab);
    return () => window.removeEventListener("trivix-quest-next-tab", nextTab);
  }, [tabs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(EXTENSION_DISMISSED_KEY) === "true") return;
    const probe = document.createElement("iframe");
    probe.style.display = "none"; probe.style.width = "1px"; probe.style.height = "1px";
    let resolved = false;
    const finish = (installed) => {
      if (resolved) return; resolved = true;
      if (!installed) setShowExtPopup(true);
      try { probe.remove(); } catch {}
    };
    probe.onload = () => {
      try { const doc = probe.contentDocument || probe.contentWindow?.document; if (doc && doc.body) finish(true); else finish(false); } catch { finish(false); }
    };
    probe.onerror = () => finish(false);
    document.body.appendChild(probe);
    probe.src = "https://www.apple.com/";
    const tm = setTimeout(() => finish(false), 2500);
    return () => clearTimeout(tm);
  }, []);

  const updateTab = (id, patch) => setTabs((prev) => prev.map((tb) => (tb.id === id ? { ...tb, ...patch } : tb)));
  const saveDownloadToFiles = (url) => {
    if (!/\.(pdf|zip|png|jpe?g|gif|webp|mp4|mov|mp3|wav|txt|csv|docx?|xlsx?)(\?|$)/i.test(url)) return;
    const fs = readFs();
    const downloads = getNode(fs, ["Downloads"]);
    const clean = url.split("?")[0].split("/").pop() || "download.file";
    if (Object.values(downloads).some((entry) => entry?.sourceUrl === url)) return;
    const name = uniqueName(downloads, clean);
    downloads[name] = { __file: true, kind: "download", name, type: "link/download", sourceUrl: url, addedAt: Date.now() };
    writeFs(fs);
  };

  const navigate = (raw) => {
    const finalUrl = buildUrl(raw);
    const title = extractTitle(finalUrl);
    updateTab(activeId, { url: finalUrl, inputValue: finalUrl, loading: true, title });
  };

  const handleSubmit = (e) => { e.preventDefault(); if (activeTab.inputValue.trim()) navigate(activeTab.inputValue); };
  const goHome = () => updateTab(activeId, { url: HOME_URL, inputValue: "", loading: true, title: "Google" });
  const refresh = () => { const ref = iframeRefs.current[activeId]; if (ref) { ref.src = activeTab.url; updateTab(activeId, { loading: true }); } };
  const goBack = () => { try { iframeRefs.current[activeId]?.contentWindow?.history.back(); } catch {} };
  const goForward = () => { try { iframeRefs.current[activeId]?.contentWindow?.history.forward(); } catch {} };
  const addTab = () => { const tb = newTab(); setTabs((prev) => [...prev, tb]); setActiveId(tb.id); };
  const closeTab = (id) => {
    setTabs((prev) => {
      const filtered = prev.filter((tb) => tb.id !== id);
      if (filtered.length === 0) {
        if (onRequestClose) onRequestClose();
        return prev; // will be closed by parent
      }
      if (id === activeId) setActiveId(filtered[filtered.length - 1].id);
      return filtered;
    });
    delete iframeRefs.current[id];
  };
  const dismissPopup = () => { localStorage.setItem(EXTENSION_DISMISSED_KEY, "true"); setShowExtPopup(false); };

  const addBookmark = () => {
    if (!activeTab.url || activeTab.url === HOME_URL) return;
    if (bookmarks.some((b) => b.url === activeTab.url)) return;
    setBookmarks((prev) => [...prev, { url: activeTab.url, title: activeTab.title || extractTitle(activeTab.url) }]);
  };

  const removeBookmark = (url) => setBookmarks((prev) => prev.filter((b) => b.url !== url));
  const isBookmarked = bookmarks.some((b) => b.url === activeTab.url);

  const tabBarBg = isDark ? "bg-[#101012]/70" : "bg-[#e5e5ea]/60";
  const toolbarBg = isDark ? "bg-[#2c2c2e]/60" : "bg-[#f5f5f7]/60";
  const inputBg = isDark ? "bg-[#1c1c1e]/70 border-white/10 focus-within:border-white/25" : "bg-white/70 border-black/10 focus-within:border-black/30";
  const tabActive = isDark ? "bg-[#2c2c2e]/80 text-white" : "bg-white/80 text-[#1c1c1e]";
  const tabInactive = isDark ? "bg-[#1c1c1e]/40 text-white/50 hover:bg-[#2c2c2e]/50" : "bg-black/5 text-black/50 hover:bg-black/10";

  const zoomIn = () => updateTab(activeId, { zoom: Math.min((activeTab.zoom || 0.85) + 0.1, 2) });
  const zoomOut = () => updateTab(activeId, { zoom: Math.max((activeTab.zoom || 0.85) - 0.1, 0.4) });

  return (
    <div className={`relative flex flex-col h-full ${isDark ? "bg-[#1c1c1e]/80 text-white" : "bg-[#f5f5f7]/80 text-[#1c1c1e]"} font-space backdrop-blur-xl`}>
      {/* Tab bar - also serves as drag handle for window */}
      <div
        className={`flex items-end gap-0.5 px-2 pt-1.5 ${tabBarBg} border-b ${t.border} overflow-x-auto shrink-0`}
        style={{ cursor: "grab" }}
        onMouseDown={(e) => {
          // Allow tab clicks, only drag from empty space
          if (e.target.closest("button") || e.target.closest("[data-tab]")) return;
          if (onDragStart) onDragStart(e);
        }}
      >
        {tabs.map((tb) => (
          <div key={tb.id} data-tab onClick={() => setActiveId(tb.id)}
            onDoubleClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("trivix-toggle-maximize")); }}
            className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-t-lg text-[11px] cursor-pointer transition-colors flex-1 min-w-0 max-w-[160px] ${tb.id === activeId ? tabActive : tabInactive}`}>
            <Globe className="w-3 h-3 shrink-0 opacity-60" />
            <span className="truncate flex-1">{tb.title || "New Tab"}</span>
            <button onClick={(e) => { e.stopPropagation(); closeTab(tb.id); }} className="opacity-40 hover:opacity-100 transition-opacity shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button onClick={addTab} className={`p-1.5 rounded-md ${t.hover} transition-colors mb-0.5 shrink-0`}><Plus className={`w-3.5 h-3.5 ${t.textMuted}`} /></button>
      </div>

      <div className={`flex items-center gap-2 px-3 py-2 border-b ${t.border} ${toolbarBg}`}>
        <button onClick={goBack} className={`p-1.5 rounded-lg ${t.hover}`}><ArrowLeft className={`w-4 h-4 ${t.textMuted}`} /></button>
        <button onClick={goForward} className={`p-1.5 rounded-lg ${t.hover}`}><ArrowRight className={`w-4 h-4 ${t.textMuted}`} /></button>
        <button onClick={refresh} className={`p-1.5 rounded-lg ${t.hover}`}><RotateCw className={`w-4 h-4 ${t.textMuted} ${activeTab.loading ? "animate-spin" : ""}`} /></button>
        <button onClick={goHome} className={`p-1.5 rounded-lg ${t.hover}`}><Home className={`w-4 h-4 ${t.textMuted}`} /></button>

        <form onSubmit={handleSubmit} className="flex-1 flex items-center">
          <div className={`flex-1 flex items-center gap-2 rounded-lg px-3 py-1.5 border transition-colors ${inputBg}`}>
            <Search className={`w-3.5 h-3.5 ${t.textFaint} shrink-0`} />
            <input type="text" value={activeTab.inputValue}
              onChange={(e) => updateTab(activeId, { inputValue: e.target.value })}
              placeholder="Search Google or enter URL"
              className={`flex-1 bg-transparent text-sm outline-none ${isDark ? "text-white/90 placeholder:text-white/30" : "text-black/90 placeholder:text-black/30"}`} />
          </div>
        </form>

        <button onClick={zoomOut} className={`p-1.5 rounded-lg ${t.hover}`} title="Zoom out">
          <ZoomOut className={`w-4 h-4 ${t.textMuted}`} />
        </button>
        <span className={`text-[10px] tabular-nums ${t.textMuted} w-8 text-center`}>{Math.round((activeTab.zoom || 0.85) * 100)}%</span>
        <button onClick={zoomIn} className={`p-1.5 rounded-lg ${t.hover}`} title="Zoom in">
          <ZoomIn className={`w-4 h-4 ${t.textMuted}`} />
        </button>
        <button onClick={addBookmark} className={`p-1.5 rounded-lg ${t.hover}`} title="Bookmark">
          <Star className={`w-4 h-4 ${isBookmarked ? "text-yellow-400 fill-yellow-400" : t.textMuted}`} />
        </button>
        <button onClick={() => setShowBookmarks(!showBookmarks)} className={`p-1.5 rounded-lg ${t.hover}`} title="Bookmarks">
          <Bookmark className={`w-4 h-4 ${t.textMuted}`} />
        </button>
      </div>

      {showBookmarks && bookmarks.length > 0 && (
        <div className={`flex items-center gap-1 px-3 py-1.5 border-b ${t.border} ${toolbarBg} overflow-x-auto`}>
          {bookmarks.map((b, i) => (
            <button key={i} onClick={() => { updateTab(activeId, { url: b.url, inputValue: b.url, loading: true, title: b.title }); }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] ${isDark ? "bg-white/5 hover:bg-white/10 text-white/70" : "bg-black/5 hover:bg-black/10 text-black/70"} shrink-0`}>
              <Globe className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{b.title}</span>
              <button onClick={(e) => { e.stopPropagation(); removeBookmark(b.url); }} className="opacity-40 hover:opacity-100 ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 relative bg-white">
        {tabs.map((tb) => (
          <div key={tb.id} className="absolute inset-0" style={{ display: tb.id === activeId ? "block" : "none" }}>
            <iframe ref={(el) => { if (el) iframeRefs.current[tb.id] = el; }}
              src={tb.url} onLoad={() => {
                let currentUrl = tb.url;
                try { currentUrl = iframeRefs.current[tb.id]?.contentWindow?.location?.href || tb.url; } catch {}
                saveDownloadToFiles(currentUrl);
                updateTab(tb.id, { loading: false, url: currentUrl, inputValue: currentUrl === HOME_URL ? "" : currentUrl, title: extractTitle(currentUrl) });
              }}
              className="w-full h-full border-0" style={{ zoom: tb.zoom || 0.85 }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              title={`Quest tab ${tb.id}`} />
          </div>
        ))}
        {activeTab.loading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/30 z-10"><div className="h-full bg-blue-500 animate-pulse w-1/2" /></div>
        )}
      </div>


      {showExtPopup && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={`max-w-sm mx-4 rounded-2xl border ${isDark ? "border-white/15 bg-[#1c1c1e] text-white" : "border-black/15 bg-white text-[#1c1c1e]"} p-6 shadow-2xl`}
            style={{ animation: "questPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center"><Globe className="w-5 h-5 text-blue-400" /></div>
              <h2 className="text-lg font-semibold">Enable Internet Access</h2>
            </div>
            <p className={`text-sm leading-relaxed mb-5 ${isDark ? "text-white/70" : "text-black/70"}`}>
              To enable internet access to Quest, please add this extension.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={dismissPopup} className={`px-4 py-2 rounded-lg text-sm transition-colors ${isDark ? "text-white/70 hover:bg-white/10" : "text-black/70 hover:bg-black/5"}`}>Cancel</button>
              <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer" onClick={dismissPopup}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors">
                Ok <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <style>{`@keyframes questPopIn { from { transform: scale(0.85); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
        </div>
      )}
    </div>
  );
}

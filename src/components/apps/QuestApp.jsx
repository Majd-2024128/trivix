import { useState, useRef, useEffect } from "react";
import { Search, ArrowLeft, ArrowRight, RotateCw, Home, Globe, Plus, X, ExternalLink } from "lucide-react";

// Google as default search engine, iframe-friendly endpoint.
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

const newTab = () => ({
  id: Date.now() + Math.random(),
  url: HOME_URL,
  inputValue: "",
  title: "New Tab",
  loading: true,
});

export default function QuestApp() {
  const [tabs, setTabs] = useState([newTab()]);
  const [activeId, setActiveId] = useState(tabs[0].id);
  const [showExtPopup, setShowExtPopup] = useState(false);
  const iframeRefs = useRef({});

  const activeTab = tabs.find((t) => t.id === activeId) || tabs[0];

  // Detect if extension is already installed by attempting to load a known X-Frame blocked site.
  // If iframe loads a page from a different origin without errors, we assume the extension stripped headers.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(EXTENSION_DISMISSED_KEY) === "true") return;

    const probe = document.createElement("iframe");
    probe.style.display = "none";
    probe.style.width = "1px";
    probe.style.height = "1px";
    let resolved = false;

    const finish = (installed) => {
      if (resolved) return;
      resolved = true;
      if (!installed) setShowExtPopup(true);
      try { probe.remove(); } catch {}
    };

    probe.onload = () => {
      // If we can read contentDocument on a cross-origin page, the extension stripped headers.
      try {
        const doc = probe.contentDocument || probe.contentWindow?.document;
        if (doc && doc.body) finish(true);
        else finish(false);
      } catch {
        finish(false);
      }
    };
    probe.onerror = () => finish(false);
    document.body.appendChild(probe);
    // apple.com blocks framing — used as our test target
    probe.src = "https://www.apple.com/";
    const t = setTimeout(() => finish(false), 2500);
    return () => clearTimeout(t);
  }, []);

  const updateTab = (id, patch) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const navigate = (raw) => {
    const finalUrl = buildUrl(raw);
    updateTab(activeId, { url: finalUrl, inputValue: finalUrl, loading: true, title: finalUrl });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab.inputValue.trim()) navigate(activeTab.inputValue);
  };

  const goHome = () => updateTab(activeId, { url: HOME_URL, inputValue: "", loading: true, title: "Home" });

  const refresh = () => {
    const ref = iframeRefs.current[activeId];
    if (ref) {
      ref.src = activeTab.url;
      updateTab(activeId, { loading: true });
    }
  };

  const goBack = () => { try { iframeRefs.current[activeId]?.contentWindow?.history.back(); } catch {} };
  const goForward = () => { try { iframeRefs.current[activeId]?.contentWindow?.history.forward(); } catch {} };

  const addTab = () => {
    const t = newTab();
    setTabs((prev) => [...prev, t]);
    setActiveId(t.id);
  };

  const closeTab = (id) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length === 0) {
        const t = newTab();
        setActiveId(t.id);
        return [t];
      }
      if (id === activeId) setActiveId(filtered[filtered.length - 1].id);
      return filtered;
    });
    delete iframeRefs.current[id];
  };

  const dismissPopup = () => {
    localStorage.setItem(EXTENSION_DISMISSED_KEY, "true");
    setShowExtPopup(false);
  };

  return (
    <div className="relative flex flex-col h-full bg-[#1c1c1e] text-white font-space">
      {/* Tab bar */}
      <div className="flex items-end gap-1 px-2 pt-1.5 bg-[#101012] border-b border-white/10 overflow-x-auto">
        {tabs.map((t) => (
          <div
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer min-w-[120px] max-w-[180px] transition-colors ${
              t.id === activeId ? "bg-[#2c2c2e] text-white" : "bg-[#1c1c1e]/60 text-white/50 hover:bg-[#2c2c2e]/60"
            }`}
          >
            <Globe className="w-3 h-3 shrink-0 opacity-60" />
            <span className="truncate flex-1">{t.title || "New Tab"}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}
              className="opacity-40 hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          onClick={addTab}
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors mb-0.5"
          aria-label="New tab"
        >
          <Plus className="w-3.5 h-3.5 text-white/60" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-[#2c2c2e]">
        <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <button onClick={goForward} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowRight className="w-4 h-4 text-white/60" />
        </button>
        <button onClick={refresh} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <RotateCw className={`w-4 h-4 text-white/60 ${activeTab.loading ? "animate-spin" : ""}`} />
        </button>
        <button onClick={goHome} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <Home className="w-4 h-4 text-white/60" />
        </button>

        <form onSubmit={handleSubmit} className="flex-1 flex items-center">
          <div className="flex-1 flex items-center gap-2 bg-[#1c1c1e] rounded-lg px-3 py-1.5 border border-white/10 focus-within:border-white/25 transition-colors">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              value={activeTab.inputValue}
              onChange={(e) => updateTab(activeId, { inputValue: e.target.value })}
              placeholder="Search Google or enter URL"
              className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 outline-none"
            />
          </div>
        </form>
      </div>

      {/* Browser content */}
      <div className="flex-1 relative bg-white">
        {tabs.map((t) => (
          <div key={t.id} className="absolute inset-0" style={{ display: t.id === activeId ? "block" : "none" }}>
            <iframe
              ref={(el) => { if (el) iframeRefs.current[t.id] = el; }}
              src={t.url}
              onLoad={() => updateTab(t.id, { loading: false })}
              className="w-full h-full border-0"
              style={{ zoom: 0.85 }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              title={`Quest tab ${t.id}`}
            />
          </div>
        ))}
        {activeTab.loading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/30 z-10">
            <div className="h-full bg-blue-500 animate-pulse w-1/2" />
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-white/10 bg-[#101012] text-center">
        <p className="text-white/25 text-[10px] font-space">Copyright © 2026 Tejt</p>
      </div>

      {/* Extension required popup */}
      {showExtPopup && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            className="max-w-sm mx-4 rounded-2xl border border-white/15 bg-[#1c1c1e] p-6 shadow-2xl"
            style={{ animation: "questPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold">Enable Internet Access</h2>
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-5">
              To enable internet access to Quest, please add this extension.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={dismissPopup}
                className="px-4 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <a
                href={EXTENSION_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismissPopup}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
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

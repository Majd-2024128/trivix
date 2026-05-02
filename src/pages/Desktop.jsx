import { useState, useCallback, useEffect, useMemo } from "react";
import MenuBar from "../components/desktop/MenuBar";
import CalculatorApp from "../components/apps/CalculatorApp";
import ClockApp from "../components/apps/ClockApp";
import WeatherApp from "../components/apps/WeatherApp";
import NotesApp from "../components/apps/NotesApp";
import CalendarApp from "../components/apps/CalendarApp";
import QuestApp from "../components/apps/QuestApp";
import ChessApp from "../components/apps/ChessApp";
import FilesApp from "../components/apps/FilesApp";
import EditorsApp from "../components/apps/EditorsApp";
import Dock from "../components/desktop/Dock";
import DesktopWindow from "../components/desktop/DesktopWindow";
import SystemBar from "../components/desktop/SystemBar";
import SystemDock from "../components/desktop/SystemDock";
import SettingsApp from "../components/desktop/SettingsApp";
import WidgetHost from "../components/desktop/WidgetHost";
import WidgetPicker from "../components/desktop/WidgetPicker";
import QuestBar from "../components/desktop/QuestBar";
import DateTimePopup from "../components/desktop/DateTimePopup";
import MobileGate from "../components/MobileGate";
import { useTheme } from "@/lib/ThemeContext";
import { gradientForTheme, DEFAULT_WALLPAPER_ID, getWallpaperById, normalizeWallpaperUrl } from "@/lib/wallpapers";
import { getWidgetDef, GRID } from "@/lib/widgetDefs";

const APP_COMPONENTS = {
  calculator: CalculatorApp,
  clock: ClockApp,
  weather: WeatherApp,
  notes: NotesApp,
  calendar: CalendarApp,
  quest: QuestApp,
  chess: ChessApp,
  files: FilesApp,
  editors: EditorsApp,
};

const SETTINGS_APP = { id: "settings", name: "System", isSettings: true };

function usePersistedState(key, defaultVal) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s !== null ? JSON.parse(s) : defaultVal; } catch { return defaultVal; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(val)); }, [key, val]);
  return [val, setVal];
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768 && /Mobi|Android|iPhone/i.test(navigator.userAgent));
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

export default function Desktop() {
  const isMobile = useIsMobile();
  const { isDark } = useTheme();
  const [windows, setWindows] = useState([]);
  const [nextZ, setNextZ] = useState(10);
  const [focusedControls, setFocusedControls] = useState(null);

  const [wallpaperId, setWallpaperId] = usePersistedState("trivix_wallpaper", DEFAULT_WALLPAPER_ID);
  const [customWallpaper, setCustomWallpaper] = usePersistedState("trivix_custom_wp", null);
  const [brightness, setBrightness] = usePersistedState("trivix_brightness", 100);
  const [dockAutoHide, setDockAutoHide] = usePersistedState("trivix_dock_autohide", false);
  const [hiddenApps, setHiddenApps] = usePersistedState("trivix_hidden_apps", []);

  const [minimizedApps, setMinimizedApps] = useState(new Set());
  const [desktopMenu, setDesktopMenu] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [nextWidgetZ, setNextWidgetZ] = useState(5);
  const [showPicker, setShowPicker] = useState(false);
  const [showQuestBar, setShowQuestBar] = useState(false);
  const [showDatePopup, setShowDatePopup] = useState(false);
  const [allMinimized, setAllMinimized] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("trivix_wallpaper");
    if (!stored || stored === '"green"') setWallpaperId(DEFAULT_WALLPAPER_ID);
  }, [setWallpaperId]);

  // Disable browser context menu globally
  useEffect(() => {
    const handler = (e) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // Hide Lovable badge
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "a[href*='lovable.dev'], #lovable-badge, [data-lovable-badge] { display: none !important; }";
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Alt/Option shortcuts: D minimize/restore, Space quest bar, C close, S switch.
  useEffect(() => {
    const handleKeyDown = (e) => {
      const shortcutKey = e.altKey || e.metaKey || e.getModifierState?.("AltGraph");
      if (!shortcutKey) return;
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        setShowQuestBar((v) => !v);
      } else if (e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (allMinimized) {
          setMinimizedApps(new Set());
          setAllMinimized(false);
        } else {
          setMinimizedApps(new Set(windows.map((w) => w.app.id)));
          setAllMinimized(true);
          setFocusedControls(null);
        }
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        if (focusedControls?.close) focusedControls.close();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        cycleApps();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedControls, windows, allMinimized]);

  const handleSelectWallpaper = useCallback((id) => { setWallpaperId(id); setCustomWallpaper(null); }, []);
  const handleUploadWallpaper = useCallback((urlString) => { setCustomWallpaper(normalizeWallpaperUrl(urlString)); }, []);

  const openApp = useCallback((app) => {
    if (minimizedApps.has(app.id)) {
      setMinimizedApps((prev) => { const next = new Set(prev); next.delete(app.id); return next; });
      setWindows((prev) => prev.map((w) => w.app.id === app.id ? { ...w, zIndex: nextZ } : w));
      setNextZ((z) => z + 1);
      setAllMinimized(false);
      return;
    }
    const existing = windows.find((w) => w.app.id === app.id);
    if (existing) {
      setWindows((prev) => prev.map((w) => w.app.id === app.id ? { ...w, zIndex: nextZ } : w));
      setNextZ((z) => z + 1);
      return;
    }
    const offset = (windows.length % 5) * 30;
    setWindows((prev) => [...prev, { app, zIndex: nextZ, initialPos: { x: 100 + offset, y: 50 + offset } }]);
    setNextZ((z) => z + 1);
  }, [windows, nextZ, minimizedApps]);

  const closeWindow = useCallback((appId) => {
    setWindows((prev) => {
      const next = prev.filter((w) => w.app.id !== appId);
      setMinimizedApps((m) => { const n = new Set(m); n.delete(appId); return n; });
      if (next.length === 0) setFocusedControls(null);
      else {
        const top = [...next].sort((a, b) => b.zIndex - a.zIndex)[0];
        if (top) setFocusedControls({ appName: top.app.name, close: () => closeWindow(top.app.id), minimize: () => minimizeWindow(top.app.id), maximize: () => {} });
      }
      return next;
    });
  }, []);

  const closeAllWindows = useCallback(() => { setWindows([]); setMinimizedApps(new Set()); setFocusedControls(null); }, []);

  const minimizeWindow = useCallback((appId) => {
    setMinimizedApps((prev) => {
      const next = new Set(prev).add(appId);
      const visible = windows.filter((w) => !next.has(w.app.id));
      if (visible.length === 0) setFocusedControls(null);
      else {
        const top = [...visible].sort((a, b) => b.zIndex - a.zIndex)[0];
        setFocusedControls({ appName: top.app.name, close: () => closeWindow(top.app.id), minimize: () => minimizeWindow(top.app.id), maximize: () => {} });
      }
      return next;
    });
  }, [windows]);

  const focusWindow = useCallback((appId, controls) => {
    setWindows((prev) => prev.map((w) => w.app.id === appId ? { ...w, zIndex: nextZ } : w));
    setNextZ((z) => z + 1);
    if (controls) setFocusedControls(controls);
  }, [nextZ]);

  const cycleApps = useCallback(() => {
    const visible = windows.filter((w) => !minimizedApps.has(w.app.id));
    if (visible.length < 2) return;
    const sorted = [...visible].sort((a, b) => b.zIndex - a.zIndex);
    const next = sorted[1];
    setWindows((prev) => prev.map((w) => w.app.id === next.app.id ? { ...w, zIndex: nextZ } : w));
    setNextZ((z) => z + 1);
    setFocusedControls({ appName: next.app.name, close: () => closeWindow(next.app.id), minimize: () => minimizeWindow(next.app.id), maximize: () => {} });
  }, [windows, minimizedApps, nextZ]);

  // Desktop menu dismiss
  useEffect(() => {
    if (!desktopMenu) return;
    const dismiss = () => setDesktopMenu(null);
    const onKey = (e) => { if (e.key === "Escape") setDesktopMenu(null); };
    const t = setTimeout(() => { window.addEventListener("mousedown", dismiss); window.addEventListener("keydown", onKey); }, 0);
    return () => { clearTimeout(t); window.removeEventListener("mousedown", dismiss); window.removeEventListener("keydown", onKey); };
  }, [desktopMenu]);

  const handleDesktopContext = (e) => {
    if (e.target !== e.currentTarget && !e.target.dataset?.desktopBg) return;
    e.preventDefault();
    setDesktopMenu({ x: e.clientX, y: e.clientY });
  };

  // Widgets
  const findFreeSpot = useCallback((sizeCells) => {
    const cols = Math.floor(window.innerWidth / GRID);
    const rows = Math.floor((window.innerHeight - 80) / GRID);
    const EDGE = 1, GAP = 1;
    for (let y = 2; y <= rows - sizeCells.h; y++) {
      for (let x = EDGE; x <= cols - sizeCells.w - EDGE; x++) {
        const overlap = widgets.some((w) =>
          x < w.pos.x + w.size.w + GAP && x + sizeCells.w + GAP > w.pos.x &&
          y < w.pos.y + w.size.h + GAP && y + sizeCells.h + GAP > w.pos.y
        );
        if (!overlap) return { x, y };
      }
    }
    return { x: 1, y: 2 };
  }, [widgets]);

  const addWidget = useCallback((typeId, extraMeta = {}) => {
    const def = getWidgetDef(typeId);
    if (!def) return;
    const size = { ...def.defaultSize };
    const pos = findFreeSpot(size);
    setWidgets((prev) => [...prev, { id: `${typeId}-${Date.now()}`, type: typeId, pos, size, meta: extraMeta, zIndex: nextWidgetZ }]);
    setNextWidgetZ((z) => z + 1);
  }, [findFreeSpot, nextWidgetZ]);

  const updateWidget = useCallback((id, patch) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch, meta: patch.meta !== undefined ? patch.meta : w.meta } : w)));
  }, []);
  const removeWidget = useCallback((id) => { setWidgets((prev) => prev.filter((w) => w.id !== id)); }, []);
  const focusWidget = useCallback((id) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: nextWidgetZ } : w)));
    setNextWidgetZ((z) => z + 1);
  }, [nextWidgetZ]);

  // Picker dismiss
  useEffect(() => {
    if (!showPicker) return;
    const dismiss = (e) => {
      const inner = document.querySelector("[data-widget-picker-inner]");
      if (inner && inner.contains(e.target)) return;
      setShowPicker(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setShowPicker(false); };
    const t = setTimeout(() => { window.addEventListener("mousedown", dismiss, true); window.addEventListener("keydown", onKey); }, 0);
    return () => { clearTimeout(t); window.removeEventListener("mousedown", dismiss, true); window.removeEventListener("keydown", onKey); };
  }, [showPicker]);

  const handleReset = () => {
    if (!window.confirm("Are you sure you want to reset Trivix? This will clear your settings and files.")) return;
    localStorage.clear();
    window.location.reload();
  };

  const toggleHideApp = useCallback((appId) => {
    setHiddenApps((prev) => prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]);
  }, []);

  const openAppIds = windows.map((w) => w.app.id);
  const isSettingsOpen = openAppIds.includes("settings");

  const wallpaperResolved = normalizeWallpaperUrl(customWallpaper) || gradientForTheme(getWallpaperById(wallpaperId), isDark);
  const wp = getWallpaperById(wallpaperId);
  const isImageWallpaper = wallpaperResolved.startsWith("url(") || wp?.isImage;

  if (isMobile) return <MobileGate />;

  return (
    <div
      className="fixed inset-0 overflow-hidden font-space select-none"
      data-desktop-bg="true"
      onContextMenu={handleDesktopContext}
      style={{
        background: isImageWallpaper ? undefined : wallpaperResolved,
        backgroundColor: isImageWallpaper ? "#0a0a0c" : undefined,
        backgroundImage: isImageWallpaper ? wallpaperResolved : undefined,
        backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPosition: "center center", backgroundAttachment: "fixed",
        filter: `brightness(${brightness / 100})`,
      }}
    >
      {!isImageWallpaper && (
        <div data-desktop-bg="true" className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)` }} />
      )}

      <MenuBar controls={focusedControls} />

      {widgets.map((w) => (
        <WidgetHost key={w.id} widget={w} allWidgets={widgets}
          onUpdate={(patch) => updateWidget(w.id, patch)} onRemove={() => removeWidget(w.id)} onFocus={() => focusWidget(w.id)} />
      ))}

      {windows.map((w) => {
        const AppComponent = APP_COMPONENTS[w.app.id];
        return (
          <DesktopWindow key={w.app.id} app={w.app} zIndex={w.zIndex + 100} initialPos={w.initialPos}
            isMinimized={minimizedApps.has(w.app.id)} onMinimize={() => minimizeWindow(w.app.id)}
            onClose={() => closeWindow(w.app.id)} onFocus={(controls) => focusWindow(w.app.id, controls)}>
            {w.app.isSettings ? (
              <SettingsApp onSelectWallpaper={handleSelectWallpaper} onUploadWallpaper={handleUploadWallpaper}
                currentWallpaperId={wallpaperId} isCustomWallpaper={!!customWallpaper}
                brightness={brightness} onBrightnessChange={setBrightness}
                dockAutoHide={dockAutoHide} onDockAutoHideChange={setDockAutoHide} onReset={handleReset} />
            ) : AppComponent ? <AppComponent onOpenApp={openApp} /> : null}
          </DesktopWindow>
        );
      })}

      <SystemDock onOpenSettings={() => openApp(SETTINGS_APP)} isSettingsOpen={isSettingsOpen} onCloseSettings={() => closeWindow("settings")} />
      <Dock onOpenApp={openApp} openApps={openAppIds} onCloseApp={closeWindow} autoHide={dockAutoHide}
        hiddenApps={hiddenApps} onToggleHideApp={toggleHideApp} />
      <SystemBar onDateClick={() => setShowDatePopup((v) => !v)} />

      {desktopMenu && (
        <div onMouseDown={(e) => e.stopPropagation()} className="fixed z-[60] rounded-lg overflow-hidden shadow-2xl min-w-[200px]"
          style={{ left: Math.min(desktopMenu.x, window.innerWidth - 220), top: Math.min(desktopMenu.y, window.innerHeight - 200), background: "rgba(30,30,30,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <button onClick={() => { setDesktopMenu(null); setShowPicker(true); }} className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 font-space transition-colors">Add Widget</button>
          <div className="h-px bg-white/10" />
          <button onClick={() => { setDesktopMenu(null); openApp(SETTINGS_APP); }} className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 font-space transition-colors">Customize Wallpaper</button>
          <div className="h-px bg-white/10" />
          <button onClick={() => { setDesktopMenu(null); closeAllWindows(); }} disabled={windows.length === 0}
            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/10 font-space transition-colors disabled:opacity-40">Close All Apps</button>
        </div>
      )}

      {showPicker && <div data-widget-picker-dialog><WidgetPicker onAddWidget={addWidget} onClose={() => setShowPicker(false)} /></div>}
      {showQuestBar && <QuestBar onOpenApp={openApp} onClose={() => setShowQuestBar(false)} hiddenApps={hiddenApps} onAddToDock={toggleHideApp} />}
      {showDatePopup && <DateTimePopup onClose={() => setShowDatePopup(false)} />}
    </div>
  );
}

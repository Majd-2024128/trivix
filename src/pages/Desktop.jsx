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
import TipsApp from "../components/apps/TipsApp";
import GlimpseApp from "../components/apps/GlimpseApp";
import Dock, { APP_DEFS } from "../components/desktop/Dock";
import DesktopWindow from "../components/desktop/DesktopWindow";
import SystemBar from "../components/desktop/SystemBar";
import SystemDock from "../components/desktop/SystemDock";
import SettingsApp from "../components/desktop/SettingsApp";
import WidgetHost from "../components/desktop/WidgetHost";
import WidgetPicker from "../components/desktop/WidgetPicker";
import QuestBar from "../components/desktop/QuestBar";
import DateTimePopup from "../components/desktop/DateTimePopup";
import MobileGate from "../components/MobileGate";
import LockScreen from "../components/desktop/LockScreen";
import { File, Folder, Rocket, Pencil, Trash2, MoveRight } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { gradientForTheme, DEFAULT_WALLPAPER_ID, getWallpaperById, normalizeWallpaperUrl } from "@/lib/wallpapers";
import { getWidgetDef, GRID } from "@/lib/widgetDefs";
import { readFs, writeFs, getNode, isDir, fileExt, uniqueName, ROOT_FOLDERS } from "@/lib/fileStore";

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
  tips: TipsApp,
  glimpse: GlimpseApp,
};

const SETTINGS_APP = { id: "settings", name: "System", isSettings: true };
const GLIMPSE_APP = { id: "glimpse", name: "Glimpse" };

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
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

const desktopCollision = (x, y, items, widgets) => {
  const r = { x, y, w: 76, h: 84 };
  const iconHit = items.some((i) => Math.abs(i.x - x) < 76 && Math.abs(i.y - y) < 84);
  const widgetHit = widgets.some((w) => {
    const wr = { x: w.pos.x * GRID, y: w.pos.y * GRID, w: w.size.w * GRID, h: w.size.h * GRID };
    return r.x < wr.x + wr.w && r.x + r.w > wr.x && r.y < wr.y + wr.h && r.y + r.h > wr.y;
  });
  return iconHit || widgetHit;
};

function DesktopFileIcon({ item, entry, isDark, onOpen, onMove, onMenu }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      draggable
      onDragStart={(e) => { setDragging(true); e.dataTransfer.setData("trivix/desktop-name", item.name); }}
      onDragEnd={(e) => { setDragging(false); onMove(item.name, e.clientX - 38, e.clientY - 38); }}
      onDoubleClick={() => onOpen(entry, item.name)}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onMenu({ name: item.name, x: e.clientX, y: e.clientY }); }}
      className="absolute flex w-[76px] flex-col items-center gap-1 rounded-lg p-2 text-center font-space text-xs text-white drop-shadow-lg"
      style={{ left: item.x, top: item.y, opacity: dragging ? 0.5 : 1 }}
    >
      {entry?.kind === "app" ? <Rocket className="h-10 w-10 text-cyan-300" /> : entry?.dataUrl && entry?.type?.startsWith("image/") ? <img src={entry.dataUrl} alt="" className="h-11 w-11 rounded-lg object-cover" /> : entry && !entry.__file ? <Folder className="h-10 w-10 text-blue-300" /> : <div className="relative"><File className="h-10 w-10" /><span className="absolute inset-x-1 bottom-2 text-[7px] font-bold">{fileExt(item.name)}</span></div>}
      <span className="line-clamp-2 break-words rounded bg-black/20 px-1">{item.name}</span>
    </div>
  );
}

export default function Desktop() {
  const isMobile = useIsMobile();
  const { isDark } = useTheme();
  const [windows, setWindows] = useState([]);
  const [nextZ, setNextZ] = useState(10);
  const [focusedControls, setFocusedControls] = useState(null);
  const [focusedAppId, setFocusedAppId] = useState(null);
  const [cycleCursor, setCycleCursor] = useState(0);

  const [wallpaperId, setWallpaperId] = usePersistedState("trivix_wallpaper", DEFAULT_WALLPAPER_ID);
  const [customWallpaper, setCustomWallpaper] = usePersistedState("trivix_custom_wp", null);
  const [wallpaperFit, setWallpaperFit] = usePersistedState("trivix_wallpaper_fit", "cover");
  const [brightness, setBrightness] = usePersistedState("trivix_brightness", 100);
  const [dockAutoHide, setDockAutoHide] = usePersistedState("trivix_dock_autohide", false);
  const [hiddenApps, setHiddenApps] = usePersistedState("trivix_hidden_apps", []);
  const [lockSettings, setLockSettings] = usePersistedState("trivix_lock_settings", { style: "bold", size: 92, wallpaperId: DEFAULT_WALLPAPER_ID, password: "" });
  const [desktopItems, setDesktopItems] = usePersistedState("trivix_desktop_items", []);

  const [minimizedApps, setMinimizedApps] = useState(new Set());
  const [desktopMenu, setDesktopMenu] = useState(null);
  const [fileMenu, setFileMenu] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [nextWidgetZ, setNextWidgetZ] = useState(5);
  const [showPicker, setShowPicker] = useState(false);
  const [showQuestBar, setShowQuestBar] = useState(false);
  const [showDatePopup, setShowDatePopup] = useState(false);
  const [allMinimized, setAllMinimized] = useState(false);
  const [dockHidden, setDockHidden] = useState(false);
  const [activities, setActivities] = useState([]);
  const [locked, setLocked] = useState(() => sessionStorage.getItem("trivix_unlocked") !== "1");

  useEffect(() => { const stored = localStorage.getItem("trivix_wallpaper"); if (!stored || stored === '"green"') setWallpaperId(DEFAULT_WALLPAPER_ID); }, [setWallpaperId]);
  useEffect(() => { const h = (e) => e.preventDefault(); document.addEventListener("contextmenu", h); return () => document.removeEventListener("contextmenu", h); }, []);
  useEffect(() => { const style = document.createElement("style"); style.textContent = "a[href*='lovable.dev'], #lovable-badge, [data-lovable-badge] { display: none !important; }"; document.head.appendChild(style); return () => style.remove(); }, []);

  useEffect(() => {
    const onActivity = (e) => {
      const next = e.detail;
      setActivities((prev) => {
        const filtered = prev.filter((a) => a.id !== next.id);
        if (!next.active) return filtered;
        return [...filtered, next];
      });
    };
    window.addEventListener("trivix-activity", onActivity);
    return () => window.removeEventListener("trivix-activity", onActivity);
  }, []);

  const closeWindow = useCallback((appId) => {
    setWindows((prev) => {
      const next = prev.filter((w) => w.app.id !== appId);
      setMinimizedApps((m) => { const n = new Set(m); n.delete(appId); return n; });
      setFocusedControls(null); setFocusedAppId(null);
      return next;
    });
  }, []);

  const minimizeWindow = useCallback((appId) => {
    setMinimizedApps((prev) => {
      const next = new Set(prev).add(appId);
      const visible = windows.filter((w) => !next.has(w.app.id));
      if (visible.length === 0) { setFocusedControls(null); setFocusedAppId(null); }
      return next;
    });
  }, [windows]);

  const openApp = useCallback((app, props = {}) => {
    if (minimizedApps.has(app.id)) {
      setMinimizedApps((prev) => { const next = new Set(prev); next.delete(app.id); return next; });
      setWindows((prev) => prev.map((w) => w.app.id === app.id ? { ...w, zIndex: nextZ, props: { ...w.props, ...props } } : w));
      setNextZ((z) => z + 1); setAllMinimized(false); setFocusedAppId(app.id); return;
    }
    const existing = windows.find((w) => w.app.id === app.id);
    if (existing) { setWindows((prev) => prev.map((w) => w.app.id === app.id ? { ...w, zIndex: nextZ, props: { ...w.props, ...props } } : w)); setNextZ((z) => z + 1); setFocusedAppId(app.id); return; }
    const offset = (windows.length % 5) * 30;
    setWindows((prev) => [...prev, { app, props, zIndex: nextZ, initialPos: { x: 100 + offset, y: 50 + offset } }]);
    setNextZ((z) => z + 1); setFocusedAppId(app.id);
  }, [windows, nextZ, minimizedApps]);

  const openFile = useCallback((file, name) => openApp(GLIMPSE_APP, { file, name }), [openApp]);
  const closeAllWindows = useCallback(() => { setWindows([]); setMinimizedApps(new Set()); setFocusedControls(null); setFocusedAppId(null); }, []);

  const focusWindow = useCallback((appId, controls) => {
    setWindows((prev) => prev.map((w) => w.app.id === appId ? { ...w, zIndex: nextZ } : w));
    setNextZ((z) => z + 1); setFocusedAppId(appId);
    if (controls) setFocusedControls(controls);
  }, [nextZ]);

  const cycleApps = useCallback(() => {
    const visible = windows.filter((w) => !minimizedApps.has(w.app.id));
    if (visible.length < 2) return;
    const currentIndex = Math.max(0, visible.findIndex((w) => w.app.id === focusedAppId));
    const nextIndex = (currentIndex + 1) % visible.length;
    const next = visible[nextIndex];
    setCycleCursor(nextIndex);
    setWindows((prev) => prev.map((w) => w.app.id === next.app.id ? { ...w, zIndex: nextZ } : w));
    setNextZ((z) => z + 1); setFocusedAppId(next.app.id);
    setFocusedControls({ appName: next.app.name, close: () => closeWindow(next.app.id), minimize: () => minimizeWindow(next.app.id), maximize: () => {} });
  }, [windows, minimizedApps, focusedAppId, nextZ, closeWindow, minimizeWindow]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const shortcutKey = e.altKey || e.metaKey || e.getModifierState?.("AltGraph");
      if (!shortcutKey) return;
      if (e.code === "KeyF") { e.preventDefault(); setShowQuestBar((v) => !v); }
      else if (e.code === "KeyL") { e.preventDefault(); setLocked(true); }
      else if (e.code === "KeyT") { e.preventDefault(); window.dispatchEvent(new CustomEvent("trivix-quest-next-tab")); }
      else if (e.code === "KeyD") { e.preventDefault(); if (allMinimized) { setMinimizedApps(new Set()); setAllMinimized(false); } else { setMinimizedApps(new Set(windows.map((w) => w.app.id))); setAllMinimized(true); setFocusedControls(null); setFocusedAppId(null); } }
      else if (e.code === "KeyC") { e.preventDefault(); if (focusedControls?.close) focusedControls.close(); }
      else if (e.code === "KeyS") { e.preventDefault(); cycleApps(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedControls, windows, allMinimized, cycleApps]);

  const handleSelectWallpaper = useCallback((id) => { setWallpaperId(id); setCustomWallpaper(null); }, [setWallpaperId, setCustomWallpaper]);
  const handleUploadWallpaper = useCallback((urlString) => { setCustomWallpaper(normalizeWallpaperUrl(urlString)); }, [setCustomWallpaper]);

  useEffect(() => {
    if (!desktopMenu) return;
    const dismiss = () => setDesktopMenu(null);
    const onKey = (e) => { if (e.key === "Escape") setDesktopMenu(null); };
    const t = setTimeout(() => { window.addEventListener("mousedown", dismiss); window.addEventListener("keydown", onKey); }, 0);
    return () => { clearTimeout(t); window.removeEventListener("mousedown", dismiss); window.removeEventListener("keydown", onKey); };
  }, [desktopMenu]);

  useEffect(() => {
    if (!fileMenu) return;
    const dismiss = () => setFileMenu(null);
    const onKey = (e) => { if (e.key === "Escape") setFileMenu(null); };
    const t = setTimeout(() => { window.addEventListener("mousedown", dismiss); window.addEventListener("keydown", onKey); }, 0);
    return () => { clearTimeout(t); window.removeEventListener("mousedown", dismiss); window.removeEventListener("keydown", onKey); };
  }, [fileMenu]);

  const handleDesktopContext = (e) => { if (e.target !== e.currentTarget && !e.target.dataset?.desktopBg) return; e.preventDefault(); setDesktopMenu({ x: e.clientX, y: e.clientY }); };

  const findFreeSpot = useCallback((sizeCells) => {
    const cols = Math.floor(window.innerWidth / GRID), rows = Math.floor((window.innerHeight - 80) / GRID), EDGE = 1, GAP = 1;
    for (let y = 2; y <= rows - sizeCells.h; y++) for (let x = EDGE; x <= cols - sizeCells.w - EDGE; x++) {
      const overlap = widgets.some((w) => x < w.pos.x + w.size.w + GAP && x + sizeCells.w + GAP > w.pos.x && y < w.pos.y + w.size.h + GAP && y + sizeCells.h + GAP > w.pos.y);
      if (!overlap) return { x, y };
    }
    return { x: 1, y: 2 };
  }, [widgets]);

  const addWidget = useCallback((typeId, extraMeta = {}) => { const def = getWidgetDef(typeId); if (!def) return; const size = { ...def.defaultSize }; const pos = findFreeSpot(size); setWidgets((prev) => [...prev, { id: `${typeId}-${Date.now()}`, type: typeId, pos, size, meta: extraMeta, zIndex: nextWidgetZ }]); setNextWidgetZ((z) => z + 1); }, [findFreeSpot, nextWidgetZ]);
  const updateWidget = useCallback((id, patch) => setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch, meta: patch.meta !== undefined ? patch.meta : w.meta } : w))), []);
  const removeWidget = useCallback((id) => setWidgets((prev) => prev.filter((w) => w.id !== id)), []);
  const focusWidget = useCallback((id) => { setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: nextWidgetZ } : w))); setNextWidgetZ((z) => z + 1); }, [nextWidgetZ]);

  useEffect(() => {
    if (!showPicker) return;
    const dismiss = (e) => { const inner = document.querySelector("[data-widget-picker-inner]"); if (inner && inner.contains(e.target)) return; setShowPicker(false); };
    const onKey = (e) => { if (e.key === "Escape") setShowPicker(false); };
    const t = setTimeout(() => { window.addEventListener("mousedown", dismiss, true); window.addEventListener("keydown", onKey); }, 0);
    return () => { clearTimeout(t); window.removeEventListener("mousedown", dismiss, true); window.removeEventListener("keydown", onKey); };
  }, [showPicker]);

  const handleReset = () => setDesktopMenu({ reset: true, x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 80 });
  const confirmReset = () => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); };
  const toggleHideApp = useCallback((appId) => setHiddenApps((prev) => prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]), [setHiddenApps]);

  const fs = readFs();
  const desktopNode = getNode(fs, ["Desktop"]);
  const desktopEntries = Object.entries(desktopNode);
  const displayedItems = desktopEntries.map(([name]) => desktopItems.find((i) => i.name === name) || { name, x: 24 + (desktopItems.length % 4) * 84, y: 56 + Math.floor(desktopItems.length / 4) * 92 });

  const moveDesktopItem = (name, x, y) => {
    const nx = Math.max(10, Math.min(window.innerWidth - 86, x));
    const ny = Math.max(34, Math.min(window.innerHeight - 104, y));
    const others = desktopItems.filter((i) => i.name !== name);
    if (desktopCollision(nx, ny, others, widgets)) return;
    setDesktopItems([...others, { name, x: nx, y: ny }]);
  };

  const addAppToDesktop = (appId, point = { x: 40, y: 80 }) => {
    const app = APP_DEFS.find((a) => a.id === appId); if (!app) return;
    const newFs = readFs(); const node = getNode(newFs, ["Desktop"]); const name = uniqueName(node, `${app.name}.app`);
    node[name] = { __file: true, kind: "app", appId: app.id, name: app.name };
    writeFs(newFs); setDesktopItems((prev) => [...prev, { name, x: point.x - 38, y: point.y - 38 }]);
  };

  const deleteDesktopFile = (name) => { const newFs = readFs(); delete getNode(newFs, ["Desktop"])[name]; writeFs(newFs); setDesktopItems((prev) => prev.filter((i) => i.name !== name)); setFileMenu(null); };
  const moveDesktopFile = (name, folder) => { const newFs = readFs(); const from = getNode(newFs, ["Desktop"]); const entry = from[name]; if (!entry) return; delete from[name]; const dest = getNode(newFs, [folder]); dest[uniqueName(dest, name)] = entry; writeFs(newFs); setDesktopItems((prev) => prev.filter((i) => i.name !== name)); setFileMenu(null); };
  const openFolder = useCallback((path) => openApp(APP_DEFS.find((a) => a.id === "files"), { initialPath: path }), [openApp]);

  const openAppIds = windows.map((w) => w.app.id);
  const isSettingsOpen = openAppIds.includes("settings");
  const wallpaperResolved = normalizeWallpaperUrl(customWallpaper) || gradientForTheme(getWallpaperById(wallpaperId), isDark);
  const lockWallpaper = gradientForTheme(getWallpaperById(lockSettings.wallpaperId || wallpaperId), isDark);
  const wp = getWallpaperById(wallpaperId);
  const isImageWallpaper = wallpaperResolved.startsWith("url(") || wp?.isImage;

  if (isMobile) return <MobileGate />;

  return (
    <div className="fixed inset-0 overflow-hidden font-space select-none" data-desktop-bg="true" onContextMenu={handleDesktopContext} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const appId = e.dataTransfer.getData("trivix/app-id") || window.__trivixDraggingDockApp; if (appId) addAppToDesktop(appId, { x: e.clientX, y: e.clientY }); }} style={{ background: isImageWallpaper ? undefined : wallpaperResolved, backgroundColor: isImageWallpaper ? "#0a0a0c" : undefined, backgroundImage: isImageWallpaper ? wallpaperResolved : undefined, backgroundSize: wallpaperFit, backgroundRepeat: "no-repeat", backgroundPosition: "center center", backgroundAttachment: "fixed", filter: `brightness(${brightness / 100})` }}>
      {!isImageWallpaper && <div data-desktop-bg="true" className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)` }} />}

      <MenuBar controls={focusedControls} activities={activities} />

      {displayedItems.map((item) => desktopNode[item.name] && <DesktopFileIcon key={item.name} item={item} entry={desktopNode[item.name]} isDark={isDark} onOpen={(entry, name) => entry.kind === "app" ? openApp(APP_DEFS.find((a) => a.id === entry.appId)) : openFile(entry, name)} onMove={moveDesktopItem} onMenu={setFileMenu} />)}

      {widgets.map((w) => <WidgetHost key={w.id} widget={w} allWidgets={widgets} onUpdate={(patch) => updateWidget(w.id, patch)} onRemove={() => removeWidget(w.id)} onFocus={() => focusWidget(w.id)} />)}

      {windows.map((w) => {
        const AppComponent = APP_COMPONENTS[w.app.id];
        return <DesktopWindow key={w.app.id} app={w.app} zIndex={w.zIndex + 40} initialPos={w.initialPos} isMinimized={minimizedApps.has(w.app.id)} onMinimize={() => minimizeWindow(w.app.id)} onClose={() => closeWindow(w.app.id)} onFocus={(controls) => focusWindow(w.app.id, controls)} onFullscreenChange={setDockHidden}>
          {w.app.isSettings ? <SettingsApp onSelectWallpaper={handleSelectWallpaper} onUploadWallpaper={handleUploadWallpaper} currentWallpaperId={wallpaperId} isCustomWallpaper={!!customWallpaper} wallpaperFit={wallpaperFit} onWallpaperFitChange={setWallpaperFit} brightness={brightness} onBrightnessChange={setBrightness} dockAutoHide={dockAutoHide} onDockAutoHideChange={setDockAutoHide} onReset={handleReset} lockSettings={lockSettings} onLockSettingsChange={setLockSettings} /> : AppComponent ? <AppComponent {...(w.props || {})} onOpenApp={openApp} onOpenFile={openFile} onOpenFolder={openFolder} /> : null}
        </DesktopWindow>;
      })}

      <SystemDock onOpenSettings={() => openApp(SETTINGS_APP)} isSettingsOpen={isSettingsOpen} onCloseSettings={() => closeWindow("settings")} onLock={() => setLocked(true)} dockHidden={dockHidden} activities={activities} />
      <Dock onOpenApp={openApp} openApps={openAppIds} onCloseApp={closeWindow} autoHide={dockAutoHide} hiddenApps={hiddenApps} onToggleHideApp={toggleHideApp} onDropAppToDesktop={addAppToDesktop} dockHidden={dockHidden} />
      <SystemBar onDateClick={() => setShowDatePopup((v) => !v)} activities={activities} dockHidden={dockHidden} />

      {desktopMenu && !desktopMenu.reset && <div onMouseDown={(e) => e.stopPropagation()} className="fixed z-[60] rounded-lg overflow-hidden shadow-2xl min-w-[200px]" style={{ left: Math.min(desktopMenu.x, window.innerWidth - 220), top: Math.min(desktopMenu.y, window.innerHeight - 200), background: "rgba(30,30,30,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
        <button onClick={() => { setDesktopMenu(null); setShowPicker(true); }} className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 font-space transition-colors">Add Widget</button><div className="h-px bg-white/10" />
        <button onClick={() => { setDesktopMenu(null); openApp(SETTINGS_APP); }} className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 font-space transition-colors">Customize Wallpaper</button><div className="h-px bg-white/10" />
        <button onClick={() => { setDesktopMenu(null); closeAllWindows(); }} disabled={windows.length === 0} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/10 font-space transition-colors disabled:opacity-40">Close All Apps</button>
      </div>}

      {desktopMenu?.reset && <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/20 backdrop-blur-sm"><div className={`w-[320px] rounded-2xl border p-5 shadow-2xl ${isDark ? "border-white/10 bg-[#1c1c1e] text-white" : "border-black/10 bg-white text-[#1c1c1e]"}`}><h2 className="text-lg font-semibold">Reset Trivix?</h2><p className="mt-2 text-sm opacity-60">This will clear settings, files, and desktop layout.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setDesktopMenu(null)} className="rounded-lg px-3 py-2 text-sm hover:bg-black/10">Cancel</button><button onClick={confirmReset} className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">Reset</button></div></div></div>}

      {fileMenu && <div onMouseDown={(e) => e.stopPropagation()} className="fixed z-[120] min-w-[160px] overflow-hidden rounded-lg border border-white/10 bg-[#1e1e1e]/95 shadow-2xl backdrop-blur-xl" style={{ left: fileMenu.x, top: fileMenu.y }}><div className="px-3 py-1.5 text-xs text-white/40">{fileMenu.name}</div>{!isDir(desktopNode[fileMenu.name]) && ROOT_FOLDERS.filter((f) => f !== "Desktop" && f !== "Applications").map((f) => <button key={f} onClick={() => moveDesktopFile(fileMenu.name, f)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-white/80 hover:bg-white/10"><MoveRight className="w-3 h-3" /> Move to {f}</button>)}{!isDir(desktopNode[fileMenu.name]) && <div className="h-px bg-white/10" />}<button onClick={() => deleteDesktopFile(fileMenu.name)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10"><Trash2 className="w-3.5 h-3.5" /> Delete</button></div>}

      {showPicker && <div data-widget-picker-dialog><WidgetPicker onAddWidget={addWidget} onClose={() => setShowPicker(false)} /></div>}
      {showQuestBar && <QuestBar onOpenApp={openApp} onOpenFile={openFile} onOpenFolder={openFolder} onClose={() => setShowQuestBar(false)} hiddenApps={hiddenApps} onAddToDock={toggleHideApp} />}
      {showDatePopup && <DateTimePopup onClose={() => setShowDatePopup(false)} />}
      {locked && <LockScreen wallpaper={normalizeWallpaperUrl(customWallpaper) || lockWallpaper} fit={wallpaperFit} settings={lockSettings} onUnlock={() => { sessionStorage.setItem("trivix_unlocked", "1"); setLocked(false); }} />}
    </div>
  );
}

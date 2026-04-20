import { useState, useCallback, useEffect } from "react";
import MenuBar from "../components/desktop/MenuBar";
import CalculatorApp from "../components/apps/CalculatorApp";
import ClockApp from "../components/apps/ClockApp";
import WeatherApp from "../components/apps/WeatherApp";
import NotesApp from "../components/apps/NotesApp";
import CalendarApp from "../components/apps/CalendarApp";
import QuestApp from "../components/apps/QuestApp";
import ChessApp from "../components/apps/ChessApp";
import Dock from "../components/desktop/Dock";
import DesktopWindow from "../components/desktop/DesktopWindow";
import SystemBar from "../components/desktop/SystemBar";
import SystemDock from "../components/desktop/SystemDock";
import SettingsApp from "../components/desktop/SettingsApp";
import WidgetHost from "../components/desktop/WidgetHost";
import WidgetPicker from "../components/desktop/WidgetPicker";
import { useTheme } from "@/lib/ThemeContext";
import { WALLPAPERS, gradientForTheme, DEFAULT_WALLPAPER_ID, getWallpaperById } from "@/lib/wallpapers";
import { getWidgetDef, GRID } from "@/lib/widgetDefs";

const APP_COMPONENTS = {
  calculator: CalculatorApp,
  clock: ClockApp,
  weather: WeatherApp,
  notes: NotesApp,
  calendar: CalendarApp,
  quest: QuestApp,
  chess: ChessApp,
};

const SETTINGS_APP = { id: "settings", name: "System", isSettings: true };

export default function Desktop() {
  const { isDark } = useTheme();
  const [windows, setWindows] = useState([]);
  const [nextZ, setNextZ] = useState(10);
  const [focusedControls, setFocusedControls] = useState(null);

  // Wallpaper: either a built-in id (auto-adapts to theme) or a custom data URL.
  const [wallpaperId, setWallpaperId] = useState(DEFAULT_WALLPAPER_ID);
  const [customWallpaper, setCustomWallpaper] = useState(null); // string like url("data:...")

  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(50);
  const [minimizedApps, setMinimizedApps] = useState(new Set());
  const [desktopMenu, setDesktopMenu] = useState(null);

  // Widgets
  const [widgets, setWidgets] = useState([]); // {id, type, pos:{x,y}, size:{w,h}, meta, zIndex}
  const [nextWidgetZ, setNextWidgetZ] = useState(5);
  const [showPicker, setShowPicker] = useState(false);

  const handleSelectWallpaper = useCallback((id) => {
    setWallpaperId(id);
    setCustomWallpaper(null);
  }, []);

  const handleUploadWallpaper = useCallback((urlString) => {
    setCustomWallpaper(urlString);
  }, []);

  const openApp = useCallback((app) => {
    if (minimizedApps.has(app.id)) {
      setMinimizedApps((prev) => {
        const next = new Set(prev);
        next.delete(app.id);
        return next;
      });
      setWindows((prev) => prev.map((w) => w.app.id === app.id ? { ...w, zIndex: nextZ } : w));
      setNextZ((z) => z + 1);
      return;
    }

    const existing = windows.find((w) => w.app.id === app.id);
    if (existing) {
      setWindows((prev) => prev.map((w) => w.app.id === app.id ? { ...w, zIndex: nextZ } : w));
      setNextZ((z) => z + 1);
      return;
    }
    const offset = (windows.length % 5) * 30;
    const newZ = nextZ;
    setWindows((prev) => [...prev, { app, zIndex: newZ, initialPos: { x: 100 + offset, y: 50 + offset } }]);
    setNextZ((z) => z + 1);
    setFocusedControls({
      appName: app.name,
      close: () => closeWindow(app.id),
      minimize: () => {},
      maximize: () => {},
    });
  }, [windows, nextZ, minimizedApps]);

  const focusTopmost = useCallback((excludeId, currentWindows, currentMinimized) => {
    const visible = currentWindows.filter(
      (w) => w.app.id !== excludeId && !currentMinimized.has(w.app.id)
    );
    if (visible.length === 0) {
      setFocusedControls(null);
      return;
    }
    const top = [...visible].sort((a, b) => b.zIndex - a.zIndex)[0];
    setFocusedControls({
      appName: top.app.name,
      close: () => closeWindow(top.app.id),
      minimize: () => minimizeWindow(top.app.id),
      maximize: () => {},
    });
  }, []);

  const closeWindow = useCallback((appId) => {
    setWindows((prev) => {
      const next = prev.filter((w) => w.app.id !== appId);
      setMinimizedApps((mPrev) => {
        const m = new Set(mPrev);
        m.delete(appId);
        focusTopmost(appId, next, m);
        return m;
      });
      return next;
    });
  }, [focusTopmost]);

  const closeAllWindows = useCallback(() => {
    setWindows([]);
    setMinimizedApps(new Set());
    setFocusedControls(null);
  }, []);

  const minimizeWindow = useCallback((appId) => {
    setMinimizedApps((prev) => {
      const next = new Set(prev).add(appId);
      focusTopmost(appId, windows, next);
      return next;
    });
  }, [windows, focusTopmost]);

  const focusWindow = useCallback((appId, controls) => {
    setWindows((prev) => prev.map((w) => w.app.id === appId ? { ...w, zIndex: nextZ } : w));
    setNextZ((z) => z + 1);
    if (controls) setFocusedControls(controls);
  }, [nextZ]);

  const cycleApps = useCallback(() => {
    const visible = windows.filter((w) => !minimizedApps.has(w.app.id));
    if (visible.length < 2) {
      if (visible.length === 0 && minimizedApps.size > 0) {
        const firstMin = windows.find((w) => minimizedApps.has(w.app.id));
        if (firstMin) openApp(firstMin.app);
      }
      return;
    }
    const sorted = [...visible].sort((a, b) => b.zIndex - a.zIndex);
    const next = sorted[1];
    setWindows((prev) => prev.map((w) => w.app.id === next.app.id ? { ...w, zIndex: nextZ } : w));
    setNextZ((z) => z + 1);
    setFocusedControls({
      appName: next.app.name,
      close: () => closeWindow(next.app.id),
      minimize: () => minimizeWindow(next.app.id),
      maximize: () => {},
    });
  }, [windows, minimizedApps, nextZ, openApp, closeWindow, minimizeWindow]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === "c" || e.key === "C" || e.code === "KeyC")) {
        e.preventDefault();
        if (focusedControls?.close) focusedControls.close();
      } else if (e.altKey && (e.key === "s" || e.key === "S" || e.code === "KeyS")) {
        e.preventDefault();
        cycleApps();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedControls, cycleApps]);

  // Dismiss desktop right-click menu on any click/escape
  useEffect(() => {
    if (!desktopMenu) return;
    const dismiss = () => setDesktopMenu(null);
    const onKey = (e) => { if (e.key === "Escape") setDesktopMenu(null); };
    const t = setTimeout(() => {
      window.addEventListener("mousedown", dismiss);
      window.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousedown", dismiss);
      window.removeEventListener("keydown", onKey);
    };
  }, [desktopMenu]);

  const handleDesktopContext = (e) => {
    if (e.target !== e.currentTarget && !e.target.dataset?.desktopBg) return;
    e.preventDefault();
    setDesktopMenu({ x: e.clientX, y: e.clientY });
  };

  // ---------- Widgets ----------
  const findFreeSpot = useCallback((sizeCells) => {
    // Simple grid scan from top-left avoiding overlap with existing widgets.
    const cols = Math.floor(window.innerWidth / GRID);
    const rows = Math.floor((window.innerHeight - 80) / GRID); // leave dock space
    for (let y = 1; y <= rows - sizeCells.h; y++) {
      for (let x = 0; x <= cols - sizeCells.w; x++) {
        const overlap = widgets.some((w) =>
          x < w.pos.x + w.size.w && x + sizeCells.w > w.pos.x &&
          y < w.pos.y + w.size.h && y + sizeCells.h > w.pos.y
        );
        if (!overlap) return { x, y };
      }
    }
    return { x: 1, y: 1 };
  }, [widgets]);

  const addWidget = useCallback((typeId, extraMeta = {}) => {
    const def = getWidgetDef(typeId);
    if (!def) return;
    const size = { ...def.defaultSize };
    const pos = findFreeSpot(size);
    setWidgets((prev) => [
      ...prev,
      {
        id: `${typeId}-${Date.now()}`,
        type: typeId,
        pos,
        size,
        meta: extraMeta,
        zIndex: nextWidgetZ,
      },
    ]);
    setNextWidgetZ((z) => z + 1);
  }, [findFreeSpot, nextWidgetZ]);

  const updateWidget = useCallback((id, patch) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch, meta: patch.meta !== undefined ? patch.meta : w.meta } : w)));
  }, []);

  const removeWidget = useCallback((id) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const focusWidget = useCallback((id) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: nextWidgetZ } : w)));
    setNextWidgetZ((z) => z + 1);
  }, [nextWidgetZ]);

  // Picker is a centered pop-up; closes on outside click (not via close button / Alt+C).
  useEffect(() => {
    if (!showPicker) return;
    const dismiss = (e) => {
      // Only the inner dialog should block dismissal — the transparent overlay should not.
      const inner = document.querySelector("[data-widget-picker-inner]");
      if (inner && inner.contains(e.target)) return;
      setShowPicker(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setShowPicker(false); };
    const t = setTimeout(() => {
      window.addEventListener("mousedown", dismiss, true);
      window.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousedown", dismiss, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [showPicker]);

  const openAppIds = windows.map((w) => w.app.id);
  const isSettingsOpen = openAppIds.includes("settings");

  // Resolve current wallpaper to a CSS background string.
  const wallpaperResolved = customWallpaper
    ? customWallpaper
    : gradientForTheme(getWallpaperById(wallpaperId), isDark);

  const isImageWallpaper = wallpaperResolved.startsWith("url(");
  const wallpaperBgImage = isImageWallpaper ? wallpaperResolved : undefined;
  const wallpaperBgColor = isImageWallpaper ? "#0a0a0c" : undefined;
  const wallpaperBackground = isImageWallpaper ? undefined : wallpaperResolved;

  return (
    <div
      className="fixed inset-0 overflow-hidden font-space select-none"
      data-desktop-bg="true"
      onContextMenu={handleDesktopContext}
      style={{
        background: wallpaperBackground,
        backgroundColor: wallpaperBgColor,
        backgroundImage: wallpaperBgImage,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        filter: `brightness(${brightness / 100})`,
      }}
    >
      {!isImageWallpaper && (
        <div
          data-desktop-bg="true"
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)
            `,
          }}
        />
      )}

      <MenuBar controls={focusedControls} />

      {/* Widgets layer (below windows) */}
      {widgets.map((w) => (
        <WidgetHost
          key={w.id}
          widget={w}
          allWidgets={widgets}
          onUpdate={(patch) => updateWidget(w.id, patch)}
          onRemove={() => removeWidget(w.id)}
          onFocus={() => focusWidget(w.id)}
        />
      ))}

      {windows.map((w) => {
        const AppComponent = APP_COMPONENTS[w.app.id];
        return (
          <DesktopWindow
            key={w.app.id}
            app={w.app}
            zIndex={w.zIndex}
            initialPos={w.initialPos}
            isMinimized={minimizedApps.has(w.app.id)}
            onMinimize={() => minimizeWindow(w.app.id)}
            onClose={() => closeWindow(w.app.id)}
            onFocus={(controls) => focusWindow(w.app.id, controls)}
          >
            {w.app.isSettings ? (
              <SettingsApp
                onSelectWallpaper={handleSelectWallpaper}
                onUploadWallpaper={handleUploadWallpaper}
                currentWallpaperId={wallpaperId}
                isCustomWallpaper={!!customWallpaper}
                brightness={brightness}
                onBrightnessChange={setBrightness}
                volume={volume}
                onVolumeChange={setVolume}
              />
            ) : AppComponent ? (
              <AppComponent />
            ) : null}
          </DesktopWindow>
        );
      })}

      <SystemDock onOpenSettings={() => openApp(SETTINGS_APP)} isSettingsOpen={isSettingsOpen} onCloseSettings={() => closeWindow("settings")} />
      <Dock onOpenApp={openApp} openApps={openAppIds} onCloseApp={closeWindow} />
      <SystemBar />

      {/* Desktop right-click menu */}
      {desktopMenu && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed z-[60] rounded-lg overflow-hidden shadow-2xl min-w-[200px]"
          style={{
            left: Math.min(desktopMenu.x, window.innerWidth - 220),
            top: Math.min(desktopMenu.y, window.innerHeight - 200),
            background: "rgba(30,30,30,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <button
            onClick={() => { setDesktopMenu(null); setShowPicker(true); }}
            className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 font-space transition-colors"
          >
            Add Widget
          </button>
          <div className="h-px bg-white/10" />
          <button
            onClick={() => { setDesktopMenu(null); openApp(SETTINGS_APP); }}
            className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 font-space transition-colors"
          >
            Customize Wallpaper
          </button>
          <div className="h-px bg-white/10" />
          <button
            onClick={() => { setDesktopMenu(null); closeAllWindows(); }}
            disabled={windows.length === 0}
            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/10 font-space transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Close All Apps
          </button>
        </div>
      )}

      {/* Widget picker pop-up: centered, dismissed by outside click only */}
      {showPicker && (
        <div data-widget-picker-dialog>
          <WidgetPicker onAddWidget={addWidget} onClose={() => setShowPicker(false)} />
        </div>
      )}
    </div>
  );
}

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

const APP_COMPONENTS = {
  calculator: CalculatorApp,
  clock: ClockApp,
  weather: WeatherApp,
  notes: NotesApp,
  calendar: CalendarApp,
  quest: QuestApp,
  chess: ChessApp,
};

const SETTINGS_APP = {
  id: "settings",
  name: "System",
  isSettings: true,
};

const DEFAULT_WALLPAPER = "linear-gradient(145deg, #1a472a 0%, #2d6a4f 25%, #40916c 50%, #52b788 75%, #74c69d 100%)";

export default function Desktop() {
  const [windows, setWindows] = useState([]);
  const [nextZ, setNextZ] = useState(10);
  const [focusedControls, setFocusedControls] = useState(null);
  const [wallpaper, setWallpaper] = useState(DEFAULT_WALLPAPER);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(50);
  const [minimizedApps, setMinimizedApps] = useState(new Set());
  const [desktopMenu, setDesktopMenu] = useState(null); // { x, y } | null

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

  // Focus the topmost remaining visible window, or clear focus if none
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

  // Cycle through open (non-minimized) apps with Alt+S / Option+S
  const cycleApps = useCallback(() => {
    const visible = windows.filter((w) => !minimizedApps.has(w.app.id));
    if (visible.length < 2) {
      // If nothing visible but minimized exists, restore the first minimized
      if (visible.length === 0 && minimizedApps.size > 0) {
        const firstMin = windows.find((w) => minimizedApps.has(w.app.id));
        if (firstMin) openApp(firstMin.app);
      }
      return;
    }
    // Find currently focused (highest z) and switch to the next one
    const sorted = [...visible].sort((a, b) => b.zIndex - a.zIndex);
    const next = sorted[1]; // second highest
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
    // Only show if right-clicking on the bare desktop, not on a window/dock
    if (e.target !== e.currentTarget && !e.target.dataset?.desktopBg) return;
    e.preventDefault();
    setDesktopMenu({ x: e.clientX, y: e.clientY });
  };

  const openAppIds = windows.map((w) => w.app.id);
  const isSettingsOpen = openAppIds.includes("settings");

  // Wrap data URLs in quotes for safety; non-url backgrounds use the raw value as gradient.
  const isImageWallpaper = wallpaper.startsWith("url(");
  const wallpaperBgImage = isImageWallpaper ? wallpaper : undefined;
  const wallpaperBgColor = isImageWallpaper ? "#0a0a0c" : undefined;
  const wallpaperBackground = isImageWallpaper ? undefined : wallpaper;

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
      {/* Decorative overlay only for gradient wallpapers, not custom images */}
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
                onWallpaperChange={setWallpaper}
                currentWallpaper={wallpaper}
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
            top: Math.min(desktopMenu.y, window.innerHeight - 140),
            background: "rgba(30,30,30,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
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
    </div>
  );
}

import { useState, useCallback, useEffect } from "react";
import MenuBar from "../components/desktop/MenuBar";
import CalculatorApp from "../components/apps/CalculatorApp";
import ClockApp from "../components/apps/ClockApp";
import WeatherApp from "../components/apps/WeatherApp";
import NotesApp from "../components/apps/NotesApp";
import CalendarApp from "../components/apps/CalendarApp";
import QuestApp from "../components/apps/QuestApp";
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

  const openApp = useCallback((app) => {
    // If minimized, restore it
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

  const closeWindow = useCallback((appId) => {
    setWindows((prev) => prev.filter((w) => w.app.id !== appId));
    setMinimizedApps((prev) => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
    setFocusedControls(null);
  }, []);

  const minimizeWindow = useCallback((appId) => {
    setMinimizedApps((prev) => new Set(prev).add(appId));
  }, []);

  const focusWindow = useCallback((appId, controls) => {
    setWindows((prev) => prev.map((w) => w.app.id === appId ? { ...w, zIndex: nextZ } : w));
    setNextZ((z) => z + 1);
    if (controls) setFocusedControls(controls);
  }, [nextZ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        if (focusedControls?.close) {
          focusedControls.close();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedControls]);

  const openAppIds = windows.map((w) => w.app.id);
  const isSettingsOpen = openAppIds.includes("settings");

  return (
    <div
      className="fixed inset-0 overflow-hidden font-space select-none"
      style={{
        background: wallpaper.startsWith("url(") ? undefined : wallpaper,
        backgroundImage: wallpaper.startsWith("url(") ? wallpaper : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: `brightness(${brightness / 100})`,
      }}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)
          `,
        }}
      />

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
    </div>
  );
}

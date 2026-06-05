import { useState } from "react";
import { Keyboard, MousePointer2, LayoutGrid, AppWindow, Folder, Sparkles, Globe, Search } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";
import { useLang, t } from "@/lib/i18n";

const sections = [
  { id: "shortcuts", icon: Keyboard, key: "shortcuts", items: [
    { t: "Alt/Option + F", d: "Open Quest Bar (universal search)" },
    { t: "Alt/Option + L", d: "Lock the screen" },
    { t: "Alt/Option + K", d: "Enter sleep mode" },
    { t: "Alt/Option + D", d: "Show the desktop" },
    { t: "Alt/Option + S", d: "Cycle through open apps" },
    { t: "Alt/Option + C", d: "Close the focused app" },
    { t: "Alt/Option + X", d: "Open System settings" },
    { t: "Alt/Option + B / I / U", d: "Bold / italic / underline in Notes" },
  ]},
  { id: "desktop", icon: MousePointer2, key: "desktop", items: [
    { t: "Right-click desktop", d: "Add widgets, customize wallpaper, close all apps" },
    { t: "Drag dock icons", d: "Drop onto the desktop to create a shortcut" },
    { t: "Right-click dock icons", d: "Pin or hide apps" },
    { t: "Right-click file/folder", d: "Rename, move, or send to Bin" },
  ]},
  { id: "widgets", icon: LayoutGrid, key: "widgets", items: [
    { t: "Snap grid", d: "Widgets snap to a clean 20px grid" },
    { t: "Resize", d: "Drag from the lower-right corner" },
    { t: "Remove", d: "Right-click a widget to remove it" },
    { t: "Picker", d: "Right-click desktop → Add Widget" },
  ]},
  { id: "files", icon: Folder, key: "files", items: [
    { t: "Drop to upload", d: "Drag files from your computer into Files" },
    { t: "Organize", d: "Drag files between folders" },
    { t: "Preview", d: "Double-click to preview in Glimpse" },
    { t: "TXT files", d: "Open in Notes for editing" },
    { t: "Bin", d: "Deleted items go to the Bin folder" },
  ]},
  { id: "apps", icon: AppWindow, key: "apps", items: [
    { t: "Quest", d: "Web browser with tabs, pinning, and zoom" },
    { t: "Canvas", d: "Drawing with shapes, text, and layers" },
    { t: "System", d: "Wallpapers, display, lock screen, language" },
    { t: "Notes", d: "Rich text, images, highlighting" },
    { t: "Weather", d: "Pin up to 5 favorite cities" },
    { t: "Calendar", d: "Schedule events with notifications" },
    { t: "Media", d: "Play music & video from your Files" },
  ]},
  { id: "pro", icon: Sparkles, key: "proTouches", items: [
    { t: "Maximize", d: "Alt/Option-click the green button to fill behind docks" },
    { t: "Quest title bar", d: "Double-click to maximize" },
    { t: "Wallpaper fit", d: "Switch between Cover and Contain" },
    { t: "Language", d: "Change in System → Language" },
    { t: "Bluetooth", d: "Scan for real devices via battery popup" },
  ]},
];

export default function TipsApp() {
  const { isDark } = useTheme();
  const tt = themed(isDark);
  useLang();
  const [active, setActive] = useState("shortcuts");
  const [q, setQ] = useState("");
  const current = sections.find((s) => s.id === active) || sections[0];
  const filtered = q
    ? current.items.filter((i) => (i.t + " " + i.d).toLowerCase().includes(q.toLowerCase()))
    : current.items;

  return (
    <div className={`h-full flex font-space ${isDark ? "bg-[#111114] text-white" : "bg-[#f7f8fb] text-[#1c1c1e]"}`}>
      {/* Sidebar */}
      <aside className={`w-56 shrink-0 border-r ${tt.border} ${isDark ? "bg-black/30" : "bg-white/60"} p-3 flex flex-col`}>
        <div className="flex items-center gap-2 px-2 py-1 mb-3">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h1 className="text-lg font-bold">{t("tips")}</h1>
        </div>
        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg mb-2 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
          <Search className="w-3.5 h-3.5 opacity-60" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")}
            className="bg-transparent outline-none text-xs flex-1" />
        </div>
        <nav className="flex-1 overflow-y-auto space-y-0.5">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = s.id === active;
            return (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-left transition-colors ${isActive ? (isDark ? "bg-cyan-500/20 text-cyan-300" : "bg-cyan-500/15 text-cyan-700") : (isDark ? "hover:bg-white/5" : "hover:bg-black/5")}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="font-medium">{t(s.key) || s.key}</span>
              </button>
            );
          })}
        </nav>
        <div className={`mt-3 pt-3 border-t ${tt.border} flex items-center gap-2 px-2 text-[10px] ${tt.textFaint}`}>
          <Globe className="w-3 h-3" /> Trivix OS v2.0
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2.5 rounded-xl ${isDark ? "bg-cyan-500/15" : "bg-cyan-500/10"}`}>
              <current.icon className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold capitalize">{t(current.key) || current.key}</h2>
              <p className={`text-xs ${tt.textMuted}`}>{filtered.length} tip{filtered.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {filtered.map((item, i) => (
              <div key={i} className={`rounded-xl p-4 border ${tt.border} ${isDark ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-white hover:bg-black/[0.02]"} transition-colors`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{item.t}</div>
                    <div className={`text-xs mt-0.5 ${tt.textMuted}`}>{item.d}</div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className={`text-center text-xs ${tt.textFaint} py-8`}>No matching tips.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

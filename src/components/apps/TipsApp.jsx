import { Keyboard, MousePointer2, LayoutGrid, AppWindow, Folder, Sparkles } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";

const sections = [
  { icon: Keyboard, title: "Shortcuts", items: ["Alt/Option + F opens Quest Bar", "Alt/Option + L locks the screen", "Alt/Option + K enters sleep mode", "Alt/Option + D shows the desktop", "Alt/Option + S cycles every open app", "Alt/Option + C closes the focused app", "Alt/Option + B bold (in Notes)", "Alt/Option + I italic (in Notes)", "Alt/Option + U underline (in Notes)"] },
  { icon: MousePointer2, title: "Desktop", items: ["Right-click the desktop to add widgets", "Drag app icons from the dock to the desktop", "Right-click desktop files to rename, move, or delete", "Right-click dock icons to pin/hide them"] },
  { icon: LayoutGrid, title: "Widgets", items: ["Widgets snap to a clean 20px grid", "Resize from the lower-right corner", "Right-click a widget to remove it"] },
  { icon: Folder, title: "Files", items: ["Drop files from your computer into Files", "Drag files into folders", "Double-click a file to preview it in Glimpse", "TXT files open in Notes for editing", "Paste files with Ctrl/Cmd+V"] },
  { icon: AppWindow, title: "Apps", items: ["Quest is the web browser", "Canvas is for drawing and painting", "System changes wallpapers, display, dock, and lock screen", "Notes supports rich text, images, and highlighting", "Weather lets you pin up to 5 favorite cities", "Calendar lets you schedule events with notifications"] },
  { icon: Sparkles, title: "Pro touches", items: ["Alt/Option-click expand to fill behind the docks", "Double-click Quest's title bar to maximize", "Wallpaper fit can switch between Cover and Contain", "Change language in System settings"] },
];

export default function TipsApp() {
  const { isDark } = useTheme();
  const t = themed(isDark);
  return (
    <div className={`h-full overflow-y-auto p-5 font-space ${isDark ? "bg-[#111114] text-white" : "bg-[#f7f8fb] text-[#1c1c1e]"}`}>
      <h1 className="text-2xl font-bold mb-1">Tips</h1>
      <p className={`text-sm mb-5 ${t.textMuted}`}>A quick guide to Trivix OS.</p>
      <div className="grid grid-cols-2 gap-3">
        {sections.map(({ icon: Icon, title, items }) => (
          <section key={title} className={`rounded-xl border p-4 ${t.border} ${isDark ? "bg-white/5" : "bg-white"}`}>
            <div className="flex items-center gap-2 mb-3"><Icon className="w-4 h-4 text-cyan-400" /><h2 className="text-sm font-semibold">{title}</h2></div>
            <ul className={`space-y-2 text-xs leading-relaxed ${t.textMuted}`}>{items.map((item) => <li key={item}>• {item}</li>)}</ul>
          </section>
        ))}
      </div>
      <p className={`${t.textFaint} text-[10px] text-center mt-5`}>Copyright © 2026 Tejt</p>
    </div>
  );
}

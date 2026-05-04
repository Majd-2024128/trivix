import { useState, useEffect, useRef } from "react";
import { File, Folder, Search } from "lucide-react";
import { APP_DEFS } from "./Dock";
import { useTheme } from "@/lib/ThemeContext";
import { flattenFs, isDir, readFs } from "@/lib/fileStore";

export default function QuestBar({ onOpenApp, onOpenFile, onOpenFolder, onClose, hiddenApps = [], onAddToDock }) {
  const [query, setQuery] = useState("");
  const [menuApp, setMenuApp] = useState(null);
  const inputRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (!menuApp) return;
    const dismiss = () => setMenuApp(null);
    const t = setTimeout(() => window.addEventListener("mousedown", dismiss), 0);
    return () => { clearTimeout(t); window.removeEventListener("mousedown", dismiss); };
  }, [menuApp]);

  const search = query.trim().toLowerCase();
  const appResults = search ? APP_DEFS.filter((a) => a.name.toLowerCase().includes(search)) : APP_DEFS;
  const fileResults = flattenFs(readFs())
    .filter((item) => item.path[0] !== "Applications" && item.name.toLowerCase().includes(search || " "))
    .slice(0, 8);

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[20vh]" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-[480px] max-w-[90vw] rounded-2xl overflow-hidden shadow-2xl font-space animate-scale-in"
        style={{
          background: isDark ? "rgba(30,30,32,0.88)" : "rgba(255,255,255,0.88)",
          backdropFilter: "blur(40px)",
          border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className={`w-5 h-5 ${isDark ? "text-white/40" : "text-black/40"}`} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps and folders..."
            className={`flex-1 bg-transparent outline-none text-base ${isDark ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"}`}
          />
        </div>
        {(appResults.length > 0 || fileResults.length > 0) && (
          <div className={`border-t ${isDark ? "border-white/10" : "border-black/10"} max-h-[300px] overflow-y-auto`}>
            {appResults.map((app) => (
              <button
                key={app.id}
                onClick={() => {
                  onOpenApp({ id: app.id, name: app.name, iconDark: app.iconDark, iconLight: app.iconLight });
                  onClose();
                }}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setMenuApp({ app, x: e.clientX, y: e.clientY }); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-white/80 hover:bg-white/10" : "text-black/80 hover:bg-black/5"}`}
              >
                <img src={isDark ? app.iconDark : app.iconLight} alt="" className="w-8 h-8 rounded-lg object-cover" />
                <span>{app.name}</span>
              </button>
            ))}
            {fileResults.length > 0 && <div className={`px-4 pb-1 pt-2 text-[10px] uppercase tracking-wide ${isDark ? "text-white/35" : "text-black/35"}`}>Files</div>}
            {fileResults.map((item) => (
              <button
                key={`${item.path.join("/")}/${item.name}`}
                onClick={() => {
                  if (isDir(item.entry)) onOpenFolder?.(item.path);
                  else if (item.entry?.kind === "app") onOpenApp?.(APP_DEFS.find((a) => a.id === item.entry.appId));
                  else onOpenFile?.(item.entry, item.name);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-white/80 hover:bg-white/10" : "text-black/80 hover:bg-black/5"}`}
              >
                {isDir(item.entry) ? <Folder className="w-8 h-8 rounded-lg p-1.5 text-blue-400" /> : <File className="w-8 h-8 rounded-lg p-1.5 text-cyan-400" />}
                <span className="min-w-0 flex-1 truncate text-left">{item.name}</span>
                <span className={`text-[10px] ${isDark ? "text-white/35" : "text-black/35"}`}>/{item.path.join("/")}</span>
              </button>
            ))}
          </div>
        )}
        {menuApp && hiddenApps.includes(menuApp.app.id) && (
          <div onMouseDown={(e) => e.stopPropagation()} className="fixed z-[100] rounded-lg overflow-hidden shadow-xl min-w-[140px]"
            style={{ left: menuApp.x, top: menuApp.y, background: "rgba(30,30,30,0.94)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(18px)" }}>
            <button onClick={() => { onAddToDock?.(menuApp.app.id); setMenuApp(null); }} className="w-full px-3 py-2 text-left text-sm text-white/85 hover:bg-white/10">
              Add to Dock
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

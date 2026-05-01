import { useState, useCallback } from "react";
import { Folder, File, ArrowLeft, Home, Plus, Trash2, Download, Upload } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";

const DEFAULT_FS = {
  Desktop: {},
  Documents: {},
  Downloads: {},
  Pictures: {},
};

export default function FilesApp() {
  const { isDark } = useTheme();
  const t = themed(isDark);
  const [fs, setFs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("trivix_fs")) || DEFAULT_FS; } catch { return DEFAULT_FS; }
  });
  const [path, setPath] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNew, setShowNew] = useState(false);

  const save = (newFs) => { setFs(newFs); localStorage.setItem("trivix_fs", JSON.stringify(newFs)); };

  const getCurrent = useCallback(() => {
    let node = fs;
    for (const p of path) { node = node[p]; if (!node || typeof node !== "object") return {}; }
    return node;
  }, [fs, path]);

  const current = getCurrent();
  const entries = Object.keys(current).sort((a, b) => {
    const aIsDir = typeof current[a] === "object";
    const bIsDir = typeof current[b] === "object";
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  const navigate = (name) => {
    if (typeof current[name] === "object") setPath([...path, name]);
  };
  const goBack = () => setPath(path.slice(0, -1));
  const goHome = () => setPath([]);

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const newFs = JSON.parse(JSON.stringify(fs));
    let node = newFs;
    for (const p of path) node = node[p];
    node[newFolderName.trim()] = {};
    save(newFs);
    setNewFolderName("");
    setShowNew(false);
  };

  const deleteEntry = (name) => {
    const newFs = JSON.parse(JSON.stringify(fs));
    let node = newFs;
    for (const p of path) node = node[p];
    delete node[name];
    save(newFs);
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? "bg-[#1c1c1e] text-white" : "bg-white text-[#1c1c1e]"} font-space`}>
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${t.border}`}>
        <button onClick={goBack} disabled={path.length === 0} className={`p-1.5 rounded-lg ${t.hover} disabled:opacity-30`}><ArrowLeft className="w-4 h-4" /></button>
        <button onClick={goHome} className={`p-1.5 rounded-lg ${t.hover}`}><Home className="w-4 h-4" /></button>
        <div className={`flex-1 text-sm ${t.textMuted} truncate`}>/{path.join("/")}</div>
        <button onClick={() => setShowNew(!showNew)} className={`p-1.5 rounded-lg ${t.hover}`}><Plus className="w-4 h-4" /></button>
      </div>

      {showNew && (
        <div className={`flex items-center gap-2 px-4 py-2 border-b ${t.border}`}>
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
            placeholder="Folder name..."
            className={`flex-1 text-sm px-2 py-1 rounded ${t.inputBg} outline-none bg-transparent`}
            autoFocus
          />
          <button onClick={createFolder} className="text-xs text-blue-400 hover:text-blue-300">Create</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {entries.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full ${t.textSubtle} text-sm`}>Empty folder</div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {entries.map((name) => {
              const isDir = typeof current[name] === "object";
              return (
                <div
                  key={name}
                  onDoubleClick={() => navigate(name)}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer transition-colors ${t.hover} group`}
                >
                  {isDir ? (
                    <Folder className="w-10 h-10 text-blue-400" />
                  ) : (
                    <File className={`w-10 h-10 ${t.textMuted}`} />
                  )}
                  <span className="text-xs text-center truncate w-full">{name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteEntry(name); }}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`px-4 py-2 border-t ${t.border} text-center`}>
        <p className={`${t.textFaint} text-[10px]`}>Copyright © 2026 Tejt</p>
      </div>
    </div>
  );
}

import { useState, useCallback, useRef } from "react";
import { Folder, File, ArrowLeft, Home, Plus, Trash2, Download, Upload, Rocket } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";
import { APP_DEFS } from "@/components/desktop/Dock";

const DEFAULT_FS = {
  Desktop: {},
  Documents: {},
  Downloads: {},
  Pictures: {},
  Applications: Object.fromEntries(APP_DEFS.map((app) => [`${app.name}.app`, { __file: true, kind: "app", appId: app.id, name: app.name }]))
};

const isFile = (entry) => !!entry?.__file;
const isDir = (entry) => entry && typeof entry === "object" && !entry.__file;

export default function FilesApp({ onOpenApp }) {
  const { isDark } = useTheme();
  const t = themed(isDark);
  const fileInputRef = useRef(null);
  const [fs, setFs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("trivix_fs")) || {};
      return { ...DEFAULT_FS, ...saved, Applications: DEFAULT_FS.Applications };
    } catch { return DEFAULT_FS; }
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
    const aIsDir = isDir(current[a]);
    const bIsDir = isDir(current[b]);
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  const navigate = (name) => {
    const entry = current[name];
    if (isDir(entry)) setPath([...path, name]);
    if (entry?.kind === "app") {
      const app = APP_DEFS.find((a) => a.id === entry.appId);
      if (app && onOpenApp) onOpenApp(app);
    }
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
    if (current[name]?.kind === "app") return;
    const newFs = JSON.parse(JSON.stringify(fs));
    let node = newFs;
    for (const p of path) node = node[p];
    delete node[name];
    save(newFs);
  };

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const newFs = JSON.parse(JSON.stringify(fs));
    let node = newFs;
    for (const p of path) node = node[p];
    files.forEach((file) => {
      let name = file.name;
      let i = 1;
      while (node[name]) {
        const dot = file.name.lastIndexOf(".");
        name = dot > 0 ? `${file.name.slice(0, dot)} ${i}${file.name.slice(dot)}` : `${file.name} ${i}`;
        i += 1;
      }
      node[name] = { __file: true, kind: "upload", name, type: file.type || "application/octet-stream", size: file.size, addedAt: Date.now() };
    });
    save(newFs);
  };

  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); addFiles(e.dataTransfer.files); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <div className={`flex flex-col h-full ${isDark ? "bg-[#1c1c1e] text-white" : "bg-white text-[#1c1c1e]"} font-space`}>
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${t.border}`}>
        <button onClick={goBack} disabled={path.length === 0} className={`p-1.5 rounded-lg ${t.hover} disabled:opacity-30`}><ArrowLeft className="w-4 h-4" /></button>
        <button onClick={goHome} className={`p-1.5 rounded-lg ${t.hover}`}><Home className="w-4 h-4" /></button>
        <div className={`flex-1 text-sm ${t.textMuted} truncate`}>/{path.join("/")}</div>
        <button onClick={() => fileInputRef.current?.click()} className={`p-1.5 rounded-lg ${t.hover}`}><Upload className="w-4 h-4" /></button>
        <button onClick={() => setShowNew(!showNew)} className={`p-1.5 rounded-lg ${t.hover}`}><Plus className="w-4 h-4" /></button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
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

      <div className="flex-1 overflow-y-auto p-3" onDrop={handleDrop} onDragOver={handleDragOver}>
        {entries.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full ${t.textSubtle} text-sm gap-2`}>
            <Upload className="w-8 h-8 opacity-40" />
            <span>Drop files here</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {entries.map((name) => {
              const entry = current[name];
              const directory = isDir(entry);
              return (
                <div
                  key={name}
                  onDoubleClick={() => navigate(name)}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer transition-colors ${t.hover} group`}
                >
                  {directory ? (
                    <Folder className="w-10 h-10 text-blue-400" />
                  ) : entry?.kind === "app" ? (
                    <Rocket className="w-10 h-10 text-cyan-400" />
                  ) : (
                    <File className={`w-10 h-10 ${t.textMuted}`} />
                  )}
                  <span className="text-xs text-center truncate w-full">{name}</span>
                  {entry?.kind !== "app" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteEntry(name); }}
                      className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  )}
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

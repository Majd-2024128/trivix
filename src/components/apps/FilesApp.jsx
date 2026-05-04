import { useState, useCallback, useRef, useEffect } from "react";
import { Folder, File, ArrowLeft, Home, Plus, Trash2, Upload, Rocket, Image as ImageIcon, Pencil, MoveRight } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";
import { APP_DEFS } from "@/components/desktop/Dock";
import { readFs, writeFs, getNode, isDir, fileExt, uniqueName, ROOT_FOLDERS } from "@/lib/fileStore";

export default function FilesApp({ onOpenApp, onOpenFile, initialPath }) {
  const { isDark } = useTheme();
  const t = themed(isDark);
  const fileInputRef = useRef(null);
  const [fs, setFs] = useState(readFs);
  const [path, setPath] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [menu, setMenu] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    const sync = () => setFs(readFs());
    window.addEventListener("trivix-fs-change", sync);
    return () => window.removeEventListener("trivix-fs-change", sync);
  }, []);
  useEffect(() => { if (Array.isArray(initialPath)) setPath(initialPath); }, [initialPath]);
  useEffect(() => {
    if (!menu) return;
    const dismiss = () => setMenu(null);
    const onKey = (e) => { if (e.key === "Escape") setMenu(null); };
    const t = setTimeout(() => { window.addEventListener("mousedown", dismiss); window.addEventListener("keydown", onKey); }, 0);
    return () => { clearTimeout(t); window.removeEventListener("mousedown", dismiss); window.removeEventListener("keydown", onKey); };
  }, [menu]);

  const save = (newFs) => { setFs(newFs); writeFs(newFs); };
  const current = getNode(fs, path);
  const entries = Object.keys(current).sort((a, b) => {
    const aIsDir = isDir(current[a]);
    const bIsDir = isDir(current[b]);
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  const clone = () => JSON.parse(JSON.stringify(fs));
  const nodeAt = (root, p = path) => getNode(root, p);

  const navigate = (name) => {
    const entry = current[name];
    if (isDir(entry)) setPath([...path, name]);
    else if (entry?.kind === "app") {
      const app = APP_DEFS.find((a) => a.id === entry.appId);
      if (app && onOpenApp) onOpenApp(app);
    } else if (entry?.__file) onOpenFile?.(entry, name);
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const newFs = clone();
    nodeAt(newFs)[uniqueName(nodeAt(newFs), newFolderName.trim())] = {};
    save(newFs); setNewFolderName(""); setShowNew(false);
  };

  const deleteEntry = (name) => {
    if (current[name]?.kind === "app") return;
    const newFs = clone();
    delete nodeAt(newFs)[name];
    save(newFs); setMenu(null);
  };

  const commitRename = () => {
    if (!renaming || !renameValue.trim() || current[renaming]?.kind === "app") { setRenaming(null); return; }
    const newFs = clone();
    const node = nodeAt(newFs);
    const entry = node[renaming];
    delete node[renaming];
    node[uniqueName(node, renameValue.trim())] = { ...entry, name: renameValue.trim() };
    save(newFs); setRenaming(null); setMenu(null);
  };

  const moveEntry = (name, targetRoot) => {
    if (current[name]?.kind === "app") return;
    const newFs = clone();
    const from = nodeAt(newFs);
    const entry = from[name];
    if (!entry) return;
    delete from[name];
    const dest = getNode(newFs, [targetRoot]);
    dest[uniqueName(dest, name)] = entry;
    save(newFs); setMenu(null);
  };

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const loaded = await Promise.all(files.map((file) => new Promise((resolve) => {
      const entry = { __file: true, kind: "upload", name: file.name, type: file.type || "application/octet-stream", size: file.size, addedAt: Date.now() };
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => resolve({ ...entry, dataUrl: ev.target?.result });
        reader.onerror = () => resolve(entry);
        reader.readAsDataURL(file);
      } else resolve(entry);
    })));
    const newFs = clone();
    const node = nodeAt(newFs);
    loaded.forEach((entry) => { const name = uniqueName(node, entry.name); node[name] = { ...entry, name }; });
    save(newFs);
  };

  const moveWithinCurrent = (name, folderName) => {
    if (!isDir(current[folderName]) || name === folderName || current[name]?.kind === "app") return;
    const newFs = clone();
    const node = nodeAt(newFs);
    const entry = node[name];
    delete node[name];
    node[folderName][uniqueName(node[folderName], name)] = entry;
    save(newFs);
  };

  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); addFiles(e.dataTransfer.files); };
  const startRename = (name) => { setRenaming(name); setRenameValue(name); };

  const FileThumb = ({ name, entry }) => {
    if (isDir(entry)) return <Folder className="w-10 h-10 text-blue-400" />;
    if (entry?.kind === "app") return <Rocket className="w-10 h-10 text-cyan-400" />;
    if (entry?.dataUrl && entry?.type?.startsWith("image/")) return <img src={entry.dataUrl} alt="" className="w-11 h-11 rounded-lg object-cover" />;
    return <div className={`relative w-10 h-10 ${t.textMuted}`}><File className="w-10 h-10" /><span className="absolute inset-x-1 bottom-2 text-[7px] font-bold text-center">{fileExt(name)}</span></div>;
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? "bg-[#1c1c1e] text-white" : "bg-white text-[#1c1c1e]"} font-space`}>
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${t.border}`}>
        <button onClick={() => setPath(path.slice(0, -1))} disabled={path.length === 0} className={`p-1.5 rounded-lg ${t.hover} disabled:opacity-30`}><ArrowLeft className="w-4 h-4" /></button>
        <button onClick={() => setPath([])} className={`p-1.5 rounded-lg ${t.hover}`}><Home className="w-4 h-4" /></button>
        <div className={`flex-1 text-sm ${t.textMuted} truncate`}>/{path.join("/")}</div>
        <button onClick={() => fileInputRef.current?.click()} className={`p-1.5 rounded-lg ${t.hover}`}><Upload className="w-4 h-4" /></button>
        <button onClick={() => setShowNew(!showNew)} className={`p-1.5 rounded-lg ${t.hover}`}><Plus className="w-4 h-4" /></button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      </div>

      {showNew && <div className={`flex items-center gap-2 px-4 py-2 border-b ${t.border}`}><input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createFolder()} placeholder="Folder name..." className={`flex-1 text-sm px-2 py-1 rounded ${t.inputBg} outline-none bg-transparent`} autoFocus /><button onClick={createFolder} className="text-xs text-blue-400 hover:text-blue-300">Create</button></div>}

      <div className="flex-1 overflow-y-auto p-3" onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        {entries.length === 0 ? <div className={`flex flex-col items-center justify-center h-full ${t.textSubtle} text-sm gap-2`}><Upload className="w-8 h-8 opacity-40" /><span>Drop files here</span></div> : (
          <div className="grid grid-cols-4 gap-3">
            {entries.map((name) => {
              const entry = current[name];
              return <div key={name} draggable={entry?.kind !== "app"} onDragStart={(e) => e.dataTransfer.setData("trivix/file-name", name)} onDrop={(e) => { e.preventDefault(); moveWithinCurrent(e.dataTransfer.getData("trivix/file-name"), name); }} onDragOver={(e) => isDir(entry) && e.preventDefault()} onDoubleClickCapture={() => navigate(name)} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setMenu({ name, x: e.clientX, y: e.clientY }); }} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer transition-colors ${t.hover} group`}>
                <FileThumb name={name} entry={entry} />
                {renaming === name ? <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onBlur={commitRename} onKeyDown={(e) => e.key === "Enter" && commitRename()} className={`text-xs text-center w-full rounded ${t.inputBg} outline-none`} /> : <span className="text-xs text-center truncate w-full">{name}</span>}
              </div>;
            })}
          </div>
        )}
      </div>

      {menu && current[menu.name]?.kind !== "app" && <div onMouseDown={(e) => e.stopPropagation()} className="fixed z-[120] min-w-[170px] overflow-hidden rounded-lg border border-white/10 bg-[#1e1e1e]/95 shadow-2xl backdrop-blur-xl" style={{ left: Math.min(menu.x, window.innerWidth - 190), top: Math.min(menu.y, window.innerHeight - 220) }}>
        <button onClick={() => startRename(menu.name)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/85 hover:bg-white/10"><Pencil className="w-3.5 h-3.5" /> Rename</button>
        {!isDir(current[menu.name]) && <><div className="px-3 py-1 text-[10px] uppercase text-white/35">Move to</div>
        {ROOT_FOLDERS.filter((f) => f !== path[0] && f !== "Applications").map((folder) => <button key={folder} onClick={() => moveEntry(menu.name, folder)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-white/75 hover:bg-white/10"><MoveRight className="w-3 h-3" /> {folder}</button>)}
        <div className="h-px bg-white/10" /></>}
        <button onClick={() => deleteEntry(menu.name)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
      </div>}

      <div className={`px-4 py-2 border-t ${t.border} text-center`}><p className={`${t.textFaint} text-[10px]`}>Copyright © 2026 Tejt</p></div>
    </div>
  );
}

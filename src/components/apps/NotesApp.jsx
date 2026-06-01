import { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Trash2, Search, Save, Bold, Italic, Underline, Highlighter, Palette } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";
import { useNotesStore, addNote, deleteNote as storeDelete, updateNote as storeUpdate } from "@/lib/notesStore";
import { readFs, writeFs, getNode, uniqueName } from "@/lib/fileStore";

const HIGHLIGHT_COLORS = ["#ffff00", "#00ff00", "#ff69b4", "#00bfff", "#ff8c00", "transparent"];
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];
const FONT_COLORS = ["#000000", "#ffffff", "#ff0000", "#0055ff", "#00aa00", "#ff8800", "#aa00ff"];
const FONTS = ["Space Grotesk", "serif", "monospace", "cursive"];

// Simple spell check using browser's built-in spellcheck API
function getSpellSuggestions(word) {
  // Use a basic approach - common misspellings
  const common = {
    teh: "the", adn: "and", taht: "that", wiht: "with", thier: "their",
    recieve: "receive", occurence: "occurrence", seperate: "separate",
    definately: "definitely", occured: "occurred", untill: "until",
    wich: "which", becuase: "because", befor: "before",
  };
  const lower = word.toLowerCase();
  if (common[lower]) return [common[lower]];
  return [];
}

export default function NotesApp() {
  const notes = useNotesStore();
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const { isDark } = useTheme();
  const t = themed(isDark);
  const editorRef = useRef(null);
  const [spellMenu, setSpellMenu] = useState(null);

  const activeNote = notes.find((n) => n.id === activeId);

  const handleAdd = () => {
    const created = addNote({ title: "", body: "", html: "" });
    setActiveId(created.id);
  };

  const handleDelete = (id) => {
    storeDelete(id);
    if (activeId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setActiveId(remaining[0]?.id || null);
    }
  };

  const handleTitleChange = (value) => {
    if (activeId == null) return;
    storeUpdate(activeId, { title: value });
  };

  const execCmd = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    syncBody();
  };

  const syncBody = () => {
    if (!editorRef.current || activeId == null) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText;
    storeUpdate(activeId, { body: text, html });
  };

  // Set editor content when active note changes
  useEffect(() => {
    if (editorRef.current && activeNote) {
      if (activeNote.html) editorRef.current.innerHTML = activeNote.html;
      else editorRef.current.innerText = activeNote.body || "";
    }
  }, [activeId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const mod = e.altKey || e.metaKey;
      if (!mod || !activeNote) return;
      if (e.code === "KeyB") { e.preventDefault(); execCmd("bold"); }
      else if (e.code === "KeyI") { e.preventDefault(); execCmd("italic"); }
      else if (e.code === "KeyU") { e.preventDefault(); execCmd("underline"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeNote]);

  // Spell check context menu
  useEffect(() => {
    if (!spellMenu) return;
    const dismiss = () => setSpellMenu(null);
    const t = setTimeout(() => window.addEventListener("mousedown", dismiss), 0);
    return () => { clearTimeout(t); window.removeEventListener("mousedown", dismiss); };
  }, [spellMenu]);

  const handleEditorContext = (e) => {
    const sel = window.getSelection();
    const word = sel?.toString()?.trim();
    if (word && word.length > 1 && !word.includes(" ")) {
      const suggestions = getSpellSuggestions(word);
      if (suggestions.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        setSpellMenu({ x: e.clientX, y: e.clientY, word, suggestions, range: sel.getRangeAt(0) });
        return;
      }
    }
  };

  const applySuggestion = (suggestion) => {
    if (!spellMenu?.range) return;
    const range = spellMenu.range;
    range.deleteContents();
    range.insertNode(document.createTextNode(suggestion));
    setSpellMenu(null);
    syncBody();
  };

  const saveToDesktop = () => {
    if (!activeNote) return;
    const fs = readFs();
    const desktop = getNode(fs, ["Desktop"]);
    const name = uniqueName(desktop, `${activeNote.title || "Note"}.txt`);
    const content = activeNote.body || "";
    const blob = new Blob([content], { type: "text/plain" });
    const reader = new FileReader();
    reader.onload = (ev) => {
      desktop[name] = { __file: true, kind: "upload", name, type: "text/plain", dataUrl: ev.target.result, size: content.length, addedAt: Date.now() };
      writeFs(fs);
    };
    reader.readAsDataURL(blob);
  };

  // Drag and drop images
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        execCmd("insertImage", ev.target.result);
      };
      reader.readAsDataURL(file);
    });
  };

  const filtered = notes.filter(
    (n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (ts) => new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <div className={`flex h-full ${isDark ? "bg-[#1c1c1e] text-white" : "bg-[#f5f5f7] text-[#1c1c1e]"} font-space`}>
      <div className={`w-56 border-r ${t.border} flex flex-col`}>
        <div className="p-3 flex items-center gap-2">
          <div className={`flex-1 flex items-center gap-2 ${t.inputBg} rounded-lg px-2 py-1.5`}>
            <Search className={`w-3.5 h-3.5 ${t.textSubtle}`} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search"
              className={`bg-transparent text-sm ${t.text} ${isDark ? "placeholder:text-white/30" : "placeholder:text-black/30"} outline-none w-full`} />
          </div>
          <button onClick={handleAdd} className={`p-1.5 rounded-lg ${t.hover} transition-colors`}>
            <Plus className="w-4 h-4 text-yellow-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((note) => (
            <button key={note.id} onClick={() => setActiveId(note.id)}
              className={`w-full text-left px-3 py-2.5 border-b ${isDark ? "border-white/5" : "border-black/5"} transition-colors ${
                activeId === note.id ? "bg-yellow-500/20" : isDark ? "hover:bg-white/5" : "hover:bg-black/5"
              }`}>
              <div className="text-sm font-medium truncate">{note.title || "Untitled"}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs ${t.textSubtle}`}>{formatTime(note.updated)}</span>
                <span className={`text-xs ${t.textFaint} truncate`}>{note.body.slice(0, 30) || "No content"}</span>
              </div>
            </button>
          ))}
          {notes.length === 0 && (
            <div className={`text-center ${t.textFaint} text-sm mt-8 px-4`}>
              No notes yet.<br />Click + to create one.
            </div>
          )}
        </div>

        <div className={`p-3 border-t ${t.border} text-center text-xs ${t.textFaint}`}>
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeNote ? (
          <>
            <div className={`flex items-center justify-between px-4 py-2 border-b ${t.border}`}>
              <span className={`text-xs ${t.textSubtle}`}>
                {new Date(activeNote.updated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={saveToDesktop} className="p-1.5 rounded-lg hover:bg-green-500/20 transition-colors" title="Save to Desktop">
                  <Save className="w-4 h-4 text-green-400/60 hover:text-green-400" />
                </button>
                <button onClick={() => handleDelete(activeNote.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400/60 hover:text-red-400" />
                </button>
              </div>
            </div>

            {/* Formatting toolbar */}
            <div className={`flex items-center gap-0.5 px-3 py-1.5 border-b ${t.border} flex-wrap`}>
              <button onClick={() => execCmd("bold")} className={`p-1.5 rounded ${isDark ? "hover:bg-white/10" : "hover:bg-black/10"}`} title="Bold (Alt+B)">
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => execCmd("italic")} className={`p-1.5 rounded ${isDark ? "hover:bg-white/10" : "hover:bg-black/10"}`} title="Italic (Alt+I)">
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => execCmd("underline")} className={`p-1.5 rounded ${isDark ? "hover:bg-white/10" : "hover:bg-black/10"}`} title="Underline (Alt+U)">
                <Underline className="w-3.5 h-3.5" />
              </button>
              <div className={`w-px h-4 ${isDark ? "bg-white/15" : "bg-black/15"} mx-1`} />
              {/* Highlighter colors */}
              {HIGHLIGHT_COLORS.slice(0, 4).map((c) => (
                <button key={c} onClick={() => execCmd("hiliteColor", c)} className="p-1 rounded hover:scale-110" title="Highlight">
                  <div className="w-4 h-4 rounded-sm border border-current/20" style={{ background: c }} />
                </button>
              ))}
              <button onClick={() => execCmd("hiliteColor", "transparent")} className={`p-1 rounded ${isDark ? "hover:bg-white/10" : "hover:bg-black/10"}`} title="Remove highlight">
                <Highlighter className="w-3.5 h-3.5 opacity-40" />
              </button>
              <div className={`w-px h-4 ${isDark ? "bg-white/15" : "bg-black/15"} mx-1`} />
              {/* Font size */}
              <select onChange={(e) => execCmd("fontSize", e.target.value)} className={`text-xs rounded px-1 py-0.5 ${isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"} outline-none`}>
                {[1, 2, 3, 4, 5, 6, 7].map((s) => <option key={s} value={s}>{["8", "10", "12", "14", "18", "24", "36"][s - 1]}px</option>)}
              </select>
              {/* Font color */}
              <input type="color" onChange={(e) => execCmd("foreColor", e.target.value)} className="w-5 h-5 rounded border-0 p-0 cursor-pointer" title="Text color" />
              {/* Font family */}
              <select onChange={(e) => execCmd("fontName", e.target.value)} className={`text-xs rounded px-1 py-0.5 ${isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"} outline-none`}>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <input type="text" value={activeNote.title} onChange={(e) => handleTitleChange(e.target.value)}
              className={`bg-transparent text-xl font-semibold px-4 pt-4 pb-1 outline-none ${t.text} ${isDark ? "placeholder:text-white/20" : "placeholder:text-black/20"}`}
              placeholder="Title" />
            <div ref={editorRef} contentEditable suppressContentEditableWarning
              onInput={syncBody} onContextMenu={handleEditorContext}
              onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
              className={`flex-1 px-4 py-2 outline-none overflow-y-auto text-sm leading-relaxed ${isDark ? "text-white/80" : "text-black/80"}`}
              style={{ minHeight: 100 }}
              data-placeholder="Start typing..." />
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center ${t.textFaint} text-sm`}>Select a note or create a new one</div>
        )}
        <div className={`px-4 py-1.5 border-t ${t.border} text-center`}>
          <p className={`${t.textFaint} text-[10px] font-space`}>Copyright © 2026 Tejt</p>
        </div>
      </div>

      {/* Spell check menu */}
      {spellMenu && (
        <div onMouseDown={(e) => e.stopPropagation()}
          className="fixed z-[200] min-w-[140px] rounded-lg overflow-hidden shadow-xl"
          style={{ left: spellMenu.x, top: spellMenu.y, background: isDark ? "rgba(30,30,30,0.95)" : "rgba(255,255,255,0.95)", border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.12)", backdropFilter: "blur(20px)" }}>
          {spellMenu.suggestions.map((s) => (
            <button key={s} onClick={() => applySuggestion(s)}
              className={`w-full px-3 py-2 text-left text-sm font-medium ${isDark ? "text-blue-400 hover:bg-white/10" : "text-blue-600 hover:bg-black/5"}`}>
              {s}
            </button>
          ))}
          <div className={`h-px ${isDark ? "bg-white/10" : "bg-black/10"}`} />
          <button onClick={() => setSpellMenu(null)}
            className={`w-full px-3 py-2 text-left text-sm ${isDark ? "text-white/60 hover:bg-white/10" : "text-black/60 hover:bg-black/5"}`}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

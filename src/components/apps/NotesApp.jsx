import { useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";
import { useNotesStore, addNote, deleteNote as storeDelete, updateNote as storeUpdate } from "@/lib/notesStore";

export default function NotesApp() {
  const notes = useNotesStore();
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const { isDark } = useTheme();
  const t = themed(isDark);

  const activeNote = notes.find((n) => n.id === activeId);

  const handleAdd = () => {
    const created = addNote({ title: "New Note", body: "" });
    setActiveId(created.id);
  };

  const handleDelete = (id) => {
    storeDelete(id);
    if (activeId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setActiveId(remaining[0]?.id || null);
    }
  };

  const handleUpdate = (field, value) => {
    if (activeId == null) return;
    storeUpdate(activeId, { [field]: value });
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
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className={`bg-transparent text-sm ${t.text} ${isDark ? "placeholder:text-white/30" : "placeholder:text-black/30"} outline-none w-full`}
            />
          </div>
          <button onClick={handleAdd} className={`p-1.5 rounded-lg ${t.hover} transition-colors`}>
            <Plus className="w-4 h-4 text-yellow-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((note) => (
            <button
              key={note.id}
              onClick={() => setActiveId(note.id)}
              className={`w-full text-left px-3 py-2.5 border-b ${isDark ? "border-white/5" : "border-black/5"} transition-colors ${
                activeId === note.id ? "bg-yellow-500/20" : isDark ? "hover:bg-white/5" : "hover:bg-black/5"
              }`}
            >
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
              <button onClick={() => handleDelete(activeNote.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
                <Trash2 className="w-4 h-4 text-red-400/60 hover:text-red-400" />
              </button>
            </div>
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => handleUpdate("title", e.target.value)}
              className={`bg-transparent text-xl font-semibold px-4 pt-4 pb-1 outline-none ${t.text} ${isDark ? "placeholder:text-white/20" : "placeholder:text-black/20"}`}
              placeholder="Title"
            />
            <textarea
              value={activeNote.body}
              onChange={(e) => handleUpdate("body", e.target.value)}
              className={`flex-1 bg-transparent text-sm ${isDark ? "text-white/80 placeholder:text-white/20" : "text-black/80 placeholder:text-black/20"} px-4 py-2 outline-none resize-none leading-relaxed`}
              placeholder="Start typing..."
            />
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center ${t.textFaint} text-sm`}>Select a note or create a new one</div>
        )}
        <div className={`px-4 py-1.5 border-t ${t.border} text-center`}>
          <p className={`${t.textFaint} text-[10px] font-space`}>Copyright © 2026 Tejt</p>
        </div>
      </div>
    </div>
  );
}

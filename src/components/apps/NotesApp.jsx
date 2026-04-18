import { useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";

export default function NotesApp() {
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");

  const activeNote = notes.find((n) => n.id === activeId);

  const addNote = () => {
    const newNote = {
      id: Date.now(),
      title: "New Note",
      body: "",
      updated: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveId(newNote.id);
  };

  const deleteNote = (id) => {
    const filtered = notes.filter((n) => n.id !== id);
    setNotes(filtered);
    if (activeId === id) setActiveId(filtered[0]?.id || null);
  };

  const updateNote = (field, value) => {
    setNotes(
      notes.map((n) =>
        n.id === activeId ? { ...n, [field]: value, updated: Date.now() } : n
      )
    );
  };

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  return (
    <div className="flex h-full bg-[#1c1c1e] text-white font-space">
      {/* Sidebar */}
      <div className="w-56 border-r border-white/10 flex flex-col">
        <div className="p-3 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1.5">
            <Search className="w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="bg-transparent text-sm text-white placeholder:text-white/30 outline-none w-full"
            />
          </div>
          <button onClick={addNote} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <Plus className="w-4 h-4 text-yellow-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((note) => (
            <button
              key={note.id}
              onClick={() => setActiveId(note.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-white/5 transition-colors ${
                activeId === note.id ? "bg-yellow-500/20" : "hover:bg-white/5"
              }`}
            >
              <div className="text-sm font-medium truncate">
                {note.title || "Untitled"}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-white/40">{formatTime(note.updated)}</span>
                <span className="text-xs text-white/30 truncate">{note.body.slice(0, 30) || "No content"}</span>
              </div>
            </button>
          ))}
          {notes.length === 0 && (
            <div className="text-center text-white/30 text-sm mt-8 px-4">
              No notes yet.<br />Click + to create one.
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/10 text-center text-xs text-white/30">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {activeNote ? (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <span className="text-xs text-white/40">
                {new Date(activeNote.updated).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <button
                onClick={() => deleteNote(activeNote.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-400/60 hover:text-red-400" />
              </button>
            </div>
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => updateNote("title", e.target.value)}
              className="bg-transparent text-xl font-semibold px-4 pt-4 pb-1 outline-none text-white placeholder:text-white/20"
              placeholder="Title"
            />
            <textarea
              value={activeNote.body}
              onChange={(e) => updateNote("body", e.target.value)}
              className="flex-1 bg-transparent text-sm text-white/80 px-4 py-2 outline-none resize-none leading-relaxed placeholder:text-white/20"
              placeholder="Start typing..."
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
            Select a note or create a new one
          </div>
        )}
        <div className="px-4 py-1.5 border-t border-white/10 text-center">
          <p className="text-white/25 text-[10px] font-space">Copyright © 2026 Tejt</p>
        </div>
      </div>
    </div>
  );
}

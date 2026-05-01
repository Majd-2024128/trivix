import { useRef, useState } from "react";
import { useNotesStore, addNote, updateNote } from "@/lib/notesStore";

const COLORS = [
  { id: "yellow", label: "Yellow", bg: "linear-gradient(160deg, #fff8a8 0%, #ffe97a 100%)", text: "#1c1c1e" },
  { id: "blue", label: "Blue", bg: "linear-gradient(160deg, #a8d8ff 0%, #7ab8ff 100%)", text: "#1c1c1e" },
  { id: "green", label: "Green", bg: "linear-gradient(160deg, #b8f0b8 0%, #7ae07a 100%)", text: "#1c1c1e" },
  { id: "pink", label: "Pink", bg: "linear-gradient(160deg, #ffb8d0 0%, #ff8aaf 100%)", text: "#1c1c1e" },
  { id: "black", label: "Black", bg: "linear-gradient(160deg, #2a2a2a 0%, #1a1a1a 100%)", text: "#ffffff" },
  { id: "white", label: "White", bg: "linear-gradient(160deg, #ffffff 0%, #f0f0f0 100%)", text: "#1c1c1e" },
  { id: "brown", label: "Brown", bg: "linear-gradient(160deg, #8b6f47 0%, #6b4f2f 100%)", text: "#ffffff" },
];

export default function NotesWidget({ instanceId, getMeta, setMeta }) {
  const notes = useNotesStore();
  const meta = getMeta() || {};
  const [draftBody, setDraftBody] = useState("");
  const [showColors, setShowColors] = useState(false);
  const taRef = useRef(null);

  const colorId = meta.color || "yellow";
  const colorDef = COLORS.find((c) => c.id === colorId) || COLORS[0];

  const linkedNoteId = meta.noteId;
  const linkedNote = linkedNoteId ? notes.find((n) => n.id === linkedNoteId) : null;

  const onChange = (e) => {
    const value = e.target.value;
    if (linkedNote) {
      updateNote(linkedNote.id, { body: value });
    } else if (value.length > 0) {
      const created = addNote({ title: "Sticky", body: value });
      setMeta({ ...meta, noteId: created.id });
      setDraftBody("");
    }
  };

  const value = linkedNote ? linkedNote.body : draftBody;

  return (
    <div
      className="w-full h-full p-3 flex flex-col font-space relative"
      style={{ background: colorDef.bg, color: colorDef.text, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)" }}
      onClick={() => taRef.current?.focus()}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider opacity-50">Sticky Note</span>
        <button
          onClick={(e) => { e.stopPropagation(); setShowColors(!showColors); }}
          className="w-4 h-4 rounded-full border border-current/20 opacity-60 hover:opacity-100"
          style={{ background: colorDef.bg }}
        />
      </div>
      {showColors && (
        <div className="absolute top-8 right-3 z-10 flex gap-1 p-1.5 rounded-lg" style={{ background: "rgba(30,30,30,0.9)", backdropFilter: "blur(12px)" }}>
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={(e) => { e.stopPropagation(); setMeta({ ...meta, color: c.id }); setShowColors(false); }}
              className={`w-5 h-5 rounded-full border ${colorId === c.id ? "ring-2 ring-white" : "border-white/20"}`}
              style={{ background: c.bg }}
              title={c.label}
            />
          ))}
        </div>
      )}
      <textarea
        ref={taRef}
        value={value}
        onChange={onChange}
        onFocus={() => {
          if (!linkedNote) {
            const created = addNote({ title: "Sticky", body: draftBody });
            setMeta({ ...meta, noteId: created.id });
          }
        }}
        placeholder="Type something..."
        className="flex-1 bg-transparent outline-none resize-none text-sm placeholder:opacity-35 leading-snug"
        style={{ color: colorDef.text }}
      />
    </div>
  );
}

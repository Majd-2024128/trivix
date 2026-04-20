import { useEffect, useRef, useState } from "react";
import { useNotesStore, addNote, updateNote } from "@/lib/notesStore";

// A sticky note that mirrors a single note in the Notes app store.
// On first click, creates the underlying note; later edits sync both ways.
export default function NotesWidget({ instanceId, getMeta, setMeta }) {
  const notes = useNotesStore();
  const meta = getMeta() || {};
  const [draftBody, setDraftBody] = useState("");
  const taRef = useRef(null);

  // Resolve which underlying note this widget is bound to.
  const linkedNoteId = meta.noteId;
  const linkedNote = linkedNoteId ? notes.find((n) => n.id === linkedNoteId) : null;

  const ensureNote = () => {
    if (linkedNote) return linkedNote;
    const created = addNote({ title: "Sticky", body: draftBody });
    setMeta({ ...meta, noteId: created.id });
    return created;
  };

  const onChange = (e) => {
    const value = e.target.value;
    if (linkedNote) {
      updateNote(linkedNote.id, { body: value });
    } else if (value.length === 0) {
      setDraftBody("");
    } else {
      const created = addNote({ title: "Sticky", body: value });
      setMeta({ ...meta, noteId: created.id });
      setDraftBody("");
    }
  };

  const value = linkedNote ? linkedNote.body : draftBody;

  return (
    <div
      className="w-full h-full p-3 flex flex-col font-space text-[#1c1c1e]"
      style={{
        background: "linear-gradient(160deg, #fff8a8 0%, #ffe97a 100%)",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)",
      }}
      onClick={() => taRef.current?.focus()}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-black/50">Sticky Note</span>
        {linkedNote && <span className="text-[9px] text-black/40">in Notes</span>}
      </div>
      <textarea
        ref={taRef}
        value={value}
        onChange={onChange}
        onFocus={ensureNote}
        placeholder="Type something..."
        className="flex-1 bg-transparent outline-none resize-none text-sm text-black/85 placeholder:text-black/35 leading-snug"
      />
    </div>
  );
}

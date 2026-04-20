// Lightweight in-memory pub/sub store for notes, shared between the Notes app
// and the Sticky Notes widget. Session-only (no persistence).
import { useEffect, useState } from "react";

let _notes = [];
const _listeners = new Set();

function emit() {
  for (const fn of _listeners) fn(_notes);
}

export function getNotes() {
  return _notes;
}

export function setNotes(next) {
  _notes = typeof next === "function" ? next(_notes) : next;
  emit();
}

export function addNote(note) {
  const full = { id: Date.now() + Math.random(), title: "New Note", body: "", updated: Date.now(), ...note };
  _notes = [full, ..._notes];
  emit();
  return full;
}

export function updateNote(id, patch) {
  _notes = _notes.map((n) => (n.id === id ? { ...n, ...patch, updated: Date.now() } : n));
  emit();
}

export function deleteNote(id) {
  _notes = _notes.filter((n) => n.id !== id);
  emit();
}

export function useNotesStore() {
  const [notes, set] = useState(_notes);
  useEffect(() => {
    const fn = (n) => set(n);
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }, []);
  return notes;
}

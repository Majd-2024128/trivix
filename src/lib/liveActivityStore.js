// Lightweight pub-sub for the menu bar "live activity" indicator.
// Apps call setActivity({ icon, label, color, onClick }) and clearActivity(key).
import { useEffect, useState } from "react";

const activities = new Map(); // key -> activity
const listeners = new Set();

function emit() { for (const fn of listeners) fn(Array.from(activities.values())); }

export const liveActivity = {
  set(key, activity) { activities.set(key, { ...activity, key }); emit(); },
  clear(key) { activities.delete(key); emit(); },
  all() { return Array.from(activities.values()); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

export function useLiveActivity() {
  const [items, set] = useState(() => liveActivity.all());
  useEffect(() => liveActivity.subscribe(set), []);
  return items;
}

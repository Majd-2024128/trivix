// Simple connections store for WiFi & Bluetooth. Uses localStorage + listeners.
const KEY = "trivix_connections";

const DEFAULT = {
  wifi: { enabled: true, ssid: "Trivix-Net", strength: 4 },
  bluetooth: {
    enabled: true,
    devices: [
      { id: "1", name: "AirPods Pro", connected: true, battery: 78 },
      { id: "2", name: "Magic Mouse", connected: true, battery: 45 },
      { id: "3", name: "Magic Keyboard", connected: false, battery: 92 },
    ],
  },
};

const listeners = new Set();

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && v.wifi && v.bluetooth) return v;
  } catch {}
  return DEFAULT;
}
function write(v) {
  localStorage.setItem(KEY, JSON.stringify(v));
  listeners.forEach((l) => l(v));
}

export const connections = {
  get: read,
  set(patch) { write({ ...read(), ...patch }); },
  toggleWifi() { const v = read(); write({ ...v, wifi: { ...v.wifi, enabled: !v.wifi.enabled } }); },
  toggleBluetooth() { const v = read(); write({ ...v, bluetooth: { ...v.bluetooth, enabled: !v.bluetooth.enabled } }); },
  toggleDevice(id) {
    const v = read();
    write({ ...v, bluetooth: { ...v.bluetooth, devices: v.bluetooth.devices.map((d) => d.id === id ? { ...d, connected: !d.connected } : d) } });
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

import { useEffect, useState } from "react";
export function useConnections() {
  const [v, setV] = useState(read);
  useEffect(() => connections.subscribe(setV), []);
  return v;
}

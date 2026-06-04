// Connections store for WiFi (simulated) & Bluetooth (real navigator.bluetooth + sim).
import { useEffect, useState } from "react";

const KEY = "trivix_connections_v2";

const DEFAULT_NETWORKS = [
  { ssid: "Trivix-Net", security: "WPA2", strength: 4 },
  { ssid: "Home-WiFi", security: "WPA3", strength: 3 },
  { ssid: "Cafe Guest", security: "Open", strength: 3 },
  { ssid: "Neighbor 5G", security: "WPA2", strength: 2 },
  { ssid: "Linksys-2.4", security: "WPA2", strength: 1 },
];

const DEFAULT = {
  wifi: {
    enabled: true,
    connecting: null, // ssid being connected
    activeSsid: "Trivix-Net",
    networks: DEFAULT_NETWORKS,
  },
  bluetooth: {
    enabled: true,
    scanning: false,
    devices: [
      { id: "1", name: "AirPods Pro", connected: true, battery: 78, simulated: true },
      { id: "2", name: "Magic Mouse", connected: true, battery: 45, simulated: true },
      { id: "3", name: "Magic Keyboard", connected: false, battery: 92, simulated: true },
    ],
  },
};

const listeners = new Set();
const gattCache = new Map(); // id -> BluetoothRemoteGATTServer

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
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  // WiFi
  toggleWifi() {
    const v = read();
    write({ ...v, wifi: { ...v.wifi, enabled: !v.wifi.enabled, activeSsid: v.wifi.enabled ? null : v.wifi.activeSsid } });
  },
  setSsid(ssid) {
    const v = read();
    write({ ...v, wifi: { ...v.wifi, ssid } });
  },
  connectWifi(ssid) {
    const v = read();
    if (!v.wifi.enabled) return;
    write({ ...v, wifi: { ...v.wifi, connecting: ssid } });
    setTimeout(() => {
      const cur = read();
      write({ ...cur, wifi: { ...cur.wifi, connecting: null, activeSsid: ssid } });
    }, 2000);
  },
  disconnectWifi() {
    const v = read();
    write({ ...v, wifi: { ...v.wifi, activeSsid: null } });
  },

  // Bluetooth - real scan via Web Bluetooth API
  toggleBluetooth() {
    const v = read();
    write({ ...v, bluetooth: { ...v.bluetooth, enabled: !v.bluetooth.enabled } });
  },
  async scanBluetooth() {
    if (!navigator.bluetooth) {
      alert("Web Bluetooth is not supported in this browser.");
      return null;
    }
    const v = read();
    write({ ...v, bluetooth: { ...v.bluetooth, scanning: true } });
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service"],
      });
      let battery = 100;
      try {
        const server = await device.gatt.connect();
        gattCache.set(device.id, server);
        try {
          const svc = await server.getPrimaryService("battery_service");
          const ch = await svc.getCharacteristic("battery_level");
          const val = await ch.readValue();
          battery = val.getUint8(0);
        } catch {}
        device.addEventListener("gattserverdisconnected", () => {
          const cur = read();
          write({
            ...cur,
            bluetooth: {
              ...cur.bluetooth,
              devices: cur.bluetooth.devices.map((d) => d.id === device.id ? { ...d, connected: false } : d),
            },
          });
        });
      } catch {}
      const cur = read();
      const existing = cur.bluetooth.devices.find((d) => d.id === device.id);
      const updated = existing
        ? cur.bluetooth.devices.map((d) => d.id === device.id ? { ...d, connected: true, battery } : d)
        : [...cur.bluetooth.devices, { id: device.id, name: device.name || "Unknown Device", connected: true, battery, simulated: false }];
      write({ ...cur, bluetooth: { ...cur.bluetooth, scanning: false, devices: updated } });
      return device;
    } catch (e) {
      const cur = read();
      write({ ...cur, bluetooth: { ...cur.bluetooth, scanning: false } });
      return null;
    }
  },
  async toggleDevice(id) {
    const v = read();
    const dev = v.bluetooth.devices.find((d) => d.id === id);
    if (!dev) return;
    if (!dev.simulated && !dev.connected) {
      // attempt re-connect via cached gatt
      const server = gattCache.get(id);
      if (server) { try { await server.connect(); } catch {} }
    }
    if (!dev.simulated && dev.connected) {
      const server = gattCache.get(id);
      if (server) { try { server.disconnect(); } catch {} }
    }
    write({
      ...v,
      bluetooth: {
        ...v.bluetooth,
        devices: v.bluetooth.devices.map((d) => d.id === id ? { ...d, connected: !d.connected } : d),
      },
    });
  },
  removeDevice(id) {
    const v = read();
    const server = gattCache.get(id);
    if (server) { try { server.disconnect(); } catch {} gattCache.delete(id); }
    write({ ...v, bluetooth: { ...v.bluetooth, devices: v.bluetooth.devices.filter((d) => d.id !== id) } });
  },
};

export function useConnections() {
  const [v, setV] = useState(read);
  useEffect(() => connections.subscribe(setV), []);
  return v;
}

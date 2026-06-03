import { Bluetooth, BluetoothOff } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useConnections, connections } from "@/lib/connectionsStore";

export default function BluetoothWidget() {
  const { isDark } = useTheme();
  const conn = useConnections();
  const devices = conn.bluetooth.devices.slice(0, 5);

  return (
    <div className={`h-full w-full rounded-2xl ${isDark ? "bg-[#1c1c1e]/70" : "bg-white/70"} backdrop-blur-md p-4 flex flex-col font-space ${isDark ? "text-white" : "text-[#1c1c1e]"}`}>
      <div className="flex items-center gap-2 mb-3">
        {conn.bluetooth.enabled ? <Bluetooth className="w-4 h-4 text-blue-400" /> : <BluetoothOff className="w-4 h-4 opacity-50" />}
        <span className="text-xs font-medium opacity-70 flex-1">Bluetooth</span>
        <button onClick={() => connections.toggleBluetooth()}
          className={`relative w-8 h-4 rounded-full transition-colors ${conn.bluetooth.enabled ? "bg-blue-500" : isDark ? "bg-white/15" : "bg-black/15"}`}>
          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${conn.bluetooth.enabled ? "left-[18px]" : "left-0.5"}`} />
        </button>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {conn.bluetooth.enabled ? devices.map((d) => (
          <button key={d.id} onClick={() => connections.toggleDevice(d.id)}
            className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-[11px] transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
            <span className="truncate flex-1 text-left">{d.name}</span>
            <span className={`text-[10px] tabular-nums ${d.connected ? "text-green-400" : "opacity-50"}`}>
              {d.connected ? `${d.battery}%` : "off"}
            </span>
          </button>
        )) : <div className="text-[11px] opacity-50 text-center pt-4">Bluetooth is off</div>}
      </div>
    </div>
  );
}

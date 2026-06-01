import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import DockIcon from "./DockIcon";
import { useTheme } from "@/lib/ThemeContext";

import weatherIconDark from "@/assets/weather-icon-dark.png";
import weatherIconLight from "@/assets/weather-icon.png";
import calculatorIconDark from "@/assets/calculator-icon-dark.png";
import calculatorIconLight from "@/assets/calculator-icon.png";
import calendarIconDark from "@/assets/calendar-icon-dark.png";
import calendarIconLight from "@/assets/calendar-icon.png";
import notesIconDark from "@/assets/notes-icon-dark.png";
import notesIconLight from "@/assets/notes-icon.png";
import clockIconDark from "@/assets/clock-icon-dark.png";
import clockIconLight from "@/assets/clock-icon-light.png";
import questIconDark from "@/assets/quest-icon-dark.png";
import questIconLight from "@/assets/quest-icon-light.png";
import chessIconDark from "@/assets/chess-icon-dark.png";
import chessIconLight from "@/assets/chess-icon.png";
import filesIconDark from "@/assets/files-icon-dark.png";
import filesIconLight from "@/assets/files-icon-light.png";
import canvasIconDark from "@/assets/canvas-icon-dark.png";
import canvasIconLight from "@/assets/canvas-icon-light.png";
import tipsIconDark from "@/assets/tips-icon-dark.png";
import tipsIconLight from "@/assets/tips-icon-light.png";

export const APP_DEFS = [
  { id: "weather", name: "Weather", iconDark: weatherIconDark, iconLight: weatherIconLight },
  { id: "calculator", name: "Calculator", iconDark: calculatorIconDark, iconLight: calculatorIconLight },
  { id: "calendar", name: "Calendar", iconDark: calendarIconDark, iconLight: calendarIconLight },
  { id: "notes", name: "Notes", iconDark: notesIconDark, iconLight: notesIconLight },
  { id: "clock", name: "Clock", iconDark: clockIconDark, iconLight: clockIconLight },
  { id: "quest", name: "Quest", iconDark: questIconDark, iconLight: questIconLight },
  { id: "chess", name: "Chess", iconDark: chessIconDark, iconLight: chessIconLight },
  { id: "files", name: "Files", iconDark: filesIconDark, iconLight: filesIconLight },
  { id: "canvas", name: "Canvas", iconDark: canvasIconDark, iconLight: canvasIconLight },
  // Tips: searchable in Quest Bar but intentionally NOT in dock
  { id: "tips", name: "Tips", iconDark: tipsIconDark, iconLight: tipsIconLight, hiddenFromDock: true },
];

export const APPS = APP_DEFS.map((a) => ({ id: a.id, name: a.name, icon: a.iconDark }));

const DEFAULT_ORDER = APP_DEFS.filter((a) => !a.hiddenFromDock).map((a) => a.id);

export default function Dock({ onOpenApp, openApps, onCloseApp, autoHide, hiddenApps = [], onToggleHideApp, onPinApp, onDropAppToDesktop, dockHidden = false }) {
  const { isDark } = useTheme();
  const [order, setOrder] = useState(() => {
    try {
      const s = localStorage.getItem("trivix_dock_order");
      let parsed = s ? JSON.parse(s) : DEFAULT_ORDER;
      parsed = parsed.map((id) => id === "editors" ? "canvas" : id).filter((id) => id !== "tips" && id !== "editors");
      return parsed;
    } catch { return DEFAULT_ORDER; }
  });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const missing = DEFAULT_ORDER.filter((id) => !order.includes(id));
    if (missing.length > 0) setOrder((prev) => [...prev, ...missing]);
    setOrder((prev) => prev.filter((id) => id !== "editors" && id !== "tips"));
  }, []);

  useEffect(() => { localStorage.setItem("trivix_dock_order", JSON.stringify(order)); }, [order]);

  useEffect(() => {
    const move = (e) => { window.__trivixDockPointer = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // Show hidden apps temporarily when they are open
  const visibleOrder = order.filter((id) => !hiddenApps.includes(id) || openApps.includes(id));

  const apps = visibleOrder
    .map((id) => APP_DEFS.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => ({ id: a.id, name: a.name, iconDark: a.iconDark, iconLight: a.iconLight, icon: isDark ? a.iconDark : a.iconLight, useDark: isDark }));

  const handleDragEnd = (result) => {
    if (!result.destination) {
      const p = window.__trivixDockPointer;
      if (p && p.y < window.innerHeight - 40) onDropAppToDesktop?.(result.draggableId, p);
      return;
    }
    const visIds = visibleOrder.slice();
    const [removed] = visIds.splice(result.source.index, 1);
    visIds.splice(result.destination.index, 0, removed);
    const newOrder = [...visIds, ...order.filter((id) => hiddenApps.includes(id) && !openApps.includes(id))];
    setOrder(newOrder);
  };

  const handleDragStart = (start) => {
    window.__trivixDraggingDockApp = start.draggableId;
  };

  const containerCls = isDark
    ? "border-white/15 bg-white/[0.18] shadow-black/25"
    : "border-black/10 bg-white/55 shadow-black/15";

  const show = autoHide ? hovered : true;

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[130]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ paddingBottom: 12, paddingTop: autoHide ? 20 : 0 }}
    >
      <div
        style={{
          transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.3s",
          transform: show && !dockHidden ? "translateY(0)" : "translateY(calc(100% + 20px))",
          opacity: show && !dockHidden ? 1 : 0,
        }}
      >
        <DragDropContext onDragStart={handleDragStart} onDragEnd={(result) => { handleDragEnd(result); window.__trivixDraggingDockApp = null; }}>
          <Droppable droppableId="dock" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex flex-row items-end gap-2 rounded-[20px] border px-4 py-2 shadow-2xl backdrop-blur-2xl ${containerCls}`}
              >
                {apps.map((app, index) => (
                  <Draggable key={app.id} draggableId={app.id} index={index}>
                    {(dragProvided, snapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        style={{ ...dragProvided.draggableProps.style, opacity: snapshot.isDragging ? 0.85 : 1 }}
                      >
                        <DockIcon
                          app={app}
                          onClick={() => onOpenApp(app)}
                          isOpen={openApps.includes(app.id)}
                          onClose={() => onCloseApp(app.id)}
                          onHideFromDock={onToggleHideApp ? () => onToggleHideApp(app.id) : undefined}
                          isHidden={hiddenApps.includes(app.id)}
                          onPinToDock={onPinApp && hiddenApps.includes(app.id) ? () => onPinApp(app.id) : undefined}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}

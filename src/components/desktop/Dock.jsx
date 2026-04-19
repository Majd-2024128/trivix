import { useState } from "react";
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

const APP_DEFS = [
  { id: "weather", name: "Weather", iconDark: weatherIconDark, iconLight: weatherIconLight },
  { id: "calculator", name: "Calculator", iconDark: calculatorIconDark, iconLight: calculatorIconLight },
  { id: "calendar", name: "Calendar", iconDark: calendarIconDark, iconLight: calendarIconLight },
  { id: "notes", name: "Notes", iconDark: notesIconDark, iconLight: notesIconLight },
  { id: "clock", name: "Clock", iconDark: clockIconDark, iconLight: clockIconLight },
  { id: "quest", name: "Quest", iconDark: questIconDark, iconLight: questIconLight },
  { id: "chess", name: "Chess", iconDark: chessIconDark, iconLight: chessIconLight },
];

// Backwards-compat export (uses dark icon by default)
export const APPS = APP_DEFS.map((a) => ({ id: a.id, name: a.name, icon: a.iconDark }));

export default function Dock({ onOpenApp, openApps, onCloseApp }) {
  const { isDark } = useTheme();
  const [order, setOrder] = useState(APP_DEFS.map((a) => a.id));

  const apps = order
    .map((id) => APP_DEFS.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => ({ id: a.id, name: a.name, icon: isDark ? a.iconDark : a.iconLight }));

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(order);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setOrder(reordered);
  };

  const containerCls = isDark
    ? "border-white/15 bg-white/[0.18] shadow-black/25"
    : "border-black/10 bg-white/55 shadow-black/15";

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
      <DragDropContext onDragEnd={handleDragEnd}>
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
                      style={{
                        ...dragProvided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.85 : 1,
                      }}
                    >
                      <DockIcon
                        app={app}
                        onClick={() => onOpenApp(app)}
                        isOpen={openApps.includes(app.id)}
                        onClose={() => onCloseApp(app.id)}
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
  );
}

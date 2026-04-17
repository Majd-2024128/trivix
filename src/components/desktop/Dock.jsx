import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import DockIcon from "./DockIcon";
import weatherIcon from "@/assets/weather-icon.png";
import calculatorIcon from "@/assets/calculator-icon.png";
import notesIcon from "@/assets/notes-icon.png";
import clockIcon from "@/assets/clock-icon.png";
import calendarIcon from "@/assets/calendar-icon.png";
import questIcon from "@/assets/quest-icon.png";
import chessIcon from "@/assets/chess-icon.png";

const INITIAL_APPS = [
  { id: "weather", name: "Weather", icon: weatherIcon },
  { id: "calculator", name: "Calculator", icon: calculatorIcon },
  { id: "calendar", name: "Calendar", icon: calendarIcon },
  { id: "notes", name: "Notes", icon: notesIcon },
  { id: "clock", name: "Clock", icon: clockIcon },
  { id: "quest", name: "Quest", icon: questIcon },
  { id: "chess", name: "Chess", icon: chessIcon },
];

export { INITIAL_APPS as APPS };

export default function Dock({ onOpenApp, openApps, onCloseApp }) {
  const [apps, setApps] = useState(INITIAL_APPS);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(apps);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setApps(reordered);
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dock" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-row items-end gap-2 rounded-[20px] border border-white/15 bg-white/[0.18] px-4 py-2 shadow-2xl shadow-black/25 backdrop-blur-2xl"
            >
              {apps.map((app, index) => (
                <Draggable key={app.id} draggableId={app.id} index={index}>
                  {(dragProvided) => (
                    <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}>
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

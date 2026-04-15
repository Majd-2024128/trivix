const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import DockIcon from "./DockIcon";

const INITIAL_APPS = [
  { id: "weather", name: "Weather", icon: "https://media.db.com/images/public/69da4028252efa86ced524b1/63012ae12_1.png", color: "#0c4a6e" },
  { id: "calculator", name: "Calculator", icon: "https://media.db.com/images/public/69da4028252efa86ced524b1/4bbaac21c_2.png", color: "#1c1c1e" },
  { id: "notes", name: "Notes", icon: "https://media.db.com/images/public/69da4028252efa86ced524b1/55cd21cc7_3.png", color: "#713f12" },
  { id: "clock", name: "Clock", icon: "https://media.db.com/images/public/69da4028252efa86ced524b1/c4286b0d2_4.png", color: "#1c1c2e" },
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
              className="px-4 py-2 rounded-[20px] flex flex-row items-end gap-2"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)"
              }}
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
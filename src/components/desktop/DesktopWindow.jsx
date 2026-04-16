import { useState, useRef, useCallback, useEffect } from "react";

export default function DesktopWindow({ app, onClose, onFocus, zIndex, initialPos, isMinimized, onMinimize, children }) {
  const [pos, setPos] = useState(initialPos || { x: 80, y: 40 });
  const [size, setSize] = useState({ w: 700, h: 480 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const prevState = useRef({ pos: { x: 80, y: 40 }, size: { w: 700, h: 480 } });
  const controlsRef = useRef(null);

  const toggleMaximize = useCallback(() => {
    setIsMaximized((prev) => {
      if (prev) {
        setPos(prevState.current.pos);
        setSize(prevState.current.size);
      } else {
        prevState.current = { pos, size };
        setPos({ x: 0, y: 0 });
        setSize({ w: window.innerWidth, h: window.innerHeight - 80 });
      }
      return !prev;
    });
  }, [pos, size]);

  const toggleMinimize = useCallback(() => {
    if (onMinimize) onMinimize();
  }, [onMinimize]);

  controlsRef.current = { close: onClose, minimize: toggleMinimize, maximize: toggleMaximize, appName: app.name };

  const notifyFocus = useCallback(() => {
    onFocus(controlsRef.current);
  }, [onFocus]);

  useEffect(() => {
    notifyFocus();
  }, []);

  const handleMouseDownDrag = useCallback((e) => {
    if (isMaximized) return;
    e.preventDefault();
    notifyFocus();
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    setIsDragging(true);
  }, [pos, isMaximized, notifyFocus]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e) => {
      setPos({
        x: Math.max(0, e.clientX - dragOffset.current.x),
        y: Math.max(0, e.clientY - dragOffset.current.y),
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (isMinimized) return null;

  return (
    <div
      className="absolute rounded-xl overflow-hidden shadow-2xl shadow-black/30 flex flex-col"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        zIndex,
        transition: isDragging ? "none" : "box-shadow 0.2s",
      }}
      onMouseDown={notifyFocus}
    >
      {/* Visible drag bar */}
      <div
        className="h-7 shrink-0 select-none flex items-center justify-center"
        style={{
          cursor: isMaximized ? "default" : "grab",
          background: "rgba(30, 30, 30, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
        onMouseDown={handleMouseDownDrag}
        onDoubleClick={toggleMaximize}
      >
        <div className="w-8 h-1 rounded-full bg-white/20" />
      </div>

      {/* Content */}
      <div className="w-full flex-1 relative overflow-hidden">
        <div className="w-full h-full" style={{ pointerEvents: isDragging ? "none" : "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

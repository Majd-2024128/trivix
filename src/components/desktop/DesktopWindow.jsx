import { useState, useRef, useCallback, useEffect } from "react";

export default function DesktopWindow({ app, onClose, onFocus, zIndex, initialPos, children }) {
  const [pos, setPos] = useState(initialPos || { x: 80, y: 40 });
  const [size, setSize] = useState({ w: 700, h: 480 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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
    setIsMinimized((v) => !v);
  }, []);

  // Keep controls ref up to date
  controlsRef.current = { close: onClose, minimize: toggleMinimize, maximize: toggleMaximize, appName: app.name };

  const notifyFocus = useCallback(() => {
    onFocus(controlsRef.current);
  }, [onFocus]);

  // Auto-focus on mount so controls appear immediately
  useEffect(() => {
    notifyFocus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* Drag handle — invisible, positioned at top */}
      <div
        className="absolute top-0 left-0 right-0 h-6 shrink-0 select-none z-10"
        style={{ cursor: isMaximized ? "default" : "grab" }}
        onMouseDown={handleMouseDownDrag}
      />

      {/* Content */}
      <div className="w-full h-full relative overflow-hidden">
        <div className="w-full h-full" style={{ pointerEvents: isDragging ? "none" : "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
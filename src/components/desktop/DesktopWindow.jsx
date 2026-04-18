import { useState, useRef, useCallback, useEffect } from "react";

const MIN_W = 360;
const MIN_H = 260;

export default function DesktopWindow({ app, onClose, onFocus, zIndex, initialPos, isMinimized, onMinimize, children }) {
  const [pos, setPos] = useState(initialPos || { x: 80, y: 40 });
  const [size, setSize] = useState({ w: 720, h: 500 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDir, setResizeDir] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef(null);
  const prevState = useRef({ pos: { x: 80, y: 40 }, size: { w: 720, h: 500 } });
  const controlsRef = useRef(null);

  const toggleMaximize = useCallback(() => {
    setIsMaximized((prev) => {
      if (prev) {
        setPos(prevState.current.pos);
        setSize(prevState.current.size);
      } else {
        prevState.current = { pos, size };
        setPos({ x: 0, y: 28 });
        setSize({ w: window.innerWidth, h: window.innerHeight - 28 - 80 });
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

  useEffect(() => { notifyFocus(); }, []);

  const handleMouseDownDrag = useCallback((e) => {
    if (isMaximized) return;
    e.preventDefault();
    notifyFocus();
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    setIsDragging(true);
  }, [pos, isMaximized, notifyFocus]);

  const startResize = useCallback((dir) => (e) => {
    if (isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    notifyFocus();
    resizeStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: pos.x,
      y: pos.y,
      w: size.w,
      h: size.h,
      dir,
    };
    setResizeDir(dir);
  }, [pos, size, isMaximized, notifyFocus]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      setPos({
        x: Math.max(0, e.clientX - dragOffset.current.x),
        y: Math.max(28, e.clientY - dragOffset.current.y),
      });
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!resizeDir) return;
    const handleMove = (e) => {
      const s = resizeStart.current;
      if (!s) return;
      const dx = e.clientX - s.mouseX;
      const dy = e.clientY - s.mouseY;
      let { x, y, w, h } = s;
      if (s.dir.includes("e")) w = Math.max(MIN_W, s.w + dx);
      if (s.dir.includes("s")) h = Math.max(MIN_H, s.h + dy);
      if (s.dir.includes("w")) {
        const newW = Math.max(MIN_W, s.w - dx);
        x = s.x + (s.w - newW);
        w = newW;
      }
      if (s.dir.includes("n")) {
        const newH = Math.max(MIN_H, s.h - dy);
        y = Math.max(28, s.y + (s.h - newH));
        h = newH;
      }
      setPos({ x, y });
      setSize({ w, h });
    };
    const handleUp = () => { setResizeDir(null); resizeStart.current = null; };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [resizeDir]);

  const interacting = isDragging || !!resizeDir;

  return (
    <div
      className="absolute rounded-xl overflow-hidden shadow-2xl shadow-black/30 flex flex-col"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        zIndex,
        transition: interacting ? "none" : "box-shadow 0.2s",
        display: isMinimized ? "none" : "flex",
      }}
      onMouseDown={notifyFocus}
    >
      {/* Drag bar */}
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

      {/* Content - kept mounted while minimized so apps run in background */}
      <div className="w-full flex-1 relative overflow-hidden">
        <div className="w-full h-full" style={{ pointerEvents: interacting ? "none" : "auto" }}>
          {children}
        </div>
      </div>

      {/* Resize handles (corners + edges) */}
      {!isMaximized && (
        <>
          <div onMouseDown={startResize("n")} className="absolute top-0 left-3 right-3 h-1 cursor-n-resize z-50" />
          <div onMouseDown={startResize("s")} className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize z-50" />
          <div onMouseDown={startResize("w")} className="absolute top-3 bottom-3 left-0 w-1 cursor-w-resize z-50" />
          <div onMouseDown={startResize("e")} className="absolute top-3 bottom-3 right-0 w-1 cursor-e-resize z-50" />
          <div onMouseDown={startResize("nw")} className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-50" />
          <div onMouseDown={startResize("ne")} className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-50" />
          <div onMouseDown={startResize("sw")} className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-50" />
          <div onMouseDown={startResize("se")} className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50" />
        </>
      )}
    </div>
  );
}

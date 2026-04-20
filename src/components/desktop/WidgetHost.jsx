import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";
import { GRID, getWidgetDef } from "@/lib/widgetDefs";

// A single on-desktop widget. Snaps position & size to the GRID. Hover -> X close,
// right-click -> Remove menu. Drag from anywhere except interactive controls/inputs.
export default function WidgetHost({ widget, onUpdate, onRemove, onFocus }) {
  const def = getWidgetDef(widget.type);
  const [hovered, setHovered] = useState(false);
  const [menu, setMenu] = useState(null); // {x,y}
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  if (!def) return null;
  const { Component, minSize, maxSize } = def;

  const px = {
    left: widget.pos.x * GRID,
    top:  widget.pos.y * GRID,
    width:  widget.size.w * GRID,
    height: widget.size.h * GRID,
  };

  const handleMouseDown = useCallback((e) => {
    // Don't start drag from interactive elements inside the widget.
    const tag = e.target.tagName;
    const interactive = ["INPUT", "TEXTAREA", "BUTTON", "SELECT", "A"].includes(tag) || e.target.closest("button, input, textarea, select, a");
    if (interactive) return;
    if (e.button !== 0) return;
    e.preventDefault();
    onFocus?.();
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      origX: widget.pos.x, origY: widget.pos.y,
    };
    setDragging(true);
  }, [widget.pos.x, widget.pos.y, onFocus]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const r = dragRef.current; if (!r) return;
      const dx = Math.round((e.clientX - r.startX) / GRID);
      const dy = Math.round((e.clientY - r.startY) / GRID);
      const maxX = Math.floor((window.innerWidth - widget.size.w * GRID) / GRID);
      const maxY = Math.floor((window.innerHeight - widget.size.h * GRID - 80) / GRID);
      onUpdate({ pos: {
        x: Math.max(0, Math.min(maxX, r.origX + dx)),
        y: Math.max(1, Math.min(maxY, r.origY + dy)),
      }});
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, widget.size.w, widget.size.h, onUpdate]);

  const startResize = (e) => {
    e.preventDefault(); e.stopPropagation();
    onFocus?.();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: widget.size.w, origH: widget.size.h };
    setResizing(true);
  };

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e) => {
      const r = resizeRef.current; if (!r) return;
      const dw = Math.round((e.clientX - r.startX) / GRID);
      const dh = Math.round((e.clientY - r.startY) / GRID);
      const w = Math.max(minSize.w, Math.min(maxSize.w, r.origW + dw));
      const h = Math.max(minSize.h, Math.min(maxSize.h, r.origH + dh));
      onUpdate({ size: { w, h } });
    };
    const onUp = () => setResizing(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizing, minSize, maxSize, onUpdate]);

  const handleContext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!menu) return;
    const dismiss = () => setMenu(null);
    const onKey = (e) => { if (e.key === "Escape") setMenu(null); };
    const t = setTimeout(() => {
      window.addEventListener("mousedown", dismiss);
      window.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousedown", dismiss);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const getMeta = () => widget.meta || {};
  const setMeta = (next) => onUpdate({ meta: typeof next === "function" ? next(widget.meta || {}) : next });

  return (
    <>
      <div
        className="absolute rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/10"
        style={{
          ...px,
          zIndex: widget.zIndex || 5,
          transition: dragging || resizing ? "none" : "box-shadow 0.15s",
          cursor: dragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onContextMenu={handleContext}
      >
        <Component getMeta={getMeta} setMeta={setMeta} size={{ w: px.width, h: px.height }} instanceId={widget.id} />

        {/* Hover X close */}
        {hovered && (
          <button
            onMouseDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/55 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
            title="Remove widget"
            style={{ zIndex: 2 }}
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Resize handle (bottom-right) */}
        <div
          onMouseDown={startResize}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          style={{ zIndex: 3 }}
          title="Resize"
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-white/50 rounded-br-sm" />
        </div>
      </div>

      {/* Right-click remove menu */}
      {menu && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed z-[70] rounded-lg overflow-hidden shadow-2xl min-w-[160px]"
          style={{
            left: Math.min(menu.x, window.innerWidth - 180),
            top: Math.min(menu.y, window.innerHeight - 80),
            background: "rgba(30,30,30,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <button
            onClick={() => { setMenu(null); onRemove(); }}
            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/10 font-space transition-colors"
          >
            Remove Widget
          </button>
        </div>
      )}
    </>
  );
}

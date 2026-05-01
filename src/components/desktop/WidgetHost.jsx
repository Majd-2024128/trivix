import { useEffect, useRef, useState, useCallback } from "react";
import { GRID, getWidgetDef } from "@/lib/widgetDefs";

const EDGE_MARGIN = 1; // 20px from edges
const WIDGET_GAP = 1;  // 20px between widgets
const DOCK_RESERVE = 80;
const MENU_BAR_CELLS = 2; // 40px top

export default function WidgetHost({ widget, onUpdate, onRemove, onFocus, allWidgets = [] }) {
  const def = getWidgetDef(widget.type);
  const [menu, setMenu] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  if (!def) return null;
  const { Component, minSize, maxSize } = def;

  const px = {
    left: widget.pos.x * GRID,
    top: widget.pos.y * GRID,
    width: widget.size.w * GRID,
    height: widget.size.h * GRID,
  };

  const collides = (x, y, w, h) => {
    return allWidgets.some((other) => {
      if (other.id === widget.id) return false;
      return (
        x < other.pos.x + other.size.w + WIDGET_GAP &&
        x + w + WIDGET_GAP > other.pos.x &&
        y < other.pos.y + other.size.h + WIDGET_GAP &&
        y + h + WIDGET_GAP > other.pos.y
      );
    });
  };

  const maxCols = Math.floor(window.innerWidth / GRID) - EDGE_MARGIN;
  const maxRows = Math.floor((window.innerHeight - DOCK_RESERVE) / GRID);

  const handleMouseDown = useCallback((e) => {
    const tag = e.target.tagName;
    if (["INPUT", "TEXTAREA", "BUTTON", "SELECT", "A"].includes(tag) || e.target.closest("button, input, textarea, select, a")) return;
    if (e.button !== 0) return;
    e.preventDefault();
    onFocus?.();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: widget.pos.x, origY: widget.pos.y };
    setDragging(true);
  }, [widget.pos.x, widget.pos.y, onFocus]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const r = dragRef.current;
        if (!r) return;
        const dx = Math.round((e.clientX - r.startX) / GRID);
        const dy = Math.round((e.clientY - r.startY) / GRID);
        let nx = Math.max(EDGE_MARGIN, Math.min(maxCols - widget.size.w, r.origX + dx));
        let ny = Math.max(MENU_BAR_CELLS, Math.min(maxRows - widget.size.h, r.origY + dy));
        if (collides(nx, ny, widget.size.w, widget.size.h)) return;
        onUpdate({ pos: { x: nx, y: ny } });
      });
    };
    const onUp = () => {
      setDragging(false);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging, widget.size.w, widget.size.h, onUpdate, allWidgets]);

  const startResize = (e) => {
    e.preventDefault(); e.stopPropagation();
    onFocus?.();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: widget.size.w, origH: widget.size.h };
    setResizing(true);
  };

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e) => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const r = resizeRef.current;
        if (!r) return;
        const dw = Math.round((e.clientX - r.startX) / GRID);
        const dh = Math.round((e.clientY - r.startY) / GRID);
        const w = Math.max(minSize.w, Math.min(maxSize.w, r.origW + dw));
        const h = Math.max(minSize.h, Math.min(maxSize.h, r.origH + dh));
        if (w === widget.size.w && h === widget.size.h) return;
        if (collides(widget.pos.x, widget.pos.y, w, h)) return;
        if (widget.pos.x + w > maxCols) return;
        if (widget.pos.y + h > maxRows) return;
        onUpdate({ size: { w, h } });
      });
    };
    const onUp = () => {
      setResizing(false);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [resizing, minSize, maxSize, onUpdate, allWidgets, widget.pos.x, widget.pos.y, widget.size.w, widget.size.h]);

  const handleContext = (e) => {
    e.preventDefault(); e.stopPropagation();
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
    return () => { clearTimeout(t); window.removeEventListener("mousedown", dismiss); window.removeEventListener("keydown", onKey); };
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
          transition: dragging || resizing
            ? "box-shadow 0.15s"
            : "left 200ms cubic-bezier(0.22,1,0.36,1), top 200ms cubic-bezier(0.22,1,0.36,1), width 200ms cubic-bezier(0.22,1,0.36,1), height 200ms cubic-bezier(0.22,1,0.36,1), opacity 250ms ease, transform 250ms ease, box-shadow 0.15s",
          cursor: dragging ? "grabbing" : "grab",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "scale(1)" : "scale(0.92)",
          willChange: dragging || resizing ? "left, top, width, height" : "auto",
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContext}
      >
        <Component getMeta={getMeta} setMeta={setMeta} size={{ w: px.width, h: px.height }} instanceId={widget.id} />
        <div onMouseDown={startResize} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" style={{ zIndex: 3 }} title="Resize">
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-white/50 rounded-br-sm" />
        </div>
      </div>
      {menu && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed z-[70] rounded-lg overflow-hidden shadow-2xl min-w-[160px] animate-scale-in"
          style={{
            left: Math.min(menu.x, window.innerWidth - 180),
            top: Math.min(menu.y, window.innerHeight - 80),
            background: "rgba(30,30,30,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <button onClick={() => { setMenu(null); onRemove(); }} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/10 font-space transition-colors">
            Remove Widget
          </button>
        </div>
      )}
    </>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";
import { Pencil, Highlighter, PenTool, Eraser, PaintBucket, MousePointer, Type, Square, Circle, Triangle, Star, Undo2, Redo2, Save, Minus, ZoomIn, ZoomOut, Eraser as EraserIcon } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";
import { readFs, writeFs, getNode, uniqueName } from "@/lib/fileStore";

const TOOLS = [
  { id: "pen", icon: PenTool, label: "Pen" },
  { id: "pencil", icon: Pencil, label: "Pencil" },
  { id: "highlighter", icon: Highlighter, label: "Highlighter" },
  { id: "calligraphy", icon: Minus, label: "Calligraphy" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
  { id: "select", icon: MousePointer, label: "Select" },
  { id: "bucket", icon: PaintBucket, label: "Fill" },
];

const SHAPES = ["rectangle", "circle", "triangle", "star"];
const COLORS = ["#000000", "#ffffff", "#ff0000", "#00aa00", "#0055ff", "#ff8800", "#aa00ff", "#00cccc", "#ff69b4", "#8b4513"];
const SIZES = [2, 4, 8, 16];

const CW = 1200, CH = 800;

export default function CanvasApp({ importImage }) {
  const { isDark } = useTheme();
  const t = themed(isDark);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [objects, setObjects] = useState([]);
  const objectsRef = useRef([]);
  const [selectedObj, setSelectedObj] = useState(null);
  const [showShapes, setShowShapes] = useState(false);
  const [addingText, setAddingText] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const drawingRef = useRef(false);
  const lastPoint = useRef(null);
  const dragInfoRef = useRef(null);
  const resizeInfoRef = useRef(null);
  const panInfoRef = useRef(null);
  const initDone = useRef(false);
  const importDone = useRef(false);

  useEffect(() => { objectsRef.current = objects; }, [objects]);

  // Initialize canvas (once)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initDone.current) return;
    initDone.current = true;
    canvas.width = CW;
    canvas.height = CH;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CW, CH);
    saveStateImmediate();
  }, []);

  // Import image — fill the entire white area
  useEffect(() => {
    if (!importImage?.dataUrl || importDone.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CW, CH);
      // Fit-to-canvas: scale to cover the entire area while preserving aspect
      const scale = Math.min(CW / img.width, CH / img.height);
      const w = img.width * scale, h = img.height * scale;
      const x = (CW - w) / 2, y = (CH - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      saveStateImmediate();
      importDone.current = true;
    };
    img.src = importImage.dataUrl;
  }, [importImage]);

  const saveStateImmediate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    setHistory((prev) => {
      // Trim future if we undid
      setHistoryIndex((idx) => {
        const trimmed = prev.slice(0, idx + 1);
        const next = [...trimmed, data];
        if (next.length > 50) next.shift();
        // schedule history update with proper length
        queueMicrotask(() => setHistory(next));
        return next.length - 1;
      });
      return prev;
    });
  }, []);

  const restoreState = (index) => {
    const canvas = canvasRef.current;
    if (!canvas || !history[index]) return;
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[index];
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    restoreState(newIndex);
  };
  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    restoreState(newIndex);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CW, CH);
    setObjects([]);
    setSelectedObj(null);
    saveStateImmediate();
  };

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
  };

  const hitTest = (pos) => {
    const objs = objectsRef.current;
    for (let i = objs.length - 1; i >= 0; i--) {
      const obj = objs[i];
      if (obj.type === "text") {
        const tw = obj.width || (obj.text.length * obj.fontSize * 0.6);
        if (pos.x >= obj.x && pos.x <= obj.x + tw && pos.y >= obj.y - obj.fontSize && pos.y <= obj.y + 5) return obj;
      } else {
        if (pos.x >= obj.x && pos.x <= obj.x + obj.w && pos.y >= obj.y && pos.y <= obj.y + obj.h) return obj;
      }
    }
    return null;
  };

  const startDraw = (e) => {
    // Right-click = pan
    if (e.button === 2) {
      panInfoRef.current = { startX: e.clientX, startY: e.clientY, originX: panOffset.x, originY: panOffset.y };
      return;
    }

    const pos = getPos(e);

    if (addingText) {
      const id = Date.now();
      const newObj = { id, type: "text", x: pos.x, y: pos.y, text: "Text", color, fontSize: 24, editing: true, width: 120 };
      setObjects((prev) => [...prev, newObj]);
      setSelectedObj(id);
      setAddingText(false);
      setTool("select");
      return;
    }

    if (tool === "select") {
      const clicked = hitTest(pos);
      if (clicked) {
        setSelectedObj(clicked.id);
        if (clicked.type !== "text" && pos.x > clicked.x + clicked.w - 14 && pos.y > clicked.y + clicked.h - 14) {
          resizeInfoRef.current = { id: clicked.id, startX: e.clientX, startY: e.clientY, startW: clicked.w, startH: clicked.h };
        } else {
          dragInfoRef.current = { id: clicked.id, offsetX: pos.x - clicked.x, offsetY: pos.y - clicked.y };
        }
      } else {
        setSelectedObj(null);
      }
      return;
    }

    if (tool === "bucket") {
      floodFill(e);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    drawingRef.current = true;
    lastPoint.current = pos;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    if (tool === "highlighter") {
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 3;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
    } else if (tool === "eraser") {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = size * 3;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
    } else if (tool === "calligraphy") {
      ctx.globalAlpha = 0.85; ctx.strokeStyle = color;
      ctx.lineWidth = 1; ctx.lineCap = "butt"; ctx.lineJoin = "miter";
    } else {
      ctx.globalAlpha = tool === "pencil" ? 0.7 : 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = tool === "pencil" ? Math.max(1, size * 0.5) : size;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
    }

    // Single click = dot
    ctx.fillStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, Math.max(1, (tool === "highlighter" ? size * 1.5 : tool === "pencil" ? size * 0.25 : size / 2)), 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  // Window-level mousemove/mouseup for drag/resize so updates don't drop frames
  useEffect(() => {
    const move = (e) => {
      if (panInfoRef.current) {
        const p = panInfoRef.current;
        setPanOffset({ x: p.originX + (e.clientX - p.startX), y: p.originY + (e.clientY - p.startY) });
        return;
      }
      if (dragInfoRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const pos = { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
        const info = dragInfoRef.current;
        setObjects((prev) => prev.map((obj) => obj.id === info.id ? { ...obj, x: pos.x - info.offsetX, y: pos.y - info.offsetY } : obj));
        return;
      }
      if (resizeInfoRef.current) {
        const info = resizeInfoRef.current;
        const dx = (e.clientX - info.startX) / zoom;
        const dy = (e.clientY - info.startY) / zoom;
        setObjects((prev) => prev.map((obj) => obj.id === info.id ? { ...obj, w: Math.max(20, info.startW + dx), h: Math.max(20, info.startH + dy) } : obj));
        return;
      }
    };
    const up = () => {
      panInfoRef.current = null;
      dragInfoRef.current = null;
      resizeInfoRef.current = null;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [zoom]);

  const draw = (e) => {
    if (panInfoRef.current || dragInfoRef.current || resizeInfoRef.current) return;
    if (!drawingRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);

    if (tool === "calligraphy") {
      const lp = lastPoint.current;
      const dx = pos.x - lp.x, dy = pos.y - lp.y;
      const angle = Math.atan2(dy, dx);
      const width = Math.max(1, size * Math.abs(Math.sin(angle)));
      ctx.lineWidth = width;
      ctx.lineTo(pos.x, pos.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    } else {
      ctx.lineTo(pos.x, pos.y); ctx.stroke();
    }
    lastPoint.current = pos;
  };

  const endDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const ctx = canvasRef.current.getContext("2d");
    ctx.globalAlpha = 1;
    saveStateImmediate();
  };

  const floodFill = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);
    const x = Math.round(pos.x), y = Math.round(pos.y);
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width, h = canvas.height;
    const targetIdx = (y * w + x) * 4;
    const tr = data[targetIdx], tg = data[targetIdx + 1], tb = data[targetIdx + 2];
    const fillEl = document.createElement("canvas").getContext("2d");
    fillEl.fillStyle = color; fillEl.fillRect(0, 0, 1, 1);
    const fc = fillEl.getImageData(0, 0, 1, 1).data;
    if (tr === fc[0] && tg === fc[1] && tb === fc[2]) return;
    const stack = [[x, y]];
    const visited = new Set();
    const match = (idx) => Math.abs(data[idx] - tr) < 30 && Math.abs(data[idx + 1] - tg) < 30 && Math.abs(data[idx + 2] - tb) < 30;
    while (stack.length > 0) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
      const key = cy * w + cx;
      if (visited.has(key)) continue;
      const idx = key * 4;
      if (!match(idx)) continue;
      visited.add(key);
      data[idx] = fc[0]; data[idx + 1] = fc[1]; data[idx + 2] = fc[2]; data[idx + 3] = 255;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    ctx.putImageData(imageData, 0, 0);
    saveStateImmediate();
  };

  const addShape = (type) => {
    const id = Date.now();
    setObjects((prev) => [...prev, { id, type, x: 100, y: 100, w: 100, h: 100, color, fill: color }]);
    setShowShapes(false);
    setTool("select");
    setSelectedObj(id);
  };

  const deleteSelected = () => {
    if (!selectedObj) return;
    setObjects((prev) => prev.filter((o) => o.id !== selectedObj));
    setSelectedObj(null);
  };

  // Update color of selected object
  useEffect(() => {
    if (!selectedObj) return;
    setObjects((prev) => prev.map((obj) => {
      if (obj.id !== selectedObj) return obj;
      if (obj.type === "text") return { ...obj, color };
      return { ...obj, fill: color, color };
    }));
  }, [color]);

  const renderShape = (obj, isSelected) => (
    <div key={obj.id}
      style={{ position: "absolute", left: obj.x * zoom, top: obj.y * zoom, width: obj.w * zoom, height: obj.h * zoom, zIndex: 10, border: isSelected ? "2px dashed #0088ff" : "none", cursor: "move" }}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        setSelectedObj(obj.id);
        setTool("select");
        const pos = getPos(e);
        dragInfoRef.current = { id: obj.id, offsetX: pos.x - obj.x, offsetY: pos.y - obj.y };
      }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${obj.w} ${obj.h}`} preserveAspectRatio="none">
        {obj.type === "rectangle" && <rect x="0" y="0" width={obj.w} height={obj.h} fill={obj.fill} />}
        {obj.type === "circle" && <ellipse cx={obj.w / 2} cy={obj.h / 2} rx={obj.w / 2} ry={obj.h / 2} fill={obj.fill} />}
        {obj.type === "triangle" && <polygon points={`${obj.w / 2},0 0,${obj.h} ${obj.w},${obj.h}`} fill={obj.fill} />}
        {obj.type === "star" && (() => {
          const cx = obj.w / 2, cy = obj.h / 2;
          const rOuter = Math.min(obj.w, obj.h) / 2;
          const rInner = rOuter * 0.4;
          const pts = [];
          for (let i = 0; i < 10; i++) {
            const a = (Math.PI / 5) * i - Math.PI / 2;
            const r = i % 2 === 0 ? rOuter : rInner;
            pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
          }
          return <polygon points={pts.join(" ")} fill={obj.fill} />;
        })()}
      </svg>
      {isSelected && <div style={{ position: "absolute", right: -4, bottom: -4, width: 12, height: 12, background: "#0088ff", cursor: "se-resize", borderRadius: 2 }}
        onMouseDown={(e) => { e.stopPropagation(); resizeInfoRef.current = { id: obj.id, startX: e.clientX, startY: e.clientY, startW: obj.w, startH: obj.h }; }} />}
    </div>
  );

  const renderObjects = () => objects.map((obj) => {
    const isSelected = selectedObj === obj.id;
    if (obj.type === "text") {
      return (
        <div key={obj.id} style={{ position: "absolute", left: obj.x * zoom, top: (obj.y - obj.fontSize) * zoom, zIndex: 10, border: isSelected ? "1px dashed #0088ff" : "none", padding: 2, minWidth: 40 }}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            setSelectedObj(obj.id);
            setTool("select");
            const pos = getPos(e);
            dragInfoRef.current = { id: obj.id, offsetX: pos.x - obj.x, offsetY: pos.y - obj.y };
          }}>
          {obj.editing && isSelected ? (
            <input autoFocus value={obj.text}
              onChange={(e) => setObjects((prev) => prev.map((o) => o.id === obj.id ? { ...o, text: e.target.value } : o))}
              onBlur={() => setObjects((prev) => prev.map((o) => o.id === obj.id ? { ...o, editing: false } : o))}
              onKeyDown={(e) => { if (e.key === "Enter") setObjects((prev) => prev.map((o) => o.id === obj.id ? { ...o, editing: false } : o)); e.stopPropagation(); }}
              style={{ color: obj.color, fontSize: obj.fontSize * zoom, background: "transparent", outline: "none", border: "none", fontFamily: "Space Grotesk", minWidth: 60 }} />
          ) : (
            <span onDoubleClick={() => setObjects((prev) => prev.map((o) => o.id === obj.id ? { ...o, editing: true } : o))}
              style={{ color: obj.color, fontSize: obj.fontSize * zoom, cursor: "move", userSelect: "none", fontFamily: "Space Grotesk", display: "block" }}>{obj.text}</span>
          )}
          {isSelected && (
            <div className="mt-1 flex gap-1">
              <select value={obj.fontSize} onChange={(e) => setObjects((prev) => prev.map((o) => o.id === obj.id ? { ...o, fontSize: Number(e.target.value) } : o))}
                className="text-[10px] bg-black/40 text-white rounded px-1">
                {[12, 16, 20, 28, 36, 48, 64].map((s) => <option key={s} value={s}>{s}px</option>)}
              </select>
            </div>
          )}
        </div>
      );
    }
    return renderShape(obj, isSelected);
  });

  const saveToDesktop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    objects.forEach((obj) => {
      if (obj.type === "text") {
        ctx.font = `${obj.fontSize}px "Space Grotesk", sans-serif`;
        ctx.fillStyle = obj.color;
        ctx.fillText(obj.text, obj.x, obj.y);
      } else {
        ctx.fillStyle = obj.fill;
        if (obj.type === "rectangle") ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        else if (obj.type === "circle") { ctx.beginPath(); ctx.ellipse(obj.x + obj.w / 2, obj.y + obj.h / 2, obj.w / 2, obj.h / 2, 0, 0, Math.PI * 2); ctx.fill(); }
        else if (obj.type === "triangle") { ctx.beginPath(); ctx.moveTo(obj.x + obj.w / 2, obj.y); ctx.lineTo(obj.x, obj.y + obj.h); ctx.lineTo(obj.x + obj.w, obj.y + obj.h); ctx.closePath(); ctx.fill(); }
        else if (obj.type === "star") {
          const cx = obj.x + obj.w / 2, cy = obj.y + obj.h / 2;
          const rOuter = Math.min(obj.w, obj.h) / 2;
          const rInner = rOuter * 0.4;
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const a = (Math.PI / 5) * i - Math.PI / 2;
            const r = i % 2 === 0 ? rOuter : rInner;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.closePath(); ctx.fill();
        }
      }
    });

    const dataUrl = canvas.toDataURL("image/png");
    const fs = readFs();
    const desktop = getNode(fs, ["Desktop"]);
    const name = uniqueName(desktop, `Canvas-${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }).replace(/:/g, "-")}.png`);
    desktop[name] = { __file: true, kind: "upload", name, type: "image/png", dataUrl, size: dataUrl.length, addedAt: Date.now() };
    writeFs(fs);
    setObjects([]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          const scale = Math.min(CW * 0.5 / img.width, CH * 0.5 / img.height, 1);
          ctx.drawImage(img, 50, 50, img.width * scale, img.height * scale);
          saveStateImmediate();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.25, Math.min(4, z + delta)));
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedObj && tool === "select") {
          const obj = objectsRef.current.find((o) => o.id === selectedObj);
          if (obj && !obj.editing) deleteSelected();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedObj, tool, historyIndex, history]);

  const bg = isDark ? "bg-[#1c1c1e] text-white" : "bg-[#f5f5f7] text-[#1c1c1e]";
  const toolbarBg = isDark ? "bg-[#2c2c2e]" : "bg-[#e5e5ea]";

  return (
    <div className={`flex flex-col h-full ${bg} font-space`}>
      <div className={`flex items-center gap-1 px-2 py-1.5 border-b ${t.border} ${toolbarBg} flex-wrap`}>
        {TOOLS.map((tl) => (
          <button key={tl.id} onClick={() => { setTool(tl.id); setAddingText(false); }} title={tl.label}
            className={`p-1.5 rounded-lg transition-colors ${tool === tl.id && !addingText ? "bg-blue-500 text-white" : isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"}`}>
            <tl.icon className="w-4 h-4" />
          </button>
        ))}
        <div className={`w-px h-5 ${isDark ? "bg-white/15" : "bg-black/15"} mx-1`} />
        <button onClick={() => { setAddingText(true); setTool("select"); setSelectedObj(null); }} title="Text"
          className={`p-1.5 rounded-lg transition-colors ${addingText ? "bg-blue-500 text-white" : isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"}`}>
          <Type className="w-4 h-4" />
        </button>
        <div className="relative">
          <button onClick={() => setShowShapes(!showShapes)} title="Shapes"
            className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"}`}>
            <Square className="w-4 h-4" />
          </button>
          {showShapes && (
            <div className={`absolute top-full left-0 mt-1 z-20 rounded-lg overflow-hidden shadow-xl ${isDark ? "bg-[#2c2c2e] border border-white/10" : "bg-white border border-black/10"}`}>
              {SHAPES.map((s) => (
                <button key={s} onClick={() => addShape(s)} className={`flex items-center gap-2 w-full px-3 py-2 text-xs ${isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-black/5 text-black/80"}`}>
                  {s === "rectangle" && <Square className="w-3 h-3" />}
                  {s === "circle" && <Circle className="w-3 h-3" />}
                  {s === "triangle" && <Triangle className="w-3 h-3" />}
                  {s === "star" && <Star className="w-3 h-3" />}
                  <span className="capitalize">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={`w-px h-5 ${isDark ? "bg-white/15" : "bg-black/15"} mx-1`} />
        <button onClick={undo} disabled={historyIndex <= 0} title="Undo" className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"}`}>
          <Undo2 className="w-4 h-4" />
        </button>
        <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo" className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"}`}>
          <Redo2 className="w-4 h-4" />
        </button>
        <button onClick={clearCanvas} title="Clear" className="p-1.5 rounded-lg text-orange-400 hover:bg-orange-500/20">
          <EraserIcon className="w-4 h-4" />
        </button>
        <div className={`w-px h-5 ${isDark ? "bg-white/15" : "bg-black/15"} mx-1`} />
        <div className="flex gap-0.5">
          {COLORS.slice(0, 6).map((c) => (
            <button key={c} onClick={() => setColor(c)} className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c ? "scale-110 border-blue-400" : "border-transparent hover:scale-105"}`} style={{ background: c }} />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-5 h-5 rounded-full border-0 p-0 overflow-hidden cursor-pointer" />
        </div>
        <div className={`w-px h-5 ${isDark ? "bg-white/15" : "bg-black/15"} mx-1`} />
        <div className="flex gap-0.5 items-center">
          {SIZES.map((s) => (
            <button key={s} onClick={() => setSize(s)} className={`w-6 h-6 rounded flex items-center justify-center ${size === s ? "bg-blue-500" : isDark ? "hover:bg-white/10" : "hover:bg-black/10"}`}>
              <div className="rounded-full bg-current" style={{ width: Math.min(s, 12), height: Math.min(s, 12) }} />
            </button>
          ))}
        </div>
        <div className={`w-px h-5 ${isDark ? "bg-white/15" : "bg-black/15"} mx-1`} />
        <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} title="Zoom In" className={`p-1 rounded-lg ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"}`}>
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className={`text-[10px] min-w-[32px] text-center ${isDark ? "text-white/50" : "text-black/50"}`}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} title="Zoom Out" className={`p-1 rounded-lg ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"}`}>
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1" />
        {selectedObj && <button onClick={deleteSelected} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 text-xs">Delete</button>}
        <button onClick={saveToDesktop} title="Save" className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30">
          <Save className="w-4 h-4" />
        </button>
      </div>

      <div ref={containerRef} className="flex-1 relative overflow-auto" style={{ background: isDark ? "#333" : "#e0e0e0" }}
        onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}>
        <div className="relative" style={{ width: CW * zoom, height: CH * zoom, margin: "auto", transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
          {renderObjects()}
          <canvas ref={canvasRef} width={CW} height={CH}
            style={{ width: CW * zoom, height: CH * zoom, cursor: tool === "select" ? "default" : tool === "bucket" ? "crosshair" : addingText ? "text" : "crosshair", display: "block" }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} />
        </div>
      </div>
    </div>
  );
}

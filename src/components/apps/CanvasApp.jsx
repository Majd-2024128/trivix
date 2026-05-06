import { useState, useRef, useCallback, useEffect } from "react";
import { Pencil, Highlighter, PenTool, Eraser, PaintBucket, MousePointer, Type, Square, Circle, Triangle, Undo2, Redo2, Save, Minus, ZoomIn, ZoomOut } from "lucide-react";
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

const SHAPES = ["rectangle", "circle", "triangle"];
const COLORS = ["#000000", "#ffffff", "#ff0000", "#00aa00", "#0055ff", "#ff8800", "#aa00ff", "#00cccc", "#ff69b4", "#8b4513"];
const SIZES = [2, 4, 8, 16];

export default function CanvasApp({ importImage }) {
  const { isDark } = useTheme();
  const t = themed(isDark);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);
  const [drawing, setDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [objects, setObjects] = useState([]);
  const [selectedObj, setSelectedObj] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [resizeInfo, setResizeInfo] = useState(null);
  const [showShapes, setShowShapes] = useState(false);
  const [addingText, setAddingText] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [zoom, setZoom] = useState(1);
  const lastPoint = useRef(null);
  const initDone = useRef(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initDone.current) return;
    initDone.current = true;
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Import image if provided
    if (importImage?.dataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, Math.min(img.width, canvas.width), Math.min(img.height, canvas.height));
        saveStateImmediate();
      };
      img.src = importImage.dataUrl;
    } else {
      saveStateImmediate();
    }
  }, [importImage]);

  const saveStateImmediate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    setHistory((prev) => {
      const next = [...prev];
      next.push(data);
      if (next.length > 50) next.shift();
      setHistoryIndex(next.length - 1);
      return next;
    });
  }, []);

  const saveState = useCallback(() => {
    saveStateImmediate();
  }, [saveStateImmediate]);

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

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
  };

  const startDraw = (e) => {
    if (tool === "select") {
      const pos = getPos(e);
      const clicked = [...objects].reverse().find((obj) => {
        if (obj.type === "text") {
          const tw = obj.width || (obj.text.length * obj.fontSize * 0.6);
          return pos.x >= obj.x && pos.x <= obj.x + tw && pos.y >= obj.y - obj.fontSize && pos.y <= obj.y + 5;
        }
        return pos.x >= obj.x && pos.x <= obj.x + obj.w && pos.y >= obj.y && pos.y <= obj.y + obj.h;
      });
      if (clicked) {
        setSelectedObj(clicked.id);
        if (clicked.type !== "text" && pos.x > clicked.x + clicked.w - 12 && pos.y > clicked.y + clicked.h - 12) {
          setResizeInfo({ id: clicked.id, startX: e.clientX, startY: e.clientY, startW: clicked.w, startH: clicked.h });
        } else {
          setDragInfo({ id: clicked.id, offsetX: pos.x - clicked.x, offsetY: pos.y - clicked.y });
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

    if (addingText) {
      const pos = getPos(e);
      const id = Date.now();
      setObjects((prev) => [...prev, { id, type: "text", x: pos.x, y: pos.y, text: "Text", color, fontSize: 20, editing: true, width: 120 }]);
      setSelectedObj(id);
      setAddingText(false);
      setTool("select");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);
    setDrawing(true);
    lastPoint.current = pos;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    if (tool === "highlighter") {
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    } else if (tool === "eraser") {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = size * 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    } else if (tool === "calligraphy") {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";
    } else {
      ctx.globalAlpha = tool === "pencil" ? 0.7 : 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = tool === "pencil" ? Math.max(1, size * 0.5) : size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    setDirty(true);
  };

  const draw = (e) => {
    if (dragInfo) {
      const pos = getPos(e);
      setObjects((prev) => prev.map((obj) => obj.id === dragInfo.id ? { ...obj, x: pos.x - dragInfo.offsetX, y: pos.y - dragInfo.offsetY } : obj));
      return;
    }
    if (resizeInfo) {
      const dx = (e.clientX - resizeInfo.startX) / zoom;
      const dy = (e.clientY - resizeInfo.startY) / zoom;
      setObjects((prev) => prev.map((obj) => obj.id === resizeInfo.id ? { ...obj, w: Math.max(20, resizeInfo.startW + dx), h: Math.max(20, resizeInfo.startH + dy) } : obj));
      return;
    }
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);

    if (tool === "calligraphy") {
      const lp = lastPoint.current;
      const dx = pos.x - lp.x;
      const dy = pos.y - lp.y;
      const angle = Math.atan2(dy, dx);
      const width = Math.max(1, size * Math.abs(Math.sin(angle)));
      ctx.lineWidth = width;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    lastPoint.current = pos;
  };

  const endDraw = () => {
    if (dragInfo || resizeInfo) { setDragInfo(null); setResizeInfo(null); return; }
    if (!drawing) return;
    setDrawing(false);
    const ctx = canvasRef.current.getContext("2d");
    ctx.globalAlpha = 1;
    saveState();
  };

  const floodFill = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);
    const x = Math.round(pos.x);
    const y = Math.round(pos.y);
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;

    const targetIdx = (y * w + x) * 4;
    const tr = data[targetIdx], tg = data[targetIdx + 1], tb = data[targetIdx + 2];

    const fillEl = document.createElement("canvas").getContext("2d");
    fillEl.fillStyle = color;
    fillEl.fillRect(0, 0, 1, 1);
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
    setDirty(true);
    saveState();
  };

  const addShape = (type) => {
    const id = Date.now();
    setObjects((prev) => [...prev, { id, type, x: 100, y: 100, w: 80, h: 80, color, fill: color }]);
    setShowShapes(false);
    setTool("select");
    setSelectedObj(id);
    setDirty(true);
  };

  const deleteSelected = () => {
    if (!selectedObj) return;
    setObjects((prev) => prev.filter((o) => o.id !== selectedObj));
    setSelectedObj(null);
    setDirty(true);
  };

  // Update color of selected object
  useEffect(() => {
    if (!selectedObj) return;
    setObjects((prev) => prev.map((obj) => {
      if (obj.id !== selectedObj) return obj;
      if (obj.type === "text") return { ...obj, color };
      return { ...obj, fill: color, color };
    }));
  }, [color, selectedObj]);

  const renderObjects = () => objects.map((obj) => {
    const isSelected = selectedObj === obj.id;
    if (obj.type === "text") {
      return (
        <div key={obj.id} style={{ position: "absolute", left: obj.x * zoom, top: (obj.y - obj.fontSize) * zoom, zIndex: 10, border: isSelected ? "1px dashed #0088ff" : "none", padding: 2, minWidth: 40, transform: `scale(${zoom})`, transformOrigin: "top left" }}
          onMouseDown={(e) => { e.stopPropagation(); setSelectedObj(obj.id); setTool("select"); setDragInfo({ id: obj.id, offsetX: (e.clientX - canvasRef.current.getBoundingClientRect().left) / zoom - obj.x, offsetY: (e.clientY - canvasRef.current.getBoundingClientRect().top) / zoom - obj.y }); }}>
          {obj.editing && isSelected ? (
            <input autoFocus value={obj.text} onChange={(e) => setObjects((prev) => prev.map((o) => o.id === obj.id ? { ...o, text: e.target.value } : o))}
              onBlur={() => setObjects((prev) => prev.map((o) => o.id === obj.id ? { ...o, editing: false } : o))}
              onKeyDown={(e) => { if (e.key === "Enter") setObjects((prev) => prev.map((o) => o.id === obj.id ? { ...o, editing: false } : o)); e.stopPropagation(); }}
              style={{ color: obj.color, fontSize: obj.fontSize, background: "transparent", outline: "none", border: "none", fontFamily: "Space Grotesk", minWidth: 60 }} />
          ) : (
            <span onDoubleClick={() => setObjects((prev) => prev.map((o) => o.id === obj.id ? { ...o, editing: true } : o))}
              style={{ color: obj.color, fontSize: obj.fontSize, cursor: "move", userSelect: "none", fontFamily: "Space Grotesk", display: "block" }}>{obj.text}</span>
          )}
          {isSelected && (
            <div className="mt-1 flex gap-1">
              <select value={obj.fontSize} onChange={(e) => setObjects((prev) => prev.map((o) => o.id === obj.id ? { ...o, fontSize: Number(e.target.value) } : o))}
                className="text-[10px] bg-black/20 text-white rounded px-1" style={{ transform: `scale(${1 / zoom})`, transformOrigin: "top left" }}>
                {[12, 16, 20, 28, 36, 48, 64].map((s) => <option key={s} value={s}>{s}px</option>)}
              </select>
            </div>
          )}
        </div>
      );
    }

    const shapeStyle = { position: "absolute", left: obj.x * zoom, top: obj.y * zoom, width: obj.w * zoom, height: obj.h * zoom, zIndex: 10, border: isSelected ? "2px dashed #0088ff" : "none", cursor: "move" };
    return (
      <div key={obj.id} style={shapeStyle}
        onMouseDown={(e) => {
          e.stopPropagation();
          setSelectedObj(obj.id);
          setTool("select");
          const pos = getPos(e);
          setDragInfo({ id: obj.id, offsetX: pos.x - obj.x, offsetY: pos.y - obj.y });
        }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${obj.w} ${obj.h}`} preserveAspectRatio="none">
          {obj.type === "rectangle" && <rect x="0" y="0" width={obj.w} height={obj.h} fill={obj.fill} />}
          {obj.type === "circle" && <ellipse cx={obj.w / 2} cy={obj.h / 2} rx={obj.w / 2} ry={obj.h / 2} fill={obj.fill} />}
          {obj.type === "triangle" && <polygon points={`${obj.w / 2},0 0,${obj.h} ${obj.w},${obj.h}`} fill={obj.fill} />}
        </svg>
        {isSelected && <div style={{ position: "absolute", right: -4, bottom: -4, width: 10, height: 10, background: "#0088ff", cursor: "se-resize", borderRadius: 2 }}
          onMouseDown={(e) => { e.stopPropagation(); setResizeInfo({ id: obj.id, startX: e.clientX, startY: e.clientY, startW: obj.w, startH: obj.h }); }} />}
      </div>
    );
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
        else if (obj.type === "circle") {
          ctx.beginPath(); ctx.ellipse(obj.x + obj.w / 2, obj.y + obj.h / 2, obj.w / 2, obj.h / 2, 0, 0, Math.PI * 2); ctx.fill();
        } else if (obj.type === "triangle") {
          ctx.beginPath(); ctx.moveTo(obj.x + obj.w / 2, obj.y); ctx.lineTo(obj.x, obj.y + obj.h); ctx.lineTo(obj.x + obj.w, obj.y + obj.h); ctx.closePath(); ctx.fill();
        }
      }
    });

    const dataUrl = canvas.toDataURL("image/png");
    const fs = readFs();
    const desktop = getNode(fs, ["Desktop"]);
    const name = uniqueName(desktop, `Canvas-${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }).replace(/:/g, "-")}.png`);
    desktop[name] = { __file: true, kind: "upload", name, type: "image/png", dataUrl, size: dataUrl.length, addedAt: Date.now() };
    writeFs(fs);
    setDirty(false);
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
          const scale = Math.min(canvas.width * 0.5 / img.width, canvas.height * 0.5 / img.height, 1);
          ctx.drawImage(img, 50, 50, img.width * scale, img.height * scale);
          saveState();
          setDirty(true);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Scroll to zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.25, Math.min(4, z + delta)));
  };

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
      if (e.key === "Delete" || e.key === "Backspace") { if (selectedObj && tool === "select") { const obj = objects.find((o) => o.id === selectedObj); if (obj && !obj.editing) deleteSelected(); } }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedObj, objects, tool, historyIndex, history]);

  const bg = isDark ? "bg-[#1c1c1e] text-white" : "bg-[#f5f5f7] text-[#1c1c1e]";
  const toolbarBg = isDark ? "bg-[#2c2c2e]" : "bg-[#e5e5ea]";

  return (
    <div className={`flex flex-col h-full ${bg} font-space`}>
      {/* Toolbar */}
      <div className={`flex items-center gap-1 px-2 py-1.5 border-b ${t.border} ${toolbarBg} flex-wrap`}>
        {TOOLS.map((tl) => (
          <button key={tl.id} onClick={() => { setTool(tl.id); setAddingText(false); }} title={tl.label}
            className={`p-1.5 rounded-lg transition-colors ${tool === tl.id && !addingText ? "bg-blue-500 text-white" : isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"}`}>
            <tl.icon className="w-4 h-4" />
          </button>
        ))}
        <div className={`w-px h-5 ${isDark ? "bg-white/15" : "bg-black/15"} mx-1`} />
        <button onClick={() => { setAddingText(true); setTool("select"); }} title="Text"
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
                  <span className="capitalize">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={`w-px h-5 ${isDark ? "bg-white/15" : "bg-black/15"} mx-1`} />
        <button onClick={undo} disabled={historyIndex <= 0} title="Undo"
          className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"}`}>
          <Undo2 className="w-4 h-4" />
        </button>
        <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo"
          className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"}`}>
          <Redo2 className="w-4 h-4" />
        </button>
        <div className={`w-px h-5 ${isDark ? "bg-white/15" : "bg-black/15"} mx-1`} />
        {/* Color picker */}
        <div className="flex gap-0.5">
          {COLORS.slice(0, 6).map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c ? "scale-110 border-blue-400" : "border-transparent hover:scale-105"}`}
              style={{ background: c }} />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="w-5 h-5 rounded-full border-0 p-0 overflow-hidden cursor-pointer" />
        </div>
        <div className={`w-px h-5 ${isDark ? "bg-white/15" : "bg-black/15"} mx-1`} />
        {/* Size */}
        <div className="flex gap-0.5 items-center">
          {SIZES.map((s) => (
            <button key={s} onClick={() => setSize(s)}
              className={`w-6 h-6 rounded flex items-center justify-center ${size === s ? "bg-blue-500" : isDark ? "hover:bg-white/10" : "hover:bg-black/10"}`}>
              <div className="rounded-full bg-current" style={{ width: Math.min(s, 12), height: Math.min(s, 12) }} />
            </button>
          ))}
        </div>
        <div className={`w-px h-5 ${isDark ? "bg-white/15" : "bg-black/15"} mx-1`} />
        {/* Zoom controls */}
        <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} title="Zoom In" className={`p-1 rounded-lg ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"}`}>
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className={`text-[10px] min-w-[32px] text-center ${isDark ? "text-white/50" : "text-black/50"}`}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} title="Zoom Out" className={`p-1 rounded-lg ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"}`}>
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1" />
        {selectedObj && (
          <button onClick={deleteSelected} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 text-xs">Delete</button>
        )}
        <button onClick={saveToDesktop} title="Save" className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30">
          <Save className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 relative overflow-auto" style={{ background: isDark ? "#333" : "#e0e0e0" }}
        onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onWheel={handleWheel}>
        <div className="relative" style={{ width: 1200 * zoom, height: 800 * zoom, margin: "auto" }}>
          {renderObjects()}
          <canvas ref={canvasRef} width={1200} height={800}
            style={{ width: 1200 * zoom, height: 800 * zoom, cursor: tool === "select" ? "default" : tool === "bucket" ? "crosshair" : addingText ? "text" : "crosshair", display: "block" }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} />
        </div>
      </div>

      <div className={`px-4 py-1.5 border-t ${t.border} text-center`}>
        <p className={`${t.textFaint} text-[10px] font-space`}>Copyright © 2026 Tejt</p>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";

export default function CalculatorWidget() {
  const { isDark } = useTheme();
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [reset, setReset] = useState(false);

  const calc = (a, b, o) => {
    switch (o) { case "+": return a + b; case "−": return a - b; case "×": return a * b; case "÷": return b !== 0 ? a / b : NaN; default: return b; }
  };
  const fmt = (n) => { if (!isFinite(n)) return "Err"; const s = String(parseFloat(n.toPrecision(10))); return s.length > 10 ? n.toExponential(3) : s; };

  const num = (n) => {
    if (reset) { setDisplay(n === "." ? "0." : n); setReset(false); return; }
    if (n === "." && display.includes(".")) return;
    setDisplay(display === "0" && n !== "." ? n : display + n);
  };
  const setOperator = (next) => {
    const cur = parseFloat(display);
    if (prev !== null && op && !reset) { const r = calc(prev, cur, op); setDisplay(fmt(r)); setPrev(r); }
    else setPrev(cur);
    setOp(next); setReset(true);
  };
  const equals = () => {
    if (prev === null || !op) return;
    const cur = parseFloat(display);
    setDisplay(fmt(calc(prev, cur, op))); setPrev(null); setOp(null); setReset(true);
  };
  const clear = () => { setDisplay("0"); setPrev(null); setOp(null); setReset(false); };

  const numStyle = isDark
    ? "bg-gradient-to-b from-[#4a4a4a] to-[#2e2e2e] text-white"
    : "bg-gradient-to-b from-white to-[#f0f4f9] text-[#1f2937]";
  const fnStyle = isDark
    ? "bg-gradient-to-b from-[#2a2a2a] to-[#0f0f0f] text-white"
    : "bg-gradient-to-b from-[#e2e8f0] to-[#cbd5e1] text-[#1f2937]";
  const opStyle = isDark
    ? "bg-gradient-to-b from-[#22B14C] to-[#178a37] text-white"
    : "bg-gradient-to-b from-[#84cc16] to-[#65a30d] text-white";
  const containerBg = isDark
    ? "linear-gradient(160deg, #1f1f1f 0%, #141414 50%, #0a0a0a 100%)"
    : "linear-gradient(160deg, #cbd5e1 0%, #94a3b8 50%, #64748b 100%)";

  const Btn = ({ children, onClick, variant = "num", span = 1 }) => {
    const styles = { num: numStyle, fn: fnStyle, op: opStyle, eq: opStyle };
    return (
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onClick}
        className={`rounded-lg font-semibold transition-all active:translate-y-[1px] flex items-center justify-center text-sm ${styles[variant]}`}
        style={{ gridColumn: span > 1 ? `span ${span}` : undefined, minHeight: 0 }}
      >{children}</button>
    );
  };

  return (
    <div className="w-full h-full flex flex-col font-space" style={{ background: containerBg }}>
      <div className="text-white text-right px-3 pt-2 pb-1 text-xl font-light tabular-nums truncate" style={{ minHeight: 28 }}>{display}</div>
      <div className="grid grid-cols-4 gap-1 p-2 pt-1 flex-1" style={{ gridAutoRows: "1fr" }}>
        <Btn variant="fn" onClick={clear}>AC</Btn>
        <Btn variant="fn" onClick={() => setDisplay(fmt(parseFloat(display) * -1))}>+/−</Btn>
        <Btn variant="fn" onClick={() => setDisplay(fmt(parseFloat(display) / 100))}>%</Btn>
        <Btn variant="op" onClick={() => setOperator("÷")}>÷</Btn>
        <Btn onClick={() => num("7")}>7</Btn><Btn onClick={() => num("8")}>8</Btn><Btn onClick={() => num("9")}>9</Btn>
        <Btn variant="op" onClick={() => setOperator("×")}>×</Btn>
        <Btn onClick={() => num("4")}>4</Btn><Btn onClick={() => num("5")}>5</Btn><Btn onClick={() => num("6")}>6</Btn>
        <Btn variant="op" onClick={() => setOperator("−")}>−</Btn>
        <Btn onClick={() => num("1")}>1</Btn><Btn onClick={() => num("2")}>2</Btn><Btn onClick={() => num("3")}>3</Btn>
        <Btn variant="op" onClick={() => setOperator("+")}>+</Btn>
        <Btn onClick={() => num("0")} span={2}>0</Btn>
        <Btn onClick={() => num(".")}>.</Btn>
        <Btn variant="eq" onClick={equals}>=</Btn>
      </div>
    </div>
  );
}

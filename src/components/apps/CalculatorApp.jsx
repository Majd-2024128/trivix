import { useState, useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";

export default function CalculatorApp() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [reset, setReset] = useState(false);
  const { isDark } = useTheme();

  const calculate = (a, b, operator) => {
    switch (operator) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : NaN;
      default: return b;
    }
  };

  const formatResult = (n) => {
    if (!isFinite(n)) return "Error";
    const s = String(parseFloat(n.toPrecision(12)));
    return s.length > 12 ? n.toExponential(6) : s;
  };

  const handleNumber = (num) => {
    if (reset) { setDisplay(num === "." ? "0." : num); setReset(false); }
    else {
      if (num === "." && display.includes(".")) return;
      setDisplay(display === "0" && num !== "." ? num : display + num);
    }
  };

  const handleOp = (nextOp) => {
    const current = parseFloat(display);
    if (prev !== null && op && !reset) {
      const result = calculate(prev, current, op);
      const formatted = formatResult(result);
      setDisplay(formatted); setPrev(result); setExpression(`${formatted} ${nextOp}`);
    } else { setPrev(current); setExpression(`${display} ${nextOp}`); }
    setOp(nextOp); setReset(true);
  };

  const handleEquals = () => {
    if (prev === null || !op) return;
    const current = parseFloat(display);
    const result = calculate(prev, current, op);
    const formatted = formatResult(result);
    setExpression(`${prev} ${op} ${current} =`);
    setDisplay(formatted); setPrev(null); setOp(null); setReset(true);
  };

  const handleClear = () => { setDisplay("0"); setPrev(null); setOp(null); setReset(false); setExpression(""); };
  const handleBackspace = () => { if (reset) return; setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0")); };
  const handlePercent = () => setDisplay(formatResult(parseFloat(display) / 100));
  const handleSign = () => setDisplay(formatResult(parseFloat(display) * -1));

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const k = e.key;
      if (/[0-9]/.test(k)) handleNumber(k);
      else if (k === ".") handleNumber(".");
      else if (k === "+") handleOp("+");
      else if (k === "-") handleOp("−");
      else if (k === "*") handleOp("×");
      else if (k === "/") { e.preventDefault(); handleOp("÷"); }
      else if (k === "Enter" || k === "=") { e.preventDefault(); handleEquals(); }
      else if (k === "Backspace") handleBackspace();
      else if (k === "Escape" || k === "c" || k === "C") handleClear();
      else if (k === "%") handlePercent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Style variants per theme
  // Dark mode: number buttons = dark grey w/ white digits, function buttons = black, operators = #22B14C
  const numStyleDark = "bg-gradient-to-b from-[#4a4a4a] to-[#2e2e2e] text-white shadow-[0_4px_0_#1a1a1a,0_6px_10px_rgba(0,0,0,0.4)] hover:from-[#555555] hover:to-[#363636]";
  const fnStyleDark = "bg-gradient-to-b from-[#2a2a2a] to-[#0f0f0f] text-white shadow-[0_4px_0_#000000,0_6px_10px_rgba(0,0,0,0.45)] hover:from-[#333333] hover:to-[#161616]";
  const opStyleDark = "bg-gradient-to-b from-[#22B14C] to-[#178a37] text-white shadow-[0_4px_0_#0e5a23,0_6px_12px_rgba(34,177,76,0.4)] hover:from-[#27c554] hover:to-[#1ca042]";

  const numStyleLight = "bg-gradient-to-b from-white to-[#f0f4f9] text-[#1f2937] shadow-[0_3px_0_#cbd5e1,0_4px_8px_rgba(0,0,0,0.08)] hover:from-white hover:to-[#f7fafc]";
  const fnStyleLight = "bg-gradient-to-b from-[#e2e8f0] to-[#cbd5e1] text-[#1f2937] shadow-[0_3px_0_#94a3b8,0_4px_8px_rgba(0,0,0,0.1)] hover:from-[#edf2f7] hover:to-[#d6dee9]";
  const opStyleLight = "bg-gradient-to-b from-[#84cc16] to-[#65a30d] text-white shadow-[0_3px_0_#4d7c0f,0_4px_10px_rgba(132,204,22,0.35)] hover:from-[#a3e635] hover:to-[#84cc16]";

  const Btn = ({ children, onClick, variant = "num", span = 1, active = false }) => {
    const base = "rounded-2xl text-2xl font-semibold transition-all duration-150 active:translate-y-[2px] active:shadow-none select-none flex items-center justify-center min-h-[44px]";
    const styles = isDark
      ? {
          num: numStyleDark,
          fn: fnStyleDark,
          op: active ? "bg-white text-[#22B14C] shadow-[inset_0_3px_6px_rgba(0,0,0,0.2)]" : opStyleDark,
          eq: opStyleDark,
        }
      : {
          num: numStyleLight,
          fn: fnStyleLight,
          op: active ? "bg-white text-[#65a30d] shadow-[inset_0_3px_6px_rgba(0,0,0,0.12)]" : opStyleLight,
          eq: opStyleLight,
        };
    return (
      <button type="button" onClick={onClick} className={`${base} ${styles[variant]}`} style={{ gridColumn: span > 1 ? `span ${span}` : undefined }}>
        {children}
      </button>
    );
  };

  const isActiveOp = (target) => op === target && reset;
  const containerBg = isDark
    ? "linear-gradient(160deg, #1f1f1f 0%, #141414 50%, #0a0a0a 100%)"
    : "linear-gradient(160deg, #cbd5e1 0%, #94a3b8 50%, #64748b 100%)";
  const displayText = isDark ? "text-white" : "text-white";
  const expressionText = isDark ? "text-white/60" : "text-white/70";

  return (
    <div className="flex flex-col h-full font-space overflow-hidden" style={{ background: containerBg }}>
      <div className="flex flex-col items-end justify-end px-6 pt-6 pb-4 min-h-[120px] shrink-0">
        <div className={`${expressionText} text-sm font-light tracking-wider min-h-[20px] mb-1 truncate w-full text-right`}>{expression}</div>
        <div
          className={`${displayText} font-light leading-none tracking-tight tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]`}
          style={{ fontSize: display.length > 10 ? "2rem" : display.length > 7 ? "2.75rem" : "3.5rem" }}
        >
          {display}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5 p-4 pt-2 flex-1" style={{ gridAutoRows: "1fr" }}>
        <Btn variant="fn" onClick={handleClear}>AC</Btn>
        <Btn variant="fn" onClick={handleSign}>+/−</Btn>
        <Btn variant="fn" onClick={handlePercent}>%</Btn>
        <Btn variant="op" active={isActiveOp("÷")} onClick={() => handleOp("÷")}>÷</Btn>
        <Btn onClick={() => handleNumber("7")}>7</Btn>
        <Btn onClick={() => handleNumber("8")}>8</Btn>
        <Btn onClick={() => handleNumber("9")}>9</Btn>
        <Btn variant="op" active={isActiveOp("×")} onClick={() => handleOp("×")}>×</Btn>
        <Btn onClick={() => handleNumber("4")}>4</Btn>
        <Btn onClick={() => handleNumber("5")}>5</Btn>
        <Btn onClick={() => handleNumber("6")}>6</Btn>
        <Btn variant="op" active={isActiveOp("−")} onClick={() => handleOp("−")}>−</Btn>
        <Btn onClick={() => handleNumber("1")}>1</Btn>
        <Btn onClick={() => handleNumber("2")}>2</Btn>
        <Btn onClick={() => handleNumber("3")}>3</Btn>
        <Btn variant="op" active={isActiveOp("+")} onClick={() => handleOp("+")}>+</Btn>
        <Btn onClick={() => handleNumber("0")} span={2}>0</Btn>
        <Btn onClick={() => handleNumber(".")}>.</Btn>
        <Btn variant="eq" onClick={handleEquals}>=</Btn>
      </div>

      <div className="px-4 pb-2 text-center shrink-0">
        <p className="text-white/40 text-[10px] font-space">Copyright © 2026 Tejt</p>
      </div>
    </div>
  );
}

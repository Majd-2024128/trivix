import { useState, useEffect } from "react";

export default function CalculatorApp() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [reset, setReset] = useState(false);

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
    if (reset) {
      setDisplay(num === "." ? "0." : num);
      setReset(false);
    } else {
      if (num === "." && display.includes(".")) return;
      setDisplay(display === "0" && num !== "." ? num : display + num);
    }
  };

  const handleOp = (nextOp) => {
    const current = parseFloat(display);
    if (prev !== null && op && !reset) {
      const result = calculate(prev, current, op);
      const formatted = formatResult(result);
      setDisplay(formatted);
      setPrev(result);
      setExpression(`${formatted} ${nextOp}`);
    } else {
      setPrev(current);
      setExpression(`${display} ${nextOp}`);
    }
    setOp(nextOp);
    setReset(true);
  };

  const handleEquals = () => {
    if (prev === null || !op) return;
    const current = parseFloat(display);
    const result = calculate(prev, current, op);
    const formatted = formatResult(result);
    setExpression(`${prev} ${op} ${current} =`);
    setDisplay(formatted);
    setPrev(null);
    setOp(null);
    setReset(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setReset(false);
    setExpression("");
  };

  const handleBackspace = () => {
    if (reset) return;
    setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
  };

  const handlePercent = () => setDisplay(formatResult(parseFloat(display) / 100));
  const handleSign = () => setDisplay(formatResult(parseFloat(display) * -1));

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      // Don't capture when typing in an input/textarea
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

  // Button styles inspired by the icon: puffy white 3D keys on slate-blue, with lime-green accent
  const Btn = ({ children, onClick, variant = "num", span = 1, active = false }) => {
    const base = "rounded-2xl text-2xl font-semibold transition-all duration-150 active:translate-y-[2px] active:shadow-none select-none flex items-center justify-center min-h-[44px]";
    const styles = {
      num: "bg-gradient-to-b from-white to-[#e6ebf2] text-[#3a4654] shadow-[0_4px_0_#9aa6b6,0_6px_10px_rgba(0,0,0,0.18)] hover:from-white hover:to-[#eef2f7]",
      fn: "bg-gradient-to-b from-[#cdd6e2] to-[#a9b5c5] text-[#2a3340] shadow-[0_4px_0_#7a8699,0_6px_10px_rgba(0,0,0,0.18)] hover:from-[#d6dee9] hover:to-[#b3bfce]",
      op: active
        ? "bg-white text-[#a8d531] shadow-[inset_0_3px_6px_rgba(0,0,0,0.15)]"
        : "bg-gradient-to-b from-[#c6e85a] to-[#9bc91f] text-white shadow-[0_4px_0_#6b9415,0_6px_12px_rgba(155,201,31,0.35)] hover:from-[#d0ee6b] hover:to-[#a6d426]",
      eq: "bg-gradient-to-b from-[#c6e85a] to-[#9bc91f] text-white shadow-[0_4px_0_#6b9415,0_6px_12px_rgba(155,201,31,0.35)] hover:from-[#d0ee6b] hover:to-[#a6d426]",
    };
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${styles[variant]}`}
        style={{ gridColumn: span > 1 ? `span ${span}` : undefined }}
      >
        {children}
      </button>
    );
  };

  const isActiveOp = (target) => op === target && reset;

  return (
    <div
      className="flex flex-col h-full font-space overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #6a7d96 0%, #4e6178 50%, #3a4a5e 100%)",
      }}
    >
      {/* Display */}
      <div className="flex flex-col items-end justify-end px-6 pt-6 pb-4 min-h-[120px] shrink-0">
        <div className="text-white/60 text-sm font-light tracking-wider min-h-[20px] mb-1 truncate w-full text-right">
          {expression}
        </div>
        <div
          className="text-white font-light leading-none tracking-tight tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
          style={{ fontSize: display.length > 10 ? "2rem" : display.length > 7 ? "2.75rem" : "3.5rem" }}
        >
          {display}
        </div>
      </div>

      {/* Buttons */}
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

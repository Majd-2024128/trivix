import { useState, useEffect } from "react";
import { Delete } from "lucide-react";

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
      const k = e.key;
      if (/[0-9]/.test(k)) handleNumber(k);
      else if (k === ".") handleNumber(".");
      else if (k === "+") handleOp("+");
      else if (k === "-") handleOp("−");
      else if (k === "*") handleOp("×");
      else if (k === "/") { e.preventDefault(); handleOp("÷"); }
      else if (k === "Enter" || k === "=") { e.preventDefault(); handleEquals(); }
      else if (k === "Backspace") handleBackspace();
      else if (k === "Escape") handleClear();
      else if (k === "%") handlePercent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const Btn = ({ children, onClick, variant = "num", span = 1, active = false }) => {
    const styles = {
      num: "bg-white/[0.06] hover:bg-white/[0.12] text-white",
      fn: "bg-white/[0.14] hover:bg-white/[0.22] text-white",
      op: active
        ? "bg-white text-orange-500"
        : "bg-gradient-to-br from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 text-white shadow-lg shadow-orange-500/20",
      eq: "bg-gradient-to-br from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 text-white shadow-lg shadow-orange-500/20",
    };
    return (
      <button
        onClick={onClick}
        className={`rounded-2xl text-xl font-medium transition-all duration-150 active:scale-95 ${styles[variant]}`}
        style={{ gridColumn: span > 1 ? `span ${span}` : undefined, height: 56 }}
      >
        {children}
      </button>
    );
  };

  const isActiveOp = (target) => op === target && reset;

  return (
    <div
      className="flex flex-col h-full text-white font-space overflow-y-auto"
      style={{
        background: "linear-gradient(160deg, #0a0a0c 0%, #1a1a1f 50%, #0f0f12 100%)",
      }}
    >
      {/* Display */}
      <div className="flex-1 flex flex-col items-end justify-end px-6 pt-6 pb-4 min-h-[140px]">
        <div className="text-white/40 text-sm font-light tracking-wider min-h-[20px] mb-1">
          {expression}
        </div>
        <div
          className="text-white font-extralight leading-none tracking-tight tabular-nums"
          style={{ fontSize: display.length > 10 ? "2.25rem" : display.length > 7 ? "3rem" : "3.75rem" }}
        >
          {display}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2 p-4">
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

      <div className="px-4 pb-3 text-center">
        <p className="text-white/25 text-[10px] font-space">Copyright © 2026 Tejt</p>
      </div>
    </div>
  );
}

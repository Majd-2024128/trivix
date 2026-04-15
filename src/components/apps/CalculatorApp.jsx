import { useState } from "react";

const BUTTONS = [
  ["C", "±", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
];

export default function CalculatorApp() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [reset, setReset] = useState(false);

  const handleNumber = (num) => {
    if (reset) {
      setDisplay(num);
      setReset(false);
    } else {
      setDisplay(display === "0" && num !== "." ? num : display + num);
    }
  };

  const handleOp = (nextOp) => {
    const current = parseFloat(display);
    if (prev !== null && op && !reset) {
      const result = calculate(prev, current, op);
      setDisplay(String(result));
      setPrev(result);
    } else {
      setPrev(current);
    }
    setOp(nextOp);
    setReset(true);
  };

  const calculate = (a, b, operator) => {
    switch (operator) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : "Error";
      default: return b;
    }
  };

  const handleEquals = () => {
    if (prev === null || !op) return;
    const current = parseFloat(display);
    const result = calculate(prev, current, op);
    setDisplay(String(result));
    setPrev(null);
    setOp(null);
    setReset(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setReset(false);
  };

  const handlePercent = () => {
    setDisplay(String(parseFloat(display) / 100));
  };

  const handleSign = () => {
    setDisplay(String(parseFloat(display) * -1));
  };

  const handleButton = (btn) => {
    if (btn === "C") return handleClear();
    if (btn === "±") return handleSign();
    if (btn === "%") return handlePercent();
    if (btn === "=") return handleEquals();
    if (["+", "−", "×", "÷"].includes(btn)) return handleOp(btn);
    handleNumber(btn);
  };

  const isOp = (btn) => ["+", "−", "×", "÷"].includes(btn);
  const isActiveOp = (btn) => isOp(btn) && op === btn && reset;

  return (
    <div className="flex flex-col h-full bg-[#1c1c1e] text-white font-space">
      {/* Display */}
      <div className="flex-1 flex items-end justify-end px-6 pb-3 min-h-[100px]">
        <span
          className="text-white font-light leading-none"
          style={{ fontSize: display.length > 9 ? "2rem" : display.length > 6 ? "2.75rem" : "3.5rem" }}
        >
          {display}
        </span>
      </div>

      {/* Buttons */}
      <div className="grid gap-[1px] p-2" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {BUTTONS.flat().map((btn, i) => {
          const isZero = btn === "0";
          const isOperator = isOp(btn);
          const isTopRow = ["C", "±", "%"].includes(btn);
          const active = isActiveOp(btn);

          return (
            <button
              key={i}
              onClick={() => handleButton(btn)}
              className="flex items-center justify-center rounded-full text-xl font-medium transition-all active:opacity-70"
              style={{
                gridColumn: isZero ? "span 2" : undefined,
                height: 64,
                background: active
                  ? "#fff"
                  : isOperator
                  ? "#ff9f0a"
                  : isTopRow
                  ? "#a5a5a5"
                  : "#333333",
                color: active
                  ? "#ff9f0a"
                  : isTopRow
                  ? "#1c1c1e"
                  : "#fff",
              }}
            >
              {btn}
            </button>
          );
        })}
      </div>
    </div>
  );
}
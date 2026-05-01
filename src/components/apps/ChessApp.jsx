import { useState, useEffect, useMemo } from "react";
import { Chess } from "chess.js";
import { RotateCcw, Cpu, Trophy, Frown, Menu, Users } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";

const PIECE_IMAGES = {
  wK: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Chess_klt60.png/120px-Chess_klt60.png",
  wQ: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Chess_qlt60.png/120px-Chess_qlt60.png",
  wR: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Chess_rlt60.png/120px-Chess_rlt60.png",
  wB: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Chess_blt60.png/120px-Chess_blt60.png",
  wN: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Chess_nlt60.png/120px-Chess_nlt60.png",
  wP: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Chess_plt60.png/120px-Chess_plt60.png",
  bK: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Chess_kdt60.png/120px-Chess_kdt60.png",
  bQ: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Chess_qdt60.png/120px-Chess_qdt60.png",
  bR: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Chess_rdt60.png/120px-Chess_rdt60.png",
  bB: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Chess_bdt60.png/120px-Chess_bdt60.png",
  bN: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Chess_ndt60.png/120px-Chess_ndt60.png",
  bP: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Chess_pdt60.png/120px-Chess_pdt60.png",
};

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PST_CENTER = [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,1,1,1,1,0,0, 0,0,1,2,2,1,0,0, 0,0,1,2,2,1,0,0, 0,0,1,1,1,1,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0];

function evaluateBoard(game, depth = 0) {
  const board = game.board();
  let score = 0;
  let idx = 0;
  for (const row of board) {
    for (const sq of row) {
      if (sq) {
        const v = PIECE_VALUES[sq.type] || 0;
        const positional = (PST_CENTER[idx] || 0) * 0.1;
        score += sq.color === "b" ? (v + positional) : -(v + positional);
      }
      idx++;
    }
  }
  return score;
}

function minimax(game, depth, alpha, beta, maximizing) {
  if (depth === 0 || game.isGameOver()) return evaluateBoard(game);
  const moves = game.moves({ verbose: true });
  if (maximizing) {
    let max = -Infinity;
    for (const move of moves) {
      const test = new Chess(game.fen());
      test.move(move);
      const score = minimax(test, depth - 1, alpha, beta, false);
      max = Math.max(max, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return max;
  } else {
    let min = Infinity;
    for (const move of moves) {
      const test = new Chess(game.fen());
      test.move(move);
      const score = minimax(test, depth - 1, alpha, beta, true);
      min = Math.min(min, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return min;
  }
}

function pickComputerMove(game, difficulty) {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  if (difficulty === "easy") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth = difficulty === "hard" ? 3 : 2;
  let bestScore = -Infinity;
  let best = [];
  for (const move of moves) {
    const test = new Chess(game.fen());
    test.move(move);
    const score = minimax(test, depth - 1, -Infinity, Infinity, false);
    if (score > bestScore) { bestScore = score; best = [move]; }
    else if (score === bestScore) best.push(move);
  }
  return best[Math.floor(Math.random() * best.length)];
}

const PROMO_PIECES = [
  { type: "q", label: "Queen" },
  { type: "r", label: "Rook" },
  { type: "b", label: "Bishop" },
  { type: "n", label: "Knight" },
];

export default function ChessApp() {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Your move (White)");
  const [endResult, setEndResult] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [mode, setMode] = useState("computer"); // "computer" | "2player"
  const [difficulty, setDifficulty] = useState("medium");
  const [promoChoice, setPromoChoice] = useState(null); // {from, to}
  const { isDark } = useTheme();
  const t = themed(isDark);

  const board = useMemo(() => game.board(), [game]);

  useEffect(() => {
    if (game.isCheckmate()) {
      const turn = game.turn();
      if (mode === "2player") {
        setStatusMsg(turn === "w" ? "Checkmate — Black wins!" : "Checkmate — White wins!");
        setEndResult(turn === "w" ? "lose" : "win");
      } else {
        setStatusMsg(turn === "w" ? "Checkmate — Computer wins" : "Checkmate — You win!");
        setEndResult(turn === "w" ? "lose" : "win");
      }
    } else if (game.isDraw()) {
      setStatusMsg("Draw"); setEndResult("draw");
    } else if (game.isCheck()) {
      setStatusMsg(`Check! ${game.turn() === "w" ? "White" : "Black"}'s move`);
    } else {
      if (mode === "2player") {
        setStatusMsg(`${game.turn() === "w" ? "White" : "Black"}'s move`);
      } else {
        setStatusMsg(game.turn() === "w" ? "Your move (White)" : "Computer thinking…");
      }
    }
  }, [game, mode]);

  useEffect(() => {
    if (mode !== "computer" || game.turn() !== "b" || game.isGameOver()) return;
    setThinking(true);
    const t = setTimeout(() => {
      const move = pickComputerMove(game, difficulty);
      if (move) { const next = new Chess(game.fen()); next.move(move); setGame(next); }
      setThinking(false);
    }, 300);
    return () => clearTimeout(t);
  }, [game, mode, difficulty]);

  const tryMove = (from, to, promotion) => {
    const next = new Chess(game.fen());
    try {
      const move = next.move({ from, to, promotion });
      if (move) { setGame(next); setSelected(null); setLegalTargets([]); return true; }
    } catch {}
    return false;
  };

  const handleSquareClick = (file, rank) => {
    if (game.isGameOver() || thinking) return;
    if (mode === "computer" && game.turn() !== "w") return;

    const square = String.fromCharCode(97 + file) + (8 - rank);
    const piece = game.get(square);
    const turn = game.turn();

    if (selected) {
      if (selected === square) { setSelected(null); setLegalTargets([]); return; }
      // Check if this is a pawn promotion move
      const movingPiece = game.get(selected);
      if (movingPiece && movingPiece.type === "p") {
        const targetRank = 8 - rank;
        if ((movingPiece.color === "w" && targetRank === 8) || (movingPiece.color === "b" && targetRank === 1)) {
          if (legalTargets.includes(square)) {
            setPromoChoice({ from: selected, to: square });
            return;
          }
        }
      }
      if (tryMove(selected, square)) return;
      if (piece && piece.color === turn) {
        setSelected(square);
        setLegalTargets(game.moves({ square, verbose: true }).map((m) => m.to));
        return;
      }
      setSelected(null); setLegalTargets([]);
    } else if (piece && piece.color === turn) {
      setSelected(square);
      setLegalTargets(game.moves({ square, verbose: true }).map((m) => m.to));
    }
  };

  const handlePromotion = (type) => {
    if (promoChoice) {
      tryMove(promoChoice.from, promoChoice.to, type);
      setPromoChoice(null);
    }
  };

  const reset = (newMode, newDiff) => {
    setGame(new Chess()); setSelected(null); setLegalTargets([]); setEndResult(null); setPromoChoice(null);
    if (newMode) setMode(newMode);
    if (newDiff) setDifficulty(newDiff);
    setShowMenu(false);
  };

  return (
    <div className={`relative flex flex-col h-full font-space overflow-hidden ${isDark ? "bg-gradient-to-br from-[#1a1a1f] via-[#0f0f12] to-[#1a1a1f] text-white" : "bg-gradient-to-br from-[#f5f5f7] via-[#e5e5ea] to-[#f5f5f7] text-[#1c1c1e]"}`}>
      <div className={`flex items-center justify-between px-5 py-3 border-b ${t.border} shrink-0`}>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowMenu(!showMenu)} className={`p-1.5 rounded-lg ${t.hover}`}><Menu className="w-4 h-4" /></button>
          <span className="text-sm font-medium">{statusMsg}</span>
        </div>
        <button onClick={() => reset()} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/10 hover:bg-black/20"}`}>
          <RotateCcw className="w-3 h-3" /> New Game
        </button>
      </div>

      {showMenu && (
        <div className={`absolute top-12 left-4 z-30 rounded-xl border ${isDark ? "bg-[#2c2c2e] border-white/10" : "bg-white border-black/10"} shadow-2xl p-3 min-w-[180px] space-y-2`}>
          <div className={`text-[10px] uppercase tracking-wider ${t.textSubtle} px-1`}>Mode</div>
          <button onClick={() => reset("computer")} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${mode === "computer" ? "bg-blue-500/20 text-blue-400" : t.hover}`}>
            <Cpu className="w-3.5 h-3.5" /> vs Computer
          </button>
          <button onClick={() => reset("2player")} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${mode === "2player" ? "bg-blue-500/20 text-blue-400" : t.hover}`}>
            <Users className="w-3.5 h-3.5" /> 2 Player
          </button>
          {mode === "computer" && (
            <>
              <div className={`text-[10px] uppercase tracking-wider ${t.textSubtle} px-1 mt-2`}>Difficulty</div>
              {["easy", "medium", "hard"].map((d) => (
                <button key={d} onClick={() => { setDifficulty(d); reset("computer", d); }}
                  className={`w-full px-3 py-2 rounded-lg text-xs text-left capitalize ${difficulty === d ? "bg-green-500/20 text-green-400" : t.hover}`}>
                  {d}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-3 min-h-0">
        <div className="grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/10"
          style={{ aspectRatio: "1 / 1", height: "100%", maxHeight: "100%", maxWidth: "100%" }}>
          {board.map((row, rIdx) =>
            row.map((sq, fIdx) => {
              const square = String.fromCharCode(97 + fIdx) + (8 - rIdx);
              const isLight = (rIdx + fIdx) % 2 === 0;
              const isSelected = selected === square;
              const isTarget = legalTargets.includes(square);
              const pieceKey = sq ? (sq.color === "w" ? "w" + sq.type.toUpperCase() : "b" + sq.type.toUpperCase()) : null;
              const pieceImg = pieceKey ? PIECE_IMAGES[pieceKey] : null;
              return (
                <button key={square} onClick={() => handleSquareClick(fIdx, rIdx)}
                  className="relative flex items-center justify-center transition-colors"
                  style={{ background: isSelected ? "rgba(255, 200, 80, 0.55)" : isLight ? "#e9dcc1" : "#7d5a3a" }}>
                  {pieceImg && <img src={pieceImg} alt={pieceKey} draggable={false} className="select-none pointer-events-none" style={{ width: "82%", height: "82%", objectFit: "contain", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }} />}
                  {isTarget && <span className="absolute w-3 h-3 rounded-full bg-emerald-500/70 ring-2 ring-emerald-300/60 pointer-events-none" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className={`px-5 py-2 border-t ${t.border} text-center shrink-0`}>
        <p className={`${t.textFaint} text-[10px]`}>Copyright © 2026 Tejt</p>
      </div>

      {/* Promotion picker */}
      {promoChoice && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`rounded-2xl border p-4 ${isDark ? "bg-[#2c2c2e] border-white/15" : "bg-white border-black/15"} shadow-2xl`}>
            <p className="text-sm font-medium mb-3 text-center">Choose promotion</p>
            <div className="flex gap-2">
              {PROMO_PIECES.map((p) => {
                const color = game.turn() === "w" ? "w" : "b";
                const key = color + p.type.toUpperCase();
                return (
                  <button key={p.type} onClick={() => handlePromotion(p.type)}
                    className={`w-14 h-14 rounded-lg flex items-center justify-center ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`}>
                    <img src={PIECE_IMAGES[key]} alt={p.label} className="w-10 h-10 object-contain" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {endResult && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm" style={{ animation: "fadeIn 0.4s ease-out" }}>
          <div className="flex flex-col items-center gap-4 px-8 py-6 rounded-2xl border border-white/15"
            style={{ background: endResult === "win" ? "linear-gradient(160deg, rgba(34,197,94,0.25), rgba(15,23,42,0.9))" : endResult === "lose" ? "linear-gradient(160deg, rgba(220,38,38,0.25), rgba(15,23,42,0.9))" : "linear-gradient(160deg, rgba(100,116,139,0.25), rgba(15,23,42,0.9))", animation: "popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
            {endResult === "win" ? <Trophy className="w-14 h-14 text-yellow-400" style={{ animation: "bounce 1s infinite" }} /> : endResult === "lose" ? <Frown className="w-14 h-14 text-red-400" /> : <div className="text-4xl">🤝</div>}
            <div className="text-2xl font-bold">{endResult === "win" ? "Victory!" : endResult === "lose" ? "Defeated" : "Draw"}</div>
            <button onClick={() => reset()} className="mt-2 px-5 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">Play Again</button>
          </div>
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes popIn{0%{transform:scale(.5);opacity:0}100%{transform:scale(1);opacity:1}}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
        </div>
      )}
    </div>
  );
}

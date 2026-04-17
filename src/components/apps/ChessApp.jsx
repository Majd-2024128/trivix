import { useState, useEffect, useMemo } from "react";
import { Chess } from "chess.js";
import { RotateCcw, Cpu } from "lucide-react";

// 3D-rendered chess piece images (public domain Wikimedia "3D" set).
const PIECE_IMAGES = {
  wK: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Chess_klt60.png/120px-Chess_klt60.png",
  wQ: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Chess_qlt60.png/120px-Chess_qlt60.png",
  wR: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Chess_rlt60.png/120px-Chess_rlt60.png",
  wB: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Chess_blt60.png/120px-Chess_blt60.png",
  wN: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Chess_nlt60.png/120px-Chess_nlt60.png",
  wP: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Chess_plt60.png/120px-Chess_plt60.png",
  bK: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Chess_kdt60.png/120px-Chess_kdt60.png",
  bQ: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Chess_qdt60.png/120px-Chess_qdt60.png",
  bR: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Chess_rdt60.png/120px-Chess_rdt60.png",
  bB: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Chess_bdt60.png/120px-Chess_bdt60.png",
  bN: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Chess_ndt60.png/120px-Chess_ndt60.png",
  bP: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Chess_pdt60.png/120px-Chess_pdt60.png",
};

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function evaluateBoard(game) {
  const board = game.board();
  let score = 0;
  for (const row of board) {
    for (const sq of row) {
      if (!sq) continue;
      const v = PIECE_VALUES[sq.type] || 0;
      score += sq.color === "b" ? v : -v;
    }
  }
  return score;
}

// Simple computer move: pick the best capture, else random legal move
function pickComputerMove(game) {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  let bestScore = -Infinity;
  let best = [];

  for (const move of moves) {
    const test = new Chess(game.fen());
    test.move(move);
    let score = evaluateBoard(test);
    // Prefer captures
    if (move.captured) score += PIECE_VALUES[move.captured] * 0.5;
    // Avoid moves that leave us in check
    if (test.inCheck() && test.turn() === "b") score -= 5;
    if (score > bestScore) {
      bestScore = score;
      best = [move];
    } else if (score === bestScore) {
      best.push(move);
    }
  }
  return best[Math.floor(Math.random() * best.length)];
}

export default function ChessApp() {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Your move (White)");

  const board = useMemo(() => game.board(), [game]);

  // Status updates
  useEffect(() => {
    if (game.isCheckmate()) {
      setStatusMsg(game.turn() === "w" ? "Checkmate — Computer wins" : "Checkmate — You win!");
    } else if (game.isDraw()) {
      setStatusMsg("Draw");
    } else if (game.isCheck()) {
      setStatusMsg(game.turn() === "w" ? "Check! Your move" : "Check on Computer");
    } else {
      setStatusMsg(game.turn() === "w" ? "Your move (White)" : "Computer thinking…");
    }
  }, [game]);

  // Computer move when it's black's turn
  useEffect(() => {
    if (game.turn() !== "b" || game.isGameOver()) return;
    setThinking(true);
    const t = setTimeout(() => {
      const move = pickComputerMove(game);
      if (move) {
        const next = new Chess(game.fen());
        next.move(move);
        setGame(next);
      }
      setThinking(false);
    }, 450);
    return () => clearTimeout(t);
  }, [game]);

  const handleSquareClick = (file, rank) => {
    if (game.turn() !== "w" || thinking || game.isGameOver()) return;
    const square = String.fromCharCode(97 + file) + (8 - rank);
    const piece = game.get(square);

    if (selected) {
      if (selected === square) {
        setSelected(null);
        setLegalTargets([]);
        return;
      }
      // Try the move
      const next = new Chess(game.fen());
      let move;
      try {
        move = next.move({ from: selected, to: square, promotion: "q" });
      } catch {
        move = null;
      }
      if (move) {
        setGame(next);
        setSelected(null);
        setLegalTargets([]);
        return;
      }
      // If clicked own piece, switch selection
      if (piece && piece.color === "w") {
        setSelected(square);
        setLegalTargets(game.moves({ square, verbose: true }).map((m) => m.to));
        return;
      }
      setSelected(null);
      setLegalTargets([]);
    } else if (piece && piece.color === "w") {
      setSelected(square);
      setLegalTargets(game.moves({ square, verbose: true }).map((m) => m.to));
    }
  };

  const reset = () => {
    setGame(new Chess());
    setSelected(null);
    setLegalTargets([]);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#1a1a1f] via-[#0f0f12] to-[#1a1a1f] text-white font-space overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-white/60" />
          <span className="text-sm font-medium">{statusMsg}</span>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          New Game
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div
          className="grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/10"
          style={{ width: "min(420px, 100%)", aspectRatio: "1 / 1" }}
        >
          {board.map((row, rIdx) =>
            row.map((sq, fIdx) => {
              const square = String.fromCharCode(97 + fIdx) + (8 - rIdx);
              const isLight = (rIdx + fIdx) % 2 === 0;
              const isSelected = selected === square;
              const isTarget = legalTargets.includes(square);
              const pieceKey = sq ? (sq.color === "w" ? "w" + sq.type.toUpperCase() : "b" + sq.type.toUpperCase()) : null;
              const pieceImg = pieceKey ? PIECE_IMAGES[pieceKey] : null;
              return (
                <button
                  key={square}
                  onClick={() => handleSquareClick(fIdx, rIdx)}
                  className="relative flex items-center justify-center transition-colors"
                  style={{
                    background: isSelected
                      ? "rgba(255, 200, 80, 0.55)"
                      : isLight
                      ? "#e9dcc1"
                      : "#7d5a3a",
                  }}
                >
                  {pieceImg && (
                    <img
                      src={pieceImg}
                      alt={pieceKey}
                      draggable={false}
                      className="select-none pointer-events-none"
                      style={{
                        width: "82%",
                        height: "82%",
                        objectFit: "contain",
                        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))",
                      }}
                    />
                  )}
                  {isTarget && (
                    <span className="absolute w-3 h-3 rounded-full bg-emerald-500/70 ring-2 ring-emerald-300/60 pointer-events-none" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="px-5 py-2 border-t border-white/10 text-center">
        <p className="text-white/25 text-[10px] font-space">Copyright © 2026 Tejt</p>
      </div>
    </div>
  );
}

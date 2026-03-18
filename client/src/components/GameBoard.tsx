import { useState } from "react";
import type { GameData } from "../App";
import type { ClientMessage } from "../types";
import { TableScene } from "./3d/TableScene";

interface Props {
  gameData: GameData;
  playerId: string;
  onSend: (msg: ClientMessage) => void;
}

export function GameBoard({ gameData, playerId, onSend }: Props) {
  const {
    players,
    discovererIndex,
    currentTurn,
    viewedSuspects,
    phase,
    isDiscoverer,
    isMyTurn,
    roundResult,
  } = gameData;

  const [selectedSuspects, setSelectedSuspects] = useState<number[]>([]);

  const handleSuspectSelect = (idx: number) => {
    if (selectedSuspects.includes(idx)) {
      setSelectedSuspects(selectedSuspects.filter((i) => i !== idx));
    } else if (selectedSuspects.length < 2) {
      setSelectedSuspects([...selectedSuspects, idx]);
    }
  };

  const handleViewSuspects = () => {
    if (selectedSuspects.length === 2) {
      onSend({
        type: "view_suspects",
        indices: selectedSuspects as [number, number],
      });
      setSelectedSuspects([]);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative">
      {/* 3D Table (full screen) */}
      <div className="flex-1">
        <TableScene gameData={gameData} playerId={playerId} />
      </div>

      {/* HTML Overlay for actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">

          {/* Alibi Phase */}
          {phase === "alibi" && (
            <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl animate-fade-in-up">
              <p className="text-[var(--oink-dark)] font-black text-center mb-3">ALIBI PHASE</p>
              <p className="text-[var(--oink-gray)] text-xs text-center mb-3">
                テーブル上のアリバイカードを確認してください
              </p>
              <button
                onClick={() => onSend({ type: "pass_alibi" })}
                className="w-full py-3 bg-[var(--oink-teal)] text-white rounded-xl font-bold transition-all active:scale-[0.98]"
              >
                確認OK
              </button>
            </div>
          )}

          {/* View Suspects */}
          {phase === "view_suspects" && isMyTurn && (
            <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl animate-fade-in-up">
              <p className="text-[var(--oink-dark)] font-black text-center mb-2">容疑者を確認</p>
              <div className="flex gap-2 mb-3">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    onClick={() => handleSuspectSelect(i)}
                    className={`flex-1 py-3 rounded-xl font-black text-lg transition-all ${
                      selectedSuspects.includes(i)
                        ? "bg-[var(--oink-orange)] text-white scale-105"
                        : "bg-[var(--oink-light-gray)] text-[var(--oink-dark)]"
                    }`}
                  >
                    #{i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={handleViewSuspects}
                disabled={selectedSuspects.length !== 2}
                className="w-full py-3 bg-[var(--oink-orange)] disabled:bg-[var(--oink-light-gray)] disabled:text-[var(--oink-gray)] text-white rounded-xl font-bold transition-all active:scale-[0.98]"
              >
                {selectedSuspects.length === 2 ? "確認する" : `あと${2 - selectedSuspects.length}人選択`}
              </button>
            </div>
          )}

          {phase === "view_suspects" && !isMyTurn && (
            <div className="bg-black/60 backdrop-blur rounded-2xl px-4 py-3 text-center">
              <p className="text-white text-sm font-bold">
                {players[currentTurn]?.name} が容疑者を確認中...
              </p>
            </div>
          )}

          {/* Tamper */}
          {phase === "tamper" && isDiscoverer && viewedSuspects && (
            <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl animate-fade-in-up">
              <p className="text-[var(--oink-dark)] font-black text-center mb-1">TAMPER</p>
              <p className="text-[var(--oink-gray)] text-xs text-center mb-3">被害者と入れ替える？</p>
              <div className="space-y-2">
                {viewedSuspects.indices.map((idx) => (
                  <button
                    key={idx}
                    onClick={() => onSend({ type: "tamper", suspect_idx: idx })}
                    className="w-full py-3 bg-[var(--oink-red)] text-white rounded-xl font-bold transition-all active:scale-[0.98]"
                  >
                    #{idx + 1} をすり替え
                  </button>
                ))}
                <button
                  onClick={() => onSend({ type: "skip_tamper" })}
                  className="w-full py-3 bg-[var(--oink-light-gray)] text-[var(--oink-dark)] rounded-xl font-bold transition-all"
                >
                  しない
                </button>
              </div>
            </div>
          )}

          {/* Accuse */}
          {phase === "accuse" && isMyTurn && (
            <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl animate-fade-in-up">
              <p className="text-[var(--oink-dark)] font-black text-center mb-3">犯人はだれ？</p>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    onClick={() => onSend({ type: "accuse", suspect_idx: i })}
                    className="flex-1 py-4 bg-[var(--oink-teal)] text-white rounded-xl font-black text-xl transition-all active:scale-[0.95]"
                  >
                    #{i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === "accuse" && !isMyTurn && (
            <div className="bg-black/60 backdrop-blur rounded-2xl px-4 py-3 text-center">
              <p className="text-white text-sm font-bold">
                {players[currentTurn]?.name} が告発中...
              </p>
            </div>
          )}

          {/* Reveal */}
          {phase === "reveal" && (
            <div className="animate-fade-in-up">
              <button
                onClick={() => onSend({ type: "resolve" })}
                className="w-full py-4 bg-[var(--oink-dark)] text-white rounded-2xl font-black text-lg transition-all active:scale-[0.98] shadow-xl"
              >
                結果を見る
              </button>
            </div>
          )}

          {/* Round Result */}
          {(phase === "round_end" || phase === "game_over") && roundResult && (
            <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl animate-scale-in">
              <p className="text-[var(--oink-dark)] font-black text-lg text-center mb-3">RESULT</p>

              {/* Penalties */}
              {roundResult.penalties.length > 0 && (
                <div className="mb-3 text-center">
                  {roundResult.penalties.map((p, i) => (
                    <p key={i} className="text-[var(--oink-red)] text-sm font-bold">
                      {p.player_name} +{p.count} liar
                    </p>
                  ))}
                </div>
              )}

              {/* Scores */}
              <div className="mb-3 space-y-1">
                {roundResult.playersScore.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm px-2">
                    <span className="text-[var(--oink-dark)] font-bold">{p.name}</span>
                    <span className="text-[var(--oink-gray)]">
                      <span className="text-[var(--oink-teal)]">{p.accusation_chips}</span>
                      {" / "}
                      <span className="text-[var(--oink-red)]">{p.liar_chips}</span>
                      {" / "}
                      <span className="font-black">{p.total}</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Game Over */}
              {phase === "game_over" && roundResult.loser && (
                <div className="bg-[var(--oink-red)] rounded-xl p-3 mb-3 text-center">
                  <p className="text-white font-black text-lg">GAME OVER</p>
                  <p className="text-white/80 text-sm">{roundResult.loser.name} の負け</p>
                </div>
              )}

              {/* Next Round */}
              {phase === "round_end" && (
                <button
                  onClick={() => onSend({ type: "next_round" })}
                  className="w-full py-3 bg-[var(--oink-orange)] text-white rounded-xl font-bold transition-all active:scale-[0.98]"
                >
                  NEXT ROUND
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top info bar */}
      <div className="absolute top-0 left-0 right-0 p-3 pointer-events-none">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="bg-black/50 backdrop-blur rounded-full px-3 py-1.5 text-white text-xs font-bold">
            発見者: {players[discovererIndex]?.name}
          </div>
          {isMyTurn && (phase === "view_suspects" || phase === "accuse" || phase === "tamper") && (
            <div className="bg-[var(--oink-orange)] rounded-full px-3 py-1.5 text-white text-xs font-black animate-pulse-soft">
              YOUR TURN
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

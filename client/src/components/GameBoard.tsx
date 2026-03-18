import { useState } from "react";
import type { GameData } from "../App";
import type { ClientMessage, CardInfo } from "../types";
import { TableScene } from "./3d/TableScene";

interface Props {
  gameData: GameData;
  playerId: string;
  onSend: (msg: ClientMessage) => void;
}

function CardChip({ card, label, size = "md" }: { card: CardInfo; label?: string; size?: "sm" | "md" | "lg" }) {
  const isBlank = card.card_type === "blank";
  const isFive = card.value === 5;
  const display = isBlank ? "X" : card.value;

  const sizes = {
    sm: "w-10 h-14 text-lg",
    md: "w-14 h-20 text-2xl",
    lg: "w-18 h-26 text-3xl",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${sizes[size]} rounded-xl flex items-center justify-center font-black shadow-lg border-2 ${
        isFive
          ? "bg-[var(--oink-red)] border-[var(--oink-red)] text-white"
          : isBlank
            ? "bg-[var(--oink-light-gray)] border-[var(--oink-gray)] text-[var(--oink-gray)]"
            : "bg-white border-[var(--oink-light-gray)] text-[var(--oink-dark)]"
      }`}>
        {display}
      </div>
      {label && <span className="text-[10px] text-white/70 font-bold">{label}</span>}
    </div>
  );
}

export function GameBoard({ gameData, playerId, onSend }: Props) {
  const {
    players,
    discovererIndex,
    currentTurn,
    alibiCards,
    viewedSuspects,
    phase,
    isDiscoverer,
    isMyTurn,
    accusationStacks,
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
      onSend({ type: "view_suspects", indices: selectedSuspects as [number, number] });
      setSelectedSuspects([]);
    }
  };

  return (
    <div className="flex-1 relative">
      {/* 3D Table (full screen background) */}
      <div className="absolute inset-0">
        <TableScene gameData={gameData} playerId={playerId} />
      </div>

      {/* Full-screen HTML overlay */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">

        {/* Top bar */}
        <div className="p-3 flex items-center justify-between max-w-lg mx-auto w-full pointer-events-auto">
          <div className="bg-black/60 backdrop-blur rounded-full px-3 py-1.5 text-white text-xs font-bold">
            発見者: {players[discovererIndex]?.name}
          </div>
          {isMyTurn && (phase === "view_suspects" || phase === "accuse" || phase === "tamper") && (
            <div className="bg-[var(--oink-orange)] rounded-full px-3 py-1.5 text-white text-xs font-black animate-pulse-soft">
              YOUR TURN
            </div>
          )}
        </div>

        {/* Center area - shows viewed suspects or alibi info */}
        <div className="flex-1 flex items-center justify-center">
          {/* Alibi cards display */}
          {phase === "alibi" && alibiCards && (
            <div className="bg-black/70 backdrop-blur-sm rounded-3xl p-6 animate-scale-in pointer-events-auto">
              <p className="text-white/60 text-xs font-bold text-center tracking-wider mb-4">YOUR ALIBI</p>
              <div className="flex gap-5 justify-center">
                <CardChip card={alibiCards.own} label="あなた" size="lg" />
                {alibiCards.received && (
                  <CardChip card={alibiCards.received} label="右隣から" size="lg" />
                )}
              </div>
              <p className="text-white/40 text-[10px] text-center mt-3">この数字は容疑者にいません</p>
            </div>
          )}

          {/* Viewed suspects display */}
          {viewedSuspects && (phase === "tamper" || phase === "accuse") && (
            <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-4 py-2 animate-fade-in">
              <div className="flex gap-3 justify-center">
                {viewedSuspects.indices.map((idx, i) => (
                  <div key={idx} className="flex flex-col items-center">
                    <CardChip card={viewedSuspects.cards[i]} label={`#${idx + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alibi reminder bar (during non-alibi phases) */}
        {alibiCards && phase !== "alibi" && phase !== "round_end" && phase !== "game_over" && (
          <div className="px-4 pb-1">
            <div className="max-w-md mx-auto bg-black/40 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-3 justify-center pointer-events-auto">
              <span className="text-white/40 text-[10px] font-bold">ALIBI:</span>
              <CardChip card={alibiCards.own} size="sm" />
              {alibiCards.received && <CardChip card={alibiCards.received} size="sm" />}
            </div>
          </div>
        )}

        {/* Bottom action panel */}
        <div className="p-4 pointer-events-auto">
          <div className="max-w-md mx-auto">

            {/* Alibi Phase */}
            {phase === "alibi" && (
              <button
                onClick={() => onSend({ type: "pass_alibi" })}
                className="w-full py-4 bg-[var(--oink-teal)] text-white rounded-2xl font-black text-lg transition-all active:scale-[0.98] shadow-xl animate-fade-in-up"
              >
                確認OK → 告発フェーズへ
              </button>
            )}

            {/* View Suspects */}
            {phase === "view_suspects" && isMyTurn && (
              <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl animate-fade-in-up">
                <p className="text-[var(--oink-dark)] font-black text-center text-sm mb-3">容疑者を2人選んで確認</p>
                <div className="flex gap-2 mb-3">
                  {[0, 1, 2].map((i) => (
                    <button
                      key={i}
                      onClick={() => handleSuspectSelect(i)}
                      className={`flex-1 py-4 rounded-xl font-black text-xl transition-all ${
                        selectedSuspects.includes(i)
                          ? "bg-[var(--oink-orange)] text-white scale-105 shadow-lg"
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
                  {selectedSuspects.length === 2 ? "確認する" : `あと${2 - selectedSuspects.length}人`}
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
                <p className="text-[var(--oink-dark)] font-black text-center text-sm mb-1">TAMPER</p>
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
                    className="w-full py-3 bg-[var(--oink-light-gray)] text-[var(--oink-dark)] rounded-xl font-bold"
                  >
                    しない
                  </button>
                </div>
              </div>
            )}

            {/* Accuse */}
            {phase === "accuse" && isMyTurn && (
              <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl animate-fade-in-up">
                <p className="text-[var(--oink-dark)] font-black text-center text-sm mb-3">犯人はだれ？</p>
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <button
                      key={i}
                      onClick={() => onSend({ type: "accuse", suspect_idx: i })}
                      className="flex-1 py-4 bg-[var(--oink-teal)] text-white rounded-xl font-black text-xl transition-all active:scale-[0.95] shadow-lg"
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
              <button
                onClick={() => onSend({ type: "resolve" })}
                className="w-full py-4 bg-[var(--oink-dark)] text-white rounded-2xl font-black text-lg transition-all active:scale-[0.98] shadow-xl animate-fade-in-up"
              >
                結果を見る
              </button>
            )}

            {/* Round Result */}
            {(phase === "round_end" || phase === "game_over") && roundResult && (
              <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl animate-scale-in">
                <p className="text-[var(--oink-dark)] font-black text-lg text-center mb-3">RESULT</p>

                {/* Revealed suspects */}
                <div className="flex gap-3 justify-center mb-3">
                  {roundResult.suspects.map((card, i) => (
                    <div key={i} className="relative">
                      <CardChip
                        card={card}
                        label={i === roundResult.murdererIdx ? "GUILTY!" : `#${i + 1}`}
                      />
                      {i === roundResult.murdererIdx && (
                        <div className="absolute -top-1 -right-1 bg-[var(--oink-red)] text-white text-[8px] w-5 h-5 rounded-full flex items-center justify-center font-black">!</div>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-center text-[var(--oink-gray)] text-xs mb-3">
                  被害者: {roundResult.victim.card_type === "blank" ? "X" : roundResult.victim.value}
                </p>

                {roundResult.penalties.length > 0 && (
                  <div className="mb-3 text-center">
                    {roundResult.penalties.map((p, i) => (
                      <p key={i} className="text-[var(--oink-red)] text-sm font-bold">
                        {p.player_name} +{p.count} liar
                      </p>
                    ))}
                  </div>
                )}

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

                {phase === "game_over" && roundResult.loser && (
                  <div className="bg-[var(--oink-red)] rounded-xl p-3 mb-3 text-center">
                    <p className="text-white font-black text-lg">GAME OVER</p>
                    <p className="text-white/80 text-sm">{roundResult.loser.name} の負け</p>
                  </div>
                )}

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
      </div>
    </div>
  );
}

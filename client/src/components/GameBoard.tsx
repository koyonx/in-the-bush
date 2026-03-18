import { useState } from "react";
import type { GameData } from "../App";
import type { ClientMessage } from "../types";
import { CardDisplay } from "./CardDisplay";

const PLAYER_COLORS = [
  "bg-[var(--oink-orange)]",
  "bg-[var(--oink-teal)]",
  "bg-[var(--oink-blue)]",
  "bg-[var(--oink-red)]",
  "bg-[var(--oink-yellow)]",
  "bg-[#9B59B6]",
  "bg-[#2ECC71]",
  "bg-[#E67E22]",
  "bg-[#1ABC9C]",
  "bg-[#E74C3C]",
];

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
    alibiCards,
    viewedSuspects,
    phase,
    isDiscoverer,
    isMyTurn,
    accusationStacks,
    roundResult,
  } = gameData;

  const [selectedSuspects, setSelectedSuspects] = useState<number[]>([]);
  const myIndex = players.findIndex((p) => p.id === playerId);

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

  const isActivePhase = phase === "view_suspects" || phase === "accuse" || phase === "tamper";

  return (
    <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
      {/* Player bar */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 animate-slide-down">
        {players.map((p, i) => {
          const isCurrent = i === currentTurn && isActivePhase;
          const isMe = i === myIndex;
          return (
            <div
              key={p.id}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                isCurrent
                  ? "bg-[var(--oink-orange)] text-white shadow-md shadow-[var(--oink-orange)]/20 scale-105"
                  : isMe
                    ? "bg-white text-[var(--oink-dark)] border-2 border-[var(--oink-orange)]/30"
                    : "bg-white text-[var(--oink-gray)] border-2 border-[var(--oink-light-gray)]"
              }`}
            >
              <div className={`w-5 h-5 rounded-full ${PLAYER_COLORS[i % PLAYER_COLORS.length]} flex items-center justify-center text-white text-[10px] font-black`}>
                {(p.name[0] || "?").toUpperCase()}
              </div>
              <span className="max-w-16 truncate">{p.name}</span>
              {i === discovererIndex && (
                <span className="text-[10px] opacity-70">&#x1F50D;</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Alibi Phase */}
      {phase === "alibi" && alibiCards && (
        <div className="bg-white rounded-3xl p-6 border-2 border-[var(--oink-light-gray)] mb-4 animate-fade-in-up">
          <div className="text-center mb-5">
            <h3 className="text-[var(--oink-dark)] font-black text-lg mb-1">ALIBI</h3>
            <p className="text-[var(--oink-gray)] text-sm">
              この数字は容疑者にいません
            </p>
          </div>
          <div className="flex justify-center gap-6 mb-6">
            <CardDisplay card={alibiCards.own} size="lg" label="あなた" animate />
            {alibiCards.received && (
              <CardDisplay card={alibiCards.received} size="lg" label="右隣" animate />
            )}
          </div>
          <button
            onClick={() => onSend({ type: "pass_alibi" })}
            className="w-full py-3 bg-[var(--oink-teal)] hover:bg-[var(--oink-teal-light)] text-white rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-[var(--oink-teal)]/20"
          >
            確認OK
          </button>
        </div>
      )}

      {/* Crime Scene */}
      {(phase === "view_suspects" || phase === "tamper" || phase === "accuse" || phase === "waiting") && (
        <div className="bg-white rounded-3xl p-5 border-2 border-[var(--oink-light-gray)] mb-4 animate-fade-in">
          <h3 className="text-[var(--oink-dark)] font-black text-center mb-4 tracking-wider text-sm uppercase">Suspects</h3>
          <div className="flex justify-center gap-5 mb-3">
            {[0, 1, 2].map((i) => {
              const viewed = viewedSuspects?.indices.includes(i);
              const viewedCard = viewed
                ? viewedSuspects!.cards[viewedSuspects!.indices.indexOf(i)]
                : null;

              return (
                <div key={i} className="flex flex-col items-center">
                  {viewedCard ? (
                    <CardDisplay
                      card={viewedCard}
                      size="lg"
                      label={`#${i + 1}`}
                      selected={phase === "view_suspects" && selectedSuspects.includes(i)}
                      animate
                      onClick={
                        phase === "view_suspects" && isMyTurn
                          ? () => handleSuspectSelect(i)
                          : undefined
                      }
                    />
                  ) : (
                    <CardDisplay
                      card={{ card_type: "blank", value: null }}
                      faceDown
                      size="lg"
                      label={`#${i + 1}`}
                      selected={selectedSuspects.includes(i)}
                      onClick={
                        phase === "view_suspects" && isMyTurn
                          ? () => handleSuspectSelect(i)
                          : undefined
                      }
                    />
                  )}
                  {/* Accusation chips */}
                  {accusationStacks[i].length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-0.5 justify-center max-w-20">
                      {accusationStacks[i].map((name, j) => (
                        <span
                          key={j}
                          className="text-[9px] bg-[var(--oink-orange)]/15 text-[var(--oink-orange)] px-1.5 py-0.5 rounded-full font-bold"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View Suspects Action */}
      {phase === "view_suspects" && isMyTurn && (
        <div className="bg-[var(--oink-orange)]/5 rounded-3xl p-5 border-2 border-[var(--oink-orange)]/20 mb-4 animate-fade-in-up">
          <p className="text-[var(--oink-dark)] text-sm font-bold mb-3 text-center">
            容疑者を2人選んでください
          </p>
          <button
            onClick={handleViewSuspects}
            disabled={selectedSuspects.length !== 2}
            className="w-full py-3 bg-[var(--oink-orange)] hover:bg-[var(--oink-orange-light)] disabled:bg-[var(--oink-light-gray)] disabled:text-[var(--oink-gray)] text-white rounded-2xl font-bold transition-all active:scale-[0.98]"
          >
            {selectedSuspects.length === 2 ? "確認する" : `あと${2 - selectedSuspects.length}人選択`}
          </button>
        </div>
      )}

      {phase === "view_suspects" && !isMyTurn && (
        <div className="text-center py-6 animate-fade-in">
          <p className="text-[var(--oink-gray)] text-sm font-medium">
            <span className="text-[var(--oink-orange)] font-bold">{players[currentTurn]?.name}</span> が容疑者を確認中
          </p>
          <div className="flex justify-center gap-1 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--oink-orange)] animate-bounce-subtle" />
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--oink-orange)] animate-bounce-subtle stagger-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--oink-orange)] animate-bounce-subtle stagger-2" />
          </div>
        </div>
      )}

      {/* Tamper */}
      {phase === "tamper" && isDiscoverer && viewedSuspects && (
        <div className="bg-[var(--oink-red)]/5 rounded-3xl p-5 border-2 border-[var(--oink-red)]/20 mb-4 animate-fade-in-up">
          <h3 className="text-[var(--oink-dark)] font-black text-center mb-1">TAMPER</h3>
          <p className="text-[var(--oink-gray)] text-xs text-center mb-4">
            被害者と入れ替えますか？
          </p>
          <div className="space-y-2">
            {viewedSuspects.indices.map((idx) => (
              <button
                key={idx}
                onClick={() => onSend({ type: "tamper", suspect_idx: idx })}
                className="w-full py-3 bg-[var(--oink-red)] hover:bg-[var(--oink-red)]/80 text-white rounded-2xl font-bold transition-all active:scale-[0.98]"
              >
                #{idx + 1} をすり替え
              </button>
            ))}
            <button
              onClick={() => onSend({ type: "skip_tamper" })}
              className="w-full py-3 bg-white hover:bg-[var(--oink-light-gray)] text-[var(--oink-gray)] rounded-2xl font-bold transition-all border-2 border-[var(--oink-light-gray)]"
            >
              しない
            </button>
          </div>
        </div>
      )}

      {/* Accuse */}
      {phase === "accuse" && isMyTurn && (
        <div className="bg-[var(--oink-teal)]/5 rounded-3xl p-5 border-2 border-[var(--oink-teal)]/20 mb-4 animate-fade-in-up">
          <h3 className="text-[var(--oink-dark)] font-black text-center mb-1">ACCUSE</h3>
          <p className="text-[var(--oink-gray)] text-xs text-center mb-4">
            犯人はだれ？
          </p>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => onSend({ type: "accuse", suspect_idx: i })}
                className="flex-1 py-4 bg-[var(--oink-teal)] hover:bg-[var(--oink-teal-light)] text-white rounded-2xl font-black text-lg transition-all active:scale-[0.95]"
              >
                #{i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "accuse" && !isMyTurn && (
        <div className="text-center py-6 animate-fade-in">
          <p className="text-[var(--oink-gray)] text-sm font-medium">
            <span className="text-[var(--oink-teal)] font-bold">{players[currentTurn]?.name}</span> が告発中
          </p>
          <div className="flex justify-center gap-1 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--oink-teal)] animate-bounce-subtle" />
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--oink-teal)] animate-bounce-subtle stagger-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--oink-teal)] animate-bounce-subtle stagger-2" />
          </div>
        </div>
      )}

      {/* Reveal */}
      {phase === "reveal" && (
        <div className="text-center animate-fade-in-up">
          <button
            onClick={() => onSend({ type: "resolve" })}
            className="w-full py-4 bg-[var(--oink-dark)] hover:bg-[var(--oink-dark)]/80 text-white rounded-2xl font-black text-lg transition-all active:scale-[0.98] shadow-xl"
          >
            結果を見る
          </button>
        </div>
      )}

      {/* Round Result */}
      {(phase === "round_end" || phase === "game_over") && roundResult && (
        <div className="bg-white rounded-3xl p-5 border-2 border-[var(--oink-light-gray)] mb-4 animate-scale-in">
          <h3 className="text-[var(--oink-dark)] font-black text-xl text-center mb-5 tracking-wider">RESULT</h3>

          {/* Suspects */}
          <div className="flex justify-center gap-5 mb-5">
            {roundResult.suspects.map((card, i) => (
              <div key={i} className="relative">
                <CardDisplay
                  card={card}
                  size="lg"
                  label={i === roundResult.murdererIdx ? "GUILTY" : `#${i + 1}`}
                  highlighted={i === roundResult.murdererIdx}
                  animate
                />
                {i === roundResult.murdererIdx && (
                  <div className="absolute -top-2 -right-2 bg-[var(--oink-red)] text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-black shadow-md animate-scale-in">
                    !
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Victim */}
          <div className="text-center mb-4 py-2 bg-[var(--oink-cream)] rounded-xl">
            <span className="text-[var(--oink-gray)] text-xs font-medium">被害者: </span>
            <span className="text-[var(--oink-dark)] font-black">
              {roundResult.victim.card_type === "blank" ? "x" : roundResult.victim.value}
            </span>
          </div>

          {/* Penalties */}
          {roundResult.penalties.length > 0 && (
            <div className="mb-4 bg-[var(--oink-red)]/5 rounded-xl p-3">
              {roundResult.penalties.map((p, i) => (
                <p key={i} className="text-[var(--oink-red)] text-sm font-bold text-center">
                  {p.player_name} +{p.count} liar chip{p.count > 1 ? "s" : ""}
                </p>
              ))}
            </div>
          )}

          {/* Scores */}
          <div className="mb-4 space-y-1.5">
            {roundResult.playersScore.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-[var(--oink-cream)] rounded-xl text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${PLAYER_COLORS[i % PLAYER_COLORS.length]} flex items-center justify-center text-white text-[9px] font-black`}>
                    {(p.name[0] || "?").toUpperCase()}
                  </div>
                  <span className="text-[var(--oink-dark)] font-bold">{p.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-[var(--oink-teal)] font-bold">{p.accusation_chips}</span>
                  <span className="text-[var(--oink-gray)]">/</span>
                  <span className="text-[var(--oink-red)] font-bold">{p.liar_chips}</span>
                  <span className="text-[var(--oink-gray)]">/</span>
                  <span className="text-[var(--oink-dark)] font-black bg-[var(--oink-light-gray)] px-2 py-0.5 rounded-full">{p.total}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Game Over */}
          {phase === "game_over" && roundResult.loser && (
            <div className="bg-[var(--oink-red)] rounded-2xl p-5 mb-4 text-center animate-scale-in">
              <p className="text-white text-2xl font-black mb-1">
                GAME OVER
              </p>
              <p className="text-white/80 text-sm font-bold">
                {roundResult.loser.name} の負け
              </p>
            </div>
          )}

          {/* Next Round */}
          {phase === "round_end" && (
            <button
              onClick={() => onSend({ type: "next_round" })}
              className="w-full py-4 bg-[var(--oink-orange)] hover:bg-[var(--oink-orange-light)] text-white rounded-2xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-[var(--oink-orange)]/20"
            >
              NEXT ROUND
            </button>
          )}
        </div>
      )}

      {/* Alibi reminder */}
      {alibiCards && phase !== "alibi" && phase !== "round_end" && phase !== "game_over" && (
        <div className="bg-[var(--oink-cream)] rounded-2xl p-3 border-2 border-[var(--oink-light-gray)] mt-auto">
          <p className="text-[var(--oink-gray)] text-[10px] font-bold tracking-wider uppercase text-center mb-2">Your Alibi</p>
          <div className="flex gap-3 justify-center">
            <CardDisplay card={alibiCards.own} size="sm" label="you" />
            {alibiCards.received && (
              <CardDisplay card={alibiCards.received} size="sm" label="right" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

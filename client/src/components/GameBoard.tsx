import { useState } from "react";
import type { GameData } from "../App";
import type { ClientMessage } from "../types";
import { CardDisplay } from "./CardDisplay";

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

  return (
    <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">
          ラウンド {gameData.roundResult ? "" : "進行中"}
        </h2>
        <div className="text-sm text-gray-400">
          発見者: <span className="text-amber-400">{players[discovererIndex]?.name}</span>
        </div>
      </div>

      {/* Player list */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {players.map((p, i) => (
          <div
            key={p.id}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm ${
              i === currentTurn && (phase === "view_suspects" || phase === "accuse" || phase === "tamper")
                ? "bg-amber-600/30 border border-amber-500 text-amber-300"
                : i === discovererIndex
                  ? "bg-indigo-900/30 border border-indigo-500 text-indigo-300"
                  : "bg-gray-800 border border-gray-700 text-gray-400"
            }`}
          >
            {p.name}
            {i === discovererIndex && " 🔍"}
          </div>
        ))}
      </div>

      {/* Alibi Phase */}
      {phase === "alibi" && alibiCards && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-4">
          <h3 className="text-white font-medium mb-4">アリバイカード確認</h3>
          <p className="text-gray-400 text-sm mb-4">
            これらの数字は容疑者の中にいません
          </p>
          <div className="flex justify-center gap-6 mb-6">
            <CardDisplay card={alibiCards.own} label="自分のカード" />
            {alibiCards.received && (
              <CardDisplay card={alibiCards.received} label="右隣から" />
            )}
          </div>
          <button
            onClick={() => onSend({ type: "pass_alibi" })}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
          >
            確認完了 → 告発フェーズへ
          </button>
        </div>
      )}

      {/* Crime Scene - Suspects */}
      {(phase === "view_suspects" || phase === "tamper" || phase === "accuse" || phase === "waiting") && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mb-4">
          <h3 className="text-white font-medium mb-3">犯行現場</h3>
          <div className="flex justify-center gap-4 mb-2">
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
                      label={`容疑者 ${i + 1}`}
                      selected={phase === "view_suspects" && selectedSuspects.includes(i)}
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
                      label={`容疑者 ${i + 1}`}
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
                    <div className="mt-1 flex flex-wrap gap-0.5 justify-center max-w-16">
                      {accusationStacks[i].map((name, j) => (
                        <span
                          key={j}
                          className="text-[10px] bg-red-900/50 text-red-300 px-1 rounded"
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
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mb-4">
          <p className="text-amber-300 text-sm mb-3">
            容疑者を2人選んで確認してください
          </p>
          <button
            onClick={handleViewSuspects}
            disabled={selectedSuspects.length !== 2}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
          >
            選んだ容疑者を確認する
          </button>
        </div>
      )}

      {phase === "view_suspects" && !isMyTurn && (
        <div className="text-center text-gray-400 py-4">
          <span className="text-amber-400">{players[currentTurn]?.name}</span> が容疑者を確認中...
        </div>
      )}

      {/* Tamper Action (Discoverer only) */}
      {phase === "tamper" && isDiscoverer && viewedSuspects && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mb-4">
          <h3 className="text-white font-medium mb-2">すり替え</h3>
          <p className="text-gray-400 text-sm mb-3">
            確認した容疑者と被害者を入れ替えますか？
          </p>
          <div className="space-y-2">
            {viewedSuspects.indices.map((idx) => (
              <button
                key={idx}
                onClick={() => onSend({ type: "tamper", suspect_idx: idx })}
                className="w-full py-2 bg-red-800/50 hover:bg-red-700/50 text-red-300 rounded-lg transition-colors border border-red-700"
              >
                容疑者 {idx + 1} をすり替える
              </button>
            ))}
            <button
              onClick={() => onSend({ type: "skip_tamper" })}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              すり替えない
            </button>
          </div>
        </div>
      )}

      {/* Accuse Action */}
      {phase === "accuse" && isMyTurn && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mb-4">
          <h3 className="text-white font-medium mb-2">告発</h3>
          <p className="text-gray-400 text-sm mb-3">
            誰が犯人だと思いますか？
          </p>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => onSend({ type: "accuse", suspect_idx: i })}
                className="flex-1 py-3 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-lg transition-colors border border-amber-700"
              >
                容疑者 {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "accuse" && !isMyTurn && (
        <div className="text-center text-gray-400 py-4">
          <span className="text-amber-400">{players[currentTurn]?.name}</span> が告発中...
        </div>
      )}

      {/* Reveal Phase */}
      {phase === "reveal" && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mb-4">
          <h3 className="text-white font-medium mb-3">全員の告発が完了しました</h3>
          <button
            onClick={() => onSend({ type: "resolve" })}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors text-lg"
          >
            結果を見る
          </button>
        </div>
      )}

      {/* Round Result */}
      {(phase === "round_end" || phase === "game_over") && roundResult && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mb-4">
          <h3 className="text-white font-bold text-lg mb-4">結果発表</h3>

          {/* Suspects reveal */}
          <div className="flex justify-center gap-4 mb-4">
            {roundResult.suspects.map((card, i) => (
              <div key={i} className="relative">
                <CardDisplay
                  card={card}
                  size="lg"
                  label={
                    i === roundResult.murdererIdx
                      ? "犯人!"
                      : `容疑者 ${i + 1}`
                  }
                />
                {i === roundResult.murdererIdx && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    犯人
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mb-4 text-center">
            <span className="text-gray-400 text-sm">被害者: </span>
            <span className="text-white">
              {roundResult.victim.card_type === "blank"
                ? "×"
                : roundResult.victim.value}
            </span>
          </div>

          {/* Penalties */}
          {roundResult.penalties.length > 0 && (
            <div className="mb-4">
              <p className="text-red-400 text-sm mb-2">ペナルティ:</p>
              {roundResult.penalties.map((p, i) => (
                <p key={i} className="text-red-300 text-sm">
                  {p.player_name}: ライアーチップ +{p.count}
                </p>
              ))}
            </div>
          )}

          {/* Scores */}
          <div className="mb-4">
            <p className="text-gray-400 text-sm mb-2">スコア:</p>
            <div className="space-y-1">
              {roundResult.playersScore.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-white">{p.name}</span>
                  <span className="text-gray-400">
                    告発: {p.accusation_chips} / ライアー: {p.liar_chips} / 合計:{" "}
                    {p.total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {phase === "game_over" && roundResult.loser && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4 text-center">
              <p className="text-red-300 text-lg font-bold">
                {roundResult.loser.name} の負け!
              </p>
              <p className="text-red-400 text-sm">ゲーム終了</p>
            </div>
          )}

          {phase === "round_end" && (
            <button
              onClick={() => onSend({ type: "next_round" })}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
            >
              次のラウンドへ
            </button>
          )}
        </div>
      )}

      {/* Alibi reminder */}
      {alibiCards && phase !== "alibi" && phase !== "round_end" && phase !== "game_over" && (
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 mt-auto">
          <p className="text-gray-500 text-xs mb-1">あなたのアリバイ情報</p>
          <div className="flex gap-3 justify-center">
            <CardDisplay card={alibiCards.own} size="sm" label="自分" />
            {alibiCards.received && (
              <CardDisplay card={alibiCards.received} size="sm" label="右隣" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

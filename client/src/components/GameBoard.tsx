import { useState, useEffect } from "react";
import type { GameData } from "../App";
import type { ClientMessage, CardInfo } from "../types";
import { TableScene } from "./3d/TableScene";

interface Props {
  gameData: GameData;
  playerId: string;
  onSend: (msg: ClientMessage) => void;
}

const SUSPECT_KANJI = ["壱", "弐", "参"];

function AlibiCardView({ card, label }: { card: CardInfo; label: string }) {
  const isFive = card.value === 5;
  const display = card.card_type === "blank" ? "×" : String(card.value);

  return (
    <div style={{
      width: "80px",
      height: "115px",
      background: "linear-gradient(135deg, #F5F0E1 0%, #E8E0D0 100%)",
      border: "1px solid rgba(201,169,110,0.5)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Zen Antique', 'Noto Serif JP', serif",
      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      position: "relative",
      flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: "3px", left: "3px", right: "3px", bottom: "3px",
        border: "1px solid rgba(201,169,110,0.3)",
        pointerEvents: "none",
      }} />
      <div style={{
        fontSize: "42px",
        fontWeight: 900,
        color: isFive ? "#C41E3A" : "#2D2520",
        lineHeight: 1,
      }}>
        {display}
      </div>
      <div style={{
        fontSize: "8px",
        fontWeight: 700,
        color: "#8C7B6B",
        marginTop: "6px",
        letterSpacing: "2px",
      }}>
        {label}
      </div>
    </div>
  );
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
    alibiCards,
  } = gameData;

  const [selectedSuspects, setSelectedSuspects] = useState<number[]>([]);
  const [alibiStep, setAlibiStep] = useState<"own" | "sliding" | "done">("own");

  useEffect(() => {
    if (phase === "alibi") {
      setAlibiStep("own");
    }
  }, [phase]);

  const handleAlibiConfirm = () => {
    if (alibiStep === "own") {
      if (alibiCards?.received) {
        setAlibiStep("sliding");
        setTimeout(() => setAlibiStep("done"), 800);
      } else {
        onSend({ type: "pass_alibi" });
      }
    } else if (alibiStep === "done") {
      onSend({ type: "pass_alibi" });
    }
  };

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

  const showAlibiOverlay = phase === "alibi" && alibiCards;

  // 下部パネルの内容を決定
  const renderBottomPanel = () => {
    // アリバイフェーズ: カード表示 + 確認ボタン
    if (showAlibiOverlay) {
      const isSliding = alibiStep === "sliding";
      const isDone = alibiStep === "done";
      const hasReceived = !!alibiCards.received;
      const isTransitioning = isSliding || isDone;

      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          {/* カード表示エリア - overflow:hidden で左に消えるカードを隠す */}
          <div style={{
            position: "relative",
            width: "200px",
            height: "115px",
            overflow: "hidden",
          }}>
            {/* 1枚目: 自分のカード → 左へ渡すアニメーション */}
            <div style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transition: "all 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
              transform: isTransitioning && hasReceived
                ? "translateX(calc(-50% - 140px))"  // 左へスライドアウト
                : "translateX(-50%)",                // 中央
              opacity: isTransitioning && hasReceived ? 0 : 1,
            }}>
              <AlibiCardView card={alibiCards.own} label="自分の証言" />
            </div>

            {/* 2枚目: 右隣のカード → 右からスライドイン */}
            {hasReceived && isTransitioning && (
              <div style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transition: "all 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                transform: isDone
                  ? "translateX(-50%)"             // 中央に到着
                  : "translateX(calc(-50% + 140px))", // 右からスタート
                opacity: isDone ? 1 : 0,
              }}>
                <AlibiCardView card={alibiCards.received!} label="右隣の証言" />
              </div>
            )}
          </div>

          <button
            onClick={handleAlibiConfirm}
            disabled={isSliding}
            style={{
              width: "100%", maxWidth: "360px",
              padding: "14px 0", fontSize: "15px",
              letterSpacing: "4px", fontWeight: 700,
              background: isSliding ? "#3D3530" : "#5B7553",
              color: "#F5F0E1",
              border: "none", cursor: isSliding ? "default" : "pointer",
              fontFamily: "'Noto Serif JP', serif",
              opacity: isSliding ? 0.4 : 1,
              transition: "all 0.2s",
            }}
          >
            {alibiStep === "own" ? "確認（自分の証言）"
              : isSliding ? "…"
              : "確認（右隣の証言）"}
          </button>
        </div>
      );
    }

    // 容疑者選択
    if (phase === "view_suspects" && isMyTurn) {
      return (
        <div style={{ maxWidth: "360px", width: "100%", margin: "0 auto" }}>
          <p style={{
            textAlign: "center", fontSize: "13px", marginBottom: "10px",
            letterSpacing: "4px", color: "#C9A96E",
            fontFamily: "'Noto Serif JP', serif",
          }}>
            容疑者を二人選べ
          </p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            {[0, 1, 2].map((i) => {
              const selected = selectedSuspects.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => handleSuspectSelect(i)}
                  style={{
                    flex: 1, padding: "12px 0", fontSize: "20px", fontWeight: 700,
                    background: selected ? "#C41E3A" : "rgba(245,240,225,0.08)",
                    color: selected ? "#F5F0E1" : "#8C8478",
                    border: selected ? "1px solid #C41E3A" : "1px solid rgba(140,132,120,0.3)",
                    fontFamily: "'Zen Antique', serif",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {SUSPECT_KANJI[i]}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleViewSuspects}
            disabled={selectedSuspects.length !== 2}
            style={{
              width: "100%", padding: "12px 0", fontWeight: 700,
              letterSpacing: "4px",
              background: selectedSuspects.length === 2 ? "#C41E3A" : "transparent",
              color: "#F5F0E1",
              border: selectedSuspects.length === 2 ? "none" : "1px solid rgba(140,132,120,0.3)",
              opacity: selectedSuspects.length === 2 ? 1 : 0.3,
              fontFamily: "'Noto Serif JP', serif",
              cursor: selectedSuspects.length === 2 ? "pointer" : "default",
            }}
          >
            {selectedSuspects.length === 2 ? "確認する" : `あと${2 - selectedSuspects.length}人`}
          </button>
        </div>
      );
    }

    if (phase === "view_suspects" && !isMyTurn) {
      return (
        <p style={{ textAlign: "center", fontSize: "13px", letterSpacing: "3px", color: "#8C8478", fontFamily: "'Noto Serif JP', serif" }}>
          {players[currentTurn]?.name} が確認中…
        </p>
      );
    }

    // すり替え
    if (phase === "tamper" && isDiscoverer && viewedSuspects) {
      return (
        <div style={{ maxWidth: "360px", width: "100%", margin: "0 auto" }}>
          <p style={{
            textAlign: "center", fontSize: "13px", marginBottom: "10px",
            letterSpacing: "4px", color: "#C9A96E",
            fontFamily: "'Noto Serif JP', serif",
          }}>
            被害者と入れ替えるか？
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {viewedSuspects.indices.map((idx) => (
              <button
                key={idx}
                onClick={() => onSend({ type: "tamper", suspect_idx: idx })}
                style={{
                  width: "100%", padding: "12px 0", fontWeight: 700,
                  letterSpacing: "4px", background: "#C41E3A",
                  color: "#F5F0E1", cursor: "pointer",
                  fontFamily: "'Noto Serif JP', serif",
                }}
              >
                {SUSPECT_KANJI[idx]} をすり替え
              </button>
            ))}
            <button
              onClick={() => onSend({ type: "skip_tamper" })}
              style={{
                width: "100%", padding: "12px 0", fontWeight: 700,
                letterSpacing: "4px", background: "transparent",
                color: "#8C8478", border: "1px solid rgba(140,132,120,0.3)",
                cursor: "pointer", fontFamily: "'Noto Serif JP', serif",
              }}
            >
              見送る
            </button>
          </div>
        </div>
      );
    }

    // 告発
    if (phase === "accuse" && isMyTurn) {
      return (
        <div style={{ maxWidth: "360px", width: "100%", margin: "0 auto" }}>
          <p style={{
            textAlign: "center", fontSize: "13px", marginBottom: "10px",
            letterSpacing: "4px", color: "#C9A96E",
            fontFamily: "'Noto Serif JP', serif",
          }}>
            犯人は誰だ
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => onSend({ type: "accuse", suspect_idx: i })}
                style={{
                  flex: 1, padding: "12px 0", fontSize: "20px", fontWeight: 700,
                  background: "#5B7553", color: "#F5F0E1", cursor: "pointer",
                  fontFamily: "'Zen Antique', serif", transition: "all 0.15s",
                }}
              >
                {SUSPECT_KANJI[i]}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (phase === "accuse" && !isMyTurn) {
      return (
        <p style={{ textAlign: "center", fontSize: "13px", letterSpacing: "3px", color: "#8C8478", fontFamily: "'Noto Serif JP', serif" }}>
          {players[currentTurn]?.name} が告発中…
        </p>
      );
    }

    // 結果表示
    if (phase === "reveal") {
      return (
        <button
          onClick={() => onSend({ type: "resolve" })}
          style={{
            width: "100%", maxWidth: "360px", margin: "0 auto", display: "block",
            padding: "14px 0", fontSize: "16px",
            letterSpacing: "4px", fontWeight: 700,
            background: "#F5F0E1", color: "#1a1a1a", cursor: "pointer",
            fontFamily: "'Noto Serif JP', serif",
          }}
        >
          真相を見る
        </button>
      );
    }

    // ラウンド結果
    if ((phase === "round_end" || phase === "game_over") && roundResult) {
      return (
        <div style={{ maxWidth: "360px", width: "100%", margin: "0 auto" }}>
          {roundResult.penalties.length > 0 && (
            <div style={{ marginBottom: "10px", textAlign: "center" }}>
              {roundResult.penalties.map((p, i) => (
                <p key={i} style={{ fontSize: "13px", fontWeight: 700, color: "#C41E3A", letterSpacing: "2px" }}>
                  {p.player_name} +{p.count} 偽証
                </p>
              ))}
              <div className="gold-line w-16 mx-auto mt-2" />
            </div>
          )}

          <div style={{ marginBottom: "10px" }}>
            {roundResult.playersScore.map((p, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                fontSize: "13px", padding: "2px 8px",
              }}>
                <span style={{ color: "#F5F0E1", fontWeight: 700, letterSpacing: "2px", fontFamily: "'Noto Serif JP', serif" }}>
                  {p.name}
                </span>
                <span style={{ color: "#8C8478" }}>
                  <span style={{ color: "#5B7553" }}>{p.accusation_chips}</span>
                  {" / "}
                  <span style={{ color: "#C41E3A" }}>{p.liar_chips}</span>
                  {" / "}
                  <span style={{ color: "#F5F0E1", fontWeight: 900 }}>{p.total}</span>
                </span>
              </div>
            ))}
          </div>

          {phase === "game_over" && roundResult.loser && (
            <div style={{
              padding: "10px", marginBottom: "10px", textAlign: "center",
              background: "#C41E3A", color: "#F5F0E1",
            }}>
              <p style={{ fontSize: "18px", fontWeight: 900, letterSpacing: "6px", fontFamily: "'Zen Antique', serif" }}>
                終幕
              </p>
              <p style={{ fontSize: "13px", opacity: 0.8, letterSpacing: "2px" }}>
                {roundResult.loser.name} の負け
              </p>
            </div>
          )}

          {phase === "round_end" && (
            <button
              onClick={() => onSend({ type: "next_round" })}
              style={{
                width: "100%", padding: "12px 0", fontWeight: 700,
                letterSpacing: "4px", background: "#C41E3A",
                color: "#F5F0E1", cursor: "pointer",
                fontFamily: "'Noto Serif JP', serif",
              }}
            >
              次の幕へ
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#15100c" }}>
      {/* 上部情報バー */}
      <div style={{
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{
          padding: "4px 12px",
          background: "rgba(10,8,6,0.85)",
          borderBottom: "1px solid rgba(201,169,110,0.4)",
          color: "#C9A96E",
          fontSize: "12px",
          letterSpacing: "3px",
          fontFamily: "'Noto Serif JP', serif",
        }}>
          発見者：{players[discovererIndex]?.name}
        </div>
        {isMyTurn && (phase === "view_suspects" || phase === "accuse" || phase === "tamper") && (
          <div
            className="animate-pulse-soft"
            style={{
              padding: "4px 12px",
              background: "rgba(196,30,58,0.9)",
              color: "#F5F0E1",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "3px",
              fontFamily: "'Noto Serif JP', serif",
            }}
          >
            あなたの番
          </div>
        )}
      </div>

      {/* 3Dシーン - 上半分〜中央 */}
      <div style={{ flex: "1 1 0%", minHeight: 0, position: "relative" }}>
        <TableScene gameData={gameData} playerId={playerId} />
      </div>

      {/* 下部パネル - アリバイカード + アクション */}
      <div style={{
        flexShrink: 0,
        padding: "12px 16px 16px",
        background: "rgba(10,8,6,0.95)",
        borderTop: "1px solid rgba(201,169,110,0.25)",
      }}>
        {renderBottomPanel()}
      </div>
    </div>
  );
}

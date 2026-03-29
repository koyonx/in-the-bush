import { useState } from "react";
import type { PlayerInfo } from "../types";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;

const PLAYER_MARKS = ["壱", "弐", "参", "肆", "伍", "陸", "漆", "捌", "玖", "拾"];

interface Props {
  roomId: string;
  players: PlayerInfo[];
  isHost: boolean;
  onStart: (tamperEnabled: boolean) => void;
}

export function WaitingRoom({ roomId, players, isHost, onStart }: Props) {
  const canStart = players.length >= MIN_PLAYERS;
  const [tamperEnabled, setTamperEnabled] = useState(true);

  return (
    <div
      className="flex-1 flex items-center justify-center p-6"
      style={{ background: "radial-gradient(ellipse at center, #2a2420 0%, #1a1a1a 70%)" }}
    >
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* 部屋番号 */}
        <div
          className="p-6 mb-8 text-center"
          style={{ border: "1px solid rgba(201,169,110,0.4)", background: "rgba(201,169,110,0.05)" }}
        >
          <p style={{ color: "#8C8478", fontSize: "12px", letterSpacing: "0.5em", marginBottom: "12px" }}>
            部屋番号
          </p>
          <p
            className="font-mono"
            style={{
              fontSize: "56px",
              fontWeight: 900,
              color: "#C9A96E",
              letterSpacing: "0.5em",
              lineHeight: 1,
              textShadow: "0 0 30px rgba(201,169,110,0.3)",
            }}
          >
            {roomId}
          </p>
          <div className="gold-line w-20 mx-auto mt-4 mb-2" />
          <p style={{ color: "#8C8478", fontSize: "12px", letterSpacing: "0.15em" }}>
            この番号を共有してください
          </p>
        </div>

        {/* 参加者一覧 */}
        <div className="mb-6">
          <p style={{ color: "#8C8478", fontSize: "12px", letterSpacing: "0.3em", marginBottom: "12px", paddingLeft: "4px" }}>
            参加者 ({players.length}/{MAX_PLAYERS})
          </p>
          <div className="space-y-2">
            {players.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3 animate-fade-in-up stagger-${i + 1}`}
                style={{ background: "rgba(245,240,225,0.03)", border: "1px solid rgba(140,132,120,0.15)" }}
              >
                <span
                  className="w-8 h-8 flex items-center justify-center text-sm"
                  style={{ color: "#C9A96E", border: "1px solid rgba(201,169,110,0.3)", fontFamily: "'Zen Antique', serif" }}
                >
                  {PLAYER_MARKS[i]}
                </span>
                <span className="flex-1 tracking-wider text-sm" style={{ color: "#F5F0E1" }}>
                  {p.name}
                </span>
                {i === 0 && (
                  <span style={{
                    fontSize: "11px", color: "#C41E3A",
                    border: "1px solid rgba(196,30,58,0.4)",
                    padding: "1px 8px", letterSpacing: "3px",
                  }}>
                    主
                  </span>
                )}
              </div>
            ))}
          </div>
          {players.length < MAX_PLAYERS && (
            <div className="flex items-center justify-center gap-2 mt-4 animate-pulse-soft">
              <span style={{ width: "6px", height: "6px", background: "#C9A96E", borderRadius: "50%" }} />
              <p style={{ color: "#8C8478", fontSize: "12px", letterSpacing: "3px" }}>
                参加を待っています
              </p>
            </div>
          )}
        </div>

        {/* ルール設定（ホストのみ） */}
        {isHost && (
          <div
            className="mb-6"
            style={{
              padding: "12px 16px",
              border: "1px solid rgba(201,169,110,0.2)",
              background: "rgba(201,169,110,0.03)",
            }}
          >
            <p style={{ color: "#8C8478", fontSize: "11px", letterSpacing: "3px", marginBottom: "10px" }}>
              ルール設定
            </p>
            <button
              onClick={() => setTamperEnabled(!tamperEnabled)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Noto Serif JP', serif",
              }}
            >
              <span style={{ color: "#F5F0E1", fontSize: "13px", letterSpacing: "2px" }}>
                すり替えルール
              </span>
              <span style={{
                padding: "3px 12px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "2px",
                background: tamperEnabled ? "rgba(196,30,58,0.15)" : "rgba(140,132,120,0.15)",
                color: tamperEnabled ? "#C41E3A" : "#8C8478",
                border: tamperEnabled ? "1px solid rgba(196,30,58,0.3)" : "1px solid rgba(140,132,120,0.2)",
                transition: "all 0.2s",
              }}>
                {tamperEnabled ? "有効" : "無効"}
              </span>
            </button>
            <p style={{ color: "#6B6058", fontSize: "10px", letterSpacing: "1px", marginTop: "4px" }}>
              発見者が容疑者と被害者を入れ替えられるルール
            </p>
          </div>
        )}

        {/* 開始ボタン */}
        {isHost && (
          <button
            onClick={() => onStart(tamperEnabled)}
            disabled={!canStart}
            style={{
              width: "100%",
              padding: "16px 0",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "6px",
              background: canStart ? "#C41E3A" : "#3D3530",
              color: canStart ? "#F5F0E1" : "#8C8478",
              border: "none",
              cursor: canStart ? "pointer" : "default",
              fontFamily: "'Noto Serif JP', serif",
              transition: "all 0.2s",
            }}
          >
            {!canStart ? `あと${MIN_PLAYERS - players.length}人必要` : "開幕"}
          </button>
        )}
        {!isHost && (
          <div className="text-center py-3">
            <p className="animate-pulse-soft" style={{ color: "#8C8478", fontSize: "13px", letterSpacing: "3px" }}>
              主の開始を待っています
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

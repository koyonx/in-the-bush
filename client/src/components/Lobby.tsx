import { useState } from "react";
import type { ClientMessage } from "../types";

interface Props {
  onSend: (msg: ClientMessage) => void;
}

export function Lobby({ onSend }: Props) {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [mode, setMode] = useState<"select" | "create" | "join">("select");

  const handleCreate = () => {
    if (!name.trim()) return;
    onSend({ type: "create_room", name: name.trim() });
  };

  const handleJoin = () => {
    if (!name.trim() || !roomId.trim()) return;
    onSend({ type: "join_room", room_id: roomId.trim(), name: name.trim() });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6" style={{
      background: "radial-gradient(ellipse at center, #2a2420 0%, #1a1a1a 70%)",
    }}>
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* タイトル */}
        <div className="text-center mb-12">
          <h1
            className="text-6xl font-black tracking-[0.3em] mb-3 animate-brush-in"
            style={{
              fontFamily: "'Zen Antique', 'Noto Serif JP', serif",
              color: "var(--washi)",
              textShadow: "0 0 40px rgba(201,169,110,0.3)",
            }}
          >
            藪の中
          </h1>
          <div className="gold-line w-32 mx-auto mb-3" />
          <p className="text-[var(--hai)] text-xs tracking-[0.5em] font-medium">
            芥川龍之介
          </p>
        </div>

        {mode === "select" && (
          <div className="space-y-4 animate-fade-in">
            <input
              type="text"
              placeholder="名を名乗れ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={12}
              className="w-full px-5 py-4 bg-transparent border border-[var(--hai)] rounded-none text-[var(--washi)] placeholder-[var(--hai)] focus:outline-none focus:border-[var(--kin)] text-center text-lg tracking-widest transition-colors"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            />
            <button
              onClick={() => name.trim() && setMode("create")}
              disabled={!name.trim()}
              className="btn-shu w-full py-4 rounded-sm text-lg tracking-widest"
            >
              部屋を立てる
            </button>
            <button
              onClick={() => name.trim() && setMode("join")}
              disabled={!name.trim()}
              className="btn-ghost w-full py-4 rounded-sm text-lg tracking-widest"
            >
              部屋に入る
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="space-y-4 animate-fade-in">
            <div className="border border-[var(--kin)]/30 p-5 text-center">
              <p className="text-[var(--hai)] text-xs tracking-widest mb-2">名前</p>
              <p className="text-[var(--washi)] text-xl tracking-widest" style={{ fontFamily: "'Zen Antique', serif" }}>
                {name}
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="btn-shu w-full py-4 rounded-sm text-lg tracking-widest"
            >
              開始
            </button>
            <button
              onClick={() => setMode("select")}
              className="w-full py-3 text-[var(--hai)] hover:text-[var(--washi)] transition-colors text-sm tracking-widest"
            >
              戻る
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-4 animate-fade-in">
            <div className="border border-[var(--kin)]/30 p-5 text-center">
              <p className="text-[var(--hai)] text-xs tracking-widest mb-2">名前</p>
              <p className="text-[var(--washi)] text-xl tracking-widest" style={{ fontFamily: "'Zen Antique', serif" }}>
                {name}
              </p>
            </div>
            <input
              type="text"
              placeholder="0000"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              className="w-full px-5 py-5 bg-transparent border border-[var(--hai)] rounded-none text-[var(--washi)] placeholder-[var(--hai)]/30 focus:outline-none focus:border-[var(--kin)] text-center text-4xl tracking-[1em] font-black font-mono transition-colors"
            />
            <button
              onClick={handleJoin}
              disabled={roomId.length !== 4}
              className="btn-matcha w-full py-4 rounded-sm text-lg tracking-widest"
            >
              入室
            </button>
            <button
              onClick={() => setMode("select")}
              className="w-full py-3 text-[var(--hai)] hover:text-[var(--washi)] transition-colors text-sm tracking-widest"
            >
              戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

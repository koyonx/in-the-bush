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
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-block bg-[var(--oink-dark)] rounded-3xl px-8 py-4 mb-4 animate-scale-in">
            <h1 className="text-4xl font-black text-[var(--oink-cream)] tracking-widest">
              藪の中
            </h1>
          </div>
          <p className="text-[var(--oink-gray)] text-sm font-medium tracking-wider">
            YABU NO NAKA
          </p>
        </div>

        {mode === "select" && (
          <div className="space-y-4 animate-fade-in">
            <input
              type="text"
              placeholder="あなたの名前"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={12}
              className="w-full px-5 py-4 bg-white border-2 border-[var(--oink-light-gray)] rounded-2xl text-[var(--oink-dark)] placeholder-[var(--oink-gray)] focus:outline-none focus:border-[var(--oink-orange)] text-center text-lg font-medium transition-colors"
            />
            <button
              onClick={() => name.trim() && setMode("create")}
              disabled={!name.trim()}
              className="w-full py-4 bg-[var(--oink-orange)] hover:bg-[var(--oink-orange-light)] disabled:bg-[var(--oink-light-gray)] disabled:text-[var(--oink-gray)] text-white rounded-2xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-[var(--oink-orange)]/20"
            >
              ルームを作成
            </button>
            <button
              onClick={() => name.trim() && setMode("join")}
              disabled={!name.trim()}
              className="w-full py-4 bg-white hover:bg-[var(--oink-light-gray)] disabled:opacity-40 text-[var(--oink-dark)] rounded-2xl font-bold text-lg transition-all active:scale-[0.98] border-2 border-[var(--oink-light-gray)]"
            >
              ルームに参加
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-5 text-center border-2 border-[var(--oink-light-gray)]">
              <p className="text-[var(--oink-gray)] text-sm mb-1">プレイヤー名</p>
              <p className="text-[var(--oink-dark)] text-xl font-bold">{name}</p>
            </div>
            <button
              onClick={handleCreate}
              className="w-full py-4 bg-[var(--oink-orange)] hover:bg-[var(--oink-orange-light)] text-white rounded-2xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-[var(--oink-orange)]/20"
            >
              作成する
            </button>
            <button
              onClick={() => setMode("select")}
              className="w-full py-3 text-[var(--oink-gray)] hover:text-[var(--oink-dark)] transition-colors text-sm font-medium"
            >
              戻る
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-5 text-center border-2 border-[var(--oink-light-gray)]">
              <p className="text-[var(--oink-gray)] text-sm mb-1">プレイヤー名</p>
              <p className="text-[var(--oink-dark)] text-xl font-bold">{name}</p>
            </div>
            <input
              type="text"
              placeholder="0000"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              className="w-full px-5 py-5 bg-white border-2 border-[var(--oink-light-gray)] rounded-2xl text-[var(--oink-dark)] placeholder-[var(--oink-light-gray)] focus:outline-none focus:border-[var(--oink-teal)] text-center text-3xl tracking-[0.8em] font-black font-mono transition-colors"
            />
            <button
              onClick={handleJoin}
              disabled={roomId.length !== 4}
              className="w-full py-4 bg-[var(--oink-teal)] hover:bg-[var(--oink-teal-light)] disabled:bg-[var(--oink-light-gray)] disabled:text-[var(--oink-gray)] text-white rounded-2xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-[var(--oink-teal)]/20"
            >
              参加する
            </button>
            <button
              onClick={() => setMode("select")}
              className="w-full py-3 text-[var(--oink-gray)] hover:text-[var(--oink-dark)] transition-colors text-sm font-medium"
            >
              戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-2 text-white tracking-wider">
          藪の中
        </h1>
        <p className="text-center text-gray-400 mb-8 text-sm">
          推理と欺きのカードゲーム
        </p>

        {mode === "select" && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="名前を入力"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={12}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-center text-lg"
            />
            <button
              onClick={() => name.trim() && setMode("create")}
              disabled={!name.trim()}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
            >
              ルームを作成
            </button>
            <button
              onClick={() => name.trim() && setMode("join")}
              disabled={!name.trim()}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              ルームに参加
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="space-y-4">
            <p className="text-center text-gray-300">
              <span className="text-amber-400">{name}</span> としてルームを作成
            </p>
            <button
              onClick={handleCreate}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
            >
              作成する
            </button>
            <button
              onClick={() => setMode("select")}
              className="w-full py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              戻る
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-4">
            <p className="text-center text-gray-300">
              <span className="text-amber-400">{name}</span> として参加
            </p>
            <input
              type="text"
              placeholder="ルームIDを入力 (4桁)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-center text-2xl tracking-[0.5em] font-mono"
            />
            <button
              onClick={handleJoin}
              disabled={roomId.length !== 4}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
            >
              参加する
            </button>
            <button
              onClick={() => setMode("select")}
              className="w-full py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

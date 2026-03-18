import type { PlayerInfo } from "../types";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;

interface Props {
  roomId: string;
  players: PlayerInfo[];
  isHost: boolean;
  onStart: () => void;
}

export function WaitingRoom({ roomId, players, isHost, onStart }: Props) {
  const canStart = players.length >= MIN_PLAYERS;

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-2 text-white">
          待機中
        </h2>

        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">ルームID</p>
          <p className="text-4xl font-mono font-bold text-amber-400 tracking-[0.5em] text-center">
            {roomId}
          </p>
          <p className="text-gray-500 text-xs mt-2 text-center">
            このIDを他のプレイヤーに共有してください
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-3">
            プレイヤー ({players.length}/{MAX_PLAYERS})
          </p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {players.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2 bg-gray-700/50 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-amber-600/30 flex items-center justify-center text-amber-400 text-sm font-bold">
                  {i + 1}
                </div>
                <span className="text-white">{p.name}</span>
                {i === 0 && (
                  <span className="ml-auto text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                    ホスト
                  </span>
                )}
              </div>
            ))}
          </div>
          {players.length < MAX_PLAYERS && (
            <p className="text-gray-500 text-xs mt-2 text-center">
              あと{MAX_PLAYERS - players.length}人まで参加可能
            </p>
          )}
        </div>

        {isHost && (
          <button
            onClick={onStart}
            disabled={!canStart}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            {!canStart
              ? `あと${MIN_PLAYERS - players.length}人必要です`
              : `ゲーム開始 (${players.length}人)`}
          </button>
        )}
        {!isHost && (
          <p className="text-center text-gray-400 text-sm">
            ホストがゲームを開始するのを待っています...
          </p>
        )}
      </div>
    </div>
  );
}

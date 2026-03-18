import type { PlayerInfo } from "../types";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;

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
  roomId: string;
  players: PlayerInfo[];
  isHost: boolean;
  onStart: () => void;
}

export function WaitingRoom({ roomId, players, isHost, onStart }: Props) {
  const canStart = players.length >= MIN_PLAYERS;

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Room ID */}
        <div className="bg-white rounded-3xl p-6 mb-6 text-center shadow-sm border-2 border-[var(--oink-light-gray)]">
          <p className="text-[var(--oink-gray)] text-xs font-medium tracking-wider uppercase mb-2">Room ID</p>
          <p className="text-5xl font-black text-[var(--oink-dark)] tracking-[0.4em] font-mono">
            {roomId}
          </p>
          <p className="text-[var(--oink-gray)] text-xs mt-3">
            このIDを共有してください
          </p>
        </div>

        {/* Players */}
        <div className="mb-6">
          <p className="text-[var(--oink-gray)] text-xs font-medium tracking-wider uppercase mb-3 px-1">
            Players ({players.length}/{MAX_PLAYERS})
          </p>
          <div className="space-y-2">
            {players.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border-2 border-[var(--oink-light-gray)] animate-fade-in-up stagger-${i + 1}`}
              >
                <div className={`w-9 h-9 rounded-full ${PLAYER_COLORS[i % PLAYER_COLORS.length]} flex items-center justify-center text-white text-sm font-black shadow-sm`}>
                  {(p.name[0] || "?").toUpperCase()}
                </div>
                <span className="text-[var(--oink-dark)] font-bold flex-1">{p.name}</span>
                {i === 0 && (
                  <span className="text-xs text-[var(--oink-orange)] bg-[var(--oink-orange)]/10 px-2.5 py-1 rounded-full font-bold">
                    HOST
                  </span>
                )}
              </div>
            ))}
          </div>
          {players.length < MAX_PLAYERS && (
            <div className="flex items-center justify-center gap-2 mt-3 animate-pulse-soft">
              <div className="w-2 h-2 rounded-full bg-[var(--oink-teal)]" />
              <p className="text-[var(--oink-gray)] text-xs font-medium">
                参加を待っています...
              </p>
            </div>
          )}
        </div>

        {/* Start button */}
        {isHost && (
          <button
            onClick={onStart}
            disabled={!canStart}
            className="w-full py-4 bg-[var(--oink-orange)] hover:bg-[var(--oink-orange-light)] disabled:bg-[var(--oink-light-gray)] disabled:text-[var(--oink-gray)] text-white rounded-2xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-[var(--oink-orange)]/20 disabled:shadow-none"
          >
            {!canStart
              ? `あと${MIN_PLAYERS - players.length}人必要`
              : `ゲーム開始`}
          </button>
        )}
        {!isHost && (
          <div className="text-center py-3">
            <p className="text-[var(--oink-gray)] text-sm font-medium">
              ホストの開始を待っています
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

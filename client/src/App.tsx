import { useCallback, useState } from "react";
import { useWebSocket } from "./useWebSocket";
import { Lobby } from "./components/Lobby";
import { WaitingRoom } from "./components/WaitingRoom";
import { GameBoard } from "./components/GameBoard";
import type {
  CardInfo,
  ClientMessage,
  PlayerInfo,
  PlayerScoreInfo,
  PenaltyInfo,
  ServerMessage,
} from "./types";

type Screen = "lobby" | "waiting" | "game";

export interface GameData {
  players: PlayerInfo[];
  discovererIndex: number;
  currentTurn: number;
  alibiCards: { own: CardInfo; received: CardInfo } | null;
  viewedSuspects: { cards: [CardInfo, CardInfo]; indices: [number, number] } | null;
  phase: "alibi" | "view_suspects" | "tamper" | "accuse" | "waiting" | "reveal" | "round_end" | "game_over";
  isDiscoverer: boolean;
  isMyTurn: boolean;
  accusationStacks: string[][];
  roundResult: {
    murdererIdx: number;
    suspects: CardInfo[];
    victim: CardInfo;
    penalties: PenaltyInfo[];
    loser: PlayerInfo | null;
    playersScore: PlayerScoreInfo[];
  } | null;
  waitingAction: { action: string; playerName: string } | null;
}

function App() {
  const [screen, setScreen] = useState<Screen>("lobby");
  const [playerId, setPlayerId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState("");
  const [gameData, setGameData] = useState<GameData | null>(null);

  const onMessage = useCallback(
    (msg: ServerMessage) => {
      setError("");
      switch (msg.type) {
        case "room_created":
          setPlayerId(msg.player_id);
          setRoomId(msg.room_id);
          setIsHost(true);
          setPlayers([]);
          setScreen("waiting");
          break;

        case "room_joined":
          setPlayerId(msg.player_id);
          setRoomId(msg.room_id);
          setPlayers(msg.players);
          setScreen("waiting");
          break;

        case "player_joined":
          setPlayers(msg.players);
          break;

        case "player_left":
          setPlayers(msg.players);
          break;

        case "game_started":
          setPlayers(msg.players);
          setGameData({
            players: msg.players,
            discovererIndex: msg.discoverer_index,
            currentTurn: msg.discoverer_index,
            alibiCards: null,
            viewedSuspects: null,
            phase: "alibi",
            isDiscoverer: false,
            isMyTurn: false,
            accusationStacks: [[], [], []],
            roundResult: null,
            waitingAction: null,
          });
          setScreen("game");
          break;

        case "alibi_cards":
          setGameData((prev) => {
            if (!prev) return prev;
            const myIdx = prev.players.findIndex((p) => p.id === playerId);
            const isDisc = myIdx === prev.discovererIndex;
            return {
              ...prev,
              alibiCards: { own: msg.own_card, received: msg.received_card },
              isDiscoverer: isDisc,
            };
          });
          break;

        case "accusation_phase":
          setGameData((prev) => {
            if (!prev) return prev;
            const myIdx = prev.players.findIndex((p) => p.id === playerId);
            return {
              ...prev,
              phase: "view_suspects",
              currentTurn: msg.current_turn,
              isMyTurn: myIdx === msg.current_turn,
              isDiscoverer: msg.is_discoverer && myIdx === msg.current_turn,
            };
          });
          break;

        case "suspects_viewed":
          setGameData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              viewedSuspects: { cards: msg.cards, indices: msg.indices },
              phase: prev.isDiscoverer ? "tamper" : "accuse",
            };
          });
          break;

        case "waiting_for_action":
          setGameData((prev) => {
            if (!prev) return prev;
            const myIdx = prev.players.findIndex((p) => p.id === playerId);
            return {
              ...prev,
              phase: "accuse",
              isMyTurn: myIdx === prev.currentTurn,
              waitingAction: {
                action: msg.action,
                playerName: msg.current_player,
              },
            };
          });
          break;

        case "accusation_made": {
          setGameData((prev) => {
            if (!prev) return prev;
            const newStacks = [...prev.accusationStacks];
            newStacks[msg.suspect_idx] = [
              ...newStacks[msg.suspect_idx],
              msg.player_name,
            ];
            const myIdx = prev.players.findIndex((p) => p.id === playerId);
            if (msg.all_done) {
              return {
                ...prev,
                accusationStacks: newStacks,
                phase: "reveal",
                currentTurn: msg.current_turn,
                isMyTurn: false,
              };
            }
            return {
              ...prev,
              accusationStacks: newStacks,
              currentTurn: msg.current_turn,
              isMyTurn: myIdx === msg.current_turn,
              viewedSuspects: myIdx === msg.current_turn ? null : prev.viewedSuspects,
              phase: myIdx === msg.current_turn ? "view_suspects" : prev.phase,
            };
          });
          break;
        }

        case "round_result":
          setGameData((prev) => {
            if (!prev) return prev;
            const isGameOver = msg.loser !== null;
            return {
              ...prev,
              phase: isGameOver ? "game_over" : "round_end",
              roundResult: {
                murdererIdx: msg.murderer_idx,
                suspects: msg.suspects,
                victim: msg.victim,
                penalties: msg.penalties,
                loser: msg.loser,
                playersScore: msg.players,
              },
            };
          });
          break;

        case "error":
          setError(msg.message);
          break;
      }
    },
    [playerId]
  );

  const { send, connected } = useWebSocket(onMessage);

  const sendMessage = useCallback(
    (msg: ClientMessage) => {
      send(msg);
    },
    [send]
  );

  return (
    <div className="min-h-svh flex flex-col">
      {!connected && (
        <div className="bg-red-900/80 text-white text-center py-2 text-sm">
          サーバーに接続中...
        </div>
      )}
      {error && (
        <div className="bg-red-800/80 text-white text-center py-2 text-sm">
          {error}
        </div>
      )}

      {screen === "lobby" && <Lobby onSend={sendMessage} />}
      {screen === "waiting" && (
        <WaitingRoom
          roomId={roomId}
          players={players}
          isHost={isHost}
          onStart={() => sendMessage({ type: "start_game" })}
        />
      )}
      {screen === "game" && gameData && (
        <GameBoard
          gameData={gameData}
          playerId={playerId}
          onSend={sendMessage}
        />
      )}
    </div>
  );
}

export default App;

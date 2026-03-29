export interface CardInfo {
  card_type: "number" | "blank";
  value: number | null;
}

export interface PlayerInfo {
  id: string;
  name: string;
}

export interface PlayerScoreInfo {
  name: string;
  accusation_chips: number;
  liar_chips: number;
  total: number;
}

export interface PenaltyInfo {
  player_name: string;
  count: number;
}

// Server -> Client messages
export type ServerMessage =
  | { type: "room_created"; room_id: string; player_id: string }
  | { type: "room_joined"; room_id: string; player_id: string; players: PlayerInfo[] }
  | { type: "player_joined"; players: PlayerInfo[] }
  | { type: "player_left"; players: PlayerInfo[]; player_name: string }
  | { type: "game_started"; discoverer_index: number; players: PlayerInfo[]; tamper_enabled: boolean }
  | { type: "alibi_cards"; own_card: CardInfo; received_card: CardInfo | null }
  | { type: "accusation_phase"; current_turn: number; is_discoverer: boolean }
  | { type: "suspects_viewed"; cards: [CardInfo, CardInfo]; indices: [number, number] }
  | { type: "waiting_for_action"; action: string; current_player: string }
  | {
      type: "accusation_made";
      player_name: string;
      suspect_idx: number;
      current_turn: number;
      all_done: boolean;
    }
  | {
      type: "round_result";
      murderer_idx: number;
      suspects: CardInfo[];
      victim: CardInfo;
      penalties: PenaltyInfo[];
      loser: PlayerInfo | null;
      players: PlayerScoreInfo[];
    }
  | { type: "error"; message: string };

// Client -> Server messages
export type ClientMessage =
  | { type: "create_room"; name: string }
  | { type: "join_room"; room_id: string; name: string }
  | { type: "start_game"; tamper_enabled: boolean }
  | { type: "pass_alibi" }
  | { type: "view_suspects"; indices: [number, number] }
  | { type: "tamper"; suspect_idx: number }
  | { type: "skip_tamper" }
  | { type: "accuse"; suspect_idx: number }
  | { type: "resolve" }
  | { type: "next_round" };

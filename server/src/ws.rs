use axum::extract::ws::{Message, WebSocket};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

use crate::game::Phase;
use crate::room::Player;
use crate::SharedState;

/// プレイヤー名の最大バイト長
const MAX_NAME_LEN: usize = 48;

/// プレイヤー名のバリデーション
fn validate_name(name: &str) -> Result<String, String> {
    let trimmed = name.trim().to_string();
    if trimmed.is_empty() {
        return Err("名前を入力してください".to_string());
    }
    if trimmed.len() > MAX_NAME_LEN {
        return Err("名前が長すぎます".to_string());
    }
    Ok(trimmed)
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum ClientMessage {
    #[serde(rename = "create_room")]
    CreateRoom { name: String },
    #[serde(rename = "join_room")]
    JoinRoom { room_id: String, name: String },
    #[serde(rename = "start_game")]
    StartGame,
    #[serde(rename = "pass_alibi")]
    PassAlibi,
    #[serde(rename = "view_suspects")]
    ViewSuspects { indices: [usize; 2] },
    #[serde(rename = "tamper")]
    Tamper { suspect_idx: usize },
    #[serde(rename = "skip_tamper")]
    SkipTamper,
    #[serde(rename = "accuse")]
    Accuse { suspect_idx: usize },
    #[serde(rename = "resolve")]
    Resolve,
    #[serde(rename = "next_round")]
    NextRound,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
pub enum ServerMessage {
    #[serde(rename = "room_created")]
    RoomCreated { room_id: String, player_id: String },
    #[serde(rename = "room_joined")]
    RoomJoined {
        room_id: String,
        player_id: String,
        players: Vec<PlayerInfo>,
    },
    #[serde(rename = "player_joined")]
    PlayerJoined { players: Vec<PlayerInfo> },
    #[serde(rename = "player_left")]
    PlayerLeft { players: Vec<PlayerInfo>, player_name: String },
    #[serde(rename = "game_started")]
    GameStarted {
        discoverer_index: usize,
        players: Vec<PlayerInfo>,
    },
    #[serde(rename = "alibi_cards")]
    AlibiCards {
        own_card: CardInfo,
        received_card: Option<CardInfo>,
    },
    #[serde(rename = "accusation_phase")]
    AccusationPhase {
        current_turn: usize,
        is_discoverer: bool,
    },
    #[serde(rename = "suspects_viewed")]
    SuspectsViewed {
        cards: [CardInfo; 2],
        indices: [usize; 2],
    },
    #[serde(rename = "waiting_for_action")]
    WaitingForAction {
        action: String,
        current_player: String,
    },
    #[serde(rename = "accusation_made")]
    AccusationMade {
        player_name: String,
        suspect_idx: usize,
        current_turn: usize,
        all_done: bool,
    },
    #[serde(rename = "round_result")]
    RoundResult {
        murderer_idx: usize,
        suspects: Vec<CardInfo>,
        victim: CardInfo,
        penalties: Vec<PenaltyInfo>,
        loser: Option<PlayerInfo>,
        players: Vec<PlayerScoreInfo>,
    },
    #[serde(rename = "error")]
    Error { message: String },
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CardInfo {
    pub card_type: String, // "number" or "blank"
    pub value: Option<u8>,
}

#[derive(Debug, Serialize, Clone)]
pub struct PlayerInfo {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct PenaltyInfo {
    pub player_name: String,
    pub count: u8,
}

#[derive(Debug, Serialize)]
pub struct PlayerScoreInfo {
    pub name: String,
    pub accusation_chips: u8,
    pub liar_chips: u8,
    pub total: u8,
}

impl From<crate::game::Card> for CardInfo {
    fn from(card: crate::game::Card) -> Self {
        match card {
            crate::game::Card::Number(n) => CardInfo {
                card_type: "number".to_string(),
                value: Some(n),
            },
            crate::game::Card::Blank => CardInfo {
                card_type: "blank".to_string(),
                value: None,
            },
        }
    }
}

/// エラーメッセージを送信するヘルパー
fn send_error(tx: &mpsc::UnboundedSender<String>, message: String) {
    let err = ServerMessage::Error { message };
    if let Ok(json) = serde_json::to_string(&err) {
        let _ = tx.send(json);
    }
}

/// ゲーム開始/新ラウンド時のブロードキャスト用データを収集するヘルパー
fn collect_round_start_messages(
    room: &crate::room::Room,
) -> Option<(String, Vec<(String, String)>)> {
    let game = room.game.as_ref()?;
    let players: Vec<PlayerInfo> = room
        .players
        .iter()
        .map(|p| PlayerInfo {
            id: p.id.clone(),
            name: p.name.clone(),
        })
        .collect();

    let start_msg = ServerMessage::GameStarted {
        discoverer_index: game.discoverer_index,
        players,
    };
    let start_str = serde_json::to_string(&start_msg).ok()?;

    let n = game.players.len();
    let mut alibi_msgs: Vec<(String, String)> = Vec::new();
    for i in 0..n {
        let own_card = game.alibi_cards[i].into();
        // 2人プレイ時はアリバイ渡しなし
        let received_card = if n > 2 {
            Some(game.alibi_cards[(i + 1) % n].into())
        } else {
            None
        };
        let alibi_msg = ServerMessage::AlibiCards {
            own_card,
            received_card,
        };
        if let Ok(json) = serde_json::to_string(&alibi_msg) {
            alibi_msgs.push((game.players[i].id.clone(), json));
        }
    }
    Some((start_str, alibi_msgs))
}

pub async fn handle_socket(socket: WebSocket, state: SharedState) {
    let (mut ws_sender, mut ws_receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();

    let player_id = uuid::Uuid::new_v4().to_string();
    let player_id_clone = player_id.clone();

    // メッセージ送信タスク
    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if ws_sender.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });

    let mut room_id: Option<String> = None;

    // メッセージ受信ループ
    while let Some(Ok(msg)) = ws_receiver.next().await {
        if let Message::Text(text) = msg {
            let text_str: &str = &text;
            match serde_json::from_str::<ClientMessage>(text_str) {
                Ok(client_msg) => {
                    handle_message(&state, &player_id, &tx, &mut room_id, client_msg).await;
                }
                Err(e) => {
                    send_error(&tx, format!("無効なメッセージ: {}", e));
                }
            }
        }
    }

    // 切断時のクリーンアップ
    if let Some(rid) = &room_id {
        let mut state = state.write().await;
        let should_remove = if let Some(room) = state.get_room_mut(rid) {
            let player_name = room
                .players
                .iter()
                .find(|p| p.id == player_id_clone)
                .map(|p| p.name.clone())
                .unwrap_or_default();
            room.remove_player(&player_id_clone);
            if room.players.is_empty() {
                true
            } else {
                let players: Vec<PlayerInfo> = room
                    .players
                    .iter()
                    .map(|p| PlayerInfo {
                        id: p.id.clone(),
                        name: p.name.clone(),
                    })
                    .collect();
                let msg = ServerMessage::PlayerLeft {
                    players,
                    player_name,
                };
                if let Ok(json) = serde_json::to_string(&msg) {
                    room.broadcast(&json);
                }
                false
            }
        } else {
            false
        };
        if should_remove {
            state.remove_room(rid);
        }
    }

    send_task.abort();
}

async fn handle_message(
    state: &SharedState,
    player_id: &str,
    tx: &mpsc::UnboundedSender<String>,
    room_id: &mut Option<String>,
    msg: ClientMessage,
) {
    match msg {
        ClientMessage::CreateRoom { name } => {
            let name = match validate_name(&name) {
                Ok(n) => n,
                Err(e) => { send_error(tx, e); return; }
            };

            let mut state = state.write().await;
            let player = Player {
                id: player_id.to_string(),
                name,
                tx: tx.clone(),
            };
            match state.create_room(player) {
                Ok(rid) => {
                    *room_id = Some(rid.clone());
                    let response = ServerMessage::RoomCreated {
                        room_id: rid,
                        player_id: player_id.to_string(),
                    };
                    if let Ok(json) = serde_json::to_string(&response) {
                        let _ = tx.send(json);
                    }
                }
                Err(e) => { send_error(tx, e); }
            }
        }

        ClientMessage::JoinRoom {
            room_id: rid,
            name,
        } => {
            let name = match validate_name(&name) {
                Ok(n) => n,
                Err(e) => { send_error(tx, e); return; }
            };

            let mut state = state.write().await;
            if let Some(room) = state.get_room_mut(&rid) {
                let player = Player {
                    id: player_id.to_string(),
                    name,
                    tx: tx.clone(),
                };
                match room.add_player(player) {
                    Ok(()) => {
                        *room_id = Some(rid.clone());
                        let players: Vec<PlayerInfo> = room
                            .players
                            .iter()
                            .map(|p| PlayerInfo {
                                id: p.id.clone(),
                                name: p.name.clone(),
                            })
                            .collect();

                        let response = ServerMessage::RoomJoined {
                            room_id: rid,
                            player_id: player_id.to_string(),
                            players: players.clone(),
                        };
                        if let Ok(json) = serde_json::to_string(&response) {
                            let _ = tx.send(json);
                        }

                        let notify = ServerMessage::PlayerJoined { players };
                        if let Ok(json) = serde_json::to_string(&notify) {
                            room.broadcast(&json);
                        }
                    }
                    Err(e) => { send_error(tx, e); }
                }
            } else {
                send_error(tx, "ルームが見つかりません".to_string());
            }
        }

        ClientMessage::StartGame => {
            let mut state = state.write().await;
            if let Some(rid) = room_id {
                if let Some(room) = state.get_room_mut(rid) {
                    if room.host_id != player_id {
                        send_error(tx, "ホストのみがゲームを開始できます".to_string());
                        return;
                    }
                    match room.start_game() {
                        Ok(()) => {
                            if let Some((start_str, alibi_msgs)) = collect_round_start_messages(room) {
                                room.broadcast(&start_str);
                                for (pid, msg) in &alibi_msgs {
                                    room.send_to(pid, msg);
                                }
                            }
                        }
                        Err(e) => { send_error(tx, e); }
                    }
                }
            }
        }

        ClientMessage::PassAlibi => {
            let mut state = state.write().await;
            if let Some(rid) = room_id {
                if let Some(room) = state.get_room_mut(rid) {
                    if let Some(game) = &mut room.game {
                        match game.pass_alibi_cards() {
                            Ok(()) => {
                                let phase_msg = ServerMessage::AccusationPhase {
                                    current_turn: game.current_turn,
                                    is_discoverer: true,
                                };
                                if let Ok(json) = serde_json::to_string(&phase_msg) {
                                    room.broadcast(&json);
                                }
                            }
                            Err(e) => { send_error(tx, e); }
                        }
                    }
                }
            }
        }

        ClientMessage::ViewSuspects { indices } => {
            let mut state = state.write().await;
            if let Some(rid) = room_id {
                if let Some(room) = state.get_room_mut(rid) {
                    if let Some(game) = &mut room.game {
                        match game.view_suspects(player_id, indices) {
                            Ok(cards) => {
                                let response = ServerMessage::SuspectsViewed {
                                    cards: [cards[0].into(), cards[1].into()],
                                    indices,
                                };
                                if let Ok(json) = serde_json::to_string(&response) {
                                    room.send_to(player_id, &json);
                                }
                            }
                            Err(e) => { send_error(tx, e); }
                        }
                    }
                }
            }
        }

        ClientMessage::Tamper { suspect_idx } => {
            let mut state = state.write().await;
            if let Some(rid) = room_id {
                if let Some(room) = state.get_room_mut(rid) {
                    if let Some(game) = &mut room.game {
                        match game.tamper(player_id, suspect_idx) {
                            Ok(()) => {
                                let waiting = ServerMessage::WaitingForAction {
                                    action: "accuse".to_string(),
                                    current_player: game.players[game.current_turn].name.clone(),
                                };
                                if let Ok(json) = serde_json::to_string(&waiting) {
                                    room.broadcast(&json);
                                }
                            }
                            Err(e) => { send_error(tx, e); }
                        }
                    }
                }
            }
        }

        ClientMessage::SkipTamper => {
            let mut state = state.write().await;
            if let Some(rid) = room_id {
                if let Some(room) = state.get_room_mut(rid) {
                    if let Some(game) = &mut room.game {
                        // 発見者のみスキップ可能、告発フェーズのみ
                        if game.phase != Phase::Accusation {
                            send_error(tx, "告発フェーズではありません".to_string());
                            return;
                        }
                        let player_idx = game.players.iter().position(|p| p.id == player_id);
                        if player_idx != Some(game.discoverer_index) {
                            send_error(tx, "発見者のみがすり替えをスキップできます".to_string());
                            return;
                        }
                        if player_idx != Some(game.current_turn) {
                            send_error(tx, "あなたのターンではありません".to_string());
                            return;
                        }

                        let waiting = ServerMessage::WaitingForAction {
                            action: "accuse".to_string(),
                            current_player: game.players[game.current_turn].name.clone(),
                        };
                        if let Ok(json) = serde_json::to_string(&waiting) {
                            room.broadcast(&json);
                        }
                    }
                }
            }
        }

        ClientMessage::Accuse { suspect_idx } => {
            let mut state = state.write().await;
            if let Some(rid) = room_id {
                if let Some(room) = state.get_room_mut(rid) {
                    if let Some(game) = &mut room.game {
                        let player_name = game
                            .players
                            .iter()
                            .find(|p| p.id == player_id)
                            .map(|p| p.name.clone())
                            .unwrap_or_default();

                        match game.accuse(player_id, suspect_idx) {
                            Ok(()) => {
                                let all_done = game.phase == Phase::Reveal;
                                let msg = ServerMessage::AccusationMade {
                                    player_name,
                                    suspect_idx,
                                    current_turn: game.current_turn,
                                    all_done,
                                };
                                if let Ok(json) = serde_json::to_string(&msg) {
                                    room.broadcast(&json);
                                }
                            }
                            Err(e) => { send_error(tx, e); }
                        }
                    }
                }
            }
        }

        ClientMessage::Resolve => {
            let mut state = state.write().await;
            if let Some(rid) = room_id {
                if let Some(room) = state.get_room_mut(rid) {
                    if let Some(game) = &mut room.game {
                        match game.resolve_round() {
                            Ok(result) => {
                                let loser_info = result.loser.as_ref().and_then(|lid| {
                                    game.players.iter().find(|p| p.id == *lid).map(|p| {
                                        PlayerInfo {
                                            id: p.id.clone(),
                                            name: p.name.clone(),
                                        }
                                    })
                                });

                                let players_score: Vec<PlayerScoreInfo> = game
                                    .players
                                    .iter()
                                    .map(|p| PlayerScoreInfo {
                                        name: p.name.clone(),
                                        accusation_chips: p.accusation_chips,
                                        liar_chips: p.liar_chips,
                                        total: p.total_chips(),
                                    })
                                    .collect();

                                let penalties: Vec<PenaltyInfo> = result
                                    .penalties
                                    .iter()
                                    .map(|(pid, count)| {
                                        let name = game
                                            .players
                                            .iter()
                                            .find(|p| p.id == *pid)
                                            .map(|p| p.name.clone())
                                            .unwrap_or_default();
                                        PenaltyInfo {
                                            player_name: name,
                                            count: *count,
                                        }
                                    })
                                    .collect();

                                let msg = ServerMessage::RoundResult {
                                    murderer_idx: result.murderer_idx,
                                    suspects: result.suspects.into_iter().map(|c| c.into()).collect(),
                                    victim: result.victim.into(),
                                    penalties,
                                    loser: loser_info,
                                    players: players_score,
                                };
                                if let Ok(json) = serde_json::to_string(&msg) {
                                    room.broadcast(&json);
                                }
                            }
                            Err(e) => { send_error(tx, e); }
                        }
                    }
                }
            }
        }

        ClientMessage::NextRound => {
            let mut state = state.write().await;
            if let Some(rid) = room_id {
                if let Some(room) = state.get_room_mut(rid) {
                    // next_round のフェーズチェックはゲームロジック側で行う
                    let next_result = room.game.as_mut().and_then(|game| {
                        game.next_round().err()
                    });

                    if let Some(e) = next_result {
                        send_error(tx, e);
                        return;
                    }

                    if let Some((start_str, alibi_msgs)) = collect_round_start_messages(room) {
                        room.broadcast(&start_str);
                        for (pid, msg) in &alibi_msgs {
                            room.send_to(pid, msg);
                        }
                    }
                }
            }
        }
    }
}

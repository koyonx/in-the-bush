use crate::game::GameState;
use rand::Rng;
use std::collections::HashMap;
use tokio::sync::mpsc;

/// WebSocket経由で送信するメッセージ
pub type Tx = mpsc::UnboundedSender<String>;

#[derive(Debug)]
pub struct Player {
    pub id: String,
    pub name: String,
    pub tx: Tx,
}

#[derive(Debug)]
pub struct Room {
    pub id: String,
    pub players: Vec<Player>,
    pub game: Option<GameState>,
    pub host_id: String,
}

impl Room {
    pub fn new(id: String, host: Player) -> Self {
        let host_id = host.id.clone();
        Self {
            id,
            players: vec![host],
            game: None,
            host_id,
        }
    }

    pub fn add_player(&mut self, player: Player) -> Result<(), String> {
        if self.players.len() >= 4 {
            return Err("ルームが満員です".to_string());
        }
        if self.game.is_some() {
            return Err("ゲームが既に開始されています".to_string());
        }
        self.players.push(player);
        Ok(())
    }

    pub fn remove_player(&mut self, player_id: &str) {
        self.players.retain(|p| p.id != player_id);
    }

    pub fn broadcast(&self, message: &str) {
        for player in &self.players {
            let _ = player.tx.send(message.to_string());
        }
    }

    pub fn send_to(&self, player_id: &str, message: &str) {
        if let Some(player) = self.players.iter().find(|p| p.id == player_id) {
            let _ = player.tx.send(message.to_string());
        }
    }

    pub fn start_game(&mut self) -> Result<(), String> {
        if self.players.len() < 3 {
            return Err("3人以上のプレイヤーが必要です".to_string());
        }
        let player_ids: Vec<(String, String)> = self
            .players
            .iter()
            .map(|p| (p.id.clone(), p.name.clone()))
            .collect();
        self.game = Some(GameState::new(player_ids));
        Ok(())
    }
}

pub struct RoomManager {
    pub rooms: HashMap<String, Room>,
}

impl RoomManager {
    pub fn new() -> Self {
        Self {
            rooms: HashMap::new(),
        }
    }

    pub fn create_room(&mut self, host: Player) -> String {
        let room_id = self.generate_room_id();
        let room = Room::new(room_id.clone(), host);
        self.rooms.insert(room_id.clone(), room);
        room_id
    }

    pub fn get_room(&self, room_id: &str) -> Option<&Room> {
        self.rooms.get(room_id)
    }

    pub fn get_room_mut(&mut self, room_id: &str) -> Option<&mut Room> {
        self.rooms.get_mut(room_id)
    }

    pub fn remove_room(&mut self, room_id: &str) {
        self.rooms.remove(room_id);
    }

    fn generate_room_id(&self) -> String {
        let mut rng = rand::thread_rng();
        loop {
            let id: String = (0..4)
                .map(|_| rng.gen_range(0..10).to_string())
                .collect();
            if !self.rooms.contains_key(&id) {
                return id;
            }
        }
    }
}

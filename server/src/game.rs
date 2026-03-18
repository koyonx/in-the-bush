use rand::seq::SliceRandom;
use rand::thread_rng;
use serde::{Deserialize, Serialize};

/// プレイヤー数の範囲
pub const MIN_PLAYERS: usize = 2;
pub const MAX_PLAYERS: usize = 10;

/// カードの種類: 数字カードとブランクカード
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Card {
    Number(u8),
    Blank,
}

impl Card {
    pub fn value(&self) -> Option<u8> {
        match self {
            Card::Number(n) => Some(*n),
            Card::Blank => None,
        }
    }
}

/// ゲームのフェーズ
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Phase {
    Waiting,           // プレイヤー待ち
    CheckAlibi,        // アリバイ確認
    Accusation,        // 告発フェーズ
    Reveal,            // 結果発表
    RoundEnd,          // ラウンド終了
    GameOver,          // ゲーム終了
}

/// 人数に応じた初期告発チップ数
/// 4人基準(5枚)から、人数増加に応じてチップを増やし
/// ゲームが短すぎないようにする
fn initial_chips(num_players: usize) -> u8 {
    match num_players {
        2..=4 => 5,
        5..=6 => 6,
        7..=8 => 7,
        _ => 8, // 9-10人
    }
}

/// 人数に応じたゲーム終了チップ閾値
/// 大人数ではペナルティが集中しやすいため閾値を上げる
fn chip_limit(num_players: usize) -> u8 {
    match num_players {
        2..=4 => 8,
        5..=6 => 10,
        7..=8 => 12,
        _ => 14, // 9-10人
    }
}

/// 各プレイヤーの状態
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerState {
    pub id: String,
    pub name: String,
    pub accusation_chips: u8,    // 残りの告発チップ
    pub liar_chips: u8,          // ライアーチップの数
    pub alibi_cards: Vec<Card>,  // 見たアリバイカード
    pub seen_suspects: Vec<usize>, // 見た容疑者のインデックス
    pub accusation: Option<usize>, // 告発した容疑者のインデックス
}

impl PlayerState {
    pub fn new(id: String, name: String, num_players: usize) -> Self {
        Self {
            id,
            name,
            accusation_chips: initial_chips(num_players),
            liar_chips: 0,
            alibi_cards: Vec::new(),
            seen_suspects: Vec::new(),
            accusation: None,
        }
    }

    pub fn total_chips(&self) -> u8 {
        self.accusation_chips + self.liar_chips
    }
}

/// ゲームの状態
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    pub phase: Phase,
    pub players: Vec<PlayerState>,
    pub suspects: Vec<Card>,          // 3人の容疑者
    pub victim: Card,                 // 被害者
    pub alibi_cards: Vec<Card>,       // プレイヤーに配られたアリバイカード
    pub discoverer_index: usize,      // 発見者のインデックス
    pub current_turn: usize,          // 現在のターンのプレイヤーインデックス
    pub unseen_suspect: Option<usize>, // 発見者が見なかった容疑者
    pub tampered_suspect: Option<usize>, // すり替えられた容疑者
    pub accusation_stacks: Vec<Vec<String>>, // 各容疑者への告発スタック [容疑者idx][player_id]
    pub round: u32,
    pub turns_done: usize,            // 今のフェーズで完了したターン数
    pub alibi_passed: bool,           // アリバイカードが渡し済みかどうか
}

impl GameState {
    pub fn new(player_ids: Vec<(String, String)>) -> Self {
        let num_players = player_ids.len();
        let players: Vec<PlayerState> = player_ids
            .into_iter()
            .map(|(id, name)| PlayerState::new(id, name, num_players))
            .collect();

        let mut state = Self {
            phase: Phase::Waiting,
            players,
            suspects: Vec::new(),
            victim: Card::Blank,
            alibi_cards: Vec::new(),
            discoverer_index: 0,
            current_turn: 0,
            unseen_suspect: None,
            tampered_suspect: None,
            accusation_stacks: vec![Vec::new(); 3],
            round: 0,
            turns_done: 0,
            alibi_passed: false,
        };

        if num_players >= MIN_PLAYERS {
            state.setup_round();
        }

        state
    }

    /// ラウンドのセットアップ
    pub fn setup_round(&mut self) {
        let num_players = self.players.len();
        let mut cards = self.create_deck(num_players);
        let mut rng = thread_rng();
        cards.shuffle(&mut rng);

        // 各プレイヤーにアリバイカードを1枚配る
        self.alibi_cards = Vec::new();
        for player in &mut self.players {
            player.alibi_cards.clear();
            player.seen_suspects.clear();
            player.accusation = None;
        }

        for i in 0..num_players {
            let card = cards.pop().expect("デッキの枚数が不足しています");
            self.alibi_cards.push(card);
            self.players[i].alibi_cards.push(card);
        }

        // 被害者1枚 + 容疑者3枚
        self.victim = cards.pop().expect("デッキの枚数が不足しています");
        self.suspects = cards; // 残り3枚が容疑者
        assert_eq!(self.suspects.len(), 3, "容疑者は常に3人でなければなりません");

        self.unseen_suspect = None;
        self.tampered_suspect = None;
        self.accusation_stacks = vec![Vec::new(); 3];
        self.current_turn = self.discoverer_index;
        self.turns_done = 0;
        self.round += 1;
        self.alibi_passed = false;
        self.phase = Phase::CheckAlibi;
    }

    /// プレイヤー数に応じたデッキ作成
    /// N人 → N + 4枚必要 (Nアリバイ + 1被害者 + 3容疑者)
    /// 数字カード: N + 3枚 + Blank 1枚 = N + 4枚
    ///
    /// | 人数 | 枚数 | 数字範囲     |
    /// |------|------|-------------|
    /// | 2    | 6    | 4-8 + Blank |
    /// | 3    | 7    | 3-8 + Blank |
    /// | 4    | 8    | 2-8 + Blank |
    /// | 5    | 9    | 2-9 + Blank |
    /// | 6    | 10   | 2-10+ Blank |
    /// | ...  | ...  | ...         |
    /// | 10   | 14   | 2-14+ Blank |
    fn create_deck(&self, num_players: usize) -> Vec<Card> {
        let mut cards = Vec::new();
        let num_number_cards = num_players + 3; // Blank を除く数字カードの枚数

        // 4人以下: 上限8固定で下限を上げる (4→2, 3→3, 2→4)
        // 5人以上: 下限2固定で上限を伸ばす
        let (start, end) = if num_players <= 4 {
            let start = (8 + 1) - num_number_cards as u8; // 4人→2, 3人→3, 2人→4
            (start, 8u8)
        } else {
            let end = num_number_cards as u8 + 1; // 5人→9, 6→10, ... 10→14
            (2u8, end)
        };

        for i in start..=end {
            cards.push(Card::Number(i));
        }
        cards.push(Card::Blank);
        cards
    }

    /// アリバイカードを隣のプレイヤーに渡す（右隣）
    /// 2人プレイ時はアリバイ渡しをスキップ（自分のカードのみ確認）
    pub fn pass_alibi_cards(&mut self) -> Result<(), String> {
        if self.phase != Phase::CheckAlibi {
            return Err("アリバイ確認フェーズではありません".to_string());
        }
        if self.alibi_passed {
            return Err("アリバイカードは既に渡されています".to_string());
        }

        let n = self.players.len();
        // 2人プレイ時はアリバイ渡しをスキップ（情報過多を防ぐ）
        if n > 2 {
            for i in 0..n {
                let right_idx = (i + 1) % n;
                let right_card = self.alibi_cards[right_idx];
                self.players[i].alibi_cards.push(right_card);
            }
        }
        self.alibi_passed = true;
        self.phase = Phase::Accusation;
        self.current_turn = self.discoverer_index;
        self.turns_done = 0;
        Ok(())
    }

    /// 容疑者カードを見る（2枚選択）
    pub fn view_suspects(&mut self, player_id: &str, indices: [usize; 2]) -> Result<[Card; 2], String> {
        if self.phase != Phase::Accusation {
            return Err("告発フェーズではありません".to_string());
        }

        // インデックス境界チェック
        if indices[0] >= 3 || indices[1] >= 3 {
            return Err("無効な容疑者インデックスです".to_string());
        }
        if indices[0] == indices[1] {
            return Err("異なる2人の容疑者を選んでください".to_string());
        }

        let player_idx = self.find_player(player_id)?;

        if player_idx != self.current_turn {
            return Err("あなたのターンではありません".to_string());
        }

        // 既に容疑者を見ている場合は拒否
        if !self.players[player_idx].seen_suspects.is_empty() {
            return Err("既に容疑者を確認済みです".to_string());
        }

        // 発見者以外は、前のプレイヤーだけが告発した容疑者を見られない
        if player_idx != self.discoverer_index {
            let prev_idx = if player_idx == 0 {
                self.players.len() - 1
            } else {
                player_idx - 1
            };

            let prev_player_id = self.players[prev_idx].id.clone();
            for &idx in &indices {
                if self.is_exclusively_accused_by(idx, &prev_player_id) {
                    return Err("前のプレイヤーだけが告発した容疑者は見られません".to_string());
                }
            }
        }

        let cards = [self.suspects[indices[0]], self.suspects[indices[1]]];
        let player = &mut self.players[player_idx];
        player.seen_suspects = indices.to_vec();

        // 発見者の場合、見なかったカードを記録
        if player_idx == self.discoverer_index {
            let unseen = (0..3usize).find(|i| !indices.contains(i))
                .expect("3つのインデックスから2つを選んだので必ず1つ残る");
            self.unseen_suspect = Some(unseen);
        }

        Ok(cards)
    }

    /// ある容疑者が特定のプレイヤーだけに告発されているか
    fn is_exclusively_accused_by(&self, suspect_idx: usize, player_id: &str) -> bool {
        if suspect_idx >= self.accusation_stacks.len() {
            return false;
        }
        let stack = &self.accusation_stacks[suspect_idx];
        stack.len() == 1 && stack[0] == player_id
    }

    /// 発見者がすり替えを行う（容疑者と被害者を入れ替え）
    pub fn tamper(&mut self, player_id: &str, suspect_idx: usize) -> Result<(), String> {
        if self.phase != Phase::Accusation {
            return Err("告発フェーズではありません".to_string());
        }
        if suspect_idx >= 3 {
            return Err("無効な容疑者インデックスです".to_string());
        }

        let player_idx = self.find_player(player_id)?;
        if player_idx != self.discoverer_index {
            return Err("発見者のみがすり替えできます".to_string());
        }
        if player_idx != self.current_turn {
            return Err("あなたのターンではありません".to_string());
        }
        if self.tampered_suspect.is_some() {
            return Err("既にすり替え済みです".to_string());
        }
        if !self.players[player_idx].seen_suspects.contains(&suspect_idx) {
            return Err("見た容疑者のみすり替えできます".to_string());
        }

        std::mem::swap(&mut self.suspects[suspect_idx], &mut self.victim);
        self.tampered_suspect = Some(suspect_idx);
        Ok(())
    }

    /// 告発する
    pub fn accuse(&mut self, player_id: &str, suspect_idx: usize) -> Result<(), String> {
        if self.phase != Phase::Accusation {
            return Err("告発フェーズではありません".to_string());
        }
        if suspect_idx >= 3 {
            return Err("無効な容疑者インデックスです".to_string());
        }

        let player_idx = self.find_player(player_id)?;
        if player_idx != self.current_turn {
            return Err("あなたのターンではありません".to_string());
        }
        if self.players[player_idx].accusation_chips == 0 {
            return Err("告発チップがありません".to_string());
        }

        self.players[player_idx].accusation = Some(suspect_idx);
        self.players[player_idx].accusation_chips -= 1;
        self.accusation_stacks[suspect_idx].push(player_id.to_string());
        self.turns_done += 1;

        // 次のプレイヤーへ
        if self.turns_done >= self.players.len() {
            self.phase = Phase::Reveal;
        } else {
            self.current_turn = (self.current_turn + 1) % self.players.len();
        }

        Ok(())
    }

    /// 犯人を判定する
    pub fn determine_murderer(&self) -> usize {
        let has_five = self.suspects.iter().any(|c| c.value() == Some(5));

        let mut candidates: Vec<(usize, u8)> = self
            .suspects
            .iter()
            .enumerate()
            .filter_map(|(i, c)| c.value().map(|v| (i, v)))
            .collect();

        if candidates.is_empty() {
            // ブランクのみの場合（通常のゲームでは発生しない）
            return 0;
        }

        if has_five {
            // 5がある場合: 最小値が犯人
            candidates.sort_by_key(|&(_, v)| v);
        } else {
            // 5がない場合: 最大値が犯人
            candidates.sort_by_key(|&(_, v)| std::cmp::Reverse(v));
        }

        candidates[0].0
    }

    /// ラウンドの結果を解決する
    pub fn resolve_round(&mut self) -> Result<RoundResult, String> {
        if self.phase != Phase::Reveal {
            return Err("結果発表フェーズではありません".to_string());
        }

        let murderer_idx = self.determine_murderer();

        let mut penalties: Vec<(String, u8)> = Vec::new();

        for (suspect_idx, stack) in self.accusation_stacks.iter().enumerate() {
            if suspect_idx == murderer_idx || stack.is_empty() {
                continue;
            }
            // スタックの一番上（最後に告発した人）がペナルティ
            let top_player_id = stack.last().expect("スタックが空でないことは確認済み").clone();
            let penalty_count = stack.len() as u8;

            if let Some(player) = self.players.iter_mut().find(|p| p.id == top_player_id) {
                player.liar_chips += penalty_count;
                penalties.push((top_player_id, penalty_count));
            }
        }

        // ゲーム終了判定
        let loser = self.check_game_over();

        let result = RoundResult {
            murderer_idx,
            suspects: self.suspects.clone(),
            victim: self.victim,
            penalties,
            loser: loser.clone(),
        };

        if loser.is_some() {
            self.phase = Phase::GameOver;
        } else {
            self.phase = Phase::RoundEnd;
        }

        Ok(result)
    }

    /// ゲーム終了チェック
    fn check_game_over(&self) -> Option<String> {
        let limit = chip_limit(self.players.len());
        // 閾値以上のチップを持っているプレイヤー
        for player in &self.players {
            if player.total_chips() >= limit {
                return Some(player.id.clone());
            }
        }
        // 告発チップがすべてなくなったプレイヤー
        for player in &self.players {
            if player.accusation_chips == 0 {
                return Some(player.id.clone());
            }
        }
        None
    }

    /// 次のラウンドへ
    pub fn next_round(&mut self) -> Result<(), String> {
        if self.phase != Phase::RoundEnd {
            return Err("ラウンド終了フェーズではありません".to_string());
        }
        self.discoverer_index = (self.discoverer_index + 1) % self.players.len();
        self.setup_round();
        Ok(())
    }

    fn find_player(&self, player_id: &str) -> Result<usize, String> {
        self.players
            .iter()
            .position(|p| p.id == player_id)
            .ok_or_else(|| "プレイヤーが見つかりません".to_string())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoundResult {
    pub murderer_idx: usize,
    pub suspects: Vec<Card>,
    pub victim: Card,
    pub penalties: Vec<(String, u8)>,
    pub loser: Option<String>,
}

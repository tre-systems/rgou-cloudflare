use js_sys;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Game constants
const PIECES_PER_PLAYER: usize = 7;
const BOARD_SIZE: usize = 20;
const ROSETTE_SQUARES: [u8; 5] = [0, 7, 13, 15, 16];
const PLAYER1_TRACK: [u8; 16] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const PLAYER2_TRACK: [u8; 16] = [16, 17, 18, 19, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// Evaluation constants
const WIN_SCORE: i32 = 10000;
const FINISHED_PIECE_VALUE: i32 = 1000;
const POSITION_WEIGHT: i32 = 15;
const SAFETY_BONUS: i32 = 25;
const BLOCKING_BONUS: i32 = 30;
const ROSETTE_CONTROL_BONUS: i32 = 40;
const ADVANCEMENT_BONUS: i32 = 5;

// Dice probabilities for Royal Game of Ur (4 binary dice)
// 0: 1/16, 1: 4/16, 2: 6/16, 3: 4/16, 4: 1/16
const DICE_PROBABILITIES: [f32; 5] = [1.0 / 16.0, 4.0 / 16.0, 6.0 / 16.0, 4.0 / 16.0, 1.0 / 16.0];

#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
pub enum Player {
    Player1 = 0,
    Player2 = 1,
}

impl Player {
    fn opponent(self) -> Player {
        match self {
            Player::Player1 => Player::Player2,
            Player::Player2 => Player::Player1,
        }
    }
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct PiecePosition {
    pub square: i8,
    pub player: Player,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GameState {
    pub board: Vec<Option<PiecePosition>>,
    pub player1_pieces: Vec<PiecePosition>,
    pub player2_pieces: Vec<PiecePosition>,
    pub current_player: Player,
    pub dice_roll: u8,
}

impl GameState {
    pub fn new() -> Self {
        GameState {
            board: vec![None; BOARD_SIZE],
            player1_pieces: vec![
                PiecePosition {
                    square: -1,
                    player: Player::Player1,
                };
                PIECES_PER_PLAYER
            ],
            player2_pieces: vec![
                PiecePosition {
                    square: -1,
                    player: Player::Player2,
                };
                PIECES_PER_PLAYER
            ],
            current_player: Player::Player1,
            dice_roll: 0,
        }
    }

    fn get_pieces(&self, player: Player) -> &Vec<PiecePosition> {
        match player {
            Player::Player1 => &self.player1_pieces,
            Player::Player2 => &self.player2_pieces,
        }
    }

    fn get_pieces_mut(&mut self, player: Player) -> &mut Vec<PiecePosition> {
        match player {
            Player::Player1 => &mut self.player1_pieces,
            Player::Player2 => &mut self.player2_pieces,
        }
    }

    fn get_player_track(player: Player) -> &'static [u8] {
        match player {
            Player::Player1 => &PLAYER1_TRACK,
            Player::Player2 => &PLAYER2_TRACK,
        }
    }

    fn is_rosette(square: u8) -> bool {
        ROSETTE_SQUARES.contains(&square)
    }

    pub fn get_valid_moves(&self) -> Vec<u8> {
        if self.dice_roll == 0 {
            return vec![];
        }

        let mut valid_moves = Vec::new();
        let current_pieces = self.get_pieces(self.current_player);
        let track = Self::get_player_track(self.current_player);

        for (i, piece) in current_pieces.iter().enumerate() {
            let current_track_pos = if piece.square == -1 {
                -1
            } else {
                track
                    .iter()
                    .position(|&square| square as i8 == piece.square)
                    .map(|pos| pos as i8)
                    .unwrap_or(-1)
            };

            let new_track_pos = current_track_pos + self.dice_roll as i8;

            if new_track_pos >= track.len() as i8 {
                if new_track_pos == track.len() as i8 {
                    valid_moves.push(i as u8);
                }
            } else {
                let new_actual_pos = track[new_track_pos as usize];
                let occupant = self.board[new_actual_pos as usize];

                if occupant.is_none()
                    || (occupant.unwrap().player != self.current_player
                        && !Self::is_rosette(new_actual_pos))
                {
                    valid_moves.push(i as u8);
                }
            }
        }

        valid_moves
    }

    pub fn evaluate(&self) -> i32 {
        let mut score = 0i32;
        let p1_finished = self
            .player1_pieces
            .iter()
            .filter(|p| p.square == 20)
            .count() as i32;
        let p2_finished = self
            .player2_pieces
            .iter()
            .filter(|p| p.square == 20)
            .count() as i32;

        if p1_finished == PIECES_PER_PLAYER as i32 {
            return -WIN_SCORE;
        }
        if p2_finished == PIECES_PER_PLAYER as i32 {
            return WIN_SCORE;
        }

        score += (p2_finished - p1_finished) * FINISHED_PIECE_VALUE;

        let (p1_pos_score, p1_strategic_score) = self.evaluate_player_position(Player::Player1);
        let (p2_pos_score, p2_strategic_score) = self.evaluate_player_position(Player::Player2);

        score += (p2_pos_score - p1_pos_score) * POSITION_WEIGHT / 10;
        score += p2_strategic_score - p1_strategic_score;
        score += self.evaluate_board_control();
        score
    }

    fn evaluate_player_position(&self, player: Player) -> (i32, i32) {
        let pieces = self.get_pieces(player);
        let track = Self::get_player_track(player);
        let (mut position_score, mut strategic_score) = (0i32, 0i32);

        for piece in pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                if let Some(track_pos) = track
                    .iter()
                    .position(|&square| square as i8 == piece.square)
                {
                    position_score += track_pos as i32 + 1;
                    if Self::is_rosette(piece.square as u8) {
                        strategic_score += SAFETY_BONUS;
                    }
                    if track_pos >= 4 && track_pos <= 11 {
                        strategic_score += ADVANCEMENT_BONUS;
                    }
                    if track_pos >= 12 {
                        strategic_score += ADVANCEMENT_BONUS * 2;
                    }
                }
            }
        }
        (position_score, strategic_score)
    }

    pub fn evaluate_board_control(&self) -> i32 {
        let mut control_score = 0i32;
        for &rosette in &ROSETTE_SQUARES {
            if let Some(occupant) = self.board[rosette as usize] {
                control_score += if occupant.player == Player::Player2 {
                    ROSETTE_CONTROL_BONUS
                } else {
                    -ROSETTE_CONTROL_BONUS
                };
            }
        }
        control_score + self.evaluate_blocking_potential()
    }

    fn evaluate_blocking_potential(&self) -> i32 {
        let mut blocking_score = 0i32;
        for p1_piece in &self.player1_pieces {
            if p1_piece.square >= 4 && p1_piece.square <= 14 {
                for p2_piece in &self.player2_pieces {
                    if p2_piece.square >= 4
                        && p2_piece.square <= 14
                        && (p2_piece.square - p1_piece.square).abs() <= 4
                    {
                        blocking_score += BLOCKING_BONUS / 4;
                    }
                }
            }
        }
        blocking_score
    }

    pub fn make_move(&mut self, piece_index: u8) -> bool {
        if piece_index >= PIECES_PER_PLAYER as u8 {
            return false;
        }

        let track = Self::get_player_track(self.current_player);
        let old_square = self.get_pieces_mut(self.current_player)[piece_index as usize].square;

        let current_track_pos = if old_square == -1 {
            -1
        } else {
            track
                .iter()
                .position(|&s| s as i8 == old_square)
                .map(|p| p as i8)
                .unwrap_or(-1)
        };
        let new_track_pos = current_track_pos + self.dice_roll as i8;

        if old_square >= 0 && old_square < BOARD_SIZE as i8 {
            self.board[old_square as usize] = None;
        }

        if new_track_pos >= track.len() as i8 {
            self.get_pieces_mut(self.current_player)[piece_index as usize].square = 20;
        } else {
            let new_actual_pos = track[new_track_pos as usize];
            if let Some(opp_piece) = self.board[new_actual_pos as usize] {
                if opp_piece.player != self.current_player {
                    let opp_player = opp_piece.player;
                    if let Some(p) = self
                        .get_pieces_mut(opp_player)
                        .iter_mut()
                        .find(|p| p.square == new_actual_pos as i8)
                    {
                        p.square = -1;
                    }
                }
            }
            let new_piece = PiecePosition {
                square: new_actual_pos as i8,
                player: self.current_player,
            };
            self.get_pieces_mut(self.current_player)[piece_index as usize] = new_piece;
            self.board[new_actual_pos as usize] = Some(new_piece);
        }

        if !(new_track_pos < track.len() as i8 && Self::is_rosette(track[new_track_pos as usize])) {
            self.current_player = self.current_player.opponent();
        }

        self.get_pieces(self.current_player)
            .iter()
            .filter(|p| p.square == 20)
            .count()
            == PIECES_PER_PLAYER
    }

    fn hash(&self) -> u64 {
        let mut hash = 0u64;
        for (i, piece) in self.player1_pieces.iter().enumerate() {
            hash ^= (piece.square as u64) << (i * 5);
        }
        for (i, piece) in self.player2_pieces.iter().enumerate() {
            hash ^= (piece.square as u64) << (i * 5 + 35);
        }
        if self.current_player == Player::Player2 {
            hash ^= 1u64 << 63;
        }
        hash
    }
}

struct TranspositionEntry {
    evaluation: i32,
    depth: u8,
}

pub struct AI {
    transposition_table: HashMap<u64, TranspositionEntry>,
    pub nodes_evaluated: u32,
    pub transposition_hits: u32,
}

impl AI {
    const TRANSPOSITION_TABLE_SIZE: usize = 10000;
    pub fn new() -> Self {
        AI {
            transposition_table: HashMap::with_capacity(Self::TRANSPOSITION_TABLE_SIZE),
            nodes_evaluated: 0,
            transposition_hits: 0,
        }
    }

    pub fn get_best_move(&mut self, state: &GameState, depth: u8) -> (u8, Vec<MoveEvaluation>) {
        let valid_moves = state.get_valid_moves();
        if valid_moves.is_empty() {
            return (0, Vec::new());
        }
        if valid_moves.len() == 1 {
            return (
                valid_moves[0],
                vec![MoveEvaluation {
                    piece_index: valid_moves[0],
                    score: 0.0,
                    move_type: "only_move".to_string(),
                    from_square: state.get_pieces(state.current_player)[valid_moves[0] as usize]
                        .square,
                    to_square: None,
                }],
            );
        }

        let mut move_scores = Vec::new();
        for &move_idx in &valid_moves {
            let mut total_score = 0.0f32;
            for dice_roll in 0..5 {
                let mut test_state = state.clone();
                test_state.make_move(move_idx);
                test_state.dice_roll = dice_roll;
                let score = self.minimax(
                    &test_state,
                    depth.saturating_sub(1),
                    false,
                    i32::MIN,
                    i32::MAX,
                ) as f32;
                total_score += score * DICE_PROBABILITIES[dice_roll as usize];
            }
            move_scores.push((move_idx, total_score));
        }

        move_scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        let move_evaluations = move_scores
            .iter()
            .map(|(move_idx, score)| {
                let piece = &state.get_pieces(state.current_player)[*move_idx as usize];
                let track = GameState::get_player_track(state.current_player);
                let (move_type, to_square) = if piece.square == -1 {
                    ("enter".to_string(), Some(track[0]))
                } else if let Some(track_pos) =
                    track.iter().position(|&sq| sq as i8 == piece.square)
                {
                    let new_track_pos = track_pos + state.dice_roll as usize;
                    if new_track_pos >= track.len() {
                        ("finish".to_string(), None)
                    } else {
                        let new_square = track[new_track_pos];
                        if state.board[new_square as usize].is_some() {
                            ("capture".to_string(), Some(new_square))
                        } else {
                            ("move".to_string(), Some(new_square))
                        }
                    }
                } else {
                    ("invalid".to_string(), None)
                };
                MoveEvaluation {
                    piece_index: *move_idx,
                    score: *score,
                    move_type,
                    from_square: piece.square,
                    to_square,
                }
            })
            .collect();

        (move_scores[0].0, move_evaluations)
    }

    fn minimax(
        &mut self,
        state: &GameState,
        depth: u8,
        is_maximizing: bool,
        mut alpha: i32,
        mut beta: i32,
    ) -> i32 {
        let state_hash = state.hash();
        if let Some(entry) = self.transposition_table.get(&state_hash) {
            if entry.depth >= depth {
                self.transposition_hits += 1;
                return entry.evaluation;
            }
        }

        self.nodes_evaluated += 1;
        if depth == 0 || state.get_valid_moves().is_empty() {
            return state.evaluate();
        }

        if is_maximizing {
            let mut max_eval = i32::MIN;
            for &move_idx in &state.get_valid_moves() {
                let mut test_state = state.clone();
                if test_state.make_move(move_idx) {
                    return WIN_SCORE + depth as i32;
                }
                let eval = self.minimax(&test_state, depth - 1, false, alpha, beta);
                max_eval = max_eval.max(eval);
                alpha = alpha.max(eval);
                if beta <= alpha {
                    break;
                }
            }
            self.transposition_table.insert(
                state_hash,
                TranspositionEntry {
                    evaluation: max_eval,
                    depth,
                },
            );
            max_eval
        } else {
            let mut min_eval = i32::MAX;
            for &move_idx in &state.get_valid_moves() {
                let mut test_state = state.clone();
                if test_state.make_move(move_idx) {
                    return -WIN_SCORE - depth as i32;
                }
                let eval = self.minimax(&test_state, depth - 1, true, alpha, beta);
                min_eval = min_eval.min(eval);
                beta = beta.min(eval);
                if beta <= alpha {
                    break;
                }
            }
            self.transposition_table.insert(
                state_hash,
                TranspositionEntry {
                    evaluation: min_eval,
                    depth,
                },
            );
            min_eval
        }
    }
}

#[derive(Deserialize, Clone)]
pub struct GameStateRequest {
    #[serde(rename = "player1Pieces")]
    pub player1_pieces: Vec<JsonPiece>,
    #[serde(rename = "player2Pieces")]
    pub player2_pieces: Vec<JsonPiece>,
    #[serde(rename = "currentPlayer")]
    pub current_player: String,
    #[serde(rename = "diceRoll")]
    pub dice_roll: Option<u8>,
}

#[derive(Deserialize, Clone)]
pub struct JsonPiece {
    pub square: i8,
}

#[derive(Serialize)]
pub struct AIResponse {
    #[serde(rename = "move")]
    pub r#move: u8,
    pub evaluation: i32,
    pub thinking: String,
    pub timings: Timings,
    pub diagnostics: Diagnostics,
}

#[derive(Serialize)]
pub struct Diagnostics {
    #[serde(rename = "searchDepth")]
    pub search_depth: u8,
    #[serde(rename = "validMoves")]
    pub valid_moves: Vec<u8>,
    #[serde(rename = "moveEvaluations")]
    pub move_evaluations: Vec<MoveEvaluation>,
    #[serde(rename = "transpositionHits")]
    pub transposition_hits: usize,
    #[serde(rename = "nodesEvaluated")]
    pub nodes_evaluated: u32,
    #[serde(rename = "gamePhase")]
    pub game_phase: String,
    #[serde(rename = "boardControl")]
    pub board_control: i32,
    #[serde(rename = "piecePositions")]
    pub piece_positions: PiecePositions,
}

#[derive(Serialize)]
pub struct MoveEvaluation {
    #[serde(rename = "pieceIndex")]
    pub piece_index: u8,
    pub score: f32,
    #[serde(rename = "moveType")]
    pub move_type: String,
    #[serde(rename = "fromSquare")]
    pub from_square: i8,
    #[serde(rename = "toSquare")]
    pub to_square: Option<u8>,
}

#[derive(Serialize)]
pub struct PiecePositions {
    #[serde(rename = "player1OnBoard")]
    pub player1_on_board: u8,
    #[serde(rename = "player1Finished")]
    pub player1_finished: u8,
    #[serde(rename = "player2OnBoard")]
    pub player2_on_board: u8,
    #[serde(rename = "player2Finished")]
    pub player2_finished: u8,
}

#[derive(Serialize)]
pub struct Timings {
    #[serde(rename = "aiMoveCalculation")]
    pub ai_move_calculation: u32,
    #[serde(rename = "totalHandlerTime")]
    pub total_handler_time: u32,
}

pub fn convert_json_to_game_state(json_state: &GameStateRequest) -> GameState {
    let mut game_state = GameState::new();
    game_state.current_player = if json_state.current_player == "player1" {
        Player::Player1
    } else {
        Player::Player2
    };
    game_state.dice_roll = json_state.dice_roll.unwrap_or(0);
    for (i, piece) in json_state
        .player1_pieces
        .iter()
        .enumerate()
        .take(PIECES_PER_PLAYER)
    {
        game_state.player1_pieces[i].square = piece.square;
        if piece.square >= 0 && (piece.square as usize) < BOARD_SIZE {
            game_state.board[piece.square as usize] = Some(game_state.player1_pieces[i]);
        }
    }
    for (i, piece) in json_state
        .player2_pieces
        .iter()
        .enumerate()
        .take(PIECES_PER_PLAYER)
    {
        game_state.player2_pieces[i].square = piece.square;
        if piece.square >= 0 && (piece.square as usize) < BOARD_SIZE {
            game_state.board[piece.square as usize] = Some(game_state.player2_pieces[i]);
        }
    }
    game_state
}

#[wasm_bindgen]
pub fn get_ai_move_wasm(game_state_json: &str) -> std::result::Result<String, JsValue> {
    let game_state_request: GameStateRequest =
        serde_json::from_str(game_state_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let start_time = js_sys::Date::now();
    let ai_depth = 8;
    let game_state = convert_json_to_game_state(&game_state_request);
    let mut ai = AI::new();
    let (ai_move, move_evaluations) = ai.get_best_move(&game_state, ai_depth);
    let evaluation = game_state.evaluate();
    let end_time = js_sys::Date::now();

    let response = AIResponse {
        r#move: ai_move,
        evaluation,
        thinking: format!(
            "AI (depth {}) chose move {} with score {:.1}. Evaluated {} nodes, {} cache hits.",
            ai_depth,
            ai_move,
            move_evaluations.first().map(|m| m.score).unwrap_or(0.0),
            ai.nodes_evaluated,
            ai.transposition_hits
        ),
        timings: Timings {
            ai_move_calculation: ((end_time - start_time) as u32).max(1),
            total_handler_time: 0,
        },
        diagnostics: Diagnostics {
            search_depth: ai_depth,
            valid_moves: game_state.get_valid_moves(),
            move_evaluations,
            transposition_hits: ai.transposition_hits as usize,
            nodes_evaluated: ai.nodes_evaluated,
            game_phase: "N/A".to_string(),
            board_control: game_state.evaluate_board_control(),
            piece_positions: PiecePositions {
                player1_on_board: 0,
                player1_finished: 0,
                player2_on_board: 0,
                player2_finished: 0,
            },
        },
    };

    serde_json::to_string(&response).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn roll_dice_wasm() -> u8 {
    let mut rng = rand::thread_rng();
    (0..4).map(|_| rng.gen_range(0..=1)).sum()
}

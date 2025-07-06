use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[cfg(feature = "wasm")]
pub mod wasm_api;

pub const PIECES_PER_PLAYER: usize = 7;
pub const BOARD_SIZE: usize = 21;
const ROSETTE_SQUARES: [u8; 5] = [0, 7, 13, 15, 16];
const PLAYER1_TRACK: [u8; 14] = [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const PLAYER2_TRACK: [u8; 14] = [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15];

const WIN_SCORE: i32 = 10000;
const FINISHED_PIECE_VALUE: i32 = 1000;
const POSITION_WEIGHT: i32 = 15;
const SAFETY_BONUS: i32 = 25;
const ROSETTE_CONTROL_BONUS: i32 = 40;
const ADVANCEMENT_BONUS: i32 = 5;
const CAPTURE_BONUS: i32 = 35;
const CENTER_LANE_BONUS: i32 = 2;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Player {
    Player1 = 0,
    Player2 = 1,
}

impl Player {
    pub fn opponent(self) -> Player {
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

    pub fn is_game_over(&self) -> bool {
        self.player1_pieces
            .iter()
            .filter(|p| p.square == 20)
            .count()
            == PIECES_PER_PLAYER
            || self
                .player2_pieces
                .iter()
                .filter(|p| p.square == 20)
                .count()
                == PIECES_PER_PLAYER
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

    pub fn is_rosette(square: u8) -> bool {
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
            if piece.square == 20 {
                continue;
            }
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

        let p1_on_board = self.player1_pieces.iter().filter(|p| p.square > -1).count() as i32;
        let p2_on_board = self.player2_pieces.iter().filter(|p| p.square > -1).count() as i32;
        score += (p2_on_board - p1_on_board) * CAPTURE_BONUS;

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
                        strategic_score += ADVANCEMENT_BONUS + CENTER_LANE_BONUS;
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
        control_score
    }

    pub fn make_move(&mut self, piece_index: u8) -> bool {
        if piece_index >= PIECES_PER_PLAYER as u8 {
            return false;
        }

        let track = Self::get_player_track(self.current_player);
        let old_square = self.get_pieces(self.current_player)[piece_index as usize].square;

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
        let new_square = if new_track_pos >= track.len() as i8 {
            20
        } else {
            track[new_track_pos as usize] as i8
        };

        if old_square != -1 {
            self.board[old_square as usize] = None;
        }

        if new_square != 20 {
            if let Some(occupant) = self.board[new_square as usize] {
                if occupant.player != self.current_player {
                    let opponent_pieces = self.get_pieces_mut(occupant.player);
                    if let Some(captured_piece) =
                        opponent_pieces.iter_mut().find(|p| p.square == new_square)
                    {
                        captured_piece.square = -1;
                    }
                }
            }
            self.board[new_square as usize] = Some(PiecePosition {
                square: new_square,
                player: self.current_player,
            });
        }

        self.get_pieces_mut(self.current_player)[piece_index as usize].square = new_square;

        if new_square == 20 || !Self::is_rosette(new_square as u8) {
            self.current_player = self.current_player.opponent();
        }
        true
    }

    fn hash(&self) -> u64 {
        let mut hash = 0u64;
        for (i, piece) in self.player1_pieces.iter().enumerate().take(6) {
            hash ^= ((piece.square + 1) as u64) << (i * 5);
        }
        for (i, piece) in self.player2_pieces.iter().enumerate().take(6) {
            hash ^= ((piece.square + 1) as u64) << ((i + 7) * 5);
        }
        if self.current_player == Player::Player2 {
            hash ^= 1 << 63;
        }
        hash
    }
}

struct TranspositionEntry {
    evaluation: f32,
    depth: u8,
}

pub struct AI {
    transposition_table: HashMap<u64, TranspositionEntry>,
    pub nodes_evaluated: u32,
    pub transposition_hits: u32,
}

impl AI {
    pub fn new() -> Self {
        AI {
            transposition_table: HashMap::new(),
            nodes_evaluated: 0,
            transposition_hits: 0,
        }
    }

    pub fn get_best_move(
        &mut self,
        state: &GameState,
        depth: u8,
    ) -> (Option<u8>, Vec<MoveEvaluation>) {
        self.nodes_evaluated = 0;
        self.transposition_hits = 0;

        let valid_moves = state.get_valid_moves();

        if valid_moves.is_empty() {
            return (None, vec![]);
        }

        if valid_moves.len() == 1 {
            return (Some(valid_moves[0]), vec![]);
        }

        let is_maximizing = state.current_player == Player::Player2;

        let mut best_move = valid_moves[0];
        let mut best_value = if is_maximizing { f32::MIN } else { f32::MAX };
        let mut move_evaluations = Vec::new();

        for &m in &valid_moves {
            let from_square = state.get_pieces(state.current_player)[m as usize].square;
            let track = GameState::get_player_track(state.current_player);
            let current_track_pos = if from_square == -1 {
                -1
            } else {
                track
                    .iter()
                    .position(|&s| s as i8 == from_square)
                    .map(|p| p as i8)
                    .unwrap_or(-1)
            };
            let new_track_pos = current_track_pos + state.dice_roll as i8;
            let to_square = if new_track_pos >= track.len() as i8 {
                20
            } else {
                track[new_track_pos as usize]
            };

            let mut next_state = state.clone();
            next_state.make_move(m);

            let is_capture = if to_square != 20 && !GameState::is_rosette(to_square) {
                if let Some(occupant) = state.board[to_square as usize] {
                    occupant.player != state.current_player
                } else {
                    false
                }
            } else {
                false
            };

            let move_type = if to_square == 20 {
                "finish".to_string()
            } else if GameState::is_rosette(to_square) {
                "rosette".to_string()
            } else if is_capture {
                "capture".to_string()
            } else {
                "move".to_string()
            };

            let value = self.expectiminimax(&next_state, depth - 1, f32::MIN, f32::MAX);

            move_evaluations.push(MoveEvaluation {
                piece_index: m,
                score: value,
                move_type,
                from_square,
                to_square: Some(to_square),
            });

            if is_maximizing {
                if value > best_value {
                    best_value = value;
                    best_move = m;
                }
            } else {
                if value < best_value {
                    best_value = value;
                    best_move = m;
                }
            }
        }

        move_evaluations.sort_by(|a, b| {
            if is_maximizing {
                b.score
                    .partial_cmp(&a.score)
                    .unwrap_or(std::cmp::Ordering::Equal)
            } else {
                a.score
                    .partial_cmp(&b.score)
                    .unwrap_or(std::cmp::Ordering::Equal)
            }
        });

        (Some(best_move), move_evaluations)
    }

    fn expectiminimax(&mut self, state: &GameState, depth: u8, alpha: f32, beta: f32) -> f32 {
        let state_hash = state.hash();
        if let Some(entry) = self.transposition_table.get(&state_hash) {
            if entry.depth >= depth {
                self.transposition_hits += 1;
                return entry.evaluation;
            }
        }

        if depth == 0 {
            return self.quiescence_search(state, 4, alpha, beta);
        }

        if state.is_game_over() {
            let eval = state.evaluate() as f32;
            self.transposition_table.insert(
                state_hash,
                TranspositionEntry {
                    evaluation: eval,
                    depth,
                },
            );
            return eval;
        }

        self.nodes_evaluated += 1;

        let mut expected_score = 0.0;
        const PROBABILITIES: [f32; 5] =
            [1.0 / 16.0, 4.0 / 16.0, 6.0 / 16.0, 4.0 / 16.0, 1.0 / 16.0];

        for roll in 0..=4 {
            let mut state_after_roll = state.clone();
            state_after_roll.dice_roll = roll as u8;

            let score_for_this_roll = if roll == 0 {
                let mut s = state_after_roll;
                s.current_player = s.current_player.opponent();
                self.expectiminimax(&s, depth - 1, alpha, beta)
            } else {
                self.evaluate_moves(&state_after_roll, depth, alpha, beta)
            };
            expected_score += PROBABILITIES[roll as usize] * score_for_this_roll;
        }

        self.transposition_table.insert(
            state_hash,
            TranspositionEntry {
                evaluation: expected_score,
                depth,
            },
        );

        expected_score
    }

    fn evaluate_moves(
        &mut self,
        state: &GameState,
        depth: u8,
        mut alpha: f32,
        mut beta: f32,
    ) -> f32 {
        let is_maximizing = state.current_player == Player::Player2;
        let valid_moves = state.get_valid_moves();

        if valid_moves.is_empty() {
            let mut next_state = state.clone();
            next_state.current_player = next_state.current_player.opponent();
            return self.expectiminimax(&next_state, depth - 1, alpha, beta);
        }

        let mut best_score = if is_maximizing { f32::MIN } else { f32::MAX };

        for &m in &valid_moves {
            let mut next_state = state.clone();
            next_state.make_move(m);
            let score = self.expectiminimax(&next_state, depth - 1, alpha, beta);

            if is_maximizing {
                best_score = best_score.max(score);
                alpha = alpha.max(best_score);
                if beta <= alpha {
                    break;
                }
            } else {
                best_score = best_score.min(score);
                beta = beta.min(best_score);
                if beta <= alpha {
                    break;
                }
            }
        }
        best_score
    }

    fn quiescence_search(
        &mut self,
        state: &GameState,
        depth: u8,
        mut alpha: f32,
        mut beta: f32,
    ) -> f32 {
        let stand_pat = state.evaluate() as f32;

        if depth == 0 {
            return stand_pat;
        }

        let is_maximizing = state.current_player == Player::Player2;
        let mut best_score = stand_pat;
        if is_maximizing {
            alpha = alpha.max(best_score);
        } else {
            beta = beta.min(best_score);
        }

        let valid_moves = state.get_valid_moves();

        for &m in &valid_moves {
            let track = GameState::get_player_track(state.current_player);
            let from_square = state.get_pieces(state.current_player)[m as usize].square;
            let current_track_pos = if from_square == -1 {
                -1
            } else {
                track
                    .iter()
                    .position(|&s| s as i8 == from_square)
                    .map(|p| p as i8)
                    .unwrap_or(-1)
            };
            let new_track_pos = current_track_pos + state.dice_roll as i8;
            let to_square = if new_track_pos >= track.len() as i8 {
                20
            } else {
                track[new_track_pos as usize]
            };

            let is_capture = if to_square != 20 && !GameState::is_rosette(to_square) {
                if let Some(occupant) = state.board[to_square as usize] {
                    occupant.player != state.current_player
                } else {
                    false
                }
            } else {
                false
            };

            if is_capture {
                let mut next_state = state.clone();
                next_state.make_move(m);
                let score = self.quiescence_search(&next_state, depth - 1, alpha, beta);
                if is_maximizing {
                    best_score = best_score.max(score);
                    alpha = alpha.max(best_score);
                    if beta <= alpha {
                        break;
                    }
                } else {
                    best_score = best_score.min(score);
                    beta = beta.min(best_score);
                    if beta <= alpha {
                        break;
                    }
                }
            }
        }

        best_score
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
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

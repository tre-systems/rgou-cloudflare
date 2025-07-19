use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::hash::{DefaultHasher, Hash, Hasher};

#[cfg(feature = "wasm")]
pub mod wasm_api;

pub mod features;
pub mod ml_ai;
pub mod neural_network;

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
        let mut p1_finished = 0;
        let mut p2_finished = 0;
        let mut p1_on_board = 0;
        let mut p2_on_board = 0;

        for piece in &self.player1_pieces {
            if piece.square == 20 {
                p1_finished += 1;
            } else if piece.square > -1 {
                p1_on_board += 1;
            }
        }

        for piece in &self.player2_pieces {
            if piece.square == 20 {
                p2_finished += 1;
            } else if piece.square > -1 {
                p2_on_board += 1;
            }
        }

        if p1_finished == PIECES_PER_PLAYER as i32 {
            return -WIN_SCORE;
        }
        if p2_finished == PIECES_PER_PLAYER as i32 {
            return WIN_SCORE;
        }

        let mut score = (p2_finished - p1_finished) * FINISHED_PIECE_VALUE;
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

    pub fn make_move(&mut self, piece_index: u8) -> Result<(), &'static str> {
        if piece_index >= PIECES_PER_PLAYER as u8 {
            return Err("Invalid piece index.");
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
                if occupant.player != self.current_player && !Self::is_rosette(new_square as u8) {
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

        let extra_turn = Self::is_rosette(new_square as u8);
        if !extra_turn {
            self.current_player = self.current_player.opponent();
        }

        Ok(())
    }

    fn hash(&self) -> u64 {
        let mut hasher = DefaultHasher::new();
        for (_i, piece) in self.player1_pieces.iter().enumerate().take(6) {
            hasher.write_i8(piece.square + 1);
        }
        for (_i, piece) in self.player2_pieces.iter().enumerate().take(6) {
            hasher.write_i8(piece.square + 1);
        }
        if self.current_player == Player::Player2 {
            hasher.write_u64(1 << 63);
        }
        hasher.finish()
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

pub struct HeuristicAI {
    pub nodes_evaluated: u32,
}

impl AI {
    pub fn new() -> Self {
        AI {
            transposition_table: HashMap::new(),
            nodes_evaluated: 0,
            transposition_hits: 0,
        }
    }

    pub fn get_transposition_table_size(&self) -> usize {
        self.transposition_table.len()
    }

    pub fn clear_transposition_table(&mut self) {
        self.transposition_table.clear();
        self.nodes_evaluated = 0;
        self.transposition_hits = 0;
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
            next_state
                .make_move(m)
                .expect("Evaluate moves should only use valid moves");

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
            return self.quiescence_search(state, 3, alpha, beta);
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

        for (roll, &prob) in PROBABILITIES.iter().enumerate() {
            if prob == 0.0 {
                continue;
            }

            let mut next_state = state.clone();
            next_state.dice_roll = roll as u8;

            let score = if roll == 0 {
                next_state.current_player = state.current_player.opponent();
                self.expectiminimax(&next_state, depth - 1, alpha, beta)
            } else {
                self.evaluate_moves(&next_state, depth, alpha, beta)
            };
            expected_score += score * prob;
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
        let ordered_moves = self.order_moves(state, &valid_moves);

        for &m in &ordered_moves {
            let mut next_state = state.clone();
            next_state
                .make_move(m)
                .expect("Evaluate moves should only use valid moves");
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
                next_state
                    .make_move(m)
                    .expect("Quiescence search should only use valid moves");
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

    fn order_moves(&self, state: &GameState, moves: &[u8]) -> Vec<u8> {
        let mut move_scores: Vec<(u8, f32)> = moves
            .iter()
            .map(|&m| {
                let mut test_state = state.clone();
                if test_state.make_move(m).is_ok() {
                    (m, test_state.evaluate() as f32)
                } else {
                    (m, 0.0)
                }
            })
            .collect();

        let is_maximizing = state.current_player == Player::Player2;
        if is_maximizing {
            move_scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        } else {
            move_scores.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));
        }

        move_scores.into_iter().map(|(m, _)| m).collect()
    }
}

impl HeuristicAI {
    pub fn new() -> Self {
        HeuristicAI {
            nodes_evaluated: 0,
        }
    }

    pub fn get_best_move(&mut self, state: &GameState) -> (Option<u8>, Vec<MoveEvaluation>) {
        self.nodes_evaluated = 0;
        let valid_moves = state.get_valid_moves();
        
        if valid_moves.is_empty() {
            return (None, vec![]);
        }

        let is_maximizing = state.current_player == Player::Player2;
        let mut best_move = None;
        let mut best_score = if is_maximizing { f32::MIN } else { f32::MAX };
        let mut move_evaluations = Vec::new();

        for &piece_index in &valid_moves {
            let mut test_state = state.clone();
            if let Ok(()) = test_state.make_move(piece_index) {
                let score = test_state.evaluate() as f32;
                self.nodes_evaluated += 1;

                let from_square = if state.get_pieces(state.current_player)[piece_index as usize].square == -1 {
                    -1
                } else {
                    state.get_pieces(state.current_player)[piece_index as usize].square
                };

                let to_square = if test_state.get_pieces(state.current_player)[piece_index as usize].square == 20 {
                    None
                } else {
                    Some(test_state.get_pieces(state.current_player)[piece_index as usize].square as u8)
                };

                let move_type = if from_square == -1 {
                    "move".to_string()
                } else if to_square.is_some() && test_state.board[to_square.unwrap() as usize].is_some() {
                    "capture".to_string()
                } else {
                    "move".to_string()
                };

                move_evaluations.push(MoveEvaluation {
                    piece_index,
                    score,
                    move_type,
                    from_square,
                    to_square,
                });

                if is_maximizing {
                    if score > best_score {
                        best_score = score;
                        best_move = Some(piece_index);
                    }
                } else {
                    if score < best_score {
                        best_score = score;
                        best_move = Some(piece_index);
                    }
                }
            }
        }

        // Sort evaluations by score (best first for maximizing, worst first for minimizing)
        move_evaluations.sort_by(|a, b| {
            if is_maximizing {
                b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal)
            } else {
                a.score.partial_cmp(&b.score).unwrap_or(std::cmp::Ordering::Equal)
            }
        });

        (best_move, move_evaluations)
    }

    pub fn clear_nodes_evaluated(&mut self) {
        self.nodes_evaluated = 0;
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_player_opponent() {
        assert_eq!(Player::Player1.opponent(), Player::Player2);
        assert_eq!(Player::Player2.opponent(), Player::Player1);
    }

    #[test]
    fn test_game_state_new() {
        let game_state = GameState::new();
        assert_eq!(game_state.board.len(), BOARD_SIZE);
        assert!(game_state.board.iter().all(|&x| x.is_none()));
        assert_eq!(game_state.player1_pieces.len(), PIECES_PER_PLAYER);
        assert_eq!(game_state.player2_pieces.len(), PIECES_PER_PLAYER);
        assert!(game_state
            .player1_pieces
            .iter()
            .all(|&p| p.square == -1 && p.player == Player::Player1));
        assert!(game_state
            .player2_pieces
            .iter()
            .all(|&p| p.square == -1 && p.player == Player::Player2));
        assert_eq!(game_state.current_player, Player::Player1);
        assert_eq!(game_state.dice_roll, 0);
    }

    #[test]
    fn test_is_game_over_not_finished() {
        let game_state = GameState::new();
        assert!(!game_state.is_game_over());
    }

    #[test]
    fn test_is_game_over_player1_wins() {
        let mut game_state = GameState::new();
        for piece in game_state.player1_pieces.iter_mut() {
            piece.square = 20;
        }
        assert!(game_state.is_game_over());
    }

    #[test]
    fn test_is_rosette() {
        assert!(GameState::is_rosette(0));
        assert!(GameState::is_rosette(7));
        assert!(GameState::is_rosette(13));
        assert!(!GameState::is_rosette(1));
        assert!(!GameState::is_rosette(8));
    }

    fn setup_game_for_moves_test() -> GameState {
        let mut game_state = GameState::new();
        game_state.current_player = Player::Player1;
        game_state
    }

    #[test]
    fn test_get_valid_moves_no_dice_roll() {
        let mut game_state = setup_game_for_moves_test();
        game_state.dice_roll = 0;
        assert!(game_state.get_valid_moves().is_empty());
    }

    #[test]
    fn test_get_valid_moves_from_start() {
        let mut game_state = setup_game_for_moves_test();
        game_state.dice_roll = 4;
        let moves = game_state.get_valid_moves();
        assert_eq!(moves.len(), PIECES_PER_PLAYER);
        assert!(moves.contains(&0));
    }

    #[test]
    fn test_get_valid_moves_simple_move() {
        let mut game_state = setup_game_for_moves_test();
        game_state.player1_pieces[0].square = 0;
        game_state.board[0] = Some(game_state.player1_pieces[0]);
        game_state.dice_roll = 2;
        let moves = game_state.get_valid_moves();
        assert!(moves.contains(&0));
    }

    #[test]
    fn test_get_valid_moves_capture() {
        let mut game_state = setup_game_for_moves_test();
        game_state.player1_pieces[0].square = 4;
        game_state.board[4] = Some(game_state.player1_pieces[0]);
        game_state.player2_pieces[0].square = 6;
        game_state.board[6] = Some(game_state.player2_pieces[0]);
        game_state.dice_roll = 2;
        let moves = game_state.get_valid_moves();
        assert!(moves.contains(&0));
    }

    #[test]
    fn test_get_valid_moves_blocked_by_own_piece() {
        let mut game_state = setup_game_for_moves_test();
        game_state.player1_pieces[0].square = 0;
        game_state.board[0] = Some(game_state.player1_pieces[0]);
        game_state.player1_pieces[1].square = 5;
        game_state.board[5] = Some(game_state.player1_pieces[1]);
        game_state.dice_roll = 2;
        let moves = game_state.get_valid_moves();
        assert!(!moves.contains(&0));
    }

    #[test]
    fn test_get_valid_moves_blocked_by_opponent_on_rosette() {
        let mut game_state = setup_game_for_moves_test();
        game_state.player1_pieces[0].square = 5;
        game_state.board[5] = Some(game_state.player1_pieces[0]);
        game_state.player2_pieces[0].square = 7;
        game_state.board[7] = Some(game_state.player2_pieces[0]);
        assert!(GameState::is_rosette(7));
        game_state.dice_roll = 2;
        let moves = game_state.get_valid_moves();
        assert!(!moves.contains(&0));
    }

    #[test]
    fn test_get_valid_moves_to_finish() {
        let mut game_state = setup_game_for_moves_test();
        game_state.player1_pieces[0].square = 11;
        game_state.board[11] = Some(game_state.player1_pieces[0]);
        game_state.dice_roll = 3;
        let moves = game_state.get_valid_moves();
        assert!(moves.contains(&0));
    }

    #[test]
    fn test_get_valid_moves_player2() {
        let mut game_state = GameState::new();
        game_state.current_player = Player::Player2;
        game_state.player2_pieces[0].square = 19;
        game_state.board[19] = Some(game_state.player2_pieces[0]);
        game_state.dice_roll = 2;
        let moves = game_state.get_valid_moves();
        assert!(moves.contains(&0));
    }

    #[test]
    fn test_make_move_simple() {
        let mut game_state = setup_game_for_moves_test();
        game_state.dice_roll = 4;
        assert!(game_state.make_move(0).is_ok());

        assert_eq!(game_state.player1_pieces[0].square, 0);
        assert_eq!(game_state.board[0].unwrap().player, Player::Player1);
        assert_eq!(game_state.board[0].unwrap().square, 0);
        assert_eq!(game_state.current_player, Player::Player1);
    }

    #[test]
    fn test_make_move_from_rosette() {
        let mut game_state = setup_game_for_moves_test();
        game_state.player1_pieces[0].square = 7;
        game_state.board[7] = Some(game_state.player1_pieces[0]);
        game_state.dice_roll = 2;

        assert!(game_state.make_move(0).is_ok());

        assert_eq!(game_state.player1_pieces[0].square, 9);
        assert!(game_state.board[7].is_none());
        assert_eq!(game_state.board[9].unwrap().player, Player::Player1);
        assert_eq!(game_state.current_player, Player::Player2);
    }

    #[test]
    fn test_get_valid_moves_blocked_on_rosette_is_correct() {
        let mut game_state = setup_game_for_moves_test();
        game_state.player1_pieces[0].square = 5;
        game_state.board[5] = Some(game_state.player1_pieces[0]);
        game_state.player2_pieces[0].square = 7;
        game_state.board[7] = Some(game_state.player2_pieces[0]);
        assert!(GameState::is_rosette(7));
        game_state.dice_roll = 2;
        let moves = game_state.get_valid_moves();
        assert!(!moves.contains(&0));
    }

    #[test]
    fn test_make_move_capture() {
        let mut game_state = setup_game_for_moves_test();
        game_state.player1_pieces[0].square = 4;
        game_state.board[4] = Some(game_state.player1_pieces[0]);
        game_state.player2_pieces[0].square = 6;
        game_state.board[6] = Some(game_state.player2_pieces[0]);
        game_state.dice_roll = 2;

        assert!(game_state.make_move(0).is_ok());

        assert_eq!(game_state.player1_pieces[0].square, 6);
        assert_eq!(game_state.board[6].unwrap().player, Player::Player1);
        assert_eq!(game_state.player2_pieces[0].square, -1);
        assert_eq!(game_state.current_player, Player::Player2);
    }

    #[test]
    fn test_make_move_player2_simple() {
        let mut game_state = GameState::new();
        game_state.current_player = Player::Player2;
        game_state.player2_pieces[0].square = 19;
        game_state.board[19] = Some(game_state.player2_pieces[0]);
        game_state.dice_roll = 2;

        assert!(game_state.make_move(0).is_ok());

        assert_eq!(game_state.player2_pieces[0].square, 17);
        assert_eq!(game_state.board[17].unwrap().player, Player::Player2);
        assert_eq!(game_state.current_player, Player::Player1);
    }

    #[test]
    fn test_make_move_to_finish() {
        let mut game_state = setup_game_for_moves_test();
        game_state.player1_pieces[0].square = 11;
        game_state.board[11] = Some(game_state.player1_pieces[0]);
        game_state.dice_roll = 3;

        assert!(game_state.make_move(0).is_ok());

        assert_eq!(game_state.player1_pieces[0].square, 20);
        assert!(game_state.board[11].is_none());
        assert_eq!(game_state.current_player, Player::Player2);
    }

    #[test]
    fn test_make_move_and_change_player() {
        let mut game_state = setup_game_for_moves_test();
        game_state.player1_pieces[0].square = 0;
        game_state.board[0] = Some(game_state.player1_pieces[0]);
        game_state.dice_roll = 1;

        assert!(game_state.make_move(0).is_ok());

        assert_eq!(game_state.player1_pieces[0].square, 4);
        assert_eq!(game_state.board[4].unwrap().player, Player::Player1);
        assert_eq!(game_state.current_player, Player::Player2);
    }

    #[test]
    fn test_evaluate_initial_state() {
        let game_state = GameState::new();
        assert!(game_state.evaluate().abs() < 50);
    }

    #[test]
    fn test_evaluate_player2_advantage() {
        let mut game_state = GameState::new();
        game_state.player2_pieces[0].square = 7;
        game_state.board[7] = Some(game_state.player2_pieces[0]);
        game_state.player2_pieces[1].square = 8;
        game_state.board[8] = Some(game_state.player2_pieces[1]);

        assert!(game_state.evaluate() > 0);
    }

    #[test]
    fn test_evaluate_player1_advantage() {
        let mut game_state = GameState::new();
        game_state.player1_pieces[0].square = 7;
        game_state.board[7] = Some(game_state.player1_pieces[0]);
        game_state.player1_pieces[1].square = 8;
        game_state.board[8] = Some(game_state.player1_pieces[1]);

        assert!(game_state.evaluate() < 0);
    }

    #[test]
    fn test_evaluate_player1_wins() {
        let mut game_state = GameState::new();
        for i in 0..PIECES_PER_PLAYER {
            game_state.player1_pieces[i].square = 20;
        }
        assert_eq!(game_state.evaluate(), -WIN_SCORE);
    }

    #[test]
    fn test_evaluate_winning_move() {
        let mut game_state = GameState::new();
        for i in 0..PIECES_PER_PLAYER - 1 {
            game_state.player2_pieces[i].square = 20;
        }
        game_state.player2_pieces[PIECES_PER_PLAYER - 1].square = 15;
        game_state.board[15] = Some(game_state.player2_pieces[PIECES_PER_PLAYER - 1]);

        let _initial_eval = game_state.evaluate();

        game_state.current_player = Player::Player2;
        game_state.dice_roll = 1;
        let moves = game_state.get_valid_moves();
        assert!(moves.contains(&(PIECES_PER_PLAYER as u8 - 1)));
        assert!(game_state.make_move((PIECES_PER_PLAYER - 1) as u8).is_ok());

        assert!(game_state.is_game_over());
        assert_eq!(game_state.evaluate(), WIN_SCORE);
    }

    #[test]
    fn test_ai_gets_winning_move() {
        let mut ai = AI::new();
        let mut game_state = GameState::new();

        game_state.current_player = Player::Player2;
        for i in 0..PIECES_PER_PLAYER - 1 {
            game_state.player2_pieces[i].square = 20;
        }
        game_state.player2_pieces[PIECES_PER_PLAYER - 1].square = 15;
        game_state.board[15] = Some(game_state.player2_pieces[PIECES_PER_PLAYER - 1]);
        game_state.dice_roll = 1;

        game_state.player1_pieces[0].square = 1;
        game_state.board[1] = Some(game_state.player1_pieces[0]);

        let (best_move, _) = ai.get_best_move(&game_state, 3);

        assert!(best_move.is_some());
        assert_eq!(best_move.unwrap(), (PIECES_PER_PLAYER - 1) as u8);
    }

    #[test]
    fn test_ai_no_valid_moves() {
        let mut ai = AI::new();
        let mut game_state = GameState::new();
        game_state.dice_roll = 0;

        let (best_move, evals) = ai.get_best_move(&game_state, 3);

        assert!(best_move.is_none());
        assert!(evals.is_empty());
    }

    #[test]
    fn test_hash_consistency_and_uniqueness() {
        let mut game_state1 = GameState::new();
        game_state1.player1_pieces[0].square = 5;
        game_state1.board[5] = Some(game_state1.player1_pieces[0]);
        game_state1.dice_roll = 2;

        let mut game_state2 = game_state1.clone();

        assert_eq!(game_state1.hash(), game_state2.hash());

        assert!(game_state2.make_move(0).is_ok());
        assert_ne!(game_state1.hash(), game_state2.hash());

        let mut game_state3 = game_state1.clone();
        game_state3.current_player = Player::Player2;
        assert_ne!(game_state1.hash(), game_state3.hash());
    }

    #[test]
    fn test_heuristic_ai_new() {
        let ai = HeuristicAI::new();
        assert_eq!(ai.nodes_evaluated, 0);
    }

    #[test]
    fn test_heuristic_ai_gets_winning_move() {
        let mut ai = HeuristicAI::new();
        let mut state = GameState::new();
        state.dice_roll = 4;
        
        let (best_move, evaluations) = ai.get_best_move(&state);
        
        assert!(best_move.is_some());
        assert!(!evaluations.is_empty());
        assert!(ai.nodes_evaluated > 0);
    }

    #[test]
    fn test_heuristic_ai_no_valid_moves() {
        let mut ai = HeuristicAI::new();
        let mut state = GameState::new();
        state.dice_roll = 0;
        
        let (best_move, evaluations) = ai.get_best_move(&state);
        
        assert!(best_move.is_none());
        assert!(evaluations.is_empty());
        assert_eq!(ai.nodes_evaluated, 0);
    }
}

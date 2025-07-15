use serde::{Deserialize, Serialize};

pub mod features;
pub mod neural_network;
pub mod training;

#[cfg(feature = "wasm")]
pub mod wasm_api;

#[cfg(feature = "wasm")]
pub use wasm_api::*;

use features::GameFeatures;
use neural_network::{NetworkConfig, NeuralNetwork};

pub const PIECES_PER_PLAYER: usize = 7;
pub const BOARD_SIZE: usize = 21;
pub const ROSETTE_SQUARES: [u8; 5] = [0, 7, 13, 15, 16];
pub const PLAYER1_TRACK: [u8; 14] = [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
pub const PLAYER2_TRACK: [u8; 14] = [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15];

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

    pub fn get_winner(&self) -> Option<Player> {
        if self
            .player1_pieces
            .iter()
            .filter(|p| p.square == 20)
            .count()
            == PIECES_PER_PLAYER
        {
            Some(Player::Player1)
        } else if self
            .player2_pieces
            .iter()
            .filter(|p| p.square == 20)
            .count()
            == PIECES_PER_PLAYER
        {
            Some(Player::Player2)
        } else {
            None
        }
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
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MLMoveEvaluation {
    pub piece_index: u8,
    pub score: f32,
    pub move_type: String,
    pub from_square: i8,
    pub to_square: Option<u8>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MLResponse {
    pub r#move: Option<u8>,
    pub evaluation: f32,
    pub thinking: String,
    pub diagnostics: MLDiagnostics,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MLDiagnostics {
    pub valid_moves: Vec<u8>,
    pub move_evaluations: Vec<MLMoveEvaluation>,
    pub value_network_output: f32,
    pub policy_network_outputs: Vec<f32>,
}

pub struct MLAI {
    value_network: NeuralNetwork,
    policy_network: NeuralNetwork,
}

impl MLAI {
    pub fn new() -> Self {
        let value_config = NetworkConfig {
            input_size: 150,
            hidden_sizes: vec![256, 128, 64, 32],
            output_size: 1,
        };

        let policy_config = NetworkConfig {
            input_size: 150,
            hidden_sizes: vec![256, 128, 64, 32],
            output_size: PIECES_PER_PLAYER,
        };

        MLAI {
            value_network: NeuralNetwork::new(value_config),
            policy_network: NeuralNetwork::new(policy_config),
        }
    }

    pub fn load_pretrained(&mut self, value_weights: &[f32], policy_weights: &[f32]) {
        self.value_network.load_weights(value_weights);
        self.policy_network.load_weights(policy_weights);
    }

    pub fn get_best_move(&mut self, state: &GameState) -> MLResponse {
        let valid_moves = state.get_valid_moves();

        if valid_moves.is_empty() {
            return MLResponse {
                r#move: None,
                evaluation: 0.0,
                thinking: "No valid moves available".to_string(),
                diagnostics: MLDiagnostics {
                    valid_moves: vec![],
                    move_evaluations: vec![],
                    value_network_output: 0.0,
                    policy_network_outputs: vec![],
                },
            };
        }

        if valid_moves.len() == 1 {
            return MLResponse {
                r#move: Some(valid_moves[0]),
                evaluation: 0.0,
                thinking: "Only one valid move".to_string(),
                diagnostics: MLDiagnostics {
                    valid_moves: valid_moves.clone(),
                    move_evaluations: vec![],
                    value_network_output: 0.0,
                    policy_network_outputs: vec![],
                },
            };
        }

        let features = GameFeatures::from_game_state(state);
        let value_output = self.value_network.forward(&features.to_array());
        let policy_outputs = self.policy_network.forward(&features.to_array());

        let mut move_evaluations = Vec::new();
        let mut best_move = valid_moves[0];
        let mut best_score = f32::NEG_INFINITY;

        for &move_idx in &valid_moves {
            let mut next_state = state.clone();
            next_state.make_move(move_idx).unwrap();

            let next_features = GameFeatures::from_game_state(&next_state);
            let next_value = self.value_network.forward(&next_features.to_array());

            let from_square = state.get_pieces(state.current_player)[move_idx as usize].square;
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

            let move_type = if to_square == 20 {
                "finish".to_string()
            } else if GameState::is_rosette(to_square) {
                "rosette".to_string()
            } else if to_square != 20 && !GameState::is_rosette(to_square) {
                if let Some(occupant) = state.board[to_square as usize] {
                    if occupant.player != state.current_player {
                        "capture".to_string()
                    } else {
                        "move".to_string()
                    }
                } else {
                    "move".to_string()
                }
            } else {
                "move".to_string()
            };

            let mut score = next_value[0] * 0.7 + policy_outputs[move_idx as usize] * 0.3;

            if move_type == "finish" {
                score += 2.0;
            } else if move_type == "capture" {
                score += 1.5;
            } else if move_type == "rosette" {
                score += 1.0;
            }

            if to_square == 20 {
                score += 3.0;
            } else if GameState::is_rosette(to_square) {
                score += 1.5;
            }

            move_evaluations.push(MLMoveEvaluation {
                piece_index: move_idx,
                score,
                move_type,
                from_square,
                to_square: Some(to_square),
            });

            if score > best_score {
                best_score = score;
                best_move = move_idx;
            }
        }

        move_evaluations.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());

        MLResponse {
            r#move: Some(best_move),
            evaluation: value_output[0],
            thinking: format!(
                "ML AI chose move {} with score {:.3}. Value network: {:.3}",
                best_move, best_score, value_output[0]
            ),
            diagnostics: MLDiagnostics {
                valid_moves,
                move_evaluations,
                value_network_output: value_output[0],
                policy_network_outputs: policy_outputs.to_vec(),
            },
        }
    }

    pub fn evaluate_position(&self, state: &GameState) -> f32 {
        let features = GameFeatures::from_game_state(state);
        let value = self.value_network.forward(&features.to_array());
        value[0]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_game_state_new() {
        let state = GameState::new();
        assert_eq!(state.board.len(), BOARD_SIZE);
        assert_eq!(state.player1_pieces.len(), PIECES_PER_PLAYER);
        assert_eq!(state.player2_pieces.len(), PIECES_PER_PLAYER);
        assert_eq!(state.current_player, Player::Player1);
        assert_eq!(state.dice_roll, 0);
    }

    #[test]
    fn test_ml_ai_new() {
        let ai = MLAI::new();
        assert!(ai.transposition_table.is_empty());
    }
}

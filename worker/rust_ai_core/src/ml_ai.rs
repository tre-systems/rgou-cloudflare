use crate::features::GameFeatures;
use crate::neural_network::{NetworkConfig, NeuralNetwork};
use serde::{Deserialize, Serialize};
use crate::{GameState, PIECES_PER_PLAYER};

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
    fn test_ml_ai_new() {
        let ai = MLAI::new();
        assert!(ai.value_network.num_layers() > 0);
        assert!(ai.policy_network.num_layers() > 0);
    }
}

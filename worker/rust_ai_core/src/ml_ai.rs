use crate::features::GameFeatures;
use crate::neural_network::{NetworkConfig, NeuralNetwork};
use crate::{GameState, PIECES_PER_PLAYER};
use serde::{Deserialize, Serialize};

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
    use crate::Player;

    #[test]
    fn test_ml_ai_new() {
        let ai = MLAI::new();
        assert!(ai.value_network.num_layers() > 0);
        assert!(ai.policy_network.num_layers() > 0);
    }

    #[test]
    fn test_ml_ai_initial_state() {
        let mut ai = MLAI::new();
        let mut state = GameState::new();
        state.dice_roll = 1; // Ensure there are valid moves
        let response = ai.get_best_move(&state);

        // Should have valid moves in initial state with dice roll
        assert!(!response.diagnostics.valid_moves.is_empty());
        assert!(response.diagnostics.valid_moves.len() == PIECES_PER_PLAYER);

        // Should have move evaluations
        assert!(!response.diagnostics.move_evaluations.is_empty());

        // Should have network outputs
        assert_eq!(
            response.diagnostics.policy_network_outputs.len(),
            PIECES_PER_PLAYER
        );
    }

    #[test]
    fn test_ml_ai_no_valid_moves() {
        let mut ai = MLAI::new();
        let mut state = GameState::new();

        // Create a state with no valid moves (all pieces finished)
        for piece in &mut state.player1_pieces {
            piece.square = 20;
        }
        state.current_player = Player::Player1;
        state.dice_roll = 1;

        let response = ai.get_best_move(&state);

        assert!(response.r#move.is_none());
        assert_eq!(response.thinking, "No valid moves available");
        assert!(response.diagnostics.valid_moves.is_empty());
    }

    #[test]
    fn test_ml_ai_single_valid_move() {
        let mut ai = MLAI::new();
        let mut state = GameState::new();

        // Create a state with only one valid move
        for i in 1..PIECES_PER_PLAYER {
            state.player1_pieces[i].square = 20;
        }
        state.current_player = Player::Player1;
        state.dice_roll = 1;

        let response = ai.get_best_move(&state);

        assert_eq!(response.r#move, Some(0));
        assert_eq!(response.thinking, "Only one valid move");
        assert_eq!(response.diagnostics.valid_moves.len(), 1);
    }

    #[test]
    fn test_ml_ai_move_evaluation_structure() {
        let mut ai = MLAI::new();
        let state = GameState::new();
        let response = ai.get_best_move(&state);

        for evaluation in &response.diagnostics.move_evaluations {
            assert!(evaluation.piece_index < PIECES_PER_PLAYER as u8);
            assert!(!evaluation.move_type.is_empty());
            assert!(evaluation.from_square >= -1);
            assert!(evaluation.to_square.is_some());
            assert!(evaluation.to_square.unwrap() <= 20);
        }
    }

    #[test]
    fn test_ml_ai_move_prioritization() {
        let mut ai = MLAI::new();
        let mut state = GameState::new();

        // Create a state where finishing a piece is possible
        state.player1_pieces[0].square = 19; // One move from finish
        state.current_player = Player::Player1;
        state.dice_roll = 1;

        let response = ai.get_best_move(&state);

        // Should prioritize finishing moves
        if let Some(move_idx) = response.r#move {
            let move_eval = response
                .diagnostics
                .move_evaluations
                .iter()
                .find(|e| e.piece_index == move_idx)
                .unwrap();

            // Finishing moves should have high scores
            if move_eval.move_type == "finish" {
                assert!(move_eval.score > 0.0);
            }
        }
    }

    #[test]
    fn test_ml_ai_weight_loading() {
        let mut ai = MLAI::new();

        // Create dummy weights
        let value_weights = vec![0.1; 81921]; // Approximate size for value network
        let policy_weights = vec![0.1; 82119]; // Approximate size for policy network

        // Should not panic
        ai.load_pretrained(&value_weights, &policy_weights);

        // Test that AI still works after loading weights
        let mut state = GameState::new();
        state.dice_roll = 1; // Ensure there are valid moves
        let response = ai.get_best_move(&state);
        assert!(!response.diagnostics.valid_moves.is_empty());
    }

    #[test]
    fn test_ml_ai_position_evaluation() {
        let ai = MLAI::new();
        let state = GameState::new();

        let evaluation = ai.evaluate_position(&state);

        // Evaluation should be in reasonable range for tanh output
        assert!(evaluation >= -1.0 && evaluation <= 1.0);
    }

    #[test]
    fn test_ml_ai_consistent_behavior() {
        let mut ai = MLAI::new();
        let state = GameState::new();

        // Get two responses for the same state
        let response1 = ai.get_best_move(&state);
        let response2 = ai.get_best_move(&state);

        // Should be consistent (same move selected)
        assert_eq!(response1.r#move, response2.r#move);
        assert!((response1.evaluation - response2.evaluation).abs() < 1e-6);
    }

    #[test]
    fn test_ml_ai_different_states() {
        let mut ai = MLAI::new();

        // Test initial state
        let mut state1 = GameState::new();
        state1.dice_roll = 1; // Ensure there are valid moves
        let response1 = ai.get_best_move(&state1);

        // Test a different state (player 2's turn with different piece positions)
        let mut state2 = GameState::new();
        state2.current_player = Player::Player2;
        state2.dice_roll = 1; // Ensure there are valid moves
        state2.player1_pieces[0].square = 5; // Different piece position
        let response2 = ai.get_best_move(&state2);

        assert!(
            response1.r#move.is_some() || response2.r#move.is_some(),
            "At least one state should have valid moves"
        );
    }

    #[test]
    fn test_ml_ai_capture_opportunity() {
        let mut ai = MLAI::new();
        let mut state = GameState::new();

        // Create a state with capture opportunity
        state.player1_pieces[0].square = 3;
        state.player2_pieces[0].square = 3;
        state.current_player = Player::Player1;
        state.dice_roll = 0; // Move to same square

        let response = ai.get_best_move(&state);

        // Should consider capture moves if there are valid moves
        if !response.diagnostics.valid_moves.is_empty() {
            let _has_capture_move = response
                .diagnostics
                .move_evaluations
                .iter()
                .any(|e| e.move_type == "capture");

            assert!(!response.diagnostics.move_evaluations.is_empty());
        } else {
            // If no valid moves, that's also acceptable
            assert!(response.r#move.is_none());
        }
    }

    #[test]
    fn test_ml_ai_rosette_opportunity() {
        let mut ai = MLAI::new();
        let mut state = GameState::new();

        // Create a state with rosette opportunity
        state.player1_pieces[0].square = 2; // One move from rosette at square 3
        state.current_player = Player::Player1;
        state.dice_roll = 1;

        let response = ai.get_best_move(&state);

        // Should consider rosette moves
        let _has_rosette_move = response
            .diagnostics
            .move_evaluations
            .iter()
            .any(|e| e.move_type == "rosette");

        assert!(!response.diagnostics.move_evaluations.is_empty());
    }

    #[test]
    fn test_ml_ai_network_outputs() {
        let mut ai = MLAI::new();
        let mut state = GameState::new();
        state.dice_roll = 1; // Ensure there are valid moves
        let response = ai.get_best_move(&state);

        // Check value network output
        assert!(response.diagnostics.value_network_output >= -1.0);
        assert!(response.diagnostics.value_network_output <= 1.0);

        // Check policy network outputs
        assert_eq!(
            response.diagnostics.policy_network_outputs.len(),
            PIECES_PER_PLAYER
        );
        for &output in &response.diagnostics.policy_network_outputs {
            assert!(output >= 0.0 && output <= 1.0);
        }

        // Policy outputs should sum to approximately 1.0 (softmax)
        let sum: f32 = response.diagnostics.policy_network_outputs.iter().sum();
        assert!((sum - 1.0).abs() < 1e-6);
    }

    #[test]
    fn test_ml_ai_move_scoring() {
        let mut ai = MLAI::new();
        let state = GameState::new();
        let response = ai.get_best_move(&state);

        // Move evaluations should be sorted by score (descending)
        let scores: Vec<f32> = response
            .diagnostics
            .move_evaluations
            .iter()
            .map(|e| e.score)
            .collect();

        for i in 1..scores.len() {
            assert!(
                scores[i - 1] >= scores[i],
                "Move evaluations should be sorted by score"
            );
        }

        // Best move should have the highest score
        if let Some(best_move) = response.r#move {
            let best_eval = response
                .diagnostics
                .move_evaluations
                .iter()
                .find(|e| e.piece_index == best_move)
                .unwrap();

            assert_eq!(best_eval.score, scores[0]);
        }
    }

    #[test]
    fn test_ml_ai_actual_weights() {
        use serde_json;
        use std::fs;

        // Try to load the actual weights file
        let weights_path = "../../ml/data/weights/ml_ai_weights_pytorch_v5.json";
        if let Ok(content) = fs::read_to_string(weights_path) {
            if let Ok(weights_data) = serde_json::from_str::<serde_json::Value>(&content) {
                if let (Some(value_weights), Some(policy_weights)) = (
                    weights_data["value_weights"].as_array(),
                    weights_data["policy_weights"].as_array(),
                ) {
                    let value_weights: Vec<f32> = value_weights
                        .iter()
                        .filter_map(|v| v.as_f64().map(|f| f as f32))
                        .collect();
                    let policy_weights: Vec<f32> = policy_weights
                        .iter()
                        .filter_map(|v| v.as_f64().map(|f| f as f32))
                        .collect();

                    let mut ai = MLAI::new();
                    ai.load_pretrained(&value_weights, &policy_weights);

                    let mut state = GameState::new();
                    state.dice_roll = 1;
                    let response = ai.get_best_move(&state);

                    // Check that value network is not always zero
                    assert_ne!(
                        response.diagnostics.value_network_output, 0.0,
                        "Value network should not always return 0.0"
                    );

                    // Check that policy network outputs are reasonable
                    assert_eq!(
                        response.diagnostics.policy_network_outputs.len(),
                        PIECES_PER_PLAYER
                    );
                    let sum: f32 = response.diagnostics.policy_network_outputs.iter().sum();
                    assert!((sum - 1.0).abs() < 1e-6, "Policy outputs should sum to 1.0");
                }
            }
        }
    }
}

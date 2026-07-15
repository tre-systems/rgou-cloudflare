use crate::ml_ai::{MLDiagnostics, MLMoveEvaluation, MLResponse};
use crate::neural_network::{NetworkConfig, NeuralNetwork};
use crate::{GameState, Player, PIECES_PER_PLAYER};
use ndarray::Array1;

pub const FEATURE_SIZE: usize = 32;
const PRIVATE_TRACK_POSITIONS: [usize; 6] = [0, 1, 2, 3, 12, 13];
const SHARED_SQUARES: std::ops::Range<usize> = 4..12;

#[derive(Clone, Debug, PartialEq)]
pub struct OracleFeatures([f32; FEATURE_SIZE]);

impl OracleFeatures {
    pub fn from_game_state(state: &GameState) -> Self {
        let mut features = [0.0; FEATURE_SIZE];
        let current = state.current_player;
        let opponent = current.opponent();
        let current_track = GameState::get_player_track(current);
        let opponent_track = GameState::get_player_track(opponent);

        for (output, track_position) in PRIVATE_TRACK_POSITIONS.iter().enumerate() {
            features[output] = Self::occupied_by(state, current_track[*track_position], current);
            features[6 + output] =
                Self::occupied_by(state, opponent_track[*track_position], opponent);
        }

        for (output, square) in SHARED_SQUARES.enumerate() {
            features[12 + output] = Self::occupied_by(state, square as u8, current);
            features[20 + output] = Self::occupied_by(state, square as u8, opponent);
        }

        let current_pieces = state.get_pieces(current);
        let opponent_pieces = state.get_pieces(opponent);
        features[28] = Self::piece_count(current_pieces, -1) / PIECES_PER_PLAYER as f32;
        features[29] = Self::piece_count(opponent_pieces, -1) / PIECES_PER_PLAYER as f32;
        features[30] = Self::piece_count(current_pieces, 20) / PIECES_PER_PLAYER as f32;
        features[31] = Self::piece_count(opponent_pieces, 20) / PIECES_PER_PLAYER as f32;
        Self(features)
    }

    pub fn to_array(&self) -> Array1<f32> {
        Array1::from_vec(self.0.to_vec())
    }

    fn occupied_by(state: &GameState, square: u8, player: Player) -> f32 {
        f32::from(state.board[square as usize].is_some_and(|piece| piece.player == player))
    }

    fn piece_count(pieces: &[crate::PiecePosition], square: i8) -> f32 {
        pieces.iter().filter(|piece| piece.square == square).count() as f32
    }
}

pub struct OracleAI {
    value_network: NeuralNetwork,
}

impl Default for OracleAI {
    fn default() -> Self {
        Self::new()
    }
}

impl OracleAI {
    pub fn new() -> Self {
        Self {
            value_network: NeuralNetwork::new(NetworkConfig {
                input_size: FEATURE_SIZE,
                hidden_sizes: vec![128, 128, 64],
                output_size: 1,
            }),
        }
    }

    pub fn load_pretrained(&mut self, weights: &[f32]) -> Result<(), String> {
        self.value_network.load_weights(weights)
    }

    pub fn evaluate_current_player(&self, state: &GameState) -> f32 {
        let output = self
            .value_network
            .forward(&OracleFeatures::from_game_state(state).to_array())[0];
        ((output + 1.0) / 2.0).clamp(0.0, 1.0)
    }

    pub fn get_best_move(&self, state: &GameState) -> MLResponse {
        let valid_moves = state.get_valid_moves();
        let position_value = self.evaluate_current_player(state);
        if valid_moves.is_empty() {
            return Self::response(None, position_value, valid_moves, Vec::new());
        }

        let original_player = state.current_player;
        let mut evaluations = valid_moves
            .iter()
            .map(|&piece_index| {
                let (from_square, to_square, move_type) = Self::move_details(state, piece_index);
                let mut successor = state.clone();
                successor
                    .make_move(piece_index)
                    .expect("a move returned by get_valid_moves must succeed");
                let score = if successor.is_game_over() {
                    1.0
                } else {
                    let successor_value = self.evaluate_current_player(&successor);
                    if successor.current_player == original_player {
                        successor_value
                    } else {
                        1.0 - successor_value
                    }
                };
                MLMoveEvaluation {
                    piece_index,
                    score,
                    move_type,
                    from_square,
                    to_square: Some(to_square),
                }
            })
            .collect::<Vec<_>>();
        evaluations.sort_by(|left, right| {
            right
                .score
                .total_cmp(&left.score)
                .then(left.piece_index.cmp(&right.piece_index))
        });
        let best_move = evaluations.first().map(|evaluation| evaluation.piece_index);
        Self::response(best_move, position_value, valid_moves, evaluations)
    }

    fn response(
        best_move: Option<u8>,
        position_value: f32,
        valid_moves: Vec<u8>,
        move_evaluations: Vec<MLMoveEvaluation>,
    ) -> MLResponse {
        MLResponse {
            r#move: best_move,
            evaluation: position_value,
            thinking: best_move.map_or_else(
                || "Oracle AI found no legal move".to_string(),
                |piece| {
                    format!(
                        "Oracle AI chose piece {} from a {:.1}% estimated win chance",
                        piece + 1,
                        position_value * 100.0
                    )
                },
            ),
            diagnostics: MLDiagnostics {
                valid_moves,
                move_evaluations,
                value_network_output: position_value,
                policy_network_outputs: Vec::new(),
            },
        }
    }

    fn move_details(state: &GameState, piece_index: u8) -> (i8, u8, String) {
        let from_square = state.get_pieces(state.current_player)[piece_index as usize].square;
        let track = GameState::get_player_track(state.current_player);
        let current_track_position = if from_square == -1 {
            -1
        } else {
            track
                .iter()
                .position(|&square| square as i8 == from_square)
                .map_or(-1, |position| position as i8)
        };
        let destination = current_track_position + state.dice_roll as i8;
        let to_square = if destination >= track.len() as i8 {
            20
        } else {
            track[destination as usize]
        };
        let move_type = if to_square == 20 {
            "finish"
        } else if GameState::is_rosette(to_square) {
            "rosette"
        } else if state.board[to_square as usize]
            .is_some_and(|piece| piece.player != state.current_player)
        {
            "capture"
        } else {
            "move"
        };
        (from_square, to_square, move_type.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::PiecePosition;

    fn rebuild_board(state: &mut GameState) {
        state.board.fill(None);
        for piece in state
            .player1_pieces
            .iter()
            .chain(state.player2_pieces.iter())
        {
            if (0..20).contains(&piece.square) {
                state.board[piece.square as usize] = Some(*piece);
            }
        }
    }

    fn production_ai() -> OracleAI {
        let content = include_str!("../../../ml/data/weights/oracle_ai_weights_v1.json");
        let model: serde_json::Value = serde_json::from_str(content).unwrap();
        let weights = model["weights"]
            .as_array()
            .unwrap()
            .iter()
            .map(|value| value.as_f64().unwrap() as f32)
            .collect::<Vec<_>>();
        let mut ai = OracleAI::new();
        ai.load_pretrained(&weights).unwrap();
        ai
    }

    #[test]
    fn initial_state_uses_only_reserve_features() {
        let features = OracleFeatures::from_game_state(&GameState::new()).0;
        assert_eq!(features[..28], [0.0; 28]);
        assert_eq!(features[28..], [1.0, 1.0, 0.0, 0.0]);
    }

    #[test]
    fn feature_view_is_canonical_for_either_player() {
        let mut player_one = GameState::new();
        player_one.player1_pieces[0].square = 3;
        player_one.player2_pieces[0].square = 19;
        player_one.player1_pieces[1].square = 4;
        player_one.player2_pieces[1].square = 5;
        rebuild_board(&mut player_one);

        let mut player_two = GameState::new();
        player_two.current_player = Player::Player2;
        player_two.player2_pieces[0].square = 19;
        player_two.player1_pieces[0].square = 3;
        player_two.player2_pieces[1].square = 4;
        player_two.player1_pieces[1].square = 5;
        rebuild_board(&mut player_two);

        assert_eq!(
            OracleFeatures::from_game_state(&player_one),
            OracleFeatures::from_game_state(&player_two)
        );
    }

    #[test]
    fn equivalent_piece_indices_produce_identical_features() {
        let mut first = GameState::new();
        first.player1_pieces[0].square = 7;
        rebuild_board(&mut first);
        let mut second = first.clone();
        second.player1_pieces.swap(0, 6);
        rebuild_board(&mut second);

        assert_eq!(
            OracleFeatures::from_game_state(&first),
            OracleFeatures::from_game_state(&second)
        );
    }

    #[test]
    fn production_model_returns_legal_moves_and_probabilities() {
        let ai = production_ai();
        let mut state = GameState::new();
        state.dice_roll = 4;
        let response = ai.get_best_move(&state);

        assert!(response
            .r#move
            .is_some_and(|index| state.get_valid_moves().contains(&index)));
        assert!((0.0..=1.0).contains(&response.evaluation));
        assert!(response
            .diagnostics
            .move_evaluations
            .iter()
            .all(|evaluation| (0.0..=1.0).contains(&evaluation.score)));
    }

    #[test]
    fn finishing_the_last_piece_has_certain_value() {
        let ai = production_ai();
        let mut state = GameState::new();
        state.player1_pieces = (0..PIECES_PER_PLAYER)
            .map(|index| PiecePosition {
                square: if index == 0 { 13 } else { 20 },
                player: Player::Player1,
            })
            .collect();
        state.dice_roll = 1;
        rebuild_board(&mut state);

        let response = ai.get_best_move(&state);
        assert_eq!(response.r#move, Some(0));
        assert_eq!(response.diagnostics.move_evaluations[0].score, 1.0);
    }
}

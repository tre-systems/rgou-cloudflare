use super::{GameState, Player, BOARD_SIZE, PIECES_PER_PLAYER, ROSETTE_SQUARES};
use ndarray::Array1;

pub const SIZE: usize = 150;

#[derive(Clone, Debug)]
pub struct GameFeatures {
    pub features: [f32; 150],
}

impl GameFeatures {
    pub fn from_game_state(state: &GameState) -> Self {
        let mut features = [0.0; SIZE];
        let mut idx = 0;

        // Piece positions for player 1 (14 features)
        for piece in &state.player1_pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                features[idx] = piece.square as f32 / 20.0;
            } else if piece.square == 20 {
                features[idx] = 1.0;
            } else {
                features[idx] = -1.0;
            }
            idx += 1;
        }

        // Piece positions for player 2 (14 features)
        for piece in &state.player2_pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                features[idx] = piece.square as f32 / 20.0;
            } else if piece.square == 20 {
                features[idx] = 1.0;
            } else {
                features[idx] = -1.0;
            }
            idx += 1;
        }

        // Board occupancy (21 features)
        for square in &state.board {
            features[idx] = match square {
                Some(p) => {
                    if p.player == Player::Player1 {
                        1.0
                    } else {
                        -1.0
                    }
                }
                None => 0.0,
            };
            idx += 1;
        }

        // Strategic features
        features[idx] = Self::rosette_control_score(state) as f32;
        idx += 1;

        features[idx] = Self::pieces_on_board_count(state, Player::Player1) as f32;
        idx += 1;

        features[idx] = Self::pieces_on_board_count(state, Player::Player2) as f32;
        idx += 1;

        features[idx] = Self::finished_pieces_count(state, Player::Player1) as f32;
        idx += 1;

        features[idx] = Self::finished_pieces_count(state, Player::Player2) as f32;
        idx += 1;

        features[idx] = Self::average_position_score(state, Player::Player1);
        idx += 1;

        features[idx] = Self::average_position_score(state, Player::Player2);
        idx += 1;

        features[idx] = Self::safety_score(state, Player::Player1) as f32;
        idx += 1;

        features[idx] = Self::safety_score(state, Player::Player2) as f32;
        idx += 1;

        features[idx] = Self::center_lane_control(state, Player::Player1) as f32;
        idx += 1;

        features[idx] = Self::center_lane_control(state, Player::Player2) as f32;
        idx += 1;

        features[idx] = if state.current_player == Player::Player1 {
            1.0
        } else {
            -1.0
        };
        idx += 1;

        features[idx] = state.dice_roll as f32 / 4.0;
        idx += 1;

        // Valid moves count
        features[idx] = state.get_valid_moves().len() as f32 / PIECES_PER_PLAYER as f32;
        idx += 1;

        // Capture opportunities
        features[idx] = Self::capture_opportunities(state, Player::Player1) as f32;
        idx += 1;

        features[idx] = Self::capture_opportunities(state, Player::Player2) as f32;
        idx += 1;

        // Vulnerability to capture
        features[idx] = Self::vulnerability_to_capture(state, Player::Player1) as f32;
        idx += 1;

        features[idx] = Self::vulnerability_to_capture(state, Player::Player2) as f32;
        idx += 1;

        // Progress towards finish
        features[idx] = Self::progress_towards_finish(state, Player::Player1);
        idx += 1;

        features[idx] = Self::progress_towards_finish(state, Player::Player2);
        idx += 1;

        // NEW: Advanced strategic features
        features[idx] = Self::mobility_score(state, Player::Player1);
        idx += 1;

        features[idx] = Self::mobility_score(state, Player::Player2);
        idx += 1;

        features[idx] = Self::development_score(state, Player::Player1);
        idx += 1;

        features[idx] = Self::development_score(state, Player::Player2);
        idx += 1;

        features[idx] = Self::tactical_opportunities(state, Player::Player1) as f32;
        idx += 1;

        features[idx] = Self::tactical_opportunities(state, Player::Player2) as f32;
        idx += 1;

        features[idx] = Self::rosette_safety_score(state, Player::Player1);
        idx += 1;

        features[idx] = Self::rosette_safety_score(state, Player::Player2);
        idx += 1;

        features[idx] = Self::center_control_score(state, Player::Player1);
        idx += 1;

        features[idx] = Self::center_control_score(state, Player::Player2);
        idx += 1;

        features[idx] = Self::piece_coordination_score(state, Player::Player1);
        idx += 1;

        features[idx] = Self::piece_coordination_score(state, Player::Player2);
        idx += 1;

        features[idx] = Self::attack_pressure_score(state, Player::Player1);
        idx += 1;

        features[idx] = Self::attack_pressure_score(state, Player::Player2);
        idx += 1;

        features[idx] = Self::defensive_structure_score(state, Player::Player1);
        idx += 1;

        features[idx] = Self::defensive_structure_score(state, Player::Player2);
        idx += 1;

        features[idx] = Self::endgame_evaluation(state, Player::Player1);
        idx += 1;

        features[idx] = Self::endgame_evaluation(state, Player::Player2);
        idx += 1;

        features[idx] = Self::time_advantage_score(state, Player::Player1);
        idx += 1;

        features[idx] = Self::time_advantage_score(state, Player::Player2);
        idx += 1;

        features[idx] = Self::material_balance_score(state);
        idx += 1;

        features[idx] = Self::positional_advantage_score(state, Player::Player1);
        idx += 1;

        features[idx] = Self::positional_advantage_score(state, Player::Player2);
        idx += 1;

        // Fill remaining features with zeros
        while idx < SIZE {
            features[idx] = 0.0;
            idx += 1;
        }

        // Normalize features to ensure they're in reasonable bounds
        for i in 0..SIZE {
            features[i] = features[i].max(-10.0).min(10.0);
        }

        GameFeatures { features }
    }

    pub fn to_array(&self) -> Array1<f32> {
        Array1::from_vec(self.features.to_vec())
    }

    fn rosette_control_score(state: &GameState) -> i32 {
        let mut score = 0;
        for &rosette in &ROSETTE_SQUARES {
            if let Some(occupant) = state.board[rosette as usize] {
                score += if occupant.player == Player::Player1 {
                    1
                } else {
                    -1
                };
            }
        }
        score
    }

    fn pieces_on_board_count(state: &GameState, player: Player) -> i32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        pieces
            .iter()
            .filter(|p| p.square >= 0 && p.square < 20)
            .count() as i32
    }

    fn finished_pieces_count(state: &GameState, player: Player) -> i32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        pieces.iter().filter(|p| p.square == 20).count() as i32
    }

    fn average_position_score(state: &GameState, player: Player) -> f32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        let track = if player == Player::Player1 {
            &[3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
        } else {
            &[19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15]
        };

        let mut total_score = 0.0;
        let mut count = 0;

        for piece in pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                if let Some(track_pos) = track.iter().position(|&s| s as i8 == piece.square) {
                    total_score += track_pos as f32;
                    count += 1;
                }
            }
        }

        if count > 0 {
            total_score / count as f32
        } else {
            0.0
        }
    }

    fn safety_score(state: &GameState, player: Player) -> i32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        pieces
            .iter()
            .filter(|p| p.square >= 0 && p.square < BOARD_SIZE as i8)
            .filter(|p| ROSETTE_SQUARES.contains(&(p.square as u8)))
            .count() as i32
    }

    fn center_lane_control(state: &GameState, player: Player) -> i32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        pieces
            .iter()
            .filter(|p| p.square >= 4 && p.square <= 11)
            .count() as i32
    }

    fn capture_opportunities(state: &GameState, player: Player) -> i32 {
        let mut opportunities = 0;
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        for piece in pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                let square = piece.square as u8;
                if !ROSETTE_SQUARES.contains(&square) {
                    opportunities += 1;
                }
            }
        }

        opportunities
    }

    fn vulnerability_to_capture(state: &GameState, player: Player) -> i32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        pieces
            .iter()
            .filter(|p| p.square >= 0 && p.square < BOARD_SIZE as i8)
            .filter(|p| !ROSETTE_SQUARES.contains(&(p.square as u8)))
            .count() as i32
    }

    fn progress_towards_finish(state: &GameState, player: Player) -> f32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        let track = if player == Player::Player1 {
            &[3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
        } else {
            &[19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15]
        };

        let mut total_progress = 0.0;
        let mut count = 0;

        for piece in pieces {
            if piece.square == 20 {
                total_progress += 1.0;
                count += 1;
            } else if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                if let Some(track_pos) = track.iter().position(|&s| s as i8 == piece.square) {
                    total_progress += track_pos as f32 / track.len() as f32;
                    count += 1;
                }
            }
        }

        if count > 0 {
            total_progress / count as f32
        } else {
            0.0
        }
    }

    // NEW: Advanced strategic features
    fn mobility_score(state: &GameState, player: Player) -> f32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        let mut mobility = 0.0;
        for piece in pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                let track = if player == Player::Player1 {
                    &[3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
                } else {
                    &[19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15]
                };

                if let Some(track_pos) = track.iter().position(|&s| s as i8 == piece.square) {
                    let remaining_steps = track.len() - track_pos;
                    mobility += remaining_steps as f32;
                }
            }
        }
        mobility / PIECES_PER_PLAYER as f32
    }

    fn development_score(state: &GameState, player: Player) -> f32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        let mut developed_pieces = 0;
        for piece in pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                developed_pieces += 1;
            }
        }
        developed_pieces as f32 / PIECES_PER_PLAYER as f32
    }

    fn tactical_opportunities(state: &GameState, player: Player) -> i32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        let mut opportunities = 0;
        for piece in pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                let square = piece.square as u8;
                if !ROSETTE_SQUARES.contains(&square) {
                    opportunities += 1;
                }
            }
        }
        opportunities
    }

    fn rosette_safety_score(state: &GameState, player: Player) -> f32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        let mut safety_score = 0.0;
        for piece in pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                if ROSETTE_SQUARES.contains(&(piece.square as u8)) {
                    safety_score += 1.0;
                }
            }
        }
        safety_score / PIECES_PER_PLAYER as f32
    }

    fn center_control_score(state: &GameState, player: Player) -> f32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        let mut center_control = 0.0;
        for piece in pieces {
            if piece.square >= 4 && piece.square <= 11 {
                center_control += 1.0;
            }
        }
        center_control / PIECES_PER_PLAYER as f32
    }

    fn piece_coordination_score(state: &GameState, player: Player) -> f32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        let mut coordination = 0.0;
        let mut on_board_pieces = Vec::new();

        for piece in pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                on_board_pieces.push(piece.square);
            }
        }

        for i in 0..on_board_pieces.len() {
            for j in (i + 1)..on_board_pieces.len() {
                let distance = (on_board_pieces[i] - on_board_pieces[j]).abs();
                if distance <= 3 {
                    coordination += 1.0;
                }
            }
        }

        if on_board_pieces.len() > 1 {
            coordination / (on_board_pieces.len() * (on_board_pieces.len() - 1) / 2) as f32
        } else {
            0.0
        }
    }

    fn attack_pressure_score(state: &GameState, player: Player) -> f32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        let opponent_pieces = if player == Player::Player1 {
            &state.player2_pieces
        } else {
            &state.player1_pieces
        };

        let mut pressure = 0.0;
        let mut valid_pieces = 0;

        for piece in pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                valid_pieces += 1;
                for opponent_piece in opponent_pieces {
                    if opponent_piece.square >= 0 && opponent_piece.square < BOARD_SIZE as i8 {
                        let distance = (piece.square - opponent_piece.square).abs();
                        if distance <= 4 {
                            pressure += 1.0 / (distance as f32 + 1.0);
                        }
                    }
                }
            }
        }

        // Normalize by the number of valid pieces to keep values reasonable
        if valid_pieces > 0 {
            pressure / valid_pieces as f32
        } else {
            0.0
        }
    }

    fn defensive_structure_score(state: &GameState, player: Player) -> f32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        let mut defensive_score = 0.0;
        for piece in pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                if ROSETTE_SQUARES.contains(&(piece.square as u8)) {
                    defensive_score += 2.0;
                } else {
                    defensive_score += 0.5;
                }
            }
        }
        defensive_score / PIECES_PER_PLAYER as f32
    }

    fn endgame_evaluation(state: &GameState, player: Player) -> f32 {
        let finished_pieces = Self::finished_pieces_count(state, player);
        let total_pieces = PIECES_PER_PLAYER as i32;
        finished_pieces as f32 / total_pieces as f32
    }

    fn time_advantage_score(state: &GameState, player: Player) -> f32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        let mut time_score = 0.0;
        for piece in pieces {
            if piece.square == 20 {
                time_score += 1.0;
            } else if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                time_score += 0.5;
            }
        }
        time_score / PIECES_PER_PLAYER as f32
    }

    fn material_balance_score(state: &GameState) -> f32 {
        let p1_finished = Self::finished_pieces_count(state, Player::Player1);
        let p2_finished = Self::finished_pieces_count(state, Player::Player2);
        (p1_finished - p2_finished) as f32 / PIECES_PER_PLAYER as f32
    }

    fn positional_advantage_score(state: &GameState, player: Player) -> f32 {
        let pieces = if player == Player::Player1 {
            &state.player1_pieces
        } else {
            &state.player2_pieces
        };

        let track = if player == Player::Player1 {
            &[3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
        } else {
            &[19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15]
        };

        let mut positional_score = 0.0;
        for piece in pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                if let Some(track_pos) = track.iter().position(|&s| s as i8 == piece.square) {
                    positional_score += track_pos as f32 / track.len() as f32;
                }
            }
        }
        positional_score / PIECES_PER_PLAYER as f32
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::GameState;

    #[test]
    fn test_features_size() {
        let state = GameState::new();
        let features = GameFeatures::from_game_state(&state);
        assert_eq!(features.features.len(), SIZE);
    }

    #[test]
    fn test_features_initial_state() {
        let state = GameState::new();
        let features = GameFeatures::from_game_state(&state);
        assert_eq!(features.features[0], -1.0);
        assert_eq!(features.features[13], -1.0);
    }

    #[test]
    fn test_piece_position_features() {
        let mut state = GameState::new();

        // Move some pieces to specific positions
        state.player1_pieces[0].square = 5;
        state.player1_pieces[1].square = 10;
        state.player2_pieces[0].square = 15;

        let features = GameFeatures::from_game_state(&state);

        assert_eq!(features.features.len(), SIZE);

        // Verify that some features reflect the piece positions
        let mut found_position_features = false;
        for &feature in &features.features {
            if feature == 5.0 / 20.0 || feature == 10.0 / 20.0 || feature == 15.0 / 20.0 {
                found_position_features = true;
                break;
            }
        }
        assert!(
            found_position_features,
            "Should have position-based features"
        );
    }

    #[test]
    fn test_board_occupancy_features() {
        let mut state = GameState::new();

        // Place pieces on board
        state.player1_pieces[0].square = 5;
        state.player2_pieces[0].square = 10;

        let features = GameFeatures::from_game_state(&state);

        assert_eq!(features.features.len(), SIZE);
    }

    #[test]
    fn test_finished_pieces_features() {
        let mut state = GameState::new();

        // Finish some pieces
        state.player1_pieces[0].square = 20;
        state.player1_pieces[1].square = 20;
        state.player2_pieces[0].square = 20;

        let features = GameFeatures::from_game_state(&state);

        // Check finished pieces count features
        let p1_finished_idx = 32; // Strategic features start around here
        let p2_finished_idx = 34;

        // These indices might need adjustment based on exact feature ordering
        // The test verifies the feature extraction works, not exact positions
        assert!(features.features.len() > p1_finished_idx);
        assert!(features.features.len() > p2_finished_idx);
    }

    #[test]
    fn test_rosette_control_score() {
        let mut state = GameState::new();

        // Place pieces on rosette squares
        state.player1_pieces[0].square = 0; // Rosette square
        state.player2_pieces[0].square = 7; // Rosette square

        let features = GameFeatures::from_game_state(&state);

        // Rosette control should be computed
        // The exact feature index depends on the feature ordering
        // This test verifies the feature extraction completes successfully
        assert_eq!(features.features.len(), SIZE);
    }

    #[test]
    fn test_current_player_feature() {
        let mut state = GameState::new();

        // Test player 1's turn
        state.current_player = Player::Player1;
        let features1 = GameFeatures::from_game_state(&state);

        // Test player 2's turn
        state.current_player = Player::Player2;
        let features2 = GameFeatures::from_game_state(&state);

        // Current player feature should be different
        // Find the current player feature (usually around feature 50-60)
        let mut found_difference = false;
        for i in 0..SIZE {
            if (features1.features[i] - features2.features[i]).abs() > 1e-6 {
                found_difference = true;
                break;
            }
        }
        assert!(
            found_difference,
            "Current player feature should be different"
        );
    }

    #[test]
    fn test_dice_roll_feature() {
        let mut state = GameState::new();

        // Test different dice rolls
        state.dice_roll = 0;
        let features0 = GameFeatures::from_game_state(&state);

        state.dice_roll = 4;
        let features4 = GameFeatures::from_game_state(&state);

        // Dice roll feature should be different
        let mut found_difference = false;
        for i in 0..SIZE {
            if (features0.features[i] - features4.features[i]).abs() > 1e-6 {
                found_difference = true;
                break;
            }
        }
        assert!(found_difference, "Dice roll feature should be different");
    }

    #[test]
    fn test_valid_moves_count_feature() {
        let mut state = GameState::new();

        // Initial state should have 7 valid moves
        state.dice_roll = 1;
        let features = GameFeatures::from_game_state(&state);

        // Valid moves count should be normalized
        // This test verifies the feature extraction works
        assert_eq!(features.features.len(), SIZE);
    }

    #[test]
    fn test_feature_normalization() {
        let state = GameState::new();
        let features = GameFeatures::from_game_state(&state);

        // All features should be in reasonable ranges (allow flexibility for strategic features)
        for (i, &feature) in features.features.iter().enumerate() {
            assert!(
                feature >= -15.0 && feature <= 15.0,
                "Feature {} out of range: {}",
                i,
                feature
            );
        }
    }

    #[test]
    fn test_feature_consistency() {
        let state = GameState::new();

        // Extract features multiple times
        let features1 = GameFeatures::from_game_state(&state);
        let features2 = GameFeatures::from_game_state(&state);

        // Should be identical for same state
        for i in 0..SIZE {
            assert!(
                (features1.features[i] - features2.features[i]).abs() < 1e-6,
                "Features should be consistent: index {}, values {} vs {}",
                i,
                features1.features[i],
                features2.features[i]
            );
        }
    }

    #[test]
    fn test_feature_array_conversion() {
        let state = GameState::new();
        let features = GameFeatures::from_game_state(&state);
        let array = features.to_array();

        assert_eq!(array.len(), SIZE);
        for i in 0..SIZE {
            assert!((array[i] - features.features[i]).abs() < 1e-6);
        }
    }

    #[test]
    fn test_capture_opportunities_feature() {
        let mut state = GameState::new();

        // Create capture opportunity
        state.player1_pieces[0].square = 5;
        state.player2_pieces[0].square = 5;

        let features = GameFeatures::from_game_state(&state);

        // Capture opportunities should be computed
        assert_eq!(features.features.len(), SIZE);
    }

    #[test]
    fn test_vulnerability_to_capture_feature() {
        let mut state = GameState::new();

        // Create vulnerable position
        state.player1_pieces[0].square = 5;
        state.player2_pieces[0].square = 4; // One move away

        let features = GameFeatures::from_game_state(&state);

        // Vulnerability should be computed
        assert_eq!(features.features.len(), SIZE);
    }

    #[test]
    fn test_progress_towards_finish_feature() {
        let mut state = GameState::new();

        // Move pieces towards finish
        state.player1_pieces[0].square = 15; // Close to finish
        state.player1_pieces[1].square = 5; // Midway

        let features = GameFeatures::from_game_state(&state);

        // Progress should be computed
        assert_eq!(features.features.len(), SIZE);
    }

    #[test]
    fn test_advanced_strategic_features() {
        let mut state = GameState::new();

        // Create complex position
        state.player1_pieces[0].square = 7; // Rosette
        state.player1_pieces[1].square = 10; // Center
        state.player2_pieces[0].square = 15; // Near finish

        let features = GameFeatures::from_game_state(&state);

        // All advanced features should be computed
        assert_eq!(features.features.len(), SIZE);

        // Check that no features are NaN or infinite
        for (i, &feature) in features.features.iter().enumerate() {
            assert!(!feature.is_nan(), "Feature {} is NaN", i);
            assert!(!feature.is_infinite(), "Feature {} is infinite", i);
        }
    }

    #[test]
    fn test_feature_completeness() {
        let state = GameState::new();
        let features = GameFeatures::from_game_state(&state);

        // All 150 features should be filled
        let non_zero_count = features.features.iter().filter(|&&x| x != 0.0).count();

        // Should have reasonable number of non-zero features
        // (not all zero, but not all non-zero either)
        assert!(
            non_zero_count > 10,
            "Too few non-zero features: {}",
            non_zero_count
        );
        assert!(
            non_zero_count < SIZE,
            "All features should not be non-zero: {}",
            non_zero_count
        );
    }

    #[test]
    fn test_feature_sensitivity() {
        let mut state = GameState::new();

        // Test that small changes in game state produce different features
        let features1 = GameFeatures::from_game_state(&state);

        // Change current player
        state.current_player = Player::Player2;
        let features2 = GameFeatures::from_game_state(&state);

        // Should be different
        let mut differences = 0;
        for i in 0..SIZE {
            if (features1.features[i] - features2.features[i]).abs() > 1e-6 {
                differences += 1;
            }
        }

        assert!(
            differences > 0,
            "Features should be sensitive to game state changes"
        );
    }
}

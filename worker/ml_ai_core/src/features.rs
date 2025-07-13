use super::{GameState, Player, BOARD_SIZE, PIECES_PER_PLAYER, ROSETTE_SQUARES};
use ndarray::Array1;

pub const SIZE: usize = 100;

#[derive(Clone, Debug)]
pub struct GameFeatures {
  pub features: [f32; 100],
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

        // Fill remaining features with zeros
        while idx < SIZE {
            features[idx] = 0.0;
            idx += 1;
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
}

#[cfg(test)]
mod tests {
    use super::*;

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

        // All pieces should be off board initially
        for i in 0..14 {
            assert_eq!(features.features[i], -1.0);
        }

        // Board should be empty
        for i in 14..35 {
            assert_eq!(features.features[i], 0.0);
        }
    }
}

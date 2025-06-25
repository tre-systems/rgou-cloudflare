use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// Use `wee_alloc` as the global allocator for smaller binary size
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Bind the `console.log` function from the `console` Web API
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Define a macro to provide `println!`-style logging
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

// JSON input structures matching the TypeScript GameState
#[derive(Deserialize)]
struct JsonGameState {
    #[serde(rename = "player1Pieces")]
    player1_pieces: Vec<JsonPiece>,
    #[serde(rename = "player2Pieces")]
    player2_pieces: Vec<JsonPiece>,
    #[serde(rename = "currentPlayer")]
    current_player: String,
    #[serde(rename = "diceRoll")]
    dice_roll: Option<u8>,
}

#[derive(Deserialize)]
struct JsonPiece {
    square: i8,
    player: String,
}

// Game constants
const PIECES_PER_PLAYER: usize = 7;
const BOARD_SIZE: usize = 20;
const ROSETTE_SQUARES: [u8; 3] = [4, 8, 14];
const PLAYER1_TRACK: [u8; 16] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const PLAYER2_TRACK: [u8; 16] = [16, 17, 18, 19, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Player {
    Player1 = 0,
    Player2 = 1,
}

#[derive(Clone, Copy, Debug)]
pub struct PiecePosition {
    square: i8, // -1 for start, 0-19 for board, 20 for finished
    player: Player,
}

#[derive(Clone)]
pub struct GameState {
    board: [Option<PiecePosition>; BOARD_SIZE],
    player1_pieces: [PiecePosition; PIECES_PER_PLAYER],
    player2_pieces: [PiecePosition; PIECES_PER_PLAYER],
    current_player: Player,
    dice_roll: u8,
}

impl GameState {
    pub fn new() -> Self {
        GameState {
            board: [None; BOARD_SIZE],
            player1_pieces: [PiecePosition {
                square: -1,
                player: Player::Player1,
            }; PIECES_PER_PLAYER],
            player2_pieces: [PiecePosition {
                square: -1,
                player: Player::Player2,
            }; PIECES_PER_PLAYER],
            current_player: Player::Player1,
            dice_roll: 0,
        }
    }

    pub fn get_pieces(&self, player: Player) -> &[PiecePosition] {
        match player {
            Player::Player1 => &self.player1_pieces,
            Player::Player2 => &self.player2_pieces,
        }
    }

    pub fn get_pieces_mut(&mut self, player: Player) -> &mut [PiecePosition] {
        match player {
            Player::Player1 => &mut self.player1_pieces,
            Player::Player2 => &mut self.player2_pieces,
        }
    }

    pub fn get_player_track(player: Player) -> &'static [u8] {
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

            // Check if move is valid
            if new_track_pos >= track.len() as i8 {
                // Finishing move - only valid if exact
                if new_track_pos == track.len() as i8 {
                    valid_moves.push(i as u8);
                }
            } else {
                let new_actual_pos = track[new_track_pos as usize];
                let occupant = self.board[new_actual_pos as usize];

                // Can move if square is empty, or occupied by opponent (and not on rosette)
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

    pub fn make_move(&mut self, piece_index: u8) -> Result<bool, &'static str> {
        if piece_index >= PIECES_PER_PLAYER as u8 {
            return Err("Invalid piece index");
        }

        let track = Self::get_player_track(self.current_player);
        let dice_roll = self.dice_roll;
        let current_player = self.current_player;

        // Get the piece's current position
        let old_square = match current_player {
            Player::Player1 => self.player1_pieces[piece_index as usize].square,
            Player::Player2 => self.player2_pieces[piece_index as usize].square,
        };

        let current_track_pos = if old_square == -1 {
            -1
        } else {
            track
                .iter()
                .position(|&square| square as i8 == old_square)
                .map(|pos| pos as i8)
                .unwrap_or(-1)
        };

        let new_track_pos = current_track_pos + dice_roll as i8;

        // Remove piece from old position
        if old_square >= 0 && old_square < BOARD_SIZE as i8 {
            self.board[old_square as usize] = None;
        }

        // Check if finishing
        if new_track_pos >= track.len() as i8 {
            // Finishing move
            match current_player {
                Player::Player1 => self.player1_pieces[piece_index as usize].square = 20,
                Player::Player2 => self.player2_pieces[piece_index as usize].square = 20,
            }
        } else {
            let new_actual_pos = track[new_track_pos as usize];
            let occupant = self.board[new_actual_pos as usize];

            // If there's an opponent piece, send it back to start
            if let Some(opp_piece) = occupant {
                if opp_piece.player != current_player {
                    match opp_piece.player {
                        Player::Player1 => {
                            for piece in &mut self.player1_pieces {
                                if piece.square == new_actual_pos as i8 {
                                    piece.square = -1;
                                    break;
                                }
                            }
                        }
                        Player::Player2 => {
                            for piece in &mut self.player2_pieces {
                                if piece.square == new_actual_pos as i8 {
                                    piece.square = -1;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            // Place piece in new position
            let new_piece = PiecePosition {
                square: new_actual_pos as i8,
                player: current_player,
            };

            match current_player {
                Player::Player1 => self.player1_pieces[piece_index as usize] = new_piece,
                Player::Player2 => self.player2_pieces[piece_index as usize] = new_piece,
            }

            self.board[new_actual_pos as usize] = Some(new_piece);
        }

        // Check for win condition
        let finished_pieces = match current_player {
            Player::Player1 => self
                .player1_pieces
                .iter()
                .filter(|p| p.square == 20)
                .count(),
            Player::Player2 => self
                .player2_pieces
                .iter()
                .filter(|p| p.square == 20)
                .count(),
        };

        if finished_pieces == PIECES_PER_PLAYER {
            return Ok(true); // Game won
        }

        // Determine next player (stay if landed on rosette)
        let landed_on_rosette =
            new_track_pos < track.len() as i8 && Self::is_rosette(track[new_track_pos as usize]);

        if !landed_on_rosette {
            self.current_player = match self.current_player {
                Player::Player1 => Player::Player2,
                Player::Player2 => Player::Player1,
            };
        }

        Ok(false) // Game continues
    }

    // Evaluate game state for AI (positive = good for player2, negative = good for player1)
    pub fn evaluate(&self) -> i32 {
        let mut score = 0i32;

        // Count finished pieces
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

        // Heavily weight finished pieces
        score += (p2_finished - p1_finished) * 1000;

        // Win condition
        if p1_finished == PIECES_PER_PLAYER as i32 {
            return -10000;
        }
        if p2_finished == PIECES_PER_PLAYER as i32 {
            return 10000;
        }

        // Evaluate piece positions
        let mut p1_position_score = 0i32;
        let mut p2_position_score = 0i32;

        for piece in &self.player1_pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                let track = Self::get_player_track(Player::Player1);
                if let Some(pos) = track
                    .iter()
                    .position(|&square| square as i8 == piece.square)
                {
                    p1_position_score += pos as i32 + 1;
                }
            }
        }

        for piece in &self.player2_pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                let track = Self::get_player_track(Player::Player2);
                if let Some(pos) = track
                    .iter()
                    .position(|&square| square as i8 == piece.square)
                {
                    p2_position_score += pos as i32 + 1;
                }
            }
        }

        score += (p2_position_score - p1_position_score) * 10;
        score
    }
}

pub struct AI;

impl AI {
    const MAX_DEPTH: u8 = 6;

    pub fn get_best_move(state: &GameState) -> u8 {
        let valid_moves = state.get_valid_moves();

        console_log!("[Rust AI] Valid moves: {:?}", valid_moves);

        if valid_moves.is_empty() {
            return 0;
        }
        if valid_moves.len() == 1 {
            return valid_moves[0];
        }

        let mut best_move = valid_moves[0];
        let mut best_score = i32::MIN;

        for &move_idx in &valid_moves {
            let mut test_state = state.clone();
            let _ = test_state.make_move(move_idx);

            // Simulate dice rolls for next turn
            let mut score = 0i32;
            let mut roll_count = 0u8;

            for dice_roll in 0..5 {
                test_state.dice_roll = dice_roll;
                let move_score =
                    Self::minimax(&test_state, Self::MAX_DEPTH - 1, false, i32::MIN, i32::MAX);
                score += move_score;
                roll_count += 1;
            }

            score /= roll_count as i32;

            if score > best_score {
                best_score = score;
                best_move = move_idx;
            }
        }

        console_log!(
            "[Rust AI] Best move: {} with avg score: {}",
            best_move,
            best_score
        );
        best_move
    }

    fn minimax(
        state: &GameState,
        depth: u8,
        is_maximizing: bool,
        mut alpha: i32,
        mut beta: i32,
    ) -> i32 {
        if depth == 0 {
            return state.evaluate();
        }

        let valid_moves = state.get_valid_moves();

        if valid_moves.is_empty() {
            // No moves available, evaluate current position
            return state.evaluate();
        }

        if is_maximizing {
            let mut max_eval = i32::MIN;

            for &move_idx in &valid_moves {
                let mut test_state = state.clone();
                match test_state.make_move(move_idx) {
                    Ok(game_won) => {
                        if game_won {
                            return match test_state.current_player {
                                Player::Player2 => 10000,
                                Player::Player1 => -10000,
                            };
                        }
                    }
                    Err(_) => continue,
                }

                let eval_score = Self::minimax(&test_state, depth - 1, false, alpha, beta);
                max_eval = max_eval.max(eval_score);
                alpha = alpha.max(eval_score);

                if beta <= alpha {
                    break; // Alpha-beta pruning
                }
            }

            max_eval
        } else {
            let mut min_eval = i32::MAX;

            for &move_idx in &valid_moves {
                let mut test_state = state.clone();
                match test_state.make_move(move_idx) {
                    Ok(game_won) => {
                        if game_won {
                            return match test_state.current_player {
                                Player::Player1 => -10000,
                                Player::Player2 => 10000,
                            };
                        }
                    }
                    Err(_) => continue,
                }

                let eval_score = Self::minimax(&test_state, depth - 1, true, alpha, beta);
                min_eval = min_eval.min(eval_score);
                beta = beta.min(eval_score);

                if beta <= alpha {
                    break; // Alpha-beta pruning
                }
            }

            min_eval
        }
    }
}

// WASM exports
#[wasm_bindgen]
pub struct RustGameState {
    inner: GameState,
}

#[wasm_bindgen]
impl RustGameState {
    #[wasm_bindgen(constructor)]
    pub fn new() -> RustGameState {
        RustGameState {
            inner: GameState::new(),
        }
    }

    pub fn update_game_state(
        &mut self,
        p1_squares: &[i8],
        p2_squares: &[i8],
        current_player: u8,
        dice_roll: u8,
    ) {
        self.inner.dice_roll = dice_roll;
        self.inner.current_player = match current_player {
            0 => Player::Player1,
            _ => Player::Player2,
        };

        // Clear board
        self.inner.board = [None; BOARD_SIZE];

        // Update player 1 pieces
        for (i, &square_val) in p1_squares.iter().enumerate().take(PIECES_PER_PLAYER) {
            self.inner.player1_pieces[i] = PiecePosition {
                square: square_val,
                player: Player::Player1,
            };
            if square_val >= 0 && (square_val as usize) < BOARD_SIZE {
                self.inner.board[square_val as usize] = Some(self.inner.player1_pieces[i]);
            }
        }

        // Update player 2 pieces
        for (i, &square_val) in p2_squares.iter().enumerate().take(PIECES_PER_PLAYER) {
            self.inner.player2_pieces[i] = PiecePosition {
                square: square_val,
                player: Player::Player2,
            };
            if square_val >= 0 && (square_val as usize) < BOARD_SIZE {
                self.inner.board[square_val as usize] = Some(self.inner.player2_pieces[i]);
            }
        }
    }

    pub fn get_ai_move(&self) -> u8 {
        AI::get_best_move(&self.inner)
    }

    pub fn evaluate_position(&self) -> i32 {
        self.inner.evaluate()
    }
}

// Initialize the module
#[wasm_bindgen(start)]
pub fn main() {
    console_log!("Rust WASM module initialized");
}

// Simple JSON-based WASM API
#[wasm_bindgen]
pub fn get_ai_move_from_json(game_state_json: &str) -> u8 {
    match serde_json::from_str::<JsonGameState>(game_state_json) {
        Ok(json_state) => {
            console_log!("[Rust AI] Processing JSON game state");

            // Convert JSON to internal game state
            let mut game_state = GameState::new();

            // Set current player and dice roll
            game_state.current_player = if json_state.current_player == "player1" {
                Player::Player1
            } else {
                Player::Player2
            };
            game_state.dice_roll = json_state.dice_roll.unwrap_or(0);

            // Convert pieces and populate board
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

            // Get AI move
            let best_move = AI::get_best_move(&game_state);
            console_log!("[Rust AI] Selected move: {}", best_move);
            best_move
        }
        Err(e) => {
            console_log!("[Rust AI] JSON parse error: {}", e.to_string());
            0 // Default move on error
        }
    }
}

#[wasm_bindgen]
pub fn evaluate_position_from_json(game_state_json: &str) -> i32 {
    match serde_json::from_str::<JsonGameState>(game_state_json) {
        Ok(json_state) => {
            let mut game_state = GameState::new();

            // Convert JSON to internal game state (same logic as above)
            game_state.current_player = if json_state.current_player == "player1" {
                Player::Player1
            } else {
                Player::Player2
            };

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

            game_state.evaluate()
        }
        Err(_) => 0,
    }
}

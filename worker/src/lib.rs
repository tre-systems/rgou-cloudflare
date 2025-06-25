use serde::{Deserialize, Serialize};
use worker::*;

// Game constants
const PIECES_PER_PLAYER: usize = 7;
const BOARD_SIZE: usize = 20;
const ROSETTE_SQUARES: [u8; 3] = [4, 8, 14];
const PLAYER1_TRACK: [u8; 16] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const PLAYER2_TRACK: [u8; 16] = [16, 17, 18, 19, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

#[derive(Clone, Copy, Debug, PartialEq)]
enum Player {
    Player1 = 0,
    Player2 = 1,
}

#[derive(Clone, Copy, Debug)]
struct PiecePosition {
    square: i8,
    player: Player,
}

#[derive(Clone)]
struct GameState {
    board: [Option<PiecePosition>; BOARD_SIZE],
    player1_pieces: [PiecePosition; PIECES_PER_PLAYER],
    player2_pieces: [PiecePosition; PIECES_PER_PLAYER],
    current_player: Player,
    dice_roll: u8,
}

impl GameState {
    fn new() -> Self {
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

    fn get_pieces(&self, player: Player) -> &[PiecePosition] {
        match player {
            Player::Player1 => &self.player1_pieces,
            Player::Player2 => &self.player2_pieces,
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

    fn get_valid_moves(&self) -> Vec<u8> {
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

    fn evaluate(&self) -> i32 {
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

        score += (p2_finished - p1_finished) * 1000;

        if p1_finished == PIECES_PER_PLAYER as i32 {
            return -10000;
        }
        if p2_finished == PIECES_PER_PLAYER as i32 {
            return 10000;
        }

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

    fn make_move(&mut self, piece_index: u8) -> bool {
        if piece_index >= PIECES_PER_PLAYER as u8 {
            return false;
        }

        let track = Self::get_player_track(self.current_player);
        let dice_roll = self.dice_roll;
        let current_player = self.current_player;

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

        if old_square >= 0 && old_square < BOARD_SIZE as i8 {
            self.board[old_square as usize] = None;
        }

        if new_track_pos >= track.len() as i8 {
            match current_player {
                Player::Player1 => self.player1_pieces[piece_index as usize].square = 20,
                Player::Player2 => self.player2_pieces[piece_index as usize].square = 20,
            }
        } else {
            let new_actual_pos = track[new_track_pos as usize];
            let occupant = self.board[new_actual_pos as usize];

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
            return true; // Game won
        }

        let landed_on_rosette =
            new_track_pos < track.len() as i8 && Self::is_rosette(track[new_track_pos as usize]);

        if !landed_on_rosette {
            self.current_player = match self.current_player {
                Player::Player1 => Player::Player2,
                Player::Player2 => Player::Player1,
            };
        }

        false // Game continues
    }
}

struct AI;

impl AI {
    const MAX_DEPTH: u8 = 6;

    fn get_best_move(state: &GameState) -> u8 {
        let valid_moves = state.get_valid_moves();

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
            let won = test_state.make_move(move_idx);

            if won {
                return move_idx; // Winning move - take it immediately
            }

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
            return state.evaluate();
        }

        if is_maximizing {
            let mut max_eval = i32::MIN;

            for &move_idx in &valid_moves {
                let mut test_state = state.clone();
                let game_won = test_state.make_move(move_idx);

                if game_won {
                    return match test_state.current_player {
                        Player::Player2 => 10000,
                        Player::Player1 => -10000,
                    };
                }

                let eval_score = Self::minimax(&test_state, depth - 1, false, alpha, beta);
                max_eval = max_eval.max(eval_score);
                alpha = alpha.max(eval_score);

                if beta <= alpha {
                    break;
                }
            }

            max_eval
        } else {
            let mut min_eval = i32::MAX;

            for &move_idx in &valid_moves {
                let mut test_state = state.clone();
                let game_won = test_state.make_move(move_idx);

                if game_won {
                    return match test_state.current_player {
                        Player::Player1 => -10000,
                        Player::Player2 => 10000,
                    };
                }

                let eval_score = Self::minimax(&test_state, depth - 1, true, alpha, beta);
                min_eval = min_eval.min(eval_score);
                beta = beta.min(eval_score);

                if beta <= alpha {
                    break;
                }
            }

            min_eval
        }
    }
}

// JSON input structures
#[derive(Deserialize)]
struct GameStateRequest {
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
}

#[derive(Serialize)]
struct AIResponse {
    r#move: u8,
    evaluation: i32,
    thinking: String,
    timings: Timings,
}

#[derive(Serialize)]
struct Timings {
    #[serde(rename = "aiMoveCalculation")]
    ai_move_calculation: u32,
    #[serde(rename = "totalHandlerTime")]
    total_handler_time: u32,
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    timestamp: String,
    version: String,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    message: Option<String>,
}

// CORS headers for all responses
fn cors_headers() -> Headers {
    let mut headers = Headers::new();
    headers.set("Access-Control-Allow-Origin", "*").unwrap();
    headers
        .set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .unwrap();
    headers
        .set(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization",
        )
        .unwrap();
    headers.set("Content-Type", "application/json").unwrap();
    headers
}

fn convert_json_to_game_state(json_state: GameStateRequest) -> GameState {
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

    game_state
}

#[event(fetch)]
pub async fn main(mut req: Request, _env: Env, _ctx: worker::Context) -> Result<Response> {
    console_error_panic_hook::set_once();

    let url = req.url()?;
    console_log!("[Rust Worker] {} {}", req.method(), url.path());

    // Handle CORS preflight
    if req.method() == Method::Options {
        return Ok(Response::empty()?.with_headers(cors_headers()));
    }

    // No authentication needed for a game AI service

    let start_time = Date::now().as_millis();

    match (req.method(), url.path()) {
        (Method::Post, "/ai-move") => {
            let game_state_request: GameStateRequest = req.json().await?;

            if game_state_request.current_player != "player2" {
                let error = ErrorResponse {
                    error: "Not AI turn".to_string(),
                    message: None,
                };
                return Ok(Response::from_json(&error)?
                    .with_status(400)
                    .with_headers(cors_headers()));
            }

            let ai_start = Date::now().as_millis();
            let game_state = convert_json_to_game_state(game_state_request);
            let ai_move = AI::get_best_move(&game_state);
            let evaluation = game_state.evaluate();
            let ai_end = Date::now().as_millis();
            let end_time = Date::now().as_millis();

            let response = AIResponse {
                r#move: ai_move,
                evaluation,
                thinking: "Pure Rust AI has decided.".to_string(),
                timings: Timings {
                    ai_move_calculation: (ai_end - ai_start) as u32,
                    total_handler_time: (end_time - start_time) as u32,
                },
            };

            Ok(Response::from_json(&response)?.with_headers(cors_headers()))
        }

        (Method::Get, "/health") => {
            let response = HealthResponse {
                status: "healthy".to_string(),
                timestamp: Date::now().to_string(),
                version: "2.0.0-pure-rust".to_string(),
            };

            Ok(Response::from_json(&response)?.with_headers(cors_headers()))
        }

        _ => Ok(Response::error("Not found", 404)?.with_headers(cors_headers())),
    }
}

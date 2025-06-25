use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use worker::*;

// Game constants
const PIECES_PER_PLAYER: usize = 7;
const BOARD_SIZE: usize = 20;
const ROSETTE_SQUARES: [u8; 5] = [0, 7, 13, 15, 16];
const PLAYER1_TRACK: [u8; 16] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const PLAYER2_TRACK: [u8; 16] = [16, 17, 18, 19, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// Evaluation constants
const WIN_SCORE: i32 = 10000;
const FINISHED_PIECE_VALUE: i32 = 1000;
const POSITION_WEIGHT: i32 = 15;
const SAFETY_BONUS: i32 = 25;
const BLOCKING_BONUS: i32 = 30;
const ROSETTE_CONTROL_BONUS: i32 = 40;
const ADVANCEMENT_BONUS: i32 = 5;

// Dice probabilities for Royal Game of Ur (4 binary dice)
// 0: 1/16, 1: 4/16, 2: 6/16, 3: 4/16, 4: 1/16
const DICE_PROBABILITIES: [f32; 5] = [1.0 / 16.0, 4.0 / 16.0, 6.0 / 16.0, 4.0 / 16.0, 1.0 / 16.0];

#[derive(Clone, Copy, Debug, PartialEq)]
enum Player {
    Player1 = 0,
    Player2 = 1,
}

impl Player {
    fn opponent(self) -> Player {
        match self {
            Player::Player1 => Player::Player2,
            Player::Player2 => Player::Player1,
        }
    }
}

#[derive(Clone, Copy, Debug)]
struct PiecePosition {
    square: i8,
    player: Player,
}

#[derive(Clone, Debug)]
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

    fn get_pieces_mut(&mut self, player: Player) -> &mut [PiecePosition] {
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

    // Enhanced evaluation function with strategic considerations
    fn evaluate(&self) -> i32 {
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

        // Game-ending conditions
        if p1_finished == PIECES_PER_PLAYER as i32 {
            return -WIN_SCORE;
        }
        if p2_finished == PIECES_PER_PLAYER as i32 {
            return WIN_SCORE;
        }

        // Finished pieces advantage
        score += (p2_finished - p1_finished) * FINISHED_PIECE_VALUE;

        // Advanced piece positioning and strategic bonuses
        let (p1_pos_score, p1_strategic_score) = self.evaluate_player_position(Player::Player1);
        let (p2_pos_score, p2_strategic_score) = self.evaluate_player_position(Player::Player2);

        score += (p2_pos_score - p1_pos_score) * POSITION_WEIGHT / 10;
        score += p2_strategic_score - p1_strategic_score;

        // Control of key squares
        score += self.evaluate_board_control();

        score
    }

    fn evaluate_player_position(&self, player: Player) -> (i32, i32) {
        let pieces = self.get_pieces(player);
        let track = Self::get_player_track(player);
        let mut position_score = 0i32;
        let mut strategic_score = 0i32;

        for piece in pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                if let Some(track_pos) = track
                    .iter()
                    .position(|&square| square as i8 == piece.square)
                {
                    // Base advancement score
                    position_score += track_pos as i32 + 1;

                    // Safety bonus for pieces on rosettes
                    if Self::is_rosette(piece.square as u8) {
                        strategic_score += SAFETY_BONUS;
                    }

                    // Bonus for pieces in the middle section (more valuable)
                    if track_pos >= 4 && track_pos <= 11 {
                        strategic_score += ADVANCEMENT_BONUS;
                    }

                    // Bonus for pieces near the end
                    if track_pos >= 12 {
                        strategic_score += ADVANCEMENT_BONUS * 2;
                    }
                }
            }
        }

        (position_score, strategic_score)
    }

    fn evaluate_board_control(&self) -> i32 {
        let mut control_score = 0i32;

        // Control of rosette squares
        for &rosette in &ROSETTE_SQUARES {
            if let Some(occupant) = self.board[rosette as usize] {
                if occupant.player == Player::Player2 {
                    control_score += ROSETTE_CONTROL_BONUS;
                } else {
                    control_score -= ROSETTE_CONTROL_BONUS;
                }
            }
        }

        // Blocking opportunities
        control_score += self.evaluate_blocking_potential();

        control_score
    }

    fn evaluate_blocking_potential(&self) -> i32 {
        let mut blocking_score = 0i32;

        // Check if AI pieces are blocking human advancement
        for p1_piece in &self.player1_pieces {
            if p1_piece.square >= 4 && p1_piece.square <= 14 {
                // In shared section, check if AI has a piece nearby that could threaten
                for p2_piece in &self.player2_pieces {
                    if p2_piece.square >= 4
                        && p2_piece.square <= 14
                        && (p2_piece.square - p1_piece.square).abs() <= 4
                    {
                        blocking_score += BLOCKING_BONUS / 4;
                    }
                }
            }
        }

        blocking_score
    }

    fn make_move(&mut self, piece_index: u8) -> bool {
        if piece_index >= PIECES_PER_PLAYER as u8 {
            return false;
        }

        let track = Self::get_player_track(self.current_player);
        let dice_roll = self.dice_roll;
        let current_player = self.current_player;

        let old_square = self.get_pieces(current_player)[piece_index as usize].square;

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

        if new_track_pos >= track.len() as i8 {
            // Finishing the piece
            self.get_pieces_mut(current_player)[piece_index as usize].square = 20;
        } else {
            let new_actual_pos = track[new_track_pos as usize];
            let occupant = self.board[new_actual_pos as usize];

            // Handle captures
            if let Some(opp_piece) = occupant {
                if opp_piece.player != current_player {
                    let opponent_pieces = self.get_pieces_mut(opp_piece.player);
                    for piece in opponent_pieces.iter_mut() {
                        if piece.square == new_actual_pos as i8 {
                            piece.square = -1;
                            break;
                        }
                    }
                }
            }

            // Place piece in new position
            let new_piece = PiecePosition {
                square: new_actual_pos as i8,
                player: current_player,
            };

            self.get_pieces_mut(current_player)[piece_index as usize] = new_piece;
            self.board[new_actual_pos as usize] = Some(new_piece);
        }

        // Check for win
        let finished_pieces = self
            .get_pieces(current_player)
            .iter()
            .filter(|p| p.square == 20)
            .count();

        if finished_pieces == PIECES_PER_PLAYER {
            return true; // Game won
        }

        // Handle rosette landings
        let landed_on_rosette =
            new_track_pos < track.len() as i8 && Self::is_rosette(track[new_track_pos as usize]);

        if !landed_on_rosette {
            self.current_player = self.current_player.opponent();
        }

        false // Game continues
    }

    // Simple hash for transposition table
    fn hash(&self) -> u64 {
        let mut hash = 0u64;

        // Hash piece positions
        for (i, piece) in self.player1_pieces.iter().enumerate() {
            hash ^= ((piece.square as u64) << (i * 5));
        }
        for (i, piece) in self.player2_pieces.iter().enumerate() {
            hash ^= ((piece.square as u64) << (i * 5 + 35));
        }

        // Hash current player
        if self.current_player == Player::Player2 {
            hash ^= 1u64 << 63;
        }

        hash
    }

    // Validate that the game state is consistent
    fn validate(&self) -> bool {
        // Check board consistency with piece positions
        for (i, square) in self.board.iter().enumerate() {
            if let Some(piece) = square {
                let found_in_pieces = match piece.player {
                    Player::Player1 => self.player1_pieces.iter().any(|p| p.square == i as i8),
                    Player::Player2 => self.player2_pieces.iter().any(|p| p.square == i as i8),
                };
                if !found_in_pieces {
                    return false;
                }
            }
        }

        // Check that pieces on board match board state
        for piece in &self.player1_pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                if let Some(board_piece) = self.board[piece.square as usize] {
                    if board_piece.player != Player::Player1 || board_piece.square != piece.square {
                        return false;
                    }
                }
            }
        }

        for piece in &self.player2_pieces {
            if piece.square >= 0 && piece.square < BOARD_SIZE as i8 {
                if let Some(board_piece) = self.board[piece.square as usize] {
                    if board_piece.player != Player::Player2 || board_piece.square != piece.square {
                        return false;
                    }
                }
            }
        }

        true
    }

    // Get game phase for adaptive evaluation
    fn get_game_phase(&self) -> GamePhase {
        let total_finished = self
            .player1_pieces
            .iter()
            .chain(self.player2_pieces.iter())
            .filter(|p| p.square == 20)
            .count();

        let total_on_board = self
            .player1_pieces
            .iter()
            .chain(self.player2_pieces.iter())
            .filter(|p| p.square >= 0 && p.square < BOARD_SIZE as i8)
            .count();

        if total_on_board <= 4 {
            GamePhase::Opening
        } else if total_finished >= 6 {
            GamePhase::Endgame
        } else {
            GamePhase::Middlegame
        }
    }
}

#[derive(Debug, PartialEq)]
enum GamePhase {
    Opening,
    Middlegame,
    Endgame,
}

struct TranspositionEntry {
    evaluation: i32,
    depth: u8,
    best_move: Option<u8>,
}

struct AI {
    transposition_table: HashMap<u64, TranspositionEntry>,
    nodes_evaluated: u32,
    transposition_hits: u32,
}

impl AI {
    const MAX_DEPTH: u8 = 8; // Increased depth for stronger play
    const TRANSPOSITION_TABLE_SIZE: usize = 10000;

    fn new() -> Self {
        AI {
            transposition_table: HashMap::with_capacity(Self::TRANSPOSITION_TABLE_SIZE),
            nodes_evaluated: 0,
            transposition_hits: 0,
        }
    }

    fn get_best_move(&mut self, state: &GameState, depth: u8) -> (u8, Vec<MoveEvaluation>) {
        let valid_moves = state.get_valid_moves();

        if valid_moves.is_empty() {
            return (0, Vec::new());
        }
        if valid_moves.len() == 1 {
            let move_eval = MoveEvaluation {
                piece_index: valid_moves[0],
                score: 0.0,
                move_type: "only_move".to_string(),
                from_square: state.get_pieces(state.current_player)[valid_moves[0] as usize].square,
                to_square: None,
            };
            return (valid_moves[0], vec![move_eval]);
        }

        // Check for immediate wins first
        for &move_idx in &valid_moves {
            let mut test_state = state.clone();
            if test_state.make_move(move_idx) {
                let win_eval = MoveEvaluation {
                    piece_index: move_idx,
                    score: 10000.0,
                    move_type: "winning_move".to_string(),
                    from_square: state.get_pieces(state.current_player)[move_idx as usize].square,
                    to_square: None,
                };
                return (move_idx, vec![win_eval]); // Winning move - take it immediately
            }
        }

        // Order moves for better alpha-beta pruning
        let mut move_scores: Vec<(u8, f32)> = Vec::new();

        for &move_idx in &valid_moves {
            let mut total_score = 0.0f32;

            // Evaluate across all possible dice outcomes with proper weighting
            for dice_roll in 0..5 {
                let mut test_state = state.clone();
                test_state.make_move(move_idx);
                test_state.dice_roll = dice_roll;

                let score = self.minimax(
                    &test_state,
                    depth.saturating_sub(1),
                    false,
                    i32::MIN,
                    i32::MAX,
                ) as f32;

                total_score += score * DICE_PROBABILITIES[dice_roll as usize];
            }

            move_scores.push((move_idx, total_score));
        }

        // Sort moves by score (best first) for better alpha-beta pruning
        move_scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        // Create detailed move evaluations for diagnostics
        let mut move_evaluations = Vec::new();
        for (move_idx, score) in &move_scores {
            let piece = &state.get_pieces(state.current_player)[*move_idx as usize];
            let track = GameState::get_player_track(state.current_player);

            let (move_type, to_square) = if piece.square == -1 {
                ("enter".to_string(), Some(track[0]))
            } else if let Some(track_pos) = track.iter().position(|&sq| sq as i8 == piece.square) {
                let new_track_pos = track_pos + state.dice_roll as usize;
                if new_track_pos >= track.len() {
                    ("finish".to_string(), None)
                } else {
                    let new_square = track[new_track_pos];
                    if state.board[new_square as usize].is_some() {
                        ("capture".to_string(), Some(new_square))
                    } else {
                        ("move".to_string(), Some(new_square))
                    }
                }
            } else {
                ("invalid".to_string(), None)
            };

            move_evaluations.push(MoveEvaluation {
                piece_index: *move_idx,
                score: *score,
                move_type,
                from_square: piece.square,
                to_square,
            });
        }

        (move_scores[0].0, move_evaluations)
    }

    fn minimax(
        &mut self,
        state: &GameState,
        depth: u8,
        is_maximizing: bool,
        mut alpha: i32,
        mut beta: i32,
    ) -> i32 {
        // Check transposition table
        let state_hash = state.hash();
        if let Some(entry) = self.transposition_table.get(&state_hash) {
            if entry.depth >= depth {
                self.transposition_hits += 1;
                return entry.evaluation;
            }
        }

        self.nodes_evaluated += 1;

        if depth == 0 {
            let eval = state.evaluate();
            self.store_transposition(state_hash, eval, depth, None);
            return eval;
        }

        let valid_moves = state.get_valid_moves();

        if valid_moves.is_empty() {
            let eval = state.evaluate();
            self.store_transposition(state_hash, eval, depth, None);
            return eval;
        }

        let mut best_move = None;

        if is_maximizing {
            let mut max_eval = i32::MIN;

            for &move_idx in &valid_moves {
                let mut test_state = state.clone();
                let game_won = test_state.make_move(move_idx);

                if game_won {
                    let eval = WIN_SCORE + depth as i32; // Prefer quicker wins
                    self.store_transposition(state_hash, eval, depth, Some(move_idx));
                    return eval;
                }

                let eval_score = self.minimax(&test_state, depth - 1, false, alpha, beta);

                if eval_score > max_eval {
                    max_eval = eval_score;
                    best_move = Some(move_idx);
                }

                alpha = alpha.max(eval_score);

                if beta <= alpha {
                    break; // Alpha-beta pruning
                }
            }

            self.store_transposition(state_hash, max_eval, depth, best_move);
            max_eval
        } else {
            let mut min_eval = i32::MAX;

            for &move_idx in &valid_moves {
                let mut test_state = state.clone();
                let game_won = test_state.make_move(move_idx);

                if game_won {
                    let eval = -WIN_SCORE - depth as i32; // Prefer delaying losses
                    self.store_transposition(state_hash, eval, depth, Some(move_idx));
                    return eval;
                }

                let eval_score = self.minimax(&test_state, depth - 1, true, alpha, beta);

                if eval_score < min_eval {
                    min_eval = eval_score;
                    best_move = Some(move_idx);
                }

                beta = beta.min(eval_score);

                if beta <= alpha {
                    break; // Alpha-beta pruning
                }
            }

            self.store_transposition(state_hash, min_eval, depth, best_move);
            min_eval
        }
    }

    fn store_transposition(
        &mut self,
        hash: u64,
        evaluation: i32,
        depth: u8,
        best_move: Option<u8>,
    ) {
        if self.transposition_table.len() >= Self::TRANSPOSITION_TABLE_SIZE {
            // Simple replacement strategy: clear some entries
            if self.transposition_table.len() % 1000 == 0 {
                self.transposition_table.clear();
            }
        }

        self.transposition_table.insert(
            hash,
            TranspositionEntry {
                evaluation,
                depth,
                best_move,
            },
        );
    }

    // Adaptive evaluation based on game phase
    fn get_phase_multiplier(&self, phase: GamePhase) -> f32 {
        match phase {
            GamePhase::Opening => 0.8,    // Less aggressive in opening
            GamePhase::Middlegame => 1.0, // Standard evaluation
            GamePhase::Endgame => 1.3,    // More aggressive in endgame
        }
    }

    // Enhanced move ordering for better alpha-beta pruning
    fn order_moves(&self, state: &GameState, moves: &[u8]) -> Vec<u8> {
        let mut scored_moves: Vec<(u8, i32)> = Vec::new();

        for &move_idx in moves {
            let mut test_state = state.clone();
            let _won = test_state.make_move(move_idx);

            // Quick evaluation for move ordering
            let score = test_state.evaluate() + self.evaluate_move_tactical(state, move_idx);
            scored_moves.push((move_idx, score));
        }

        // Sort by score (best moves first)
        scored_moves.sort_by(|a, b| b.1.cmp(&a.1));
        scored_moves.into_iter().map(|(m, _)| m).collect()
    }

    // Tactical evaluation for move ordering
    fn evaluate_move_tactical(&self, state: &GameState, move_idx: u8) -> i32 {
        let mut score = 0i32;

        let piece = &state.get_pieces(state.current_player)[move_idx as usize];
        let track = GameState::get_player_track(state.current_player);

        if piece.square == -1 {
            score += 10; // Prefer entering the board
        } else if let Some(track_pos) = track.iter().position(|&sq| sq as i8 == piece.square) {
            let new_track_pos = track_pos + state.dice_roll as usize;

            if new_track_pos >= track.len() {
                score += 100; // Prefer finishing pieces
            } else {
                let new_square = track[new_track_pos];

                // Prefer capturing opponents
                if let Some(occupant) = state.board[new_square as usize] {
                    if occupant.player != state.current_player {
                        score += 50;
                    }
                }

                // Prefer landing on rosettes
                if GameState::is_rosette(new_square) {
                    score += 30;
                }
            }
        }

        score
    }
}

// JSON input structures
#[derive(Deserialize, Clone)]
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

#[derive(Deserialize, Clone)]
struct JsonPiece {
    square: i8,
}

#[derive(Serialize)]
struct AIResponse {
    r#move: u8,
    evaluation: i32,
    thinking: String,
    timings: Timings,
    diagnostics: Diagnostics,
}

#[derive(Serialize)]
struct Diagnostics {
    #[serde(rename = "searchDepth")]
    search_depth: u8,
    #[serde(rename = "validMoves")]
    valid_moves: Vec<u8>,
    #[serde(rename = "moveEvaluations")]
    move_evaluations: Vec<MoveEvaluation>,
    #[serde(rename = "transpositionHits")]
    transposition_hits: usize,
    #[serde(rename = "nodesEvaluated")]
    nodes_evaluated: u32,
    #[serde(rename = "gamePhase")]
    game_phase: String,
    #[serde(rename = "boardControl")]
    board_control: i32,
    #[serde(rename = "piecePositions")]
    piece_positions: PiecePositions,
}

#[derive(Serialize)]
struct MoveEvaluation {
    #[serde(rename = "pieceIndex")]
    piece_index: u8,
    score: f32,
    #[serde(rename = "moveType")]
    move_type: String,
    #[serde(rename = "fromSquare")]
    from_square: i8,
    #[serde(rename = "toSquare")]
    to_square: Option<u8>,
}

#[derive(Serialize)]
struct PiecePositions {
    #[serde(rename = "player1OnBoard")]
    player1_on_board: u8,
    #[serde(rename = "player1Finished")]
    player1_finished: u8,
    #[serde(rename = "player2OnBoard")]
    player2_on_board: u8,
    #[serde(rename = "player2Finished")]
    player2_finished: u8,
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
    // Cache preflight for 24 hours (86400 seconds) to reduce latency
    headers.set("Access-Control-Max-Age", "86400").unwrap();
    headers.set("Content-Type", "application/json").unwrap();
    headers
}

fn convert_json_to_game_state(json_state: &GameStateRequest) -> GameState {
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

    let start_time = js_sys::Date::now();

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

            let ai_start = js_sys::Date::now();
            let ai_depth = 8; // Fixed expert-level AI depth
            let game_state = convert_json_to_game_state(&game_state_request);
            let mut ai = AI::new();
            let (ai_move, move_evaluations) = ai.get_best_move(&game_state, ai_depth);
            let evaluation = game_state.evaluate();
            let ai_end = js_sys::Date::now();
            let end_time = js_sys::Date::now();

            // Calculate piece positions for diagnostics
            let mut player1_on_board = 0;
            let mut player1_finished = 0;
            let mut player2_on_board = 0;
            let mut player2_finished = 0;

            for piece in &game_state.player1_pieces {
                if piece.square == -1 {
                    // Not entered yet
                } else if piece.square >= 16 {
                    player1_finished += 1;
                } else {
                    player1_on_board += 1;
                }
            }

            for piece in &game_state.player2_pieces {
                if piece.square == -1 {
                    // Not entered yet
                } else if piece.square >= 16 {
                    player2_finished += 1;
                } else {
                    player2_on_board += 1;
                }
            }

            // Determine game phase
            let total_pieces_in_play =
                player1_on_board + player1_finished + player2_on_board + player2_finished;
            let game_phase = if total_pieces_in_play <= 4 {
                "opening"
            } else if player1_finished + player2_finished >= 6 {
                "endgame"
            } else {
                "middlegame"
            };

            let response = AIResponse {
                r#move: ai_move,
                evaluation,
                thinking: format!(
                    "AI (depth {}) chose move {} with score {:.1}. Evaluated {} nodes, {} cache hits.",
                    ai_depth,
                    ai_move,
                    move_evaluations.first().map(|m| m.score).unwrap_or(0.0),
                    ai.nodes_evaluated,
                    ai.transposition_hits
                ),
                timings: Timings {
                    ai_move_calculation: ((ai_end - ai_start) as u32).max(1),
                    total_handler_time: ((end_time - start_time) as u32).max(1),
                },
                diagnostics: Diagnostics {
                    search_depth: ai_depth,
                    valid_moves: game_state.get_valid_moves(),
                    move_evaluations,
                    transposition_hits: ai.transposition_hits as usize,
                    nodes_evaluated: ai.nodes_evaluated,
                    game_phase: game_phase.to_string(),
                    board_control: game_state.evaluate_board_control(),
                    piece_positions: PiecePositions {
                        player1_on_board,
                        player1_finished,
                        player2_on_board,
                        player2_finished,
                    },
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

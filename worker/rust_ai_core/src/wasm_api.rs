use super::{GameState, PiecePosition, Player, AI};
use js_sys;
use rand::Rng;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Serialize, Deserialize, Debug)]
pub struct GameStateRequest {
    #[wasm_bindgen(getter_with_clone)]
    pub player1_pieces: Vec<JsonPiece>,
    #[wasm_bindgen(getter_with_clone)]
    pub player2_pieces: Vec<JsonPiece>,
    #[wasm_bindgen(getter_with_clone)]
    pub current_player: String,
    pub dice_roll: Option<u8>,
}

#[wasm_bindgen]
#[derive(Clone, Copy, Serialize, Deserialize, Debug)]
pub struct JsonPiece {
    pub square: i8,
}

#[wasm_bindgen]
#[derive(Debug, Serialize, Deserialize)]
pub struct AIResponse {
    pub r#move: Option<u8>,
    pub evaluation: i32,
    #[wasm_bindgen(getter_with_clone)]
    pub thinking: String,
    pub timings: Timings,
    #[wasm_bindgen(getter_with_clone)]
    pub diagnostics: Diagnostics,
}

#[wasm_bindgen]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Diagnostics {
    pub search_depth: u8,
    #[wasm_bindgen(getter_with_clone)]
    pub valid_moves: Vec<u8>,
    #[wasm_bindgen(getter_with_clone)]
    pub move_evaluations: Vec<MoveEvaluationWasm>,
    pub transposition_hits: usize,
    pub nodes_evaluated: u32,
    #[wasm_bindgen(getter_with_clone)]
    pub game_phase: String,
    pub board_control: i32,
    pub piece_positions: PiecePositions,
}

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct MoveEvaluationWasm {
    pub piece_index: u8,
    pub score: f32,
    pub from_square: i8,
    pub to_square: Option<u8>,
}

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct PiecePositions {
    pub player1_on_board: u8,
    pub player1_finished: u8,
    pub player2_on_board: u8,
    pub player2_finished: u8,
}

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct Timings {
    pub ai_move_calculation: u32,
    pub total_handler_time: u32,
}

pub fn convert_json_to_game_state(json_state: &GameStateRequest) -> GameState {
    let mut game_state = GameState::new();

    game_state.current_player = if json_state.current_player == "Player1" {
        Player::Player1
    } else {
        Player::Player2
    };

    game_state.player1_pieces = json_state
        .player1_pieces
        .iter()
        .map(|p| PiecePosition {
            square: p.square,
            player: Player::Player1,
        })
        .collect();

    game_state.player2_pieces = json_state
        .player2_pieces
        .iter()
        .map(|p| PiecePosition {
            square: p.square,
            player: Player::Player2,
        })
        .collect();

    for piece in &game_state.player1_pieces {
        if piece.square >= 0 && piece.square < 20 {
            game_state.board[piece.square as usize] = Some(*piece);
        }
    }
    for piece in &game_state.player2_pieces {
        if piece.square >= 0 && piece.square < 20 {
            game_state.board[piece.square as usize] = Some(*piece);
        }
    }

    game_state.dice_roll = json_state.dice_roll.unwrap_or(0);

    game_state
}

#[wasm_bindgen]
pub fn get_ai_move_wasm(game_state_json: &str) -> Result<String, JsValue> {
    let game_state_request: GameStateRequest =
        serde_json::from_str(game_state_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let start_time = js_sys::Date::now();
    let game_state = convert_json_to_game_state(&game_state_request);
    let ai_depth = 8;
    let mut ai = AI::new();
    let (ai_move, move_evaluations) = ai.get_best_move(&game_state, ai_depth);
    let evaluation = game_state.evaluate();
    let end_time = js_sys::Date::now();

    let move_evaluations_wasm: Vec<MoveEvaluationWasm> = move_evaluations
        .iter()
        .map(|eval| MoveEvaluationWasm {
            piece_index: eval.piece_index,
            score: eval.score,
            from_square: eval.from_square,
            to_square: eval.to_square,
        })
        .collect();

    let player1_on_board = game_state
        .player1_pieces
        .iter()
        .filter(|p| p.square >= 0 && p.square < 20)
        .count() as u8;
    let player1_finished = game_state
        .player1_pieces
        .iter()
        .filter(|p| p.square == 20)
        .count() as u8;
    let player2_on_board = game_state
        .player2_pieces
        .iter()
        .filter(|p| p.square >= 0 && p.square < 20)
        .count() as u8;
    let player2_finished = game_state
        .player2_pieces
        .iter()
        .filter(|p| p.square == 20)
        .count() as u8;

    let total_finished = player1_finished + player2_finished;
    let game_phase = if total_finished >= 5 {
        "End Game".to_string()
    } else if player1_on_board + player2_on_board >= 4 {
        "Mid Game".to_string()
    } else {
        "Opening".to_string()
    };
    let response = AIResponse {
        r#move: ai_move,
        evaluation,
        thinking: format!(
            "AI (depth {}) chose move {:?} with score {:.1}. Evaluated {} nodes, {} cache hits.",
            ai_depth,
            ai_move,
            move_evaluations_wasm
                .first()
                .map(|m| m.score)
                .unwrap_or(0.0),
            ai.nodes_evaluated,
            ai.transposition_hits
        ),
        timings: Timings {
            ai_move_calculation: ((end_time - start_time) as u32).max(1),
            total_handler_time: 0,
        },
        diagnostics: Diagnostics {
            search_depth: ai_depth,
            valid_moves: game_state.get_valid_moves(),
            move_evaluations: move_evaluations_wasm,
            transposition_hits: ai.transposition_hits as usize,
            nodes_evaluated: ai.nodes_evaluated,
            game_phase,
            board_control: game_state.evaluate_board_control(),
            piece_positions: PiecePositions {
                player1_on_board,
                player1_finished,
                player2_on_board,
                player2_finished,
            },
        },
    };

    serde_json::to_string(&response).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn roll_dice_wasm() -> u8 {
    let mut rng = rand::thread_rng();
    (0..4).map(|_| rng.gen_range(0..=1)).sum()
}

use super::{GameState, PiecePosition, Player, AI};
use crate::{ml_ai::MLAI, MoveEvaluation};
use js_sys;
use rand::Rng;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GameStateRequest {
    pub player1_pieces: Vec<JsonPiece>,
    pub player2_pieces: Vec<JsonPiece>,
    pub current_player: String,
    pub dice_roll: Option<u8>,
}

#[derive(Clone, Copy, Serialize, Deserialize, Debug)]
pub struct JsonPiece {
    pub square: i8,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIResponse {
    pub r#move: Option<u8>,
    pub evaluation: i32,
    pub thinking: String,
    pub timings: Timings,
    pub diagnostics: Diagnostics,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostics {
    pub search_depth: u8,
    pub valid_moves: Vec<u8>,
    pub move_evaluations: Vec<MoveEvaluationWasm>,
    pub transposition_hits: usize,
    pub nodes_evaluated: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveEvaluationWasm {
    pub piece_index: u8,
    pub score: f32,
    pub move_type: String,
    pub from_square: i8,
    pub to_square: Option<u8>,
}

impl From<&MoveEvaluation> for MoveEvaluationWasm {
    fn from(eval: &MoveEvaluation) -> Self {
        MoveEvaluationWasm {
            piece_index: eval.piece_index,
            score: eval.score,
            move_type: eval.move_type.clone(),
            from_square: eval.from_square,
            to_square: eval.to_square,
        }
    }
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Timings {
    pub ai_move_calculation: u32,
    pub total_handler_time: u32,
}

pub fn convert_request_to_game_state(request: &GameStateRequest) -> GameState {
    let mut game_state = GameState::new();

    game_state.current_player = if request.current_player == "Player1" {
        Player::Player1
    } else {
        Player::Player2
    };

    game_state.player1_pieces = request
        .player1_pieces
        .iter()
        .map(|p| PiecePosition {
            square: p.square,
            player: Player::Player1,
        })
        .collect();

    game_state.player2_pieces = request
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

    game_state.dice_roll = request.dice_roll.unwrap_or(0);

    game_state
}

#[wasm_bindgen]
pub fn get_ai_move_wasm(game_state_request_js: JsValue) -> Result<JsValue, JsValue> {
    let game_state_request: GameStateRequest =
        serde_wasm_bindgen::from_value(game_state_request_js)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let start_time = js_sys::Date::now();
    let game_state = convert_request_to_game_state(&game_state_request);
    let ai_depth = 6;
    let mut ai = AI::new();
    let (ai_move, move_evaluations) = ai.get_best_move(&game_state, ai_depth);
    let evaluation = game_state.evaluate();
    let end_time = js_sys::Date::now();

    let move_evaluations_wasm: Vec<MoveEvaluationWasm> =
        move_evaluations.iter().map(|eval| eval.into()).collect();

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
            nodes_evaluated: ai.nodes_evaluated as u64,
        },
    };

    let response_json = serde_json::to_string(&response)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize response: {}", e)))?;

    Ok(JsValue::from_str(&response_json))
}

#[wasm_bindgen]
pub fn get_ml_ai_info() -> Result<JsValue, JsValue> {
    let info = serde_json::to_string(&"ML AI Neural Network - Trained on Royal Game of Ur")
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize response: {}", e)))?;
    Ok(JsValue::from_str(&info))
}

#[wasm_bindgen]
pub fn roll_dice_ml() -> u8 {
    let mut rng = rand::thread_rng();
    (0..4).map(|_| rng.gen_range(0..=1)).sum()
}

#[wasm_bindgen]
pub fn roll_dice_wasm() -> u8 {
    let mut rng = rand::thread_rng();
    (0..4).map(|_| rng.gen_range(0..=1)).sum()
}

#[wasm_bindgen]
pub fn init_ml_ai() -> Result<JsValue, JsValue> {
    let _ml_ai = MLAI::new();
    let response = serde_json::to_string(&"ML AI initialized")
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize response: {}", e)))?;
    Ok(JsValue::from_str(&response))
}

#[wasm_bindgen]
pub fn load_ml_weights(
    value_weights_js: JsValue,
    policy_weights_js: JsValue,
) -> Result<JsValue, JsValue> {
    let value_weights: Vec<f32> = serde_wasm_bindgen::from_value(value_weights_js)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let policy_weights: Vec<f32> = serde_wasm_bindgen::from_value(policy_weights_js)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let mut ml_ai = MLAI::new();
    ml_ai.load_pretrained(&value_weights, &policy_weights);

    let response = serde_json::to_string(&"ML weights loaded")
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize response: {}", e)))?;
    Ok(JsValue::from_str(&response))
}

#[wasm_bindgen]
pub fn get_ml_ai_move(game_state_request_js: JsValue) -> Result<JsValue, JsValue> {
    let game_state_request: GameStateRequest =
        serde_wasm_bindgen::from_value(game_state_request_js)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let game_state = convert_request_to_game_state(&game_state_request);
    let mut ml_ai = MLAI::new();
    let ml_response = ml_ai.get_best_move(&game_state);

    let response_json = serde_json::to_string(&ml_response)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize response: {}", e)))?;

    Ok(JsValue::from_str(&response_json))
}

#[wasm_bindgen]
pub fn evaluate_ml_position(game_state_request_js: JsValue) -> Result<JsValue, JsValue> {
    let game_state_request: GameStateRequest =
        serde_wasm_bindgen::from_value(game_state_request_js)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let game_state = convert_request_to_game_state(&game_state_request);
    let ml_ai = MLAI::new();
    let evaluation = ml_ai.evaluate_position(&game_state);

    let response_json = serde_json::to_string(&evaluation)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize response: {}", e)))?;

    Ok(JsValue::from_str(&response_json))
}

use super::{GameState, Player, MLAI};
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

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MLWeights {
    pub valueWeights: Vec<f32>,
    pub policyWeights: Vec<f32>,
}

static mut ML_AI: Option<MLAI> = None;

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
        .map(|p| super::PiecePosition {
            square: p.square,
            player: Player::Player1,
        })
        .collect();

    game_state.player2_pieces = request
        .player2_pieces
        .iter()
        .map(|p| super::PiecePosition {
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
pub fn init_ml_ai() -> Result<(), JsValue> {
    unsafe {
        ML_AI = Some(MLAI::new());
    }
    Ok(())
}

#[wasm_bindgen]
pub fn load_ml_weights(weights_js: JsValue) -> Result<(), JsValue> {
    let weights: MLWeights = serde_wasm_bindgen::from_value(weights_js)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    unsafe {
        if let Some(ref mut ai) = ML_AI {
            ai.load_pretrained(&weights.valueWeights, &weights.policyWeights);
        } else {
            return Err(JsValue::from_str("ML AI not initialized"));
        }
    }

    Ok(())
}

#[wasm_bindgen]
pub fn get_ml_ai_move(game_state_request_js: JsValue) -> Result<JsValue, JsValue> {
    let game_state_request: GameStateRequest =
        serde_wasm_bindgen::from_value(game_state_request_js)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let start_time = js_sys::Date::now();
    let game_state = convert_request_to_game_state(&game_state_request);

    unsafe {
        if let Some(ref mut ai) = ML_AI {
            let response = ai.get_best_move(&game_state);
            let end_time = js_sys::Date::now();

            let response_with_timing = MLResponseWithTiming {
                r#move: response.r#move,
                evaluation: response.evaluation,
                thinking: response.thinking,
                diagnostics: response.diagnostics,
                timings: Timings {
                    ai_move_calculation: ((end_time - start_time) as u32).max(1),
                    total_handler_time: 0,
                },
            };

            let response_json = serde_json::to_string(&response_with_timing)
                .map_err(|e| JsValue::from_str(&format!("Failed to serialize response: {}", e)))?;

            Ok(JsValue::from_str(&response_json))
        } else {
            Err(JsValue::from_str("ML AI not initialized"))
        }
    }
}

#[wasm_bindgen]
pub fn evaluate_ml_position(game_state_request_js: JsValue) -> Result<JsValue, JsValue> {
    let game_state_request: GameStateRequest =
        serde_wasm_bindgen::from_value(game_state_request_js)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let game_state = convert_request_to_game_state(&game_state_request);

    unsafe {
        if let Some(ref ai) = ML_AI {
            let evaluation = ai.evaluate_position(&game_state);
            let response = serde_json::json!({
                "evaluation": evaluation,
                "status": "success",
                "currentPlayer": if game_state.current_player == Player::Player1 { "Player1" } else { "Player2" }
            });

            let response_json = serde_json::to_string(&response)
                .map_err(|e| JsValue::from_str(&format!("Failed to serialize response: {}", e)))?;

            Ok(JsValue::from_str(&response_json))
        } else {
            Err(JsValue::from_str("ML AI not initialized"))
        }
    }
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Timings {
    pub ai_move_calculation: u32,
    pub total_handler_time: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MLResponseWithTiming {
    pub r#move: Option<u8>,
    pub evaluation: f32,
    pub thinking: String,
    pub diagnostics: super::MLDiagnostics,
    pub timings: Timings,
}

#[wasm_bindgen]
pub fn get_ml_ai_info() -> Result<JsValue, JsValue> {
    let info = serde_json::json!({
        "name": "ML AI",
        "version": "1.0.0",
        "description": "Neural network-based AI for Royal Game of Ur",
        "features": {
            "value_network": true,
            "policy_network": true,
            "feature_extraction": true
        }
    });

    let info_json = serde_json::to_string(&info)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize info: {}", e)))?;

    Ok(JsValue::from_str(&info_json))
}

#[wasm_bindgen]
pub fn roll_dice_ml() -> u8 {
    let mut rng = rand::thread_rng();
    (0..4).map(|_| rng.gen_range(0..=1)).sum()
}

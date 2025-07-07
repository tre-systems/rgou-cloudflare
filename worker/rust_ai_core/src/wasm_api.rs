use super::{GameState, PiecePosition, Player, AI};
use crate::MoveEvaluation;
use js_sys;
use rand::Rng;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GameStateRequest {
    #[wasm_bindgen(getter_with_clone, js_name = player1Pieces)]
    pub player1_pieces: Vec<JsonPiece>,
    #[wasm_bindgen(getter_with_clone, js_name = player2Pieces)]
    pub player2_pieces: Vec<JsonPiece>,
    #[wasm_bindgen(getter_with_clone, js_name = currentPlayer)]
    pub current_player: String,
    #[wasm_bindgen(js_name = diceRoll)]
    pub dice_roll: Option<u8>,
}

#[wasm_bindgen]
#[derive(Clone, Copy, Serialize, Deserialize, Debug)]
pub struct JsonPiece {
    pub square: i8,
}

#[wasm_bindgen]
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIResponse {
    #[wasm_bindgen(js_name = move)]
    pub r#move: Option<u8>,
    pub evaluation: i32,
    #[wasm_bindgen(getter_with_clone, js_name = thinking)]
    pub thinking: String,
    pub timings: Timings,
    #[wasm_bindgen(getter_with_clone)]
    pub diagnostics: Diagnostics,
}

#[wasm_bindgen]
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostics {
    #[wasm_bindgen(js_name = searchDepth)]
    pub search_depth: u8,
    #[wasm_bindgen(getter_with_clone, js_name = validMoves)]
    pub valid_moves: Vec<u8>,
    #[wasm_bindgen(getter_with_clone, js_name = moveEvaluations)]
    pub move_evaluations: Vec<MoveEvaluationWasm>,
    #[wasm_bindgen(js_name = transpositionHits)]
    pub transposition_hits: usize,
    #[wasm_bindgen(js_name = nodesEvaluated)]
    pub nodes_evaluated: u32,
}

#[wasm_bindgen]
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveEvaluationWasm {
    #[wasm_bindgen(js_name = pieceIndex)]
    pub piece_index: u8,
    pub score: f32,
    #[wasm_bindgen(getter_with_clone, js_name = moveType)]
    pub move_type: String,
    #[wasm_bindgen(js_name = fromSquare)]
    pub from_square: i8,
    #[wasm_bindgen(js_name = toSquare)]
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

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Timings {
    #[wasm_bindgen(js_name = aiMoveCalculation)]
    pub ai_move_calculation: u32,
    #[wasm_bindgen(js_name = totalHandlerTime)]
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
            nodes_evaluated: ai.nodes_evaluated,
        },
    };

    serde_wasm_bindgen::to_value(&response).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn roll_dice_wasm() -> u8 {
    let mut rng = rand::thread_rng();
    (0..4).map(|_| rng.gen_range(0..=1)).sum()
}

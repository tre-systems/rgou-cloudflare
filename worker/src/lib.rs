use rgou_ai_core::{
    wasm_api::{
        convert_request_to_game_state, AIResponse, Diagnostics, GameStateRequest,
        MoveEvaluationWasm, PiecePositions, Timings,
    },
    AI,
};
use serde::Serialize;
use worker::*;

const AI_SEARCH_DEPTH: u8 = 4;
const VERSION: &str = "2.0.0-pure-rust";
const CORS_MAX_AGE: &str = "86400";

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    timestamp: String,
    version: String,
}

/// Creates CORS headers for all responses
fn cors_headers() -> Headers {
    let headers = Headers::new();
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
    headers.set("Access-Control-Max-Age", CORS_MAX_AGE).unwrap();
    headers.set("Content-Type", "application/json").unwrap();
    headers
}

/// Handles AI move calculation requests
async fn handle_ai_move(mut req: Request, start_time: f64) -> Result<Response> {
    let game_state_request: GameStateRequest = req.json().await?;
    console_log!(
        "[Rust Worker] Received AI move request: {:?}",
        game_state_request
    );

    let ai_start = js_sys::Date::now();
    let game_state = convert_request_to_game_state(&game_state_request);

    console_log!("[Rust Worker] Server-side GameState: {:?}", &game_state);

    let mut ai = AI::new();
    let (ai_move, move_evaluations) = ai.get_best_move(&game_state, AI_SEARCH_DEPTH);
    let evaluation = game_state.evaluate();

    let move_evaluations_wasm: Vec<MoveEvaluationWasm> = move_evaluations
        .iter()
        .map(|eval| MoveEvaluationWasm {
            piece_index: eval.piece_index,
            score: eval.score,
            move_type: eval.move_type.clone(),
            from_square: eval.from_square,
            to_square: eval.to_square,
        })
        .collect();

    let ai_end = js_sys::Date::now();
    let end_time = js_sys::Date::now();

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
            AI_SEARCH_DEPTH,
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
            search_depth: AI_SEARCH_DEPTH,
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

    console_log!("[Rust Worker] Sending AI response: {:?}", response);
    Ok(Response::from_json(&response)?.with_headers(cors_headers()))
}

/// Handles health check requests
fn handle_health() -> Result<Response> {
    let response = HealthResponse {
        status: "healthy".to_string(),
        timestamp: Date::now().to_string(),
        version: VERSION.to_string(),
    };

    Ok(Response::from_json(&response)?.with_headers(cors_headers()))
}

#[event(fetch)]
pub async fn main(req: Request, _env: Env, _ctx: Context) -> Result<Response> {
    console_error_panic_hook::set_once();

    let url = req.url()?;
    console_log!("[Rust Worker] {} {}", req.method(), url.path());

    // Handle preflight CORS requests
    if req.method() == Method::Options {
        return Ok(Response::empty()?.with_headers(cors_headers()));
    }

    let start_time = js_sys::Date::now();

    // Route requests
    match (req.method(), url.path()) {
        (Method::Post, "/ai-move") => handle_ai_move(req, start_time).await,
        (Method::Get, "/health") => handle_health(),
        _ => Ok(Response::error("Not Found", 404)?.with_headers(cors_headers())),
    }
}

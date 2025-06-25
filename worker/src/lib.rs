use rgou_ai_core::{
    AI, AIResponse, Diagnostics, GameStateRequest, MoveEvaluation, PiecePositions, Timings,
    convert_json_to_game_state,
};
use serde::Serialize;
use worker::*;

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
    headers.set("Access-Control-Max-Age", "86400").unwrap();
    headers.set("Content-Type", "application/json").unwrap();
    headers
}

#[event(fetch)]
pub async fn main(mut req: Request, _env: Env, _ctx: Context) -> Result<Response> {
    console_error_panic_hook::set_once();

    let url = req.url()?;
    console_log!("[Rust Worker] {} {}", req.method(), url.path());

    if req.method() == Method::Options {
        return Ok(Response::empty()?.with_headers(cors_headers()));
    }

    let start_time = js_sys::Date::now();

    match (req.method(), url.path()) {
        (Method::Post, "/ai-move") => {
            let game_state_request: GameStateRequest = req.json().await?;

            let ai_start = js_sys::Date::now();
            let ai_depth = 8;
            let game_state = convert_json_to_game_state(&game_state_request);
            let mut ai = AI::new();
            let (ai_move, move_evaluations) = ai.get_best_move(&game_state, ai_depth);
            let evaluation = game_state.evaluate();
            let ai_end = js_sys::Date::now();
            let end_time = js_sys::Date::now();

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
                    game_phase: "N/A".to_string(),
                    board_control: game_state.evaluate_board_control(),
                    piece_positions: PiecePositions {
                        player1_on_board: 0,
                        player1_finished: 0,
                        player2_on_board: 0,
                        player2_finished: 0,
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
        _ => Ok(Response::error("Not Found", 404)?.with_headers(cors_headers())),
    }
}

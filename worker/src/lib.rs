use rgou_ai_core::{
    wasm_api::{
        convert_request_to_game_state, AIResponse, Diagnostics, GameStateRequest,
        MoveEvaluationWasm, Timings,
    },
    AI,
};
use serde::Serialize;
use worker::*;

const AI_SEARCH_DEPTH: u8 = 3;
const VERSION: &str = "2.0.0-pure-rust";
const CORS_MAX_AGE: &str = "86400";

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    timestamp: String,
    version: String,
}

fn cors_headers_with_origin(origin: &Option<String>, env: &Env) -> Result<Headers> {
    let headers = Headers::new();
    
    let allowed_origins = if is_development(env) {
        vec![
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
        ]
    } else {
        vec![
            "https://rgou.tre.systems",
            "https://www.rgou.tre.systems",
        ]
    };
    
    let cors_origin = if let Some(origin_str) = origin {
        if allowed_origins.contains(&origin_str.as_str()) {
            origin_str.clone()
        } else {
            if is_development(env) {
                "http://localhost:3000".to_string()
            } else {
                "https://rgou.tre.systems".to_string()
            }
        }
    } else {
        if is_development(env) {
            "http://localhost:3000".to_string()
        } else {
            "https://rgou.tre.systems".to_string()
        }
    };
    
    headers.set("Access-Control-Allow-Origin", &cors_origin)?;
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")?;
    headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
    )?;
    headers.set("Access-Control-Max-Age", CORS_MAX_AGE)?;
    headers.set("Content-Type", "application/json")?;
    Ok(headers)
}

fn is_development(env: &Env) -> bool {
    env.var("ENVIRONMENT")
        .map(|var| var.to_string())
        .unwrap_or_else(|_| "production".to_string())
        != "production"
}

async fn handle_ai_move(mut req: Request, start_time: f64, env: &Env) -> Result<Response> {
    let game_state_request: GameStateRequest = req.json().await?;
    let is_dev = is_development(env);

    let p1_on_board = game_state_request
        .player1_pieces
        .iter()
        .filter(|p| p.square >= 0)
        .count();
    let p2_on_board = game_state_request
        .player2_pieces
        .iter()
        .filter(|p| p.square >= 0)
        .count();

    console_log!(
        "[AI] Player: {}, Dice: {}, P1 pieces: {}, P2 pieces: {}",
        game_state_request.current_player,
        game_state_request.dice_roll.unwrap_or(0),
        p1_on_board,
        p2_on_board
    );

    let ai_start = js_sys::Date::now();
    let game_state = convert_request_to_game_state(&game_state_request);

    if is_dev {
        console_log!(
            "[AI] Dev mode: Game state converted, current player: {:?}",
            game_state.current_player
        );
    }

    let mut ai = AI::new();
    let (ai_move, move_evaluations) = ai.get_best_move(&game_state, AI_SEARCH_DEPTH);
    let evaluation = game_state.evaluate();

    let move_evaluations_wasm: Vec<MoveEvaluationWasm> =
        move_evaluations.iter().map(|eval| eval.into()).collect();

    let ai_end = js_sys::Date::now();
    let end_time = js_sys::Date::now();

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
            nodes_evaluated: ai.nodes_evaluated as u64,
        },
    };

    console_log!(
        "[AI] Response: move={:?}, eval={}, time={}ms, nodes={}, cache_hits={}",
        ai_move,
        evaluation,
        response.timings.ai_move_calculation,
        ai.nodes_evaluated,
        ai.transposition_hits
    );

    if is_dev && !move_evaluations.is_empty() {
        console_log!("[AI] Dev mode: Top 3 move evaluations:");
        for (i, eval) in move_evaluations.iter().take(3).enumerate() {
            console_log!(
                "  {}: piece={}, score={:.1}, type={}",
                i + 1,
                eval.piece_index,
                eval.score,
                eval.move_type
            );
        }
    }

    Response::from_json(&response)
}

fn handle_health() -> Result<Response> {
    let response = HealthResponse {
        status: "healthy".to_string(),
        timestamp: Date::now().to_string(),
        version: VERSION.to_string(),
    };

    Response::from_json(&response)
}

#[event(fetch)]
pub async fn main(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    console_error_panic_hook::set_once();

    let url = req.url()?;
    let method = req.method();
    let path = url.path();
    console_log!("[Worker] {} {}", method, path);

    let origin = req.headers().get("Origin").unwrap_or_default();

    if method == Method::Options {
        return Ok(Response::empty()?.with_headers(cors_headers_with_origin(&origin, &env)?));
    }

    let start_time = js_sys::Date::now();

    let result = match (method, path) {
        (Method::Post, "/ai-move") => handle_ai_move(req, start_time, &env).await,
        (Method::Get, "/health") => handle_health(),
        _ => Ok(Response::error("Not Found", 404)?),
    };

    result.and_then(|response| Ok(response.with_headers(cors_headers_with_origin(&origin, &env)?)))
}

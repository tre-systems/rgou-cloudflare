use rgou_ai_core::{GameState, PiecePosition, Player};
use serde_json;
use std::env;
use std::fs;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 3 {
        println!("Usage: {} <command> <input_file>", args[0]);
        println!("Commands:");
        println!("  get_move <file> - Get best move for game state");
        println!("  evaluate <file> - Evaluate position");
        return;
    }

    let command = &args[1];
    let input_file = &args[2];

    // Read game state from file
    let content = match fs::read_to_string(input_file) {
        Ok(content) => content,
        Err(e) => {
            eprintln!("Error reading file: {}", e);
            return;
        }
    };

    let game_state: serde_json::Value = match serde_json::from_str(&content) {
        Ok(state) => state,
        Err(e) => {
            eprintln!("Error parsing JSON: {}", e);
            return;
        }
    };

    // Convert JSON to GameState
    let rust_game_state = convert_json_to_game_state(&game_state);

    match command.as_str() {
        "get_move" => {
            let mut ai = rgou_ai_core::AI::new();
            let (best_move, move_evaluations) = ai.get_best_move(&rust_game_state, 4);

            let output = serde_json::json!({
                "move": best_move,
                "evaluation": if let Some(eval) = move_evaluations.first() { eval.score } else { 0.0 },
                "thinking": format!("AI evaluated {} moves", move_evaluations.len())
            });

            println!("{}", serde_json::to_string(&output).unwrap());
        }
        "evaluate" => {
            let evaluation = rust_game_state.evaluate() as f32;
            println!("{}", evaluation);
        }
        _ => {
            eprintln!("Unknown command: {}", command);
        }
    }
}

fn convert_json_to_game_state(json_state: &serde_json::Value) -> GameState {
    let player1_pieces: Vec<PiecePosition> = json_state["player1_pieces"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| PiecePosition {
            square: p["square"].as_i64().unwrap() as i8,
            player: Player::Player1,
        })
        .collect();

    let player2_pieces: Vec<PiecePosition> = json_state["player2_pieces"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| PiecePosition {
            square: p["square"].as_i64().unwrap() as i8,
            player: Player::Player2,
        })
        .collect();

    let current_player = if json_state["current_player"].as_str().unwrap() == "player1" {
        Player::Player1
    } else {
        Player::Player2
    };

    let dice_roll = json_state["dice_roll"].as_u64().unwrap() as u8;

    let mut board = vec![None; 21];

    // Populate board from pieces
    for piece in &player1_pieces {
        if piece.square >= 0 && piece.square < 21 {
            board[piece.square as usize] = Some(*piece);
        }
    }

    for piece in &player2_pieces {
        if piece.square >= 0 && piece.square < 21 {
            board[piece.square as usize] = Some(*piece);
        }
    }

    GameState {
        board,
        player1_pieces,
        player2_pieces,
        current_player,
        dice_roll,
    }
}

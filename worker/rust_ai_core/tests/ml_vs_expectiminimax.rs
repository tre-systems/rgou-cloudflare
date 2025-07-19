use rand::Rng;
use rgou_ai_core::{ml_ai::MLAI, GameState as MLGameState, Player as MLPlayer};
use rgou_ai_core::{GameState, Player, AI, PIECES_PER_PLAYER};

const EXPECTIMINIMAX_SEARCH_DEPTH: u8 = 3;
/// Returns the number of games to run for ML vs Expectiminimax tests.
/// Defaults to 10 for fast checks, but can be overridden by setting the NUM_GAMES environment variable.
fn num_games() -> usize {
    std::env::var("NUM_GAMES")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(10)
}
const ML_WEIGHTS_FILE: &str = "ml/data/weights/ml_ai_weights_fast.json";

#[derive(Debug, Clone)]
struct GameResult {
    winner: Player,
    moves_played: usize,
    ml_ai_was_player1: bool,
    p1_finished_pieces: usize,
    p2_finished_pieces: usize,
    ml_ai_total_time_ms: u64,
    expectiminimax_ai_total_time_ms: u64,
    ml_ai_moves: usize,
    expectiminimax_ai_moves: usize,
}

fn convert_piece_position_to_ml(
    rust_piece: &rgou_ai_core::PiecePosition,
) -> rgou_ai_core::PiecePosition {
    rgou_ai_core::PiecePosition {
        square: rust_piece.square,
        player: match rust_piece.player {
            Player::Player1 => MLPlayer::Player1,
            Player::Player2 => MLPlayer::Player2,
        },
    }
}

fn convert_game_state_to_ml(rust_state: &GameState) -> MLGameState {
    MLGameState {
        board: rust_state
            .board
            .iter()
            .map(|opt_piece| opt_piece.as_ref().map(|p| convert_piece_position_to_ml(p)))
            .collect(),
        player1_pieces: rust_state
            .player1_pieces
            .iter()
            .map(convert_piece_position_to_ml)
            .collect(),
        player2_pieces: rust_state
            .player2_pieces
            .iter()
            .map(convert_piece_position_to_ml)
            .collect(),
        current_player: match rust_state.current_player {
            Player::Player1 => MLPlayer::Player1,
            Player::Player2 => MLPlayer::Player2,
        },
        dice_roll: rust_state.dice_roll,
    }
}

fn load_ml_weights() -> Result<(Vec<f32>, Vec<f32>), Box<dyn std::error::Error>> {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let weights_path = std::path::Path::new(manifest_dir)
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("ml/data/weights/ml_ai_weights_fast.json");
    let content = std::fs::read_to_string(weights_path)?;
    let weights: serde_json::Value = serde_json::from_str(&content)?;

    let value_weights: Vec<f32> = weights["valueWeights"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_f64().unwrap() as f32)
        .collect();

    let policy_weights: Vec<f32> = weights["policyWeights"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_f64().unwrap() as f32)
        .collect();

    Ok((value_weights, policy_weights))
}

fn play_game_ml_vs_expectiminimax(
    ml_ai: &mut MLAI,
    expectiminimax_ai: &mut AI,
    ml_plays_first: bool,
) -> GameResult {
    let mut game_state = GameState::new();
    let mut moves_played = 0;
    let max_moves = 200;
    let mut ml_ai_total_time_ms = 0;
    let mut expectiminimax_ai_total_time_ms = 0;
    let mut ml_ai_moves = 0;
    let mut expectiminimax_ai_moves = 0;

    while !game_state.is_game_over() && moves_played < max_moves {
        let current_player = game_state.current_player;
        let is_ml_turn = (current_player == Player::Player1) == ml_plays_first;

        game_state.dice_roll = rand::thread_rng().gen_range(0..=4);

        if game_state.dice_roll == 0 {
            game_state.current_player = game_state.current_player.opponent();
            continue;
        }

        let best_move = if is_ml_turn {
            let ml_state = convert_game_state_to_ml(&game_state);
            let start_time = std::time::Instant::now();
            let ml_response = ml_ai.get_best_move(&ml_state);
            let end_time = std::time::Instant::now();
            ml_ai_total_time_ms += end_time.duration_since(start_time).as_millis() as u64;
            ml_ai_moves += 1;
            ml_response.r#move
        } else {
            let start_time = std::time::Instant::now();
            let (move_option, _) =
                expectiminimax_ai.get_best_move(&game_state, EXPECTIMINIMAX_SEARCH_DEPTH);
            let end_time = std::time::Instant::now();
            expectiminimax_ai_total_time_ms +=
                end_time.duration_since(start_time).as_millis() as u64;
            expectiminimax_ai_moves += 1;
            move_option
        };

        if let Some(piece_index) = best_move {
            game_state.make_move(piece_index).unwrap();
            moves_played += 1;

            if game_state.is_game_over() {
                let p1_finished = game_state
                    .player1_pieces
                    .iter()
                    .filter(|p| p.square == 20)
                    .count();
                let p2_finished = game_state
                    .player2_pieces
                    .iter()
                    .filter(|p| p.square == 20)
                    .count();

                let winner = if p1_finished == PIECES_PER_PLAYER {
                    Player::Player1
                } else {
                    Player::Player2
                };

                return GameResult {
                    winner,
                    moves_played,
                    ml_ai_was_player1: ml_plays_first,
                    p1_finished_pieces: p1_finished,
                    p2_finished_pieces: p2_finished,
                    ml_ai_total_time_ms,
                    expectiminimax_ai_total_time_ms,
                    ml_ai_moves,
                    expectiminimax_ai_moves,
                };
            }
        } else {
            game_state.current_player = game_state.current_player.opponent();
        }
    }

    GameResult {
        winner: Player::Player2,
        moves_played,
        ml_ai_was_player1: ml_plays_first,
        p1_finished_pieces: game_state
            .player1_pieces
            .iter()
            .filter(|p| p.square == 20)
            .count(),
        p2_finished_pieces: game_state
            .player2_pieces
            .iter()
            .filter(|p| p.square == 20)
            .count(),
        ml_ai_total_time_ms,
        expectiminimax_ai_total_time_ms,
        ml_ai_moves,
        expectiminimax_ai_moves,
    }
}

#[test]
fn test_ml_vs_expectiminimax_ai() {
    println!("Loading ML AI weights from {}", ML_WEIGHTS_FILE);

    let (value_weights, policy_weights) = match load_ml_weights() {
        Ok(weights) => weights,
        Err(e) => {
            eprintln!("Failed to load ML weights: {}", e);
            eprintln!("Skipping ML vs Expectiminimax test");
            return;
        }
    };

    let mut ml_wins = 0;
    let mut expectiminimax_wins = 0;
    let mut total_moves = 0;
    let mut ml_first_wins = 0;
    let mut ml_second_wins = 0;
    let mut total_ml_finished_pieces = 0;
    let mut total_expectiminimax_finished_pieces = 0;
    let mut total_ml_ai_time_ms = 0;
    let mut total_expectiminimax_ai_time_ms = 0;
    let mut total_ml_ai_moves = 0;
    let mut total_expectiminimax_ai_moves = 0;

    println!("Starting {} games: ML AI vs Expectiminimax AI", num_games());

    // Create persistent AI instances
    let mut ml_ai = MLAI::new();
    ml_ai.load_pretrained(&value_weights, &policy_weights);
    let mut expectiminimax_ai = AI::new();

    for i in 0..num_games() {
        let ml_plays_first = i % 2 == 0;
        let result =
            play_game_ml_vs_expectiminimax(&mut ml_ai, &mut expectiminimax_ai, ml_plays_first);

        total_moves += result.moves_played;

        let ml_won = if result.ml_ai_was_player1 {
            result.winner == Player::Player1
        } else {
            result.winner == Player::Player2
        };

        if ml_won {
            ml_wins += 1;
            if result.ml_ai_was_player1 {
                ml_first_wins += 1;
            } else {
                ml_second_wins += 1;
            }
        } else {
            expectiminimax_wins += 1;
        }

        if result.ml_ai_was_player1 {
            total_ml_finished_pieces += result.p1_finished_pieces;
            total_expectiminimax_finished_pieces += result.p2_finished_pieces;
        } else {
            total_ml_finished_pieces += result.p2_finished_pieces;
            total_expectiminimax_finished_pieces += result.p1_finished_pieces;
        }

        total_ml_ai_time_ms += result.ml_ai_total_time_ms;
        total_expectiminimax_ai_time_ms += result.expectiminimax_ai_total_time_ms;
        total_ml_ai_moves += result.ml_ai_moves;
        total_expectiminimax_ai_moves += result.expectiminimax_ai_moves;

        // Clear transposition table periodically to prevent memory bloat
        if (i + 1) % 20 == 0 {
            expectiminimax_ai.clear_transposition_table();
        }

        if (i + 1) % 10 == 0 {
            let ml_avg_time = if result.ml_ai_moves > 0 {
                result.ml_ai_total_time_ms as f64 / result.ml_ai_moves as f64
            } else {
                0.0
            };
            let det_avg_time = if result.expectiminimax_ai_moves > 0 {
                result.expectiminimax_ai_total_time_ms as f64
                    / result.expectiminimax_ai_moves as f64
            } else {
                0.0
            };

            println!(
                "Game {}: {} moves, ML {} (playing {}), P1: {}/7, P2: {}/7, ML: {:.1}ms/move, Det: {:.1}ms/move",
                i + 1,
                result.moves_played,
                if ml_won { "won" } else { "lost" },
                if result.ml_ai_was_player1 {
                    "first"
                } else {
                    "second"
                },
                result.p1_finished_pieces,
                result.p2_finished_pieces,
                ml_avg_time,
                det_avg_time
            );
        }
    }

    let ml_win_rate = (ml_wins as f64 / num_games() as f64) * 100.0;
    let avg_moves = total_moves as f64 / num_games() as f64;
    let avg_ml_finished = total_ml_finished_pieces as f64 / num_games() as f64;
    let avg_expectiminimax_finished =
        total_expectiminimax_finished_pieces as f64 / num_games() as f64;
    let avg_ml_time_per_move = if total_ml_ai_moves > 0 {
        total_ml_ai_time_ms as f64 / total_ml_ai_moves as f64
    } else {
        0.0
    };
    let avg_expectiminimax_time_per_move = if total_expectiminimax_ai_moves > 0 {
        total_expectiminimax_ai_time_ms as f64 / total_expectiminimax_ai_moves as f64
    } else {
        0.0
    };

    println!("\n=== ML AI vs Expectiminimax AI Results ===");
    println!("Total games: {}", num_games());
    println!("ML AI wins: {} ({:.1}%)", ml_wins, ml_win_rate);
    println!(
        "Expectiminimax AI wins: {} ({:.1}%)",
        expectiminimax_wins,
        100.0 - ml_win_rate
    );
    println!("Average moves per game: {:.1}", avg_moves);
    println!("Average pieces finished - ML AI: {:.1}/7", avg_ml_finished);
    println!(
        "Average pieces finished - Expectiminimax AI: {:.1}/7",
        avg_expectiminimax_finished
    );
    println!(
        "Average time per move - ML AI: {:.1}ms",
        avg_ml_time_per_move
    );
    println!(
        "Average time per move - Expectiminimax AI: {:.1}ms",
        avg_expectiminimax_time_per_move
    );
    println!(
        "Total moves made - ML AI: {}, Expectiminimax AI: {}",
        total_ml_ai_moves, total_expectiminimax_ai_moves
    );
    println!(
        "ML AI wins playing first: {} / {}",
        ml_first_wins,
        num_games() / 2
    );
    println!(
        "ML AI wins playing second: {} / {}",
        ml_second_wins,
        num_games() / 2
    );

    if ml_win_rate > 45.0 {
        println!("✅ ML AI shows competitive performance against expectiminimax AI");
    } else if ml_win_rate > 35.0 {
        println!("⚠️  ML AI shows some promise but needs improvement");
    } else {
        println!("❌ ML AI needs significant improvement");
    }
}

#[test]
fn test_ml_ai_consistency() {
    println!("Testing ML AI consistency...");

    let (value_weights, policy_weights) = match load_ml_weights() {
        Ok(weights) => weights,
        Err(e) => {
            eprintln!("Failed to load ML weights: {}", e);
            eprintln!("Skipping ML consistency test");
            return;
        }
    };

    println!("Loaded ML weights. Initializing MLAI...");
    let mut ml_ai = MLAI::new();
    ml_ai.load_pretrained(&value_weights, &policy_weights);

    println!("Setting up test game state...");
    let mut game_state = GameState::new();
    game_state.dice_roll = 2;
    game_state.player1_pieces[0].square = 4;
    game_state.board[4] = Some(game_state.player1_pieces[0]);

    let ml_state = convert_game_state_to_ml(&game_state);
    println!("Calling get_best_move first time...");
    let response1 = ml_ai.get_best_move(&ml_state);
    println!(
        "First call: move={:?}, eval={}",
        response1.r#move, response1.evaluation
    );
    println!("Calling get_best_move second time...");
    let response2 = ml_ai.get_best_move(&ml_state);
    println!(
        "Second call: move={:?}, eval={}",
        response2.r#move, response2.evaluation
    );

    assert_eq!(
        response1.r#move, response2.r#move,
        "ML AI should be consistent"
    );
    assert!(
        (response1.evaluation - response2.evaluation).abs() < 0.001,
        "ML AI evaluation should be consistent"
    );

    println!("✅ ML AI shows consistent behavior");
}

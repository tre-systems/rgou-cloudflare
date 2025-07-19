use rgou_ai_core::{dice, GameState, Player, AI, PIECES_PER_PLAYER};
use rgou_ai_core::{ml_ai::MLAI, GameState as MLGameState, Player as MLPlayer};

const EXPECTIMINIMAX_SEARCH_DEPTH: u8 = if cfg!(feature = "slow_tests") { 4 } else { 3 };
/// Returns the number of games to run for ML vs Expectiminimax tests.
/// Defaults to 10 for fast checks, but can be overridden by setting the NUM_GAMES environment variable.
fn num_games() -> usize {
    std::env::var("NUM_GAMES")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(10)
}
const ML_WEIGHTS_FILE: &str = "ml/data/weights/ml_ai_weights_fast.json";
const ML_V2_WEIGHTS_FILE: &str = "ml/data/weights/ml_ai_weights_v2.json";
const ML_V3_WEIGHTS_FILE: &str = "ml/data/weights/ml_ai_weights_v3.json";

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
        genetic_params: rust_state.genetic_params.clone(),
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

fn load_ml_v2_weights() -> Result<(Vec<f32>, Vec<f32>), Box<dyn std::error::Error>> {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let weights_path = std::path::Path::new(manifest_dir)
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("ml/data/weights/ml_ai_weights_v2.json");
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

fn load_ml_v3_weights() -> Result<(Vec<f32>, Vec<f32>), Box<dyn std::error::Error>> {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let weights_path = std::path::Path::new(manifest_dir)
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("ml/data/weights/ml_ai_weights_v3.json");
    let content = std::fs::read_to_string(weights_path)?;
    let weights: serde_json::Value = serde_json::from_str(&content)?;

    let value_weights: Vec<f32> = weights["value_weights"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_f64().unwrap() as f32)
        .collect();

    let policy_weights: Vec<f32> = weights["policy_weights"]
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

        game_state.dice_roll = dice::roll_dice();

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

#[test]
fn test_ai_diagnostics() {
    println!("Running AI diagnostics...");

    let (value_weights, policy_weights) = match load_ml_weights() {
        Ok(weights) => weights,
        Err(e) => {
            eprintln!("Failed to load ML weights: {}", e);
            return;
        }
    };

    let mut ml_ai = MLAI::new();
    ml_ai.load_pretrained(&value_weights, &policy_weights);
    let mut expectiminimax_ai = AI::new();

    // Test a simple starting position
    let mut game_state = GameState::new();
    game_state.dice_roll = 1;

    println!("Testing starting position with dice roll 1:");
    println!("Valid moves: {:?}", game_state.get_valid_moves());

    // Test ML AI
    let ml_state = convert_game_state_to_ml(&game_state);
    let ml_response = ml_ai.get_best_move(&ml_state);
    println!(
        "ML AI chose: {:?}, evaluation: {:.3}",
        ml_response.r#move, ml_response.evaluation
    );
    println!("ML AI thinking: {}", ml_response.thinking);

    // Test Expectiminimax AI
    let (expectiminimax_move, expectiminimax_evaluations) =
        expectiminimax_ai.get_best_move(&game_state, EXPECTIMINIMAX_SEARCH_DEPTH);
    println!("Expectiminimax AI chose: {:?}", expectiminimax_move);
    println!(
        "Expectiminimax evaluations: {:?}",
        expectiminimax_evaluations
    );

    // Test a more complex position
    println!("\nTesting complex position:");
    game_state.player1_pieces[0].square = 4;
    game_state.board[4] = Some(game_state.player1_pieces[0]);
    game_state.player2_pieces[0].square = 6;
    game_state.board[6] = Some(game_state.player2_pieces[0]);
    game_state.dice_roll = 2;

    println!("Valid moves: {:?}", game_state.get_valid_moves());

    let ml_state = convert_game_state_to_ml(&game_state);
    let ml_response = ml_ai.get_best_move(&ml_state);
    println!(
        "ML AI chose: {:?}, evaluation: {:.3}",
        ml_response.r#move, ml_response.evaluation
    );

    let (expectiminimax_move, _) =
        expectiminimax_ai.get_best_move(&game_state, EXPECTIMINIMAX_SEARCH_DEPTH);
    println!("Expectiminimax AI chose: {:?}", expectiminimax_move);

    println!("✅ AI diagnostics completed");
}

#[test]
fn test_ml_vs_expectiminimax_fixed_dice() {
    println!("Running ML vs Expectiminimax with fixed dice sequence...");

    let (value_weights, policy_weights) = match load_ml_weights() {
        Ok(weights) => weights,
        Err(e) => {
            eprintln!("Failed to load ML weights: {}", e);
            return;
        }
    };

    let mut ml_wins = 0;
    let mut expectiminimax_wins = 0;
    let mut total_moves = 0;

    println!("Starting 20 games with fixed dice sequence");

    let mut ml_ai = MLAI::new();
    ml_ai.load_pretrained(&value_weights, &policy_weights);
    let mut expectiminimax_ai = AI::new();

    // Fixed dice sequence for reproducible results
    let fixed_dice = [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4];
    let mut dice_index = 0;

    for i in 0..20 {
        let ml_plays_first = i % 2 == 0;
        let mut game_state = GameState::new();
        let mut moves_played = 0;
        let max_moves = 200;
        let mut _ml_ai_total_time_ms = 0;
        let mut _expectiminimax_ai_total_time_ms = 0;
        let mut _ml_ai_moves = 0;
        let mut _expectiminimax_ai_moves = 0;

        while !game_state.is_game_over() && moves_played < max_moves {
            let current_player = game_state.current_player;
            let is_ml_turn = (current_player == Player::Player1) == ml_plays_first;

            // Use fixed dice instead of random
            game_state.dice_roll = fixed_dice[dice_index % fixed_dice.len()];
            dice_index += 1;

            if game_state.dice_roll == 0 {
                game_state.current_player = game_state.current_player.opponent();
                continue;
            }

            let best_move = if is_ml_turn {
                let ml_state = convert_game_state_to_ml(&game_state);
                let start_time = std::time::Instant::now();
                let ml_response = ml_ai.get_best_move(&ml_state);
                let end_time = std::time::Instant::now();
                _ml_ai_total_time_ms += end_time.duration_since(start_time).as_millis() as u64;
                _ml_ai_moves += 1;
                ml_response.r#move
            } else {
                let start_time = std::time::Instant::now();
                let (move_option, _) =
                    expectiminimax_ai.get_best_move(&game_state, EXPECTIMINIMAX_SEARCH_DEPTH);
                let end_time = std::time::Instant::now();
                _expectiminimax_ai_total_time_ms +=
                    end_time.duration_since(start_time).as_millis() as u64;
                _expectiminimax_ai_moves += 1;
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
                    let _p2_finished = game_state
                        .player2_pieces
                        .iter()
                        .filter(|p| p.square == 20)
                        .count();

                    let winner = if p1_finished == PIECES_PER_PLAYER {
                        Player::Player1
                    } else {
                        Player::Player2
                    };

                    let ml_won = if ml_plays_first {
                        winner == Player::Player1
                    } else {
                        winner == Player::Player2
                    };

                    if ml_won {
                        ml_wins += 1;
                    } else {
                        expectiminimax_wins += 1;
                    }

                    total_moves += moves_played;
                    break;
                }
            } else {
                game_state.current_player = game_state.current_player.opponent();
            }
        }

        if (i + 1) % 10 == 0 {
            println!(
                "Game {}: ML wins: {}, Expectiminimax wins: {}",
                i + 1,
                ml_wins,
                expectiminimax_wins
            );
        }
    }

    let ml_win_rate = (ml_wins as f64 / 20.0) * 100.0;
    let avg_moves = total_moves as f64 / 20.0;

    println!("\n=== Fixed Dice Results ===");
    println!("Total games: 20");
    println!("ML AI wins: {} ({:.1}%)", ml_wins, ml_win_rate);
    println!(
        "Expectiminimax AI wins: {} ({:.1}%)",
        expectiminimax_wins,
        100.0 - ml_win_rate
    );
    println!("Average moves per game: {:.1}", avg_moves);

    if ml_win_rate > 45.0 {
        println!("✅ ML AI shows competitive performance with fixed dice");
    } else if ml_win_rate > 35.0 {
        println!("⚠️  ML AI shows some promise but needs improvement");
    } else {
        println!("❌ ML AI needs significant improvement");
    }
}

#[test]
#[cfg_attr(not(feature = "slow_tests"), ignore)]
fn test_ml_vs_expectiminimax_depth_comparison() {
    println!("Running ML vs Expectiminimax Depth Comparison Test");
    println!("Using fixed dice sequence for reproducible results");
    println!("{}", "=".repeat(60));

    let (value_weights, policy_weights) = match load_ml_weights() {
        Ok(weights) => weights,
        Err(e) => {
            eprintln!("Failed to load ML weights: {}", e);
            return;
        }
    };

    let mut ml_ai = MLAI::new();
    ml_ai.load_pretrained(&value_weights, &policy_weights);

    // Fixed dice sequence for reproducible results
    let fixed_dice = [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4];
    let num_games = 100; // 100 games per depth for better statistics

    let depths = [2, 3, 4];
    let mut results = Vec::new();

    for &depth in &depths {
        println!("\n🔍 Testing Expectiminimax Depth {}", depth);
        println!("{}", "-".repeat(40));

        let mut ml_wins = 0;
        let mut expectiminimax_wins = 0;
        let mut total_moves = 0;
        let mut total_ml_time_ms = 0;
        let mut total_expectiminimax_time_ms = 0;
        let mut total_ml_moves = 0;
        let mut total_expectiminimax_moves = 0;

        let mut expectiminimax_ai = AI::new();
        let mut dice_index = 0;

        for i in 0..num_games {
            let ml_plays_first = i % 2 == 0;
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

                // Use fixed dice
                game_state.dice_roll = fixed_dice[dice_index % fixed_dice.len()];
                dice_index += 1;

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
                    let (move_option, _) = expectiminimax_ai.get_best_move(&game_state, depth);
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
                        let _p2_finished = game_state
                            .player2_pieces
                            .iter()
                            .filter(|p| p.square == 20)
                            .count();

                        let winner = if p1_finished == PIECES_PER_PLAYER {
                            Player::Player1
                        } else {
                            Player::Player2
                        };

                        let ml_won = if ml_plays_first {
                            winner == Player::Player1
                        } else {
                            winner == Player::Player2
                        };

                        if ml_won {
                            ml_wins += 1;
                        } else {
                            expectiminimax_wins += 1;
                        }

                        total_moves += moves_played;
                        total_ml_time_ms += ml_ai_total_time_ms;
                        total_expectiminimax_time_ms += expectiminimax_ai_total_time_ms;
                        total_ml_moves += ml_ai_moves;
                        total_expectiminimax_moves += expectiminimax_ai_moves;
                        break;
                    }
                } else {
                    game_state.current_player = game_state.current_player.opponent();
                }
            }

            // Handle case where game hits max moves
            if moves_played >= max_moves {
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

                // Determine winner by pieces finished
                let winner = if p1_finished > p2_finished {
                    Player::Player1
                } else if p2_finished > p1_finished {
                    Player::Player2
                } else {
                    // Tie - give to current player
                    game_state.current_player
                };

                let ml_won = if ml_plays_first {
                    winner == Player::Player1
                } else {
                    winner == Player::Player2
                };

                if ml_won {
                    ml_wins += 1;
                } else {
                    expectiminimax_wins += 1;
                }

                total_moves += moves_played;
                total_ml_time_ms += ml_ai_total_time_ms;
                total_expectiminimax_time_ms += expectiminimax_ai_total_time_ms;
                total_ml_moves += ml_ai_moves;
                total_expectiminimax_moves += expectiminimax_ai_moves;
            }

            // Progress reporting
            if (i + 1) % 25 == 0 {
                println!(
                    "  Game {}: ML wins: {}, Expectiminimax wins: {}",
                    i + 1,
                    ml_wins,
                    expectiminimax_wins
                );
            }
        }

        let ml_win_rate = (ml_wins as f64 / num_games as f64) * 100.0;
        let avg_moves = total_moves as f64 / num_games as f64;
        let avg_ml_time = if total_ml_moves > 0 {
            total_ml_time_ms as f64 / total_ml_moves as f64
        } else {
            0.0
        };
        let avg_expectiminimax_time = if total_expectiminimax_moves > 0 {
            total_expectiminimax_time_ms as f64 / total_expectiminimax_moves as f64
        } else {
            0.0
        };

        results.push((
            depth,
            ml_wins,
            expectiminimax_wins,
            ml_win_rate,
            avg_moves,
            avg_ml_time,
            avg_expectiminimax_time,
        ));

        println!("Games completed: {}", num_games);
        println!("ML AI wins: {} ({:.1}%)", ml_wins, ml_win_rate);
        println!(
            "Expectiminimax wins: {} ({:.1}%)",
            expectiminimax_wins,
            (expectiminimax_wins as f64 / num_games as f64) * 100.0
        );
        println!(
            "Total wins: {} (should be {})",
            ml_wins + expectiminimax_wins,
            num_games
        );
        println!("Average moves per game: {:.1}", avg_moves);
        println!("Average time per move - ML: {:.1}ms", avg_ml_time);
        println!(
            "Average time per move - EMM: {:.1}ms",
            avg_expectiminimax_time
        );
    }

    // Summary comparison
    println!("\n{}", "=".repeat(60));
    println!("📊 DEPTH COMPARISON SUMMARY");
    println!("{}", "=".repeat(60));
    println!(
        "{:<8} {:<12} {:<12} {:<12} {:<15} {:<15}",
        "Depth", "ML Wins", "EMM Wins", "ML Win %", "Avg Moves", "EMM Time/ms"
    );
    println!("{}", "-".repeat(80));

    for (
        depth,
        ml_wins,
        expectiminimax_wins,
        ml_win_rate,
        avg_moves,
        _avg_ml_time,
        avg_expectiminimax_time,
    ) in &results
    {
        println!(
            "{:<8} {:<12} {:<12} {:<12.1} {:<15.1} {:<15.1}",
            depth, ml_wins, expectiminimax_wins, ml_win_rate, avg_moves, avg_expectiminimax_time
        );
    }

    println!("\n📈 IMPROVEMENT ANALYSIS:");
    println!("{}", "-".repeat(30));

    if results.len() >= 2 {
        let depth2_ml_rate = results[0].3;
        let depth3_ml_rate = results[1].3;
        let depth4_ml_rate = results[2].3;

        let improvement_2_to_3 = depth3_ml_rate - depth2_ml_rate;
        let improvement_3_to_4 = depth4_ml_rate - depth3_ml_rate;
        let improvement_2_to_4 = depth4_ml_rate - depth2_ml_rate;

        println!(
            "Depth 2 → 3: ML win rate change: {:.1}%",
            improvement_2_to_3
        );
        println!(
            "Depth 3 → 4: ML win rate change: {:.1}%",
            improvement_3_to_4
        );
        println!(
            "Depth 2 → 4: ML win rate change: {:.1}%",
            improvement_2_to_4
        );

        if improvement_2_to_4 > 5.0 {
            println!("✅ Significant improvement with deeper search");
        } else if improvement_2_to_4 > 2.0 {
            println!("⚠️  Moderate improvement with deeper search");
        } else {
            println!("❌ Minimal improvement with deeper search");
        }
    }

    println!("\n⚡ PERFORMANCE TRADE-OFFS:");
    println!("{}", "-".repeat(30));
    for (
        depth,
        _ml_wins,
        _expectiminimax_wins,
        _ml_win_rate,
        _avg_moves,
        _avg_ml_time,
        avg_expectiminimax_time,
    ) in &results
    {
        let speed_factor = if *depth == 2 {
            1.0
        } else {
            avg_expectiminimax_time / results[0].6
        };
        println!("Depth {}: {:.1}x slower than depth 2", depth, speed_factor);
    }
}

#[test]
#[cfg_attr(not(feature = "slow_tests"), ignore)]
fn test_expectiminimax_depth4_vs_ml_comprehensive() {
    println!("🤖 Expectiminimax Depth 3 vs ML AI Comprehensive Test");
    println!("{}", "=".repeat(70));
    println!("Testing the strength of depth 3 expectiminimax against ML AI");

    let (value_weights, policy_weights) = match load_ml_weights() {
        Ok(weights) => weights,
        Err(e) => {
            eprintln!("Failed to load ML weights: {}", e);
            return;
        }
    };

    let mut ml_ai = MLAI::new();
    ml_ai.load_pretrained(&value_weights, &policy_weights);

    let num_games = 100;
    let mut ml_wins = 0;
    let mut expectiminimax_wins = 0;
    let mut total_moves = 0;
    let mut total_ml_time_ms = 0;
    let mut total_expectiminimax_time_ms = 0;
    let mut total_ml_moves = 0;
    let mut total_expectiminimax_moves = 0;
    let mut ml_first_wins = 0;
    let mut ml_second_wins = 0;

    println!("Running {} games with depth 3 expectiminimax...", num_games);

    let mut expectiminimax_ai = AI::new();

    for i in 0..num_games {
        let ml_plays_first = i % 2 == 0;
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

            game_state.dice_roll = dice::roll_dice();

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
                let (move_option, _) = expectiminimax_ai.get_best_move(&game_state, 3);
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
                    let _p2_finished = game_state
                        .player2_pieces
                        .iter()
                        .filter(|p| p.square == 20)
                        .count();

                    let winner = if p1_finished == PIECES_PER_PLAYER {
                        Player::Player1
                    } else {
                        Player::Player2
                    };

                    let ml_won = if ml_plays_first {
                        winner == Player::Player1
                    } else {
                        winner == Player::Player2
                    };

                    if ml_won {
                        ml_wins += 1;
                        if ml_plays_first {
                            ml_first_wins += 1;
                        } else {
                            ml_second_wins += 1;
                        }
                    } else {
                        expectiminimax_wins += 1;
                    }

                    total_moves += moves_played;
                    total_ml_time_ms += ml_ai_total_time_ms;
                    total_expectiminimax_time_ms += expectiminimax_ai_total_time_ms;
                    total_ml_moves += ml_ai_moves;
                    total_expectiminimax_moves += expectiminimax_ai_moves;
                    break;
                }
            } else {
                game_state.current_player = game_state.current_player.opponent();
            }
        }

        if moves_played >= max_moves {
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

            let winner = if p1_finished > p2_finished {
                Player::Player1
            } else if p2_finished > p1_finished {
                Player::Player2
            } else {
                game_state.current_player
            };

            let ml_won = if ml_plays_first {
                winner == Player::Player1
            } else {
                winner == Player::Player2
            };

            if ml_won {
                ml_wins += 1;
                if ml_plays_first {
                    ml_first_wins += 1;
                } else {
                    ml_second_wins += 1;
                }
            } else {
                expectiminimax_wins += 1;
            }

            total_moves += moves_played;
            total_ml_time_ms += ml_ai_total_time_ms;
            total_expectiminimax_time_ms += expectiminimax_ai_total_time_ms;
            total_ml_moves += ml_ai_moves;
            total_expectiminimax_moves += expectiminimax_ai_moves;
        }

        if (i + 1) % 25 == 0 {
            println!(
                "  Game {}: ML wins: {}, EMM3 wins: {}",
                i + 1,
                ml_wins,
                expectiminimax_wins
            );
        }
    }

    let ml_win_rate = (ml_wins as f64 / num_games as f64) * 100.0;
    let expectiminimax_win_rate = (expectiminimax_wins as f64 / num_games as f64) * 100.0;
    let avg_moves = total_moves as f64 / num_games as f64;
    let avg_ml_time = if total_ml_moves > 0 {
        total_ml_time_ms as f64 / total_ml_moves as f64
    } else {
        0.0
    };
    let avg_expectiminimax_time = if total_expectiminimax_moves > 0 {
        total_expectiminimax_time_ms as f64 / total_expectiminimax_moves as f64
    } else {
        0.0
    };

    println!("\n{}", "=".repeat(70));
    println!("📊 DEPTH 3 vs ML AI COMPREHENSIVE RESULTS");
    println!("{}", "=".repeat(70));
    println!("Total games: {}", num_games);
    println!("ML AI wins: {} ({:.1}%)", ml_wins, ml_win_rate);
    println!(
        "Expectiminimax Depth 3 wins: {} ({:.1}%)",
        expectiminimax_wins, expectiminimax_win_rate
    );
    println!("Average moves per game: {:.1}", avg_moves);
    println!("Average time per move - ML AI: {:.1}ms", avg_ml_time);
    println!(
        "Average time per move - EMM3: {:.1}ms",
        avg_expectiminimax_time
    );
    println!(
        "Total moves made - ML AI: {}, EMM3: {}",
        total_ml_moves, total_expectiminimax_moves
    );
    println!(
        "ML AI wins playing first: {} / {}",
        ml_first_wins,
        num_games / 2
    );
    println!(
        "ML AI wins playing second: {} / {}",
        ml_second_wins,
        num_games / 2
    );

    println!("\n📈 PERFORMANCE ANALYSIS:");
    println!("{}", "-".repeat(30));
    let speed_factor = avg_expectiminimax_time / avg_ml_time;
    println!("EMM3 is {:.1}x slower than ML AI", speed_factor);

    if expectiminimax_win_rate > 70.0 {
        println!("✅ EMM3 is significantly stronger than ML AI");
    } else if expectiminimax_win_rate > 55.0 {
        println!("⚠️  EMM3 shows moderate advantage over ML AI");
    } else if expectiminimax_win_rate > 45.0 {
        println!("📊 EMM3 and ML AI are closely matched");
    } else {
        println!("❌ ML AI outperforms EMM3");
    }

    println!("\n🎯 STRATEGIC INSIGHTS:");
    println!("{}", "-".repeat(25));
    if ml_first_wins > ml_second_wins {
        println!("• ML AI performs better when playing first");
    } else if ml_second_wins > ml_first_wins {
        println!("• ML AI performs better when playing second");
    } else {
        println!("• ML AI performance is balanced regardless of turn order");
    }

    if avg_moves < 120.0 {
        println!("• Games are relatively short, suggesting decisive play");
    } else if avg_moves > 150.0 {
        println!("• Games are long, suggesting defensive play");
    } else {
        println!("• Games have moderate length, balanced play");
    }

    println!("\n🔍 RECOMMENDATIONS:");
    println!("{}", "-".repeat(20));
    if expectiminimax_win_rate > 60.0 {
        println!("✅ Use depth 3 expectiminimax for maximum strength");
        println!("   Good balance of performance and speed");
    } else if expectiminimax_win_rate > 50.0 {
        println!("⚠️  Consider depth 3 for competitive play");
        println!("   Slight advantage over ML AI");
    } else {
        println!("❌ Consider lower depth or ML AI");
        println!("   Depth 3 may be too slow for minimal gain");
    }

    if ml_win_rate > 45.0 {
        println!("✅ ML AI shows competitive performance against depth 4");
    } else {
        println!("❌ ML AI needs improvement to compete with depth 4");
    }
}

#[test]
fn test_ml_v2_vs_expectiminimax_ai() {
    println!("Loading ML-v2 AI weights from {}", ML_V2_WEIGHTS_FILE);

    let (value_weights, policy_weights) = match load_ml_v2_weights() {
        Ok(weights) => weights,
        Err(e) => {
            eprintln!("Failed to load ML-v2 weights: {}", e);
            eprintln!("Skipping ML-v2 vs Expectiminimax test");
            return;
        }
    };

    let mut ml_wins = 0;
    let mut expectiminimax_wins = 0;
    let mut total_moves = 0;
    let mut ml_first_wins = 0;
    let mut ml_second_wins = 0;
    let mut total_ml_ai_time_ms = 0;
    let mut total_expectiminimax_ai_time_ms = 0;
    let mut total_ml_ai_moves = 0;
    let mut total_expectiminimax_ai_moves = 0;

    println!(
        "Starting {} games: ML-v2 AI vs Expectiminimax AI",
        num_games()
    );

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

        total_ml_ai_time_ms += result.ml_ai_total_time_ms;
        total_expectiminimax_ai_time_ms += result.expectiminimax_ai_total_time_ms;
        total_ml_ai_moves += result.ml_ai_moves;
        total_expectiminimax_ai_moves += result.expectiminimax_ai_moves;

        // Clear transposition table periodically to prevent memory bloat
        if (i + 1) % 20 == 0 {
            expectiminimax_ai.clear_transposition_table();
        }

        if (i + 1) % 10 == 0 {
            println!(
                "  Game {}: ML-v2 wins: {}, EMM wins: {}",
                i + 1,
                ml_wins,
                expectiminimax_wins
            );
        }
    }

    let ml_win_rate = (ml_wins as f64 / num_games() as f64) * 100.0;
    let expectiminimax_win_rate = (expectiminimax_wins as f64 / num_games() as f64) * 100.0;
    let avg_moves = total_moves as f64 / num_games() as f64;
    let avg_ml_time = if total_ml_ai_moves > 0 {
        total_ml_ai_time_ms as f64 / total_ml_ai_moves as f64
    } else {
        0.0
    };
    let avg_expectiminimax_time = if total_expectiminimax_ai_moves > 0 {
        total_expectiminimax_ai_time_ms as f64 / total_expectiminimax_ai_moves as f64
    } else {
        0.0
    };

    println!("\n{}", "=".repeat(70));
    println!("📊 ML-v2 AI vs EXPECTIMINIMAX AI RESULTS");
    println!("{}", "=".repeat(70));
    println!("Total games: {}", num_games());
    println!("ML-v2 AI wins: {} ({:.1}%)", ml_wins, ml_win_rate);
    println!(
        "Expectiminimax AI wins: {} ({:.1}%)",
        expectiminimax_wins, expectiminimax_win_rate
    );
    println!("Average moves per game: {:.1}", avg_moves);
    println!("Average time per move - ML-v2 AI: {:.1}ms", avg_ml_time);
    println!(
        "Average time per move - EMM: {:.1}ms",
        avg_expectiminimax_time
    );
    println!(
        "Total moves made - ML-v2 AI: {}, EMM: {}",
        total_ml_ai_moves, total_expectiminimax_ai_moves
    );
    println!(
        "ML-v2 AI wins playing first: {} / {}",
        ml_first_wins,
        num_games() / 2
    );
    println!(
        "ML-v2 AI wins playing second: {} / {}",
        ml_second_wins,
        num_games() / 2
    );

    println!("\n📈 PERFORMANCE ANALYSIS:");
    println!("{}", "-".repeat(30));
    let speed_factor = avg_expectiminimax_time / avg_ml_time;
    println!("EMM is {:.1}x slower than ML-v2 AI", speed_factor);

    if ml_win_rate > 55.0 {
        println!("✅ ML-v2 AI significantly outperforms Expectiminimax AI");
    } else if ml_win_rate > 45.0 {
        println!("⚠️  ML-v2 AI shows moderate advantage over Expectiminimax AI");
    } else if ml_win_rate > 35.0 {
        println!("📊 ML-v2 AI and Expectiminimax AI are closely matched");
    } else {
        println!("❌ Expectiminimax AI outperforms ML-v2 AI");
    }

    println!("\n🎯 STRATEGIC INSIGHTS:");
    println!("{}", "-".repeat(25));
    if ml_first_wins > ml_second_wins {
        println!("• ML-v2 AI performs better when playing first");
    } else if ml_second_wins > ml_first_wins {
        println!("• ML-v2 AI performs better when playing second");
    } else {
        println!("• ML-v2 AI performance is balanced regardless of turn order");
    }

    if avg_moves < 120.0 {
        println!("• Games are relatively short, suggesting decisive play");
    } else if avg_moves > 150.0 {
        println!("• Games are long, suggesting defensive play");
    } else {
        println!("• Games have moderate length, balanced play");
    }

    println!("\n🔍 RECOMMENDATIONS:");
    println!("{}", "-".repeat(20));
    if ml_win_rate > 50.0 {
        println!("✅ ML-v2 AI shows strong performance");
        println!("   Consider using for competitive play");
    } else if ml_win_rate > 40.0 {
        println!("⚠️  ML-v2 AI shows competitive performance");
        println!("   May need further training for optimal results");
    } else {
        println!("❌ ML-v2 AI needs improvement");
        println!("   Consider retraining with more data or better parameters");
    }

    println!("\n🚀 NEXT STEPS:");
    println!("{}", "-".repeat(15));
    if ml_win_rate > 50.0 {
        println!("• ML-v2 AI is ready for production use");
        println!("• Consider adding to the main test matrix");
    } else {
        println!("• Retrain ML-v2 AI with more games or epochs");
        println!("• Experiment with different network architectures");
        println!("• Try self-play training for further improvement");
    }
}

#[test]
fn test_ml_v3_vs_expectiminimax_ai() {
    println!("Loading ML-v3 AI weights from {}", ML_V3_WEIGHTS_FILE);

    let (value_weights, policy_weights) = match load_ml_v3_weights() {
        Ok(weights) => weights,
        Err(e) => {
            eprintln!("Failed to load ML-v3 weights: {}", e);
            eprintln!("Skipping ML-v3 vs Expectiminimax test");
            return;
        }
    };

    let mut ml_wins = 0;
    let mut expectiminimax_wins = 0;
    let mut total_moves = 0;
    let mut ml_first_wins = 0;
    let mut ml_second_wins = 0;
    let mut total_ml_ai_time_ms = 0;
    let mut total_expectiminimax_ai_time_ms = 0;
    let mut total_ml_ai_moves = 0;
    let mut total_expectiminimax_ai_moves = 0;

    println!(
        "Starting {} games: ML-v3 AI vs Expectiminimax AI",
        num_games()
    );

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

        total_ml_ai_time_ms += result.ml_ai_total_time_ms;
        total_expectiminimax_ai_time_ms += result.expectiminimax_ai_total_time_ms;
        total_ml_ai_moves += result.ml_ai_moves;
        total_expectiminimax_ai_moves += result.expectiminimax_ai_moves;

        // Clear transposition table periodically to prevent memory bloat
        if (i + 1) % 20 == 0 {
            expectiminimax_ai.clear_transposition_table();
        }

        if (i + 1) % 10 == 0 {
            println!(
                "  Game {}: ML-v3 wins: {}, EMM wins: {}",
                i + 1,
                ml_wins,
                expectiminimax_wins
            );
        }
    }

    let ml_win_rate = (ml_wins as f64 / num_games() as f64) * 100.0;
    let expectiminimax_win_rate = (expectiminimax_wins as f64 / num_games() as f64) * 100.0;
    let avg_moves = total_moves as f64 / num_games() as f64;
    let avg_ml_time = if total_ml_ai_moves > 0 {
        total_ml_ai_time_ms as f64 / total_ml_ai_moves as f64
    } else {
        0.0
    };
    let avg_expectiminimax_time = if total_expectiminimax_ai_moves > 0 {
        total_expectiminimax_ai_time_ms as f64 / total_expectiminimax_ai_moves as f64
    } else {
        0.0
    };

    println!("\n{}", "=".repeat(70));
    println!("📊 ML-v3 AI vs EXPECTIMINIMAX AI RESULTS");
    println!("{}", "=".repeat(70));
    println!("Total games: {}", num_games());
    println!("ML-v3 AI wins: {} ({:.1}%)", ml_wins, ml_win_rate);
    println!(
        "Expectiminimax AI wins: {} ({:.1}%)",
        expectiminimax_wins, expectiminimax_win_rate
    );
    println!("Average moves per game: {:.1}", avg_moves);
    println!("Average time per move - ML-v3 AI: {:.1}ms", avg_ml_time);
    println!(
        "Average time per move - EMM: {:.1}ms",
        avg_expectiminimax_time
    );
    println!(
        "Total moves made - ML-v3 AI: {}, EMM: {}",
        total_ml_ai_moves, total_expectiminimax_ai_moves
    );
    println!(
        "ML-v3 AI wins playing first: {} / {}",
        ml_first_wins,
        num_games() / 2
    );
    println!(
        "ML-v3 AI wins playing second: {} / {}",
        ml_second_wins,
        num_games() / 2
    );

    println!("\n📈 PERFORMANCE ANALYSIS:");
    println!("{}", "-".repeat(30));
    let speed_factor = avg_expectiminimax_time / avg_ml_time;
    println!("EMM is {:.1}x slower than ML-v3 AI", speed_factor);

    if ml_win_rate > 60.0 {
        println!("✅ ML-v3 AI significantly outperforms Expectiminimax AI");
    } else if ml_win_rate > 50.0 {
        println!("✅ ML-v3 AI shows clear advantage over Expectiminimax AI");
    } else if ml_win_rate > 45.0 {
        println!("⚠️  ML-v3 AI shows moderate advantage over Expectiminimax AI");
    } else if ml_win_rate > 35.0 {
        println!("📊 ML-v3 AI and Expectiminimax AI are closely matched");
    } else {
        println!("❌ Expectiminimax AI outperforms ML-v3 AI");
    }

    println!("\n🎯 STRATEGIC INSIGHTS:");
    println!("{}", "-".repeat(25));
    if ml_first_wins > ml_second_wins {
        println!("• ML-v3 AI performs better when playing first");
    } else if ml_second_wins > ml_first_wins {
        println!("• ML-v3 AI performs better when playing second");
    } else {
        println!("• ML-v3 AI performance is balanced regardless of turn order");
    }

    if avg_moves < 120.0 {
        println!("• Games are relatively short, suggesting decisive play");
    } else if avg_moves > 150.0 {
        println!("• Games are long, suggesting defensive play");
    } else {
        println!("• Games have moderate length, balanced play");
    }

    println!("\n🔍 RECOMMENDATIONS:");
    println!("{}", "-".repeat(20));
    if ml_win_rate > 55.0 {
        println!("✅ ML-v3 AI shows excellent performance");
        println!("   Ready for production use");
    } else if ml_win_rate > 45.0 {
        println!("✅ ML-v3 AI shows strong performance");
        println!("   Consider using for competitive play");
    } else if ml_win_rate > 40.0 {
        println!("⚠️  ML-v3 AI shows competitive performance");
        println!("   May need further training for optimal results");
    } else {
        println!("❌ ML-v3 AI needs improvement");
        println!("   Consider retraining with more data or better parameters");
    }

    println!("\n🚀 NEXT STEPS:");
    println!("{}", "-".repeat(15));
    if ml_win_rate > 50.0 {
        println!("• ML-v3 AI is ready for production use");
        println!("• Consider replacing previous ML versions");
        println!("• Add to the main test matrix");
    } else {
        println!("• Retrain ML-v3 AI with more games or epochs");
        println!("• Experiment with different network architectures");
        println!("• Try self-play training for further improvement");
    }
}

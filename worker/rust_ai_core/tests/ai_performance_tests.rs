use rgou_ai_core::{dice, GameState, Player, AI, PIECES_PER_PLAYER};
use rgou_ai_core::{ml_ai::MLAI, GameState as MLGameState, Player as MLPlayer};
use std::time::Instant;

const NUM_GAMES: usize = 10;

#[derive(Debug, Clone)]
struct PerformanceResult {
    ai_type: String,
    win_rate: f64,
    avg_time_ms: f64,
    avg_nodes: u64,
    memory_usage_mb: f64,
}

#[test]
fn test_ai_performance_matrix() {
    println!("🤖 AI Performance Matrix Test");
    println!("{}", "=".repeat(50));

    let mut results = Vec::new();

    // Test Expectiminimax at different depths
    for depth in 1..=3 {
        let result = test_expectiminimax_performance(depth);
        results.push(result);
    }

    // Test ML AI if weights are available
    if let Ok(result) = test_ml_ai_performance() {
        results.push(result);
    }

    // Test Heuristic AI
    let heuristic_result = test_heuristic_performance();
    results.push(heuristic_result);

    // Print results table
    println!("\n📊 Performance Results:");
    println!("{}", "=".repeat(80));
    println!(
        "{:<15} {:<12} {:<15} {:<12} {:<15}",
        "AI Type", "Win Rate", "Avg Time", "Avg Nodes", "Memory (MB)"
    );
    println!("{}", "-".repeat(80));

    for result in &results {
        println!(
            "{:<15} {:<12.1}% {:<15.1}ms {:<12} {:<15.1}",
            result.ai_type,
            result.win_rate * 100.0,
            result.avg_time_ms,
            result.avg_nodes,
            result.memory_usage_mb
        );
    }

    // Generate recommendations
    println!("\n🎯 Recommendations:");
    println!("{}", "-".repeat(30));

    let best_performance = results
        .iter()
        .max_by(|a, b| a.win_rate.partial_cmp(&b.win_rate).unwrap())
        .unwrap();

    let fastest = results
        .iter()
        .min_by(|a, b| a.avg_time_ms.partial_cmp(&b.avg_time_ms).unwrap())
        .unwrap();

    println!(
        "• Best Performance: {} ({:.1}% win rate)",
        best_performance.ai_type,
        best_performance.win_rate * 100.0
    );
    println!(
        "• Fastest: {} ({:.1}ms avg)",
        fastest.ai_type, fastest.avg_time_ms
    );
    println!(
        "• Production Choice: {} (best balance of speed and strength)",
        best_performance.ai_type
    );
    println!("• Learning Choice: ML AI (adaptive behavior)");
    println!("• Educational Choice: Heuristic (understandable logic)");
}

fn measure_transposition_table_memory(depth: u8) -> f64 {
    let mut ai = AI::new();
    let test_state = GameState::new();

    // Run some searches to populate transposition table
    for _ in 0..10 {
        let _ = ai.get_best_move(&test_state, depth);
    }

    let table_size = ai.get_transposition_table_size();
    let memory_bytes = table_size * std::mem::size_of::<u64>() * 2; // Rough estimate
    memory_bytes as f64 / (1024.0 * 1024.0) // Convert to MB
}

fn test_expectiminimax_performance(depth: u8) -> PerformanceResult {
    let mut ai = AI::new();
    let mut total_wins = 0;
    let mut total_time = 0;
    let mut total_nodes = 0;

    for _ in 0..NUM_GAMES {
        let mut game_state = GameState::new();
        let mut moves_played = 0;
        let max_moves = 100;

        while !game_state.is_game_over() && moves_played < max_moves {
            game_state.dice_roll = dice::roll_dice();

            if game_state.dice_roll == 0 {
                game_state.current_player = game_state.current_player.opponent();
                continue;
            }

            let start = Instant::now();
            let (best_move, _) = ai.get_best_move(&game_state, depth);
            let duration = start.elapsed();

            total_time += duration.as_millis() as u64;
            total_nodes += ai.nodes_evaluated;

            if let Some(move_index) = best_move {
                game_state.make_move(move_index).unwrap();
            } else {
                game_state.current_player = game_state.current_player.opponent();
            }
            moves_played += 1;
        }

        // Determine winner
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

        if p1_finished == PIECES_PER_PLAYER {
            total_wins += 1;
        }
    }

    PerformanceResult {
        ai_type: format!("EMM-{}", depth),
        win_rate: total_wins as f64 / NUM_GAMES as f64,
        avg_time_ms: total_time as f64 / NUM_GAMES as f64,
        avg_nodes: (total_nodes / NUM_GAMES as u32) as u64,
        memory_usage_mb: measure_transposition_table_memory(depth),
    }
}

fn test_ml_ai_performance() -> Result<PerformanceResult, Box<dyn std::error::Error>> {
    // Try to load ML weights
    let weights_path = std::path::Path::new("../../ml/data/weights/ml_ai_weights_fast.json");
    if !weights_path.exists() {
        return Err("ML weights not found".into());
    }

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

    let mut ml_ai = MLAI::new();
    ml_ai.load_pretrained(&value_weights, &policy_weights);

    let mut total_wins = 0;
    let mut total_time = 0;

    for _ in 0..NUM_GAMES {
        let mut game_state = GameState::new();
        let mut moves_played = 0;
        let max_moves = 100;

        while !game_state.is_game_over() && moves_played < max_moves {
            game_state.dice_roll = dice::roll_dice();

            if game_state.dice_roll == 0 {
                game_state.current_player = game_state.current_player.opponent();
                continue;
            }

            let ml_state = convert_game_state_to_ml(&game_state);
            let start = Instant::now();
            let response = ml_ai.get_best_move(&ml_state);
            let duration = start.elapsed();

            total_time += duration.as_millis() as u64;

            if let Some(move_index) = response.r#move {
                game_state.make_move(move_index).unwrap();
            } else {
                game_state.current_player = game_state.current_player.opponent();
            }
            moves_played += 1;
        }

        let p1_finished = game_state
            .player1_pieces
            .iter()
            .filter(|p| p.square == 20)
            .count();
        if p1_finished == PIECES_PER_PLAYER {
            total_wins += 1;
        }
    }

    Ok(PerformanceResult {
        ai_type: "ML AI".to_string(),
        win_rate: total_wins as f64 / NUM_GAMES as f64,
        avg_time_ms: total_time as f64 / NUM_GAMES as f64,
        avg_nodes: 0, // ML AI doesn't track nodes
        memory_usage_mb: 2.0,
    })
}

fn test_heuristic_performance() -> PerformanceResult {
    let mut ai = rgou_ai_core::HeuristicAI::new();
    let mut total_wins = 0;
    let mut total_time = 0;
    let mut total_nodes = 0;

    for _ in 0..NUM_GAMES {
        let mut game_state = GameState::new();
        let mut moves_played = 0;
        let max_moves = 100;

        while !game_state.is_game_over() && moves_played < max_moves {
            game_state.dice_roll = dice::roll_dice();

            if game_state.dice_roll == 0 {
                game_state.current_player = game_state.current_player.opponent();
                continue;
            }

            let start = Instant::now();
            let (best_move, _) = ai.get_best_move(&game_state);
            let duration = start.elapsed();

            total_time += duration.as_millis() as u64;
            total_nodes += ai.nodes_evaluated;

            if let Some(move_index) = best_move {
                game_state.make_move(move_index).unwrap();
            } else {
                game_state.current_player = game_state.current_player.opponent();
            }
            moves_played += 1;
        }

        let p1_finished = game_state
            .player1_pieces
            .iter()
            .filter(|p| p.square == 20)
            .count();
        if p1_finished == PIECES_PER_PLAYER {
            total_wins += 1;
        }
    }

    PerformanceResult {
        ai_type: "Heuristic".to_string(),
        win_rate: total_wins as f64 / NUM_GAMES as f64,
        avg_time_ms: total_time as f64 / NUM_GAMES as f64,
        avg_nodes: (total_nodes / NUM_GAMES as u32) as u64,
        memory_usage_mb: 0.1,
    }
}

fn convert_game_state_to_ml(rust_state: &GameState) -> MLGameState {
    MLGameState {
        board: rust_state
            .board
            .iter()
            .map(|opt_piece| {
                opt_piece.as_ref().map(|p| rgou_ai_core::PiecePosition {
                    square: p.square,
                    player: match p.player {
                        Player::Player1 => MLPlayer::Player1,
                        Player::Player2 => MLPlayer::Player2,
                    },
                })
            })
            .collect(),
        player1_pieces: rust_state
            .player1_pieces
            .iter()
            .map(|p| rgou_ai_core::PiecePosition {
                square: p.square,
                player: MLPlayer::Player1,
            })
            .collect(),
        player2_pieces: rust_state
            .player2_pieces
            .iter()
            .map(|p| rgou_ai_core::PiecePosition {
                square: p.square,
                player: MLPlayer::Player2,
            })
            .collect(),
        current_player: match rust_state.current_player {
            Player::Player1 => MLPlayer::Player1,
            Player::Player2 => MLPlayer::Player2,
        },
        dice_roll: rust_state.dice_roll,
        genetic_params: rust_state.genetic_params.clone(),
    }
}

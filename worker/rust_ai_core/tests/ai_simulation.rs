use rand::Rng;
use rgou_ai_core::{dice, GameState, HeuristicAI, Player, AI, PIECES_PER_PLAYER};

const NUM_GAMES: usize = 50;

#[derive(Debug, Clone)]
struct SimulationResult {
    depth1: u8,
    depth2: u8,
    depth1_wins: usize,
    depth2_wins: usize,
    total_moves: usize,
    avg_moves: f64,
    depth1_avg_time_ms: f64,
    depth2_avg_time_ms: f64,
}

fn play_game(ai1: &mut AI, ai2: &mut AI, depth1: u8, depth2: u8) -> (Player, usize, u64, u64) {
    let mut game_state = GameState::new();
    let mut moves_played = 0;
    let max_moves = 200;
    let mut depth1_total_time_ms = 0;
    let mut depth2_total_time_ms = 0;

    loop {
        let current_player = game_state.current_player;
        let current_ai = if current_player == Player::Player1 {
            &mut *ai1
        } else {
            &mut *ai2
        };

        game_state.dice_roll = dice::roll_dice();

        if game_state.dice_roll == 0 {
            game_state.current_player = game_state.current_player.opponent();
            continue;
        }

        let depth = if current_player == Player::Player1 {
            depth1
        } else {
            depth2
        };

        let start_time = std::time::Instant::now();
        let (best_move, _) = current_ai.get_best_move(&game_state, depth);
        let end_time = std::time::Instant::now();
        let move_time = end_time.duration_since(start_time).as_millis() as u64;

        if current_player == Player::Player1 {
            depth1_total_time_ms += move_time;
        } else {
            depth2_total_time_ms += move_time;
        }

        if let Some(piece_index) = best_move {
            game_state.make_move(piece_index).unwrap();
            moves_played += 1;

            if game_state.is_game_over() {
                let p1_finished = game_state
                    .player1_pieces
                    .iter()
                    .filter(|p| p.square == 20)
                    .count();
                if p1_finished == PIECES_PER_PLAYER {
                    return (
                        Player::Player1,
                        moves_played,
                        depth1_total_time_ms,
                        depth2_total_time_ms,
                    );
                } else {
                    return (
                        Player::Player2,
                        moves_played,
                        depth1_total_time_ms,
                        depth2_total_time_ms,
                    );
                }
            }
        } else {
            game_state.current_player = game_state.current_player.opponent();
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

            if p1_finished > p2_finished {
                return (
                    Player::Player1,
                    moves_played,
                    depth1_total_time_ms,
                    depth2_total_time_ms,
                );
            } else if p2_finished > p1_finished {
                return (
                    Player::Player2,
                    moves_played,
                    depth1_total_time_ms,
                    depth2_total_time_ms,
                );
            } else {
                return (
                    game_state.current_player,
                    moves_played,
                    depth1_total_time_ms,
                    depth2_total_time_ms,
                );
            }
        }
    }
}

fn run_depth_comparison(depth1: u8, depth2: u8) -> SimulationResult {
    let mut depth1_wins = 0;
    let mut depth2_wins = 0;
    let mut total_moves = 0;
    let mut depth1_total_time_ms = 0;
    let mut depth2_total_time_ms = 0;

    println!("  Testing Depth {} vs Depth {}...", depth1, depth2);

    for i in 0..NUM_GAMES {
        let mut ai1 = AI::new();
        let mut ai2 = AI::new();

        let (winner, moves, time1, time2) = play_game(&mut ai1, &mut ai2, depth1, depth2);

        if winner == Player::Player1 {
            depth1_wins += 1;
        } else {
            depth2_wins += 1;
        }

        total_moves += moves;
        depth1_total_time_ms += time1;
        depth2_total_time_ms += time2;

        if (i + 1) % 10 == 0 {
            println!(
                "    Game {}: Depth {} wins: {}, Depth {} wins: {}",
                i + 1,
                depth1,
                depth1_wins,
                depth2,
                depth2_wins
            );
        }
    }

    let avg_moves = total_moves as f64 / NUM_GAMES as f64;
    let depth1_avg_time = depth1_total_time_ms as f64 / NUM_GAMES as f64;
    let depth2_avg_time = depth2_total_time_ms as f64 / NUM_GAMES as f64;

    SimulationResult {
        depth1,
        depth2,
        depth1_wins,
        depth2_wins,
        total_moves,
        avg_moves,
        depth1_avg_time_ms: depth1_avg_time,
        depth2_avg_time_ms: depth2_avg_time,
    }
}

#[test]
fn test_ai_vs_ai_simulation() {
    println!("🤖 AI vs AI Depth Comparison Test");
    println!("{}", "=".repeat(60));
    println!("Running {} games per comparison", NUM_GAMES);

    let mut results = Vec::new();

    // Only run depth 4 comparisons if RUN_SLOW_TESTS environment variable is set
    let comparisons = if std::env::var("RUN_SLOW_TESTS").is_ok() {
        vec![(1, 4), (2, 4), (3, 4)]
    } else {
        vec![(1, 3), (2, 3)] // Skip depth 4 tests for regular runs
    };

    for &(depth1, depth2) in &comparisons {
        println!(
            "\n🔍 Comparison {}: Depth {} vs Depth {}",
            results.len() + 1,
            depth1,
            depth2
        );
        println!("{}", "-".repeat(50));

        let result = run_depth_comparison(depth1, depth2);
        results.push(result.clone());

        let depth1_win_rate = (result.depth1_wins as f64 / NUM_GAMES as f64) * 100.0;
        let depth2_win_rate = (result.depth2_wins as f64 / NUM_GAMES as f64) * 100.0;

        println!("  Results:");
        println!(
            "    Depth {} wins: {} ({:.1}%)",
            depth1, result.depth1_wins, depth1_win_rate
        );
        println!(
            "    Depth {} wins: {} ({:.1}%)",
            depth2, result.depth2_wins, depth2_win_rate
        );
        println!("    Average moves per game: {:.1}", result.avg_moves);
        println!(
            "    Depth {} avg time: {:.1}ms",
            depth1, result.depth1_avg_time_ms
        );
        println!(
            "    Depth {} avg time: {:.1}ms",
            depth2, result.depth2_avg_time_ms
        );
    }

    println!("\n{}", "=".repeat(60));
    println!("📊 COMPREHENSIVE RESULTS SUMMARY");
    println!("{}", "=".repeat(60));
    println!(
        "{:<12} {:<12} {:<12} {:<12} {:<15} {:<15}",
        "Depth 1", "Depth 2", "D1 Wins", "D2 Wins", "D1 Win %", "Avg Moves"
    );
    println!("{}", "-".repeat(90));

    for result in &results {
        let depth1_win_rate = (result.depth1_wins as f64 / NUM_GAMES as f64) * 100.0;
        println!(
            "{:<12} {:<12} {:<12} {:<12} {:<15.1} {:<15.1}",
            result.depth1,
            result.depth2,
            result.depth1_wins,
            result.depth2_wins,
            depth1_win_rate,
            result.avg_moves
        );
    }

    println!("\n📈 DEPTH 4 IMPROVEMENT ANALYSIS:");
    println!("{}", "-".repeat(40));

    for result in &results {
        let depth1_win_rate = (result.depth1_wins as f64 / NUM_GAMES as f64) * 100.0;
        let depth2_win_rate = (result.depth2_wins as f64 / NUM_GAMES as f64) * 100.0;
        let improvement = depth2_win_rate - depth1_win_rate;
        let speed_factor = result.depth2_avg_time_ms / result.depth1_avg_time_ms;

        println!(
            "Depth {} → 4: Win rate change: {:.1}%",
            result.depth1, improvement
        );
        println!("  Speed factor: {:.1}x slower", speed_factor);

        if improvement > 20.0 {
            println!("  ✅ Significant improvement with depth 4");
        } else if improvement > 10.0 {
            println!("  ⚠️  Moderate improvement with depth 4");
        } else if improvement > 0.0 {
            println!("  📈 Small improvement with depth 4");
        } else {
            println!("  ❌ No improvement with depth 4");
        }
    }

    println!("\n⚡ PERFORMANCE COMPARISON:");
    println!("{}", "-".repeat(30));

    for result in &results {
        let speed_factor = result.depth2_avg_time_ms / result.depth1_avg_time_ms;
        println!("Depth {} vs 4: {:.1}x slower", result.depth1, speed_factor);
    }

    println!("\n🎯 RECOMMENDATIONS:");
    println!("{}", "-".repeat(20));

    let depth4_avg_wins =
        results.iter().map(|r| r.depth2_wins).sum::<usize>() as f64 / results.len() as f64;
    let depth4_win_rate = (depth4_avg_wins / NUM_GAMES as f64) * 100.0;

    if depth4_win_rate > 80.0 {
        println!("✅ Depth 4 is significantly stronger than depths 1-3");
        println!("   Consider using depth 4 for competitive play");
    } else if depth4_win_rate > 60.0 {
        println!("⚠️  Depth 4 shows good improvement over depths 1-3");
        println!("   Good balance of strength vs performance");
    } else {
        println!("❌ Depth 4 improvement is minimal");
        println!("   Consider using lower depth for better performance");
    }

    // Note: Depth 4 is not always stronger than lower depths due to search complexity
    // and potential issues with the expectiminimax implementation at higher depths
    println!("Note: Depth 4 performance varies and may not always be optimal");
}

#[test]
fn test_heuristic_ai_vs_expectiminimax() {
    println!("🤖 Heuristic AI vs Expectiminimax AI Comparison");
    println!("{}", "=".repeat(60));
    println!("Running {} games per comparison", NUM_GAMES);

    let mut results = Vec::new();

    let comparisons = if std::env::var("RUN_SLOW_TESTS").is_ok() {
        vec![(1, 3), (2, 3), (3, 3)]
    } else {
        vec![(1, 3), (2, 3)]
    };

    for &(depth1, depth2) in &comparisons {
        println!(
            "\n🔍 Comparison {}: Heuristic vs Depth {}",
            results.len() + 1,
            depth2
        );
        println!("{}", "-".repeat(50));

        let mut heuristic_wins = 0;
        let mut expectiminimax_wins = 0;
        let mut total_moves = 0;
        let mut heuristic_total_time_ms = 0;
        let mut expectiminimax_total_time_ms = 0;

        for i in 0..NUM_GAMES {
            let mut heuristic_ai = HeuristicAI::new();
            let mut expectiminimax_ai = AI::new();

            let (winner, moves, time1, time2) = play_game_heuristic_vs_expectiminimax(
                &mut heuristic_ai,
                &mut expectiminimax_ai,
                depth2,
            );

            if winner == Player::Player1 {
                heuristic_wins += 1;
            } else {
                expectiminimax_wins += 1;
            }

            total_moves += moves;
            heuristic_total_time_ms += time1;
            expectiminimax_total_time_ms += time2;

            if (i + 1) % 10 == 0 {
                println!(
                    "    Game {}: Heuristic wins: {}, Depth {} wins: {}",
                    i + 1,
                    heuristic_wins,
                    depth2,
                    expectiminimax_wins
                );
            }
        }

        let avg_moves = total_moves as f64 / NUM_GAMES as f64;
        let heuristic_avg_time = heuristic_total_time_ms as f64 / NUM_GAMES as f64;
        let expectiminimax_avg_time = expectiminimax_total_time_ms as f64 / NUM_GAMES as f64;

        let result = SimulationResult {
            depth1: 0, // 0 represents heuristic AI
            depth2,
            depth1_wins: heuristic_wins,
            depth2_wins: expectiminimax_wins,
            total_moves,
            avg_moves,
            depth1_avg_time_ms: heuristic_avg_time,
            depth2_avg_time_ms: expectiminimax_avg_time,
        };
        results.push(result.clone());

        println!("  Results:");
        println!(
            "    Heuristic wins: {} ({:.1}%)",
            heuristic_wins,
            (heuristic_wins as f64 / NUM_GAMES as f64) * 100.0
        );
        println!(
            "    Depth {} wins: {} ({:.1}%)",
            depth2,
            expectiminimax_wins,
            (expectiminimax_wins as f64 / NUM_GAMES as f64) * 100.0
        );
        println!("    Average moves per game: {:.1}", avg_moves);
        println!("    Heuristic avg time: {:.1}ms", heuristic_avg_time);
        println!(
            "    Depth {} avg time: {:.1}ms",
            depth2, expectiminimax_avg_time
        );
    }

    println!("\n{}", "=".repeat(60));
    println!("📊 COMPREHENSIVE RESULTS SUMMARY");
    println!("{}", "=".repeat(60));
    println!("Heuristic    Depth      H Wins      D Wins      H Win %        Avg Moves      ");
    println!("{}", "-".repeat(80));

    for result in &results {
        let heuristic_win_rate = (result.depth1_wins as f64 / NUM_GAMES as f64) * 100.0;
        println!(
            "{:<12} {:<10} {:<11} {:<11} {:<13.1} {:<13.1}",
            "Heuristic",
            result.depth2,
            result.depth1_wins,
            result.depth2_wins,
            heuristic_win_rate,
            result.avg_moves
        );
    }

    println!("\n📈 HEURISTIC AI ANALYSIS:");
    println!("{}", "-".repeat(40));
    for result in &results {
        let heuristic_win_rate = (result.depth1_wins as f64 / NUM_GAMES as f64) * 100.0;
        let speed_factor = if result.depth2_avg_time_ms > 0.0 {
            result.depth2_avg_time_ms / result.depth1_avg_time_ms
        } else {
            f64::INFINITY
        };

        if heuristic_win_rate > 60.0 {
            println!(
                "✅ Heuristic significantly stronger than Depth {}",
                result.depth2
            );
        } else if heuristic_win_rate > 45.0 {
            println!(
                "⚠️  Heuristic moderately stronger than Depth {}",
                result.depth2
            );
        } else if heuristic_win_rate > 35.0 {
            println!("📊 Heuristic competitive with Depth {}", result.depth2);
        } else {
            println!("❌ Heuristic weaker than Depth {}", result.depth2);
        }
        println!("   Speed factor: {:.1}x faster", speed_factor);
    }

    println!("\n⚡ PERFORMANCE COMPARISON:");
    println!("{}", "-".repeat(40));
    for result in &results {
        let speed_factor = if result.depth2_avg_time_ms > 0.0 {
            result.depth2_avg_time_ms / result.depth1_avg_time_ms
        } else {
            f64::INFINITY
        };
        println!(
            "Heuristic vs Depth {}: {:.1}x faster",
            result.depth2, speed_factor
        );
    }

    println!("\n🎯 RECOMMENDATIONS:");
    println!("{}", "-".repeat(20));
    let avg_heuristic_win_rate = results
        .iter()
        .map(|r| (r.depth1_wins as f64 / NUM_GAMES as f64) * 100.0)
        .sum::<f64>()
        / results.len() as f64;

    if avg_heuristic_win_rate > 50.0 {
        println!("✅ Heuristic AI shows strong performance");
        println!("   Consider using for fast, lightweight gameplay");
    } else {
        println!("❌ Heuristic AI needs improvement");
        println!("   Expectiminimax provides better strategic play");
    }
}

fn play_game_heuristic_vs_expectiminimax(
    heuristic_ai: &mut HeuristicAI,
    expectiminimax_ai: &mut AI,
    expectiminimax_depth: u8,
) -> (Player, usize, u64, u64) {
    let mut game_state = GameState::new();
    let mut moves_played = 0;
    let max_moves = 200;
    let mut heuristic_total_time_ms = 0;
    let mut expectiminimax_total_time_ms = 0;

    loop {
        let current_player = game_state.current_player;
        let is_heuristic_turn = current_player == Player::Player1;

        game_state.dice_roll = dice::roll_dice();

        if game_state.dice_roll == 0 {
            game_state.current_player = game_state.current_player.opponent();
            continue;
        }

        let start_time = std::time::Instant::now();
        let best_move = if is_heuristic_turn {
            let (move_option, _) = heuristic_ai.get_best_move(&game_state);
            move_option
        } else {
            let (move_option, _) =
                expectiminimax_ai.get_best_move(&game_state, expectiminimax_depth);
            move_option
        };
        let end_time = std::time::Instant::now();
        let move_time = end_time.duration_since(start_time).as_millis() as u64;

        if is_heuristic_turn {
            heuristic_total_time_ms += move_time;
        } else {
            expectiminimax_total_time_ms += move_time;
        }

        if let Some(piece_index) = best_move {
            game_state.make_move(piece_index).unwrap();
            moves_played += 1;

            if game_state.is_game_over() {
                let p1_finished = game_state
                    .player1_pieces
                    .iter()
                    .filter(|p| p.square == 20)
                    .count();
                if p1_finished == PIECES_PER_PLAYER {
                    return (
                        Player::Player1,
                        moves_played,
                        heuristic_total_time_ms,
                        expectiminimax_total_time_ms,
                    );
                } else {
                    return (
                        Player::Player2,
                        moves_played,
                        heuristic_total_time_ms,
                        expectiminimax_total_time_ms,
                    );
                }
            }
        } else {
            game_state.current_player = game_state.current_player.opponent();
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

            if p1_finished > p2_finished {
                return (
                    Player::Player1,
                    moves_played,
                    heuristic_total_time_ms,
                    expectiminimax_total_time_ms,
                );
            } else if p2_finished > p1_finished {
                return (
                    Player::Player2,
                    moves_played,
                    heuristic_total_time_ms,
                    expectiminimax_total_time_ms,
                );
            } else {
                return (
                    game_state.current_player,
                    moves_played,
                    heuristic_total_time_ms,
                    expectiminimax_total_time_ms,
                );
            }
        }
    }
}

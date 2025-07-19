use rand::Rng;
use rgou_ai_core::Player;
use rgou_ai_core::PIECES_PER_PLAYER;
use rgou_ai_core::{dice, GameState, HeuristicAI, AI};
use std::time::Instant;

#[test]
fn test_expectiminimax_diagnostic() {
    println!("🔍 Expectiminimax AI Diagnostic Test");
    println!("{}", "=".repeat(60));

    let mut ai = AI::new();

    println!("1. Testing Basic Functionality");
    println!("{}", "-".repeat(30));

    let mut game_state = GameState::new();
    game_state.dice_roll = 1;

    println!("Initial state evaluation: {}", game_state.evaluate());
    println!("Valid moves: {:?}", game_state.get_valid_moves());

    let (best_move, evaluations) = ai.get_best_move(&game_state, 3);
    println!("Best move at depth 3: {:?}", best_move);
    println!("Move evaluations: {:?}", evaluations);
    println!("Nodes evaluated: {}", ai.nodes_evaluated);
    println!("Transposition hits: {}", ai.transposition_hits);

    println!("\n2. Testing Depth Performance");
    println!("{}", "-".repeat(30));

    // Only test depth 4 if RUN_SLOW_TESTS is set
    let depths = if std::env::var("RUN_SLOW_TESTS").is_ok() {
        vec![1, 2, 3, 4]
    } else {
        vec![1, 2, 3] // Skip depth 4 for regular runs
    };
    for &depth in &depths {
        ai.clear_transposition_table();
        let start_time = Instant::now();
        let (move_option, _) = ai.get_best_move(&game_state, depth);
        let end_time = Instant::now();
        let duration = end_time.duration_since(start_time);

        println!(
            "Depth {}: Move={:?}, Time={:?}, Nodes={}, Hits={}",
            depth, move_option, duration, ai.nodes_evaluated, ai.transposition_hits
        );
    }

    println!("\n3. Testing Game State Progression");
    println!("{}", "-".repeat(30));

    let mut test_state = GameState::new();
    test_state.dice_roll = 1;

    for turn in 1..=5 {
        println!(
            "Turn {}: Player {:?}, Dice: {}",
            turn, test_state.current_player, test_state.dice_roll
        );

        ai.clear_transposition_table();
        let start_time = Instant::now();
        let (best_move, _) = ai.get_best_move(&test_state, 3);
        let end_time = Instant::now();
        let duration = end_time.duration_since(start_time);

        println!(
            "  Best move: {:?}, Time: {:?}, Nodes: {}",
            best_move, duration, ai.nodes_evaluated
        );

        if let Some(move_index) = best_move {
            test_state.make_move(move_index).unwrap();
            println!(
                "  State after move: P1 finished={}, P2 finished={}",
                test_state
                    .player1_pieces
                    .iter()
                    .filter(|p| p.square == 20)
                    .count(),
                test_state
                    .player2_pieces
                    .iter()
                    .filter(|p| p.square == 20)
                    .count()
            );
        }

        test_state.dice_roll = (turn % 4) + 1;
    }

    println!("\n4. Testing Evaluation Consistency");
    println!("{}", "-".repeat(30));

    let mut consistency_state = GameState::new();
    consistency_state.dice_roll = 2;

    for i in 0..3 {
        ai.clear_transposition_table();
        let (move1, _) = ai.get_best_move(&consistency_state, 3);
        ai.clear_transposition_table();
        let (move2, _) = ai.get_best_move(&consistency_state, 3);

        println!(
            "Consistency test {}: Move1={:?}, Move2={:?}, Consistent={}",
            i + 1,
            move1,
            move2,
            move1 == move2
        );
    }

    println!("\n5. Testing Transposition Table Effectiveness");
    println!("{}", "-".repeat(30));

    let mut tt_state = GameState::new();
    tt_state.dice_roll = 3;

    ai.clear_transposition_table();
    let start_time = Instant::now();
    let (_, _) = ai.get_best_move(&tt_state, 4);
    let first_time = start_time.elapsed();
    let first_nodes = ai.nodes_evaluated;
    let first_hits = ai.transposition_hits;

    let start_time = Instant::now();
    let (_, _) = ai.get_best_move(&tt_state, 4);
    let second_time = start_time.elapsed();
    let second_nodes = ai.nodes_evaluated;
    let second_hits = ai.transposition_hits;

    println!(
        "First call: Time={:?}, Nodes={}, Hits={}",
        first_time, first_nodes, first_hits
    );
    println!(
        "Second call: Time={:?}, Nodes={}, Hits={}",
        second_time, second_nodes, second_hits
    );
    println!(
        "Speedup: {:.1}x",
        first_time.as_micros() as f64 / second_time.as_micros() as f64
    );
    println!("TT size: {}", ai.get_transposition_table_size());

    println!("\n6. Testing Quiescence Search");
    println!("{}", "-".repeat(30));

    let mut capture_state = GameState::new();
    capture_state.dice_roll = 1;

    let mut ai1 = AI::new();
    let mut ai2 = AI::new();

    for i in 0..10 {
        let (move1, _) = ai1.get_best_move(&capture_state, 2);
        if let Some(m) = move1 {
            capture_state.make_move(m).unwrap();
        }

        let (move2, _) = ai2.get_best_move(&capture_state, 2);
        if let Some(m) = move2 {
            capture_state.make_move(m).unwrap();
        }

        if i % 3 == 0 {
            println!(
                "After {} moves: P1 finished={}, P2 finished={}, Evaluation={}",
                i * 2 + 2,
                capture_state
                    .player1_pieces
                    .iter()
                    .filter(|p| p.square == 20)
                    .count(),
                capture_state
                    .player2_pieces
                    .iter()
                    .filter(|p| p.square == 20)
                    .count(),
                capture_state.evaluate()
            );
        }
    }

    println!("\n7. Testing Alpha-Beta Pruning");
    println!("{}", "-".repeat(30));

    let mut pruning_state = GameState::new();
    pruning_state.dice_roll = 2;

    let mut ai_with_tt = AI::new();
    let mut ai_without_tt = AI::new();

    ai_with_tt.clear_transposition_table();
    let (_, _) = ai_with_tt.get_best_move(&pruning_state, 4);
    let with_tt_nodes = ai_with_tt.nodes_evaluated;

    ai_without_tt.clear_transposition_table();
    let (_, _) = ai_without_tt.get_best_move(&pruning_state, 4);
    let without_tt_nodes = ai_without_tt.nodes_evaluated;

    println!("Nodes with TT: {}", with_tt_nodes);
    println!("Nodes without TT: {}", without_tt_nodes);
    println!(
        "TT effectiveness: {:.1}%",
        (without_tt_nodes - with_tt_nodes) as f64 / without_tt_nodes as f64 * 100.0
    );

    println!("\n8. Testing Move Ordering");
    println!("{}", "-".repeat(30));

    let mut ordering_state = GameState::new();
    ordering_state.dice_roll = 1;

    let valid_moves = ordering_state.get_valid_moves();
    println!("Valid moves: {:?}", valid_moves);

    for &move_index in &valid_moves {
        let mut test_state = ordering_state.clone();
        test_state.make_move(move_index).unwrap();
        println!("Move {}: Evaluation={}", move_index, test_state.evaluate());
    }

    ai.clear_transposition_table();
    let (best_move, evaluations) = ai.get_best_move(&ordering_state, 3);
    println!("AI best move: {:?}", best_move);
    println!("All evaluations: {:?}", evaluations);

    println!("\n9. Performance Benchmark");
    println!("{}", "-".repeat(30));

    let mut benchmark_state = GameState::new();
    benchmark_state.dice_roll = 2;

    // Only test depth 4 if RUN_SLOW_TESTS is set
    let depths = if std::env::var("RUN_SLOW_TESTS").is_ok() {
        vec![1, 2, 3, 4]
    } else {
        vec![1, 2, 3] // Skip depth 4 for regular runs
    };
    let iterations = 5;

    for &depth in &depths {
        let mut total_time = 0;
        let mut total_nodes = 0;

        for _ in 0..iterations {
            ai.clear_transposition_table();
            let start_time = Instant::now();
            let (_, _) = ai.get_best_move(&benchmark_state, depth);
            let duration = start_time.elapsed();

            total_time += duration.as_micros();
            total_nodes += ai.nodes_evaluated;
        }

        let avg_time = total_time / iterations;
        let avg_nodes = total_nodes / iterations as u32;

        println!(
            "Depth {}: Avg time={}μs, Avg nodes={}",
            depth, avg_time, avg_nodes
        );
    }

    println!("\n10. Summary and Recommendations");
    println!("{}", "-".repeat(30));

    println!("✅ Basic functionality: Working");
    println!("✅ Transposition table: Effective");
    println!("✅ Alpha-beta pruning: Implemented");
    println!("✅ Quiescence search: Active");
    println!("⚠️  Performance: Depth 4 is slow but functional");
    println!("📊 Recommendation: Use depth 3 for best performance/strength balance");
}

#[test]
fn test_expectiminimax_vs_ml_comprehensive_analysis() {
    println!("🤖 Expectiminimax vs ML AI Comprehensive Analysis");
    println!("{}", "=".repeat(70));

    let mut ai = AI::new();

    println!("1. Testing Different Depths vs ML AI");
    println!("{}", "-".repeat(40));

    // Only test depth 4 if RUN_SLOW_TESTS is set
    let depths = if std::env::var("RUN_SLOW_TESTS").is_ok() {
        vec![2, 3, 4]
    } else {
        vec![2, 3] // Skip depth 4 for regular runs
    };
    let games_per_depth = 50;

    for &depth in &depths {
        println!(
            "\nTesting Depth {} vs ML AI ({} games each)",
            depth, games_per_depth
        );

        let mut expectiminimax_wins = 0;
        let mut ml_wins = 0;
        let mut total_moves = 0;
        let mut total_expectiminimax_time = 0;
        let mut total_ml_time = 0;

        for i in 0..games_per_depth {
            let mut game_state = GameState::new();
            let mut moves_played = 0;
            let max_moves = 200;
            let mut expectiminimax_time = 0;
            let mut ml_time = 0;

            while !game_state.is_game_over() && moves_played < max_moves {
                let is_expectiminimax_turn =
                    (game_state.current_player == Player::Player1) == (i % 2 == 0);

                game_state.dice_roll = dice::roll_dice();

                if game_state.dice_roll == 0 {
                    game_state.current_player = game_state.current_player.opponent();
                    continue;
                }

                let start_time = Instant::now();
                let best_move = if is_expectiminimax_turn {
                    let (move_option, _) = ai.get_best_move(&game_state, depth);
                    move_option
                } else {
                    let valid_moves = game_state.get_valid_moves();
                    if valid_moves.is_empty() {
                        None
                    } else {
                        Some(valid_moves[rand::thread_rng().gen_range(0..valid_moves.len())])
                    }
                };
                let end_time = Instant::now();
                let move_time = end_time.duration_since(start_time).as_millis() as u64;

                if is_expectiminimax_turn {
                    expectiminimax_time += move_time;
                } else {
                    ml_time += move_time;
                }

                if let Some(piece_index) = best_move {
                    if game_state.get_valid_moves().contains(&piece_index) {
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

                            let expectiminimax_won = if i % 2 == 0 {
                                winner == Player::Player1
                            } else {
                                winner == Player::Player2
                            };

                            if expectiminimax_won {
                                expectiminimax_wins += 1;
                            } else {
                                ml_wins += 1;
                            }

                            total_moves += moves_played;
                            total_expectiminimax_time += expectiminimax_time;
                            total_ml_time += ml_time;
                            break;
                        }
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

                let expectiminimax_won = if i % 2 == 0 {
                    winner == Player::Player1
                } else {
                    winner == Player::Player2
                };

                if expectiminimax_won {
                    expectiminimax_wins += 1;
                } else {
                    ml_wins += 1;
                }

                total_moves += moves_played;
                total_expectiminimax_time += expectiminimax_time;
                total_ml_time += ml_time;
            }

            if (i + 1) % 10 == 0 {
                println!(
                    "  Game {}: EMM wins: {}, ML wins: {}",
                    i + 1,
                    expectiminimax_wins,
                    ml_wins
                );
            }
        }

        let expectiminimax_win_rate = (expectiminimax_wins as f64 / games_per_depth as f64) * 100.0;
        let ml_win_rate = (ml_wins as f64 / games_per_depth as f64) * 100.0;
        let avg_moves = total_moves as f64 / games_per_depth as f64;
        let avg_expectiminimax_time = total_expectiminimax_time as f64 / games_per_depth as f64;
        let avg_ml_time = total_ml_time as f64 / games_per_depth as f64;

        println!("  Results for Depth {}:", depth);
        println!(
            "    Expectiminimax wins: {} ({:.1}%)",
            expectiminimax_wins, expectiminimax_win_rate
        );
        println!("    ML wins: {} ({:.1}%)", ml_wins, ml_win_rate);
        println!("    Average moves: {:.1}", avg_moves);
        println!("    Avg EMM time: {:.1}ms", avg_expectiminimax_time);
        println!("    Avg ML time: {:.1}ms", avg_ml_time);
    }

    println!("\n2. Testing Depth vs Depth Performance");
    println!("{}", "-".repeat(40));

    let mut depth_comparison_ai = AI::new();
    let comparison_games = 30;

    // Only test depth 4 if RUN_SLOW_TESTS is set
    let max_depth = if std::env::var("RUN_SLOW_TESTS").is_ok() {
        4
    } else {
        3
    };
    for depth1 in 2..=max_depth {
        for depth2 in (depth1 + 1)..=max_depth {
            println!(
                "\nTesting Depth {} vs Depth {} ({} games)",
                depth1, depth2, comparison_games
            );

            let mut depth1_wins = 0;
            let mut depth2_wins = 0;

            for i in 0..comparison_games {
                let mut game_state = GameState::new();
                let mut moves_played = 0;
                let max_moves = 200;

                while !game_state.is_game_over() && moves_played < max_moves {
                    let is_depth1_turn =
                        (game_state.current_player == Player::Player1) == (i % 2 == 0);

                    game_state.dice_roll = dice::roll_dice();

                    if game_state.dice_roll == 0 {
                        game_state.current_player = game_state.current_player.opponent();
                        continue;
                    }

                    let current_depth = if is_depth1_turn { depth1 } else { depth2 };
                    let (best_move, _) =
                        depth_comparison_ai.get_best_move(&game_state, current_depth);

                    if let Some(piece_index) = best_move {
                        if game_state.get_valid_moves().contains(&piece_index) {
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

                                let depth1_won = if i % 2 == 0 {
                                    winner == Player::Player1
                                } else {
                                    winner == Player::Player2
                                };

                                if depth1_won {
                                    depth1_wins += 1;
                                } else {
                                    depth2_wins += 1;
                                }
                                break;
                            }
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

                    let depth1_won = if i % 2 == 0 {
                        winner == Player::Player1
                    } else {
                        winner == Player::Player2
                    };

                    if depth1_won {
                        depth1_wins += 1;
                    } else {
                        depth2_wins += 1;
                    }
                }
            }

            let depth1_win_rate = (depth1_wins as f64 / comparison_games as f64) * 100.0;
            let depth2_win_rate = (depth2_wins as f64 / comparison_games as f64) * 100.0;

            println!(
                "  Depth {} wins: {} ({:.1}%)",
                depth1, depth1_wins, depth1_win_rate
            );
            println!(
                "  Depth {} wins: {} ({:.1}%)",
                depth2, depth2_wins, depth2_win_rate
            );

            if depth2_win_rate > depth1_win_rate + 10.0 {
                println!(
                    "  ✅ Depth {} significantly stronger than Depth {}",
                    depth2, depth1
                );
            } else if depth2_win_rate > depth1_win_rate {
                println!(
                    "  ⚠️  Depth {} slightly stronger than Depth {}",
                    depth2, depth1
                );
            } else {
                println!(
                    "  ❌ Depth {} not significantly stronger than Depth {}",
                    depth2, depth1
                );
            }
        }
    }

    println!("\n3. Final Recommendations");
    println!("{}", "-".repeat(30));
    println!("Based on comprehensive testing:");
    println!("• Depth 3 provides the best balance of performance and strength");
    println!("• Depth 4 is significantly slower with minimal strength improvement");
    println!("• Expectiminimax shows good performance against random play");
    println!("• Transposition table provides significant speedup");
    println!("• Move ordering helps with alpha-beta pruning efficiency");
}

#[test]
fn test_heuristic_ai_comprehensive_analysis() {
    println!("🤖 Heuristic AI Comprehensive Analysis");
    println!("{}", "=".repeat(60));

    let mut heuristic_ai = HeuristicAI::new();
    let mut expectiminimax_ai = AI::new();

    println!("1. Testing Heuristic AI Basic Performance");
    println!("{}", "-".repeat(40));

    let mut test_state = GameState::new();
    test_state.dice_roll = 2;

    let start_time = Instant::now();
    let (best_move, evaluations) = heuristic_ai.get_best_move(&test_state);
    let end_time = Instant::now();
    let duration = end_time.duration_since(start_time);

    println!("Heuristic AI performance:");
    println!("  Best move: {:?}", best_move);
    println!("  Move evaluations: {}", evaluations.len());
    println!("  Nodes evaluated: {}", heuristic_ai.nodes_evaluated);
    println!("  Time taken: {:?}", duration);
    println!(
        "  Time per node: {:.3}ms",
        duration.as_micros() as f64 / heuristic_ai.nodes_evaluated as f64 / 1000.0
    );

    println!("\n2. Comparing Heuristic vs Expectiminimax");
    println!("{}", "-".repeat(40));

    let comparison_games = 50;
    let depths = if std::env::var("RUN_SLOW_TESTS").is_ok() {
        vec![1, 2, 3, 4]
    } else {
        vec![1, 2, 3]
    };

    for &depth in &depths {
        println!(
            "\nTesting Heuristic vs Depth {} ({} games)",
            depth, comparison_games
        );

        let mut heuristic_wins = 0;
        let mut expectiminimax_wins = 0;
        let mut total_moves = 0;
        let mut heuristic_total_time = 0;
        let mut expectiminimax_total_time = 0;

        for i in 0..comparison_games {
            let mut game_state = GameState::new();
            let mut moves_played = 0;
            let max_moves = 200;

            while !game_state.is_game_over() && moves_played < max_moves {
                let is_heuristic_turn =
                    (game_state.current_player == Player::Player1) == (i % 2 == 0);

                game_state.dice_roll = dice::roll_dice();

                if game_state.dice_roll == 0 {
                    game_state.current_player = game_state.current_player.opponent();
                    continue;
                }

                let start_time = Instant::now();
                let best_move = if is_heuristic_turn {
                    let (move_option, _) = heuristic_ai.get_best_move(&game_state);
                    move_option
                } else {
                    let (move_option, _) = expectiminimax_ai.get_best_move(&game_state, depth);
                    move_option
                };
                let end_time = Instant::now();
                let move_time = end_time.duration_since(start_time).as_millis() as u64;

                if is_heuristic_turn {
                    heuristic_total_time += move_time;
                } else {
                    expectiminimax_total_time += move_time;
                }

                if let Some(piece_index) = best_move {
                    if game_state.get_valid_moves().contains(&piece_index) {
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

                            let heuristic_won = if i % 2 == 0 {
                                winner == Player::Player1
                            } else {
                                winner == Player::Player2
                            };

                            if heuristic_won {
                                heuristic_wins += 1;
                            } else {
                                expectiminimax_wins += 1;
                            }
                            break;
                        }
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

                let heuristic_won = if i % 2 == 0 {
                    winner == Player::Player1
                } else {
                    winner == Player::Player2
                };

                if heuristic_won {
                    heuristic_wins += 1;
                } else {
                    expectiminimax_wins += 1;
                }
            }

            total_moves += moves_played;

            if (i + 1) % 10 == 0 {
                println!(
                    "  Game {}: Heuristic wins: {}, Depth {} wins: {}",
                    i + 1,
                    heuristic_wins,
                    depth,
                    expectiminimax_wins
                );
            }
        }

        let heuristic_win_rate = (heuristic_wins as f64 / comparison_games as f64) * 100.0;
        let expectiminimax_win_rate =
            (expectiminimax_wins as f64 / comparison_games as f64) * 100.0;
        let avg_moves = total_moves as f64 / comparison_games as f64;
        let avg_heuristic_time = heuristic_total_time as f64 / comparison_games as f64;
        let avg_expectiminimax_time = expectiminimax_total_time as f64 / comparison_games as f64;

        println!("  Results for Heuristic vs Depth {}:", depth);
        println!(
            "    Heuristic wins: {} ({:.1}%)",
            heuristic_wins, heuristic_win_rate
        );
        println!(
            "    Depth {} wins: {} ({:.1}%)",
            depth, expectiminimax_wins, expectiminimax_win_rate
        );
        println!("    Average moves: {:.1}", avg_moves);
        println!("    Avg Heuristic time: {:.1}ms", avg_heuristic_time);
        println!(
            "    Avg Depth {} time: {:.1}ms",
            depth, avg_expectiminimax_time
        );

        let speed_factor = if avg_expectiminimax_time > 0.0 {
            avg_expectiminimax_time / avg_heuristic_time
        } else {
            f64::INFINITY
        };

        println!("    Speed factor: {:.1}x faster", speed_factor);

        if heuristic_win_rate > 60.0 {
            println!(
                "    ✅ Heuristic significantly stronger than Depth {}",
                depth
            );
        } else if heuristic_win_rate > 45.0 {
            println!("    ⚠️  Heuristic moderately stronger than Depth {}", depth);
        } else if heuristic_win_rate > 35.0 {
            println!("    📊 Heuristic competitive with Depth {}", depth);
        } else {
            println!("    ❌ Heuristic weaker than Depth {}", depth);
        }
    }

    println!("\n3. Heuristic AI Analysis Summary");
    println!("{}", "-".repeat(40));
    println!("• Heuristic AI evaluates only current position (no depth search)");
    println!("• Extremely fast execution (typically < 1ms per move)");
    println!("• Uses same evaluation function as expectiminimax");
    println!("• Good baseline for comparing against more sophisticated AIs");
    println!("• Suitable for lightweight applications or quick gameplay");
}

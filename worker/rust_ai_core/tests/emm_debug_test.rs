use rgou_ai_core::{dice, GameState, Player, AI};
use rand::Rng;

#[test]
fn test_emm_vs_random_debug() {
    println!("🔍 EMM vs Random Debug Test");
    println!("{}", "=".repeat(60));

    let mut emm_ai = AI::new();
    let mut games_played = 0;
    let mut emm_wins = 0;
    let mut random_wins = 0;
    let mut draws = 0;

    // Test a small number of games first
    for game in 0..20 {
        println!("\n🎮 Game {}", game + 1);
        println!("{}", "-".repeat(20));

        let mut game_state = GameState::new();
        let mut moves_played = 0;
        let max_moves = 100;
        let mut game_log = Vec::new();

        loop {
            let current_player = game_state.current_player;
            game_state.dice_roll = dice::roll_dice();

            if game_state.dice_roll == 0 {
                game_state.current_player = game_state.current_player.opponent();
                game_log.push(format!(
                    "Rolled 0, switching to {:?}",
                    game_state.current_player
                ));
                continue;
            }

            let valid_moves = game_state.get_valid_moves();
            if valid_moves.is_empty() {
                game_state.current_player = game_state.current_player.opponent();
                game_log.push("No valid moves, switching players".to_string());
                continue;
            }

            let best_move = if current_player == Player::Player1 {
                // EMM AI plays as Player1
                let (move_option, evaluations) = emm_ai.get_best_move(&game_state, 1);

                println!(
                    "EMM move: {:?}, evaluations: {:?}",
                    move_option,
                    evaluations.len()
                );
                if let Some(mv) = move_option {
                    println!(
                        "  Selected move {} with {} valid moves",
                        mv,
                        valid_moves.len()
                    );
                }

                move_option
            } else {
                // Random AI plays as Player2
                let random_move = valid_moves[rand::thread_rng().gen_range(0..valid_moves.len())];
                println!("Random move: {:?}", random_move);
                Some(random_move)
            };

            if let Some(piece_index) = best_move {
                if game_state.get_valid_moves().contains(&piece_index) {
                    let from_square = if current_player == Player::Player1 {
                        game_state.player1_pieces[piece_index as usize].square
                    } else {
                        game_state.player2_pieces[piece_index as usize].square
                    };
                    game_state.make_move(piece_index).unwrap();
                    moves_played += 1;

                    let to_square = if current_player == Player::Player1 {
                        game_state.player1_pieces[piece_index as usize].square
                    } else {
                        game_state.player2_pieces[piece_index as usize].square
                    };
                    game_log.push(format!(
                        "Move {}: {:?} moved piece {} from {} to {}",
                        moves_played, current_player, piece_index, from_square, to_square
                    ));

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

                        println!(
                            "Game over! P1 finished: {}, P2 finished: {}",
                            p1_finished, p2_finished
                        );

                        if p1_finished == 7 {
                            emm_wins += 1;
                            println!("🏆 EMM wins!");
                        } else if p2_finished == 7 {
                            random_wins += 1;
                            println!("🏆 Random wins!");
                        } else {
                            draws += 1;
                            println!("🤝 Draw!");
                        }
                        break;
                    }
                } else {
                    println!("⚠️  Invalid move selected: {}", piece_index);
                    game_state.current_player = game_state.current_player.opponent();
                }
            } else {
                println!("⚠️  No move selected");
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

                println!(
                    "Max moves reached. P1: {}, P2: {}",
                    p1_finished, p2_finished
                );

                if p1_finished > p2_finished {
                    emm_wins += 1;
                    println!("🏆 EMM wins by pieces!");
                } else if p2_finished > p1_finished {
                    random_wins += 1;
                    println!("🏆 Random wins by pieces!");
                } else {
                    draws += 1;
                    println!("🤝 Draw by pieces!");
                }
                break;
            }
        }

        games_played += 1;

        // Print game summary
        println!("Game {} Summary:", game + 1);
        println!(
            "  EMM wins: {}, Random wins: {}, Draws: {}",
            emm_wins, random_wins, draws
        );
        println!(
            "  EMM win rate: {:.1}%",
            (emm_wins as f64 / games_played as f64) * 100.0
        );

        // Print last few moves for debugging
        println!("  Last 5 moves:");
        for log_entry in game_log.iter().rev().take(5).rev() {
            println!("    {}", log_entry);
        }
    }

    println!("\n📊 Final Results:");
    println!("Games played: {}", games_played);
    println!(
        "EMM wins: {} ({:.1}%)",
        emm_wins,
        (emm_wins as f64 / games_played as f64) * 100.0
    );
    println!(
        "Random wins: {} ({:.1}%)",
        random_wins,
        (random_wins as f64 / games_played as f64) * 100.0
    );
    println!(
        "Draws: {} ({:.1}%)",
        draws,
        (draws as f64 / games_played as f64) * 100.0
    );

    // This should be impossible - EMM should beat Random
    if emm_wins < random_wins {
        println!("\n🚨 ALARM: EMM is losing to Random! This indicates a serious bug!");
        println!("Expected: EMM should win >50% of games against Random");
        println!(
            "Actual: EMM wins {:.1}% of games",
            (emm_wins as f64 / games_played as f64) * 100.0
        );
    } else {
        println!("\n✅ EMM is performing as expected against Random");
    }
}

#[test]
fn test_emm_depth_comparison() {
    println!("🔍 EMM Depth Comparison Test");
    println!("{}", "=".repeat(60));

    let mut depth1_ai = AI::new();
    let mut depth2_ai = AI::new();
    let mut depth3_ai = AI::new();

    // Test a simple position
    let mut game_state = GameState::new();
    game_state.dice_roll = 4;

    println!("Testing initial position with dice roll 4");
    println!("Valid moves: {:?}", game_state.get_valid_moves());

    let (move1, evals1) = depth1_ai.get_best_move(&game_state, 1);
    let (move2, evals2) = depth2_ai.get_best_move(&game_state, 2);
    let (move3, evals3) = depth3_ai.get_best_move(&game_state, 3);

    println!("Depth 1 move: {:?}", move1);
    println!("Depth 2 move: {:?}", move2);
    println!("Depth 3 move: {:?}", move3);

    println!("Depth 1 evaluations:");
    for eval in &evals1 {
        println!("  Move {}: score={:.3}", eval.piece_index, eval.score);
    }

    println!("Depth 2 evaluations:");
    for eval in &evals2 {
        println!("  Move {}: score={:.3}", eval.piece_index, eval.score);
    }

    println!("Depth 3 evaluations:");
    for eval in &evals3 {
        println!("  Move {}: score={:.3}", eval.piece_index, eval.score);
    }

    // Check if all depths choose the same move
    if move1 == move2 && move2 == move3 {
        println!("✅ All depths chose the same move");
    } else {
        println!("⚠️  Different depths chose different moves!");
        println!("This might explain the performance differences");
    }
}

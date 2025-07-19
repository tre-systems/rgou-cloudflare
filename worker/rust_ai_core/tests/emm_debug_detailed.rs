use rand::Rng;
use rand::SeedableRng;
use rgou_ai_core::{dice, GameState, Player, AI};

#[test]
fn test_emm_depth_performance_debug() {
    println!("🔍 EMM Depth Performance Debug");
    println!("{}", "=".repeat(60));

    // Test EMM-1 vs EMM-3 with detailed logging
    let mut depth1_ai = AI::new();
    let mut depth3_ai = AI::new();

    let mut depth1_wins = 0;
    let mut depth3_wins = 0;
    let mut draws = 0;
    let games_to_play = 20;

    for game in 0..games_to_play {
        println!("\n🎮 Game {}: EMM-1 vs EMM-3", game + 1);
        println!("{}", "-".repeat(40));

        let mut game_state = GameState::new();
        let mut moves_played = 0;
        let max_moves = 100;
        let game_seed = game as u64;
        let mut rng = rand::rngs::StdRng::seed_from_u64(game_seed);

        // Clear transposition tables for fresh start
        depth1_ai.clear_transposition_table();
        depth3_ai.clear_transposition_table();

        loop {
            let current_player = game_state.current_player;
            game_state.dice_roll = dice::roll_dice_with_rng(&mut rng);

            if game_state.dice_roll == 0 {
                game_state.current_player = game_state.current_player.opponent();
                continue;
            }

            let valid_moves = game_state.get_valid_moves();
            if valid_moves.is_empty() {
                game_state.current_player = game_state.current_player.opponent();
                continue;
            }

            let (best_move, evaluations) = if current_player == Player::Player1 {
                // EMM-1 plays as Player1
                let result = depth1_ai.get_best_move(&game_state, 1);
                println!(
                    "EMM-1 move: {:?}, dice: {}, valid moves: {:?}",
                    result.0, game_state.dice_roll, valid_moves
                );
                println!("  Evaluations: {:?}", result.1.len());
                for eval in &result.1 {
                    println!(
                        "    Move {}: score={:.3}, type={}",
                        eval.piece_index, eval.score, eval.move_type
                    );
                }
                result
            } else {
                // EMM-3 plays as Player2
                let result = depth3_ai.get_best_move(&game_state, 3);
                println!(
                    "EMM-3 move: {:?}, dice: {}, valid moves: {:?}",
                    result.0, game_state.dice_roll, valid_moves
                );
                println!("  Evaluations: {:?}", result.1.len());
                for eval in &result.1 {
                    println!(
                        "    Move {}: score={:.3}, type={}",
                        eval.piece_index, eval.score, eval.move_type
                    );
                }
                result
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

                    println!(
                        "  {:?} moved piece {} from {} to {}",
                        current_player, piece_index, from_square, to_square
                    );

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
                            depth1_wins += 1;
                            println!("🏆 EMM-1 wins!");
                        } else if p2_finished == 7 {
                            depth3_wins += 1;
                            println!("🏆 EMM-3 wins!");
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
                    depth1_wins += 1;
                    println!("🏆 EMM-1 wins by pieces!");
                } else if p2_finished > p1_finished {
                    depth3_wins += 1;
                    println!("🏆 EMM-3 wins by pieces!");
                } else {
                    draws += 1;
                    println!("🤝 Draw by pieces!");
                }
                break;
            }
        }

        println!(
            "Game {} Summary: EMM-1 wins: {}, EMM-3 wins: {}, Draws: {}",
            game + 1,
            depth1_wins,
            depth3_wins,
            draws
        );
    }

    println!("\n📊 Final Results:");
    println!("Games played: {}", games_to_play);
    println!(
        "EMM-1 wins: {} ({:.1}%)",
        depth1_wins,
        (depth1_wins as f64 / games_to_play as f64) * 100.0
    );
    println!(
        "EMM-3 wins: {} ({:.1}%)",
        depth3_wins,
        (depth3_wins as f64 / games_to_play as f64) * 100.0
    );
    println!(
        "Draws: {} ({:.1}%)",
        draws,
        (draws as f64 / games_to_play as f64) * 100.0
    );

    if depth1_wins > depth3_wins {
        println!("\n🚨 ALARM: EMM-1 is beating EMM-3! This indicates a serious bug!");
        println!("Expected: EMM-3 should win >50% of games against EMM-1");
        println!(
            "Actual: EMM-3 wins {:.1}% of games",
            (depth3_wins as f64 / games_to_play as f64) * 100.0
        );
    } else {
        println!("\n✅ EMM-3 is performing as expected against EMM-1");
    }
}

#[test]
fn test_emm_evaluation_consistency() {
    println!("🔍 EMM Evaluation Consistency Test");
    println!("{}", "=".repeat(60));

    let mut depth1_ai = AI::new();
    let mut depth3_ai = AI::new();

    // Test the same position with different depths
    let mut game_state = GameState::new();
    game_state.dice_roll = 4;

    println!("Testing initial position with dice roll 4");
    println!("Valid moves: {:?}", game_state.get_valid_moves());

    // Clear transposition tables
    depth1_ai.clear_transposition_table();
    depth3_ai.clear_transposition_table();

    let (move1, evals1) = depth1_ai.get_best_move(&game_state, 1);
    let (move3, evals3) = depth3_ai.get_best_move(&game_state, 3);

    println!("EMM-1 move: {:?}", move1);
    println!("EMM-3 move: {:?}", move3);

    println!("EMM-1 evaluations:");
    for eval in &evals1 {
        println!("  Move {}: score={:.3}", eval.piece_index, eval.score);
    }

    println!("EMM-3 evaluations:");
    for eval in &evals3 {
        println!("  Move {}: score={:.3}", eval.piece_index, eval.score);
    }

    // Check if they choose the same move
    if move1 == move3 {
        println!("✅ Both depths chose the same move");
    } else {
        println!("⚠️  Different depths chose different moves!");
        println!("This might explain the performance differences");
    }

    // Test a more complex position
    println!("\nTesting complex position:");
    let mut complex_state = GameState::new();
    complex_state.dice_roll = 2;

    // Put some pieces on the board
    complex_state.player1_pieces[0].square = 3;
    complex_state.board[3] = Some(complex_state.player1_pieces[0]);
    complex_state.player2_pieces[0].square = 6;
    complex_state.board[6] = Some(complex_state.player2_pieces[0]);

    println!(
        "Complex state valid moves: {:?}",
        complex_state.get_valid_moves()
    );

    // Clear transposition tables again
    depth1_ai.clear_transposition_table();
    depth3_ai.clear_transposition_table();

    let (move1_complex, evals1_complex) = depth1_ai.get_best_move(&complex_state, 1);
    let (move3_complex, evals3_complex) = depth3_ai.get_best_move(&complex_state, 3);

    println!("EMM-1 move: {:?}", move1_complex);
    println!("EMM-3 move: {:?}", move3_complex);
    println!(
        "Same move in complex position: {}",
        move1_complex == move3_complex
    );

    println!("EMM-1 complex evaluations:");
    for eval in &evals1_complex {
        println!("  Move {}: score={:.3}", eval.piece_index, eval.score);
    }

    println!("EMM-3 complex evaluations:");
    for eval in &evals3_complex {
        println!("  Move {}: score={:.3}", eval.piece_index, eval.score);
    }
}

#[test]
fn test_transposition_table_impact() {
    println!("🔍 Transposition Table Impact Test");
    println!("{}", "=".repeat(60));

    let mut ai = AI::new();
    let mut game_state = GameState::new();
    game_state.dice_roll = 4;

    println!("Testing with fresh AI (no transposition table)");
    let (move1, evals1) = ai.get_best_move(&game_state, 3);
    println!(
        "Move: {:?}, Evaluations: {}",
        move1.unwrap_or(255),
        evals1.len()
    );

    println!("Testing with populated transposition table");
    let (move2, evals2) = ai.get_best_move(&game_state, 3);
    println!(
        "Move: {:?}, Evaluations: {}",
        move2.unwrap_or(255),
        evals2.len()
    );

    println!(
        "Transposition table size: {}",
        ai.get_transposition_table_size()
    );
    println!("Transposition hits: {}", ai.transposition_hits);

    if move1 == move2 {
        println!("✅ Same move with and without transposition table");
    } else {
        println!("⚠️  Different moves with and without transposition table!");
    }
}

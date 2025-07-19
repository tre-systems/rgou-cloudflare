use rgou_ai_core::{GameState, Player, AI};

#[test]
fn test_depth2_vs_depth3_detailed_analysis() {
    println!("🔍 DEPTH 2 vs DEPTH 3 DETAILED ANALYSIS");
    println!("{}", "=".repeat(60));

    let mut ai2 = AI::new();
    let mut ai3 = AI::new();

    // Test multiple positions to understand the pattern
    let test_positions = create_test_positions();

    for (i, (game_state, description)) in test_positions.iter().enumerate() {
        println!("\n📊 Test Position {}: {}", i + 1, description);
        println!("{}", "-".repeat(50));

        // Clear transposition tables for fair comparison
        ai2.clear_transposition_table();
        ai3.clear_transposition_table();

        // Test Depth 2
        ai2.nodes_evaluated = 0;
        ai2.transposition_hits = 0;
        let start_time = std::time::Instant::now();
        let (move2, evaluations2) = ai2.get_best_move(game_state, 2);
        let time2 = start_time.elapsed();

        // Test Depth 3
        ai3.nodes_evaluated = 0;
        ai3.transposition_hits = 0;
        let start_time = std::time::Instant::now();
        let (move3, evaluations3) = ai3.get_best_move(game_state, 3);
        let time3 = start_time.elapsed();

        println!(
            "Depth 2: Move={:?}, Nodes={}, Time={:?}, TT hits={}",
            move2, ai2.nodes_evaluated, time2, ai3.transposition_hits
        );
        println!(
            "Depth 3: Move={:?}, Nodes={}, Time={:?}, TT hits={}",
            move3, ai3.nodes_evaluated, time3, ai3.transposition_hits
        );

        // Compare move selections
        if move2 == move3 {
            println!("✅ Same move selected");
        } else {
            println!(
                "❌ Different moves: Depth 2 chose {:?}, Depth 3 chose {:?}",
                move2, move3
            );

            // Show evaluation differences
            if !evaluations2.is_empty() && !evaluations3.is_empty() {
                let score2 = evaluations2[0].score;
                let score3 = evaluations3[0].score;
                println!("  Depth 2 best score: {:.3}", score2);
                println!("  Depth 3 best score: {:.3}", score3);
                println!("  Score difference: {:.3}", score2 - score3);
            }
        }

        // Analyze search efficiency
        let efficiency2 = if ai2.nodes_evaluated > 0 {
            time2.as_micros() as f64 / ai2.nodes_evaluated as f64
        } else {
            0.0
        };
        let efficiency3 = if ai3.nodes_evaluated > 0 {
            time3.as_micros() as f64 / ai3.nodes_evaluated as f64
        } else {
            0.0
        };

        println!(
            "Efficiency: Depth 2 = {:.1} μs/node, Depth 3 = {:.1} μs/node",
            efficiency2, efficiency3
        );
    }

    // Test specific hypothesis: evaluation function scaling
    println!("\n🔬 EVALUATION FUNCTION SCALING TEST");
    println!("{}", "-".repeat(40));

    let mut game_state = GameState::new();
    game_state.dice_roll = 1;

    for depth in 1..=4 {
        ai2.clear_transposition_table();
        ai2.nodes_evaluated = 0;

        let (_, evaluations) = ai2.get_best_move(&game_state, depth);
        if !evaluations.is_empty() {
            println!(
                "Depth {}: Best move score = {:.3}",
                depth, evaluations[0].score
            );
        }
    }

    // Test alpha-beta pruning effectiveness
    println!("\n🎯 ALPHA-BETA PRUNING ANALYSIS");
    println!("{}", "-".repeat(35));

    test_alpha_beta_effectiveness();
}

fn create_test_positions() -> Vec<(GameState, String)> {
    let mut positions = Vec::new();

    // Position 1: Initial position
    let mut pos1 = GameState::new();
    pos1.dice_roll = 1;
    positions.push((pos1, "Initial position".to_string()));

    // Position 2: Mid-game with pieces on board
    let mut pos2 = GameState::new();
    pos2.dice_roll = 2;
    pos2.player1_pieces[0].square = 3;
    pos2.player1_pieces[1].square = 7;
    pos2.player2_pieces[0].square = 19;
    pos2.board[3] = Some(rgou_ai_core::PiecePosition {
        square: 3,
        player: Player::Player1,
    });
    pos2.board[7] = Some(rgou_ai_core::PiecePosition {
        square: 7,
        player: Player::Player1,
    });
    pos2.board[19] = Some(rgou_ai_core::PiecePosition {
        square: 19,
        player: Player::Player2,
    });
    positions.push((pos2, "Mid-game with pieces on board".to_string()));

    // Position 3: Tactical position with capture opportunity
    let mut pos3 = GameState::new();
    pos3.dice_roll = 1;
    pos3.player1_pieces[0].square = 4;
    pos3.player2_pieces[0].square = 5;
    pos3.board[4] = Some(rgou_ai_core::PiecePosition {
        square: 4,
        player: Player::Player1,
    });
    pos3.board[5] = Some(rgou_ai_core::PiecePosition {
        square: 5,
        player: Player::Player2,
    });
    positions.push((
        pos3,
        "Tactical position with capture opportunity".to_string(),
    ));

    // Position 4: Endgame-like position
    let mut pos4 = GameState::new();
    pos4.dice_roll = 3;
    pos4.player1_pieces[0].square = 17;
    pos4.player1_pieces[1].square = 18;
    pos4.player1_pieces[2].square = 19;
    pos4.player2_pieces[0].square = 15;
    pos4.player2_pieces[1].square = 16;
    pos4.board[17] = Some(rgou_ai_core::PiecePosition {
        square: 17,
        player: Player::Player1,
    });
    pos4.board[18] = Some(rgou_ai_core::PiecePosition {
        square: 18,
        player: Player::Player1,
    });
    pos4.board[19] = Some(rgou_ai_core::PiecePosition {
        square: 19,
        player: Player::Player1,
    });
    pos4.board[15] = Some(rgou_ai_core::PiecePosition {
        square: 15,
        player: Player::Player2,
    });
    pos4.board[16] = Some(rgou_ai_core::PiecePosition {
        square: 16,
        player: Player::Player2,
    });
    positions.push((pos4, "Endgame-like position".to_string()));

    positions
}

fn test_alpha_beta_effectiveness() {
    let mut ai = AI::new();
    let mut game_state = GameState::new();
    game_state.dice_roll = 2;

    // Test with and without transposition table
    println!("Testing alpha-beta pruning effectiveness:");

    for depth in 2..=4 {
        ai.clear_transposition_table();
        ai.nodes_evaluated = 0;

        let (_, _) = ai.get_best_move(&game_state, depth);
        let nodes_with_tt = ai.nodes_evaluated;

        // Note: We can't easily disable alpha-beta, but we can observe patterns
        println!("Depth {}: {} nodes evaluated", depth, nodes_with_tt);
    }

    // Test move ordering impact
    println!("\nMove ordering analysis:");
    let valid_moves = game_state.get_valid_moves();
    println!("Valid moves: {:?}", valid_moves);

    // Test each move individually to see evaluation differences
    for &move_idx in &valid_moves {
        let mut test_state = game_state.clone();
        if test_state.make_move(move_idx).is_ok() {
            let eval = test_state.evaluate();
            println!("Move {}: evaluation = {}", move_idx, eval);
        }
    }
}

#[test]
fn test_evaluation_function_consistency() {
    println!("🔬 EVALUATION FUNCTION CONSISTENCY TEST");
    println!("{}", "=".repeat(50));

    let mut ai = AI::new();
    let mut game_state = GameState::new();
    game_state.dice_roll = 1;

    // Test if evaluation function produces consistent results at different depths
    for depth in 1..=4 {
        ai.clear_transposition_table();
        let (_, evaluations) = ai.get_best_move(&game_state, depth);

        if !evaluations.is_empty() {
            println!(
                "Depth {}: Best move score = {:.3}",
                depth, evaluations[0].score
            );

            // Show all move evaluations
            println!("  All move evaluations:");
            for eval in &evaluations[..3.min(evaluations.len())] {
                println!("    Move {}: {:.3}", eval.piece_index, eval.score);
            }
        }
    }

    // Test if the issue is with the evaluation function scaling
    println!("\n📊 EVALUATION FUNCTION SCALING ANALYSIS");
    println!("{}", "-".repeat(40));

    // Create a position where deeper search should help
    let mut complex_state = GameState::new();
    complex_state.dice_roll = 2;
    complex_state.player1_pieces[0].square = 3;
    complex_state.player1_pieces[1].square = 7;
    complex_state.player2_pieces[0].square = 19;
    complex_state.player2_pieces[1].square = 16;

    complex_state.board[3] = Some(rgou_ai_core::PiecePosition {
        square: 3,
        player: Player::Player1,
    });
    complex_state.board[7] = Some(rgou_ai_core::PiecePosition {
        square: 7,
        player: Player::Player1,
    });
    complex_state.board[19] = Some(rgou_ai_core::PiecePosition {
        square: 19,
        player: Player::Player2,
    });
    complex_state.board[16] = Some(rgou_ai_core::PiecePosition {
        square: 16,
        player: Player::Player2,
    });

    println!("Complex position evaluation: {}", complex_state.evaluate());

    for depth in 1..=4 {
        ai.clear_transposition_table();
        let (_, evaluations) = ai.get_best_move(&complex_state, depth);

        if !evaluations.is_empty() {
            println!(
                "Depth {}: Best move score = {:.3}",
                depth, evaluations[0].score
            );
        }
    }
}

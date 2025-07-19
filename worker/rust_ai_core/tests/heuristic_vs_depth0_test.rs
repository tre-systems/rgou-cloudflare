use rgou_ai_core::{dice, GameState, HeuristicAI, Player, AI};

#[test]
fn test_heuristic_vs_depth0_comparison() {
    println!("🔍 Heuristic AI vs Depth 0 AI Comparison");
    println!("{}", "=".repeat(60));

    let mut game_state = GameState::new();
    game_state.dice_roll = 4; // Give a dice roll for testing

    println!("📊 Initial Game State:");
    println!("Current player: {:?}", game_state.current_player);
    println!("Dice roll: {}", game_state.dice_roll);
    println!("Valid moves: {:?}", game_state.get_valid_moves());

    // Test Heuristic AI
    let mut heuristic_ai = HeuristicAI::new();
    let (heuristic_move, heuristic_evaluations) = heuristic_ai.get_best_move(&game_state);

    println!("\n🤖 Heuristic AI Results:");
    println!("Best move: {:?}", heuristic_move);
    println!("Evaluations:");
    for eval in &heuristic_evaluations {
        println!(
            "  Move {}: score={:.3}, type={}",
            eval.piece_index, eval.score, eval.move_type
        );
    }

    // Test AI with depth 0
    let mut depth0_ai = AI::new();
    let (depth0_move, depth0_evaluations) = depth0_ai.get_best_move(&game_state, 0);

    println!("\n🤖 Depth 0 AI Results:");
    println!("Best move: {:?}", depth0_move);
    println!("Evaluations:");
    for eval in &depth0_evaluations {
        println!(
            "  Move {}: score={:.3}, type={}",
            eval.piece_index, eval.score, eval.move_type
        );
    }

    // Compare results
    println!("\n🔍 Comparison:");
    println!("Same move selected: {}", heuristic_move == depth0_move);
    println!(
        "Same evaluations: {}",
        heuristic_evaluations.len() == depth0_evaluations.len()
    );

    if heuristic_evaluations.len() == depth0_evaluations.len() {
        for (i, (h_eval, d_eval)) in heuristic_evaluations
            .iter()
            .zip(depth0_evaluations.iter())
            .enumerate()
        {
            let score_diff = (h_eval.score - d_eval.score).abs();
            println!(
                "  Move {}: Heuristic={:.3}, Depth0={:.3}, Diff={:.3}",
                i, h_eval.score, d_eval.score, score_diff
            );
        }
    }

    // Test with a more complex position
    println!("\n📊 Testing Complex Position:");
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

    let (h_move, h_evals) = heuristic_ai.get_best_move(&complex_state);
    let (d_move, d_evals) = depth0_ai.get_best_move(&complex_state, 0);

    println!("Heuristic move: {:?}", h_move);
    println!("Depth 0 move: {:?}", d_move);
    println!("Same move in complex position: {}", h_move == d_move);

    // Assertions
    assert!(heuristic_move.is_some(), "Heuristic AI should find a move");
    assert!(depth0_move.is_some(), "Depth 0 AI should find a move");

    // They should theoretically be the same, but let's see what the actual difference is
    if heuristic_move != depth0_move {
        println!("\n⚠️  WARNING: Heuristic AI and Depth 0 AI chose different moves!");
        println!("This explains why Heuristic AI performs differently than expected.");
    }
}

use rgou_ai_core::{GameState, HeuristicAI, Player};

#[test]
fn test_heuristic_ai_perspective_fix() {
    println!("🔍 HEURISTIC AI PERSPECTIVE FIX TEST");
    println!("{}", "=".repeat(50));

    let mut heuristic_ai = HeuristicAI::new();

    // Test 1: Player 1 (minimizing) should prefer lower scores
    println!("\n📊 Test 1: Player 1 (minimizing)");
    println!("{}", "-".repeat(30));

    let mut game_state = GameState::new();
    game_state.current_player = Player::Player1;
    game_state.dice_roll = 1;

    let (best_move, evaluations) = heuristic_ai.get_best_move(&game_state);
    println!("Best move: {:?}", best_move);
    println!("Evaluations:");
    for eval in &evaluations[..3.min(evaluations.len())] {
        println!("  Move {}: score={:.3}", eval.piece_index, eval.score);
    }

    // Test 2: Player 2 (maximizing) should prefer higher scores
    println!("\n📊 Test 2: Player 2 (maximizing)");
    println!("{}", "-".repeat(30));

    let mut game_state2 = GameState::new();
    game_state2.current_player = Player::Player2;
    game_state2.dice_roll = 1;

    let (best_move2, evaluations2) = heuristic_ai.get_best_move(&game_state2);
    println!("Best move: {:?}", best_move2);
    println!("Evaluations:");
    for eval in &evaluations2[..3.min(evaluations2.len())] {
        println!("  Move {}: score={:.3}", eval.piece_index, eval.score);
    }

    // Test 3: Compare with a position where Player 1 has advantage
    println!("\n📊 Test 3: Player 1 advantage position");
    println!("{}", "-".repeat(35));

    let mut advantaged_state = GameState::new();
    advantaged_state.current_player = Player::Player1;
    advantaged_state.dice_roll = 2;

    // Give Player 1 some pieces on the board
    advantaged_state.player1_pieces[0].square = 3;
    advantaged_state.player1_pieces[1].square = 7;
    advantaged_state.board[3] = Some(rgou_ai_core::PiecePosition {
        square: 3,
        player: Player::Player1,
    });
    advantaged_state.board[7] = Some(rgou_ai_core::PiecePosition {
        square: 7,
        player: Player::Player1,
    });

    println!("Position evaluation: {}", advantaged_state.evaluate());
    let (best_move3, evaluations3) = heuristic_ai.get_best_move(&advantaged_state);
    println!("Best move: {:?}", best_move3);
    println!("Evaluations:");
    for eval in &evaluations3[..3.min(evaluations3.len())] {
        println!("  Move {}: score={:.3}", eval.piece_index, eval.score);
    }

    // Test 4: Compare with a position where Player 2 has advantage
    println!("\n📊 Test 4: Player 2 advantage position");
    println!("{}", "-".repeat(35));

    let mut advantaged_state2 = GameState::new();
    advantaged_state2.current_player = Player::Player2;
    advantaged_state2.dice_roll = 2;

    // Give Player 2 some pieces on the board
    advantaged_state2.player2_pieces[0].square = 19;
    advantaged_state2.player2_pieces[1].square = 16;
    advantaged_state2.board[19] = Some(rgou_ai_core::PiecePosition {
        square: 19,
        player: Player::Player2,
    });
    advantaged_state2.board[16] = Some(rgou_ai_core::PiecePosition {
        square: 16,
        player: Player::Player2,
    });

    println!("Position evaluation: {}", advantaged_state2.evaluate());
    let (best_move4, evaluations4) = heuristic_ai.get_best_move(&advantaged_state2);
    println!("Best move: {:?}", best_move4);
    println!("Evaluations:");
    for eval in &evaluations4[..3.min(evaluations4.len())] {
        println!("  Move {}: score={:.3}", eval.piece_index, eval.score);
    }

    // Verify the fix worked
    println!("\n✅ VERIFICATION:");
    println!("{}", "-".repeat(20));

    // Player 1 should choose the move with the lowest score (minimizing)
    if let Some(best_score) = evaluations.first().map(|e| e.score) {
        let all_scores: Vec<f32> = evaluations.iter().map(|e| e.score).collect();
        let min_score = all_scores.iter().fold(f32::INFINITY, |a, &b| a.min(b));
        println!("Player 1 best score: {:.3} (should be lowest)", best_score);
        println!("All scores: {:?}", all_scores);
        println!("Min score: {:.3}", min_score);
        assert!(
            (best_score - min_score).abs() < 0.001,
            "Player 1 should minimize"
        );
    }

    // Player 2 should choose the move with the highest score (maximizing)
    if let Some(best_score2) = evaluations2.first().map(|e| e.score) {
        let all_scores2: Vec<f32> = evaluations2.iter().map(|e| e.score).collect();
        let max_score = all_scores2.iter().fold(f32::NEG_INFINITY, |a, &b| a.max(b));
        println!(
            "Player 2 best score: {:.3} (should be highest)",
            best_score2
        );
        println!("All scores: {:?}", all_scores2);
        println!("Max score: {:.3}", max_score);
        assert!(
            (best_score2 - max_score).abs() < 0.001,
            "Player 2 should maximize"
        );
    }

    println!("\n🎯 CONCLUSION: Heuristic AI now uses correct perspective!");
}

#[test]
fn test_heuristic_vs_old_behavior() {
    println!("🔍 HEURISTIC AI: OLD vs NEW BEHAVIOR");
    println!("{}", "=".repeat(45));

    let mut game_state = GameState::new();
    game_state.dice_roll = 1;

    // Test both players
    for player in [Player::Player1, Player::Player2] {
        println!(
            "\n📊 Testing {}:",
            if player == Player::Player1 {
                "Player 1"
            } else {
                "Player 2"
            }
        );
        println!("{}", "-".repeat(30));

        game_state.current_player = player;
        let mut heuristic_ai = HeuristicAI::new();

        let (best_move, evaluations) = heuristic_ai.get_best_move(&game_state);
        println!("Best move: {:?}", best_move);

        if !evaluations.is_empty() {
            let best_score = evaluations[0].score;
            let all_scores: Vec<f32> = evaluations.iter().map(|e| e.score).collect();
            let min_score = all_scores.iter().fold(f32::INFINITY, |a, &b| a.min(b));
            let max_score = all_scores.iter().fold(f32::NEG_INFINITY, |a, &b| a.max(b));

            println!("Best score: {:.3}", best_score);
            println!("Score range: {:.3} to {:.3}", min_score, max_score);

            if player == Player::Player1 {
                // Player 1 should minimize (choose lowest score)
                assert!(
                    (best_score - min_score).abs() < 0.001,
                    "Player 1 should minimize"
                );
                println!("✅ Player 1 correctly minimizes");
            } else {
                // Player 2 should maximize (choose highest score)
                assert!(
                    (best_score - max_score).abs() < 0.001,
                    "Player 2 should maximize"
                );
                println!("✅ Player 2 correctly maximizes");
            }
        }
    }
}

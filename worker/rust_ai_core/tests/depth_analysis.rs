use rgou_ai_core::{GameState, Player, AI};

#[test]
fn test_depth_analysis() {
    println!("🔍 DEPTH ANALYSIS - Why Depth 1 > Depth 3?");
    println!("{}", "=".repeat(60));

    let mut ai = AI::new();
    let mut game_state = GameState::new();
    game_state.dice_roll = 1;

    println!("Initial state evaluation: {}", game_state.evaluate());
    println!("Valid moves: {:?}", game_state.get_valid_moves());

    // Test different depths on the same position
    for depth in 1..=4 {
        ai.clear_transposition_table();
        ai.nodes_evaluated = 0;

        let (best_move, evaluations) = ai.get_best_move(&game_state, depth);

        println!("\n📊 Depth {} Analysis:", depth);
        println!("  Best move: {:?}", best_move);
        println!("  Nodes evaluated: {}", ai.nodes_evaluated);
        println!("  Transposition hits: {}", ai.transposition_hits);
        println!("  Move evaluations:");

        for eval in &evaluations[..3.min(evaluations.len())] {
            println!(
                "    Move {}: score={:.3}, type={}",
                eval.piece_index, eval.score, eval.move_type
            );
        }
    }

    // Test a more complex position
    println!("\n🔍 Testing Complex Position:");
    println!("{}", "-".repeat(40));

    // Set up a position with pieces on the board
    game_state.player1_pieces[0].square = 3;
    game_state.player1_pieces[1].square = 7;
    game_state.player2_pieces[0].square = 19;
    game_state.player2_pieces[1].square = 16;

    // Update board
    game_state.board[3] = Some(rgou_ai_core::PiecePosition {
        square: 3,
        player: Player::Player1,
    });
    game_state.board[7] = Some(rgou_ai_core::PiecePosition {
        square: 7,
        player: Player::Player1,
    });
    game_state.board[19] = Some(rgou_ai_core::PiecePosition {
        square: 19,
        player: Player::Player2,
    });
    game_state.board[16] = Some(rgou_ai_core::PiecePosition {
        square: 16,
        player: Player::Player2,
    });

    println!("Complex state evaluation: {}", game_state.evaluate());
    println!("Valid moves: {:?}", game_state.get_valid_moves());

    for depth in 1..=4 {
        ai.clear_transposition_table();
        ai.nodes_evaluated = 0;

        let (best_move, evaluations) = ai.get_best_move(&game_state, depth);

        println!("\n📊 Depth {} Analysis (Complex):", depth);
        println!("  Best move: {:?}", best_move);
        println!("  Nodes evaluated: {}", ai.nodes_evaluated);
        println!("  Transposition hits: {}", ai.transposition_hits);
        println!("  Move evaluations:");

        for eval in &evaluations[..3.min(evaluations.len())] {
            println!(
                "    Move {}: score={:.3}, type={}",
                eval.piece_index, eval.score, eval.move_type
            );
        }
    }

    // Test the hypothesis about transposition table interference
    println!("\n🔍 Transposition Table Interference Test:");
    println!("{}", "-".repeat(50));

    let mut ai1 = AI::new();
    let mut ai3 = AI::new();

    // Run depth 1 first, then depth 3
    let (move1, _) = ai1.get_best_move(&game_state, 1);
    let (move3, _) = ai3.get_best_move(&game_state, 3);

    println!("Depth 1 best move: {:?}", move1);
    println!("Depth 3 best move: {:?}", move3);
    println!("Depth 1 nodes: {}", ai1.nodes_evaluated);
    println!("Depth 3 nodes: {}", ai3.nodes_evaluated);

    // Now test with shared transposition table
    let mut ai_shared = AI::new();
    let (move1_shared, _) = ai_shared.get_best_move(&game_state, 1);
    let (move3_shared, _) = ai_shared.get_best_move(&game_state, 3);

    println!("\nWith shared transposition table:");
    println!("Depth 1 best move: {:?}", move1_shared);
    println!("Depth 3 best move: {:?}", move3_shared);
    println!("Depth 1 nodes: {}", ai_shared.nodes_evaluated);
    ai_shared.nodes_evaluated = 0;
    let (_, _) = ai_shared.get_best_move(&game_state, 3);
    println!("Depth 3 nodes: {}", ai_shared.nodes_evaluated);
    println!(
        "Transposition table size: {}",
        ai_shared.get_transposition_table_size()
    );

        // Test move ordering impact
    println!("\n🔍 Move Ordering Impact:");
    println!("{}", "-".repeat(30));
    
    let valid_moves = game_state.get_valid_moves();
    println!("Valid moves: {:?}", valid_moves);
    
    // Test quiescence search by using depth 0
    println!("\n🔍 Quiescence Search Analysis:");
    println!("{}", "-".repeat(35));
    
    for depth in 1..=4 {
        ai.clear_transposition_table();
        ai.nodes_evaluated = 0;
        
        // Test depth 0 (quiescence search)
        let mut test_state = game_state.clone();
        test_state.make_move(0).unwrap();
        
        let (_, evaluations) = ai.get_best_move(&test_state, 0);
        println!("Depth 0 (quiescence) nodes: {}", ai.nodes_evaluated);
        if !evaluations.is_empty() {
            println!("  Best move score: {:.3}", evaluations[0].score);
        }
    }
}

#[test]
fn test_depth_vs_performance_correlation() {
    println!("📈 DEPTH vs PERFORMANCE CORRELATION");
    println!("{}", "=".repeat(50));

    let mut ai = AI::new();
    let mut game_state = GameState::new();
    game_state.dice_roll = 1;

    let mut depth_performance = Vec::new();

    for depth in 1..=4 {
        ai.clear_transposition_table();
        ai.nodes_evaluated = 0;
        ai.transposition_hits = 0;

        let start_time = std::time::Instant::now();
        let (best_move, evaluations) = ai.get_best_move(&game_state, depth);
        let end_time = std::time::Instant::now();
        let duration = end_time.duration_since(start_time);

        depth_performance.push((
            depth,
            best_move,
            ai.nodes_evaluated,
            ai.transposition_hits,
            duration.as_micros(),
            evaluations.len(),
        ));
    }

    println!("Depth | Best Move | Nodes | TT Hits | Time(μs) | Moves");
    println!("{}", "-".repeat(60));

    for (depth, best_move, nodes, tt_hits, time, moves) in &depth_performance {
        println!(
            "{:5} | {:9?} | {:5} | {:7} | {:8} | {:5}",
            depth, best_move, nodes, tt_hits, time, moves
        );
    }

    // Analyze the pattern
    println!("\n🔍 Pattern Analysis:");
    println!("{}", "-".repeat(25));

    if depth_performance[0].1 == depth_performance[2].1 {
        println!("✅ Depth 1 and Depth 3 choose the same move");
    } else {
        println!("❌ Depth 1 and Depth 3 choose different moves");
    }

    let nodes_ratio = depth_performance[2].2 as f64 / depth_performance[0].2 as f64;
    println!("📊 Nodes ratio (Depth 3 / Depth 1): {:.1}x", nodes_ratio);

    let time_ratio = depth_performance[2].4 as f64 / depth_performance[0].4 as f64;
    println!("⏱️  Time ratio (Depth 3 / Depth 1): {:.1}x", time_ratio);

    // Check if deeper search is actually exploring more
    if depth_performance[2].2 > depth_performance[0].2 {
        println!("✅ Depth 3 explores more nodes than Depth 1");
    } else {
        println!("❌ Depth 3 explores fewer nodes than Depth 1");
    }

    // Check transposition table effectiveness
    let tt_effectiveness = depth_performance[2].3 as f64 / depth_performance[2].2 as f64 * 100.0;
    println!(
        "🎯 Transposition table effectiveness (Depth 3): {:.1}%",
        tt_effectiveness
    );
}

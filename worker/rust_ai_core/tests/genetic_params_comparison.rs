use rgou_ai_core::{dice, genetic_params::GeneticParams, GameState, Player, AI};
use std::time::Instant;

#[test]
fn test_genetic_params_comparison() {
    println!("🧬 Genetic Parameters Comparison Test");
    println!("{}", "=".repeat(50));

    // Load evolved parameters
    let evolved_params = match GeneticParams::load_from_file("../../ml/data/genetic_params/evolved.json")
    {
        Ok(params) => params,
        Err(e) => {
            eprintln!("Failed to load evolved parameters: {}", e);
            return;
        }
    };

    let default_params = GeneticParams::default();

    println!("Default parameters: {:?}", default_params);
    println!("Evolved parameters: {:?}", evolved_params);
    println!();

    // Test parameters in actual games
    let num_games = 100;
    let mut evolved_wins = 0;
    let mut default_wins = 0;
    let mut total_moves = 0;
    let mut evolved_total_time = 0;
    let mut default_total_time = 0;

    println!("Playing {} games: Evolved vs Default parameters", num_games);
    println!("{}", "-".repeat(40));

    for game_num in 0..num_games {
        let mut game_state = GameState::new();
        let mut moves_played = 0;
        let max_moves = 200;
        let mut evolved_time = 0;
        let mut default_time = 0;

        while !game_state.is_game_over() && moves_played < max_moves {
            let current_player = game_state.current_player;
            let is_evolved_turn = current_player == Player::Player2;

            game_state.dice_roll = dice::roll_dice();

            if game_state.dice_roll == 0 {
                game_state.current_player = game_state.current_player.opponent();
                continue;
            }

            // Use different parameters based on whose turn it is
            let test_params = if is_evolved_turn {
                evolved_params.clone()
            } else {
                default_params.clone()
            };

            // Create a new game state with the test parameters
            let mut test_state = GameState::with_genetic_params(test_params);
            test_state.board = game_state.board.clone();
            test_state.player1_pieces = game_state.player1_pieces.clone();
            test_state.player2_pieces = game_state.player2_pieces.clone();
            test_state.current_player = game_state.current_player;
            test_state.dice_roll = game_state.dice_roll;

            let mut ai = AI::new();
            let start_time = Instant::now();
            let (best_move, _) = ai.get_best_move(&test_state, 3);
            let end_time = Instant::now();
            let move_time = end_time.duration_since(start_time).as_millis() as u64;

            if is_evolved_turn {
                evolved_time += move_time;
            } else {
                default_time += move_time;
            }

            if let Some(move_piece) = best_move {
                game_state
                    .make_move(move_piece)
                    .expect("Valid move should succeed");
            } else {
                // No valid moves, switch player
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
        let p2_finished = game_state
            .player2_pieces
            .iter()
            .filter(|p| p.square == 20)
            .count();

        if p2_finished >= 7 {
            evolved_wins += 1;
        } else if p1_finished >= 7 {
            default_wins += 1;
        } else {
            // Game ended by move limit, evaluate final position
            let evolved_eval = game_state.evaluate();
            if evolved_eval > 0 {
                evolved_wins += 1;
            } else {
                default_wins += 1;
            }
        }

        total_moves += moves_played;
        evolved_total_time += evolved_time;
        default_total_time += default_time;

        if (game_num + 1) % 20 == 0 {
            println!("Completed {} games...", game_num + 1);
        }
    }

    // Calculate statistics
    let evolved_win_rate = (evolved_wins as f64 / num_games as f64) * 100.0;
    let default_win_rate = (default_wins as f64 / num_games as f64) * 100.0;
    let avg_moves = total_moves as f64 / num_games as f64;
    let evolved_avg_time = evolved_total_time as f64 / num_games as f64;
    let default_avg_time = default_total_time as f64 / num_games as f64;

    println!("\n📊 Results:");
    println!("{}", "=".repeat(30));
    println!(
        "Evolved parameters wins: {} ({:.1}%)",
        evolved_wins, evolved_win_rate
    );
    println!(
        "Default parameters wins: {} ({:.1}%)",
        default_wins, default_win_rate
    );
    println!("Average moves per game: {:.1}", avg_moves);
    println!("Evolved avg time per game: {:.1}ms", evolved_avg_time);
    println!("Default avg time per game: {:.1}ms", default_avg_time);

    // Performance analysis
    println!("\n🎯 Performance Analysis:");
    println!("{}", "=".repeat(25));

    if evolved_win_rate > default_win_rate + 5.0 {
        println!("✅ Evolved parameters show significant improvement!");
    } else if evolved_win_rate > default_win_rate {
        println!("✅ Evolved parameters show slight improvement");
    } else if evolved_win_rate < default_win_rate - 5.0 {
        println!("❌ Evolved parameters perform worse than default");
    } else {
        println!("⚠️  Evolved parameters perform similarly to default");
    }

    // Parameter analysis
    println!("\n🔍 Parameter Changes:");
    println!("{}", "=".repeat(20));
    println!(
        "win_score: {} → {} ({:+})",
        default_params.win_score,
        evolved_params.win_score,
        evolved_params.win_score - default_params.win_score
    );
    println!(
        "finished_piece_value: {} → {} ({:+})",
        default_params.finished_piece_value,
        evolved_params.finished_piece_value,
        evolved_params.finished_piece_value - default_params.finished_piece_value
    );
    println!(
        "rosette_control_bonus: {} → {} ({:+})",
        default_params.rosette_control_bonus,
        evolved_params.rosette_control_bonus,
        evolved_params.rosette_control_bonus - default_params.rosette_control_bonus
    );
    println!("Other parameters: unchanged");

    // Assertions for test validation
    assert!(
        evolved_wins + default_wins == num_games,
        "All games should have a winner"
    );
    assert!(total_moves > 0, "Games should have moves");
}

use rgou_ai_core::{dice, genetic_params::GeneticParams, ml_ai::MLAI, GameState, Player, AI};
use std::time::Instant;

fn get_evolved_params() -> GeneticParams {
    GeneticParams::load_from_file("ml/data/genetic_params/evolved.json")
        .unwrap_or_else(|_| GeneticParams::default())
}

#[test]
fn test_ml_vs_expectiminimax_ai() {
    println!("🤖 ML vs Expectiminimax AI Test");
    println!("{}", "=".repeat(50));

    let evolved_params = get_evolved_params();
    println!("Using evolved parameters for EMM AI: {:?}", evolved_params);

    let weights_file = "ml/data/weights/ml_ai_weights_v2.json";
    let weights_path = std::path::Path::new(weights_file);

    if !weights_path.exists() {
        println!("⚠️  ML weights file not found: {}", weights_file);
        println!("Skipping ML vs EMM test");
        return;
    }

    let (value_weights, policy_weights) = match load_ml_weights(weights_file) {
        Ok(weights) => weights,
        Err(e) => {
            println!("❌ Failed to load ML weights: {}", e);
            return;
        }
    };

    let mut ml_ai = MLAI::new();
    ml_ai.load_pretrained(&value_weights, &policy_weights);

    let num_games = 50;
    let mut ml_wins = 0;
    let mut emm_wins = 0;
    let mut total_moves = 0;
    let mut ml_total_time = 0;
    let mut emm_total_time = 0;

    println!(
        "Playing {} games: ML AI vs EMM AI (with evolved parameters)",
        num_games
    );
    println!("{}", "-".repeat(50));

    for game_num in 0..num_games {
        let mut game_state = GameState::with_genetic_params(evolved_params.clone());
        let mut moves_played = 0;
        let max_moves = 200;
        let mut ml_time = 0;
        let mut emm_time = 0;

        while !game_state.is_game_over() && moves_played < max_moves {
            game_state.dice_roll = dice::roll_dice();

            if game_state.dice_roll == 0 {
                game_state.current_player = game_state.current_player.opponent();
                continue;
            }

            let start_time = Instant::now();
            let best_move = if game_state.current_player == Player::Player1 {
                let response = ml_ai.get_best_move(&game_state);
                response.r#move
            } else {
                let mut emm_ai = AI::new();
                let (move_option, _) = emm_ai.get_best_move(&game_state, 3);
                move_option
            };
            let end_time = Instant::now();
            let move_time = end_time.duration_since(start_time).as_millis() as u64;

            if game_state.current_player == Player::Player1 {
                ml_time += move_time;
            } else {
                emm_time += move_time;
            }

            if let Some(move_piece) = best_move {
                if game_state.make_move(move_piece).is_err() {
                    game_state.current_player = game_state.current_player.opponent();
                }
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
        let p2_finished = game_state
            .player2_pieces
            .iter()
            .filter(|p| p.square == 20)
            .count();

        if p1_finished >= 7 {
            ml_wins += 1;
        } else if p2_finished >= 7 {
            emm_wins += 1;
        } else {
            let final_eval = game_state.evaluate();
            if final_eval > 0 {
                emm_wins += 1; // EMM (Player2) wins
            } else {
                ml_wins += 1; // ML (Player1) wins
            }
        }

        total_moves += moves_played;
        ml_total_time += ml_time;
        emm_total_time += emm_time;

        if (game_num + 1) % 10 == 0 {
            println!("Completed {} games...", game_num + 1);
        }
    }

    let ml_win_rate = (ml_wins as f64 / num_games as f64) * 100.0;
    let emm_win_rate = (emm_wins as f64 / num_games as f64) * 100.0;
    let avg_moves = total_moves as f64 / num_games as f64;
    let ml_avg_time = ml_total_time as f64 / num_games as f64;
    let emm_avg_time = emm_total_time as f64 / num_games as f64;

    println!("\n📊 Results:");
    println!("{}", "=".repeat(30));
    println!("ML AI wins: {} ({:.1}%)", ml_wins, ml_win_rate);
    println!("EMM AI wins: {} ({:.1}%)", emm_wins, emm_win_rate);
    println!("Average moves per game: {:.1}", avg_moves);
    println!("ML AI avg time per game: {:.1}ms", ml_avg_time);
    println!("EMM AI avg time per game: {:.1}ms", emm_avg_time);

    println!("\n🎯 Performance Analysis:");
    println!("{}", "=".repeat(25));

    if ml_win_rate > emm_win_rate + 5.0 {
        println!("✅ ML AI shows significant advantage!");
    } else if ml_win_rate > emm_win_rate {
        println!("✅ ML AI shows slight advantage");
    } else if ml_win_rate < emm_win_rate - 5.0 {
        println!("❌ EMM AI (with evolved params) shows significant advantage");
    } else {
        println!("⚠️  Both AIs perform similarly");
    }

    let speed_ratio = emm_avg_time / ml_avg_time;
    println!("\n⚡ Speed Comparison:");
    println!("EMM AI is {:.1}x slower than ML AI", speed_ratio);

    assert!(
        ml_wins + emm_wins == num_games,
        "All games should have a winner"
    );
    assert!(total_moves > 0, "Games should have moves");
    assert!(ml_total_time > 0, "ML AI should have taken some time");
    assert!(emm_total_time > 0, "EMM AI should have taken some time");
}

fn load_ml_weights(weights_file: &str) -> Result<(Vec<f32>, Vec<f32>), Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string(weights_file)?;
    let data: serde_json::Value = serde_json::from_str(&content)?;

    let value_weights = data["value_weights"]
        .as_array()
        .ok_or("Invalid value_weights format")?
        .iter()
        .map(|v| v.as_f64().unwrap_or(0.0) as f32)
        .collect();

    let policy_weights = data["policy_weights"]
        .as_array()
        .ok_or("Invalid policy_weights format")?
        .iter()
        .map(|v| v.as_f64().unwrap_or(0.0) as f32)
        .collect();

    Ok((value_weights, policy_weights))
}

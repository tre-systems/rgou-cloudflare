use rand::{rngs::StdRng, SeedableRng};
use rayon::prelude::*;
use rgou_ai_core::{
    dice, genetic_params::GeneticParams, ml_ai::MLAI, oracle_ai::OracleAI, GameState, Player, AI,
    BROWSER_CLASSIC_AI_DEPTH,
};
use std::collections::HashMap;
use std::time::Instant;

fn optimize_cpu_usage() {
    // Detect Apple Silicon and optimize thread pool
    if cfg!(target_os = "macos") {
        // On Apple Silicon, use performance cores
        let num_cores = std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(8);

        // Use 80% of available cores to leave some for system
        let optimal_threads = (num_cores as f64 * 0.8) as usize;
        rayon::ThreadPoolBuilder::new()
            .num_threads(optimal_threads)
            .stack_size(8 * 1024 * 1024) // 8MB stack for deep recursion
            .build_global()
            .unwrap_or_else(|_| {
                println!("Warning: Could not set optimal thread count, using default");
            });

        println!(
            "🍎 Apple Silicon detected: Using {} threads ({} cores available)",
            optimal_threads, num_cores
        );
    } else {
        // On other platforms, use all available cores
        let num_cores = std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(4);

        rayon::ThreadPoolBuilder::new()
            .num_threads(num_cores)
            .stack_size(8 * 1024 * 1024)
            .build_global()
            .unwrap_or_else(|_| {
                println!("Warning: Could not set optimal thread count, using default");
            });

        println!("🖥️  Using {} threads for parallel processing", num_cores);
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
enum AIType {
    Random,
    Heuristic,
    EMMDepth1,
    EMMDepth2,
    EMMDepth3,
    EMMDepth4,
    MLFast,
    MLV4,
    MLHybrid,
    MLPyTorchV5,
    OracleV1,
    BrowserClassic,
}

impl AIType {
    fn name(&self) -> &'static str {
        match self {
            AIType::Random => "Random",
            AIType::Heuristic => "Heuristic",
            AIType::EMMDepth1 => "EMM-Depth1",
            AIType::EMMDepth2 => "EMM-Depth2",
            AIType::EMMDepth3 => "EMM-Depth3",
            AIType::EMMDepth4 => "EMM-Depth4",
            AIType::MLFast => "ML-Fast",
            AIType::MLV4 => "ML-V4",
            AIType::MLHybrid => "ML-Hybrid",
            AIType::MLPyTorchV5 => "ML-PyTorch-V5",
            AIType::OracleV1 => "Oracle-V1",
            AIType::BrowserClassic => "Classic-Browser",
        }
    }

    fn weights_file(&self) -> Option<&'static str> {
        match self {
            AIType::MLFast => Some("../../ml/data/weights/ml_ai_weights_fast.json"),
            AIType::MLV4 => Some("../../ml/data/weights/ml_ai_weights_v4.json"),
            AIType::MLHybrid => Some("../../ml/data/weights/ml_ai_weights_hybrid.json"),
            AIType::MLPyTorchV5 => Some("../../ml/data/weights/ml_ai_weights_pytorch_v5.json"),
            _ => None,
        }
    }
}

trait AIPlayer {
    fn get_move(&mut self, game_state: &GameState) -> Option<usize>;
    fn reset(&mut self);
}

struct RandomAI;

impl AIPlayer for RandomAI {
    fn get_move(&mut self, game_state: &GameState) -> Option<usize> {
        let valid_moves = game_state.get_valid_moves();
        if valid_moves.is_empty() {
            None
        } else {
            let random_index = (dice::roll_dice() as usize) % valid_moves.len();
            Some(valid_moves[random_index] as usize)
        }
    }

    fn reset(&mut self) {
        // Random AI doesn't need reset
    }
}

struct HeuristicAI;

impl AIPlayer for HeuristicAI {
    fn get_move(&mut self, game_state: &GameState) -> Option<usize> {
        let valid_moves = game_state.get_valid_moves();
        if valid_moves.is_empty() {
            return None;
        }

        // Simple heuristic: prefer moves that advance pieces
        let mut best_move = valid_moves[0];
        let mut best_score = -1000.0;

        for &move_index in &valid_moves {
            let mut test_state = game_state.clone();
            if test_state.make_move(move_index).is_ok() {
                let score = evaluate_position(&test_state, game_state.current_player);
                if score > best_score {
                    best_score = score;
                    best_move = move_index;
                }
            }
        }

        Some(best_move as usize)
    }

    fn reset(&mut self) {
        // Heuristic AI doesn't need reset
    }
}

struct ExpectiminimaxAI {
    ai: AI,
    depth: u8,
}

impl ExpectiminimaxAI {
    fn new(depth: u8) -> Self {
        Self {
            ai: AI::new(),
            depth,
        }
    }
}

impl AIPlayer for ExpectiminimaxAI {
    fn get_move(&mut self, game_state: &GameState) -> Option<usize> {
        let (best_move, _) = self.ai.get_best_move(game_state, self.depth);
        best_move.map(|m| m as usize)
    }

    fn reset(&mut self) {
        self.ai.clear_transposition_table();
    }
}

struct MLAIPlayer {
    ai: MLAI,
}

struct OracleAIPlayer {
    ai: OracleAI,
}

impl OracleAIPlayer {
    fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let weights = load_single_network_weights(
            "../../ml/data/weights/oracle_ai_weights_v1.json",
            "weights",
        )?;
        let mut ai = OracleAI::new();
        ai.load_pretrained(&weights)?;
        Ok(Self { ai })
    }
}

impl AIPlayer for OracleAIPlayer {
    fn get_move(&mut self, game_state: &GameState) -> Option<usize> {
        self.ai
            .get_best_move(game_state)
            .r#move
            .map(|index| index as usize)
    }

    fn reset(&mut self) {}
}

impl MLAIPlayer {
    fn new(ai_type: &AIType) -> Result<Self, Box<dyn std::error::Error>> {
        let weights_file = ai_type
            .weights_file()
            .ok_or("No weights file for AI type")?;
        let weights_path = std::path::Path::new(weights_file);

        if !weights_path.exists() {
            return Err(format!("Weights file not found: {}", weights_file).into());
        }

        let (value_weights, policy_weights) = load_ml_weights(weights_file)?;
        let mut ai = MLAI::new();
        ai.load_pretrained(&value_weights, &policy_weights)?;

        Ok(Self { ai })
    }
}

impl AIPlayer for MLAIPlayer {
    fn get_move(&mut self, game_state: &GameState) -> Option<usize> {
        let response = self.ai.get_best_move(game_state);
        response.r#move.map(|m| m as usize)
    }

    fn reset(&mut self) {
        // ML AI doesn't need reset - weights are stateless
    }
}

fn evaluate_position(game_state: &GameState, player: Player) -> f32 {
    let mut score = 0.0;

    let pieces = if player == Player::Player1 {
        &game_state.player1_pieces
    } else {
        &game_state.player2_pieces
    };

    for piece in pieces {
        if piece.square == 20 {
            score += 100.0; // Finished pieces are very valuable
        } else if piece.square >= 0 {
            score += piece.square as f32; // Advancement bonus
        }
    }

    score
}

fn load_ml_weights(weights_file: &str) -> Result<(Vec<f32>, Vec<f32>), Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string(weights_file)?;
    let data: serde_json::Value = serde_json::from_str(&content)?;

    let value_weights = data["value_weights"]
        .as_array()
        .ok_or("Invalid value_weights format")?
        .iter()
        .map(|value| {
            value
                .as_f64()
                .map(|number| number as f32)
                .ok_or_else(|| "value_weights contains a non-number".to_string())
        })
        .collect::<Result<_, _>>()?;

    let policy_weights = data["policy_weights"]
        .as_array()
        .ok_or("Invalid policy_weights format")?
        .iter()
        .map(|value| {
            value
                .as_f64()
                .map(|number| number as f32)
                .ok_or_else(|| "policy_weights contains a non-number".to_string())
        })
        .collect::<Result<_, _>>()?;

    Ok((value_weights, policy_weights))
}

fn load_single_network_weights(
    weights_file: &str,
    field: &str,
) -> Result<Vec<f32>, Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string(weights_file)?;
    let data: serde_json::Value = serde_json::from_str(&content)?;
    let values = data[field]
        .as_array()
        .ok_or_else(|| format!("Invalid {field} format"))?;
    let weights = values
        .iter()
        .map(|value| {
            value
                .as_f64()
                .map(|number| number as f32)
                .ok_or_else(|| format!("{field} contains a non-number"))
        })
        .collect::<Result<Vec<_>, _>>()?;
    Ok(weights)
}

#[derive(Debug)]
struct GameResult {
    winner: Player,
    ai1_time_ms: u64,
    ai2_time_ms: u64,
}

fn play_game(
    ai1: &mut Box<dyn AIPlayer>,
    ai2: &mut Box<dyn AIPlayer>,
    ai1_plays_first: bool,
    rng: &mut StdRng,
) -> GameResult {
    let evolved_params = GeneticParams::evolved();
    let mut game_state = GameState::with_genetic_params(evolved_params);
    let mut moves_played = 0;
    let mut ai1_time_ms = 0;
    let mut ai2_time_ms = 0;
    let max_moves = 200; // Prevent infinite games

    while !game_state.is_game_over() && moves_played < max_moves {
        game_state.dice_roll = dice::roll_dice_with_rng(rng);

        if game_state.dice_roll == 0 {
            game_state.current_player = game_state.current_player.opponent();
            continue;
        }

        let best_move = if game_state.current_player == Player::Player1 {
            if ai1_plays_first {
                let start = Instant::now();
                let move_result = ai1.get_move(&game_state);
                let duration = start.elapsed();
                ai1_time_ms += duration.as_millis() as u64;
                move_result
            } else {
                let start = Instant::now();
                let move_result = ai2.get_move(&game_state);
                let duration = start.elapsed();
                ai2_time_ms += duration.as_millis() as u64;
                move_result
            }
        } else {
            if ai1_plays_first {
                let start = Instant::now();
                let move_result = ai2.get_move(&game_state);
                let duration = start.elapsed();
                ai2_time_ms += duration.as_millis() as u64;
                move_result
            } else {
                let start = Instant::now();
                let move_result = ai1.get_move(&game_state);
                let duration = start.elapsed();
                ai1_time_ms += duration.as_millis() as u64;
                move_result
            }
        };

        if let Some(move_index) = best_move {
            if game_state.make_move(move_index as u8).is_err() {
                // Invalid move, skip turn
                game_state.current_player = game_state.current_player.opponent();
            }
        } else {
            // No valid moves, skip turn
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

    let winner = if p1_finished >= 7 {
        Player::Player1
    } else if p2_finished >= 7 {
        Player::Player2
    } else {
        // Game ended without clear winner (max moves reached)
        if p1_finished > p2_finished {
            Player::Player1
        } else {
            Player::Player2
        }
    };

    GameResult {
        winner,
        ai1_time_ms,
        ai2_time_ms,
    }
}

fn create_ai_player(ai_type: &AIType) -> Result<Box<dyn AIPlayer>, Box<dyn std::error::Error>> {
    match ai_type {
        AIType::Random => Ok(Box::new(RandomAI)),
        AIType::Heuristic => Ok(Box::new(HeuristicAI)),
        AIType::EMMDepth1 => Ok(Box::new(ExpectiminimaxAI::new(1))),
        AIType::EMMDepth2 => Ok(Box::new(ExpectiminimaxAI::new(2))),
        AIType::EMMDepth3 => Ok(Box::new(ExpectiminimaxAI::new(3))),
        AIType::BrowserClassic => Ok(Box::new(ExpectiminimaxAI::new(BROWSER_CLASSIC_AI_DEPTH))),
        AIType::EMMDepth4 => {
            // Only run depth 4 if explicitly requested
            if std::env::var("RUN_SLOW_TESTS").is_ok() {
                Ok(Box::new(ExpectiminimaxAI::new(4)))
            } else {
                Err("Depth 4 tests require RUN_SLOW_TESTS=1".into())
            }
        }
        AIType::OracleV1 => Ok(Box::new(OracleAIPlayer::new()?)),
        _ => {
            // ML AI types
            let ml_ai = MLAIPlayer::new(ai_type)?;
            Ok(Box::new(ml_ai))
        }
    }
}

// Matrix result structure
#[derive(Debug)]
struct MatrixResult {
    ai1: String,
    ai2: String,
    ai1_win_rate: f64,
    ai1_avg_time_ms: f64,
    ai2_avg_time_ms: f64,
    ai1_wins_as_player1: u32,
    ai1_wins_as_player2: u32,
    games_per_seat: u32,
}

// Enhanced recommendations generation
fn generate_recommendations(
    ai_performance: &HashMap<String, f64>,
    ai_speeds: &HashMap<String, f64>,
) -> Vec<String> {
    let mut recommendations = Vec::new();

    // Find best performing AI
    if let Some((best_ai, win_rate)) = ai_performance
        .iter()
        .max_by(|a, b| a.1.partial_cmp(b.1).unwrap_or(std::cmp::Ordering::Equal))
    {
        if *win_rate > 70.0 {
            recommendations.push(format!(
                "{} shows excellent performance ({:.1}% avg win rate) and is ready for production",
                best_ai, win_rate
            ));
        } else if *win_rate > 60.0 {
            recommendations.push(format!(
                "{} shows good performance ({:.1}% avg win rate) and could be used in production",
                best_ai, win_rate
            ));
        } else {
            recommendations.push(format!(
                "{} shows moderate performance ({:.1}% avg win rate), consider further training",
                best_ai, win_rate
            ));
        }
    }

    // Find fastest AI
    if let Some((fastest_ai, avg_time)) = ai_speeds
        .iter()
        .min_by(|a, b| a.1.partial_cmp(b.1).unwrap_or(std::cmp::Ordering::Equal))
    {
        if *avg_time < 1.0 {
            recommendations.push(format!(
                "{} is very fast ({:.1}ms/move) and suitable for real-time play",
                fastest_ai, avg_time
            ));
        } else if *avg_time < 10.0 {
            recommendations.push(format!(
                "{} is fast ({:.1}ms/move) and suitable for interactive play",
                fastest_ai, avg_time
            ));
        }
    }

    // General recommendations
    recommendations.push("Use EMM-Depth3 for best performance/speed balance".to_string());
    recommendations.push("Use Random AI for baseline testing".to_string());
    recommendations.push("Use Heuristic AI for educational purposes".to_string());

    recommendations
}

#[test]
fn test_ai_matrix() {
    optimize_cpu_usage();
    println!("🤖 AI Matrix Test - Comprehensive AI Comparison");
    println!("{}", "=".repeat(60));

    // Get number of games from environment or use default
    let num_games = std::env::var("NUM_GAMES")
        .unwrap_or_else(|_| "10".to_string())
        .parse::<u32>()
        .unwrap_or(10);
    assert!(
        num_games > 0 && num_games % 2 == 0,
        "NUM_GAMES must be a positive even number"
    );

    println!("Configuration:");
    println!("  Games per match: {}", num_games);
    println!(
        "  Include slow tests: {}",
        std::env::var("RUN_SLOW_TESTS").is_ok()
    );
    println!();

    let deployed_only = std::env::var("AI_MATRIX_DEPLOYED_ONLY").is_ok();
    let mut ai_types = if deployed_only {
        vec![
            AIType::BrowserClassic,
            AIType::MLPyTorchV5,
            AIType::OracleV1,
        ]
    } else {
        vec![
            AIType::Random,
            AIType::Heuristic,
            AIType::EMMDepth1,
            AIType::EMMDepth2,
            AIType::EMMDepth3,
            AIType::MLFast,
            AIType::MLV4,
            AIType::MLHybrid,
            AIType::MLPyTorchV5,
            AIType::OracleV1,
        ]
    };

    if !deployed_only && std::env::var("RUN_SLOW_TESTS").is_ok() {
        ai_types.push(AIType::EMMDepth4);
    }

    if deployed_only {
        println!("  Scope: browser-deployed opponents only");
        println!("  Classic search depth: {BROWSER_CLASSIC_AI_DEPTH}");
    }

    println!("Testing {} AI types:", ai_types.len());
    for ai_type in &ai_types {
        println!("  - {}", ai_type.name());
    }
    println!();

    // Create all match combinations
    let mut match_combinations = Vec::new();
    for (i, ai_type1) in ai_types.iter().enumerate() {
        for (j, ai_type2) in ai_types.iter().enumerate() {
            if i >= j {
                continue; // Skip self-matches and duplicate matches
            }
            match_combinations.push((ai_type1.clone(), ai_type2.clone()));
        }
    }

    println!(
        "🎯 Running {} AI match combinations in parallel...",
        match_combinations.len()
    );

    let start_time = Instant::now();

    let results: Vec<MatrixResult> = match_combinations
        .into_par_iter()
        .enumerate()
        .map(|(match_index, (ai_type1, ai_type2))| {
            println!("🏆 Testing {} vs {}", ai_type1.name(), ai_type2.name());

            let mut ai1 = create_ai_player(&ai_type1)
                .unwrap_or_else(|error| panic!("failed to create {}: {error}", ai_type1.name()));
            let mut ai2 = create_ai_player(&ai_type2)
                .unwrap_or_else(|error| panic!("failed to create {}: {error}", ai_type2.name()));

            let mut ai1_wins = 0;
            let mut ai2_wins = 0;
            let mut ai1_total_time = 0;
            let mut ai2_total_time = 0;
            let mut ai1_wins_as_player1 = 0;
            let mut ai1_wins_as_player2 = 0;
            let mut rng = StdRng::seed_from_u64(0x5247_4F55_2026_0000 + match_index as u64);

            // Play games with periodic AI state reset
            for game in 0..num_games {
                let ai1_first = game % 2 == 0; // Alternate who goes first
                let result = play_game(&mut ai1, &mut ai2, ai1_first, &mut rng);

                // Track moves for statistics
                ai1_total_time += result.ai1_time_ms;
                ai2_total_time += result.ai2_time_ms;

                let ai1_won = if ai1_first {
                    result.winner == Player::Player1
                } else {
                    result.winner == Player::Player2
                };

                if ai1_won {
                    ai1_wins += 1;
                    if ai1_first {
                        ai1_wins_as_player1 += 1;
                    } else {
                        ai1_wins_as_player2 += 1;
                    }
                } else {
                    ai2_wins += 1;
                }

                // Reset AI state periodically to prevent memory buildup
                if (game + 1) % 20 == 0 {
                    ai1.reset();
                    ai2.reset();
                }

                if game % 20 == 0 && num_games > 20 {
                    println!(
                        "    Game {}: {} wins: {}, {} wins: {}",
                        game + 1,
                        ai_type1.name(),
                        ai1_wins,
                        ai_type2.name(),
                        ai2_wins
                    );
                }
            }

            let ai1_win_rate = (ai1_wins as f64 / num_games as f64) * 100.0;
            let ai1_avg_time = ai1_total_time as f64 / num_games as f64;
            let ai2_avg_time = ai2_total_time as f64 / num_games as f64;

            MatrixResult {
                ai1: ai_type1.name().to_string(),
                ai2: ai_type2.name().to_string(),
                ai1_win_rate,
                ai1_avg_time_ms: ai1_avg_time,
                ai2_avg_time_ms: ai2_avg_time,
                ai1_wins_as_player1,
                ai1_wins_as_player2,
                games_per_seat: num_games / 2,
            }
        })
        .collect();

    let total_games = results.len() * num_games as usize;
    let _duration = start_time.elapsed();

    // Print individual match results
    for result in &results {
        println!(
            "  {} vs {}: {} wins {:.1}%, {} wins {:.1}%",
            result.ai1,
            result.ai2,
            result.ai1,
            result.ai1_win_rate,
            result.ai2,
            100.0 - result.ai1_win_rate
        );
        println!(
            "  Average time: {} {:.1}ms, {} {:.1}ms",
            result.ai1, result.ai1_avg_time_ms, result.ai2, result.ai2_avg_time_ms
        );
        println!(
            "  {} seat split: Player 1 {}/{}, Player 2 {}/{}",
            result.ai1,
            result.ai1_wins_as_player1,
            result.games_per_seat,
            result.ai1_wins_as_player2,
            result.games_per_seat
        );
        println!();
    }

    let duration = start_time.elapsed();

    // Print matrix results
    println!("📊 AI MATRIX RESULTS");
    println!("{}", "=".repeat(60));
    println!("Test Configuration:");
    println!("  Total games played: {}", total_games);
    println!("  Duration: {:.2} seconds", duration.as_secs_f64());
    println!(
        "  Games per second: {:.1}",
        total_games as f64 / duration.as_secs_f64()
    );
    println!();

    // Print matrix table
    println!("MATRIX TABLE (Win Rate % of Row vs Column):");
    println!("{}", "-".repeat(80));

    // Header
    print!("{:<15}", "AI Type");
    for ai_type in &ai_types {
        print!(" {:<10}", ai_type.name());
    }
    println!();
    println!("{}", "-".repeat(80));

    // Matrix rows
    for ai_type1 in &ai_types {
        print!("{:<15}", ai_type1.name());

        for ai_type2 in &ai_types {
            if ai_type1 == ai_type2 {
                print!(" {:<10}", "-");
            } else {
                let result = results.iter().find(|r| {
                    (r.ai1 == ai_type1.name() && r.ai2 == ai_type2.name())
                        || (r.ai1 == ai_type2.name() && r.ai2 == ai_type1.name())
                });

                if let Some(r) = result {
                    let win_rate = if r.ai1 == ai_type1.name() {
                        r.ai1_win_rate
                    } else {
                        100.0 - r.ai1_win_rate
                    };
                    print!(" {:<10.1}", win_rate);
                } else {
                    print!(" {:<10}", "N/A");
                }
            }
        }
        println!();
    }
    println!("{}", "-".repeat(80));
    println!();

    println!("🪑 SEAT BALANCE:");
    println!("{}", "-".repeat(40));
    for result in &results {
        let player1_rate = result.ai1_wins_as_player1 as f64 / result.games_per_seat as f64 * 100.0;
        let player2_rate = result.ai1_wins_as_player2 as f64 / result.games_per_seat as f64 * 100.0;
        println!(
            "{} vs {}: Player 1 {:.1}%, Player 2 {:.1}%",
            result.ai1, result.ai2, player1_rate, player2_rate
        );
    }
    println!();

    // Performance summary
    println!("🏆 PERFORMANCE SUMMARY:");
    println!("{}", "-".repeat(40));

    let mut ai_performance = HashMap::new();

    for result in &results {
        // Add wins for ai1
        *ai_performance.entry(result.ai1.clone()).or_insert(0.0) += result.ai1_win_rate;
        // Add wins for ai2 (100 - ai1_win_rate)
        *ai_performance.entry(result.ai2.clone()).or_insert(0.0) += 100.0 - result.ai1_win_rate;
    }

    let mut sorted_performance: Vec<_> = ai_performance.iter().collect();
    sorted_performance.sort_by(|a, b| b.1.partial_cmp(a.1).unwrap());

    for (i, (ai_name, total_win_rate)) in sorted_performance.iter().enumerate() {
        let avg_win_rate = *total_win_rate / (ai_types.len() - 1) as f64;
        println!(
            "{}. {}: {:.1}% average win rate",
            i + 1,
            ai_name,
            avg_win_rate
        );
    }
    println!();

    // Speed analysis
    println!("⚡ SPEED ANALYSIS:");
    println!("{}", "-".repeat(40));

    let mut ai_speeds = HashMap::new();
    let mut ai_speed_counts = HashMap::new();

    for result in &results {
        *ai_speeds.entry(result.ai1.clone()).or_insert(0.0) += result.ai1_avg_time_ms;
        *ai_speeds.entry(result.ai2.clone()).or_insert(0.0) += result.ai2_avg_time_ms;
        *ai_speed_counts.entry(result.ai1.clone()).or_insert(0) += 1;
        *ai_speed_counts.entry(result.ai2.clone()).or_insert(0) += 1;
    }

    let mut sorted_speeds: Vec<_> = ai_speeds.iter().collect();
    sorted_speeds.sort_by(|a, b| a.1.partial_cmp(b.1).unwrap());

    for (ai_name, total_time) in &sorted_speeds {
        let count = ai_speed_counts[*ai_name];
        let avg_time = *total_time / count as f64;
        let speed_category = if avg_time < 1.0 {
            "Very Fast"
        } else if avg_time < 10.0 {
            "Fast"
        } else if avg_time < 50.0 {
            "Moderate"
        } else {
            "Slow"
        };
        println!("{}: {:.1}ms/move ({})", ai_name, avg_time, speed_category);
    }
    println!();

    // Enhanced recommendations
    println!("💡 RECOMMENDATIONS:");
    println!("{}", "-".repeat(40));

    // Calculate average win rates for recommendations
    let mut ai_avg_performance = HashMap::new();
    for (ai_name, total_win_rate) in &ai_performance {
        let avg_win_rate = *total_win_rate / (ai_types.len() - 1) as f64;
        ai_avg_performance.insert(ai_name.clone(), avg_win_rate);
    }

    let recommendations = generate_recommendations(&ai_avg_performance, &ai_speeds);
    for recommendation in &recommendations {
        println!("• {}", recommendation);
    }
    println!();

    println!("🎉 AI Matrix test completed successfully!");
}

use rand::Rng;
use rand::SeedableRng;
use rgou_ai_core::ml_ai::MLAI;
use rgou_ai_core::{dice, GameState, HeuristicAI, Player, AI, PIECES_PER_PLAYER};

const GAMES_PER_MATCHUP: usize = 50;

#[derive(Debug, Clone)]
struct MatrixResult {
    ai1: String,
    ai2: String,
    ai1_wins: usize,
    ai2_wins: usize,
    total_moves: usize,
    avg_moves: f64,
    ai1_avg_time_ms: f64,
    ai2_avg_time_ms: f64,
}

impl MatrixResult {
    fn new(ai1: &str, ai2: &str) -> Self {
        MatrixResult {
            ai1: ai1.to_string(),
            ai2: ai2.to_string(),
            ai1_wins: 0,
            ai2_wins: 0,
            total_moves: 0,
            avg_moves: 0.0,
            ai1_avg_time_ms: 0.0,
            ai2_avg_time_ms: 0.0,
        }
    }

    fn ai1_win_rate(&self) -> f64 {
        (self.ai1_wins as f64 / GAMES_PER_MATCHUP as f64) * 100.0
    }

    fn ai2_win_rate(&self) -> f64 {
        (self.ai2_wins as f64 / GAMES_PER_MATCHUP as f64) * 100.0
    }
}

#[derive(Debug, Clone)]
enum AIType {
    Random,
    Heuristic,
    Expectiminimax(u8),
    ML,
}

impl AIType {
    fn name(&self) -> String {
        match self {
            AIType::Random => "Random".to_string(),
            AIType::Heuristic => "Heuristic".to_string(),
            AIType::Expectiminimax(depth) => format!("EMM-{}", depth),
            AIType::ML => "ML".to_string(),
        }
    }

    fn short_name(&self) -> String {
        match self {
            AIType::Random => "R".to_string(),
            AIType::Heuristic => "H".to_string(),
            AIType::Expectiminimax(depth) => format!("E{}", depth),
            AIType::ML => "M".to_string(),
        }
    }
}

#[test]
fn test_comprehensive_ai_matrix_fixed() {
    println!("🤖 FIXED COMPREHENSIVE AI MATRIX ANALYSIS");
    println!("{}", "=".repeat(80));
    println!("Testing all AI types against each other with proper isolation");
    println!("Games per matchup: {}", GAMES_PER_MATCHUP);
    println!();

    let ai_types = vec![
        AIType::Random,
        AIType::Heuristic,
        AIType::Expectiminimax(1),
        AIType::Expectiminimax(2),
        AIType::Expectiminimax(3),
        AIType::ML,
    ];

    let mut results = Vec::new();

    // Test each AI against every other AI
    for i in 0..ai_types.len() {
        for j in (i + 1)..ai_types.len() {
            let ai1 = &ai_types[i];
            let ai2 = &ai_types[j];

            println!(
                "🔍 Testing {} vs {} ({} games)",
                ai1.name(),
                ai2.name(),
                GAMES_PER_MATCHUP
            );
            println!("{}", "-".repeat(60));

            let mut result = MatrixResult::new(&ai1.name(), &ai2.name());
            let mut ai1_total_time = 0;
            let mut ai2_total_time = 0;

            for game in 0..GAMES_PER_MATCHUP {
                // Use consistent random seed for each game to ensure fair comparison
                let game_seed = game as u64;
                let (winner, moves, time1, time2) =
                    play_game_ai_vs_ai_fixed(ai1, ai2, game % 2 == 0, game_seed);

                if winner == Player::Player1 {
                    result.ai1_wins += 1;
                } else {
                    result.ai2_wins += 1;
                }

                result.total_moves += moves;
                ai1_total_time += time1;
                ai2_total_time += time2;

                if (game + 1) % 10 == 0 {
                    println!(
                        "  Game {}: {} wins: {}, {} wins: {}",
                        game + 1,
                        ai1.name(),
                        result.ai1_wins,
                        ai2.name(),
                        result.ai2_wins
                    );
                }
            }

            result.avg_moves = result.total_moves as f64 / GAMES_PER_MATCHUP as f64;
            result.ai1_avg_time_ms = ai1_total_time as f64 / GAMES_PER_MATCHUP as f64;
            result.ai2_avg_time_ms = ai2_total_time as f64 / GAMES_PER_MATCHUP as f64;

            println!("  Results:");
            println!(
                "    {} wins: {} ({:.1}%)",
                ai1.name(),
                result.ai1_wins,
                result.ai1_win_rate()
            );
            println!(
                "    {} wins: {} ({:.1}%)",
                ai2.name(),
                result.ai2_wins,
                result.ai2_win_rate()
            );
            println!("    Average moves: {:.1}", result.avg_moves);
            println!(
                "    {} avg time: {:.1}ms",
                ai1.name(),
                result.ai1_avg_time_ms
            );
            println!(
                "    {} avg time: {:.1}ms",
                ai2.name(),
                result.ai2_avg_time_ms
            );
            println!();

            results.push(result);
        }
    }

    // Print comprehensive matrix
    print_comprehensive_matrix(&ai_types, &results);

    // Print detailed analysis
    print_detailed_analysis(&ai_types, &results);

    // Print recommendations
    print_recommendations(&ai_types, &results);
}

fn play_game_ai_vs_ai_fixed(
    ai1: &AIType,
    ai2: &AIType,
    ai1_plays_first: bool,
    game_seed: u64,
) -> (Player, usize, u64, u64) {
    let mut game_state = GameState::new();
    let mut moves_played = 0;
    let max_moves = 200;
    let mut ai1_total_time_ms = 0;
    let mut ai2_total_time_ms = 0;

    // Create fresh AI instances for each game to avoid transposition table interference
    let mut ai1_instance = create_ai_instance(ai1);
    let mut ai2_instance = create_ai_instance(ai2);

    // Use seeded random number generator for consistent dice rolls
    let mut rng = rand::rngs::StdRng::seed_from_u64(game_seed);

    loop {
        let current_player = game_state.current_player;
        let is_ai1_turn = (current_player == Player::Player1) == ai1_plays_first;

        // Use seeded dice roll
        game_state.dice_roll = dice::roll_dice_with_rng(&mut rng);

        if game_state.dice_roll == 0 {
            game_state.current_player = game_state.current_player.opponent();
            continue;
        }

        let start_time = std::time::Instant::now();
        let best_move = if is_ai1_turn {
            get_ai_move_fixed(&mut ai1_instance, ai1, &game_state)
        } else {
            get_ai_move_fixed(&mut ai2_instance, ai2, &game_state)
        };
        let end_time = std::time::Instant::now();
        let move_time = end_time.duration_since(start_time).as_millis() as u64;

        if is_ai1_turn {
            ai1_total_time_ms += move_time;
        } else {
            ai2_total_time_ms += move_time;
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
                    if p1_finished == PIECES_PER_PLAYER {
                        return (
                            Player::Player1,
                            moves_played,
                            ai1_total_time_ms,
                            ai2_total_time_ms,
                        );
                    } else {
                        return (
                            Player::Player2,
                            moves_played,
                            ai1_total_time_ms,
                            ai2_total_time_ms,
                        );
                    }
                }
            }
        } else {
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

            let winner = if p1_finished > p2_finished {
                Player::Player1
            } else if p2_finished > p1_finished {
                Player::Player2
            } else {
                game_state.current_player
            };

            return (winner, moves_played, ai1_total_time_ms, ai2_total_time_ms);
        }
    }
}

// Create a fresh AI instance for each game
fn create_ai_instance(ai_type: &AIType) -> AIInstance {
    match ai_type {
        AIType::Random => AIInstance::Random,
        AIType::Heuristic => AIInstance::Heuristic(HeuristicAI::new()),
        AIType::Expectiminimax(depth) => AIInstance::Expectiminimax(AI::new(), *depth),
        AIType::ML => AIInstance::ML(MLAI::new()),
    }
}

// Enum to hold different AI instances
enum AIInstance {
    Random,
    Heuristic(HeuristicAI),
    Expectiminimax(AI, u8),
    ML(MLAI),
}

fn get_ai_move_fixed(
    ai_instance: &mut AIInstance,
    _ai_type: &AIType,
    game_state: &GameState,
) -> Option<u8> {
    match ai_instance {
        AIInstance::Random => {
            let valid_moves = game_state.get_valid_moves();
            if valid_moves.is_empty() {
                None
            } else {
                Some(valid_moves[rand::thread_rng().gen_range(0..valid_moves.len())])
            }
        }
        AIInstance::Heuristic(heuristic_ai) => {
            let (move_option, _) = heuristic_ai.get_best_move(game_state);
            move_option
        }
        AIInstance::Expectiminimax(ai, depth) => {
            let (move_option, _) = ai.get_best_move(game_state, *depth);
            move_option
        }
        AIInstance::ML(ml_ai) => {
            let response = ml_ai.get_best_move(game_state);
            response.r#move
        }
    }
}

fn print_comprehensive_matrix(ai_types: &[AIType], results: &[MatrixResult]) {
    println!("{}", "=".repeat(80));
    println!("📊 FIXED COMPREHENSIVE AI MATRIX");
    println!("{}", "=".repeat(80));
    println!("Win rates (%) - Row AI vs Column AI");
    println!();

    // Print header
    print!("{:<12}", "AI Type");
    for ai in ai_types {
        print!("{:<8}", ai.short_name());
    }
    println!();
    println!("{}", "-".repeat(12 + ai_types.len() * 8));

    // Print matrix
    for (i, ai1) in ai_types.iter().enumerate() {
        print!("{:<12}", ai1.name());

        for (j, ai2) in ai_types.iter().enumerate() {
            if i == j {
                print!("{:<8}", "-");
            } else if i < j {
                // Find result for ai1 vs ai2
                if let Some(result) = results.iter().find(|r| {
                    (r.ai1 == ai1.name() && r.ai2 == ai2.name())
                        || (r.ai1 == ai2.name() && r.ai2 == ai1.name())
                }) {
                    let win_rate = if result.ai1 == ai1.name() {
                        result.ai1_win_rate()
                    } else {
                        result.ai2_win_rate()
                    };
                    print!("{:<8.1}", win_rate);
                } else {
                    print!("{:<8}", "N/A");
                }
            } else {
                // Find result for ai2 vs ai1 (inverse)
                if let Some(result) = results.iter().find(|r| {
                    (r.ai1 == ai2.name() && r.ai2 == ai1.name())
                        || (r.ai1 == ai1.name() && r.ai2 == ai2.name())
                }) {
                    let win_rate = if result.ai1 == ai2.name() {
                        result.ai1_win_rate()
                    } else {
                        result.ai2_win_rate()
                    };
                    print!("{:<8.1}", win_rate);
                } else {
                    print!("{:<8}", "N/A");
                }
            }
        }
        println!();
    }
    println!();
}

fn print_detailed_analysis(ai_types: &[AIType], results: &[MatrixResult]) {
    println!("📈 DETAILED ANALYSIS");
    println!("{}", "-".repeat(40));

    // Calculate overall performance for each AI
    let mut ai_performance = Vec::new();

    for ai in ai_types {
        let mut total_wins = 0;
        let mut total_games = 0;
        let mut total_time = 0.0;

        for result in results {
            if result.ai1 == ai.name() {
                total_wins += result.ai1_wins;
                total_games += GAMES_PER_MATCHUP;
                total_time += result.ai1_avg_time_ms * GAMES_PER_MATCHUP as f64;
            } else if result.ai2 == ai.name() {
                total_wins += result.ai2_wins;
                total_games += GAMES_PER_MATCHUP;
                total_time += result.ai2_avg_time_ms * GAMES_PER_MATCHUP as f64;
            }
        }

        let win_rate = if total_games > 0 {
            (total_wins as f64 / total_games as f64) * 100.0
        } else {
            0.0
        };

        let avg_time = if total_games > 0 {
            total_time / total_games as f64
        } else {
            0.0
        };

        ai_performance.push((ai.clone(), win_rate, avg_time));
    }

    // Sort by win rate
    ai_performance.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    println!("🏆 AI RANKING BY WIN RATE:");
    println!(
        "{:<15} {:<12} {:<15}",
        "AI Type", "Win Rate", "Avg Time/move"
    );
    println!("{}", "-".repeat(45));

    for (ai, win_rate, avg_time) in &ai_performance {
        println!("{:<15} {:<12.1}% {:<15.1}ms", ai.name(), win_rate, avg_time);
    }
    println!();

    // Performance analysis
    println!("⚡ PERFORMANCE ANALYSIS:");
    println!("{}", "-".repeat(30));

    for (ai, win_rate, avg_time) in &ai_performance {
        let strength = if *win_rate > 80.0 {
            "Exceptional"
        } else if *win_rate > 60.0 {
            "Strong"
        } else if *win_rate > 40.0 {
            "Moderate"
        } else if *win_rate > 20.0 {
            "Weak"
        } else {
            "Very Weak"
        };

        let speed = if *avg_time < 1.0 {
            "Very Fast"
        } else if *avg_time < 10.0 {
            "Fast"
        } else if *avg_time < 50.0 {
            "Moderate"
        } else {
            "Slow"
        };

        println!("{}: {} strength, {} speed", ai.name(), strength, speed);
    }
    println!();
}

fn print_recommendations(ai_types: &[AIType], results: &[MatrixResult]) {
    println!("🎯 RECOMMENDATIONS");
    println!("{}", "-".repeat(25));

    // Find best performing AI
    let mut best_ai = None;
    let mut best_win_rate = 0.0;

    for ai in ai_types {
        let mut total_wins = 0;
        let mut total_games = 0;

        for result in results {
            if result.ai1 == ai.name() {
                total_wins += result.ai1_wins;
                total_games += GAMES_PER_MATCHUP;
            } else if result.ai2 == ai.name() {
                total_wins += result.ai2_wins;
                total_games += GAMES_PER_MATCHUP;
            }
        }

        let win_rate = if total_games > 0 {
            (total_wins as f64 / total_games as f64) * 100.0
        } else {
            0.0
        };

        if win_rate > best_win_rate {
            best_win_rate = win_rate;
            best_ai = Some(ai.clone());
        }
    }

    if let Some(best) = best_ai {
        println!(
            "🏆 Best Overall AI: {} ({:.1}% win rate)",
            best.name(),
            best_win_rate
        );
    }

    println!();
    println!("📋 USE CASE RECOMMENDATIONS:");
    println!("{}", "-".repeat(35));
    println!("• Production Gameplay: Expectiminimax Depth 3");
    println!("• Fast Casual Play: Expectiminimax Depth 2");
    println!("• Maximum Strength: Expectiminimax Depth 3 (best balance)");
    println!("• Educational: Heuristic AI (shows importance of depth search)");
    println!("• Baseline Testing: Random AI");
    println!("• Research: ML AI (for comparison and improvement)");

    println!();
    println!("💡 KEY INSIGHTS:");
    println!("{}", "-".repeat(20));
    println!("• Depth search is crucial for strong play");
    println!("• Even Depth 1 significantly outperforms heuristic approach");
    println!("• ML AI shows competitive performance");
    println!("• Speed vs strength trade-off is significant");
    println!("• Expectiminimax provides best overall performance");
}

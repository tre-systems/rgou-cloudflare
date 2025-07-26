use rgou_ai_core::{dice, GameState, Player, AI, PIECES_PER_PLAYER};
use rgou_ai_core::{ml_ai::MLAI, GameState as MLGameState, Player as MLPlayer};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::time::{Duration, Instant};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CoordinatedTestResult {
    pub test_name: String,
    pub timestamp: String,
    pub num_games: usize,
    pub duration_seconds: f64,
    pub ai_results: HashMap<String, AIPerformance>,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AIPerformance {
    pub wins: usize,
    pub losses: usize,
    pub total_games: usize,
    pub win_rate: f64,
    pub avg_time_per_move_ms: f64,
    pub total_moves: usize,
    pub total_time_ms: u64,
}

#[derive(Debug, Clone)]
pub struct GameResult {
    pub winner: Player,
    pub moves_played: usize,
    pub ai1_was_player1: bool,
    pub p1_finished_pieces: usize,
    pub p2_finished_pieces: usize,
    pub ai1_total_time_ms: u64,
    pub ai2_total_time_ms: u64,
    pub ai1_moves: usize,
    pub ai2_moves: usize,
}

pub trait AITestPlayer {
    fn name(&self) -> &str;
    fn get_move(&mut self, game_state: &GameState) -> Option<u8>;
    fn reset(&mut self);
}

pub struct ExpectiminimaxPlayer {
    ai: AI,
    depth: u8,
}

impl ExpectiminimaxPlayer {
    pub fn new(depth: u8) -> Self {
        Self {
            ai: AI::new(),
            depth,
        }
    }
}

impl AITestPlayer for ExpectiminimaxPlayer {
    fn name(&self) -> &str {
        match self.depth {
            1 => "EMM-Depth1",
            2 => "EMM-Depth2",
            3 => "EMM-Depth3",
            4 => "EMM-Depth4",
            _ => "EMM-Unknown",
        }
    }

    fn get_move(&mut self, game_state: &GameState) -> Option<u8> {
        let (best_move, _) = self.ai.get_best_move(game_state, self.depth);
        best_move
    }

    fn reset(&mut self) {
        self.ai.clear_transposition_table();
    }
}

pub struct HeuristicPlayer {
    ai: rgou_ai_core::HeuristicAI,
}

impl HeuristicPlayer {
    pub fn new() -> Self {
        Self {
            ai: rgou_ai_core::HeuristicAI::new(),
        }
    }
}

impl AITestPlayer for HeuristicPlayer {
    fn name(&self) -> &str {
        "Heuristic"
    }

    fn get_move(&mut self, game_state: &GameState) -> Option<u8> {
        let (best_move, _) = self.ai.get_best_move(game_state);
        best_move
    }

    fn reset(&mut self) {
        // Heuristic AI doesn't need reset
    }
}

pub struct RandomPlayer;

impl AITestPlayer for RandomPlayer {
    fn name(&self) -> &str {
        "Random"
    }

    fn get_move(&mut self, game_state: &GameState) -> Option<u8> {
        let valid_moves = game_state.get_valid_moves();
        if valid_moves.is_empty() {
            None
        } else {
            let random_index = (rand::random::<usize>() % valid_moves.len()) as usize;
            Some(valid_moves[random_index])
        }
    }

    fn reset(&mut self) {
        // Random AI doesn't need reset
    }
}

pub struct CoordinatedAITester {
    num_games: usize,
    players: Vec<Box<dyn AITestPlayer>>,
}

impl CoordinatedAITester {
    pub fn new(num_games: usize) -> Self {
        Self {
            num_games,
            players: Vec::new(),
        }
    }

    pub fn add_expectiminimax_players(&mut self) {
        let depths = vec![1, 2, 3];
        for depth in depths {
            self.players
                .push(Box::new(ExpectiminimaxPlayer::new(depth)));
        }
    }

    pub fn add_baseline_players(&mut self) {
        self.players.push(Box::new(HeuristicPlayer::new()));
        self.players.push(Box::new(RandomPlayer));
    }

    pub fn run_coordinated_test(
        &mut self,
    ) -> Result<CoordinatedTestResult, Box<dyn std::error::Error>> {
        println!("🤖 Coordinated AI Test Suite");
        println!("{}", "=".repeat(50));

        if self.players.is_empty() {
            return Err("No AI players configured".into());
        }

        let start_time = Instant::now();
        let timestamp = chrono::Utc::now().to_rfc3339();

        let mut results = HashMap::new();

        // Initialize performance tracking for each AI
        for player in &self.players {
            results.insert(
                player.name().to_string(),
                AIPerformance {
                    wins: 0,
                    losses: 0,
                    total_games: 0,
                    win_rate: 0.0,
                    avg_time_per_move_ms: 0.0,
                    total_moves: 0,
                    total_time_ms: 0,
                },
            );
        }

        // Run head-to-head matches
        for i in 0..self.players.len() {
            for j in (i + 1)..self.players.len() {
                let ai1_name = self.players[i].name().to_string();
                let ai2_name = self.players[j].name().to_string();

                println!("\n🏆 Testing {} vs {}", ai1_name, ai2_name);

                let (ai1_wins, ai2_wins, ai1_time, ai2_time, ai1_moves, ai2_moves) =
                    self.run_head_to_head_match(i, j)?;

                // Update overall statistics
                if let Some(ai1_perf) = results.get_mut(&ai1_name) {
                    ai1_perf.wins += ai1_wins;
                    ai1_perf.losses += ai2_wins;
                    ai1_perf.total_games += self.num_games;
                    ai1_perf.total_time_ms += ai1_time;
                    ai1_perf.total_moves += ai1_moves;
                }

                if let Some(ai2_perf) = results.get_mut(&ai2_name) {
                    ai2_perf.wins += ai2_wins;
                    ai2_perf.losses += ai1_wins;
                    ai2_perf.total_games += self.num_games;
                    ai2_perf.total_time_ms += ai2_time;
                    ai2_perf.total_moves += ai2_moves;
                }
            }
        }

        // Calculate final statistics
        for (name, performance) in &mut results {
            if performance.total_games > 0 {
                performance.win_rate =
                    (performance.wins as f64 / performance.total_games as f64) * 100.0;
                performance.avg_time_per_move_ms = if performance.total_moves > 0 {
                    performance.total_time_ms as f64 / performance.total_moves as f64
                } else {
                    0.0
                };
            }
        }

        let duration = start_time.elapsed();
        let recommendations = self.generate_recommendations(&results);

        let test_result = CoordinatedTestResult {
            test_name: "Coordinated AI Test".to_string(),
            timestamp,
            num_games: self.num_games,
            duration_seconds: duration.as_secs_f64(),
            ai_results: results,
            recommendations,
        };

        // Print results
        self.print_results(&test_result);

        Ok(test_result)
    }

    fn run_head_to_head_match(
        &mut self,
        ai1_index: usize,
        ai2_index: usize,
    ) -> Result<(usize, usize, u64, u64, usize, usize), Box<dyn std::error::Error>> {
        let mut ai1_wins = 0;
        let mut ai2_wins = 0;
        let mut ai1_total_time = 0;
        let mut ai2_total_time = 0;
        let mut ai1_total_moves = 0;
        let mut ai2_total_moves = 0;

        for game_num in 0..self.num_games {
            let ai1_plays_first = game_num % 2 == 0;
            let result = self.play_single_game(ai1_index, ai2_index, ai1_plays_first)?;

            let ai1_won = if result.ai1_was_player1 {
                result.winner == Player::Player1
            } else {
                result.winner == Player::Player2
            };

            if ai1_won {
                ai1_wins += 1;
            } else {
                ai2_wins += 1;
            }

            if result.ai1_was_player1 {
                ai1_total_time += result.ai1_total_time_ms;
                ai2_total_time += result.ai2_total_time_ms;
                ai1_total_moves += result.ai1_moves;
                ai2_total_moves += result.ai2_moves;
            } else {
                ai1_total_time += result.ai2_total_time_ms;
                ai2_total_time += result.ai1_total_time_ms;
                ai1_total_moves += result.ai2_moves;
                ai2_total_moves += result.ai1_moves;
            }

            // Reset AI state periodically
            if (game_num + 1) % 20 == 0 {
                self.players[ai1_index].reset();
                self.players[ai2_index].reset();
            }
        }

        Ok((
            ai1_wins,
            ai2_wins,
            ai1_total_time,
            ai2_total_time,
            ai1_total_moves,
            ai2_total_moves,
        ))
    }

    fn play_single_game(
        &mut self,
        ai1_index: usize,
        ai2_index: usize,
        ai1_plays_first: bool,
    ) -> Result<GameResult, Box<dyn std::error::Error>> {
        let mut game_state = GameState::new();
        let mut moves_played = 0;
        let max_moves = 200;
        let mut ai1_total_time = 0;
        let mut ai2_total_time = 0;
        let mut ai1_moves = 0;
        let mut ai2_moves = 0;

        while !game_state.is_game_over() && moves_played < max_moves {
            let current_player = game_state.current_player;
            let is_ai1_turn = (current_player == Player::Player1) == ai1_plays_first;
            let current_ai_index = if is_ai1_turn { ai1_index } else { ai2_index };

            game_state.dice_roll = dice::roll_dice();

            if game_state.dice_roll == 0 {
                game_state.current_player = game_state.current_player.opponent();
                continue;
            }

            let start_time = Instant::now();
            let best_move = self.players[current_ai_index].get_move(&game_state);
            let end_time = Instant::now();
            let move_time = end_time.duration_since(start_time).as_millis() as u64;

            if is_ai1_turn {
                ai1_total_time += move_time;
                ai1_moves += 1;
            } else {
                ai2_total_time += move_time;
                ai2_moves += 1;
            }

            if let Some(move_piece) = best_move {
                game_state.make_move(move_piece)?;
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

        let winner = if p1_finished >= 7 {
            Player::Player1
        } else if p2_finished >= 7 {
            Player::Player2
        } else {
            // Game ended by move limit, evaluate final position
            let evaluation = game_state.evaluate();
            if evaluation > 0 {
                Player::Player1
            } else if evaluation < 0 {
                Player::Player2
            } else {
                // Draw
                Player::Player1 // Arbitrary choice for draw
            }
        };

        Ok(GameResult {
            winner,
            moves_played,
            ai1_was_player1: ai1_plays_first,
            p1_finished_pieces: p1_finished,
            p2_finished_pieces: p2_finished,
            ai1_total_time_ms: ai1_total_time,
            ai2_total_time_ms: ai2_total_time,
            ai1_moves,
            ai2_moves,
        })
    }

    fn generate_recommendations(&self, results: &HashMap<String, AIPerformance>) -> Vec<String> {
        let mut recommendations = Vec::new();

        // Find best performing AI
        let best_performing = results
            .iter()
            .max_by(|a, b| {
                a.1.win_rate
                    .partial_cmp(&b.1.win_rate)
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
            .map(|(name, _)| name);

        if let Some(best) = best_performing {
            if let Some(perf) = results.get(best) {
                if perf.win_rate > 70.0 {
                    recommendations.push(format!(
                        "{} shows excellent performance and is ready for production",
                        best
                    ));
                } else if perf.win_rate > 60.0 {
                    recommendations.push(format!(
                        "{} shows good performance and could be used in production",
                        best
                    ));
                } else {
                    recommendations.push(format!(
                        "{} shows moderate performance, consider further training",
                        best
                    ));
                }
            }
        }

        // Find fastest AI
        let fastest = results
            .iter()
            .min_by(|a, b| {
                a.1.avg_time_per_move_ms
                    .partial_cmp(&b.1.avg_time_per_move_ms)
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
            .map(|(name, _)| name);

        if let Some(fastest) = fastest {
            if let Some(perf) = results.get(fastest) {
                if perf.avg_time_per_move_ms < 1.0 {
                    recommendations.push(format!(
                        "{} is very fast and suitable for real-time play",
                        fastest
                    ));
                }
            }
        }

        recommendations
    }

    fn print_results(&self, test_result: &CoordinatedTestResult) {
        println!("\n📊 Coordinated Test Results");
        println!("{}", "=".repeat(40));
        println!("Test: {}", test_result.test_name);
        println!("Timestamp: {}", test_result.timestamp);
        println!("Games per match: {}", test_result.num_games);
        println!("Duration: {:.2} seconds", test_result.duration_seconds);

        println!("\n🏆 AI Performance Rankings");
        println!("{}", "=".repeat(30));
        let mut rankings: Vec<_> = test_result.ai_results.iter().collect();
        rankings.sort_by(|a, b| {
            b.1.win_rate
                .partial_cmp(&a.1.win_rate)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        for (i, (name, perf)) in rankings.iter().enumerate() {
            println!(
                "{}. {}: {:.1}% win rate, {:.1}ms/move",
                i + 1,
                name,
                perf.win_rate,
                perf.avg_time_per_move_ms
            );
        }

        println!("\n💡 Recommendations");
        println!("{}", "=".repeat(15));
        for recommendation in &test_result.recommendations {
            println!("• {}", recommendation);
        }
    }
}

#[test]
fn test_coordinated_ai_evaluation() {
    println!("🤖 Coordinated AI Evaluation Test");
    println!("{}", "=".repeat(50));

    let num_games = std::env::var("NUM_GAMES")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(10);

    let mut tester = CoordinatedAITester::new(num_games);

    // Add AI players
    tester.add_expectiminimax_players();
    tester.add_baseline_players();

    // Run the coordinated test
    match tester.run_coordinated_test() {
        Ok(result) => {
            println!("\n🎉 Coordinated AI test completed successfully!");

            // Validate results
            assert!(
                result.ai_results.len() >= 2,
                "Need at least 2 AI players for meaningful comparison"
            );
            assert!(
                !result.recommendations.is_empty(),
                "Should have recommendations"
            );

            println!("✅ Test validation passed");
        }
        Err(e) => {
            eprintln!("❌ Coordinated AI test failed: {}", e);
            panic!("Test failed: {}", e);
        }
    }
}

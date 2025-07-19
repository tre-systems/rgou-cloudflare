use rand::Rng;
use serde_json;
use std::fs;
use std::path::Path;

// This would be the actual struct from the crate, but for this example we'll define it locally
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct GeneticParams {
    win_score: i32,
    finished_piece_value: i32,
    position_weight: i32,
    safety_bonus: i32,
    rosette_control_bonus: i32,
    advancement_bonus: i32,
    capture_bonus: i32,
    center_lane_bonus: i32,
}

impl Default for GeneticParams {
    fn default() -> Self {
        Self {
            win_score: 10000,
            finished_piece_value: 1000,
            position_weight: 15,
            safety_bonus: 25,
            rosette_control_bonus: 40,
            advancement_bonus: 5,
            capture_bonus: 35,
            center_lane_bonus: 2,
        }
    }
}

impl GeneticParams {
    fn random_mutation(&self, mutation_rate: f64, mutation_strength: f64) -> Self {
        use rand::Rng;
        let mut rng = rand::thread_rng();

        Self {
            win_score: if rng.gen_bool(mutation_rate) {
                self.win_score + (rng.gen_range(-2000.0..2000.0) * mutation_strength) as i32
            } else {
                self.win_score
            },
            finished_piece_value: if rng.gen_bool(mutation_rate) {
                self.finished_piece_value
                    + (rng.gen_range(-200.0..200.0) * mutation_strength) as i32
            } else {
                self.finished_piece_value
            },
            position_weight: if rng.gen_bool(mutation_rate) {
                self.position_weight + (rng.gen_range(-10.0..10.0) * mutation_strength) as i32
            } else {
                self.position_weight
            },
            safety_bonus: if rng.gen_bool(mutation_rate) {
                self.safety_bonus + (rng.gen_range(-20.0..20.0) * mutation_strength) as i32
            } else {
                self.safety_bonus
            },
            rosette_control_bonus: if rng.gen_bool(mutation_rate) {
                self.rosette_control_bonus + (rng.gen_range(-40.0..40.0) * mutation_strength) as i32
            } else {
                self.rosette_control_bonus
            },
            advancement_bonus: if rng.gen_bool(mutation_rate) {
                self.advancement_bonus + (rng.gen_range(-8.0..8.0) * mutation_strength) as i32
            } else {
                self.advancement_bonus
            },
            capture_bonus: if rng.gen_bool(mutation_rate) {
                self.capture_bonus + (rng.gen_range(-20.0..20.0) * mutation_strength) as i32
            } else {
                self.capture_bonus
            },
            center_lane_bonus: if rng.gen_bool(mutation_rate) {
                self.center_lane_bonus + (rng.gen_range(-5.0..5.0) * mutation_strength) as i32
            } else {
                self.center_lane_bonus
            },
        }
    }

    fn crossover(&self, other: &Self, crossover_rate: f64) -> Self {
        use rand::Rng;
        let mut rng = rand::thread_rng();

        Self {
            win_score: if rng.gen_bool(crossover_rate) {
                other.win_score
            } else {
                self.win_score
            },
            finished_piece_value: if rng.gen_bool(crossover_rate) {
                other.finished_piece_value
            } else {
                self.finished_piece_value
            },
            position_weight: if rng.gen_bool(crossover_rate) {
                other.position_weight
            } else {
                self.position_weight
            },
            safety_bonus: if rng.gen_bool(crossover_rate) {
                other.safety_bonus
            } else {
                self.safety_bonus
            },
            rosette_control_bonus: if rng.gen_bool(crossover_rate) {
                other.rosette_control_bonus
            } else {
                self.rosette_control_bonus
            },
            advancement_bonus: if rng.gen_bool(crossover_rate) {
                other.advancement_bonus
            } else {
                self.advancement_bonus
            },
            capture_bonus: if rng.gen_bool(crossover_rate) {
                other.capture_bonus
            } else {
                self.capture_bonus
            },
            center_lane_bonus: if rng.gen_bool(crossover_rate) {
                other.center_lane_bonus
            } else {
                self.center_lane_bonus
            },
        }
    }

    fn save_to_file<P: AsRef<Path>>(&self, path: P) -> Result<(), Box<dyn std::error::Error>> {
        let content = serde_json::to_string_pretty(self)?;
        fs::write(path, content)?;
        Ok(())
    }
}

// Simple game state simulation for fitness evaluation
#[derive(Debug, Clone)]
struct SimpleGameState {
    p1_finished: i32,
    p2_finished: i32,
    p1_on_board: i32,
    p2_on_board: i32,
    p1_position_score: i32,
    p2_position_score: i32,
    p1_strategic_score: i32,
    p2_strategic_score: i32,
    rosette_control: i32, // positive for p2, negative for p1
    current_player: i32,  // 0 for p1, 1 for p2
}

impl SimpleGameState {
    fn new() -> Self {
        Self {
            p1_finished: 0,
            p2_finished: 0,
            p1_on_board: 0,
            p2_on_board: 0,
            p1_position_score: 0,
            p2_position_score: 0,
            p1_strategic_score: 0,
            p2_strategic_score: 0,
            rosette_control: 0,
            current_player: 0,
        }
    }

    fn evaluate(&self, params: &GeneticParams) -> i32 {
        if self.p1_finished >= 7 {
            return -params.win_score;
        }
        if self.p2_finished >= 7 {
            return params.win_score;
        }

        let mut score = (self.p2_finished - self.p1_finished) * params.finished_piece_value;
        score += (self.p2_on_board - self.p1_on_board) * params.capture_bonus;
        score += (self.p2_position_score - self.p1_position_score) * params.position_weight / 10;
        score += self.p2_strategic_score - self.p1_strategic_score;
        score += self.rosette_control * params.rosette_control_bonus;
        score
    }

    fn simulate_move(&mut self, params: &GeneticParams) {
        let mut rng = rand::thread_rng();

        // Simulate a move that could happen in a real game
        if self.current_player == 0 {
            // Player 1
            // 30% chance to finish a piece
            if rng.gen_bool(0.3) && self.p1_on_board > 0 {
                self.p1_on_board -= 1;
                self.p1_finished += 1;
            }
            // 40% chance to advance position
            else if rng.gen_bool(0.4) {
                self.p1_position_score += rng.gen_range(1..5);
                if rng.gen_bool(0.2) {
                    // 20% chance for strategic bonus
                    self.p1_strategic_score += params.safety_bonus;
                }
            }
            // 30% chance to capture
            else if rng.gen_bool(0.3) && self.p2_on_board > 0 {
                self.p2_on_board -= 1;
                self.p1_strategic_score += params.capture_bonus;
            }
        } else {
            // Player 2
            // 30% chance to finish a piece
            if rng.gen_bool(0.3) && self.p2_on_board > 0 {
                self.p2_on_board -= 1;
                self.p2_finished += 1;
            }
            // 40% chance to advance position
            else if rng.gen_bool(0.4) {
                self.p2_position_score += rng.gen_range(1..5);
                if rng.gen_bool(0.2) {
                    // 20% chance for strategic bonus
                    self.p2_strategic_score += params.safety_bonus;
                }
            }
            // 30% chance to capture
            else if rng.gen_bool(0.3) && self.p1_on_board > 0 {
                self.p1_on_board -= 1;
                self.p2_strategic_score += params.capture_bonus;
            }
        }

        // Simulate rosette control changes
        if rng.gen_bool(0.1) {
            self.rosette_control += if self.current_player == 1 { 1 } else { -1 };
        }

        self.current_player = 1 - self.current_player; // Switch players
    }
}

#[derive(Debug, Clone)]
struct Individual {
    params: GeneticParams,
    fitness: f64,
}

impl Individual {
    fn new(params: GeneticParams) -> Self {
        Self {
            params,
            fitness: 0.0,
        }
    }

    fn evaluate_fitness(&mut self) {
        // Advanced fitness evaluation with scenario weighting
        let baseline_params = GeneticParams::default();
        let mut total_score = 0.0;
        let mut total_games = 0;

        // Scenario 1: Standard games (40% weight)
        let mut wins = 0;
        for _ in 0..40 {
            let mut game_state = SimpleGameState::new();
            let mut moves_played = 0;
            let max_moves = 100;

            while moves_played < max_moves
                && game_state.p1_finished < 7
                && game_state.p2_finished < 7
            {
                if game_state.current_player == 0 {
                    game_state.simulate_move(&baseline_params);
                } else {
                    game_state.simulate_move(&self.params);
                }
                moves_played += 1;
            }

            if game_state.p2_finished >= 7 {
                wins += 1;
            } else if game_state.p1_finished >= 7 {
                // Baseline wins
            } else {
                let final_score = game_state.evaluate(&self.params);
                if final_score > 0 {
                    wins += 1;
                }
            }
        }
        let standard_win_rate = wins as f64 / 40.0;
        total_score += standard_win_rate * 0.4; // 40% weight
        total_games += 40;

        // Scenario 2: Endgame scenarios (30% weight)
        wins = 0;
        for _ in 0..30 {
            let mut game_state = SimpleGameState::new();
            // Start with some pieces already finished
            game_state.p1_finished = 3;
            game_state.p2_finished = 3;
            game_state.p1_on_board = 2;
            game_state.p2_on_board = 2;

            let mut moves_played = 0;
            let max_moves = 50; // Shorter games for endgame

            while moves_played < max_moves
                && game_state.p1_finished < 7
                && game_state.p2_finished < 7
            {
                if game_state.current_player == 0 {
                    game_state.simulate_move(&baseline_params);
                } else {
                    game_state.simulate_move(&self.params);
                }
                moves_played += 1;
            }

            if game_state.p2_finished >= 7 {
                wins += 1;
            } else if game_state.p1_finished >= 7 {
                // Baseline wins
            } else {
                let final_score = game_state.evaluate(&self.params);
                if final_score > 0 {
                    wins += 1;
                }
            }
        }
        let endgame_win_rate = wins as f64 / 30.0;
        total_score += endgame_win_rate * 0.3; // 30% weight
        total_games += 30;

        // Scenario 3: Tactical scenarios (30% weight)
        wins = 0;
        for _ in 0..30 {
            let mut game_state = SimpleGameState::new();
            // Start with pieces in tactical positions
            game_state.p1_on_board = 3;
            game_state.p2_on_board = 3;
            game_state.p1_position_score = 20;
            game_state.p2_position_score = 20;

            let mut moves_played = 0;
            let max_moves = 80;

            while moves_played < max_moves
                && game_state.p1_finished < 7
                && game_state.p2_finished < 7
            {
                if game_state.current_player == 0 {
                    game_state.simulate_move(&baseline_params);
                } else {
                    game_state.simulate_move(&self.params);
                }
                moves_played += 1;
            }

            if game_state.p2_finished >= 7 {
                wins += 1;
            } else if game_state.p1_finished >= 7 {
                // Baseline wins
            } else {
                let final_score = game_state.evaluate(&self.params);
                if final_score > 0 {
                    wins += 1;
                }
            }
        }
        let tactical_win_rate = wins as f64 / 30.0;
        total_score += tactical_win_rate * 0.3; // 30% weight
        total_games += 30;

        // Add parameter validation bonus
        let mut validation_bonus = 0.0;
        if self.params.win_score > 5000 && self.params.win_score < 20000 {
            validation_bonus += 0.1;
        }
        if self.params.finished_piece_value > 500 && self.params.finished_piece_value < 2000 {
            validation_bonus += 0.1;
        }
        if self.params.position_weight > 5 && self.params.position_weight < 50 {
            validation_bonus += 0.1;
        }
        if self.params.safety_bonus > 10 && self.params.safety_bonus < 100 {
            validation_bonus += 0.1;
        }
        if self.params.rosette_control_bonus > 20 && self.params.rosette_control_bonus < 100 {
            validation_bonus += 0.1;
        }
        if self.params.advancement_bonus > 2 && self.params.advancement_bonus < 20 {
            validation_bonus += 0.1;
        }
        if self.params.capture_bonus > 20 && self.params.capture_bonus < 100 {
            validation_bonus += 0.1;
        }
        if self.params.center_lane_bonus > 1 && self.params.center_lane_bonus < 10 {
            validation_bonus += 0.1;
        }

        // Add bonus for balanced performance across scenarios
        let scenario_balance = (standard_win_rate + endgame_win_rate + tactical_win_rate) / 3.0;
        let balance_bonus = if scenario_balance > 0.45 {
            0.2 // Bonus for consistent performance
        } else {
            0.0
        };

        // Add bonus for parameter diversity
        let default = GeneticParams::default();
        let changes = [
            (self.params.win_score - default.win_score).abs(),
            (self.params.finished_piece_value - default.finished_piece_value).abs(),
            (self.params.position_weight - default.position_weight).abs(),
            (self.params.safety_bonus - default.safety_bonus).abs(),
            (self.params.rosette_control_bonus - default.rosette_control_bonus).abs(),
            (self.params.advancement_bonus - default.advancement_bonus).abs(),
            (self.params.capture_bonus - default.capture_bonus).abs(),
            (self.params.center_lane_bonus - default.center_lane_bonus).abs(),
        ];

        let total_change: i32 = changes.iter().sum();
        let diversity_bonus = if total_change > 200 {
            0.3 // Higher bonus for significant exploration
        } else if total_change > 100 {
            0.1
        } else {
            0.0
        };

        self.fitness = total_score + validation_bonus + balance_bonus + diversity_bonus;
    }
}

struct GeneticAlgorithm {
    population: Vec<Individual>,
    population_size: usize,
    mutation_rate: f64,
    mutation_strength: f64,
    crossover_rate: f64,
    elite_size: usize,
}

impl GeneticAlgorithm {
    fn new(population_size: usize) -> Self {
        let mut population = Vec::with_capacity(population_size);

        // Initialize with default parameters
        population.push(Individual::new(GeneticParams::default()));

        // Add random variations with more aggressive initial mutations
        for _ in 1..population_size {
            let base_params = GeneticParams::default();
            let mutated_params = base_params.random_mutation(0.8, 0.3); // Higher initial mutation
            population.push(Individual::new(mutated_params));
        }

        Self {
            population,
            population_size,
            mutation_rate: 0.2,     // Increased from 0.1
            mutation_strength: 0.2, // Increased from 0.1
            crossover_rate: 0.8,    // Increased from 0.7
            elite_size: 3,          // Increased from 2
        }
    }

    fn evaluate_population(&mut self) {
        for individual in &mut self.population {
            individual.evaluate_fitness();
        }
    }

    fn select_parents(&self) -> (&Individual, &Individual) {
        let mut rng = rand::thread_rng();

        // Tournament selection
        let tournament_size = 3;

        let parent1 = self.tournament_select(tournament_size, &mut rng);
        let parent2 = self.tournament_select(tournament_size, &mut rng);

        (parent1, parent2)
    }

    fn tournament_select<'a, R: rand::Rng>(
        &'a self,
        tournament_size: usize,
        rng: &mut R,
    ) -> &'a Individual {
        let mut best = &self.population[rng.gen_range(0..self.population.len())];

        for _ in 1..tournament_size {
            let candidate = &self.population[rng.gen_range(0..self.population.len())];
            if candidate.fitness > best.fitness {
                best = candidate;
            }
        }

        best
    }

    fn crossover(&self, parent1: &Individual, parent2: &Individual) -> Individual {
        let child_params = parent1
            .params
            .crossover(&parent2.params, self.crossover_rate);
        Individual::new(child_params)
    }

    fn mutate(&self, individual: &mut Individual) {
        individual.params = individual
            .params
            .random_mutation(self.mutation_rate, self.mutation_strength);
    }

    fn evolve(&mut self) {
        // Evaluate current population
        self.evaluate_population();

        // Sort by fitness (best first)
        self.population
            .sort_by(|a, b| b.fitness.partial_cmp(&a.fitness).unwrap());

        // Create new population
        let mut new_population = Vec::with_capacity(self.population_size);

        // Elitism: keep the best individuals
        for i in 0..self.elite_size {
            new_population.push(self.population[i].clone());
        }

        // Generate rest of population through crossover and mutation
        while new_population.len() < self.population_size {
            let (parent1, parent2) = self.select_parents();
            let mut child = self.crossover(parent1, parent2);
            self.mutate(&mut child);
            new_population.push(child);
        }

        self.population = new_population;
    }

    fn get_best_individual(&self) -> Option<&Individual> {
        self.population
            .iter()
            .max_by(|a, b| a.fitness.partial_cmp(&b.fitness).unwrap())
    }

    fn print_population_stats(&self) {
        let best = self.get_best_individual().unwrap();
        let avg_fitness: f64 =
            self.population.iter().map(|i| i.fitness).sum::<f64>() / self.population.len() as f64;

        println!("Best fitness: {:.3}", best.fitness);
        println!("Average fitness: {:.3}", avg_fitness);
        println!("Best params: {:?}", best.params);
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🎲 EMM Genetic Algorithm - OPTIMIZATION RUN");
    println!("{}", "=".repeat(60));

    let mut ga = GeneticAlgorithm::new(30); // Increased population size

    println!("Initial population:");
    ga.print_population_stats();
    println!();

    let generations = 20; // Increased from 10

    for generation in 1..=generations {
        println!("Generation {}", generation);
        println!("{}", "-".repeat(20));

        ga.evolve();
        ga.print_population_stats();
        println!();
    }

    // Save the best parameters
    if let Some(best) = ga.get_best_individual() {
        let output_path = "../data/genetic_params/evolved.json";
        best.params.save_to_file(output_path)?;
        println!("✅ Best parameters saved to {}", output_path);
        println!("🎯 Best fitness achieved: {:.3}", best.fitness);
    }

    Ok(())
}

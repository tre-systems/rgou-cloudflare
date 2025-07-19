use serde_json;
use std::fs;
use std::path::Path;
use rand::Rng;

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
                self.win_score + (rng.gen_range(-1000.0..1000.0) * mutation_strength) as i32
            } else {
                self.win_score
            },
            finished_piece_value: if rng.gen_bool(mutation_rate) {
                self.finished_piece_value
                    + (rng.gen_range(-100.0..100.0) * mutation_strength) as i32
            } else {
                self.finished_piece_value
            },
            position_weight: if rng.gen_bool(mutation_rate) {
                self.position_weight + (rng.gen_range(-5.0..5.0) * mutation_strength) as i32
            } else {
                self.position_weight
            },
            safety_bonus: if rng.gen_bool(mutation_rate) {
                self.safety_bonus + (rng.gen_range(-10.0..10.0) * mutation_strength) as i32
            } else {
                self.safety_bonus
            },
            rosette_control_bonus: if rng.gen_bool(mutation_rate) {
                self.rosette_control_bonus + (rng.gen_range(-20.0..20.0) * mutation_strength) as i32
            } else {
                self.rosette_control_bonus
            },
            advancement_bonus: if rng.gen_bool(mutation_rate) {
                self.advancement_bonus + (rng.gen_range(-3.0..3.0) * mutation_strength) as i32
            } else {
                self.advancement_bonus
            },
            capture_bonus: if rng.gen_bool(mutation_rate) {
                self.capture_bonus + (rng.gen_range(-10.0..10.0) * mutation_strength) as i32
            } else {
                self.capture_bonus
            },
            center_lane_bonus: if rng.gen_bool(mutation_rate) {
                self.center_lane_bonus + (rng.gen_range(-2.0..2.0) * mutation_strength) as i32
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
        // This is a placeholder fitness function
        // In a real implementation, you would:
        // 1. Create a GameState with these parameters
        // 2. Run games against a baseline AI
        // 3. Calculate win rate and performance metrics

        // For now, we'll use a simple heuristic based on parameter values
        let mut fitness = 0.0;

        // Prefer reasonable parameter ranges
        if self.params.win_score > 0 && self.params.win_score < 50000 {
            fitness += 1.0;
        }
        if self.params.finished_piece_value > 0 && self.params.finished_piece_value < 5000 {
            fitness += 1.0;
        }
        if self.params.position_weight > 0 && self.params.position_weight < 100 {
            fitness += 1.0;
        }
        if self.params.safety_bonus > 0 && self.params.safety_bonus < 200 {
            fitness += 1.0;
        }
        if self.params.rosette_control_bonus > 0 && self.params.rosette_control_bonus < 200 {
            fitness += 1.0;
        }
        if self.params.advancement_bonus > 0 && self.params.advancement_bonus < 50 {
            fitness += 1.0;
        }
        if self.params.capture_bonus > 0 && self.params.capture_bonus < 200 {
            fitness += 1.0;
        }
        if self.params.center_lane_bonus > 0 && self.params.center_lane_bonus < 20 {
            fitness += 1.0;
        }

        // Add some randomness to simulate actual game performance
        let mut rng = rand::thread_rng();
        fitness += rng.gen_range(0.0..2.0);

        self.fitness = fitness;
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

        // Add random variations
        for _ in 1..population_size {
            let base_params = GeneticParams::default();
            let mutated_params = base_params.random_mutation(0.5, 0.1);
            population.push(Individual::new(mutated_params));
        }

        Self {
            population,
            population_size,
            mutation_rate: 0.1,
            mutation_strength: 0.1,
            crossover_rate: 0.7,
            elite_size: 2,
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
    println!("🎲 EMM Genetic Algorithm");
    println!("{}", "=".repeat(50));

    let mut ga = GeneticAlgorithm::new(20);

    println!("Initial population:");
    ga.print_population_stats();
    println!();

    let generations = 10;

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
    }

    Ok(())
}

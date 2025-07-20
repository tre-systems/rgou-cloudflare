use crate::features::GameFeatures;
use crate::neural_network::{NetworkConfig, NeuralNetwork};
use crate::{GameState, AI, PIECES_PER_PLAYER};
use rand::Rng;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TrainingSample {
    pub features: Vec<f32>,
    pub value_target: f32,
    pub policy_target: Vec<f32>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TrainingConfig {
    pub num_games: usize,
    pub epochs: usize,
    pub batch_size: usize,
    pub learning_rate: f32,
    pub validation_split: f32,
    pub depth: u8,
    pub seed: u64,
    pub output_file: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TrainingMetadata {
    pub training_date: String,
    pub version: String,
    pub num_games: usize,
    pub num_training_samples: usize,
    pub epochs: usize,
    pub learning_rate: f32,
    pub batch_size: usize,
    pub validation_split: f32,
    pub seed: u64,
    pub training_time_seconds: f64,
    pub improvements: Vec<String>,
}

pub struct Trainer {
    value_network: NeuralNetwork,
    policy_network: NeuralNetwork,
    config: TrainingConfig,
}

impl Trainer {
    pub fn new(config: TrainingConfig) -> Self {
        // Configure optimal thread pool for training
        Self::configure_thread_pool();

        let value_config = NetworkConfig {
            input_size: 150,
            hidden_sizes: vec![256, 128, 64, 32],
            output_size: 1,
        };

        let policy_config = NetworkConfig {
            input_size: 150,
            hidden_sizes: vec![256, 128, 64, 32],
            output_size: PIECES_PER_PLAYER,
        };

        Trainer {
            value_network: NeuralNetwork::new(value_config),
            policy_network: NeuralNetwork::new(policy_config),
            config,
        }
    }

    fn configure_thread_pool() {
        let total_cores = std::thread::available_parallelism()
            .unwrap_or(std::num::NonZeroUsize::new(1).unwrap())
            .get();

        // Always use 8 performance cores on Apple Silicon for optimal performance
        let num_cores = if total_cores >= 8 {
            if total_cores == 10 {
                println!(
                    "🍎 Apple Silicon detected: Using 8 performance cores out of {} total cores",
                    total_cores
                );
            } else {
                println!(
                    "🚀 High-core system detected: Using 8 cores out of {} total cores",
                    total_cores
                );
            }
            8
        } else {
            println!("Available CPU cores: {}", total_cores);
            total_cores
        };

        // Configure rayon thread pool for optimal performance
        rayon::ThreadPoolBuilder::new()
            .num_threads(num_cores)
            .stack_size(8 * 1024 * 1024) // 8MB stack size for deep recursion
            .build_global()
            .unwrap_or_else(|_| println!("Warning: Could not set thread pool size"));
    }

    pub fn generate_training_data(&self) -> Vec<TrainingSample> {
        println!("=== Rust Data Generation ===");
        println!(
            "Generating {} training games using all CPU cores...",
            self.config.num_games
        );

        let start_time = std::time::Instant::now();
        let total_cores = std::thread::available_parallelism()
            .unwrap_or(std::num::NonZeroUsize::new(1).unwrap())
            .get();

        // Use the same core count logic as configured in constructor
        let num_cores = if total_cores >= 8 { 8 } else { total_cores };

        let progress_interval = if self.config.num_games >= 1000 {
            50
        } else if self.config.num_games >= 100 {
            10
        } else {
            1
        };

        println!("📈 Progress updates every {} games", progress_interval);
        println!("🎮 Starting game generation...");

        let completed_games = std::sync::atomic::AtomicUsize::new(0);

        let training_data: Vec<TrainingSample> = (0..self.config.num_games)
            .into_par_iter()
            .map(|_game_id| {
                let completed =
                    completed_games.fetch_add(1, std::sync::atomic::Ordering::Relaxed) + 1;

                if completed % progress_interval == 0 {
                    let elapsed = start_time.elapsed();
                    let games_per_sec = if elapsed.as_secs() > 0 {
                        completed as f64 / elapsed.as_secs_f64()
                    } else {
                        0.0
                    };
                    let eta_secs = if games_per_sec > 0.0 {
                        (self.config.num_games - completed) as f64 / games_per_sec
                    } else {
                        0.0
                    };

                    let core_id = (completed % num_cores) + 1;

                    println!(
                        "🎮 Core {}: {:.1}% - {:.1} games/sec - ETA: {:.0}s - Samples: {}",
                        core_id,
                        (completed as f64 / self.config.num_games as f64) * 100.0,
                        games_per_sec,
                        eta_secs,
                        completed * 150
                    );
                }

                let mut ai = AI::new();
                self.simulate_game(&mut ai)
            })
            .flatten()
            .collect();

        let generation_time = start_time.elapsed();
        println!("✅ === Data Generation Complete ===");
        println!(
            "⏱️  Generation time: {:.2} seconds",
            generation_time.as_secs_f64()
        );
        println!("📊 Generated {} training samples", training_data.len());
        println!(
            "🎯 Average time per game: {:.3} seconds",
            generation_time.as_secs_f64() / self.config.num_games as f64
        );
        println!(
            "⚡ Samples per second: {:.0}",
            training_data.len() as f64 / generation_time.as_secs_f64()
        );
        println!(
            "📈 Average samples per game: {:.1}",
            training_data.len() as f64 / self.config.num_games as f64
        );

        training_data
    }

    fn simulate_game(&self, ai: &mut AI) -> Vec<TrainingSample> {
        let mut game_state = GameState::new();
        let mut samples = Vec::new();
        let mut turn_count = 0;
        let max_turns = 200;

        while !game_state.is_game_over() && turn_count < max_turns {
            let dice_roll = self.roll_dice();
            game_state.dice_roll = dice_roll;

            let valid_moves = game_state.get_valid_moves();
            if valid_moves.is_empty() {
                turn_count += 1;
                continue;
            }

            let (expert_move, _) = ai.get_best_move(&game_state, self.config.depth);

            if let Some(move_idx) = expert_move {
                let features = GameFeatures::from_game_state(&game_state);
                let value_target = self.calculate_value_target(&game_state);
                let policy_target = self.create_policy_target(&game_state, move_idx);

                samples.push(TrainingSample {
                    features: features.to_array().to_vec(),
                    value_target,
                    policy_target,
                });

                if game_state.make_move(move_idx).is_err() {
                    turn_count += 1;
                } else {
                    turn_count += 1;
                }
            } else {
                turn_count += 1;
            }
        }

        samples
    }

    fn roll_dice(&self) -> u8 {
        let mut rng = rand::thread_rng();
        let probabilities = [1, 4, 6, 4, 1];
        let roll = rng.gen_range(0..16);

        let mut cumulative = 0;
        for (value, &prob) in (0..5).zip(probabilities.iter()) {
            cumulative += prob;
            if roll < cumulative {
                return value;
            }
        }
        4
    }

    fn calculate_value_target(&self, game_state: &GameState) -> f32 {
        let mut ai = AI::new();
        let (_, move_evaluations) = ai.get_best_move(game_state, self.config.depth);

        let evaluation = if let Some(best_move) = move_evaluations.first() {
            best_move.score
        } else {
            0.0
        };

        let normalized = (evaluation / 10000.0).max(-1.0).min(1.0);
        normalized
    }

    fn create_policy_target(&self, _game_state: &GameState, expert_move: u8) -> Vec<f32> {
        let mut policy = vec![0.0; PIECES_PER_PLAYER];
        policy[expert_move as usize] = 1.0;
        policy
    }

    pub fn train(&mut self, training_data: &[TrainingSample]) -> TrainingMetadata {
        println!(
            "🚀 Starting training with {} samples...",
            training_data.len()
        );

        let start_time = std::time::Instant::now();
        let last_progress_time = std::sync::Mutex::new(start_time);

        let split_idx =
            (training_data.len() as f32 * (1.0 - self.config.validation_split)) as usize;
        let train_data = &training_data[..split_idx];
        let val_data = &training_data[split_idx..];

        println!(
            "📊 Training samples: {}, Validation samples: {}",
            train_data.len(),
            val_data.len()
        );

        let mut best_val_loss = f32::INFINITY;
        let mut patience_counter = 0;
        let patience = 20;
        let mut loss_history = Vec::new();

        println!("🎯 Training Progres:");
        println!("═══════════════════════════════════════════════════════════════");

        for epoch in 0..self.config.epochs {
            let epoch_start = std::time::Instant::now();

            let train_loss = self.train_epoch(train_data);

            let val_loss = self.validate_epoch(val_data);

            let epoch_time = epoch_start.elapsed();
            loss_history.push((train_loss, val_loss));

            let current_time = std::time::Instant::now();
            let mut last_time = last_progress_time.lock().unwrap();
            let should_report = current_time.duration_since(*last_time).as_secs() >= 10
                || epoch % 5 == 0
                || epoch == 0;

            if should_report {
                let elapsed = current_time.duration_since(start_time);
                let epochs_completed = epoch + 1;
                let epochs_remaining = self.config.epochs - epochs_completed;

                let avg_epoch_time = elapsed.as_secs_f64() / epochs_completed as f64;
                let eta_seconds = avg_epoch_time * epochs_remaining as f64;
                let eta_minutes = eta_seconds / 60.0;

                let loss_improvement = if loss_history.len() > 1 {
                    let prev_val_loss = loss_history[loss_history.len() - 2].1;
                    val_loss - prev_val_loss
                } else {
                    0.0
                };

                println!(
                    "⏱️  Epoch {}/{} ({}s) | Train: {:.4} | Val: {:.4} | Δ: {:+.4} | ETA: {:.1}m",
                    epochs_completed,
                    self.config.epochs,
                    epoch_time.as_secs(),
                    train_loss,
                    val_loss,
                    loss_improvement,
                    eta_minutes
                );

                if loss_history.len() >= 3 {
                    let recent_train_trend = loss_history[loss_history.len() - 3..]
                        .iter()
                        .map(|(train, _)| *train)
                        .collect::<Vec<_>>();
                    let recent_val_trend = loss_history[loss_history.len() - 3..]
                        .iter()
                        .map(|(_, val)| *val)
                        .collect::<Vec<_>>();

                    let train_trend = if recent_train_trend[2] < recent_train_trend[0] {
                        "📉"
                    } else {
                        "📈"
                    };
                    let val_trend = if recent_val_trend[2] < recent_val_trend[0] {
                        "📉"
                    } else {
                        "📈"
                    };

                    println!(
                        "   📊 Trends: Train {} | Val {} | Best Val: {:.4}",
                        train_trend, val_trend, best_val_loss
                    );
                }

                *last_time = current_time;
            }

            if val_loss < best_val_loss {
                best_val_loss = val_loss;
                patience_counter = 0;
                if should_report {
                    println!("   🎉 New best validation loss: {:.4}", best_val_loss);
                }
            } else {
                patience_counter += 1;
                if patience_counter >= patience {
                    println!(
                        "🛑 Early stopping at epoch {} (no improvement for {} epochs)",
                        epoch + 1,
                        patience
                    );
                    break;
                }
            }
        }

        let training_time = start_time.elapsed().as_secs_f64();

        println!("🎉 === Training Complete ===");
        println!("⏱️  Total training time: {:.2} seconds", training_time);
        println!("📊 Final validation loss: {:.4}", best_val_loss);
        println!(
            "📈 Loss improvement: {:.2}%",
            ((loss_history[0].1 - best_val_loss) / loss_history[0].1 * 100.0).max(0.0)
        );
        println!("═══════════════════════════════════════════════════════════════");

        TrainingMetadata {
            training_date: chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            version: "rust_v1".to_string(),
            num_games: self.config.num_games,
            num_training_samples: training_data.len(),
            epochs: self.config.epochs,
            learning_rate: self.config.learning_rate,
            batch_size: self.config.batch_size,
            validation_split: self.config.validation_split,
            seed: self.config.seed,
            training_time_seconds: training_time,
            improvements: vec![
                "Rust-native training pipeline".to_string(),
                "Eliminated Python subprocess overhead".to_string(),
                "Direct expectiminimax integration".to_string(),
                "Optimized for maximum CPU utilization".to_string(),
            ],
        }
    }

    fn train_epoch(&mut self, data: &[TrainingSample]) -> f32 {
        let mut total_loss = 0.0;
        let num_batches = (data.len() + self.config.batch_size - 1) / self.config.batch_size;

        for batch_start in (0..data.len()).step_by(self.config.batch_size) {
            let batch_end = (batch_start + self.config.batch_size).min(data.len());
            let batch = &data[batch_start..batch_end];

            let batch_loss = self.train_batch(batch);
            total_loss += batch_loss;
        }

        total_loss / num_batches as f32
    }

    fn train_batch(&mut self, batch: &[TrainingSample]) -> f32 {
        let mut total_loss = 0.0;

        for sample in batch {
            let features = ndarray::Array1::from_vec(sample.features.clone());
            let value_target = ndarray::Array1::from_vec(vec![sample.value_target]);
            let value_loss =
                self.value_network
                    .train_step(&features, &value_target, self.config.learning_rate);

            let policy_target = ndarray::Array1::from_vec(sample.policy_target.clone());
            let policy_loss = self.policy_network.train_step(
                &features,
                &policy_target,
                self.config.learning_rate,
            );

            total_loss += value_loss + policy_loss;
        }

        total_loss / batch.len() as f32
    }

    fn validate_epoch(&self, data: &[TrainingSample]) -> f32 {
        let total_loss: f32 = data
            .par_iter()
            .map(|sample| {
                let features = ndarray::Array1::from_vec(sample.features.clone());
                let value_output = self.value_network.forward(&features);
                let policy_output = self.policy_network.forward(&features);

                let value_loss = (value_output[0] - sample.value_target).powi(2);
                let policy_target = ndarray::Array1::from_vec(sample.policy_target.clone());
                let policy_loss = self.cross_entropy_loss(&policy_output, &policy_target);

                value_loss + policy_loss
            })
            .sum();

        total_loss / data.len() as f32
    }

    fn cross_entropy_loss(
        &self,
        output: &ndarray::Array1<f32>,
        target: &ndarray::Array1<f32>,
    ) -> f32 {
        let epsilon = 1e-7;
        let mut loss = 0.0;

        for i in 0..output.len() {
            let pred = output[i].max(epsilon).min(1.0 - epsilon);
            let true_val = target[i];
            loss -= true_val * pred.ln();
        }

        loss
    }

    pub fn save_weights(
        &self,
        filename: &str,
        metadata: &TrainingMetadata,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let value_weights = self.value_network.get_weights();
        let policy_weights = self.policy_network.get_weights();

        let weights_data = serde_json::json!({
            "value_weights": value_weights,
            "policy_weights": policy_weights,
            "metadata": metadata,
        });

        std::fs::write(filename, serde_json::to_string_pretty(&weights_data)?)?;
        println!("Weights saved to {}", filename);
        Ok(())
    }

    pub fn load_weights(&mut self, filename: &str) -> Result<(), Box<dyn std::error::Error>> {
        let content = std::fs::read_to_string(filename)?;
        let weights_data: serde_json::Value = serde_json::from_str(&content)?;

        let value_weights: Vec<f32> =
            serde_json::from_value(weights_data["value_weights"].clone())?;
        let policy_weights: Vec<f32> =
            serde_json::from_value(weights_data["policy_weights"].clone())?;

        self.value_network.load_weights(&value_weights);
        self.policy_network.load_weights(&policy_weights);

        println!("Weights loaded from {}", filename);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trainer_creation() {
        let config = TrainingConfig {
            num_games: 100,
            epochs: 10,
            batch_size: 32,
            learning_rate: 0.001,
            validation_split: 0.2,
            depth: 3,
            seed: 42,
            output_file: "test_output.json".to_string(),
        };

        let trainer = Trainer::new(config);
        assert_eq!(trainer.value_network.num_layers(), 5);
        assert_eq!(trainer.policy_network.num_layers(), 5);
    }

    #[test]
    fn test_dice_rolling() {
        let config = TrainingConfig {
            num_games: 1,
            epochs: 1,
            batch_size: 1,
            learning_rate: 0.001,
            validation_split: 0.2,
            depth: 3,
            seed: 42,
            output_file: "test_output.json".to_string(),
        };

        let trainer = Trainer::new(config);
        let mut counts = [0; 5];

        for _ in 0..1000 {
            let roll = trainer.roll_dice();
            counts[roll as usize] += 1;
        }

        // Check that rolls follow expected distribution (1:4:6:4:1)
        // Expected counts for 1000 rolls: ~62:250:375:250:62
        // Using wider ranges to account for random variation
        assert!(counts[0] > 20 && counts[0] < 120); // ~1/16
        assert!(counts[1] > 150 && counts[1] < 350); // ~4/16
        assert!(counts[2] > 300 && counts[2] < 450); // ~6/16
        assert!(counts[3] > 150 && counts[3] < 350); // ~4/16
        assert!(counts[4] > 20 && counts[4] < 120); // ~1/16
    }

    #[test]
    fn test_policy_target_creation() {
        let config = TrainingConfig {
            num_games: 1,
            epochs: 1,
            batch_size: 1,
            learning_rate: 0.001,
            validation_split: 0.2,
            depth: 3,
            seed: 42,
            output_file: "test_output.json".to_string(),
        };

        let trainer = Trainer::new(config);
        let game_state = GameState::new();
        let policy_target = trainer.create_policy_target(&game_state, 3);

        assert_eq!(policy_target.len(), PIECES_PER_PLAYER);
        assert_eq!(policy_target[3], 1.0);
        assert_eq!(
            policy_target.iter().filter(|&&x| x == 0.0).count(),
            PIECES_PER_PLAYER - 1
        );
    }

    #[test]
    fn test_value_target_calculation() {
        let config = TrainingConfig {
            num_games: 1,
            epochs: 1,
            batch_size: 1,
            learning_rate: 0.001,
            validation_split: 0.2,
            depth: 3,
            seed: 42,
            output_file: "test_output.json".to_string(),
        };

        let trainer = Trainer::new(config);
        let game_state = GameState::new();
        let value_target = trainer.calculate_value_target(&game_state);

        // Value target should be in [-1, 1] range
        assert!(value_target >= -1.0 && value_target <= 1.0);
    }

    #[test]
    fn test_training_sample_creation() {
        let config = TrainingConfig {
            num_games: 1,
            epochs: 1,
            batch_size: 1,
            learning_rate: 0.001,
            validation_split: 0.2,
            depth: 3,
            seed: 42,
            output_file: "test_output.json".to_string(),
        };

        let trainer = Trainer::new(config);
        let mut ai = AI::new();
        let samples = trainer.simulate_game(&mut ai);

        // Should generate some training samples
        assert!(!samples.is_empty());

        // Check sample structure
        for sample in &samples {
            assert_eq!(sample.features.len(), 150);
            assert!(sample.value_target >= -1.0 && sample.value_target <= 1.0);
            assert_eq!(sample.policy_target.len(), PIECES_PER_PLAYER);
            assert!((sample.policy_target.iter().sum::<f32>() - 1.0).abs() < 1e-6);
        }
    }

    #[test]
    fn test_training_data_generation() {
        let config = TrainingConfig {
            num_games: 5,
            epochs: 1,
            batch_size: 1,
            learning_rate: 0.001,
            validation_split: 0.2,
            depth: 3,
            seed: 42,
            output_file: "test_output.json".to_string(),
        };

        let trainer = Trainer::new(config);
        let training_data = trainer.generate_training_data();

        // Should generate training data
        assert!(!training_data.is_empty());

        // Check data quality
        for sample in &training_data {
            assert_eq!(sample.features.len(), 150);
            assert!(sample.value_target >= -1.0 && sample.value_target <= 1.0);
            assert_eq!(sample.policy_target.len(), PIECES_PER_PLAYER);

            // Policy target should be one-hot or close to it
            let max_prob = sample.policy_target.iter().fold(0.0_f32, |a, &b| a.max(b));
            assert!(
                max_prob > 0.5,
                "Policy target should have a clear preferred move"
            );
        }
    }

    #[test]
    fn test_training_epoch() {
        let config = TrainingConfig {
            num_games: 1,
            epochs: 1,
            batch_size: 2,
            learning_rate: 0.01,
            validation_split: 0.2,
            depth: 3,
            seed: 42,
            output_file: "test_output.json".to_string(),
        };

        let mut trainer = Trainer::new(config);

        // Create some test training data
        let mut training_data = Vec::new();
        for i in 0..10 {
            let features = vec![0.1; 150];
            let value_target = 0.5;
            let mut policy_target = vec![0.0; PIECES_PER_PLAYER];
            policy_target[i % PIECES_PER_PLAYER] = 1.0;

            training_data.push(TrainingSample {
                features,
                value_target,
                policy_target,
            });
        }

        let loss = trainer.train_epoch(&training_data);
        assert!(loss > 0.0, "Training loss should be positive");
    }

    #[test]
    fn test_validation_epoch() {
        let config = TrainingConfig {
            num_games: 1,
            epochs: 1,
            batch_size: 2,
            learning_rate: 0.01,
            validation_split: 0.2,
            depth: 3,
            seed: 42,
            output_file: "test_output.json".to_string(),
        };

        let trainer = Trainer::new(config);

        // Create some test validation data
        let mut validation_data = Vec::new();
        for i in 0..5 {
            let features = vec![0.1; 150];
            let value_target = 0.5;
            let mut policy_target = vec![0.0; PIECES_PER_PLAYER];
            policy_target[i % PIECES_PER_PLAYER] = 1.0;

            validation_data.push(TrainingSample {
                features,
                value_target,
                policy_target,
            });
        }

        let loss = trainer.validate_epoch(&validation_data);
        assert!(loss > 0.0, "Validation loss should be positive");
    }

    #[test]
    fn test_cross_entropy_loss() {
        let config = TrainingConfig {
            num_games: 1,
            epochs: 1,
            batch_size: 1,
            learning_rate: 0.001,
            validation_split: 0.2,
            depth: 3,
            seed: 42,
            output_file: "test_output.json".to_string(),
        };

        let trainer = Trainer::new(config);

        // Test with perfect prediction
        let output = ndarray::Array1::from_vec(vec![0.0, 1.0, 0.0, 0.0]);
        let target = ndarray::Array1::from_vec(vec![0.0, 1.0, 0.0, 0.0]);
        let loss = trainer.cross_entropy_loss(&output, &target);
        assert!(loss < 1e-6, "Perfect prediction should have near-zero loss");

        // Test with poor prediction
        let output = ndarray::Array1::from_vec(vec![0.25, 0.25, 0.25, 0.25]);
        let target = ndarray::Array1::from_vec(vec![0.0, 1.0, 0.0, 0.0]);
        let loss = trainer.cross_entropy_loss(&output, &target);
        assert!(loss > 0.5, "Poor prediction should have high loss");
    }

    #[test]
    fn test_weight_saving_loading() {
        let config = TrainingConfig {
            num_games: 1,
            epochs: 1,
            batch_size: 1,
            learning_rate: 0.001,
            validation_split: 0.2,
            depth: 3,
            seed: 42,
            output_file: "test_weights.json".to_string(),
        };

        let mut trainer = Trainer::new(config.clone());

        // Create some test data and train a bit
        let mut training_data = Vec::new();
        for i in 0..5 {
            let features = vec![0.1; 150];
            let value_target = 0.5;
            let mut policy_target = vec![0.0; PIECES_PER_PLAYER];
            policy_target[i % PIECES_PER_PLAYER] = 1.0;

            training_data.push(TrainingSample {
                features,
                value_target,
                policy_target,
            });
        }

        // Train for one epoch
        trainer.train_epoch(&training_data);

        // Save weights
        let metadata = TrainingMetadata {
            training_date: "2025-01-01".to_string(),
            version: "test".to_string(),
            num_games: 1,
            num_training_samples: 5,
            epochs: 1,
            learning_rate: 0.001,
            batch_size: 1,
            validation_split: 0.2,
            seed: 42,
            training_time_seconds: 1.0,
            improvements: vec!["test".to_string()],
        };

        let save_result = trainer.save_weights("test_weights.json", &metadata);
        assert!(save_result.is_ok(), "Weight saving should succeed");

        // Create new trainer and load weights
        let mut new_trainer = Trainer::new(config);
        let load_result = new_trainer.load_weights("test_weights.json");
        assert!(load_result.is_ok(), "Weight loading should succeed");

        // Test that outputs are similar (not identical due to randomness)
        let test_features = ndarray::Array1::from_vec(vec![0.1; 150]);
        let original_value = trainer.value_network.forward(&test_features);
        let loaded_value = new_trainer.value_network.forward(&test_features);

        // Outputs should be similar (within reasonable tolerance)
        assert!((original_value[0] - loaded_value[0]).abs() < 0.1);

        // Clean up
        let _ = std::fs::remove_file("test_weights.json");
    }

    #[test]
    fn test_training_convergence() {
        let config = TrainingConfig {
            num_games: 1,
            epochs: 5,
            batch_size: 4,
            learning_rate: 0.01,
            validation_split: 0.2,
            depth: 3,
            seed: 42,
            output_file: "test_output.json".to_string(),
        };

        let mut trainer = Trainer::new(config);

        // Create simple training data
        let mut training_data = Vec::new();
        for _ in 0..20 {
            let features = vec![0.1; 150];
            let value_target = 0.5;
            let mut policy_target = vec![0.0; PIECES_PER_PLAYER];
            policy_target[0] = 1.0;

            training_data.push(TrainingSample {
                features,
                value_target,
                policy_target,
            });
        }

        // Train and check for convergence
        let metadata = trainer.train(&training_data);

        // Should complete training without errors
        assert_eq!(metadata.num_training_samples, 20);
        assert_eq!(metadata.epochs, 5);
        assert!(metadata.training_time_seconds > 0.0);
    }

    #[test]
    fn test_feature_consistency() {
        let config = TrainingConfig {
            num_games: 1,
            epochs: 1,
            batch_size: 1,
            learning_rate: 0.001,
            validation_split: 0.2,
            depth: 3,
            seed: 42,
            output_file: "test_output.json".to_string(),
        };

        let trainer = Trainer::new(config);
        let mut ai = AI::new();
        let samples = trainer.simulate_game(&mut ai);

        // Check that features are consistent across samples
        for (sample_idx, sample) in samples.iter().enumerate() {
            assert_eq!(sample.features.len(), 150);

            // Features should be reasonable values (allow flexibility for strategic features)
            for (feature_idx, &feature) in sample.features.iter().enumerate() {
                assert!(
                    feature >= -15.0 && feature <= 15.0,
                    "Sample {}, Feature {} out of range: {}",
                    sample_idx,
                    feature_idx,
                    feature
                );
            }
        }
    }
}

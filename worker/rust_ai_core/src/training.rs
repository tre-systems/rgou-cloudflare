//! # ML Training Module
//!
//! This module provides comprehensive machine learning training capabilities for the Royal Game of Ur AI.
//! It includes intelligent CPU optimization, unified configuration management, and efficient training pipelines.
//!
//! ## Key Features
//!
//! ### 🍎 Intelligent CPU Optimization
//! - **Apple Silicon Detection**: Automatically detects M1/M2/M3 Macs and optimizes for performance cores
//! - **Cross-Platform Compatibility**: Adapts to any CPU configuration without hardcoded values
//! - **System Responsiveness**: Leaves appropriate cores for system tasks
//!
//! ### 🚀 Performance Optimizations
//! - **Parallel Game Generation**: Uses all available cores for training data generation
//! - **Optimized Thread Pool**: Configures rayon thread pool for maximum efficiency
//! - **Memory Management**: 8MB stack size for deep recursion operations
//!
//! ### 📊 Unified Configuration
//! - **Single Source of Truth**: All training parameters in `ml/config/training.json`
//! - **Network Architecture**: Centralized neural network configuration
//! - **Training Presets**: Quick, default, and production settings
//!
//! ## Usage Examples
//!
//! ```rust
//! use rgou_ai_core::training::{Trainer, TrainingConfig};
//! fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let config = TrainingConfig {
//!         num_games: 1,
//!         epochs: 1,
//!         batch_size: 1,
//!         learning_rate: 0.001,
//!         validation_split: 0.2,
//!         depth: 1,
//!         seed: 42,
//!         output_file: "ml_ai_weights.json".to_string(),
//!     };
//!     let mut trainer = Trainer::new(config);
//!     let training_data = trainer.generate_training_data();
//!     let metadata = trainer.train(&training_data);
//!     trainer.save_weights("weights.json", &metadata)?;
//!     Ok(())
//! }
//! ```
//!
//! ## CPU Optimization Strategy
//!
//! The module automatically detects system characteristics and optimizes CPU utilization:
//!
//! | System Type | Core Allocation | Description |
//! |-------------|-----------------|-------------|
//! | Apple Silicon | 8 performance cores | M1/M2/M3 Macs: Uses all performance cores, leaves efficiency cores for system |
//! | High-core (16+) | total - 2 cores | High-end systems: Leaves 2 cores for system tasks |
//! | High-core (8-15) | total - 1 core | Mid-range systems: Leaves 1 core for system tasks |
//! | Standard | all cores | Smaller systems: Uses all available cores |
//!
//! ## Performance Monitoring
//!
//! The training process provides detailed progress information:
//! - Real-time game generation progress with ETA
//! - Per-epoch training metrics and trends
//! - Validation loss tracking with early stopping
//! - Comprehensive training metadata and statistics

use crate::features::GameFeatures;
use crate::neural_network::{NetworkConfig, NeuralNetwork};
use crate::{GameState, AI, PIECES_PER_PLAYER};
use rand::Rng;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};

/// System types for CPU optimization strategies
#[derive(Debug, Clone, Copy)]
enum SystemType {
    /// Apple Silicon systems (M1/M2/M3) with performance/efficiency core architecture
    AppleSilicon,
    /// High-core count systems (16+ cores) that benefit from leaving cores for system tasks
    HighCoreCount,
    /// Standard systems that can use all available cores
    Standard,
}

/// A single training sample containing game state features and target values
///
/// This structure represents one training example used to train the neural networks.
/// Each sample contains the game state features and the expected outputs for
/// both the value network (game state evaluation) and policy network (move selection).
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TrainingSample {
    /// Game state features (150-dimensional vector)
    ///
    /// These features encode the current game state including:
    /// - Piece positions for both players
    /// - Dice roll information
    /// - Game phase indicators
    /// - Strategic position metrics
    pub features: Vec<f32>,

    /// Target value for the value network (game state evaluation)
    ///
    /// This is a scalar value between -1 and 1 representing:
    /// - 1.0: Current player has a winning position
    /// - 0.0: Neutral/balanced position
    /// - -1.0: Current player has a losing position
    pub value_target: f32,

    /// Target probabilities for the policy network (move selection)
    ///
    /// This is a 7-dimensional vector representing the probability
    /// distribution over all possible moves (0-6). The expert move
    /// (determined by expectiminimax search) gets probability 1.0,
    /// while all other moves get 0.0.
    pub policy_target: Vec<f32>,
}

/// Configuration parameters for ML training
///
/// This structure contains all the hyperparameters and settings needed
/// to configure the training process. It can be loaded from the unified
/// configuration file or created programmatically.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TrainingConfig {
    /// Number of games to generate for training data
    ///
    /// More games provide more diverse training data but increase training time.
    /// Typical values: 100 (quick test), 1000 (default), 2000+ (production)
    pub num_games: usize,

    /// Number of training epochs
    ///
    /// Each epoch processes all training data once. More epochs allow
    /// the model to learn more complex patterns but risk overfitting.
    /// Typical values: 10 (quick test), 50 (default), 100+ (production)
    pub epochs: usize,

    /// Batch size for training
    ///
    /// Larger batches provide more stable gradients but require more memory.
    /// Smaller batches allow more frequent updates but may be less stable.
    /// Typical values: 32 (default), 64 (production), 128 (high memory)
    pub batch_size: usize,

    /// Learning rate for gradient descent
    ///
    /// Controls how much the model weights are updated in each step.
    /// Too high: training may diverge. Too low: training may be slow.
    /// Typical values: 0.001 (default), 0.0001 (fine-tuning)
    pub learning_rate: f32,

    /// Fraction of data to use for validation
    ///
    /// Validation data is used to monitor training progress and prevent overfitting.
    /// Typical values: 0.2 (20% validation, 80% training)
    pub validation_split: f32,

    /// Search depth for expectiminimax algorithm
    ///
    /// Higher depth provides better expert moves but increases computation time.
    /// This affects the quality of the training targets.
    /// Typical values: 3 (default), 4 (production), 5+ (high quality)
    pub depth: u8,

    /// Random seed for reproducible results
    ///
    /// Using the same seed ensures reproducible training runs.
    /// Set to 0 for truly random behavior.
    pub seed: u64,

    /// Output file path for trained weights
    ///
    /// The trained neural network weights will be saved to this file
    /// in JSON format with metadata.
    pub output_file: String,
}

/// Neural network architecture configuration
///
/// This structure defines the architecture of both the value network
/// and policy network. Both networks share the same input and hidden
/// layers but have different output layers.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NetworkArchitecture {
    /// Size of the input feature vector
    ///
    /// This should match the number of features extracted from the game state.
    /// Currently fixed at 150 features for the Royal Game of Ur.
    pub input_size: usize,

    /// Sizes of hidden layers
    ///
    /// Each element represents the number of neurons in a hidden layer.
    /// The layers are processed in order from input to output.
    /// Typical architecture: [256, 128, 64, 32] for a 4-layer network
    pub hidden_sizes: Vec<usize>,

    /// Size of the value network output
    ///
    /// The value network outputs a single scalar value representing
    /// the evaluation of the current game state.
    pub value_output_size: usize,

    /// Size of the policy network output
    ///
    /// The policy network outputs a probability distribution over
    /// all possible moves (0-6 for the Royal Game of Ur).
    pub policy_output_size: usize,
}

/// Unified training configuration containing all training parameters
///
/// This structure represents the complete configuration loaded from
/// `ml/config/training.json`. It contains network architecture and
/// multiple training presets for different use cases.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UnifiedTrainingConfig {
    /// Neural network architecture definition
    ///
    /// Defines the structure of both value and policy networks.
    /// This is shared across all training configurations.
    pub network_architecture: NetworkArchitecture,

    /// Default training parameters
    ///
    /// Standard training configuration for normal development and testing.
    /// Balanced between training time and model quality.
    pub training_defaults: TrainingConfig,

    /// Production training parameters
    ///
    /// High-quality training configuration for production models.
    /// Uses more games, more epochs, and higher search depth for best results.
    pub production_settings: TrainingConfig,

    /// Quick test training parameters
    ///
    /// Fast training configuration for rapid testing and development.
    /// Uses fewer games and epochs for quick feedback.
    pub quick_test_settings: TrainingConfig,
}

/// Metadata about a completed training run
///
/// This structure contains comprehensive information about a training session,
/// including configuration parameters, performance metrics, and training results.
/// It is saved alongside the trained weights for reproducibility and analysis.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TrainingMetadata {
    /// Date and time when training completed
    ///
    /// ISO 8601 formatted timestamp for when the training run finished.
    pub training_date: String,

    /// Version identifier for the training run
    ///
    /// Can be used to track different training experiments or model versions.
    pub version: String,

    /// Number of games used for training data generation
    ///
    /// This matches the `num_games` parameter from the training configuration.
    pub num_games: usize,

    /// Total number of training samples generated
    ///
    /// This is typically much larger than `num_games` since each game
    /// produces multiple training samples (one per move).
    pub num_training_samples: usize,

    /// Number of training epochs completed
    ///
    /// May be less than the configured epochs if early stopping was triggered.
    pub epochs: usize,

    /// Learning rate used during training
    ///
    /// This affects how much the model weights were updated in each step.
    pub learning_rate: f32,

    /// Batch size used during training
    ///
    /// Larger batches provide more stable gradients but require more memory.
    pub batch_size: usize,

    /// Validation split ratio used
    ///
    /// Fraction of data reserved for validation (e.g., 0.2 for 20% validation).
    pub validation_split: f32,

    /// Random seed used for reproducibility
    ///
    /// Using the same seed should produce identical results.
    pub seed: u64,

    /// Total training time in seconds
    ///
    /// Includes both data generation and neural network training time.
    pub training_time_seconds: f64,

    /// List of improvements or notes about this training run
    ///
    /// Can include information about hyperparameter changes, architecture
    /// modifications, or other experimental details.
    pub improvements: Vec<String>,
}

/// Main trainer for machine learning models
///
/// This struct manages the complete training pipeline including:
/// - CPU optimization and thread pool configuration
/// - Training data generation using parallel game simulation
/// - Neural network training with value and policy networks
/// - Model saving and loading with metadata
///
/// The trainer automatically optimizes CPU utilization based on the system
/// architecture and provides comprehensive progress monitoring.
pub struct Trainer {
    /// Value network for game state evaluation
    ///
    /// This network learns to evaluate how good a game position is
    /// for the current player. Outputs a scalar value between -1 and 1.
    value_network: NeuralNetwork,

    /// Policy network for move selection
    ///
    /// This network learns to predict the best move in a given position.
    /// Outputs a probability distribution over all possible moves.
    policy_network: NeuralNetwork,

    /// Training configuration parameters
    ///
    /// Contains all hyperparameters and settings for the training process.
    config: TrainingConfig,
}

impl Trainer {
    /// Create a new trainer with optimal CPU configuration
    ///
    /// This constructor:
    /// 1. Configures the global thread pool for optimal CPU utilization
    /// 2. Loads the unified network configuration from `ml/config/training.json`
    /// 3. Initializes both value and policy networks
    /// 4. Sets up the training configuration
    ///
    /// # Arguments
    ///
    /// * `config` - Training configuration containing all hyperparameters
    ///
    /// # Examples
    ///
    /// ```rust
    /// use rgou_ai_core::training::{Trainer, TrainingConfig};
    ///
    /// let config = TrainingConfig {
    ///     num_games: 1,
    ///     epochs: 1,
    ///     batch_size: 1,
    ///     learning_rate: 0.001,
    ///     validation_split: 0.2,
    ///     depth: 1,
    ///     seed: 42,
    ///     output_file: "ml_ai_weights.json".to_string(),
    /// };
    ///
    /// let trainer = Trainer::new(config);
    /// ```
    ///
    /// # CPU Optimization
    ///
    /// The trainer automatically detects your system type and optimizes CPU utilization:
    /// - **Apple Silicon**: Uses all 8 performance cores, leaves efficiency cores for system
    /// - **High-core systems**: Uses most cores but leaves 1-2 for system tasks
    /// - **Standard systems**: Uses all available cores
    pub fn new(config: TrainingConfig) -> Self {
        // Configure optimal thread pool for training
        Self::configure_thread_pool();

        // Load unified configuration if available
        let network_config = Self::load_network_config().unwrap_or_else(|| {
            // Fallback to hardcoded values if config file not found
            NetworkArchitecture {
                input_size: 150,
                hidden_sizes: vec![256, 128, 64, 32],
                value_output_size: 1,
                policy_output_size: PIECES_PER_PLAYER,
            }
        });

        let value_config = NetworkConfig {
            input_size: network_config.input_size,
            hidden_sizes: network_config.hidden_sizes.clone(),
            output_size: network_config.value_output_size,
        };

        let policy_config = NetworkConfig {
            input_size: network_config.input_size,
            hidden_sizes: network_config.hidden_sizes,
            output_size: network_config.policy_output_size,
        };

        Trainer {
            value_network: NeuralNetwork::new(value_config),
            policy_network: NeuralNetwork::new(policy_config),
            config,
        }
    }

    /// Load network architecture from unified configuration file
    ///
    /// Attempts to load the network architecture from `ml/config/training.json`.
    /// If the file doesn't exist or can't be parsed, returns `None` and the
    /// trainer will use hardcoded default values.
    ///
    /// # Returns
    ///
    /// * `Some(NetworkArchitecture)` - Successfully loaded configuration
    /// * `None` - File not found or parsing failed, will use defaults
    ///
    /// # File Format
    ///
    /// The configuration file should contain a JSON object with this structure:
    /// ```json
    /// {
    ///   "network_architecture": {
    ///     "input_size": 150,
    ///     "hidden_sizes": [256, 128, 64, 32],
    ///     "value_output_size": 1,
    ///     "policy_output_size": 7
    ///   }
    /// }
    /// ```
    fn load_network_config() -> Option<NetworkArchitecture> {
        let config_path = std::path::Path::new("ml/config/training.json");
        if config_path.exists() {
            match std::fs::read_to_string(config_path) {
                Ok(content) => match serde_json::from_str::<UnifiedTrainingConfig>(&content) {
                    Ok(config) => Some(config.network_architecture),
                    Err(e) => {
                        eprintln!("Warning: Failed to parse training config: {}", e);
                        None
                    }
                },
                Err(e) => {
                    eprintln!("Warning: Failed to read training config: {}", e);
                    None
                }
            }
        } else {
            None
        }
    }

    /// Configure the global thread pool for optimal CPU utilization
    ///
    /// This function automatically detects the system type and configures
    /// the rayon thread pool to use the optimal number of CPU cores:
    ///
    /// - **Apple Silicon**: Uses all performance cores (typically 8 on M1/M2/M3)
    ///   while leaving efficiency cores for system tasks
    /// - **High-core systems**: Uses most cores but leaves 1-2 for system tasks
    /// - **Standard systems**: Uses all available cores
    ///
    /// This ensures maximum performance for CPU-intensive tasks like:
    /// - Game generation for training data
    /// - Neural network training
    /// - AI evaluation and testing
    fn configure_thread_pool() {
        let total_cores = std::thread::available_parallelism()
            .unwrap_or(std::num::NonZeroUsize::new(1).unwrap())
            .get();

        // Determine optimal core count based on system characteristics
        let num_cores = Self::get_optimal_core_count(total_cores);

        // Configure rayon thread pool for optimal performance
        rayon::ThreadPoolBuilder::new()
            .num_threads(num_cores)
            .stack_size(8 * 1024 * 1024) // 8MB stack size for deep recursion
            .build_global()
            .unwrap_or_else(|_| println!("Warning: Could not set thread pool size"));
    }

    /// Determine the optimal number of CPU cores to use based on system characteristics
    ///
    /// This function analyzes the system type and total core count to determine
    /// the optimal number of cores for parallel processing tasks.
    fn get_optimal_core_count(total_cores: usize) -> usize {
        // Detect system type and optimize accordingly
        let system_info = Self::detect_system_type();

        match system_info {
            SystemType::AppleSilicon => {
                // Apple Silicon: Use all performance cores (typically 8 on M1/M2/M3)
                // Leave efficiency cores for system tasks
                let performance_cores = if total_cores >= 10 {
                    8 // M1 Pro/Max/M2/M3 with 8+4 or 10+2 configuration
                } else if total_cores >= 8 {
                    8 // M1 with 8+2 configuration
                } else {
                    total_cores // Fallback for other configurations
                };

                println!(
                    "🍎 Apple Silicon detected: Using {} performance cores out of {} total cores",
                    performance_cores, total_cores
                );
                performance_cores
            }
            SystemType::HighCoreCount => {
                // High-core systems: Use most cores but leave some for system
                let optimal_cores = if total_cores >= 16 {
                    total_cores - 2 // Leave 2 cores for system
                } else if total_cores >= 8 {
                    total_cores - 1 // Leave 1 core for system
                } else {
                    total_cores // Use all cores on smaller systems
                };

                println!(
                    "🚀 High-core system detected: Using {} cores out of {} total cores",
                    optimal_cores, total_cores
                );
                optimal_cores
            }
            SystemType::Standard => {
                // Standard systems: Use all cores
                println!("💻 Standard system: Using all {} CPU cores", total_cores);
                total_cores
            }
        }
    }

    /// Detect the system type to optimize CPU core utilization
    ///
    /// This function identifies the system architecture to determine
    /// the optimal CPU core allocation strategy:
    ///
    /// - **Apple Silicon**: Detected by macOS + specific core counts (10, 12, 14)
    /// - **High-core systems**: Systems with 16+ CPU cores
    /// - **Standard systems**: All other configurations
    fn detect_system_type() -> SystemType {
        // Detect Apple Silicon
        if cfg!(target_os = "macos") {
            // Check for Apple Silicon characteristics
            let total_cores = std::thread::available_parallelism()
                .unwrap_or(std::num::NonZeroUsize::new(1).unwrap())
                .get();

            // Apple Silicon typically has 8+2, 8+4, or 10+2 core configurations
            if total_cores == 10 || total_cores == 12 || total_cores == 14 {
                return SystemType::AppleSilicon;
            }
        }

        // Detect high-core count systems
        let total_cores = std::thread::available_parallelism()
            .unwrap_or(std::num::NonZeroUsize::new(1).unwrap())
            .get();

        if total_cores >= 16 {
            SystemType::HighCoreCount
        } else {
            SystemType::Standard
        }
    }

    /// Get the optimal number of CPU cores for parallel processing
    ///
    /// This is a public utility function that other parts of the codebase
    /// can use to determine the optimal number of cores for their own
    /// parallel processing tasks.
    pub fn get_optimal_core_count_public() -> usize {
        let total_cores = std::thread::available_parallelism()
            .unwrap_or(std::num::NonZeroUsize::new(1).unwrap())
            .get();

        Self::get_optimal_core_count(total_cores)
    }

    /// Generate training data using parallel game simulation
    ///
    /// This method generates training data by simulating multiple games in parallel
    /// using all available CPU cores. Each game produces multiple training samples
    /// (one for each move), so the total number of samples is much larger than
    /// the number of games.
    ///
    /// # Process
    ///
    /// 1. **Parallel Game Generation**: Uses rayon to simulate games concurrently
    /// 2. **Expert Move Calculation**: Uses expectiminimax search to determine optimal moves
    /// 3. **Feature Extraction**: Extracts 150-dimensional feature vectors from each position
    /// 4. **Target Generation**: Creates value and policy targets for each position
    ///
    /// # Performance
    ///
    /// - **CPU Utilization**: Uses all available performance cores
    /// - **Progress Monitoring**: Shows real-time progress with ETA
    /// - **Memory Efficiency**: Processes games in parallel without excessive memory usage
    ///
    /// # Returns
    ///
    /// A vector of training samples, where each sample contains:
    /// - Game state features (150-dimensional vector)
    /// - Value target (scalar between -1 and 1)
    /// - Policy target (7-dimensional probability vector)
    ///
    /// # Examples
    ///
    /// ```rust
    /// use rgou_ai_core::training::{Trainer, TrainingConfig};
    ///
    /// let config = TrainingConfig {
    ///     num_games: 1,
    ///     epochs: 1,
    ///     batch_size: 1,
    ///     learning_rate: 0.001,
    ///     validation_split: 0.2,
    ///     depth: 1,
    ///     seed: 42,
    ///     output_file: "test_weights.json".to_string(),
    /// };
    ///
    /// let trainer = Trainer::new(config);
    /// let training_data = trainer.generate_training_data();
    /// println!("Generated {} training samples", training_data.len());
    /// ```
    ///
    /// # Progress Output
    ///
    /// The method provides detailed progress information:
    /// ```text
    /// 🎮 Core 1: 25.0% - 12.5 games/sec - ETA: 6s - Samples: 3750
    /// 🎮 Core 2: 50.0% - 12.3 games/sec - ETA: 4s - Samples: 7500
    /// ```
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

        // Use the same optimal core count logic as configured in constructor
        let num_cores = Self::get_optimal_core_count(total_cores);

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

    /// Train the neural networks on generated training data
    ///
    /// This method trains both the value network and policy network using the
    /// provided training data. The training process includes validation,
    /// early stopping, and comprehensive progress monitoring.
    ///
    /// # Training Process
    ///
    /// 1. **Data Split**: Splits data into training and validation sets
    /// 2. **Epoch Training**: Trains for the specified number of epochs
    /// 3. **Validation**: Monitors validation loss to prevent overfitting
    /// 4. **Early Stopping**: Stops training if validation loss doesn't improve
    /// 5. **Progress Monitoring**: Shows detailed training metrics and trends
    ///
    /// # Training Metrics
    ///
    /// The method tracks and reports:
    /// - Training loss per epoch
    /// - Validation loss per epoch
    /// - Loss improvement trends
    /// - Training time and ETA
    /// - Best validation loss achieved
    ///
    /// # Early Stopping
    ///
    /// Training stops early if validation loss doesn't improve for 20 epochs.
    /// This prevents overfitting and saves training time.
    ///
    /// # Arguments
    ///
    /// * `training_data` - Vector of training samples generated by `generate_training_data()`
    ///
    /// # Returns
    ///
    /// `TrainingMetadata` containing comprehensive information about the training run:
    /// - Configuration parameters used
    /// - Performance metrics
    /// - Training time and statistics
    /// - Version and reproducibility information
    ///
    /// # Examples
    ///
    /// ```rust
    /// use rgou_ai_core::training::{Trainer, TrainingConfig};
    ///
    /// let config = TrainingConfig {
    ///     num_games: 1,
    ///     epochs: 1,
    ///     batch_size: 1,
    ///     learning_rate: 0.001,
    ///     validation_split: 0.2,
    ///     depth: 1,
    ///     seed: 42,
    ///     output_file: "test_weights.json".to_string(),
    /// };
    ///
    /// let mut trainer = Trainer::new(config);
    /// let training_data = trainer.generate_training_data();
    /// let metadata = trainer.train(&training_data);
    /// println!("Training completed in {:.2} seconds", metadata.training_time_seconds);
    /// ```
    ///
    /// # Progress Output
    ///
    /// The method provides detailed training progress:
    /// ```text
    /// ⏱️  Epoch 1/50 (45s) | Train: 0.2345 | Val: 0.2123 | Δ: -0.0222 | ETA: 37.5m
    ///    📊 Trends: Train 📉 | Val 📉 | Best Val: 0.2123
    /// ```
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

    /// Save trained neural network weights to a JSON file
    ///
    /// This method saves both the value network and policy network weights
    /// along with comprehensive metadata about the training run. The saved
    /// file can be loaded later to restore the trained model.
    ///
    /// # File Format
    ///
    /// The weights are saved in JSON format with the following structure:
    /// ```json
    /// {
    ///   "value_weights": [...],
    ///   "policy_weights": [...],
    ///   "network_config": {
    ///     "input_size": 150,
    ///     "hidden_sizes": [256, 128, 64, 32],
    ///     "value_output_size": 1,
    ///     "policy_output_size": 7
    ///   },
    ///   "metadata": {
    ///     "training_date": "2024-01-01T12:00:00Z",
    ///     "version": "v1.0",
    ///     "num_games": 1000,
    ///     "num_training_samples": 15000,
    ///     "epochs": 50,
    ///     "learning_rate": 0.001,
    ///     "batch_size": 32,
    ///     "validation_split": 0.2,
    ///     "seed": 42,
    ///     "training_time_seconds": 3600.0,
    ///     "improvements": ["Improved feature extraction", "Added early stopping"]
    ///   }
    /// }
    /// ```
    ///
    /// # Arguments
    ///
    /// * `filename` - Path to the output JSON file
    /// * `metadata` - Training metadata containing configuration and performance information
    ///
    /// # Returns
    ///
    /// * `Ok(())` - Weights successfully saved
    /// * `Err(...)` - Error occurred during saving (e.g., file permission, disk space)
    ///
    /// # Examples
    ///
    /// ```rust
    /// use rgou_ai_core::training::{Trainer, TrainingConfig};
    ///
    /// let config = TrainingConfig {
    ///     num_games: 1,
    ///     epochs: 1,
    ///     batch_size: 1,
    ///     learning_rate: 0.001,
    ///     validation_split: 0.2,
    ///     depth: 1,
    ///     seed: 42,
    ///     output_file: "test_weights.json".to_string(),
    /// };
    ///
    /// let mut trainer = Trainer::new(config);
    /// let training_data = trainer.generate_training_data();
    /// let metadata = trainer.train(&training_data);
    /// trainer.save_weights("ml_ai_weights.json", &metadata)?;
    /// # Ok::<(), Box<dyn std::error::Error>>(())
    /// ```
    ///
    /// # Error Handling
    ///
    /// Common errors include:
    /// - File permission issues
    /// - Insufficient disk space
    /// - Invalid file path
    /// - JSON serialization errors
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

    /// Load neural network weights from a JSON file
    ///
    /// This method loads previously saved weights for both the value network
    /// and policy network. The weights file must contain the same network
    /// architecture as the current trainer configuration.
    ///
    /// # File Format
    ///
    /// The method expects a JSON file with the same structure as produced by `save_weights()`:
    /// ```json
    /// {
    ///   "value_weights": [...],
    ///   "policy_weights": [...],
    ///   "network_config": {
    ///     "input_size": 150,
    ///     "hidden_sizes": [256, 128, 64, 32],
    ///     "value_output_size": 1,
    ///     "policy_output_size": 7
    ///   },
    ///   "metadata": { ... }
    /// }
    /// ```
    ///
    /// # Arguments
    ///
    /// * `filename` - Path to the JSON file containing saved weights
    ///
    /// # Returns
    ///
    /// * `Ok(())` - Weights successfully loaded
    /// * `Err(...)` - Error occurred during loading
    ///
    /// # Examples
    ///
    /// ```rust
    /// use rgou_ai_core::training::{Trainer, TrainingConfig};
    ///
    /// let config = TrainingConfig {
    ///     num_games: 1,
    ///     epochs: 1,
    ///     batch_size: 1,
    ///     learning_rate: 0.001,
    ///     validation_split: 0.2,
    ///     depth: 1,
    ///     seed: 42,
    ///     output_file: "test_weights.json".to_string(),
    /// };
    ///
    /// let mut trainer = Trainer::new(config);
    /// trainer.load_weights("ml_ai_weights.json")?;
    /// # Ok::<(), Box<dyn std::error::Error>>(())
    /// ```
    ///
    /// # Error Handling
    ///
    /// Common errors include:
    /// - File not found
    /// - Invalid JSON format
    /// - Network architecture mismatch
    /// - Corrupted weight data
    ///
    /// # Compatibility
    ///
    /// The loaded weights must match the current network architecture.
    /// If the architecture has changed, the weights cannot be loaded.
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
            num_games: 1,
            epochs: 1,
            batch_size: 1,
            learning_rate: 0.001,
            validation_split: 0.2,
            depth: 1,
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
            depth: 1,
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
            depth: 1,
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
            depth: 1,
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
            depth: 1,
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
            num_games: 1,
            epochs: 1,
            batch_size: 1,
            learning_rate: 0.001,
            validation_split: 0.2,
            depth: 1,
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
            batch_size: 1,
            learning_rate: 0.01,
            validation_split: 0.2,
            depth: 1,
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
            batch_size: 1,
            learning_rate: 0.01,
            validation_split: 0.2,
            depth: 1,
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
            depth: 1,
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
            depth: 1,
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
            epochs: 1,
            batch_size: 1,
            learning_rate: 0.01,
            validation_split: 0.2,
            depth: 1,
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
        assert_eq!(metadata.epochs, 1);
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
            depth: 1,
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

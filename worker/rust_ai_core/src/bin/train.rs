use rgou_ai_core::training::{Trainer, TrainingConfig};
use std::env;
use std::time::Instant;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        println!("Usage: {} <train|generate_data> [config_file]", args[0]);
        return Ok(());
    }

    let command = &args[1];

    match command.as_str() {
        "train" => {
            // Full training mode
            let num_games = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(1000);
            let epochs = args.get(3).and_then(|s| s.parse().ok()).unwrap_or(100);
            let learning_rate = args.get(4).and_then(|s| s.parse().ok()).unwrap_or(0.001);
            let batch_size = args.get(5).and_then(|s| s.parse().ok()).unwrap_or(32);
            let depth = args.get(6).and_then(|s| s.parse().ok()).unwrap_or(3);
            let output_file = args
                .get(7)
                .cloned()
                .unwrap_or_else(|| "ml_ai_weights_rust.json".to_string());

            println!("=== Rust ML AI Training ===");
            println!("Games: {}", num_games);
            println!("Epochs: {}", epochs);
            println!("Learning Rate: {}", learning_rate);
            println!("Batch Size: {}", batch_size);
            println!("Search Depth: {}", depth);
            println!("Output: {}", output_file);
            println!("==========================");

            let start_time = Instant::now();

            let config = TrainingConfig {
                num_games,
                epochs,
                batch_size,
                learning_rate,
                validation_split: 0.2,
                depth,
                seed: 42,
                output_file: "temp_training_data.json".to_string(),
            };

            let mut trainer = Trainer::new(config);

            println!("\nGenerating training data...");
            let training_data = trainer.generate_training_data();

            println!("\nStarting training...");
            let metadata = trainer.train(&training_data);

            println!("\nSaving weights...");
            trainer.save_weights(&output_file, &metadata)?;

            let total_time = start_time.elapsed();

            println!("\n=== Training Complete ===");
            println!("Total time: {:.2} seconds", total_time.as_secs_f64());
            println!(
                "Training time: {:.2} seconds",
                metadata.training_time_seconds
            );
            println!("Samples generated: {}", metadata.num_training_samples);
            println!("Weights saved to: {}", output_file);
            println!("========================");
        }

        "generate_data" => {
            // Data generation only mode (for hybrid training)
            let config_file = args
                .get(2)
                .ok_or("Config file required for generate_data")?;

            let config_content = std::fs::read_to_string(config_file)?;
            let config: TrainingConfig = serde_json::from_str(&config_content)?;
            
            // Ensure the output directory exists
            if let Some(output_path) = std::path::Path::new(&config.output_file).parent() {
                std::fs::create_dir_all(output_path)?;
            }

            println!("=== Rust Data Generation ===");
            println!("Games: {}", config.num_games);
            println!("Depth: {}", config.depth);
            println!("Output: {}", config.output_file);
            println!("===========================");

            let start_time = Instant::now();

            let trainer = Trainer::new(config.clone());

            println!("\n🎮 Starting game generation and data preparation...");
            let training_data = trainer.generate_training_data();

            // Save training data
            println!("\n💾 Saving training data...");
            let output_data = serde_json::to_string_pretty(&training_data)?;
            std::fs::write(&config.output_file, output_data)?;

            let generation_time = start_time.elapsed();

            println!("\n=== Data Generation Complete ===");
            println!(
                "Generation time: {:.2} seconds",
                generation_time.as_secs_f64()
            );
            println!("Generated {} training samples", training_data.len());
            println!("Output saved to: {}", config.output_file);
            println!("================================");
        }

        _ => {
            println!("Unknown command: {}", command);
            println!("Available commands: train, generate_data");
        }
    }

    Ok(())
}

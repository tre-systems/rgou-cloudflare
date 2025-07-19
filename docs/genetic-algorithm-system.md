# Genetic Algorithm System for EMM Parameter Evolution

## Overview

This system allows the evolution of Expectiminimax (EMM) algorithm parameters using genetic algorithms. The goal is to automatically find optimal parameter values that improve AI performance in the Royal Game of Ur.

## Architecture

### 1. Genetic Parameters Module (`worker/rust_ai_core/src/genetic_params.rs`)

The `GeneticParams` struct contains all the configurable parameters for the EMM evaluation function:

```rust
pub struct GeneticParams {
    pub win_score: i32,                    // Score for winning the game
    pub finished_piece_value: i32,         // Value of each finished piece
    pub position_weight: i32,              // Weight for positional evaluation
    pub safety_bonus: i32,                 // Bonus for pieces on rosettes
    pub rosette_control_bonus: i32,        // Bonus for controlling rosettes
    pub advancement_bonus: i32,            // Bonus for advancing pieces
    pub capture_bonus: i32,                // Bonus for capturing opponent pieces
    pub center_lane_bonus: i32,            // Bonus for pieces in center lane
}
```

### 2. Centralized Dice System (`worker/rust_ai_core/src/dice.rs`)

A centralized dice rolling system ensures consistent dice roll distribution throughout the project:

- **Range**: 0-4 (representing 4 tetrahedral dice)
- **Distribution**: [1/16, 4/16, 6/16, 4/16, 1/16] for rolls 0-4
- **Functions**: `roll_dice()`, `roll_dice_with_rng()`, `roll_dice_multiple()`

### 3. Genetic Algorithm Implementation (`ml/scripts/src/main.rs`)

A complete genetic algorithm implementation in Rust that includes:

- **Population Management**: Tournament selection, elitism
- **Genetic Operations**: Crossover, mutation
- **Fitness Evaluation**: Parameter validation and scoring
- **Evolution**: Multi-generation optimization

## Usage

### Loading Parameters

```rust
use rgou_ai_core::genetic_params::GeneticParams;

// Load from file
let params = GeneticParams::load_from_file("path/to/params.json")?;

// Create GameState with custom parameters
let game_state = GameState::with_genetic_params(params);
```

### Running the Genetic Algorithm

```bash
cd ml/scripts
cargo run
```

This will:

1. Initialize a population of parameter sets
2. Evolve the population over 10 generations
3. Save the best parameters to `ml/data/genetic_params/evolved.json`

### Parameter Files

- **Default**: `ml/data/genetic_params/default.json` - Current baseline parameters
- **Evolved**: `ml/data/genetic_params/evolved.json` - Best parameters from genetic algorithm

## Genetic Algorithm Details

### Fitness Function

The current fitness function evaluates parameters based on:

1. **Parameter Range Validation**: Ensures parameters are within reasonable bounds
2. **Random Performance Simulation**: Adds randomness to simulate actual game performance
3. **Multi-objective Optimization**: Balances different aspects of gameplay

### Genetic Operations

- **Mutation**: Random parameter adjustments with configurable rate and strength
- **Crossover**: Parameter mixing between parent individuals
- **Selection**: Tournament selection for parent choice
- **Elitism**: Preserves best individuals across generations

### Configuration

Key genetic algorithm parameters:

```rust
population_size: 20,      // Number of individuals
mutation_rate: 0.1,       // Probability of mutation per parameter
mutation_strength: 0.1,   // Magnitude of mutations
crossover_rate: 0.7,      // Probability of crossover per parameter
elite_size: 2,            // Number of best individuals to preserve
```

## Integration with EMM Algorithm

The expectiminimax algorithm has been updated to use the centralized dice probabilities:

```rust
// Before: Hardcoded probabilities
const PROBABILITIES: [f32; 5] = [1.0/16.0, 4.0/16.0, 6.0/16.0, 4.0/16.0, 1.0/16.0];

// After: Centralized dice module
for (roll, &prob) in crate::dice::DICE_PROBABILITIES.iter().enumerate() {
    // ... dice roll handling
}
```

## Testing

### Dice Distribution Tests

```bash
cargo test dice --manifest-path worker/rust_ai_core/Cargo.toml
```

Tests verify:

- Correct probability distribution
- Valid roll ranges (0-4)
- Random number generation consistency

### Genetic Parameters Tests

```bash
cargo test genetic_params --manifest-path worker/rust_ai_core/Cargo.toml
```

Tests verify:

- Parameter loading/saving
- Mutation and crossover operations
- Default parameter values

## Future Enhancements

### 1. Real Fitness Evaluation

Replace the placeholder fitness function with actual game performance:

```rust
fn evaluate_fitness(&mut self) -> f64 {
    // Run games against baseline AI
    let mut wins = 0;
    for _ in 0..100 {
        let result = play_game_against_baseline(&self.params);
        if result.winner == Player::Player2 { // Assuming this AI is Player2
            wins += 1;
        }
    }
    wins as f64 / 100.0
}
```

### 2. Multi-Objective Optimization

Consider multiple fitness criteria:

- Win rate against different AI depths
- Average game length
- Computational efficiency
- Strategic diversity

### 3. Parameter Constraints

Add constraints to prevent invalid parameter combinations:

- Ensure positive values for bonuses
- Maintain reasonable parameter ratios
- Prevent parameter conflicts

### 4. Advanced Genetic Operations

- **Adaptive Mutation**: Adjust mutation rates based on population diversity
- **Island Model**: Multiple sub-populations with periodic migration
- **Co-evolution**: Evolve against multiple opponent types simultaneously

## File Structure

```
worker/rust_ai_core/src/
├── genetic_params.rs      # Genetic parameters module
├── dice.rs               # Centralized dice system
└── lib.rs                # Main library (updated to use genetic params)

ml/
├── data/genetic_params/
│   ├── default.json      # Default parameters
│   └── evolved.json      # Evolved parameters
└── scripts/
    ├── Cargo.toml        # Genetic algorithm dependencies
    └── src/main.rs       # Genetic algorithm implementation

docs/
└── genetic-algorithm-system.md  # This documentation
```

## Conclusion

The genetic algorithm system provides a robust framework for evolving EMM parameters. The centralized dice system ensures consistency across the entire codebase, while the modular design allows for easy extension and experimentation with different fitness functions and genetic operations.

The system is ready for real-world testing and can be extended to optimize against specific opponents or game scenarios.

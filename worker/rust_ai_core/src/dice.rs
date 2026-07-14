use rand::Rng;

/// Probabilities for the sum of four binary tetrahedral dice.
pub const DICE_PROBABILITIES: [f32; 5] =
    [1.0 / 16.0, 4.0 / 16.0, 6.0 / 16.0, 4.0 / 16.0, 1.0 / 16.0];

/// Rolls four tetrahedral dice and returns their sum (0–4).
pub fn roll_dice() -> u8 {
    let mut rng = rand::rng();
    roll_dice_with_rng(&mut rng)
}

/// Rolls using an injected RNG, allowing deterministic simulations.
pub fn roll_dice_with_rng<R: Rng>(rng: &mut R) -> u8 {
    let roll: f32 = rng.random();

    let mut cumulative_prob = 0.0;
    for (i, &prob) in DICE_PROBABILITIES.iter().enumerate() {
        cumulative_prob += prob;
        if roll <= cumulative_prob {
            return i as u8;
        }
    }

    4
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::{rngs::StdRng, SeedableRng};
    use std::collections::HashMap;

    #[test]
    fn test_dice_roll_range() {
        for _ in 0..1000 {
            let roll = roll_dice();
            assert!(roll <= 4, "Dice roll {} is out of range", roll);
        }
    }

    #[test]
    fn test_dice_roll_distribution() {
        let num_rolls = 100000;
        let mut counts: HashMap<u8, usize> = HashMap::new();

        for _ in 0..num_rolls {
            let roll = roll_dice();
            *counts.entry(roll).or_insert(0) += 1;
        }

        // Check that each roll appears with approximately correct frequency
        for roll in 0..=4 {
            let count = counts.get(&roll).unwrap_or(&0);
            let probability = *count as f32 / num_rolls as f32;
            let expected_probability = DICE_PROBABILITIES[roll as usize];

            // Allow for some variance (±10% of expected probability)
            let tolerance = expected_probability * 0.1;
            assert!(
                (probability - expected_probability).abs() <= tolerance,
                "Roll {}: expected {:.4}, got {:.4}",
                roll,
                expected_probability,
                probability
            );
        }
    }

    #[test]
    fn test_dice_probabilities_sum_to_one() {
        let sum: f32 = DICE_PROBABILITIES.iter().sum();
        assert!(
            (sum - 1.0).abs() < 0.0001,
            "Probabilities sum to {}, not 1.0",
            sum
        );
    }

    #[test]
    fn test_roll_dice_with_rng() {
        let mut rng = StdRng::seed_from_u64(42);
        for _ in 0..1000 {
            let roll = roll_dice_with_rng(&mut rng);
            assert!(roll <= 4);
        }
    }
}

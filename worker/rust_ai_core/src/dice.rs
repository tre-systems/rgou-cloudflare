use rand::Rng;

/// Dice roll probabilities for 4 tetrahedral dice
/// Roll 0: 1/16 (all 0s)
/// Roll 1: 4/16 (one 1, three 0s)
/// Roll 2: 6/16 (two 1s, two 0s)
/// Roll 3: 4/16 (three 1s, one 0)
/// Roll 4: 1/16 (all 1s)
pub const DICE_PROBABILITIES: [f32; 5] =
    [1.0 / 16.0, 4.0 / 16.0, 6.0 / 16.0, 4.0 / 16.0, 1.0 / 16.0];

/// Generate a random dice roll (0-4) with the correct probability distribution
/// for 4 tetrahedral dice
pub fn roll_dice() -> u8 {
    let mut rng = rand::thread_rng();
    let roll: f32 = rng.gen();

    let mut cumulative_prob = 0.0;
    for (i, &prob) in DICE_PROBABILITIES.iter().enumerate() {
        cumulative_prob += prob;
        if roll <= cumulative_prob {
            return i as u8;
        }
    }

    // Fallback (should never happen with exact probabilities)
    2
}

/// Generate a random dice roll using a provided RNG
pub fn roll_dice_with_rng<R: Rng>(rng: &mut R) -> u8 {
    let roll: f32 = rng.gen();

    let mut cumulative_prob = 0.0;
    for (i, &prob) in DICE_PROBABILITIES.iter().enumerate() {
        cumulative_prob += prob;
        if roll <= cumulative_prob {
            return i as u8;
        }
    }

    // Fallback (should never happen with exact probabilities)
    2
}

#[cfg(test)]
mod tests {
    use super::*;
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
        let mut rng = rand::thread_rng();
        for _ in 0..1000 {
            let roll = roll_dice_with_rng(&mut rng);
            assert!(roll <= 4);
        }
    }
}

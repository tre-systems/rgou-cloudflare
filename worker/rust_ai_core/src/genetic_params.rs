use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneticParams {
    pub win_score: i32,
    pub finished_piece_value: i32,
    pub position_weight: i32,
    pub safety_bonus: i32,
    pub rosette_control_bonus: i32,
    pub advancement_bonus: i32,
    pub capture_bonus: i32,
    pub center_lane_bonus: i32,
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
    pub fn load_from_file<P: AsRef<Path>>(path: P) -> Result<Self, Box<dyn std::error::Error>> {
        let content = fs::read_to_string(path)?;
        let params: GeneticParams = serde_json::from_str(&content)?;
        Ok(params)
    }

    pub fn save_to_file<P: AsRef<Path>>(&self, path: P) -> Result<(), Box<dyn std::error::Error>> {
        let content = serde_json::to_string_pretty(self)?;
        fs::write(path, content)?;
        Ok(())
    }

    pub fn random_mutation(&self, mutation_rate: f64, mutation_strength: f64) -> Self {
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

    pub fn crossover(&self, other: &Self, crossover_rate: f64) -> Self {
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_params() {
        let params = GeneticParams::default();
        assert_eq!(params.win_score, 10000);
        assert_eq!(params.finished_piece_value, 1000);
        assert_eq!(params.position_weight, 15);
        assert_eq!(params.safety_bonus, 25);
        assert_eq!(params.rosette_control_bonus, 40);
        assert_eq!(params.advancement_bonus, 5);
        assert_eq!(params.capture_bonus, 35);
        assert_eq!(params.center_lane_bonus, 2);
    }

    #[test]
    fn test_save_and_load() {
        let params = GeneticParams::default();
        let temp_path = "test_params.json";

        params.save_to_file(temp_path).unwrap();
        let loaded_params = GeneticParams::load_from_file(temp_path).unwrap();

        assert_eq!(params.win_score, loaded_params.win_score);
        assert_eq!(
            params.finished_piece_value,
            loaded_params.finished_piece_value
        );
        assert_eq!(params.position_weight, loaded_params.position_weight);
        assert_eq!(params.safety_bonus, loaded_params.safety_bonus);
        assert_eq!(
            params.rosette_control_bonus,
            loaded_params.rosette_control_bonus
        );
        assert_eq!(params.advancement_bonus, loaded_params.advancement_bonus);
        assert_eq!(params.capture_bonus, loaded_params.capture_bonus);
        assert_eq!(params.center_lane_bonus, loaded_params.center_lane_bonus);

        // Clean up
        let _ = fs::remove_file(temp_path);
    }

    #[test]
    fn test_mutation() {
        let params = GeneticParams::default();
        let mutated = params.random_mutation(1.0, 0.1);

        // At least some parameters should be different
        let mut changed = false;
        if params.win_score != mutated.win_score {
            changed = true;
        }
        if params.finished_piece_value != mutated.finished_piece_value {
            changed = true;
        }
        if params.position_weight != mutated.position_weight {
            changed = true;
        }
        if params.safety_bonus != mutated.safety_bonus {
            changed = true;
        }
        if params.rosette_control_bonus != mutated.rosette_control_bonus {
            changed = true;
        }
        if params.advancement_bonus != mutated.advancement_bonus {
            changed = true;
        }
        if params.capture_bonus != mutated.capture_bonus {
            changed = true;
        }
        if params.center_lane_bonus != mutated.center_lane_bonus {
            changed = true;
        }

        assert!(changed);
    }

    #[test]
    fn test_crossover() {
        let params1 = GeneticParams::default();
        let mut params2 = GeneticParams::default();
        params2.win_score = 20000;
        params2.finished_piece_value = 2000;

        let crossed = params1.crossover(&params2, 1.0);

        // All parameters should come from params2
        assert_eq!(crossed.win_score, params2.win_score);
        assert_eq!(crossed.finished_piece_value, params2.finished_piece_value);
    }
}

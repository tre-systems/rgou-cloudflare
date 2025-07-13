use super::{GameFeatures, GameState, Player, MLAI};
use crate::neural_network::NeuralNetwork;
use ndarray::Array1;
use rand::Rng;

#[derive(Clone, Debug)]
pub struct TrainingExample {
    pub features: Vec<f32>,
    pub target_value: f32,
    pub target_policy: Vec<f32>,
}

#[derive(Clone, Debug)]
pub struct TrainingData {
    pub examples: Vec<TrainingExample>,
}

impl TrainingData {
    pub fn new() -> Self {
        TrainingData {
            examples: Vec::new(),
        }
    }

    pub fn add_example(&mut self, example: TrainingExample) {
        self.examples.push(example);
    }

    pub fn len(&self) -> usize {
        self.examples.len()
    }

    pub fn is_empty(&self) -> bool {
        self.examples.is_empty()
    }

    pub fn shuffle(&mut self) {
        use rand::seq::SliceRandom;
        let mut rng = rand::thread_rng();
        self.examples.shuffle(&mut rng);
    }

    pub fn split(&self, ratio: f32) -> (TrainingData, TrainingData) {
        let split_idx = (self.examples.len() as f32 * ratio) as usize;
        let (train_examples, test_examples) = self.examples.split_at(split_idx);

        (
            TrainingData {
                examples: train_examples.to_vec(),
            },
            TrainingData {
                examples: test_examples.to_vec(),
            },
        )
    }
}

pub struct Trainer {
    value_network: NeuralNetwork,
    policy_network: NeuralNetwork,
    learning_rate: f32,
}

impl Trainer {
    pub fn new(value_network: NeuralNetwork, policy_network: NeuralNetwork) -> Self {
        Trainer {
            value_network,
            policy_network,
            learning_rate: 0.001,
        }
    }

    pub fn set_learning_rate(&mut self, lr: f32) {
        self.learning_rate = lr;
    }

    pub fn train_epoch(&mut self, data: &TrainingData) -> (f32, f32) {
        let mut value_loss = 0.0;
        let mut policy_loss = 0.0;

        for example in &data.examples {
            let features = Array1::from_vec(example.features.clone());

            // Train value network
            let value_pred = self.value_network.forward(&features);
            let value_error = value_pred[0] - example.target_value;
            value_loss += value_error * value_error;

            // Train policy network
            let policy_pred = self.policy_network.forward(&features);
            let target_policy = Array1::from_vec(example.target_policy.clone());
            let policy_error = (&policy_pred - &target_policy).mapv(|x| x * x).sum();
            policy_loss += policy_error;
        }

        let avg_value_loss = value_loss / data.examples.len() as f32;
        let avg_policy_loss = policy_loss / data.examples.len() as f32;

        (avg_value_loss, avg_policy_loss)
    }

    pub fn get_networks(self) -> (NeuralNetwork, NeuralNetwork) {
        (self.value_network, self.policy_network)
    }
}

fn get_target_policy(expert_ai: &mut MLAI, state: &GameState) -> Vec<f32> {
    let mut policy = vec![0.0; 7];
    let valid_moves = state.get_valid_moves();

    if valid_moves.is_empty() {
        return policy;
    }

    let expert_response = expert_ai.get_best_move(state);
    if let Some(best_move) = expert_response.r#move {
        policy[best_move as usize] = 1.0;
    } else {
        let prob = 1.0 / valid_moves.len() as f32;
        for &move_idx in &valid_moves {
            policy[move_idx as usize] = prob;
        }
    }
    policy
}

fn get_target_value(state: &GameState) -> f32 {
    if let Some(winner) = state.get_winner() {
        match winner {
            Player::Player1 => -1.0,
            Player::Player2 => 1.0,
        }
    } else {
        let p1_finished = state
            .player1_pieces
            .iter()
            .filter(|p| p.square == 20)
            .count() as f32;
        let p2_finished = state
            .player2_pieces
            .iter()
            .filter(|p| p.square == 20)
            .count() as f32;

        (p2_finished - p1_finished) / 7.0
    }
}

pub struct DataGenerator {
    expert_ai: MLAI,
    num_games: usize,
}

impl DataGenerator {
    pub fn new(expert_ai: MLAI) -> Self {
        DataGenerator {
            expert_ai,
            num_games: 1000,
        }
    }

    pub fn set_num_games(&mut self, num_games: usize) {
        self.num_games = num_games;
    }

    pub fn generate_from_expert_ai(&mut self) -> TrainingData {
        let mut training_data = TrainingData::new();
        let mut rng = rand::thread_rng();
        let expert_ai = &mut self.expert_ai;

        for _ in 0..self.num_games {
            let mut game_state = GameState::new();

            while !game_state.is_game_over() {
                let features = GameFeatures::from_game_state(&game_state);
                let target_value = get_target_value(&game_state);
                let target_policy = get_target_policy(expert_ai, &game_state);

                training_data.add_example(TrainingExample {
                    features: features.features.to_vec(),
                    target_value,
                    target_policy,
                });

                if game_state.get_winner().is_some() {
                    break;
                }

                let valid_moves = game_state.get_valid_moves();
                if valid_moves.is_empty() {
                    game_state.current_player = game_state.current_player.opponent();
                    game_state.dice_roll = rng.gen_range(0..5);
                    continue;
                }

                let expert_response = expert_ai.get_best_move(&game_state);
                if let Some(move_idx) = expert_response.r#move {
                    game_state.make_move(move_idx).unwrap();
                } else {
                    let random_move = valid_moves[rng.gen_range(0..valid_moves.len())];
                    game_state.make_move(random_move).unwrap();
                }

                if rng.gen_range(0.0..1.0) < 0.1 {
                    game_state.dice_roll = rng.gen_range(0..5);
                }
            }
        }

        training_data
    }

    pub fn generate_self_play_data(&mut self, num_games: usize) -> TrainingData {
        let mut training_data = TrainingData::new();
        let mut rng = rand::thread_rng();
        let expert_ai = &mut self.expert_ai;

        for _ in 0..num_games {
            let mut game_state = GameState::new();

            while !game_state.is_game_over() {
                let features = GameFeatures::from_game_state(&game_state);
                let target_value = get_target_value(&game_state);
                let target_policy = get_target_policy(expert_ai, &game_state);

                training_data.add_example(TrainingExample {
                    features: features.features.to_vec(),
                    target_value,
                    target_policy,
                });

                if game_state.get_winner().is_some() {
                    break;
                }

                let valid_moves = game_state.get_valid_moves();
                if valid_moves.is_empty() {
                    game_state.current_player = game_state.current_player.opponent();
                    game_state.dice_roll = rng.gen_range(0..5);
                    continue;
                }

                let ml_response = expert_ai.get_best_move(&game_state);
                if let Some(move_idx) = ml_response.r#move {
                    game_state.make_move(move_idx).unwrap();
                } else {
                    let random_move = valid_moves[rng.gen_range(0..valid_moves.len())];
                    game_state.make_move(random_move).unwrap();
                }
            }
        }

        training_data
    }
}

pub fn create_pretrained_networks() -> (NeuralNetwork, NeuralNetwork) {
    use crate::neural_network::NetworkConfig;

    let value_config = NetworkConfig {
        input_size: 100,
        hidden_sizes: vec![64, 32],
        output_size: 1,
    };

    let policy_config = NetworkConfig {
        input_size: 100,
        hidden_sizes: vec![64, 32],
        output_size: 7,
    };

    let value_network = NeuralNetwork::new(value_config);
    let policy_network = NeuralNetwork::new(policy_config);

    (value_network, policy_network)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_training_data_creation() {
        let mut data = TrainingData::new();
        assert!(data.is_empty());

        let example = TrainingExample {
            features: vec![1.0, 2.0, 3.0],
            target_value: 0.5,
            target_policy: vec![0.1, 0.2, 0.3, 0.4, 0.0, 0.0, 0.0],
        };

        data.add_example(example);
        assert_eq!(data.len(), 1);
    }

    #[test]
    fn test_data_generator_creation() {
        let expert_ai = MLAI::new();
        let generator = DataGenerator::new(expert_ai);
        assert_eq!(generator.num_games, 1000);
    }
}

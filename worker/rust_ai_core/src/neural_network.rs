use ndarray::{Array1, Array2};
use rand::Rng;
use std::f32;

#[derive(Clone, Debug)]
pub struct NetworkConfig {
    pub input_size: usize,
    pub hidden_sizes: Vec<usize>,
    pub output_size: usize,
}

impl NetworkConfig {
    pub fn total_weights(&self) -> usize {
        let mut total = 0;
        let mut prev_size = self.input_size;

        for &hidden_size in &self.hidden_sizes {
            total += (prev_size + 1) * hidden_size;
            prev_size = hidden_size;
        }

        total += (prev_size + 1) * self.output_size;
        total
    }
}

#[derive(Clone, Debug)]
pub struct Layer {
    weights: Array2<f32>,
    biases: Array1<f32>,
}

impl Layer {
    pub fn new(input_size: usize, output_size: usize) -> Self {
        let mut rng = rand::thread_rng();

        let weights =
            Array2::from_shape_fn((input_size, output_size), |_| rng.gen_range(-0.1..0.1));

        let biases = Array1::from_shape_fn(output_size, |_| rng.gen_range(-0.1..0.1));

        Layer { weights, biases }
    }

    pub fn forward(&self, input: &Array1<f32>) -> Array1<f32> {
        let linear = input.dot(&self.weights) + &self.biases;
        linear.mapv(|x| x.max(0.0)) // ReLU activation
    }

    pub fn load_weights(&mut self, weights: &[f32]) -> usize {
        let mut idx = 0;

        // Load weights
        for i in 0..self.weights.shape()[0] {
            for j in 0..self.weights.shape()[1] {
                if idx < weights.len() {
                    self.weights[[i, j]] = weights[idx];
                    idx += 1;
                }
            }
        }

        // Load biases
        for i in 0..self.biases.len() {
            if idx < weights.len() {
                self.biases[i] = weights[idx];
                idx += 1;
            }
        }

        idx
    }

    pub fn get_weights(&self) -> Vec<f32> {
        let mut weights = Vec::new();

        // Add weights
        for i in 0..self.weights.shape()[0] {
            for j in 0..self.weights.shape()[1] {
                weights.push(self.weights[[i, j]]);
            }
        }

        // Add biases
        for &bias in self.biases.iter() {
            weights.push(bias);
        }

        weights
    }
}

#[derive(Clone, Debug)]
pub struct NeuralNetwork {
    layers: Vec<Layer>,
    config: NetworkConfig,
}

impl NeuralNetwork {
    pub fn new(config: NetworkConfig) -> Self {
        let mut layers = Vec::new();
        let mut prev_size = config.input_size;

        // Create hidden layers
        for &hidden_size in &config.hidden_sizes {
            layers.push(Layer::new(prev_size, hidden_size));
            prev_size = hidden_size;
        }

        // Create output layer
        layers.push(Layer::new(prev_size, config.output_size));

        NeuralNetwork { layers, config }
    }

    pub fn forward(&self, input: &Array1<f32>) -> Array1<f32> {
        let mut current = input.clone();

        for layer in &self.layers {
            current = layer.forward(&current);
        }

        // Apply tanh activation to output for value network
        if self.config.output_size == 1 {
            current.mapv(|x| x.tanh())
        } else {
            // Apply softmax for policy network
            self.softmax(&current)
        }
    }

    fn softmax(&self, input: &Array1<f32>) -> Array1<f32> {
        let max_val = input.fold(f32::NEG_INFINITY, |a, &b| a.max(b));
        let exp_input = input.mapv(|x| (x - max_val).exp());
        let sum = exp_input.sum();
        exp_input.mapv(|x| x / sum)
    }

    pub fn load_weights(&mut self, weights: &[f32]) {
        let mut idx = 0;

        for layer in &mut self.layers {
            idx += layer.load_weights(&weights[idx..]);
        }
    }

    pub fn get_weights(&self) -> Vec<f32> {
        let mut weights = Vec::new();

        for layer in &self.layers {
            weights.extend(layer.get_weights());
        }

        weights
    }

    pub fn save_weights(&self) -> Vec<f32> {
        self.get_weights()
    }

    pub fn load_weights_from_file(
        &mut self,
        filename: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let content = std::fs::read_to_string(filename)?;
        let weights: Vec<f32> = serde_json::from_str(&content)?;
        self.load_weights(&weights);
        Ok(())
    }

    pub fn save_weights_to_file(&self, filename: &str) -> Result<(), Box<dyn std::error::Error>> {
        let weights = self.get_weights();
        let content = serde_json::to_string(&weights)?;
        std::fs::write(filename, content)?;
        Ok(())
    }

    pub fn num_layers(&self) -> usize {
        self.layers.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_network_config() {
        let config = NetworkConfig {
            input_size: 10,
            hidden_sizes: vec![5, 3],
            output_size: 1,
        };

        assert_eq!(
            config.total_weights(),
            (10 + 1) * 5 + (5 + 1) * 3 + (3 + 1) * 1
        );
    }

    #[test]
    fn test_layer_creation() {
        let layer = Layer::new(3, 2);
        assert_eq!(layer.weights.shape(), [3, 2]);
        assert_eq!(layer.biases.len(), 2);
    }

    #[test]
    fn test_layer_forward() {
        let layer = Layer::new(2, 3);
        let input = Array1::from_vec(vec![1.0, 2.0]);
        let output = layer.forward(&input);
        assert_eq!(output.len(), 3);
    }

    #[test]
    fn test_network_creation() {
        let config = NetworkConfig {
            input_size: 10,
            hidden_sizes: vec![5, 3],
            output_size: 1,
        };

        let network = NeuralNetwork::new(config);
        assert_eq!(network.layers.len(), 3);
    }

    #[test]
    fn test_network_forward() {
        let config = NetworkConfig {
            input_size: 3,
            hidden_sizes: vec![2],
            output_size: 1,
        };

        let network = NeuralNetwork::new(config);
        let input = Array1::from_vec(vec![1.0, 2.0, 3.0]);
        let output = network.forward(&input);
        assert_eq!(output.len(), 1);
    }
}

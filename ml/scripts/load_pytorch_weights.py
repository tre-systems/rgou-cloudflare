#!/usr/bin/env python3
"""
Utility to load PyTorch-trained weights and convert them for use in Rust
"""

import json
import argparse
import sys
from pathlib import Path
from typing import Dict, Any, List
import torch
import torch.nn as nn

def load_network_config() -> Dict[str, Any]:
    """Load unified network configuration"""
    config_path = Path("ml/config/training.json")
    if config_path.exists():
        with open(config_path, 'r') as f:
            config = json.load(f)
            return config["network_architecture"]
    else:
        # Fallback to default configuration
        return {
            "input_size": 150,
            "hidden_sizes": [256, 128, 64, 32],
            "value_output_size": 1,
            "policy_output_size": 7
        }

class ValueNetwork(nn.Module):
    def __init__(self, network_config: Dict[str, Any]):
        super().__init__()
        input_size = network_config["input_size"]
        hidden_sizes = network_config["hidden_sizes"]
        output_size = network_config["value_output_size"]
        
        layers = []
        prev_size = input_size
        
        for hidden_size in hidden_sizes:
            layers.extend([
                nn.Linear(prev_size, hidden_size),
                nn.ReLU(),
                nn.Dropout(0.1)
            ])
            prev_size = hidden_size
        
        layers.append(nn.Linear(prev_size, output_size))
        
        self.network = nn.Sequential(*layers)
        
    def forward(self, x):
        return torch.tanh(self.network(x))

class PolicyNetwork(nn.Module):
    def __init__(self, network_config: Dict[str, Any]):
        super().__init__()
        input_size = network_config["input_size"]
        hidden_sizes = network_config["hidden_sizes"]
        output_size = network_config["policy_output_size"]
        
        layers = []
        prev_size = input_size
        
        for hidden_size in hidden_sizes:
            layers.extend([
                nn.Linear(prev_size, hidden_size),
                nn.ReLU(),
                nn.Dropout(0.1)
            ])
            prev_size = hidden_size
        
        layers.append(nn.Linear(prev_size, output_size))
        
        self.network = nn.Sequential(*layers)
        
    def forward(self, x):
        return torch.nn.functional.softmax(self.network(x), dim=-1)

def load_pytorch_weights(filename: str) -> Dict[str, Any]:
    """Load PyTorch weights from file"""
    print(f"📂 Loading PyTorch weights from {filename}...")
    
    with open(filename, 'r') as f:
        weights_data = json.load(f)
    
    print(f"✅ Loaded weights with metadata: {weights_data['metadata']['version']}")
    return weights_data

def convert_to_rust_format(weights_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert PyTorch weights to Rust-compatible format"""
    print("🔄 Converting weights to Rust format...")
    
    # Extract weights
    value_weights = weights_data['value_weights']
    policy_weights = weights_data['policy_weights']
    metadata = weights_data['metadata']
    
    # Create Rust-compatible format
    rust_weights = {
        "value_weights": value_weights,
        "policy_weights": policy_weights,
        "metadata": metadata
    }
    
    print(f"✅ Converted {len(value_weights)} value weights and {len(policy_weights)} policy weights")
    return rust_weights

def save_rust_weights(weights_data: Dict[str, Any], output_file: str):
    """Save weights in Rust-compatible format"""
    print(f"💾 Saving Rust-compatible weights to {output_file}...")
    
    with open(output_file, 'w') as f:
        json.dump(weights_data, f, indent=2)
    
    print(f"✅ Weights saved to {output_file}")

def test_weights_compatibility(weights_data: Dict[str, Any]):
    """Test that weights can be loaded into PyTorch networks"""
    print("🧪 Testing weight compatibility...")
    
    try:
        # Load network configuration
        network_config = load_network_config()
        
        # Create networks
        value_network = ValueNetwork(network_config)
        policy_network = PolicyNetwork(network_config)
        
        # Load weights
        value_idx = 0
        for param in value_network.parameters():
            param_size = param.numel()
            param.data = torch.tensor(weights_data['value_weights'][value_idx:value_idx + param_size]).reshape(param.shape)
            value_idx += param_size
        
        policy_idx = 0
        for param in policy_network.parameters():
            param_size = param.numel()
            param.data = torch.tensor(weights_data['policy_weights'][policy_idx:policy_idx + param_size]).reshape(param.shape)
            policy_idx += param_size
        
        # Test forward pass
        test_input = torch.randn(1, 150)
        value_output = value_network(test_input)
        policy_output = policy_network(test_input)
        
        print(f"✅ Compatibility test passed!")
        print(f"   Value output shape: {value_output.shape}")
        print(f"   Policy output shape: {policy_output.shape}")
        print(f"   Value output range: [{value_output.min().item():.3f}, {value_output.max().item():.3f}]")
        print(f"   Policy output sum: {policy_output.sum().item():.3f}")
        
    except Exception as e:
        print(f"❌ Compatibility test failed: {e}")
        raise

def main():
    parser = argparse.ArgumentParser(description="Load and convert PyTorch weights for Rust")
    parser.add_argument("input_file", help="Input PyTorch weights file")
    parser.add_argument("output_file", nargs='?', help="Output Rust weights file (default: input_file_rust.json)")
    parser.add_argument("--test", action="store_true", help="Test weight compatibility")
    
    args = parser.parse_args()
    
    if not Path(args.input_file).exists():
        print(f"❌ Input file not found: {args.input_file}")
        sys.exit(1)
    
    # Determine output file
    if args.output_file is None:
        input_path = Path(args.input_file)
        output_file = input_path.parent / f"{input_path.stem}_rust{input_path.suffix}"
    else:
        output_file = args.output_file
    
    try:
        # Load weights
        weights_data = load_pytorch_weights(args.input_file)
        
        # Test compatibility if requested
        if args.test:
            test_weights_compatibility(weights_data)
        
        # Convert to Rust format
        rust_weights = convert_to_rust_format(weights_data)
        
        # Save in Rust format
        save_rust_weights(rust_weights, output_file)
        
        print(f"🎉 Successfully converted weights!")
        print(f"📁 Original: {args.input_file}")
        print(f"📁 Rust format: {output_file}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
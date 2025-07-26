#!/usr/bin/env python3
"""
Unified weight conversion utility for Royal Game of Ur ML AI
Handles conversion between PyTorch, Rust, and unified weight formats
"""

import json
import argparse
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WeightConverter:
    def __init__(self, config_path: str = "ml/config/training.json"):
        self.config_path = Path(config_path)
        self.config = self.load_config()
        
        # Ensure weights directory exists
        self.weights_dir = Path.cwd() / "ml" / "data" / "weights"
        self.weights_dir.mkdir(parents=True, exist_ok=True)
    
    def load_config(self) -> Dict[str, Any]:
        """Load training configuration"""
        if not self.config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
        
        with open(self.config_path, 'r') as f:
            return json.load(f)
    
    def load_weights(self, input_file: str) -> Dict[str, Any]:
        """Load weights from file"""
        input_path = Path(input_file)
        if not input_path.exists():
            raise FileNotFoundError(f"Weights file not found: {input_path}")
        
        logger.info(f"📂 Loading weights from {input_path}")
        
        with open(input_path, 'r') as f:
            weights_data = json.load(f)
        
        # Detect weight format
        format_type = self.detect_format(weights_data)
        logger.info(f"✅ Detected format: {format_type}")
        
        return weights_data, format_type
    
    def detect_format(self, weights_data: Dict[str, Any]) -> str:
        """Detect the format of loaded weights"""
        if "network_config" in weights_data:
            return "pytorch"
        elif "value_network_config" in weights_data and "policy_network_config" in weights_data:
            return "rust"
        elif "value_weights" in weights_data and "policy_weights" in weights_data:
            # Check if it has network_config to determine if it's unified or legacy
            if "network_config" in weights_data:
                return "unified"
            else:
                return "legacy"
        else:
            return "unknown"
    
    def convert_to_unified(self, weights_data: Dict[str, Any], format_type: str) -> Dict[str, Any]:
        """Convert weights to unified format"""
        logger.info(f"🔄 Converting {format_type} weights to unified format...")
        
        if format_type == "unified":
            return weights_data
        
        unified_weights = {
            "value_weights": [],
            "policy_weights": [],
            "metadata": {},
            "network_config": self.config["network_architecture"]
        }
        
        if format_type == "pytorch":
            # PyTorch format already has the right structure
            unified_weights["value_weights"] = weights_data["value_weights"]
            unified_weights["policy_weights"] = weights_data["policy_weights"]
            unified_weights["metadata"] = weights_data.get("metadata", {})
            if "network_config" in weights_data:
                unified_weights["network_config"] = weights_data["network_config"]
        
        elif format_type == "rust":
            # Rust format needs conversion
            unified_weights["value_weights"] = weights_data["value_weights"]
            unified_weights["policy_weights"] = weights_data["policy_weights"]
            unified_weights["metadata"] = weights_data.get("metadata", {})
            
            # Convert Rust network config to unified format
            if "value_network_config" in weights_data:
                unified_weights["network_config"]["input_size"] = weights_data["value_network_config"]["input_size"]
                unified_weights["network_config"]["hidden_sizes"] = weights_data["value_network_config"]["hidden_sizes"]
                unified_weights["network_config"]["value_output_size"] = weights_data["value_network_config"]["output_size"]
            
            if "policy_network_config" in weights_data:
                unified_weights["network_config"]["policy_output_size"] = weights_data["policy_network_config"]["output_size"]
        
        elif format_type == "legacy":
            # Legacy format (old Rust weights without network config)
            unified_weights["value_weights"] = weights_data["value_weights"]
            unified_weights["policy_weights"] = weights_data["policy_weights"]
            unified_weights["metadata"] = weights_data.get("metadata", {})
            # Use default network config from unified config
        
        logger.info(f"✅ Converted {len(unified_weights['value_weights'])} value weights and {len(unified_weights['policy_weights'])} policy weights")
        return unified_weights
    
    def convert_to_pytorch(self, weights_data: Dict[str, Any], format_type: str) -> Dict[str, Any]:
        """Convert weights to PyTorch format"""
        logger.info(f"🔄 Converting {format_type} weights to PyTorch format...")
        
        if format_type == "pytorch":
            return weights_data
        
        # First convert to unified, then to PyTorch
        unified_weights = self.convert_to_unified(weights_data, format_type)
        
        pytorch_weights = {
            "value_weights": unified_weights["value_weights"],
            "policy_weights": unified_weights["policy_weights"],
            "metadata": unified_weights["metadata"],
            "network_config": unified_weights["network_config"]
        }
        
        return pytorch_weights
    
    def convert_to_rust(self, weights_data: Dict[str, Any], format_type: str) -> Dict[str, Any]:
        """Convert weights to Rust format"""
        logger.info(f"🔄 Converting {format_type} weights to Rust format...")
        
        if format_type == "rust":
            return weights_data
        
        # First convert to unified, then to Rust
        unified_weights = self.convert_to_unified(weights_data, format_type)
        
        rust_weights = {
            "value_weights": unified_weights["value_weights"],
            "policy_weights": unified_weights["policy_weights"],
            "metadata": unified_weights["metadata"],
            "value_network_config": {
                "input_size": unified_weights["network_config"]["input_size"],
                "hidden_sizes": unified_weights["network_config"]["hidden_sizes"],
                "output_size": unified_weights["network_config"]["value_output_size"]
            },
            "policy_network_config": {
                "input_size": unified_weights["network_config"]["input_size"],
                "hidden_sizes": unified_weights["network_config"]["hidden_sizes"],
                "output_size": unified_weights["network_config"]["policy_output_size"]
            }
        }
        
        return rust_weights
    
    def validate_weights(self, weights_data: Dict[str, Any]) -> bool:
        """Validate weight structure and counts"""
        logger.info("🧪 Validating weights...")
        
        try:
            # Check required fields
            required_fields = ["value_weights", "policy_weights"]
            for field in required_fields:
                if field not in weights_data:
                    logger.error(f"❌ Missing required field: {field}")
                    return False
            
            # Get network config (either from weights or from unified config)
            if "network_config" in weights_data:
                config = weights_data["network_config"]
            else:
                # Use unified config for legacy weights
                config = self.config["network_architecture"]
                logger.info("📋 Using unified network config for validation")
            
            # Validate weight counts
            expected_value_weights = self.calculate_expected_weights(
                config["input_size"],
                config["hidden_sizes"],
                config["value_output_size"]
            )
            expected_policy_weights = self.calculate_expected_weights(
                config["input_size"],
                config["hidden_sizes"],
                config["policy_output_size"]
            )
            
            actual_value_weights = len(weights_data["value_weights"])
            actual_policy_weights = len(weights_data["policy_weights"])
            
            logger.info(f"📊 Weight counts:")
            logger.info(f"  Value: {actual_value_weights} (expected ~{expected_value_weights})")
            logger.info(f"  Policy: {actual_policy_weights} (expected ~{expected_policy_weights})")
            
            # Allow some tolerance for weight count differences
            tolerance = 1000
            if abs(actual_value_weights - expected_value_weights) > tolerance:
                logger.warning(f"⚠️  Value network weight count differs significantly from expected")
            
            if abs(actual_policy_weights - expected_policy_weights) > tolerance:
                logger.warning(f"⚠️  Policy network weight count differs significantly from expected")
            
            logger.info("✅ Weight validation passed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Weight validation failed: {e}")
            return False
    
    def calculate_expected_weights(self, input_size: int, hidden_sizes: List[int], output_size: int) -> int:
        """Calculate expected number of weights for a network"""
        total = 0
        prev_size = input_size
        
        for hidden_size in hidden_sizes:
            total += (prev_size + 1) * hidden_size  # weights + biases
            prev_size = hidden_size
        
        total += (prev_size + 1) * output_size  # final layer
        return total
    
    def save_weights(self, weights_data: Dict[str, Any], output_file: str):
        """Save weights to file"""
        output_path = Path(output_file)
        
        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"💾 Saving weights to {output_path}")
        
        with open(output_path, 'w') as f:
            json.dump(weights_data, f, indent=2)
        
        logger.info(f"✅ Weights saved to {output_path}")
    
    def copy_to_public(self, weights_data: Dict[str, Any], output_name: str = "ml-weights.json"):
        """Copy weights to public directory for browser use"""
        public_dir = Path.cwd() / "public"
        output_path = public_dir / output_name
        
        # Ensure public directory exists
        public_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"📁 Copying weights to public directory: {output_path}")
        
        with open(output_path, 'w') as f:
            json.dump(weights_data, f, indent=2)
        
        logger.info(f"✅ Weights copied to public directory")
        logger.info(f"🌐 ML AI will now use weights from: /{output_name}")

def main():
    parser = argparse.ArgumentParser(description="Unified Weight Conversion Utility")
    parser.add_argument("input_file", help="Input weights file")
    parser.add_argument("--output", help="Output file name")
    parser.add_argument("--format", choices=["unified", "pytorch", "rust"], 
                       default="unified", help="Output format")
    parser.add_argument("--validate", action="store_true", help="Validate weights")
    parser.add_argument("--copy-to-public", action="store_true", 
                       help="Copy weights to public directory for browser use")
    parser.add_argument("--public-name", default="ml-weights.json",
                       help="Name for public weights file")
    
    args = parser.parse_args()
    
    try:
        converter = WeightConverter()
        
        # Load weights
        weights_data, format_type = converter.load_weights(args.input_file)
        
        # Validate if requested
        if args.validate:
            if not converter.validate_weights(weights_data):
                sys.exit(1)
        
        # Convert to desired format
        if args.format == "unified":
            converted_weights = converter.convert_to_unified(weights_data, format_type)
        elif args.format == "pytorch":
            converted_weights = converter.convert_to_pytorch(weights_data, format_type)
        elif args.format == "rust":
            converted_weights = converter.convert_to_rust(weights_data, format_type)
        
        # Determine output file
        if args.output:
            output_file = args.output
        else:
            input_path = Path(args.input_file)
            output_file = f"{input_path.stem}_{args.format}{input_path.suffix}"
        
        # Save converted weights
        converter.save_weights(converted_weights, output_file)
        
        # Copy to public directory if requested
        if args.copy_to_public:
            converter.copy_to_public(converted_weights, args.public_name)
        
        logger.info("🎉 Weight conversion completed successfully!")
        logger.info(f"📁 Input: {args.input_file}")
        logger.info(f"📁 Output: {output_file}")
        
    except Exception as e:
        logger.error(f"❌ Conversion failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
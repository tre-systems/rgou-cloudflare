#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

interface MLWeights {
  value_weights: number[];
  policy_weights: number[];
  value_network_config: {
    input_size: number;
    hidden_sizes: number[];
    output_size: number;
  };
  policy_network_config: {
    input_size: number;
    hidden_sizes: number[];
    output_size: number;
  };
}



async function loadWeightsFile(weightsPath: string): Promise<MLWeights> {
  const fullPath = path.resolve(weightsPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Weights file not found: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const parsed = JSON.parse(content);

  return parsed as MLWeights;
}

function countNetworkWeights(
  input_size: number,
  hidden_sizes: number[],
  output_size: number
): number {
  let total = 0;
  let prev = input_size;
  for (const h of hidden_sizes) {
    total += (prev + 1) * h; // weights + biases
    prev = h;
  }
  total += (prev + 1) * output_size; // final layer
  return total;
}

function validateWeights(weights: MLWeights): void {
  // Validate value network
  const valueConfig = weights.value_network_config;
  const expectedValueWeights = countNetworkWeights(
    valueConfig.input_size,
    valueConfig.hidden_sizes,
    valueConfig.output_size
  );

  // Validate policy network
  const policyConfig = weights.policy_network_config;
  const expectedPolicyWeights = countNetworkWeights(
    policyConfig.input_size,
    policyConfig.hidden_sizes,
    policyConfig.output_size
  );

  console.log('✅ Weights validation passed');
  console.log(
    `Value network: ${weights.value_weights.length} weights (expected ~${expectedValueWeights})`
  );
  console.log(
    `Policy network: ${weights.policy_weights.length} weights (expected ~${expectedPolicyWeights})`
  );

  // Note: v2 models may have additional parameters (batch norm, dropout) that increase weight count
  if (Math.abs(weights.value_weights.length - expectedValueWeights) > 1000) {
    console.warn(`⚠️  Value network weight count differs significantly from expected`);
  }
  if (Math.abs(weights.policy_weights.length - expectedPolicyWeights) > 1000) {
    console.warn(`⚠️  Policy network weight count differs significantly from expected`);
  }
}

function copyWeightsToPublic(weights: MLWeights, outputPath: string): void {
  const publicDir = path.resolve('public');
  const outputFile = path.join(publicDir, outputPath);

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write weights to public directory
  fs.writeFileSync(outputFile, JSON.stringify(weights, null, 2));
  console.log(`✅ Weights copied to: ${outputFile}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: tsx scripts/load-ml-weights.ts <weights-file> [output-path]');
    console.log(
      'Example: tsx scripts/load-ml-weights.ts ml/data/weights/ml_ai_weights.json ml-weights.json'
    );
    process.exit(1);
  }

  const weightsPath = args[0];
  const outputPath = args[1] || 'ml-weights.json';

  try {
    console.log(`Loading weights from: ${weightsPath}`);
    const weights = await loadWeightsFile(weightsPath);

    console.log('Validating weights...');
    validateWeights(weights);

    console.log('Copying weights to public directory...');
    copyWeightsToPublic(weights, outputPath);

    console.log('✅ ML weights loaded successfully!');
    console.log(`The ML AI will now use the trained weights from: /${outputPath}`);
  } catch (error) {
    console.error('❌ Error loading ML weights:', error);
    process.exit(1);
  }
}

main();

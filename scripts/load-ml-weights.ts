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
  return JSON.parse(content) as MLWeights;
}

function validateWeights(weights: MLWeights): void {
  // Validate value network
  const valueConfig = weights.value_network_config;
  const expectedValueWeights =
    (valueConfig.input_size + 1) * valueConfig.hidden_sizes[0] +
    (valueConfig.hidden_sizes[0] + 1) * valueConfig.hidden_sizes[1] +
    (valueConfig.hidden_sizes[1] + 1) * valueConfig.output_size;

  if (weights.value_weights.length !== expectedValueWeights) {
    throw new Error(
      `Value network weights mismatch. Expected ${expectedValueWeights}, got ${weights.value_weights.length}`
    );
  }

  // Validate policy network
  const policyConfig = weights.policy_network_config;
  const expectedPolicyWeights =
    (policyConfig.input_size + 1) * policyConfig.hidden_sizes[0] +
    (policyConfig.hidden_sizes[0] + 1) * policyConfig.hidden_sizes[1] +
    (policyConfig.hidden_sizes[1] + 1) * policyConfig.output_size;

  if (weights.policy_weights.length !== expectedPolicyWeights) {
    throw new Error(
      `Policy network weights mismatch. Expected ${expectedPolicyWeights}, got ${weights.policy_weights.length}`
    );
  }

  console.log('✅ Weights validation passed');
  console.log(`Value network: ${weights.value_weights.length} weights`);
  console.log(`Policy network: ${weights.policy_weights.length} weights`);
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
    console.log('Example: tsx scripts/load-ml-weights.ts ml_ai_weights.json ml-weights.json');
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

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      // Ignore generated WASM files
      'src/lib/wasm/**/*',
      // Ignore build output
      '.next/**/*',
      '.open-next/**/*',
      'coverage/**/*',
      'out/**/*',
      'dist/**/*',
      'playwright-report/**/*',
      'test-results/**/*',
      // Ignore node_modules
      'node_modules/**/*',
      '.venv/',
      // Ignore generated framework and WASM artifacts
      'next-env.d.ts',
      'public/sw.js',
      'public/wasm/**/*',
      'worker/rust_ai_core/pkg/**/*',
      'worker/rust_ai_core/target/**/*',
    ],
  },
  {
    files: ['src/lib/__tests__/**/*.ts', 'src/lib/__tests__/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];

export default eslintConfig;

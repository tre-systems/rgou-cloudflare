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
      'out/**/*',
      'dist/**/*',
      // Ignore node_modules
      'node_modules/**/*',
      '.venv/',
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
];

export default eslintConfig;

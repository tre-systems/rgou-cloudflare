const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST;

const config = {
  plugins: isTest ? [] : ['@tailwindcss/postcss'],
};

export default config;

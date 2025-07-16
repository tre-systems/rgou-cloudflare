// Simple version management - update these when you make significant changes
export const VERSIONS = {
  // Main application version - increment this for any significant changes
  app: '1.0.0',

  // AI versions - increment when AI logic changes
  classicAI: '1.0.0', // Expectiminimax algorithm version
  mlAI: '1.0.0', // Neural network model version

  // Game version - increment when game rules or logic changes
  game: '1.0.0',
} as const;

// Helper function to get all versions as a string
export function getVersionString(): string {
  return `app:${VERSIONS.app},classic:${VERSIONS.classicAI},ml:${VERSIONS.mlAI},game:${VERSIONS.game}`;
}

// Helper function to get version for database storage
export function getVersionsForDB() {
  return {
    gameVersion: VERSIONS.app,
    ai1Version: VERSIONS.classicAI,
    ai2Version: VERSIONS.mlAI,
  };
}

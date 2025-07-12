/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
}

declare global {
  var DB: D1Database;
}

declare module '/wasm/rgou_ai_core.js' {
  export function get_ai_move_wasm(gameStateJson: string): string;
  export function roll_dice_wasm(): number;
  export default function init(): Promise<void>;
}

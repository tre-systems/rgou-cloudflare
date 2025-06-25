// TypeScript declarations for WASM modules
declare module "../pkg/rgou_ai_wasm" {
  export default function init(wasm: WebAssembly.Module): Promise<void>;
  export class RustGameState {
    constructor();
    update_game_state(
      p1: Int8Array,
      p2: Int8Array,
      player: number,
      dice: number
    ): void;
    get_ai_move(): number;
    evaluate_position(): number;
  }
}

declare module "../pkg/rgou_ai_wasm_bg.wasm" {
  const wasm: WebAssembly.Module;
  export default wasm;
}

// Cloudflare Workers console API
declare const console: {
  log: (message: string) => void;
  warn: (message: string, ...args: unknown[]) => void;
};

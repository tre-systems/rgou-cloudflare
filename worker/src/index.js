import init, {
  get_ai_move_from_json,
  evaluate_position_from_json,
} from "../pkg/rgou_ai_wasm";
import wasm from "../pkg/rgou_ai_wasm_bg.wasm";

const wasmReady = init(wasm);

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    console.log(`[Worker] Received request: ${request.method} ${request.url}`);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Check for API secret on other requests
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${env.API_SECRET}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // AI move endpoint
    if (url.pathname === "/ai-move" && request.method === "POST") {
      const handlerStart = Date.now();
      try {
        const wasmReadyStart = Date.now();
        await wasmReady;
        const wasmReadyEnd = Date.now();

        const gameState = await request.json();

        if (gameState.currentPlayer !== "player2") {
          return new Response(JSON.stringify({ error: "Not AI turn" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }

        const aiSetupStart = Date.now();
        const gameStateJson = JSON.stringify(gameState);
        const aiSetupEnd = Date.now();

        const aiMoveStart = Date.now();
        const aiMove = get_ai_move_from_json(gameStateJson);
        const evaluation = evaluate_position_from_json(gameStateJson);
        const aiMoveEnd = Date.now();
        const handlerEnd = Date.now();

        const timings = {
          wasmInitialization: wasmReadyEnd - wasmReadyStart,
          aiSetup: aiSetupEnd - aiSetupStart,
          aiMoveCalculation: aiMoveEnd - aiMoveStart,
          totalHandlerTime: handlerEnd - handlerStart,
        };

        console.log(`[Worker] Timings: ${JSON.stringify(timings)}`);

        return new Response(
          JSON.stringify({
            move: aiMove,
            evaluation: evaluation,
            thinking: `Rust WASM AI has decided.`,
            timings: timings,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      } catch (error) {
        console.error("[Worker] Error getting AI move:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to get AI move",
            message: error.message,
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "1.2.0-rust-wasm",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Fallback for other routes
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  },
};

export default worker;

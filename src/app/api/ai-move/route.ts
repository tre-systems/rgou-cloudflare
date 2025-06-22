import { type NextRequest, NextResponse } from "next/server";
import { type GameState } from "@/lib/types";

const AI_WORKER_URL =
  process.env.NEXT_PUBLIC_AI_WORKER_URL ||
  "https://rgou-ai-worker.rob-gilks.workers.dev";
const AI_WORKER_SECRET = process.env.AI_WORKER_SECRET;

export async function POST(request: NextRequest) {
  if (!AI_WORKER_SECRET) {
    console.error("AI_WORKER_SECRET is not set.");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  try {
    const gameState: GameState = await request.json();
    const workerUrl = `${AI_WORKER_URL}/ai-move`;

    const workerResponse = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_WORKER_SECRET}`,
      },
      body: JSON.stringify(gameState),
    });

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      console.error("AI worker error:", errorText);
      return NextResponse.json(
        { error: "Failed to get AI move from worker." },
        { status: workerResponse.status }
      );
    }

    const data = await workerResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in AI proxy route:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

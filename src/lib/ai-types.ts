export interface MoveEvaluation {
  pieceIndex: number;
  score: number;
  moveType: string;
  fromSquare: number;
  toSquare: number | null;
}

export interface Diagnostics {
  searchDepth: number;
  validMoves: number[];
  moveEvaluations: MoveEvaluation[];
  transpositionHits: number;
  nodesEvaluated: number;
}

export interface Timings {
  aiMoveCalculation: number;
  totalHandlerTime: number;
}

export interface AIResponse {
  move: number | null;
  evaluation: number;
  thinking: string;
  timings: Timings;
  diagnostics: Diagnostics;
  aiType: 'client' | 'server' | 'fallback';
}

export type ServerAIResponse = Omit<AIResponse, 'aiType'>;

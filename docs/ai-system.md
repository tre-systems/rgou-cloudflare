# AI System Documentation

**See Also:** [ML AI System (Neural Network)](./ml-ai-system.md) — for details on the neural network-based AI and training pipeline.

## Overview

The Royal Game of Ur features a sophisticated dual-AI engine built in Rust that provides both server-side and client-side gameplay. The AI uses advanced game theory algorithms to provide challenging and intelligent gameplay while maintaining fast response times.

## Core AI Architecture

### Dual-AI System

The project implements a unique dual-AI architecture:

- **Client AI (Default)**: Rust code compiled to WebAssembly, running in the browser
  - Search depth: 6 plies
  - Advantages: Instant response, offline capability, stronger play
  - Location: `worker/rust_ai_core/src/wasm_api.rs`

- **Server AI (Fallback)**: Rust code running on Cloudflare Workers
  - Search depth: 4 plies
  - Advantages: Consistent performance, network-based
  - Location: `worker/src/lib.rs`

- **ML AI (Experimental)**: See [ML AI System](./ml-ai-system.md) for the neural network-based AI, which learns from data and offers a different approach to move selection and strategy.

Both AIs share the same core logic from `worker/rust_ai_core/src/lib.rs`, ensuring identical strategic behavior.

## AI Algorithm: Expectiminimax

The AI uses the **Expectiminimax** algorithm, an extension of the minimax algorithm for games with chance elements (dice rolls).

### Algorithm Overview

Expectiminimax combines:

- **Minimax**: For deterministic game states
- **Expectation nodes**: For probabilistic dice rolls
- **Alpha-beta pruning**: For search optimization

### Mathematical Foundation

The expectiminimax value is calculated as:

```
EMM(node) = {
  max(EMM(child))                    if node is a max node
  min(EMM(child))                    if node is a min node
  Σ P(child) × EMM(child)           if node is a chance node
  evaluation(node)                   if node is a leaf node
}
```

Where:

- **Max nodes**: AI's turn to move
- **Min nodes**: Player's turn to move
- **Chance nodes**: Dice roll outcomes
- **P(child)**: Probability of each dice roll

### Dice Roll Probabilities

The Royal Game of Ur uses 4 tetrahedral dice (binary dice), resulting in these probabilities:

| Roll | Probability | Calculation |
| ---- | ----------- | ----------- |
| 0    | 1/16        | (1/2)⁴      |
| 1    | 4/16        | 4 × (1/2)⁴  |
| 2    | 6/16        | 6 × (1/2)⁴  |
| 3    | 4/16        | 4 × (1/2)⁴  |
| 4    | 1/16        | (1/2)⁴      |

### Implementation Details

```rust
const PROBABILITIES: [f32; 5] = [1.0/16.0, 4.0/16.0, 6.0/16.0, 4.0/16.0, 1.0/16.0];

for (roll, &prob) in PROBABILITIES.iter().enumerate() {
    if prob == 0.0 { continue; }

    let mut next_state = state.clone();
    next_state.dice_roll = roll as u8;

    let score = if roll == 0 {
        // Pass turn on roll of 0
        next_state.current_player = state.current_player.opponent();
        self.expectiminimax(&next_state, depth - 1, alpha, beta)
    } else {
        // Evaluate moves for this roll
        self.evaluate_moves(&next_state, depth, alpha, beta)
    };

    expected_score += score * prob;
}
```

## Position Evaluation Function

The AI uses a sophisticated evaluation function that considers multiple strategic factors:

### Scoring Components

| Component             | Weight  | Description                               |
| --------------------- | ------- | ----------------------------------------- |
| **Win Detection**     | ±10,000 | Immediate win/loss detection              |
| **Finished Pieces**   | 1,000   | Bonus for pieces that completed the race  |
| **Board Control**     | 35      | Bonus for having more pieces on board     |
| **Position Weight**   | 1.5     | Progress along the track                  |
| **Safety Bonus**      | 25      | Pieces on rosette squares                 |
| **Rosette Control**   | 40      | Strategic control of rosette squares      |
| **Advancement**       | 5       | Progress through center lane              |
| **Center Lane Bonus** | 2       | Additional bonus for center lane position |

### Evaluation Function Implementation

```rust
pub fn evaluate(&self) -> i32 {
    let mut score = 0i32;

    // Check for immediate wins
    let p1_finished = self.player1_pieces.iter()
        .filter(|p| p.square == 20).count() as i32;
    let p2_finished = self.player2_pieces.iter()
        .filter(|p| p.square == 20).count() as i32;

    if p1_finished == PIECES_PER_PLAYER as i32 {
        return -WIN_SCORE;  // Player 1 wins
    }
    if p2_finished == PIECES_PER_PLAYER as i32 {
        return WIN_SCORE;   // Player 2 (AI) wins
    }

    // Finished pieces bonus
    score += (p2_finished - p1_finished) * FINISHED_PIECE_VALUE;

    // Board control (captured pieces)
    let p1_on_board = self.player1_pieces.iter()
        .filter(|p| p.square > -1).count() as i32;
    let p2_on_board = self.player2_pieces.iter()
        .filter(|p| p.square > -1).count() as i32;
    score += (p2_on_board - p1_on_board) * CAPTURE_BONUS;

    // Position and strategic evaluation
    let (p1_pos_score, p1_strategic_score) = self.evaluate_player_position(Player::Player1);
    let (p2_pos_score, p2_strategic_score) = self.evaluate_player_position(Player::Player2);

    score += (p2_pos_score - p1_pos_score) * POSITION_WEIGHT / 10;
    score += p2_strategic_score - p1_strategic_score;
    score += self.evaluate_board_control();

    score
}
```

### Strategic Position Evaluation

The AI evaluates piece positions based on:

1. **Track Progress**: Pieces further along their track receive higher scores
2. **Rosette Safety**: Pieces on rosette squares are safe from capture
3. **Center Lane Control**: Pieces in the shared center lane (positions 4-11) receive bonuses
4. **End Game Proximity**: Pieces near the finish line receive increased bonuses

## Search Optimization Techniques

### Alpha-Beta Pruning

The AI implements alpha-beta pruning to reduce the search space:

```rust
fn evaluate_moves(&mut self, state: &GameState, depth: u8, mut alpha: f32, mut beta: f32) -> f32 {
    let is_maximizing = state.current_player == Player::Player2;
    let mut best_score = if is_maximizing { f32::MIN } else { f32::MAX };

    for &m in &valid_moves {
        let mut next_state = state.clone();
        next_state.make_move(m).unwrap();
        let score = self.expectiminimax(&next_state, depth - 1, alpha, beta);

        if is_maximizing {
            best_score = best_score.max(score);
            alpha = alpha.max(best_score);
            if beta <= alpha { break; }  // Beta cutoff
        } else {
            best_score = best_score.min(score);
            beta = beta.min(best_score);
            if beta <= alpha { break; }  // Alpha cutoff
        }
    }
    best_score
}
```

### Transposition Table

The AI uses a hash table to cache previously evaluated positions:

```rust
struct TranspositionEntry {
    evaluation: f32,
    depth: u8,
}

pub struct AI {
    transposition_table: HashMap<u64, TranspositionEntry>,
    pub nodes_evaluated: u32,
    pub transposition_hits: u32,
}
```

### Quiescence Search

To avoid horizon effects, the AI implements quiescence search that continues evaluating tactical sequences even at leaf nodes:

```rust
fn quiescence_search(&mut self, state: &GameState, depth: u8, mut alpha: f32, mut beta: f32) -> f32 {
    let stand_pat = state.evaluate() as f32;

    if depth == 0 { return stand_pat; }

    // Only evaluate capturing moves in quiescence search
    for &m in &valid_moves {
        if is_capture {
            // Continue search for capturing moves
            let score = self.quiescence_search(&next_state, depth - 1, alpha, beta);
            // Update alpha/beta and best score
        }
    }
    best_score
}
```

## Performance Characteristics

### Search Depth vs Performance

| AI Type   | Search Depth | Nodes Evaluated | Response Time | Strength |
| --------- | ------------ | --------------- | ------------- | -------- |
| Client AI | 6 plies      | ~10,000-50,000  | <100ms        | Strong   |
| Server AI | 4 plies      | ~1,000-10,000   | <50ms         | Medium   |

### Memory Usage

- **Transposition Table**: ~1-5MB for typical games
- **WASM Module**: ~500KB compiled size
- **Runtime Memory**: <10MB for AI calculations

## Academic References

### Game Theory and AI

1. **Russell, S., & Norvig, P.** (2021). _Artificial Intelligence: A Modern Approach_ (4th ed.). Pearson.
   - Chapter 6: Adversarial Search and Games
   - Section 6.5: Stochastic Games

2. **Ballard, B. W.** (1983). The \*-minimax search procedure for trees containing chance nodes. _Artificial Intelligence_, 21(3), 327-350.

3. **Finkel, I. L.** (2007). On the rules for the Royal Game of Ur. In I. L. Finkel (Ed.), _Ancient Board Games in Perspective_ (pp. 16-32). British Museum Press.

### Historical Context

The Royal Game of Ur is one of the oldest known board games, dating back to approximately 2500 BCE. The rules were reconstructed by Irving Finkel at the British Museum based on archaeological findings and cuneiform texts.

## Implementation Details

### Rust Core (`worker/rust_ai_core/src/lib.rs`)

The core AI logic is implemented in Rust for maximum performance:

```rust
pub struct AI {
    transposition_table: HashMap<u64, TranspositionEntry>,
    pub nodes_evaluated: u32,
    pub transposition_hits: u32,
}

impl AI {
    pub fn new() -> Self {
        Self {
            transposition_table: HashMap::new(),
            nodes_evaluated: 0,
            transposition_hits: 0,
        }
    }

    pub fn get_best_move(&mut self, state: &GameState, depth: u8) -> Option<usize> {
        // Implementation of expectiminimax search
    }
}
```

### WebAssembly Interface (`worker/rust_ai_core/src/wasm_api.rs`)

The WASM interface provides a JavaScript-compatible API:

```rust
#[wasm_bindgen]
pub fn get_ai_move_wasm(game_state_request_js: JsValue) -> Result<JsValue, JsValue> {
    let game_state: GameState = game_state_request_js.into_serde().unwrap();
    let mut ai = AI::new();
    let best_move = ai.get_best_move(&game_state, 6);

    let response = AIResponse {
        move_index: best_move,
        evaluation: ai.get_last_evaluation(),
        nodes_evaluated: ai.nodes_evaluated,
        transposition_hits: ai.transposition_hits,
    };

    Ok(JsValue::from_serde(&response).unwrap())
}
```

### Cloudflare Worker (`worker/src/lib.rs`)

The server-side AI provides a REST API:

```rust
#[event(fetch)]
async fn main(req: Request, env: Env, _ctx: worker::Context) -> Result<Response> {
    let router = Router::new();

    router
        .post_async("/ai-move", |req, ctx| handle_ai_move(req, ctx))
        .get("/health", |_req, _ctx| handle_health())
        .run(req, env)
        .await
}

async fn handle_ai_move(req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let game_state: GameState = req.json().await?;
    let mut ai = AI::new();
    let best_move = ai.get_best_move(&game_state, 4);

    let response = AIResponse {
        move_index: best_move,
        evaluation: ai.get_last_evaluation(),
        nodes_evaluated: ai.nodes_evaluated,
        transposition_hits: ai.transposition_hits,
    };

    Response::from_json(&response)
}
```

## Testing and Validation

### AI vs AI Simulation

The AI is validated through self-play simulations:

```rust
#[test]
fn test_ai_vs_ai() {
    let mut ai1 = AI::new();
    let mut ai2 = AI::new();

    for _ in 0..100 {
        let winner = play_game(&mut ai1, &mut ai2);
        assert!(winner.is_some(), "Game should always have a winner");
    }
}
```

### Performance Benchmarks

Regular performance testing ensures consistent behavior:

```rust
#[test]
fn test_ai_performance() {
    let mut ai = AI::new();
    let state = GameState::new();

    let start = std::time::Instant::now();
    let _move = ai.get_best_move(&state, 6);
    let duration = start.elapsed();

    assert!(duration.as_millis() < 100, "AI should respond within 100ms");
}
```

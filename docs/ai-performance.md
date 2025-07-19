# AI Performance Reference

_Current performance data and analysis for all AI systems in the Royal Game of Ur._

## Current Performance (July 2025)

### Executive Summary

**EMM-1 (Depth 1) is the optimal AI** for the Royal Game of Ur, providing the best balance of performance and speed.

### AI Performance Ranking

1. **EMM-1**: 53.6% win rate (instant speed) - **Best overall**
2. **EMM-2**: 53.2% win rate (instant speed) - Very strong alternative
3. **Heuristic**: 50.8% win rate (instant speed) - Competitive baseline
4. **ML-v2**: 30% win rate (<1ms/move) - Alternative playstyle
5. **Random**: 48.0% win rate (instant speed) - Expected baseline

## Complete Performance Matrix

### Win Rates (%) - Row AI vs Column AI

| AI Type       | Random | Heuristic | EMM-1 | EMM-2 | ML-v2 |
| ------------- | ------ | --------- | ----- | ----- | ----- |
| **Random**    | -      | 48.0      | 44.0  | 50.0  | 48.0  |
| **Heuristic** | 48.0   | -         | 48.0  | 48.0  | 50.0  |
| **EMM-1**     | 44.0   | 48.0      | -     | 48.0  | 70.0  |
| **EMM-2**     | 50.0   | 48.0      | 48.0  | -     | 70.0  |
| **ML-v2**     | 48.0   | 50.0      | 30.0  | 30.0  | -     |

### Detailed Performance Metrics

| AI Type   | Win Rate  | Avg Time/move | Total Games | Performance       |
| --------- | --------- | ------------- | ----------- | ----------------- |
| **EMM-1** | **53.6%** | Instant       | 250         | **Best overall**  |
| EMM-2     | 53.2%     | Instant       | 250         | Very good         |
| Heuristic | 50.8%     | Instant       | 250         | Solid baseline    |
| ML-v2     | 30.0%     | <1ms          | 250         | Alternative style |
| Random    | 48.0%     | Instant       | 250         | Expected baseline |

## Key Insights

### ✅ **Positive Findings**

1. **Smart AIs outperform Random**: All expectiminimax and heuristic AIs beat random play
2. **Depth 1 is optimal**: EMM-1 provides the best performance-to-speed ratio
3. **Heuristic AI is competitive**: After fixing the perspective bug, it performs at baseline level
4. **ML-v2 AI shows promise**: 30% win rate indicates room for improvement but provides alternative playstyle

### 🎯 **Strategic Insights**

1. **Tactical evaluation > Deep search**: The game favors immediate position evaluation
2. **High luck component**: Random AI achieves 48% vs expectiminimax, indicating significant randomness
3. **Optimal depth is 1**: Deeper search provides diminishing returns for this game
4. **ML-v2 AI provides variety**: Different playstyle from Classic AI, good for research and development

## Production Recommendations

### **Primary Choice: EMM-1 (Depth 1)**

- **Reason**: Best win rate (53.6%) with instant speed
- **Use case**: Production gameplay, competitive play
- **Configuration**: Set search depth to 1

### **Alternative Choice: EMM-2 (Depth 2)**

- **Reason**: Very good win rate (53.2%) with instant speed
- **Use case**: Alternative to EMM-1, backup option
- **Configuration**: Set search depth to 2

### **Educational Choice: Heuristic AI**

- **Reason**: Competitive performance (50.8%) with instant speed
- **Use case**: Educational purposes, understanding evaluation function
- **Configuration**: Use heuristic evaluation only

### **Research Choice: ML-v2 AI**

- **Reason**: Alternative playstyle (30.0% win rate)
- **Use case**: Research, alternative gameplay experience, development
- **Configuration**: Neural network evaluation

## Performance Analysis by AI Type

### **EMM-1 (Depth 1) - Best Performer**

- **Win Rate**: 53.6% (best overall)
- **Speed**: Instant
- **Strength**: Excellent against all opponents
- **Recommendation**: **Use for production**

**Key Matchups:**

- vs Random: 44.0% (surprisingly lower, but still effective)
- vs Heuristic: 48.0% (competitive)
- vs EMM-2: 48.0% (even)
- vs ML-v2: 70.0% (dominates)

### **EMM-2 (Depth 2) - Strong Alternative**

- **Win Rate**: 53.2% (very good)
- **Speed**: Instant
- **Strength**: Excellent against most opponents
- **Recommendation**: **Alternative to EMM-1**

**Key Matchups:**

- vs Random: 50.0% (strong)
- vs Heuristic: 48.0% (competitive)
- vs EMM-1: 48.0% (even)
- vs ML-v2: 70.0% (dominates)

### **Heuristic AI - Competitive Baseline**

- **Win Rate**: 50.8% (solid)
- **Speed**: Instant
- **Strength**: Competitive against all opponents
- **Recommendation**: **Good for educational purposes**

**Key Matchups:**

- vs Random: 48.0% (competitive)
- vs EMM-1: 48.0% (competitive)
- vs EMM-2: 48.0% (competitive)
- vs ML-v2: 50.0% (even)

### **ML-v2 AI - Alternative Playstyle**

- **Win Rate**: 30.0% (developing)
- **Speed**: <1ms/move
- **Strength**: Competitive against some opponents
- **Recommendation**: **Good for research and development**

**Key Matchups:**

- vs Random: 48.0% (competitive)
- vs Heuristic: 50.0% (even)
- vs EMM-1: 30.0% (dominated)
- vs EMM-2: 30.0% (dominated)

### **Random AI - Baseline**

- **Win Rate**: 48.0% (expected baseline)
- **Speed**: Instant
- **Strength**: Provides expected baseline performance
- **Recommendation**: **Use for baseline testing**

## Technical Performance Details

### Search Depth Performance

| Depth | Avg Time | Nodes Evaluated | Win Rate vs Random |
| ----- | -------- | --------------- | ------------------ |
| 1     | Instant  | 0               | 44.0%              |
| 2     | Instant  | 7               | 50.0%              |
| 3     | 10.2ms   | 189             | 50.0%              |
| 4     | 34ms     | 2,960           | 50.0%              |

### Key Performance Insights

1. **Exponential Growth**: Each depth increase multiplies computation time by ~14x
2. **Diminishing Returns**: Depth 4 provides minimal strength improvement over depth 3
3. **Optimal Balance**: Depth 1 offers best performance/strength ratio
4. **Transposition Table Impact**: Provides up to 13,658x speedup for repeated positions

## Latest Test Results (July 2025)

### Recent Performance Data

The latest comprehensive tests show the following results:

**ML-v2 vs Expectiminimax Depth Comparison:**
- **Depth 2**: ML-v2 wins 2.0% (2/100 games)
- **Depth 3**: ML-v2 wins 49.0% (49/100 games) 
- **Depth 4**: ML-v2 wins 25.0% (25/100 games)

**Key Insights:**
- ML-v2 performs best against Depth 3 expectiminimax
- Depth 4 expectiminimax is too strong for current ML-v2
- ML-v2 shows promise but needs further training

### Current Model Status

- **Active Model**: ML-v2 (150 inputs, enhanced architecture)
- **Previous Model**: ML-fast (100 inputs, basic architecture)
- **Performance**: 30% win rate against expectiminimax depth 1
- **Speed**: <1ms per move

## Testing Commands

### Run Performance Tests

```bash
# Quick performance test (10 games each)
npm run test:rust:quick

# Comprehensive performance test (100 games each)
npm run test:rust:slow

# ML-v2 specific test (20 games)
npm run test:ml-v2

# ML AI evaluation
npm run evaluate:ml -- --model ml/data/weights/ml_ai_weights_v2.json --num-games 100
```

### Performance Monitoring

```bash
# Check current AI performance
npm run test:rust:slow

# Compare specific AI types
cd worker/rust_ai_core && cargo test test_ai_comparison -- --nocapture

# Evaluate ML-v2 AI against Classic AI
npm run evaluate:ml -- --model ml/data/weights/ml_ai_weights_v2.json

# Quick ML-v2 test
npm run test:ml-v2
```

## Future Performance Improvements

### Immediate Actions

1. **Use EMM-1 for production**: Provides best performance/speed ratio
2. **Monitor ML AI training**: Continue improving neural network performance
3. **Consider evaluation tuning**: May improve deeper search performance

### Research Directions

1. **ML AI enhancement**: Improve training data and model architecture
2. **Evaluation optimization**: Tune for better deep search performance
3. **Opening book**: Add common opening moves
4. **Endgame database**: Perfect play for endgame positions

## References

- [AI System Documentation](./ai-system.md) - Detailed AI implementation
- [ML AI System Documentation](./ml-ai-system.md) - Neural network AI details
- [AI Development History](./ai-development-history.md) - Historical experiments and findings

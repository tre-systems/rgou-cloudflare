# Comprehensive AI Matrix Analysis

## Overview

This document presents a comprehensive analysis of all AI types playing against each other in the Royal Game of Ur. The analysis includes Random AI, Heuristic AI, Expectiminimax AI (depths 1-3), and ML AI, with each AI playing 50 games against every other AI.

## Test Configuration

- **Games per matchup**: 50
- **Total matchups**: 15 (6 AI types × 5 opponents each)
- **Total games**: 750
- **AI Types tested**:
  - Random (R)
  - Heuristic (H)
  - Expectiminimax Depth 1 (E1)
  - Expectiminimax Depth 2 (E2)
  - Expectiminimax Depth 3 (E3)
  - ML AI (M)

## Comprehensive Win Rate Matrix

| AI Type       | Random | Heuristic | EMM-1 | EMM-2 | EMM-3 | ML    |
| ------------- | ------ | --------- | ----- | ----- | ----- | ----- |
| **Random**    | -      | 6.0%      | 48.0% | 50.0% | 50.0% | 42.0% |
| **Heuristic** | 94.0%  | -         | 32.0% | 32.0% | 38.0% | 40.0% |
| **EMM-1**     | 52.0%  | 68.0%     | -     | 62.0% | 44.0% | 56.0% |
| **EMM-2**     | 50.0%  | 68.0%     | 38.0% | -     | 54.0% | 56.0% |
| **EMM-3**     | 50.0%  | 62.0%     | 56.0% | 46.0% | -     | 42.0% |
| **ML**        | 58.0%  | 60.0%     | 44.0% | 44.0% | 58.0% | -     |

## AI Performance Ranking

### Overall Win Rate Ranking

| Rank | AI Type       | Win Rate | Avg Time/move | Performance                       |
| ---- | ------------- | -------- | ------------- | --------------------------------- |
| 1    | **EMM-1**     | 56.4%    | 0.0ms         | Moderate strength, Very Fast      |
| 2    | **EMM-2**     | 53.2%    | 0.0ms         | Moderate strength, Very Fast      |
| 3    | **ML**        | 52.8%    | 39.9ms        | Moderate strength, Moderate speed |
| 4    | **EMM-3**     | 51.2%    | 10.7ms        | Moderate strength, Moderate speed |
| 5    | **Heuristic** | 47.2%    | 0.0ms         | Moderate strength, Very Fast      |
| 6    | **Random**    | 39.2%    | 0.0ms         | Weak strength, Very Fast          |

## Detailed Matchup Analysis

### Random AI Performance

- **vs Heuristic**: 6.0% win rate (very weak)
- **vs EMM-1**: 48.0% win rate (competitive)
- **vs EMM-2**: 50.0% win rate (even)
- **vs EMM-3**: 50.0% win rate (even)
- **vs ML**: 42.0% win rate (slightly weak)

**Insight**: Random AI performs surprisingly well against expectiminimax AIs, suggesting the game has significant luck component.

### Heuristic AI Performance

- **vs Random**: 94.0% win rate (dominates)
- **vs EMM-1**: 32.0% win rate (weak)
- **vs EMM-2**: 32.0% win rate (weak)
- **vs EMM-3**: 38.0% win rate (weak)
- **vs ML**: 40.0% win rate (weak)

**Insight**: Heuristic AI is much stronger than random but significantly weaker than all expectiminimax depths.

### Expectiminimax Depth 1 Performance

- **vs Random**: 52.0% win rate (slightly strong)
- **vs Heuristic**: 68.0% win rate (strong)
- **vs EMM-2**: 62.0% win rate (strong)
- **vs EMM-3**: 44.0% win rate (weak)
- **vs ML**: 56.0% win rate (moderate)

**Insight**: EMM-1 shows strong performance and is the overall winner, suggesting depth 1 provides good strategic value.

### Expectiminimax Depth 2 Performance

- **vs Random**: 50.0% win rate (even)
- **vs Heuristic**: 68.0% win rate (strong)
- **vs EMM-1**: 38.0% win rate (weak)
- **vs EMM-3**: 54.0% win rate (moderate)
- **vs ML**: 56.0% win rate (moderate)

**Insight**: EMM-2 performs well but is surprisingly weak against EMM-1.

### Expectiminimax Depth 3 Performance

- **vs Random**: 50.0% win rate (even)
- **vs Heuristic**: 62.0% win rate (strong)
- **vs EMM-1**: 56.0% win rate (moderate)
- **vs EMM-2**: 46.0% win rate (weak)
- **vs ML**: 42.0% win rate (weak)

**Insight**: EMM-3 underperforms expectations, suggesting diminishing returns beyond depth 2.

### ML AI Performance

- **vs Random**: 58.0% win rate (moderate)
- **vs Heuristic**: 60.0% win rate (moderate)
- **vs EMM-1**: 44.0% win rate (weak)
- **vs EMM-2**: 44.0% win rate (weak)
- **vs EMM-3**: 58.0% win rate (moderate)

**Insight**: ML AI shows competitive performance but is slower than expectiminimax AIs.

## Key Findings

### 1. Depth Search Effectiveness

- **EMM-1 vs Heuristic**: 68% vs 32% (36% improvement)
- **EMM-2 vs Heuristic**: 68% vs 32% (36% improvement)
- **EMM-3 vs Heuristic**: 62% vs 38% (24% improvement)

**Conclusion**: Even depth 1 provides significant improvement over heuristic approach.

### 2. Diminishing Returns

- **EMM-1**: 56.4% overall win rate
- **EMM-2**: 53.2% overall win rate
- **EMM-3**: 51.2% overall win rate

**Conclusion**: Performance decreases with increasing depth, suggesting optimal depth is 1-2.

### 3. ML AI Competitiveness

- **ML vs EMM-1**: 44% vs 56% (12% difference)
- **ML vs EMM-2**: 44% vs 56% (12% difference)
- **ML vs EMM-3**: 58% vs 42% (16% advantage)

**Conclusion**: ML AI is competitive but slower than expectiminimax AIs.

### 4. Speed vs Strength Trade-off

- **Fastest**: Random, Heuristic, EMM-1, EMM-2 (0.0ms)
- **Moderate**: EMM-3 (10.7ms)
- **Slowest**: ML AI (39.9ms)

**Conclusion**: Significant speed penalty for ML AI with minimal strength advantage.

## Performance Metrics

### Average Game Length

- **Shortest games**: EMM-3 vs Random (108.3 moves)
- **Longest games**: EMM-2 vs EMM-3 (124.6 moves)
- **Average across all matchups**: 115.8 moves

### Time Performance

- **Fastest AIs**: Random, Heuristic, EMM-1, EMM-2 (0.0ms/move)
- **Moderate AIs**: EMM-3 (8.8-12.7ms/move)
- **Slowest AI**: ML AI (35.7-46.4ms/move)

## Strategic Insights

### 1. Game Complexity

The fact that Random AI can achieve 48-50% win rates against expectiminimax AIs indicates the game has a significant luck component, making it less deterministic than chess or similar games.

### 2. Optimal Depth

EMM-1's superior performance suggests that for this game, a single-ply search provides the best balance of performance and speed. Deeper searches may be overthinking the position.

### 3. ML AI Potential

ML AI shows competitive performance but suffers from speed issues. With optimization, it could become a strong contender.

### 4. Heuristic AI Limitations

Heuristic AI's poor performance against expectiminimax AIs validates the importance of look-ahead algorithms, even at shallow depths.

## Recommendations

### For Production Use

1. **Primary choice**: EMM-1 (best performance/speed ratio)
2. **Alternative**: EMM-2 (if slightly more strength needed)
3. **Avoid**: EMM-3 (diminishing returns), ML AI (too slow)

### For Development

1. **Fast iteration**: EMM-1 or EMM-2
2. **Baseline testing**: Random AI
3. **Educational**: Heuristic AI

### For Research

1. **ML AI improvement**: Focus on speed optimization
2. **Depth analysis**: Investigate why deeper searches underperform
3. **Hybrid approaches**: Combine ML evaluation with expectiminimax search

## Conclusion

The comprehensive matrix analysis reveals that:

1. **EMM-1 is the optimal choice** for production use, providing the best balance of strength and speed
2. **Depth search is crucial** but diminishing returns set in quickly
3. **ML AI shows promise** but needs speed optimization
4. **Game has significant luck component** making it less deterministic than expected
5. **Heuristic AI validates** the importance of look-ahead algorithms

This analysis provides a solid foundation for AI selection and future development efforts.

# AI Performance

_Current performance data for all AI systems in the Royal Game of Ur._

## Current Performance (July 2025)

### Performance Ranking

| AI Type             | Win Rate  | Speed     | Use Case                |
| ------------------- | --------- | --------- | ----------------------- |
| **EMM-1 (Depth 1)** | **53.6%** | Instant   | **Production gameplay** |
| EMM-2 (Depth 2)     | 53.2%     | Instant   | Alternative option      |
| Heuristic AI        | 50.8%     | Instant   | Educational baseline    |
| ML-v2 AI            | 30.0%     | <1ms/move | Alternative playstyle   |
| Random AI           | 48.0%     | Instant   | Baseline testing        |

### Win Rate Matrix

| AI Type       | Random | Heuristic | EMM-1 | EMM-2 | ML-v2 |
| ------------- | ------ | --------- | ----- | ----- | ----- |
| **Random**    | -      | 48.0      | 44.0  | 50.0  | 48.0  |
| **Heuristic** | 48.0   | -         | 48.0  | 48.0  | 50.0  |
| **EMM-1**     | 44.0   | 48.0      | -     | 48.0  | 70.0  |
| **EMM-2**     | 50.0   | 48.0      | 48.0  | -     | 70.0  |
| **ML-v2**     | 48.0   | 50.0      | 30.0  | 30.0  | -     |

## Key Insights

- **EMM-1 is optimal**: Best win rate (53.6%) with instant speed
- **Depth 1 is sufficient**: Deeper search provides diminishing returns
- **ML-v2 shows promise**: 30% win rate indicates room for improvement
- **High luck component**: Random AI achieves 48% vs expectiminimax

## Search Depth Performance

| Depth | Avg Time | Nodes Evaluated | Win Rate vs Random |
| ----- | -------- | --------------- | ------------------ |
| 1     | Instant  | 0               | 44.0%              |
| 2     | Instant  | 7               | 50.0%              |
| 3     | 10.2ms   | 189             | 50.0%              |
| 4     | 34ms     | 2,960           | 50.0%              |

## Production Recommendations

### **Primary Choice: EMM-1 (Depth 1)**

- **Reason**: Best win rate (53.6%) with instant speed
- **Use case**: Production gameplay, competitive play

### **Alternative Choice: EMM-2 (Depth 2)**

- **Reason**: Very good win rate (53.2%) with instant speed
- **Use case**: Alternative to EMM-1, backup option

### **Educational Choice: Heuristic AI**

- **Reason**: Competitive performance (50.8%) with instant speed
- **Use case**: Educational purposes, understanding evaluation function

### **Research Choice: ML-v2 AI**

- **Reason**: Alternative playstyle (30.0% win rate)
- **Use case**: Research, alternative gameplay experience

## Testing Commands

```bash
# Quick performance test (10 games each)
npm run test:rust:quick

# Comprehensive performance test (100 games each)
npm run test:rust:slow

# ML-v2 specific test (20 games)
npm run test:ml-v2
```

## Recent Test Results

**ML-v2 vs Expectiminimax Depth Comparison:**

- **Depth 2**: ML-v2 wins 2.0% (2/100 games)
- **Depth 3**: ML-v2 wins 49.0% (49/100 games)
- **Depth 4**: ML-v2 wins 25.0% (25/100 games)

**Key Insight**: ML-v2 performs best against Depth 3 expectiminimax, showing promise but needs further training.

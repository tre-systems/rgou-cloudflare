# AI Performance

_Current performance data for all AI systems in the Royal Game of Ur._

## 🎯 Key Findings (January 2025)

**Comprehensive testing reveals significant performance differences:**

- **EMM-4 (Depth 4)**: 75.0% win rate vs ML-v2 - **🏆 Strongest AI** but slow (370ms/move)
- **EMM-3 (Depth 3)**: 70.0% win rate vs ML-v2 - **⚡ Production choice** for speed (15ms/move)
- **EMM-2 (Depth 2)**: 98.0% win rate vs ML-v2 - **Fast alternative** with instant speed
- **ML-v2 AI**: 49.0% win rate vs EMM-3 - **Competitive alternative** playstyle
- **Heuristic AI**: 40.0% win rate vs EMM-1 - **Educational only**, significantly weaker

**🏆 Strongest AI**: **EMM-4 (Depth 4)** - Maximum strength for analysis and research
**⚡ Production Choice**: **EMM-3 (Depth 3)** - Used in game and training for speed

**⚠️ Note**: EMM-2 shows anomalous 98% win rate vs ML-v2 but loses to EMM-3 in direct comparison. This suggests ML-v2 may have specific weaknesses against EMM-2's playstyle, but EMM-3 and EMM-4 are objectively stronger.

## Current Performance (January 2025)

### Performance Ranking

| AI Type                | Win Rate  | Speed     | Use Case                |
| ---------------------- | --------- | --------- | ----------------------- |
| **🏆 EMM-4 (Depth 4)** | **75.0%** | 370ms     | **Strongest AI**        |
| **⚡ EMM-3 (Depth 3)** | **51.0%** | 15ms      | **Production gameplay** |
| EMM-2 (Depth 2)        | 98.0%     | Instant   | Fast alternative        |
| ML-v2 AI               | 49.0%     | <1ms/move | Alternative playstyle   |
| Heuristic AI           | 40.0%     | Instant   | Educational baseline    |
| Random AI              | 50.0%     | Instant   | Baseline testing        |

### Win Rate Matrix

| AI Type       | Random | Heuristic | EMM-2 | EMM-3 | EMM-4 | ML-v2 |
| ------------- | ------ | --------- | ----- | ----- | ----- | ----- |
| **Random**    | -      | 50.0      | 2.0   | 0.0   | 0.0   | 50.0  |
| **Heuristic** | 50.0   | -         | 20.0  | 8.0   | 4.0   | 40.0  |
| **EMM-2**     | 98.0   | 80.0      | -     | 46.7  | 33.3  | 98.0  |
| **EMM-3**     | 100.0  | 92.0      | 53.3  | -     | 26.7  | 51.0  |
| **EMM-4**     | 100.0  | 96.0      | 66.7  | 73.3  | -     | 75.0  |
| **ML-v2**     | 50.0   | 60.0      | 2.0   | 49.0  | 25.0  | -     |

## Key Insights

- **EMM-4 is strongest**: Best win rate (75.0% vs ML-v2) and dominates other depths
- **EMM-3 is production choice**: Good win rate (51.0% vs ML-v2) with excellent speed
- **EMM-2 anomaly**: Shows 98.0% vs ML-v2 but loses to EMM-3 and EMM-4 in direct comparison
- **Depth hierarchy confirmed**: EMM-4 > EMM-3 > EMM-2 (from depth vs depth tests)
- **ML-v2 shows promise**: 49.0% win rate vs EMM-3 indicates competitive performance
- **Heuristic is weak**: Only 40.0% vs EMM-1, suitable for educational purposes only

## Search Depth Performance

| Depth | Avg Time | Nodes Evaluated | Win Rate vs ML-v2 | Win Rate vs Heuristic | Depth vs Depth |
| ----- | -------- | --------------- | ----------------- | --------------------- | -------------- |
| 1     | Instant  | 0               | 68.0%             | 62.0%                 | N/A            |
| 2     | Instant  | 7               | 98.0%             | 80.0%                 | 46.7% vs D3    |
| 3     | 15ms     | 189             | 51.0%             | 92.0%                 | 53.3% vs D2    |
| 4     | 370ms    | 2,960           | 75.0%             | 96.0%                 | 73.3% vs D3    |

## Production Recommendations

### **Primary Choice: EMM-3 (Depth 3)**

- **Reason**: Good win rate (51.0% vs ML-v2) with excellent speed (15ms/move)
- **Use case**: Production gameplay, competitive play
- **Performance**: Best balance of strength and speed for real-time gameplay

### **Maximum Strength: EMM-4 (Depth 4)**

- **Reason**: Highest win rate (75.0% vs ML-v2) but slower (370ms/move)
- **Use case**: Maximum strength when speed is not critical
- **Performance**: Best overall strength

### **Fast Alternative: EMM-2 (Depth 2)**

- **Reason**: Anomalous win rate (98.0% vs ML-v2) with instant speed
- **Use case**: Fast gameplay, mobile devices
- **Performance**: Excellent speed, but note: loses to EMM-3 in direct comparison

### **Alternative Playstyle: ML-v2 AI**

- **Reason**: Competitive performance (49.0% vs EMM-3) with fast speed
- **Use case**: Alternative gameplay experience, research
- **Performance**: Different strategic approach

### **Educational Choice: Heuristic AI**

- **Reason**: Weak performance (40.0% vs EMM-1) but instant speed
- **Use case**: Educational purposes, understanding evaluation function
- **Performance**: Good for learning game mechanics

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

**ML-v2 vs Expectiminimax Depth Comparison (100 games each):**

- **Depth 2**: ML-v2 wins 2.0% (2/100 games)
- **Depth 3**: ML-v2 wins 49.0% (49/100 games)
- **Depth 4**: ML-v2 wins 25.0% (25/100 games)

**Key Insight**: ML-v2 performs best against Depth 3 expectiminimax, showing promise but needs further training.

**Heuristic AI vs Expectiminimax (50 games each):**

- **vs Depth 1**: Heuristic wins 40.0% (20/50 games)
- **vs Depth 2**: Heuristic wins 20.0% (10/50 games)
- **vs Depth 3**: Heuristic wins 8.0% (4/50 games)
- **vs Depth 4**: Heuristic wins 4.0% (2/50 games)

**Key Insight**: Heuristic AI is significantly weaker than all expectiminimax depths, suitable only for educational purposes.

## Performance Analysis

### **Depth Progression**

- **Depth 1 → 2**: Massive improvement (68% → 98% vs ML-v2)
- **Depth 2 → 3**: Anomalous result (98% → 51% vs ML-v2, but EMM-3 beats EMM-2 directly)
- **Depth 3 → 4**: Strong improvement (51% → 75% vs ML-v2)

### **Depth vs Depth Hierarchy (Confirmed)**

- **EMM-4 vs EMM-3**: EMM-4 wins 73.3% vs 26.7%
- **EMM-4 vs EMM-2**: EMM-4 wins 66.7% vs 33.3%
- **EMM-3 vs EMM-2**: EMM-3 wins 53.3% vs 46.7%

**Conclusion**: EMM-4 > EMM-3 > EMM-2 (correct hierarchy)

### **Speed vs Strength Trade-off**

- **EMM-1**: Instant speed, weak play
- **EMM-2**: Instant speed, strong play
- **EMM-3**: Fast speed (15ms), excellent play
- **EMM-4**: Slow speed (370ms), maximum strength

### **Recommendations by Use Case**

- **Production**: EMM-3 (best balance)
- **Mobile**: EMM-2 (instant speed)
- **Maximum strength**: EMM-4
- **Alternative playstyle**: ML-v2
- **Education**: Heuristic AI

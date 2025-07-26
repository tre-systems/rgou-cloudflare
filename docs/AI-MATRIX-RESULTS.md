# AI Matrix Test Results

_Last updated: 26/07/2025, 13:25:49_

## Matrix Table

**Test Configuration:**
  Total games played: 2250
  Duration: 33.03 seconds
  Games per second: 68.1

| AI Type | Random | Heuristic | EMM-Depth1 | EMM-Depth2 | EMM-Depth3 | ML-Fast | ML-V2 | ML-V4 | ML-Hybrid | ML-PyTorch-V5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Random | - | 4.0 | 4.0 | 2.0 | 4.0 | 0.0 | 4.0 | 2.0 | 4.0 | 0.0 |
| Heuristic | 96.0 | - | 36.0 | 34.0 | 26.0 | 26.0 | 32.0 | 26.0 | 36.0 | 16.0 |
| EMM-Depth1 | 96.0 | 64.0 | - | 42.0 | 20.0 | 28.0 | 24.0 | 20.0 | 34.0 | 22.0 |
| EMM-Depth2 | 98.0 | 66.0 | 58.0 | - | 30.0 | 60.0 | 52.0 | 56.0 | 50.0 | 38.0 |
| EMM-Depth3 | 96.0 | 74.0 | 80.0 | 70.0 | - | 76.0 | 62.0 | 56.0 | 70.0 | 62.0 |
| ML-Fast | 100.0 | 74.0 | 72.0 | 40.0 | 24.0 | - | 62.0 | 58.0 | 58.0 | 46.0 |
| ML-V2 | 96.0 | 68.0 | 76.0 | 48.0 | 38.0 | 38.0 | - | 62.0 | 62.0 | 56.0 |
| ML-V4 | 98.0 | 74.0 | 80.0 | 44.0 | 44.0 | 42.0 | 38.0 | - | 50.0 | 40.0 |
| ML-Hybrid | 96.0 | 64.0 | 66.0 | 50.0 | 30.0 | 42.0 | 38.0 | 50.0 | - | 50.0 |
| ML-PyTorch-V5 | 100.0 | 84.0 | 78.0 | 62.0 | 38.0 | 54.0 | 44.0 | 60.0 | 50.0 | - |


## Performance Summary

1. EMM-Depth3: 71.8% average win rate
2. ML-PyTorch-V5: 63.3% average win rate
3. ML-V2: 60.4% average win rate
4. ML-Fast: 59.3% average win rate
5. ML-V4: 56.7% average win rate
6. EMM-Depth2: 56.4% average win rate
7. ML-Hybrid: 54.0% average win rate
8. EMM-Depth1: 38.9% average win rate
9. Heuristic: 36.4% average win rate
10. Random: 2.7% average win rate

## Speed Analysis

| AI | ms/move | Speed |
|---|---|---|
| Random | 0.0 | Very Fast |
| Heuristic | 0.0 | Very Fast |
| EMM-Depth1 | 0.0 | Very Fast |
| EMM-Depth2 | 0.1 | Very Fast |
| EMM-Depth3 | 17.1 | Moderate |
| ML-V4 | 56.0 | Slow |
| ML-V2 | 58.5 | Slow |
| ML-Hybrid | 58.9 | Slow |
| ML-PyTorch-V5 | 65.0 | Slow |
| ML-Fast | 65.5 | Slow |


## Recommendations

- EMM-Depth3 shows excellent performance (71.8% avg win rate) and is ready for production
- Random is very fast (0.0ms/move) and suitable for real-time play
- Use EMM-Depth3 for best performance/speed balance
- Use Random AI for baseline testing
- Use Heuristic AI for educational purposes

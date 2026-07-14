# AI Matrix Test Results

_Last updated: 14/07/2026, 12:59:01_

## Matrix Table

**Test Configuration:**
Total games played: 1800
Duration: 32.54 seconds
Games per second: 55.3

| AI Type | Random | Heuristic | EMM-Depth1 | EMM-Depth2 | EMM-Depth3 | ML-Fast | ML-V4 | ML-Hybrid | ML-PyTorch-V5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Random | - | 22.0 | 0.0 | 0.0 | 0.0 | 2.0 | 4.0 | 0.0 | 0.0 |
| Heuristic | 78.0 | - | 18.0 | 18.0 | 10.0 | 22.0 | 30.0 | 32.0 | 32.0 |
| EMM-Depth1 | 100.0 | 82.0 | - | 26.0 | 14.0 | 58.0 | 58.0 | 66.0 | 48.0 |
| EMM-Depth2 | 100.0 | 82.0 | 74.0 | - | 28.0 | 66.0 | 66.0 | 74.0 | 68.0 |
| EMM-Depth3 | 100.0 | 90.0 | 86.0 | 72.0 | - | 92.0 | 82.0 | 84.0 | 82.0 |
| ML-Fast | 98.0 | 78.0 | 42.0 | 34.0 | 8.0 | - | 58.0 | 66.0 | 62.0 |
| ML-V4 | 96.0 | 70.0 | 42.0 | 34.0 | 18.0 | 42.0 | - | 58.0 | 42.0 |
| ML-Hybrid | 100.0 | 68.0 | 34.0 | 26.0 | 16.0 | 34.0 | 42.0 | - | 48.0 |
| ML-PyTorch-V5 | 100.0 | 68.0 | 52.0 | 32.0 | 18.0 | 38.0 | 58.0 | 52.0 | - |
## Performance Summary

1. EMM-Depth3: 86.0% average win rate
2. EMM-Depth2: 69.8% average win rate
3. EMM-Depth1: 56.5% average win rate
4. ML-Fast: 55.8% average win rate
5. ML-PyTorch-V5: 52.2% average win rate
6. ML-V4: 50.2% average win rate
7. ML-Hybrid: 46.0% average win rate
8. Heuristic: 30.0% average win rate
9. Random: 3.5% average win rate

## Speed Analysis

| AI | ms/move | Speed |
| --- | ------- | --------- |
| Random | 0.0 | Very Fast |
| Heuristic | 0.0 | Very Fast |
| EMM-Depth1 | 0.0 | Very Fast |
| EMM-Depth2 | 0.6 | Very Fast |
| EMM-Depth3 | 28.5 | Moderate |
| ML-V4 | 80.4 | Slow |
| ML-Hybrid | 80.5 | Slow |
| ML-PyTorch-V5 | 84.2 | Slow |
| ML-Fast | 86.0 | Slow |
## Recommendations

- EMM-Depth3 shows excellent performance (86.0% avg win rate) and is ready for production
- Random is very fast (0.0ms/move) and suitable for real-time play
- Use EMM-Depth3 for best performance/speed balance
- Use Random AI for baseline testing
- Use Heuristic AI for educational purposes

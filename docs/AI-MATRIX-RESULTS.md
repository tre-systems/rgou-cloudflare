# AI Matrix Test Results

_Last updated: 26/07/2025, 13:19:55_

## Matrix Table

**Test Configuration:**
  Total games played: 900
  Duration: 94.70 seconds
  Games per second: 9.5

| AI Type | Random | Heuristic | EMM-Depth1 | EMM-Depth2 | EMM-Depth3 | ML-Fast | ML-V2 | ML-V4 | ML-Hybrid | ML-PyTorch-V5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Random | - | 10.0 | 0.0 | 0.0 | 0.0 | 0.0 | 5.0 | 0.0 | 0.0 | 0.0 |
| Heuristic | 90.0 | - | 50.0 | 25.0 | 15.0 | 25.0 | 15.0 | 15.0 | 45.0 | 35.0 |
| EMM-Depth1 | 100.0 | 50.0 | - | 50.0 | 5.0 | 40.0 | 25.0 | 10.0 | 35.0 | 30.0 |
| EMM-Depth2 | 100.0 | 75.0 | 50.0 | - | 20.0 | 30.0 | 40.0 | 35.0 | 40.0 | 35.0 |
| EMM-Depth3 | 100.0 | 85.0 | 95.0 | 80.0 | - | 75.0 | 65.0 | 50.0 | 80.0 | 65.0 |
| ML-Fast | 100.0 | 75.0 | 60.0 | 70.0 | 25.0 | - | 50.0 | 70.0 | 65.0 | 65.0 |
| ML-V2 | 95.0 | 85.0 | 75.0 | 60.0 | 35.0 | 50.0 | - | 35.0 | 40.0 | 50.0 |
| ML-V4 | 100.0 | 85.0 | 90.0 | 65.0 | 50.0 | 30.0 | 65.0 | - | 45.0 | 40.0 |
| ML-Hybrid | 100.0 | 55.0 | 65.0 | 60.0 | 20.0 | 35.0 | 60.0 | 55.0 | - | 65.0 |
| ML-PyTorch-V5 | 100.0 | 65.0 | 70.0 | 65.0 | 35.0 | 35.0 | 50.0 | 60.0 | 35.0 | - |


## Performance Summary

1. EMM-Depth3: 77.2% average win rate
2. ML-Fast: 64.4% average win rate
3. ML-V4: 63.3% average win rate
4. ML-V2: 58.3% average win rate
5. ML-PyTorch-V5: 57.2% average win rate
6. ML-Hybrid: 57.2% average win rate
7. EMM-Depth2: 47.2% average win rate
8. EMM-Depth1: 38.3% average win rate
9. Heuristic: 35.0% average win rate
10. Random: 1.7% average win rate

## Speed Analysis

| AI | ms/move | Speed |
|---|---|---|
| Random | 0.0 | Very Fast |
| Heuristic | 0.0 | Very Fast |
| EMM-Depth2 | 0.0 | Very Fast |
| EMM-Depth1 | 0.0 | Very Fast |
| EMM-Depth3 | 15.0 | Moderate |
| ML-V4 | 54.3 | Slow |
| ML-V2 | 54.9 | Slow |
| ML-Hybrid | 56.3 | Slow |
| ML-PyTorch-V5 | 62.7 | Slow |
| ML-Fast | 67.8 | Slow |


## Recommendations

- EMM-Depth3 shows excellent performance (77.2% avg win rate) and is ready for production
- Random is very fast (0.0ms/move) and suitable for real-time play
- Use EMM-Depth3 for best performance/speed balance
- Use Random AI for baseline testing
- Use Heuristic AI for educational purposes

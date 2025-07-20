# AI Performance Analysis

_Comprehensive performance analysis of all AI models in the Royal Game of Ur._

## Test Matrix Results

All tests conducted with 100 games vs Expectiminimax AI (Depth 3) unless otherwise specified.

### ML AI Models Performance

| Model      | Win Rate | Losses | Avg Moves | Speed | First/Second | Status               |
| ---------- | -------- | ------ | --------- | ----- | ------------ | -------------------- |
| **v2**     | **44%**  | 56%    | 152.3     | 0.7ms | 23/21        | ✅ **Best**          |
| **Fast**   | 36%      | 64%    | 172.1     | 0.7ms | 11/25        | Competitive          |
| **v4**     | 32%      | 68%    | 147.9     | 0.7ms | 15/17        | ⚠️ Needs Improvement |
| **Hybrid** | 30%      | 70%    | 173.7     | 0.7ms | 9/21         | ⚠️ Needs Improvement |

### Performance Insights

#### 🏆 **v2 Model - Best Performance**

- **Win Rate**: 44% (44 wins, 56 losses)
- **Training**: 1,000 games, 50 epochs, depth 3
- **Architecture**: 150 inputs, enhanced network
- **Key Strength**: Balanced performance regardless of turn order
- **Recommendation**: Use for production

#### 🥈 **Fast Model - Competitive**

- **Win Rate**: 36% (36 wins, 64 losses)
- **Training**: 500 games, 25 epochs, depth 2
- **Architecture**: 100 inputs, basic network
- **Key Strength**: Better when playing second
- **Recommendation**: Good baseline model

#### ⚠️ **v4 Model - Training Regression**

- **Win Rate**: 32% (32 wins, 68 losses)
- **Training**: 5,000 games, 100 epochs, depth 3
- **Architecture**: 150 inputs, production training
- **Issue**: Despite excellent validation loss (0.707), competitive performance is poor
- **Recommendation**: Investigate training methodology

#### ⚠️ **Hybrid Model - Performance Issues**

- **Win Rate**: 30% (30 wins, 70 losses)
- **Training**: 10,000 games, 100 epochs, depth 3
- **Architecture**: Hybrid Rust+Python training
- **Issue**: Worst performance despite most training data
- **Recommendation**: Revisit training approach

## Training Regression Analysis

### The v2 Paradox

The v2 model, trained with only 1,000 games and 50 epochs, significantly outperforms newer models trained with 5-10x more data and 2x more epochs.

**Possible Causes:**

1. **Overfitting**: Newer models may be overfitting to training data
2. **Training Data Quality**: More data doesn't guarantee better quality
3. **Architecture Changes**: Recent modifications may have introduced issues
4. **Validation vs Performance Gap**: Good validation loss doesn't guarantee competitive performance

### Recommendations

1. **Use v2 Model**: Currently the best performing model
2. **Investigate Training**: Analyze why newer models perform worse
3. **Simplify Approach**: Consider reverting to v2 training methodology
4. **Focus on Quality**: Prioritize training data quality over quantity

## Classic AI Performance

### Expectiminimax AI (EMM-3)

- **Speed**: 0.2ms per move
- **Performance**: Consistently outperforms most ML models
- **Reliability**: Stable performance across all tests
- **Recommendation**: Default choice for competitive play

## Speed Analysis

### Move Generation Speed

| AI Type            | Average Time | Relative Speed |
| ------------------ | ------------ | -------------- |
| Expectiminimax     | 0.2ms        | 1x (baseline)  |
| ML AI (all models) | 0.7ms        | 3.5x slower    |

### Performance vs Speed Trade-off

- **ML AI**: 3.5x slower but provides unique playstyle
- **Expectiminimax**: Fastest but predictable strategy
- **Recommendation**: Use ML AI for variety, Expectiminimax for speed

## Game Length Analysis

### Average Moves per Game

| Model  | Avg Moves | Game Style |
| ------ | --------- | ---------- |
| v4     | 147.9     | Balanced   |
| v2     | 152.3     | Balanced   |
| Fast   | 172.1     | Defensive  |
| Hybrid | 173.7     | Defensive  |

### Insights

- **Shorter Games**: v4 and v2 models play more decisively
- **Longer Games**: Fast and Hybrid models play more defensively
- **Correlation**: Shorter games correlate with better win rates

## Turn Order Analysis

### Playing First vs Second

| Model  | First Wins | Second Wins | Preference |
| ------ | ---------- | ----------- | ---------- |
| v2     | 23/50      | 21/50       | Balanced   |
| v4     | 15/50      | 17/50       | Second     |
| Fast   | 11/50      | 25/50       | Second     |
| Hybrid | 9/50       | 21/50       | Second     |

### Insights

- **v2 Model**: Most balanced performance regardless of turn order
- **Other Models**: Generally perform better when playing second
- **Recommendation**: v2 model is most reliable for tournament play

## Production Recommendations

### For Production Use

1. **Primary**: v2 Model (44% win rate) - Best performance
2. **Secondary**: Fast Model (36% win rate) - Good baseline
3. **Avoid**: v4 and Hybrid models until training issues resolved

### For Development

1. **Investigate**: Why newer models perform worse than v2
2. **Simplify**: Return to v2 training methodology
3. **Focus**: Quality over quantity in training data
4. **Test**: All new models against v2 baseline

## Future Improvements

### High Priority

- **Fix Training Regression**: Understand why newer models perform worse
- **Replicate v2 Success**: Identify what made v2 training effective
- **Quality Control**: Implement better validation of competitive performance

### Medium Priority

- **Self-Play Training**: Fine-tune models through self-play
- **Monte Carlo Tree Search**: Add lightweight search to ML models
- **Feature Engineering**: Review and optimize input features

### Advanced

- **Multi-Model Ensemble**: Combine multiple models for better performance
- **Online Learning**: Continuous improvement through gameplay
- **Adversarial Training**: Train against strongest opponents

## Test Methodology

### Standard Test Configuration

- **Games**: 100 per model comparison
- **Opponent**: Expectiminimax AI (Depth 3)
- **Turn Order**: Alternating (50 games each)
- **Environment**: Consistent hardware and software
- **Validation**: Multiple test runs for reliability

### Test Commands

```bash
# Test specific model
NUM_GAMES=100 cargo test test_ml_v2_vs_expectiminimax_ai -- --nocapture

# Test all models
npm run test:rust

# Quick tests (10 games)
cargo test test_ml_v2_vs_expectiminimax_ai -- --nocapture
```

## Related Documentation

- [AI System](./ai-system.md) - Classic AI implementation
- [ML AI System](./ml-ai-system.md) - Machine learning AI implementation
- [AI Development History](./ai-development-history.md) - Model evolution timeline

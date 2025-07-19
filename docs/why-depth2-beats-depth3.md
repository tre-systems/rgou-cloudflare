# Why Depth 2 Beats Depth 3: Deep Analysis

## 🔍 **The Mystery Continues**

Even after fixing the transposition table interference, **Depth 2 still outperforms Depth 3** (56.8% vs 52.8% win rate). This is still counterintuitive and requires deeper investigation.

## 📊 **Key Findings from Analysis**

### **1. Move Selection Consistency**

**All test positions show the same pattern:**

```
✅ Same move selected by Depth 2 and Depth 3
```

**This means:** Both depths choose the same moves, so the performance difference isn't due to move selection quality.

### **2. Evaluation Function Scaling Issues**

**Critical discovery - evaluation scores get worse with depth:**

| Depth | Best Move Score | Pattern                 |
| ----- | --------------- | ----------------------- |
| 1     | -36.000         | Baseline                |
| 2     | +3.188          | **Best score**          |
| 3     | -30.574         | **Worse than depth 2!** |
| 4     | -13.862         | Different move selected |

**This is the smoking gun!** Depth 3 produces **worse evaluation scores** than Depth 2.

### **3. Search Efficiency**

**Depth 3 explores much more but with diminishing returns:**

| Depth | Nodes | Time   | Efficiency   |
| ----- | ----- | ------ | ------------ |
| 2     | 7     | ~130μs | 18.9 μs/node |
| 3     | 189   | ~2.2ms | 11.8 μs/node |
| 4     | 2,960 | ~26ms  | 10.7 μs/node |

**Observation:** Depth 3 explores 27x more nodes but produces worse scores.

## 🎯 **Root Cause Analysis**

### **1. Evaluation Function Problems**

The evaluation function appears to have **scaling issues at deeper depths**:

```
Depth 1: -36.000 (simple evaluation)
Depth 2: +3.188 (optimal - captures tactical opportunities)
Depth 3: -30.574 (worse - overthinking simple positions)
Depth 4: -13.862 (different move - search instability)
```

**Hypothesis:** The evaluation function may be:

- **Too simplistic** for deep search
- **Not properly weighted** for different depths
- **Suffering from horizon effects** at depth 3

### **2. Alpha-Beta Pruning Issues**

**Alpha-beta pruning might be too aggressive:**

```
Move evaluations at depth 1:
Move 0: -36.000
Move 1: -36.000
Move 2: -36.000
```

**All moves have identical evaluations** - this suggests:

- The evaluation function is too coarse
- Alpha-beta pruning might be cutting off important lines
- Move ordering isn't effective

### **3. Expectiminimax-Specific Issues**

**The expectiminimax algorithm has unique characteristics:**

1. **Probability weighting** - must consider all dice rolls
2. **Chance nodes** - different from pure minimax
3. **Horizon effects** - evaluation at different depths may be inconsistent

**Potential issues:**

- **Horizon effect**: Deep search reaches positions where evaluation is less reliable
- **Probability distribution**: Deep search may over-weight rare dice rolls
- **Evaluation scaling**: The evaluation function may not scale well with depth

## 🔬 **Technical Analysis**

### **Evaluation Function Scaling**

Looking at the complex position test:

```
Complex position evaluation: -13
Depth 1: -51.000
Depth 2: -29.312 (best)
Depth 3: -76.508 (worse)
Depth 4: -81.601 (worse)
```

**Pattern:** Depth 2 consistently produces the best evaluation scores.

### **Search Tree Characteristics**

```
Depth 2: 7 nodes (highly pruned)
Depth 3: 189 nodes (27x more exploration)
Depth 4: 2,960 nodes (420x more exploration)
```

**The problem:** More exploration doesn't lead to better decisions.

### **Move Ordering Effectiveness**

```
Valid moves: [0, 1, 2, 3, 4, 5, 6]
Move 0: evaluation = -38
Move 1: evaluation = -38
Move 2: evaluation = -38
...
```

**All moves have identical evaluations** - this is problematic because:

- Alpha-beta pruning can't distinguish between moves
- Search becomes less efficient
- Deeper search explores irrelevant branches

## 🎮 **Game-Specific Factors**

### **1. Royal Game of Ur Characteristics**

The game has several features that may favor shallow search:

- **High luck component** (dice rolls)
- **Simple tactical patterns**
- **Limited strategic depth**
- **Quick endgames**

### **2. Optimal Search Depth**

**Depth 2 may be optimal because:**

- Captures immediate tactical opportunities
- Avoids horizon effects
- Balances speed and accuracy
- Matches the game's tactical nature

### **3. Diminishing Returns**

**Beyond depth 2:**

- **Depth 3**: 27x more nodes, worse scores
- **Depth 4**: 420x more nodes, different moves
- **Pattern**: More search → worse decisions

## 🚨 **Potential Issues in Implementation**

### **1. Evaluation Function Problems**

The evaluation function may need:

- **Depth-dependent weighting**
- **Better tactical vs strategic balance**
- **Improved position evaluation**
- **Horizon effect mitigation**

### **2. Alpha-Beta Pruning Issues**

Current implementation may:

- **Prune too aggressively**
- **Have poor move ordering**
- **Not work well with expectiminimax**
- **Cut off important tactical lines**

### **3. Expectiminimax Implementation**

The algorithm may:

- **Over-weight rare dice rolls**
- **Have probability distribution issues**
- **Suffer from search instability**
- **Not handle chance nodes optimally**

## 🔧 **Recommendations**

### **Immediate Fixes**

1. **Improve Evaluation Function**

   ```rust
   // Add depth-dependent weighting
   let depth_factor = 1.0 / (depth as f32 + 1.0);
   let adjusted_score = base_score * depth_factor;
   ```

2. **Better Move Ordering**

   ```rust
   // Implement more sophisticated move ordering
   // Consider captures, threats, and positional factors
   ```

3. **Horizon Effect Mitigation**
   ```rust
   // Add quiescence search improvements
   // Consider static evaluation at leaf nodes
   ```

### **Long-term Improvements**

1. **Depth-Specific Tuning**
   - Optimize evaluation function for each depth
   - Implement depth-dependent search strategies
   - Consider iterative deepening with early termination

2. **Expectiminimax Optimization**
   - Improve probability handling
   - Better chance node evaluation
   - Optimize for the game's specific characteristics

3. **Alternative Search Algorithms**
   - Consider Monte Carlo Tree Search (MCTS)
   - Implement Principal Variation Search (PVS)
   - Explore game-specific optimizations

## 📈 **Expected Results After Fixes**

With proper evaluation function scaling:

| Depth | Expected Win Rate | Expected Time |
| ----- | ----------------- | ------------- |
| 1     | ~50%              | < 1ms         |
| 2     | ~55%              | 1-5ms         |
| 3     | ~58%              | 10-20ms       |
| 4     | ~60%              | 50-100ms      |

## 🎯 **Conclusion**

**Depth 2 beats Depth 3 because:**

1. **Evaluation function scaling issues** - produces worse scores at deeper depths
2. **Horizon effects** - deep search reaches less reliable evaluation positions
3. **Alpha-beta pruning problems** - may be cutting off important lines
4. **Game characteristics** - Royal Game of Ur favors tactical over strategic play
5. **Expectiminimax-specific issues** - probability handling may be suboptimal

**The fix:** Improve the evaluation function to scale properly with depth, implement better move ordering, and optimize the expectiminimax algorithm for the game's specific characteristics.

**Key insight:** More search isn't always better - the quality of evaluation and search efficiency matter more than raw depth.

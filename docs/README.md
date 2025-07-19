# Royal Game of Ur - Documentation Index

_Last updated: July 19, 2025_

## 📋 **Documentation Overview**

This documentation is organized into three main categories:

1. **🎯 Current Results & Recommendations** - Latest performance data and production guidance
2. **🔧 Historical Investigations & Fixes** - Past problems that were identified and resolved
3. **📚 Reference & Technical Details** - Implementation details and technical documentation

---

## 🎯 **Current Results & Recommendations**

### **Latest Performance Data (July 2025)**

- **[Latest Matrix Comparison Results](./latest-matrix-comparison-results.md)** - **CURRENT** - Complete performance matrix from latest tests
- **[Comprehensive AI Matrix Analysis](./comprehensive-ai-matrix-analysis.md)** - **CURRENT** - Updated with latest results and recommendations
- **[AI Performance Quick Reference](./ai-performance-quick-reference.md)** - **CURRENT** - Quick reference for developers and production use

### **Current AI Performance Ranking (July 2025)**

1. **EMM-1 (Depth 1)**: 53.6% win rate (0.0ms/move) - **Best overall**
2. **EMM-2 (Depth 2)**: 53.2% win rate (0.0ms/move) - Very strong alternative
3. **Heuristic**: 50.8% win rate (0.0ms/move) - Competitive baseline
4. **Random**: 48.0% win rate (0.0ms/move) - Expected baseline
5. **EMM-3 (Depth 3)**: 47.6% win rate (10.2ms/move) - Good but slower
6. **ML**: 46.8% win rate (40.8ms/move) - Needs improvement

### **Production Recommendations (Current)**

- **Primary**: EMM-1 (Depth 1) - Best performance and speed
- **Alternative**: EMM-2 (Depth 2) - Very good alternative
- **Educational**: Heuristic AI - Good for understanding evaluation
- **Testing**: Random AI - Baseline comparison

---

## 🔧 **Historical Investigations & Fixes**

### **Major Issues Resolved**

- **[Heuristic AI Perspective Bug Fix](./heuristic-ai-analysis.md)** - **RESOLVED** - Fixed inconsistent player perspective in heuristic AI
- **[Transposition Table Interference](./depth-1-vs-depth-3-analysis.md)** - **RESOLVED** - Fixed shared transposition table causing unfair comparisons
- **[Depth Performance Anomalies](./why-depth2-beats-depth3.md)** - **INVESTIGATED** - Analysis of why depth 2 performed better than depth 3

### **Investigation History**

- **[AI Investigation Summary](./ai-investigation-summary.md)** - **HISTORICAL** - Overview of comprehensive AI investigation
- **[Expectiminimax AI Optimization](./expectiminimax-ai-optimization.md)** - **HISTORICAL** - Detailed optimization work
- **[Search Depth Optimization](./search-depth-optimization.md)** - **HISTORICAL** - Depth analysis and optimization

### **Key Fixes Applied**

1. **Heuristic AI Perspective Bug** (2024)
   - **Problem**: Player 1 and Player 2 both maximized, creating inconsistent behavior
   - **Fix**: Player 1 minimizes, Player 2 maximizes (consistent with expectiminimax)
   - **Result**: Heuristic AI now performs at expected baseline level

2. **Transposition Table Interference** (2024)
   - **Problem**: Shared transposition table gave unfair advantage to depth 1
   - **Fix**: Separate AI instances for each depth comparison
   - **Result**: Fair comparisons between different search depths

3. **Performance Anomalies** (2024)
   - **Problem**: Depth 2 performing better than depth 3
   - **Investigation**: Identified evaluation function scaling issues
   - **Result**: Confirmed that tactical evaluation > deep search for this game

---

## 📚 **Reference & Technical Details**

### **System Architecture**

- **[Architecture Overview](./architecture-overview.md)** - System design and components
- **[Technical Implementation](./technical-implementation.md)** - Implementation details
- **[AI System (Classic)](./ai-system.md)** - Classic expectiminimax AI details
- **[ML AI System](./ml-ai-system.md)** - Machine learning AI implementation

### **Game & Rules**

- **[Game Rules and Strategy](./game-rules-strategy.md)** - Game rules and strategic concepts
- **[Game Statistics](./game-statistics.md)** - Statistical analysis of gameplay

### **Development & Testing**

- **[Testing Strategy](./testing-strategy.md)** - Testing approach and methodology
- **[Test Configuration Guide](./test-configuration-guide.md)** - How to run different test configurations
- **[Troubleshooting Guide](./troubleshooting.md)** - Common issues and solutions

### **Future Development**

- **[AI Improvement Roadmap](./ai-improvement-roadmap.md)** - Planned improvements and enhancements
- **[High Priority TODOs](./high-priority-todos.md)** - Current development priorities

### **Platform-Specific**

- **[Mac Optimization Guide](./mac-optimization-guide.md)** - macOS-specific optimizations
- **[Checking Training Status](./checking-training-status.md)** - ML training monitoring

---

## 🚀 **Quick Start for Developers**

### **Current Best Practices (July 2025)**

1. **Use EMM-1 (Depth 1) for production** - Best performance/speed ratio
2. **Run matrix comparison tests** - `npm run test:rust:slow`
3. **Reference latest results** - See "Current Results & Recommendations" above
4. **Check historical fixes** - See "Historical Investigations & Fixes" for context

### **Testing Commands**

```bash
# Run comprehensive matrix analysis (current results)
npm run test:rust:slow

# Run fast tests only
npm run test:rust

# Run all tests
npm run check
```

### **Key Configuration**

- **Production AI**: Depth 1 (EMM-1)
- **Alternative**: Depth 2 (EMM-2)
- **Educational**: Heuristic AI
- **Testing**: Random AI

---

## 📊 **Performance Summary (Current)**

### **Complete Performance Matrix (Win Rates %)**

| AI Type       | Random | Heuristic | EMM-1 | EMM-2 | EMM-3 | ML   |
| ------------- | ------ | --------- | ----- | ----- | ----- | ---- |
| **Random**    | -      | 48.0      | 44.0  | 50.0  | 50.0  | 48.0 |
| **Heuristic** | 48.0   | -         | 48.0  | 48.0  | 56.0  | 50.0 |
| **EMM-1**     | 44.0   | 48.0      | -     | 48.0  | 48.0  | 64.0 |
| **EMM-2**     | 50.0   | 48.0      | 48.0  | -     | 54.0  | 58.0 |
| **EMM-3**     | 50.0   | 56.0      | 48.0  | 54.0  | -     | 46.0 |
| **ML**        | 48.0   | 50.0      | 64.0  | 58.0  | 46.0  | -    |

### **Key Insights (Current)**

- **EMM-1 is optimal** for production use (53.6% win rate, instant speed)
- **Tactical evaluation > Deep search** for Royal Game of Ur
- **ML AI needs improvement** (46.8% win rate)
- **Heuristic AI is competitive** after perspective bug fix
- **High luck component** reduces benefits of deep search

---

_This documentation is actively maintained. For the most current results, always refer to the "Current Results & Recommendations" section._

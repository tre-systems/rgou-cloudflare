# Royal Game of Ur - Documentation Index

_Last updated: July 19, 2025_

## 📋 **Documentation Overview**

This documentation is organized into three main categories:

1. **🎯 Current Implementation** - Active system documentation and guides
2. **🔧 Development & Testing** - Development workflow and testing information
3. **📚 Historical Research** - Past experiments and investigations

---

## 🎯 **Current Implementation**

### **AI Systems**

- **[AI System](./ai-system.md)** - Classic expectiminimax AI implementation
- **[ML AI System](./ml-ai-system.md)** - Machine learning AI implementation

### **System Architecture**

- **[Architecture Overview](./architecture-overview.md)** - System design and components
- **[Technical Implementation](./technical-implementation.md)** - Implementation details

### **Game & Rules**

- **[Game Rules and Strategy](./game-rules-strategy.md)** - Game rules and strategic concepts
- **[Game Statistics](./game-statistics.md)** - Statistical analysis of gameplay

---

## 🔧 **Development & Testing**

### **Testing & Quality**

- **[Testing Strategy](./testing-strategy.md)** - Testing approach and methodology
- **[Test Configuration Guide](./test-configuration-guide.md)** - How to run different test configurations
- **[Troubleshooting Guide](./troubleshooting.md)** - Common issues and solutions

### **Platform-Specific**

- **[Mac Optimization Guide](./mac-optimization-guide.md)** - macOS-specific optimizations
- **[Checking Training Status](./checking-training-status.md)** - ML training monitoring

---

## 📚 **Historical Research & Future Development**

### **AI Development Experiments**

- **[AI Development Experiments](./ai-development-experiments.md)** - **HISTORICAL** - All AI experiments, investigations, and lessons learned

### **Current Performance Data**

- **[Latest Matrix Comparison Results](./latest-matrix-comparison-results.md)** - **CURRENT** - Latest performance data (July 2025)
- **[AI Performance Quick Reference](./ai-performance-quick-reference.md)** - **CURRENT** - Quick reference for developers

### **Future Development**

- **[AI Improvement Roadmap](./ai-improvement-roadmap.md)** - Planned improvements and enhancements
- **[High Priority TODOs](./high-priority-todos.md)** - Current development priorities

---

## 🚀 **Quick Start for Developers**

### **Current Best Practices (July 2025)**

1. **Use EMM-1 (Depth 1) for production** - Best performance/speed ratio
2. **Run matrix comparison tests** - `npm run test:rust:slow`
3. **Reference latest results** - See "Current Performance Data" above

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

## 📊 **Current Performance Summary**

### **AI Performance Ranking (July 2025)**

1. **EMM-1 (Depth 1)**: 53.6% win rate (0.0ms/move) - **Best overall**
2. **EMM-2 (Depth 2)**: 53.2% win rate (0.0ms/move) - Very strong alternative
3. **Heuristic**: 50.8% win rate (0.0ms/move) - Competitive baseline
4. **Random**: 48.0% win rate (0.0ms/move) - Expected baseline
5. **EMM-3 (Depth 3)**: 47.6% win rate (10.2ms/move) - Good but slower
6. **ML**: 46.8% win rate (40.8ms/move) - Needs improvement

### **Production Recommendations**

- **Primary**: EMM-1 (Depth 1) - Best performance and speed
- **Alternative**: EMM-2 (Depth 2) - Very good alternative
- **Educational**: Heuristic AI - Good for understanding evaluation
- **Testing**: Random AI - Baseline comparison

---

_This documentation is actively maintained. For the most current results, always refer to the "Current Performance Data" section._

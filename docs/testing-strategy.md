# Testing Strategy

## Testing Overview

| Test Type         | What to Test                | Tool       | Value  | Maintenance |
| ----------------- | --------------------------- | ---------- | ------ | ----------- |
| Pure logic        | Game rules, reducers        | Vitest     | High   | Low         |
| Schema validation | Zod schemas, domain types   | Vitest     | High   | Low         |
| Snapshots         | Key game states             | Vitest     | Medium | Low         |
| Store integration | Zustand actions/transitions | Vitest     | Medium | Medium      |
| UI smoke          | App loads, basic flows      | Playwright | Medium | Low         |
| Full E2E          | Full game, random flows     | Avoid      | Low    | High        |

This document outlines the comprehensive testing strategy for the Royal Game of Ur project, designed to provide confidence during refactoring while minimizing maintenance overhead.

## Testing Philosophy

Our testing approach prioritizes:

1. **High Value, Low Maintenance**: Focus on tests that catch real bugs without being fragile
2. **Deterministic Testing**: Avoid tests that depend on randomness or timing
3. **Pure Function Testing**: Test business logic in isolation
4. **Integration Testing**: Test complete workflows without full end-to-end complexity
5. **Snapshot Testing**: Catch unintended changes to critical game states

## Test Categories

### 1. Unit Tests (High Priority)

**Location**: `src/lib/__tests__/game-logic.test.ts`

**Purpose**: Test pure functions and business logic in isolation

**Coverage**:

- Game initialization
- Move validation
- Game state transitions
- Rule enforcement (captures, rosettes, finishes)
- Dice roll processing

**Benefits**:

- Fast execution (< 1 second)
- Deterministic results
- Easy to debug
- High confidence in core logic

**Example**:

```typescript
it('should allow capture of opponent piece', () => {
  const game = initializeGame();
  game.player1Pieces[0].square = 4;
  game.board[4] = game.player1Pieces[0];
  game.player2Pieces[0].square = 6;
  game.board[6] = game.player2Pieces[0];
  game.diceRoll = 2;

  const moves = getValidMoves(game);
  expect(moves).toContain(0);
});
```

### 2. Schema Validation Tests (High Priority)

**Location**: `src/lib/__tests__/schemas.test.ts`

**Purpose**: Ensure data validation works correctly

**Coverage**:

- Zod schema validation
- Type safety enforcement
- Invalid data rejection

**Benefits**:

- Catches data corruption early
- Ensures API contract compliance
- Prevents runtime errors

### 3. Deterministic AI Tests (Medium Priority)

**Location**: `src/lib/__tests__/ai-deterministic.test.ts`

**Purpose**: Test AI behavior in specific scenarios without randomness

**Coverage**:

- Winning move detection
- Strategic decision making
- Move evaluation consistency

**Benefits**:

- Tests AI logic without full games
- Verifies strategic behavior
- Mocks external dependencies

**Example**:

```typescript
it('should choose winning move when available', async () => {
  // Set up winning scenario
  // Mock AI response
  // Verify correct move selection
});
```

### 4. Integration Tests (Medium Priority)

**Location**: `src/lib/__tests__/game-store.test.ts`

**Purpose**: Test complete game workflows

**Coverage**:

- Game store state management
- Complete move sequences
- AI integration
- Error handling

**Benefits**:

- Tests real user workflows
- Catches integration bugs
- Verifies state management

### 5. Snapshot Tests (Low Priority)

**Location**: `src/lib/__tests__/game-snapshots.test.ts`

**Purpose**: Catch unintended changes to critical game states

**Coverage**:

- Initial game state
- Key game scenarios
- Edge cases

**Benefits**:

- Catches regressions automatically
- Documents expected behavior
- Low maintenance

## Rust Tests

**Location**: `worker/rust_ai_core/src/lib.rs` and `worker/rust_ai_core/tests/`

**Purpose**: Test core AI algorithm and game logic

**Coverage**:

- Game state management
- Move validation
- AI evaluation function
- AI vs AI simulation

## What We DON'T Test

### 1. Full Game Playthroughs

**Why**: Too slow, fragile, and low value

**Alternative**: Test individual game components and use AI simulation tests

### 2. UI Component Tests

**Why**: High maintenance, low value for game logic

**Alternative**: Focus on business logic and integration tests

### 3. Random Dice Roll Tests

**Why**: Non-deterministic, hard to debug

**Alternative**: Test with fixed dice rolls and edge cases

### 4. Performance Tests

**Why**: Environment-dependent, fragile

**Alternative**: Use AI simulation tests for performance validation

## Running Tests

### Development

```bash
npm run test:watch
```

### CI/CD

```bash
npm run test
```

### Coverage Report

```bash
npm run test:coverage
```

### All Checks (Including Rust)

```bash
npm run check
```

## Test Maintenance

### Adding New Tests

1. **Unit Tests**: Add to existing test files or create new ones in `src/lib/__tests__/`
2. **Integration Tests**: Add to `game-store.test.ts` for store-related tests
3. **Schema Tests**: Add to `schemas.test.ts` for new schemas
4. **Snapshot Tests**: Add to `game-snapshots.test.ts` for new scenarios

### Updating Tests

1. **Unit Tests**: Update when business logic changes
2. **Schema Tests**: Update when schemas change
3. **Snapshot Tests**: Review and update snapshots when behavior changes intentionally
4. **Integration Tests**: Update when store API changes

### Test Naming Conventions

- **Unit Tests**: `should [expected behavior]`
- **Integration Tests**: `should [workflow description]`
- **Snapshot Tests**: `should match [scenario] snapshot`

## Best Practices

### 1. Test Structure

```typescript
describe('Feature', () => {
  describe('Specific Behavior', () => {
    it('should do something specific', () => {
      // Arrange
      const input = setupScenario();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

### 2. Test Data

- Use factory functions for creating test data
- Keep test data minimal and focused
- Use descriptive variable names
- Avoid magic numbers and strings

### 3. Assertions

- Use specific assertions (e.g., `toBe` vs `toBeTruthy`)
- Test one thing per test
- Use descriptive assertion messages
- Group related assertions together

### 4. Mocking

- Mock external dependencies
- Use dependency injection for testability
- Keep mocks simple and focused
- Document mock behavior

## E2E Testing Strategy

### What We Test

- **App Loading**: Verify the app loads without errors
- **Basic Interactions**: Test that all interactive elements work
- **Game Flow**: Verify basic game mechanics function
- **Database Integration**: Test that games are saved correctly

### What We Avoid

- **Full Game Playthroughs**: Too slow and fragile
- **Random Game Scenarios**: Non-deterministic and hard to debug
- **Complex UI Testing**: High maintenance, low value

### E2E Test Example

```typescript
test('simulate win and verify game is saved and stats panel updates', async ({ page }) => {
  await page.goto('/');
  if (process.env.NODE_ENV === 'development') {
    await page.getByTestId('create-near-winning-state').click();
    await page.getByTestId('roll-dice').click();
    await page.waitForTimeout(500);
    const squares = page.locator('[data-testid^="square-"]');
    await squares.nth(12).click();
    await expect(page.locator('text=Victory!')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('wins-count')).toHaveText('1');

    // Verify database save
    const db = new Database('local.db');
    const row = db
      .prepare('SELECT * FROM games WHERE winner = ? ORDER BY completedAt DESC LIMIT 1')
      .get('player1');
    expect(row).toBeTruthy();
    db.close();
  }
});
```

## Continuous Integration

### GitHub Actions

The project uses GitHub Actions for automated testing:

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: actions/setup-rust@v1
      - run: npm install
      - run: npm run check # Run all tests
```

### Pre-commit Hooks

Consider using pre-commit hooks to run tests before commits:

```bash
# .husky/pre-commit
#!/bin/sh
npm run check
```

## Performance Considerations

### Test Execution Time

- **Unit Tests**: < 1 second
- **Integration Tests**: < 5 seconds
- **E2E Tests**: < 30 seconds
- **Full Test Suite**: < 2 minutes

### Memory Usage

- Keep test data minimal
- Clean up resources after tests
- Use test isolation patterns
- Monitor memory usage in CI

## Debugging Tests

### Common Issues

1. **Flaky Tests**: Usually caused by timing or async issues
2. **Slow Tests**: Often due to unnecessary setup or teardown
3. **False Positives**: May indicate test logic errors
4. **Environment Issues**: Different behavior in CI vs local

### Debugging Tools

- **Vitest UI**: Interactive test runner
- **Playwright Inspector**: Step-through E2E tests
- **Console Logging**: Add temporary logs for debugging
- **Test Isolation**: Run tests in isolation to identify issues

## Future Improvements

### Potential Enhancements

1. **Test Coverage**: Increase coverage of edge cases
2. **Performance Testing**: Add performance benchmarks
3. **Visual Regression Testing**: Test UI changes
4. **Accessibility Testing**: Ensure accessibility compliance
5. **Load Testing**: Test under high load conditions

### Monitoring

- Track test execution time
- Monitor test failure rates
- Analyze test coverage trends
- Review test maintenance overhead

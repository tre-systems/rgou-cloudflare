# Playwright Tests for Royal Game of Ur

This directory contains comprehensive end-to-end tests for the Royal Game of Ur web application using Playwright.

## Test Structure

### 📁 Test Files

- **`game-ui.spec.ts`** - UI element tests and responsive design validation
- **`game-functionality.spec.ts`** - Core game mechanics and functionality tests
- **`performance.spec.ts`** - Performance, accessibility, and cross-browser compatibility tests

### 🎯 Test Coverage

#### UI Elements Tests

- ✅ Game title and description display
- ✅ Player information and counters
- ✅ Game controls and buttons
- ✅ Game board presence
- ✅ Rules and instructions
- ✅ Turn indicators
- ✅ Responsive design across devices

#### Game Functionality Tests

- ✅ Dice rolling mechanics
- ✅ Game reset functionality
- ✅ Mode switching (Two-player ↔ AI)
- ✅ Multiple dice rolls handling
- ✅ Turn management
- ✅ Accessibility features
- ✅ AI opponent interaction
- ✅ Game state persistence

#### Performance & Accessibility Tests

- ✅ Page load time validation
- ✅ Core Web Vitals monitoring
- ✅ Rapid interaction handling
- ✅ Resource loading verification
- ✅ Heading structure validation
- ✅ Button accessibility
- ✅ Keyboard navigation
- ✅ Cross-browser compatibility

## Running Tests

### Prerequisites

Make sure you have installed Playwright:

```bash
npm install
npx playwright install
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests with UI mode (interactive)
npm run test:ui

# Run tests in headed mode (visible browser)
npm run test:headed

# Debug tests step by step
npm run test:debug

# View test report
npm run test:report
```

### Browser-Specific Tests

```bash
# Run tests on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run mobile tests
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### Test Filtering

```bash
# Run specific test file
npx playwright test game-ui.spec.ts

# Run tests matching pattern
npx playwright test --grep "should display"

# Run tests in specific describe block
npx playwright test --grep "Royal Game of Ur - UI Elements"
```

## Test Configuration

The tests are configured to run against the deployed site. Update the base URL in `playwright.config.ts` to match your deployment.

Key configuration options in `playwright.config.ts`:

- **Base URL**: Points to the deployed Cloudflare Pages site
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Timeouts**: Configured for web application testing
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Traces**: Collected on retry

## Test Strategies

### 🎮 Game-Specific Testing

- **Dice Rolling**: Tests verify dice functionality without requiring specific outcomes
- **Turn Management**: Validates turn indicators and state changes
- **Mode Switching**: Ensures proper toggling between two-player and AI modes
- **Game Reset**: Confirms game returns to initial state

### 📱 Responsive Testing

- **Mobile Viewports**: iPhone 12, Pixel 5
- **Tablet Viewports**: iPad-like dimensions
- **Desktop Viewports**: Various screen sizes
- **Touch vs Mouse**: Different interaction patterns

### ⚡ Performance Testing

- **Load Time**: Page must load within 5 seconds
- **Layout Stability**: Checks for layout shifts
- **Resource Loading**: Monitors failed requests
- **Interaction Responsiveness**: Tests rapid user actions

### ♿ Accessibility Testing

- **Keyboard Navigation**: Tab order and focus management
- **Screen Reader Support**: Proper button labels and headings
- **Color Contrast**: Basic visibility checks
- **ARIA Compliance**: Semantic HTML structure

## Continuous Integration

These tests are designed to run in CI/CD pipelines. The configuration includes:

- **Retry Logic**: Tests retry on failure in CI
- **Parallel Execution**: Tests run concurrently when possible
- **Artifact Collection**: Screenshots, videos, and traces on failure

## Troubleshooting

### Common Issues

1. **Timeouts**: If tests timeout, the site might be slow or unavailable
2. **Element Not Found**: UI changes might require test updates
3. **Cross-Browser Differences**: Some features might work differently across browsers

### Debugging Tips

1. Use `--debug` flag to step through tests
2. Use `--headed` flag to see browser interactions
3. Check `playwright-report/` for detailed failure information
4. Use `page.pause()` in tests for interactive debugging

## Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Group related tests in describe blocks
3. Use meaningful test descriptions
4. Add proper wait conditions for dynamic content
5. Consider mobile and accessibility implications

## Test Data

Tests use the live deployed site, so they reflect real user scenarios. No test data setup is required, but tests should be resilient to:

- Network delays
- Content loading times
- Browser differences
- Mobile viewport constraints

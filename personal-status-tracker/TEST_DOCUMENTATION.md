# Test Suite Documentation

## Overview

This application includes a comprehensive test suite built with Jest and React Testing Library, following industry best practices for testing React applications.

## Test Structure

```
app/
├── __tests__/
│   └── page.test.tsx              # Integration tests for main page
├── components/
│   ├── status/__tests__/
│   │   ├── WaterIntakeCard.test.tsx
│   │   ├── AltitudeMoodCard.test.tsx
│   │   └── StatusSummary.test.tsx
│   └── ui/__tests__/
│       ├── Button.test.tsx
│       ├── Card.test.tsx
│       ├── ErrorBoundary.test.tsx
│       ├── LoadingSpinner.test.tsx
│       └── Slider.test.tsx
├── hooks/__tests__/
│   ├── useLocalStorage.test.ts
│   └── useStatusData.test.ts
└── lib/utils/__tests__/
    ├── dateFormatters.test.ts
    └── statusHelpers.test.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- app/components/ui/__tests__/Button.test.tsx
```

## Test Categories

### 1. Unit Tests

#### Utility Functions (`lib/utils/__tests__/`)
- **dateFormatters.test.ts**: Tests time formatting, date calculations, and edge cases
- **statusHelpers.test.ts**: Tests status calculations, color mappings, and validation

#### Custom Hooks (`hooks/__tests__/`)
- **useLocalStorage.test.ts**: Tests localStorage operations, error handling, SSR compatibility
- **useStatusData.test.ts**: Tests state management, data updates, and memoization

### 2. Component Tests

#### UI Components (`components/ui/__tests__/`)
- **Button.test.tsx**: Tests variants, interactions, accessibility, disabled states
- **Card.test.tsx**: Tests composition, styling, className merging
- **Slider.test.tsx**: Tests range input, accessibility, controlled/uncontrolled modes
- **LoadingSpinner.test.tsx**: Tests sizes, messages, accessibility
- **ErrorBoundary.test.tsx**: Tests error catching, recovery, fallback UI

#### Feature Components (`components/status/__tests__/`)
- **WaterIntakeCard.test.tsx**: Tests display logic, user interactions, live regions
- **AltitudeMoodCard.test.tsx**: Tests slider integration, dynamic UI, value parsing
- **StatusSummary.test.tsx**: Tests data aggregation, conditional rendering, memoization

### 3. Integration Tests

#### Page Tests (`__tests__/`)
- **page.test.tsx**: Tests component integration, data flow, error states, loading states

## Testing Patterns

### 1. Accessibility Testing
```typescript
it('should have proper ARIA attributes', () => {
  render(<Slider label="Volume" min={0} max={100} value={50} />);
  const slider = screen.getByRole('slider');
  expect(slider).toHaveAttribute('aria-valuenow', '50');
  expect(slider).toHaveAttribute('aria-valuemin', '0');
  expect(slider).toHaveAttribute('aria-valuemax', '100');
});
```

### 2. User Interaction Testing
```typescript
it('should update when button is clicked', async () => {
  const user = userEvent.setup();
  const handleClick = jest.fn();
  
  render(<Button onClick={handleClick}>Click me</Button>);
  await user.click(screen.getByRole('button'));
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### 3. Memoization Testing
```typescript
it('should be memoized to prevent unnecessary re-renders', () => {
  const renderSpy = jest.fn();
  const TestWrapper = ({ value }) => {
    renderSpy();
    return <MemoizedComponent value={value} />;
  };
  
  const { rerender } = render(<TestWrapper value={5} />);
  rerender(<TestWrapper value={5} />);
  
  expect(renderSpy).toHaveBeenCalledTimes(2); // Parent re-renders
  // But memoized child shouldn't re-render
});
```

### 4. Error Handling Testing
```typescript
it('should handle localStorage errors gracefully', () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  (global.localStorage.getItem as jest.Mock).mockImplementation(() => {
    throw new Error('Storage error');
  });
  
  const { result } = renderHook(() => useLocalStorage('key', 'default'));
  
  expect(result.current[0]).toBe('default');
  expect(result.current[3]).toBeInstanceOf(Error);
  
  consoleErrorSpy.mockRestore();
});
```

## Coverage Goals

The test suite aims for:
- **80%+ code coverage** for all files
- **100% coverage** for critical paths (data persistence, user interactions)
- **Comprehensive edge case testing** for utility functions
- **Full accessibility compliance** for all interactive components

## Mocking Strategies

### localStorage Mock
```javascript
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
```

### Component Mocks
```javascript
jest.mock('../hooks/useStatusData', () => ({
  useStatusData: jest.fn()
}));
```

### Timer Mocks
```javascript
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how
2. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Test Accessibility**: Ensure all interactive elements are keyboard accessible
4. **Mock External Dependencies**: Keep tests isolated and fast
5. **Test Edge Cases**: Empty states, error states, loading states
6. **Avoid Testing Implementation Details**: Don't test state variables directly
7. **Use Descriptive Test Names**: Tests should document expected behavior

## Debugging Tests

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run with verbose output
npm test -- --verbose

# Run specific test
npm test -- --testNamePattern="should update water intake"
```

## Continuous Integration

The test suite is designed to run in CI environments:
- Fast execution with parallel test runs
- Deterministic results with mocked timers
- No external dependencies required
- Clear error messages for debugging failures
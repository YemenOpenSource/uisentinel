# UIsentinel Tests

## Running Tests

### All Responsive Extension Tests
```bash
npm run test:responsive
```

This runs 18 comprehensive tests covering:
- Media Query Inspector (3 tests)
- Responsive Design Inspector (9 tests)  
- Mobile UX Analyzer (6 tests)

### Expected Output
```
Running 18 tests using 1 worker

  ✓  MediaQueryInspector › should detect media queries
  ✓  MediaQueryInspector › should identify missing breakpoints
  ✓  MediaQueryInspector › should score based on breakpoint coverage
  ✓  ResponsiveDesignInspector › should identify fixed-width elements
  ✓  ResponsiveDesignInspector › should recognize max-width + width:100% as responsive
  ✓  ResponsiveDesignInspector › should detect overflow containers
  ✓  ResponsiveDesignInspector › should analyze flexbox layouts
  ✓  ResponsiveDesignInspector › should parse CSS unit usage from source
  ✓  ResponsiveDesignInspector › should calculate balanced score
  ✓  MobileUXAnalyzer › should detect viewport meta tag
  ✓  MobileUXAnalyzer › should detect missing viewport meta
  ✓  MobileUXAnalyzer › should identify touch targets below 44x44px
  ✓  MobileUXAnalyzer › should validate WCAG 2.1 touch target compliance
  ✓  MobileUXAnalyzer › should detect text below 16px on mobile
  ✓  MobileUXAnalyzer › should detect tap collision (< 8px spacing)
  ✓  MobileUXAnalyzer › should calculate mobile UX score
  ✓  Integration Tests › should analyze a fully responsive page
  ✓  Integration Tests › should detect multiple issues on non-responsive page

  18 passed (1.2s)
```

## Test Structure

### Unit Tests
Tests individual extension functions in isolation:
- Media query detection
- CSS parsing
- Touch target validation
- Overflow detection
- Scoring algorithms

### Integration Tests
Tests complete workflows:
- Analyzing fully responsive pages
- Detecting multiple issues
- End-to-end validation

## Adding New Tests

```javascript
test.describe('YourExtension', () => {
  test('should do something', async ({ page }) => {
    const html = createTestHTML(`
      /* CSS here */
      .test { property: value; }
    `, `
      <!-- HTML here -->
      <div class="test">Content</div>
    `);
    
    await page.setContent(html);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const result = await page.evaluate(() => {
      // Test code here
      return { success: true };
    });
    
    expect(result.success).toBe(true);
  });
});
```

## Test Coverage

### MediaQueryInspector
- ✅ Detects presence of media queries
- ✅ Identifies missing standard breakpoints
- ✅ Calculates coverage score
- ✅ Handles pages with no media queries

### ResponsiveDesignInspector
- ✅ Identifies fixed-width elements
- ✅ Recognizes responsive patterns (max-width + width: 100%)
- ✅ Detects overflow containers (overflow-x: auto)
- ✅ Analyzes flexbox layouts (flex-wrap)
- ✅ Parses CSS unit usage from source stylesheets
- ✅ Calculates balanced scores
- ✅ Distinguishes intentional from broken overflow
- ✅ Validates grid responsiveness
- ✅ Tests false positive prevention

### MobileUXAnalyzer
- ✅ Detects viewport meta tag
- ✅ Validates viewport configuration
- ✅ Identifies touch targets below 44×44px
- ✅ Validates WCAG 2.1 Level AAA compliance
- ✅ Detects text below 16px
- ✅ Finds tap collisions (< 8px spacing)
- ✅ Calculates mobile UX scores

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run build
      - run: npm run test:responsive
```

## Debugging Failed Tests

### View Test Results
```bash
npx playwright show-report
```

### Run Specific Test
```bash
npx playwright test tests/responsive-extensions.spec.js -g "should detect media queries"
```

### Run in Debug Mode
```bash
npx playwright test tests/responsive-extensions.spec.js --debug
```

### View Screenshots on Failure
Failed tests automatically save screenshots to:
```
test-results/[test-name]/error-context.md
```

## Related Documentation

- **Testing Guide**: `docs/RESPONSIVE_DESIGN_TESTING.md`
- **Issues Analysis**: `RESPONSIVE_ANALYZER_ISSUES.md`
- **Complete Summary**: `RESPONSIVE_EXTENSIONS_COMPLETE.md`

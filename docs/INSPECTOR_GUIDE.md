# Element Inspector & Capture Integration

Complete guide for inspecting elements, capturing screenshots, and generating AI-readable metadata.

## Overview

The ElementInspector uses Chrome DevTools Protocol (CDP) to provide authentic browser inspection capabilities, combined with Playwright's screenshot and element capture features.

## Core Capabilities

### 1. Element Inspection
- Get detailed element information (dimensions, styles, box model)
- Export structured JSON metadata for AI agents
- Native browser DevTools overlay visualization

### 2. Screenshot Capture
- Full page screenshots
- Element-specific zoomed/cropped captures
- Viewport-based captures

### 3. Data Export
- JSON metadata files with complete element info
- Structured data for automated analysis
- Relationship and layout information

## API Reference

### ElementInspector

```javascript
const { ElementInspector } = require('uisentinel');

const inspector = new ElementInspector();
await inspector.initialize(page);

// Inspect element
const result = await inspector.inspect(page, selector, options);

// Options:
// - showInfo: boolean - Show CDP info overlay (default: true)
// - showExtensionLines: boolean - Show extension lines (default: true)
// - saveToFile: string - Path to save JSON metadata
```

### Inspect Method Return Value

```javascript
{
  success: true,
  timestamp: "2025-10-02T12:00:00.000Z",
  selector: "h1",
  element: {
    tagName: "h1",
    id: null,
    className: null,
    textContent: "Example Domain",
    rect: {
      x: 660,
      y: 133.4375,
      width: 600,
      height: 38
    },
    boxModel: {
      margin: { top: 21.44, right: 0, bottom: 21.44, left: 0 },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      border: { top: 0, right: 0, bottom: 0, left: 0 }
    },
    styles: {
      position: "static",
      display: "block",
      color: "rgb(0, 0, 0)",
      backgroundColor: "rgba(0, 0, 0, 0)",
      fontSize: "32px",
      fontFamily: "-apple-system"
    }
  },
  nativeBoxModel: {
    content: [660, 133.4375, 1260, 133.4375, ...],
    padding: [...],
    border: [...],
    margin: [...],
    width: 600,
    height: 38
  },
  computed: {
    contentWidth: 600,
    contentHeight: 38,
    totalWidth: 600,
    totalHeight: 80.88
  }
}
```

## Complete Workflow Example

### Step 1: Inspect Elements & Export JSON

```javascript
const { UISentinel, ElementInspector } = require('uisentinel');

const sentinel = new UISentinel();
await sentinel.start();

const engine = sentinel.getBrowserEngine();
const page = await engine.createPage('https://example.com', 'desktop');

const inspector = new ElementInspector();
await inspector.initialize(page);

// Inspect and save metadata
const h1Data = await inspector.inspect(page, 'h1', {
  showInfo: false,
  saveToFile: './output/h1-metadata.json'
});

console.log(`Element: ${h1Data.element.tagName}`);
console.log(`Size: ${h1Data.element.rect.width}x${h1Data.element.rect.height}`);
console.log(`Position: (${h1Data.element.rect.x}, ${h1Data.element.rect.y})`);
```

### Step 2: Capture Full Page Screenshot

```javascript
await page.screenshot({
  path: './output/fullpage.png',
  fullPage: true
});
```

### Step 3: Capture Element Screenshots (Zoomed)

```javascript
// Get element
const element = await page.$('h1');
const box = await element.boundingBox();

// Capture with padding
await page.screenshot({
  path: './output/element-h1.png',
  clip: {
    x: box.x - 20,  // Add 20px padding
    y: box.y - 20,
    width: box.width + 40,
    height: box.height + 40
  }
});
```

### Step 4: Inspect Multiple Elements

```javascript
const selectors = ['h1', 'p', 'a', 'div'];
const results = [];

for (const selector of selectors) {
  const data = await inspector.inspect(page, selector, {
    showInfo: false,
    saveToFile: `./output/metadata-${selector}.json`
  });
  
  results.push({
    selector,
    tagName: data.element.tagName,
    text: data.element.textContent,
    dimensions: data.element.rect
  });
  
  await inspector.clear(page);
}

// Save summary
fs.writeFileSync(
  './output/page-analysis.json',
  JSON.stringify({ elements: results }, null, 2)
);
```

### Step 5: Read & Analyze (AI Agent Workflow)

```javascript
// Read inspection metadata
const h1Metadata = JSON.parse(
  fs.readFileSync('./output/h1-metadata.json', 'utf-8')
);

// Analyze
const analysis = {
  element: h1Metadata.element.tagName,
  text: h1Metadata.element.textContent,
  fontSize: parseInt(h1Metadata.element.styles.fontSize),
  isVisible: h1Metadata.element.rect.width > 0,
  position: h1Metadata.element.rect,
  boxModel: h1Metadata.element.boxModel
};

// AI agent can now:
// 1. Understand element layout from JSON
// 2. View visual context from screenshots
// 3. Validate accessibility from styles
// 4. Compare expected vs actual dimensions
```

## Use Cases

### 1. Visual Regression Testing

```javascript
// Inspect baseline
const baseline = await inspector.inspect(page, '.component', {
  saveToFile: './baseline/component.json'
});

// Later, compare current state
const current = await inspector.inspect(page, '.component', {
  saveToFile: './current/component.json'
});

// Compare dimensions
const widthChanged = baseline.element.rect.width !== current.element.rect.width;
const heightChanged = baseline.element.rect.height !== current.element.rect.height;
```

### 2. Layout Analysis

```javascript
const elements = await Promise.all([
  inspector.inspect(page, 'header'),
  inspector.inspect(page, 'main'),
  inspector.inspect(page, 'footer')
]);

// Analyze layout
const analysis = {
  headerHeight: elements[0].element.rect.height,
  mainHeight: elements[1].element.rect.height,
  footerHeight: elements[2].element.rect.height,
  totalHeight: elements.reduce((sum, e) => sum + e.element.rect.height, 0)
};
```

### 3. Accessibility Validation

```javascript
const buttonData = await inspector.inspect(page, 'button', {
  saveToFile: './a11y/button.json'
});

// Check accessibility
const a11yIssues = [];

if (parseInt(buttonData.element.styles.fontSize) < 14) {
  a11yIssues.push('Font size too small');
}

if (buttonData.element.rect.height < 44) {
  a11yIssues.push('Touch target too small (min 44px)');
}

// Check color contrast
const bgColor = buttonData.element.styles.backgroundColor;
const textColor = buttonData.element.styles.color;
```

### 4. Element Documentation

```javascript
// Generate component documentation
const componentData = await inspector.inspect(page, '.card', {
  saveToFile: './docs/card-component.json'
});

// Capture visual
const cardElement = await page.$('.card');
const cardBox = await cardElement.boundingBox();
await page.screenshot({
  path: './docs/card-component.png',
  clip: cardBox
});

// Generate markdown
const doc = `
# Card Component

**Dimensions:** ${componentData.element.rect.width}x${componentData.element.rect.height}px

**Styles:**
- Font Size: ${componentData.element.styles.fontSize}
- Color: ${componentData.element.styles.color}
- Background: ${componentData.element.styles.backgroundColor}

**Box Model:**
- Margin: ${JSON.stringify(componentData.element.boxModel.margin)}
- Padding: ${JSON.stringify(componentData.element.boxModel.padding)}

![Component Screenshot](card-component.png)
`;
```

## Best Practices

### 1. Always Save Metadata
```javascript
// ✅ Good - Save for later analysis
await inspector.inspect(page, selector, {
  saveToFile: './metadata/element.json'
});

// ❌ Bad - Data lost after execution
await inspector.inspect(page, selector);
```

### 2. Clear Overlays Between Inspections
```javascript
// ✅ Good
await inspector.inspect(page, 'h1');
await inspector.clear(page);
await inspector.inspect(page, 'p');

// ❌ Bad - Overlays stack up
await inspector.inspect(page, 'h1');
await inspector.inspect(page, 'p');
```

### 3. Capture Context with Padding
```javascript
// ✅ Good - Shows element in context
await page.screenshot({
  clip: {
    x: box.x - 20,
    y: box.y - 20,
    width: box.width + 40,
    height: box.height + 40
  }
});

// ❌ Bad - Too tight, loses context
await page.screenshot({ clip: box });
```

### 4. Structure Output Files
```javascript
// ✅ Good - Organized structure
output/
  metadata/
    h1.json
    paragraph.json
    link.json
  screenshots/
    fullpage.png
    element-h1.png
  analysis/
    report.json

// ❌ Bad - All files mixed together
output/
  h1.json
  fullpage.png
  paragraph.json
  element-h1.png
```

## CLI Integration

```bash
# Inspect and capture in one command (future feature)
uisentinel inspect --url https://example.com --selector "h1" --output ./output

# Batch inspection
uisentinel inspect --url https://example.com --selectors-file selectors.json --output ./output
```

## Advanced: Batch Processing

```javascript
async function batchInspect(page, selectors, outputDir) {
  const inspector = new ElementInspector();
  await inspector.initialize(page);
  
  const results = [];
  
  for (const selector of selectors) {
    try {
      const data = await inspector.inspect(page, selector, {
        showInfo: false,
        saveToFile: path.join(outputDir, `metadata-${selector.replace(/[^a-z0-9]/gi, '_')}.json`)
      });
      
      // Capture element screenshot
      const element = await page.$(selector);
      if (element) {
        const box = await element.boundingBox();
        if (box) {
          await page.screenshot({
            path: path.join(outputDir, `element-${selector.replace(/[^a-z0-9]/gi, '_')}.png`),
            clip: {
              x: Math.max(0, box.x - 10),
              y: Math.max(0, box.y - 10),
              width: box.width + 20,
              height: box.height + 20
            }
          });
        }
      }
      
      results.push({
        selector,
        success: true,
        data: {
          tagName: data.element.tagName,
          text: data.element.textContent,
          dimensions: data.element.rect
        }
      });
      
      await inspector.clear(page);
      
    } catch (error) {
      results.push({
        selector,
        success: false,
        error: error.message
      });
    }
  }
  
  await inspector.cleanup(page);
  return results;
}
```

## Troubleshooting

### Issue: CDP overlay not showing
```javascript
// Ensure CDP is initialized
await inspector.initialize(page);

// Use showInfo: true
await inspector.inspect(page, selector, { showInfo: true });
```

### Issue: Screenshot captures overlay
```javascript
// Clear overlay before screenshot
await inspector.clear(page);
await page.screenshot({ path: './output.png' });
```

### Issue: Element not found
```javascript
// Wait for element first
await page.waitForSelector(selector, { timeout: 5000 });
const data = await inspector.inspect(page, selector);
```

## Next Steps

- See `examples/integrated-workflow.js` for complete working example
- See `examples/inspector-demo.js` for basic inspection examples
- Run `npm run example:workflow` to see the full workflow in action

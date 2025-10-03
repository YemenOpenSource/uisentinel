# Implementation Guide: Element Inspector

This guide shows you how to integrate the Element Inspector into your workflow.

## Installation

```bash
npm install uisentinel
# or
npm install -g uisentinel
```

## Basic Usage

### 1. Simple Inspection

```javascript
const { UISentinel, ElementInspector } = require('uisentinel');

async function inspectPage() {
  const sentinel = new UISentinel();
  await sentinel.start();
  
  const engine = sentinel.getBrowserEngine();
  const page = await engine.createPage('https://example.com', 'desktop');
  
  const inspector = new ElementInspector();
  await inspector.initialize(page);
  
  // Inspect element
  const data = await inspector.inspect(page, 'h1', {
    saveToFile: './h1.json'
  });
  
  console.log(`Element: ${data.element.tagName}`);
  console.log(`Text: ${data.element.textContent}`);
  console.log(`Size: ${data.element.rect.width}x${data.element.rect.height}px`);
  
  await inspector.cleanup(page);
  await sentinel.close();
}

inspectPage();
```

### 2. Inspect Multiple Elements

```javascript
async function inspectMultiple() {
  const sentinel = new UISentinel();
  await sentinel.start();
  
  const engine = sentinel.getBrowserEngine();
  const page = await engine.createPage('https://example.com', 'desktop');
  
  const inspector = new ElementInspector();
  await inspector.initialize(page);
  
  const selectors = ['h1', 'p', 'a', 'button'];
  const results = [];
  
  for (const selector of selectors) {
    const data = await inspector.inspect(page, selector, {
      showInfo: false,
      saveToFile: `./metadata-${selector}.json`
    });
    
    results.push({
      selector,
      tag: data.element.tagName,
      text: data.element.textContent,
      dimensions: data.element.rect
    });
    
    await inspector.clear(page);
  }
  
  console.log('Inspected elements:', results);
  
  await inspector.cleanup(page);
  await sentinel.close();
}
```

### 3. Inspection + Screenshot Workflow

```javascript
async function captureWorkflow() {
  const sentinel = new UISentinel();
  await sentinel.start();
  
  const engine = sentinel.getBrowserEngine();
  const page = await engine.createPage('https://example.com', 'desktop');
  
  const inspector = new ElementInspector();
  await inspector.initialize(page);
  
  // Step 1: Inspect element
  const data = await inspector.inspect(page, 'h1', {
    showInfo: false,
    saveToFile: './output/h1-metadata.json'
  });
  
  // Step 2: Capture full page
  await page.screenshot({
    path: './output/fullpage.png',
    fullPage: true
  });
  
  // Step 3: Capture element zoomed
  const element = await page.$('h1');
  const box = await element.boundingBox();
  
  await page.screenshot({
    path: './output/h1-zoomed.png',
    clip: {
      x: box.x - 20,
      y: box.y - 20,
      width: box.width + 40,
      height: box.height + 40
    }
  });
  
  console.log('Workflow complete!');
  console.log('Files created:');
  console.log('- h1-metadata.json (element data)');
  console.log('- fullpage.png (context)');
  console.log('- h1-zoomed.png (detail)');
  
  await inspector.cleanup(page);
  await sentinel.close();
}
```

## API Reference

### `ElementInspector.initialize(page)`
Initialize CDP connection for the page.

```javascript
await inspector.initialize(page);
```

### `ElementInspector.inspect(page, selector, options)`
Inspect an element and optionally save metadata.

**Parameters:**
- `page`: Playwright Page object
- `selector`: CSS selector string
- `options`: Object (optional)
  - `showInfo`: boolean - Show CDP overlay (default: true)
  - `showExtensionLines`: boolean - Show extension lines (default: true)
  - `saveToFile`: string - Path to save JSON file

**Returns:** Promise<InspectionResult>

```javascript
const result = await inspector.inspect(page, '.button', {
  showInfo: false,
  saveToFile: './button.json'
});
```

### `ElementInspector.clear(page)`
Hide CDP overlay.

```javascript
await inspector.clear(page);
```

### `ElementInspector.cleanup(page)`
Cleanup CDP session.

```javascript
await inspector.cleanup(page);
```

## JSON Output Structure

```typescript
{
  success: boolean;
  timestamp: string;
  selector: string;
  element: {
    tagName: string;
    id: string | null;
    className: string | null;
    textContent: string;
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    boxModel: {
      margin: { top, right, bottom, left };
      padding: { top, right, bottom, left };
      border: { top, right, bottom, left };
    };
    styles: {
      position: string;
      display: string;
      color: string;
      backgroundColor: string;
      fontSize: string;
      fontFamily: string;
      // ... all computed styles
    };
  };
  nativeBoxModel: {
    content: number[];
    padding: number[];
    border: number[];
    margin: number[];
    width: number;
    height: number;
  };
  computed: {
    contentWidth: number;
    contentHeight: number;
    totalWidth: number;
    totalHeight: number;
  };
}
```

## Examples

Run the examples to see the inspector in action:

```bash
# Basic inspector demo
npm run example:inspector

# Complete integrated workflow
npm run example:workflow
```

## Common Patterns

### Pattern 1: Accessibility Check

```javascript
const buttonData = await inspector.inspect(page, 'button');

// Check font size
if (parseInt(buttonData.element.styles.fontSize) < 14) {
  console.log('⚠️  Font size too small for accessibility');
}

// Check touch target
if (buttonData.element.rect.height < 44) {
  console.log('⚠️  Touch target too small (min 44px)');
}
```

### Pattern 2: Visual Regression

```javascript
// Save baseline
await inspector.inspect(page, '.component', {
  saveToFile: './baseline/component.json'
});

// Later, compare
const baseline = JSON.parse(fs.readFileSync('./baseline/component.json'));
const current = await inspector.inspect(page, '.component');

if (baseline.element.rect.width !== current.element.rect.width) {
  console.log('⚠️  Width changed!');
}
```

### Pattern 3: Generate Documentation

```javascript
const data = await inspector.inspect(page, '.card');

// Capture screenshot
const element = await page.$('.card');
const box = await element.boundingBox();
await page.screenshot({ path: './card.png', clip: box });

// Generate markdown
const doc = `
# Card Component

**Size:** ${data.element.rect.width}x${data.element.rect.height}px
**Font:** ${data.element.styles.fontSize} ${data.element.styles.fontFamily}
**Colors:** ${data.element.styles.color} on ${data.element.styles.backgroundColor}

![Screenshot](card.png)
`;

fs.writeFileSync('./card-component.md', doc);
```

## Troubleshooting

### "Element not found"
Wait for the element to be present:
```javascript
await page.waitForSelector(selector, { timeout: 5000 });
const data = await inspector.inspect(page, selector);
```

### CDP connection issues
Ensure you initialize before inspecting:
```javascript
await inspector.initialize(page);
```

### Screenshots capture overlay
Clear the overlay before screenshots:
```javascript
await inspector.clear(page);
await page.screenshot({ path: './clean.png' });
```

## Next Steps

- See [INSPECTOR_GUIDE.md](./INSPECTOR_GUIDE.md) for complete documentation
- See [examples/inspector-demo.js](../examples/inspector-demo.js) for working code
- Run `npm run example:workflow` to see the full workflow

## Support

For issues or questions, please file an issue on GitHub.

# UISentinel Inspector Workflow

Simple guide to inspect elements, capture screenshots, and generate AI-readable metadata.

## Quick Start

```javascript
const { UISentinel, ElementInspector } = require('uisentinel');

const sentinel = new UISentinel();
await sentinel.start();

const engine = sentinel.getBrowserEngine();
const page = await engine.createPage('https://example.com', 'desktop');

// Initialize inspector
const inspector = new ElementInspector();
await inspector.initialize(page);

// Inspect element and save JSON
const data = await inspector.inspect(page, 'h1', {
  saveToFile: './output/h1.json'
});

console.log(`Element: ${data.element.tagName}`);
console.log(`Size: ${data.element.rect.width}x${data.element.rect.height}px`);

// Capture screenshot
await page.screenshot({ path: './output/fullpage.png', fullPage: true });

await inspector.cleanup(page);
await sentinel.close();
```

## What You Get

### 1. JSON Metadata (AI-readable)
```json
{
  "success": true,
  "timestamp": "2025-10-02T12:00:00.000Z",
  "selector": "h1",
  "element": {
    "tagName": "h1",
    "textContent": "Example Domain",
    "rect": { "width": 600, "height": 38, "x": 660, "y": 133 },
    "boxModel": {
      "margin": { "top": 21.44, "right": 0, "bottom": 21.44, "left": 0 },
      "padding": { "top": 0, "right": 0, "bottom": 0, "left": 0 }
    },
    "styles": {
      "fontSize": "32px",
      "color": "rgb(0, 0, 0)",
      "fontFamily": "-apple-system"
    }
  },
  "computed": {
    "contentWidth": 600,
    "contentHeight": 38,
    "totalWidth": 600,
    "totalHeight": 80.88
  }
}
```

### 2. Screenshots
- Full page captures
- Element-specific zoomed screenshots
- Visual context for AI analysis

## Key Methods

### `inspector.inspect(page, selector, options)`
Inspect an element and optionally save metadata to JSON.

**Options:**
- `showInfo: boolean` - Show CDP overlay (default: true)
- `saveToFile: string` - Path to save JSON metadata

**Returns:** Object with element data, dimensions, styles, box model

### `inspector.clear(page)`
Hide CDP overlay.

### `inspector.cleanup(page)`
Cleanup CDP session.

## Capture Element Screenshot

```javascript
// Get element
const element = await page.$('h1');
const box = await element.boundingBox();

// Capture with padding
await page.screenshot({
  path: './h1.png',
  clip: {
    x: box.x - 20,
    y: box.y - 20,
    width: box.width + 40,
    height: box.height + 40
  }
});
```

## Examples

Run the integrated workflow example:
```bash
npm run example:workflow
```

This will:
1. Inspect multiple elements
2. Save JSON metadata for each
3. Capture full page screenshot
4. Capture zoomed element screenshots
5. Generate analysis report

## Documentation

See [INSPECTOR_GUIDE.md](./INSPECTOR_GUIDE.md) for complete documentation.

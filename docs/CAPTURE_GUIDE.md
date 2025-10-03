# Element Capture with Metadata

Complete guide for capturing cropped element screenshots with detailed metadata including image dimensions and relative bounding boxes.

## Overview

The ElementInspector now provides three powerful methods for capturing elements with full metadata:

1. **`inspectAndCapture()`** - Capture a single element with padding
2. **`inspectAndCaptureMultiple()`** - Batch capture multiple elements
3. **`captureRegionWithElements()`** - Capture a custom region with element positions

All methods return comprehensive metadata including:
- Image dimensions (width × height)
- Element bounding boxes **relative to the captured image**
- Complete element inspection data (styles, box model, etc.)
- Capture region information

## Why This Matters

When you capture a cropped screenshot, you need to know:
- **Image size**: The actual dimensions of the PNG file
- **Element position**: Where the element is within that image (not the full page)
- **Element data**: All inspection metadata for AI analysis

This is crucial for:
- ✅ AI agents analyzing screenshots
- ✅ Automated testing with visual validation
- ✅ Creating annotated documentation
- ✅ Training ML models on UI elements

## Method 1: inspectAndCapture()

Inspect and capture a single element with customizable padding.

### API

```typescript
async inspectAndCapture(
  page: Page,
  selector: string,
  options?: {
    padding?: number;           // Padding around element (default: 20px)
    screenshotPath?: string;    // Where to save PNG
    metadataPath?: string;      // Where to save JSON
    showOverlay?: boolean;      // Show CDP overlay (default: false)
  }
): Promise<InspectAndCaptureResult>
```

### Example

```javascript
const { UISentinel, ElementInspector } = require('uisentinel');

const sentinel = new UISentinel();
await sentinel.start();

const engine = sentinel.getBrowserEngine();
const page = await engine.createPage('https://example.com', 'desktop');

const inspector = new ElementInspector();
await inspector.initialize(page);

// Capture h1 element with 30px padding
const result = await inspector.inspectAndCapture(page, 'h1', {
  padding: 30,
  screenshotPath: './h1-capture.png',
  metadataPath: './h1-metadata.json',
});

console.log('Image size:', result.capture.imageSize);
// { width: 660, height: 98 }

console.log('Element in image:', result.capture.elementBoundingBox);
// { x: 30, y: 30, width: 600, height: 38 }
```

### Result Structure

```json
{
  "success": true,
  "timestamp": "2025-10-02T12:00:00.000Z",
  "selector": "h1",
  "element": {
    "tagName": "h1",
    "textContent": "Example Domain",
    "rect": { "x": 660, "y": 133, "width": 600, "height": 38 },
    "boxModel": { "margin": {...}, "padding": {...}, "border": {...} },
    "styles": { "fontSize": "32px", "color": "rgb(0, 0, 0)", ... }
  },
  "capture": {
    "region": { "x": 630, "y": 103, "width": 660, "height": 98 },
    "imageSize": { "width": 660, "height": 98 },
    "elementBoundingBox": { "x": 30, "y": 30, "width": 600, "height": 38 },
    "screenshotPath": "./h1-capture.png",
    "padding": 30
  }
}
```

**Key Points:**
- `region`: Where on the page the screenshot was taken
- `imageSize`: Dimensions of the saved PNG file
- `elementBoundingBox`: Element position **within the PNG** (not page coordinates!)
- Element is centered with padding on all sides

## Method 2: inspectAndCaptureMultiple()

Batch capture multiple elements with a single call.

### API

```typescript
async inspectAndCaptureMultiple(
  page: Page,
  selectors: string[],
  options?: {
    padding?: number;          // Padding for each element (default: 20px)
    outputDir?: string;        // Output directory (default: './output')
    includeFullPage?: boolean; // Also capture full page (default: true)
  }
): Promise<BatchCaptureResult>
```

### Example

```javascript
const result = await inspector.inspectAndCaptureMultiple(
  page,
  ['h1', 'p', '.button', '#logo'],
  {
    padding: 20,
    outputDir: './captures',
    includeFullPage: true,
  }
);

console.log(`Captured ${result.successfulCaptures}/${result.totalElements} elements`);
// Captured 4/4 elements

console.log('Full page:', result.fullPage);
// { path: './captures/fullpage.png', width: 1920, height: 1080 }

result.elements.forEach(el => {
  if (el.success) {
    console.log(`${el.selector}: ${el.screenshotPath}`);
    console.log(`  Image: ${el.capture.imageSize.width}x${el.capture.imageSize.height}px`);
    console.log(`  Element: ${el.capture.elementBoundingBox.width}x${el.capture.elementBoundingBox.height}px`);
  }
});
```

### Generated Files

```
captures/
  ├── fullpage.png                    # Full page context
  ├── element-1-h1.png                # Cropped screenshots
  ├── element-1-h1.json               # Metadata with bounding box
  ├── element-2-p.png
  ├── element-2-p.json
  ├── element-3-_button.png
  ├── element-3-_button.json
  ├── element-4-_logo.png
  ├── element-4-_logo.json
  └── capture-summary.json            # Complete batch report
```

### Summary Report Structure

```json
{
  "timestamp": "2025-10-02T12:00:00.000Z",
  "fullPage": {
    "path": "./captures/fullpage.png",
    "width": 1920,
    "height": 1080
  },
  "elements": [
    {
      "index": 1,
      "selector": "h1",
      "success": true,
      "screenshotPath": "./captures/element-1-h1.png",
      "metadataPath": "./captures/element-1-h1.json",
      "element": {...},
      "capture": {
        "imageSize": { "width": 640, "height": 78 },
        "elementBoundingBox": { "x": 20, "y": 20, "width": 600, "height": 38 }
      }
    }
  ],
  "totalElements": 4,
  "successfulCaptures": 4,
  "failedCaptures": 0
}
```

## Method 3: captureRegionWithElements()

Capture a specific page region and get positions of elements within it.

### API

```typescript
async captureRegionWithElements(
  page: Page,
  region: { x: number; y: number; width: number; height: number },
  selectors: string[],
  options?: {
    screenshotPath?: string;
    metadataPath?: string;
  }
): Promise<RegionCaptureResult>
```

### Example

```javascript
// Capture top 400px of page
const result = await inspector.captureRegionWithElements(
  page,
  { x: 0, y: 0, width: 1920, height: 400 },
  ['h1', 'p', '.nav', '.hero'],
  {
    screenshotPath: './header-region.png',
    metadataPath: './header-region.json',
  }
);

console.log('Region captured:', result.capture.imageSize);
// { width: 1920, height: 400 }

console.log('Elements visible:', result.visibleElementsCount);
// 3 (out of 4)

result.elements.forEach(el => {
  if (el.visible) {
    console.log(`${el.selector}:`);
    console.log(`  Position in region: (${el.relativeBoundingBox.x}, ${el.relativeBoundingBox.y})`);
    console.log(`  Size: ${el.relativeBoundingBox.width}x${el.relativeBoundingBox.height}px`);
  }
});
```

### Result Structure

```json
{
  "success": true,
  "timestamp": "2025-10-02T12:00:00.000Z",
  "capture": {
    "region": { "x": 0, "y": 0, "width": 1920, "height": 400 },
    "imageSize": { "width": 1920, "height": 400 },
    "screenshotPath": "./header-region.png"
  },
  "elements": [
    {
      "selector": "h1",
      "visible": true,
      "relativeBoundingBox": { "x": 660, "y": 133, "width": 600, "height": 38 },
      "element": {...}
    },
    {
      "selector": ".hero",
      "visible": false,
      "relativeBoundingBox": { "x": 0, "y": 500, "width": 1920, "height": 400 }
    }
  ],
  "visibleElementsCount": 3
}
```

**Note:** `visible: false` means the element is outside the captured region.

## Use Cases

### 1. AI Agent Workflow

```javascript
// Capture component with metadata for AI analysis
const result = await inspector.inspectAndCapture(page, '.card-component', {
  padding: 20,
  screenshotPath: './card.png',
  metadataPath: './card.json',
});

// AI agent can now:
// 1. View card.png for visual context
// 2. Read card.json for dimensions, styles, text
// 3. Know exact element position in the image
// 4. Validate accessibility (font size, colors, etc.)
```

### 2. Visual Documentation

```javascript
// Capture multiple components for documentation
const components = ['button', 'input', 'card', 'modal'];

const result = await inspector.inspectAndCaptureMultiple(page, components, {
  outputDir: './component-library',
  padding: 30,
});

// Generate markdown docs with images + specs
result.elements.forEach(comp => {
  if (comp.success) {
    console.log(`## ${comp.selector}`);
    console.log(`![${comp.selector}](${comp.screenshotPath})`);
    console.log(`Size: ${comp.element.rect.width}x${comp.element.rect.height}px`);
    console.log(`Font: ${comp.element.styles.fontSize}`);
  }
});
```

### 3. Responsive Testing

```javascript
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
];

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  
  const result = await inspector.inspectAndCapture(page, '.responsive-nav', {
    padding: 10,
    screenshotPath: `./nav-${vp.name}.png`,
    metadataPath: `./nav-${vp.name}.json`,
  });
  
  console.log(`${vp.name}: ${result.capture.imageSize.width}x${result.capture.imageSize.height}px`);
}
```

### 4. A11y Validation with Visual Context

```javascript
const buttons = await page.$$('button');

for (let i = 0; i < buttons.length; i++) {
  const result = await inspector.inspectAndCapture(page, `button:nth-of-type(${i + 1})`, {
    padding: 15,
    screenshotPath: `./buttons/button-${i + 1}.png`,
    metadataPath: `./buttons/button-${i + 1}.json`,
  });
  
  // Check accessibility
  const fontSize = parseInt(result.element.styles.fontSize);
  const height = result.element.rect.height;
  
  if (fontSize < 14) {
    console.log(`⚠️  Button ${i + 1}: Font too small (${fontSize}px)`);
  }
  
  if (height < 44) {
    console.log(`⚠️  Button ${i + 1}: Touch target too small (${height}px)`);
  }
}
```

## Key Concepts

### Coordinate Systems

**Page Coordinates** (absolute):
- `element.rect`: Position on the full page
- Example: `{ x: 660, y: 133, width: 600, height: 38 }`

**Image Coordinates** (relative):
- `capture.elementBoundingBox`: Position within the captured PNG
- Example: `{ x: 30, y: 30, width: 600, height: 38 }`

**Conversion:**
```javascript
const result = await inspector.inspectAndCapture(page, 'h1', { padding: 30 });

// Element on page
console.log(result.element.rect.x); // 660 (page coordinate)

// Element in image
console.log(result.capture.elementBoundingBox.x); // 30 (image coordinate = padding)

// Region captured
console.log(result.capture.region.x); // 630 (= 660 - 30 padding)
```

### Padding Behavior

Padding adds space around the element in the capture:

```javascript
// Element: 600x38px at (660, 133)
// Padding: 30px

// Captured region:
{
  x: 630,      // = 660 - 30
  y: 103,      // = 133 - 30
  width: 660,  // = 600 + 30 + 30
  height: 98   // = 38 + 30 + 30
}

// Element in image:
{
  x: 30,       // = padding
  y: 30,       // = padding
  width: 600,  // = original width
  height: 38   // = original height
}
```

## Examples

Run the examples to see these capabilities in action:

```bash
# Basic capture demo
npm run example:capture

# Integrated workflow with captures
npm run example:workflow
```

## Tips

1. **Use appropriate padding** for context
   - Small elements (buttons): 15-20px
   - Medium elements (cards): 20-30px
   - Large elements (sections): 30-50px

2. **Batch capture for efficiency**
   - Process multiple elements in one call
   - Automatic file naming
   - Summary report included

3. **Save both screenshot and metadata**
   - Screenshot for visual analysis
   - JSON for programmatic analysis
   - Bounding boxes link them together

4. **Custom regions for specific areas**
   - Header: `{ x: 0, y: 0, width: 1920, height: 200 }`
   - Sidebar: `{ x: 0, y: 0, width: 300, height: 1080 }`
   - Content area: `{ x: 300, y: 0, width: 1620, height: 1080 }`

## Next Steps

- See [INSPECTOR_GUIDE.md](./INSPECTOR_GUIDE.md) for complete API reference
- See [examples/capture-with-metadata-demo.js](../examples/capture-with-metadata-demo.js) for working code
- Run `npm run example:capture` to see all features in action

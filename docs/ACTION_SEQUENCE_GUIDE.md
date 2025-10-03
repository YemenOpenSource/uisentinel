# Action Sequence Inspector - Documentation

## Overview

The Element Inspector now includes advanced action sequence capabilities that allow you to:

1. **Execute multiple actions** in sequence on one or more elements
2. **Capture intermediate states** or only the final result
3. **Choose between full-page or viewport captures**
4. **Automatic scrolling** - elements are automatically scrolled into view when needed

## Key Improvements

### 🎯 Automatic Scrolling

The inspector now intelligently handles scrolling:
- **Checks viewport visibility** before any action
- **Only scrolls when needed** - if element is already visible, no scroll occurs
- **Works for SPAs and landing pages** - properly handles long-scrolling pages
- **No manual scroll action needed** - removed from action types

### 📸 Viewport vs Full-Page Capture

You can now choose between two capture modes:

```javascript
// Full-page screenshot (default)
captureViewport: false

// Viewport-only screenshot (current view)
captureViewport: true
```

## API Reference

### `inspect()` - Enhanced Options

```typescript
await inspector.inspect(page, selector, {
  // Screenshot options
  captureScreenshot?: boolean;           // Full-page screenshot (default: true)
  captureViewportScreenshot?: boolean;   // Viewport screenshot (default: false)
  captureElementScreenshot?: boolean;    // Element close-up (default: true)
  captureZoomedScreenshot?: boolean;     // Zoomed element view (default: false)
  
  // Overlay and annotation
  showOverlay?: boolean;                 // Show DevTools-style overlay (default: true)
  showInfo?: boolean;                    // Show element info (default: true)
  
  // Other options...
});
```

### `inspectWithAction()` - Single Action

Execute a single action and capture before/after states.

**Available Actions:** `click`, `hover`, `focus` (scroll removed - automatic now!)

```javascript
await inspector.inspectWithAction(
  page,
  '.button',
  { 
    type: 'click',
    target: '.button' // Optional: different element for action
  },
  {
    outputName: 'button-click',
    captureDelay: 500 // Wait time after action (ms)
  }
);
```

### `inspectWithActionSequence()` - NEW! Multiple Actions

Execute a sequence of actions with full control over state capture.

**Available Actions:** `click`, `hover`, `focus`, `type`, `wait`

```javascript
await inspector.inspectWithActionSequence(
  page,
  '.target-element',
  [
    { type: 'hover' },
    { type: 'wait', duration: 500 },
    { type: 'click' },
    { type: 'focus', target: '.other-element' },
    { type: 'type', value: 'Hello World' },
  ],
  {
    outputName: 'complex-interaction',
    captureDelay: 500,              // Wait after each action (default: 500ms)
    captureIntermediate: true,      // Capture after EACH action (default: false)
    captureViewport: false          // Full-page or viewport (default: false)
  }
);
```

#### Action Types

| Action | Parameters | Description |
|--------|-----------|-------------|
| `click` | `target?` | Click element (auto-scrolls if needed) |
| `hover` | `target?` | Hover over element |
| `focus` | `target?` | Focus element |
| `type` | `target?`, `value` | Type text into element |
| `wait` | `duration` | Wait specified milliseconds |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `outputName` | `string` | auto-generated | Base name for output files |
| `captureDelay` | `number` | `500` | Wait time after each action (ms) |
| `captureIntermediate` | `boolean` | `false` | Capture after each action vs final only |
| `captureViewport` | `boolean` | `false` | Viewport screenshots vs full-page |

#### Return Value

```typescript
{
  success: boolean;
  timestamp: string;
  selector: string;
  actionsPerformed: number;
  actions: Array<{
    step: number;
    type: string;
    target: string;
    value?: string;
  }>;
  screenshots: Array<{
    step: number;
    action: string;
    path: string;
  }>;
  finalElementState: {
    tagName: string;
    rect: { x, y, width, height };
    styles: { ... };
    // ... more element info
  };
  captureMode: 'viewport' | 'fullPage';
  files: {
    result: string;  // JSON file path
    report: string;  // Markdown report path
  };
}
```

## Usage Examples

### Example 1: Form Interaction (Intermediate Captures)

```javascript
const inspector = new ElementInspector();
inspector.setOutputDir('./output');
await inspector.initialize(page);

// Fill form with intermediate captures
await inspector.inspectWithActionSequence(
  page,
  'form',
  [
    { type: 'focus', target: '#name' },
    { type: 'type', target: '#name', value: 'John Doe' },
    { type: 'wait', duration: 300 },
    { type: 'focus', target: '#email' },
    { type: 'type', target: '#email', value: 'john@example.com' },
    { type: 'wait', duration: 300 },
    { type: 'click', target: 'button[type="submit"]' },
  ],
  {
    outputName: 'form-submission',
    captureIntermediate: true,  // Capture after EACH action
    captureViewport: true       // Only viewport (form area)
  }
);
```

### Example 2: UI Interaction (Final State Only)

```javascript
// Test dropdown menu - only care about final state
await inspector.inspectWithActionSequence(
  page,
  '.dropdown',
  [
    { type: 'click', target: '.dropdown-trigger' },
    { type: 'wait', duration: 300 },
    { type: 'hover', target: '.dropdown-item:nth-child(3)' },
    { type: 'click', target: '.dropdown-item:nth-child(3)' },
  ],
  {
    outputName: 'dropdown-selection',
    captureIntermediate: false,  // Only initial + final
    captureViewport: false       // Full page context
  }
);
```

### Example 3: Animation Testing

```javascript
// Test animation sequence with full visibility
await inspector.inspectWithActionSequence(
  page,
  '.animated-card',
  [
    { type: 'hover' },
    { type: 'wait', duration: 500 },  // Let animation complete
    { type: 'click' },
    { type: 'wait', duration: 800 },  // Let transition finish
  ],
  {
    outputName: 'card-animation',
    captureIntermediate: true,  // See each animation frame
    captureDelay: 100,          // Quick captures
    captureViewport: true
  }
);
```

### Example 4: Deep Scroll Testing (SPA/Landing Page)

```javascript
// Test element far down the page - automatic scroll!
await inspector.inspectWithActionSequence(
  page,
  '.footer-cta',
  [
    { type: 'hover' },    // Auto-scrolls to footer if needed
    { type: 'click' },
  ],
  {
    outputName: 'footer-interaction',
    captureIntermediate: true,
    captureViewport: false  // Show full page context
  }
);
```

## Output Files

Each sequence generates multiple files:

```
action-sequence-output/
├── demo1-button-interaction-{timestamp}-0-initial.png
├── demo1-button-interaction-{timestamp}-1-hover.png
├── demo1-button-interaction-{timestamp}-2-wait.png
├── demo1-button-interaction-{timestamp}-3-click.png
├── demo1-button-interaction-{timestamp}-sequence-result.json
└── demo1-button-interaction-{timestamp}-sequence-report.md
```

### JSON Output Structure

```json
{
  "success": true,
  "timestamp": "2025-10-03T...",
  "selector": ".target",
  "actionsPerformed": 3,
  "actions": [
    { "step": 1, "type": "hover", "target": ".target" },
    { "step": 2, "type": "wait", "target": ".target" },
    { "step": 3, "type": "click", "target": ".target" }
  ],
  "screenshots": [
    { "step": 0, "action": "initial", "path": "..." },
    { "step": 1, "action": "hover", "path": "..." },
    { "step": 2, "action": "wait", "path": "..." },
    { "step": 3, "action": "click", "path": "..." }
  ],
  "finalElementState": { /* detailed element info */ },
  "captureMode": "fullPage"
}
```

### Markdown Report

The generated markdown report includes:
- Action sequence summary
- Screenshots at each step (embedded)
- Final element state details
- Timing information

## Best Practices

### 1. **Choose Capture Mode Wisely**

```javascript
// Use viewport for focused testing (faster, smaller files)
captureViewport: true   // Form inputs, buttons, specific components

// Use full-page for context (see page state)
captureViewport: false  // Navigation, scrolling, page transitions
```

### 2. **Intermediate vs Final Capture**

```javascript
// Capture intermediate for:
// - Animation testing
// - Multi-step forms
// - Debugging interactions
captureIntermediate: true

// Only final for:
// - Simple click tests
// - Final state verification
// - Performance (less screenshots)
captureIntermediate: false
```

### 3. **Wait Duration**

```javascript
// Short waits for instant feedback
{ type: 'wait', duration: 100-300 }

// Medium waits for animations
{ type: 'wait', duration: 300-800 }

// Long waits for transitions/loading
{ type: 'wait', duration: 1000-2000 }
```

### 4. **Automatic Scrolling**

No need to manually scroll! The inspector handles it:

```javascript
// ❌ OLD WAY (removed)
{ type: 'scroll' }  // No longer needed!

// ✅ NEW WAY - Automatic!
{ type: 'hover' }  // Scrolls automatically if needed
```

## Migration Guide

### From Old API

```javascript
// ❌ Old: Manual scroll action
await inspector.inspectWithAction(
  page,
  '.element',
  { type: 'scroll' }  // REMOVED
);

// ✅ New: Automatic scroll
await inspector.inspect(page, '.element');  // Scrolls automatically
```

### From inspectWithAction to inspectWithActionSequence

```javascript
// ❌ Old: Multiple single actions
await inspector.inspectWithAction(page, '.btn', { type: 'hover' });
await inspector.inspectWithAction(page, '.btn', { type: 'click' });

// ✅ New: Single sequence
await inspector.inspectWithActionSequence(
  page,
  '.btn',
  [
    { type: 'hover' },
    { type: 'click' }
  ],
  { captureIntermediate: true }
);
```

## Tips & Tricks

1. **Use `captureIntermediate: false` for quick tests** - Only captures initial and final state
2. **Combine with viewport capture** for focused UI testing
3. **Add wait actions** between interactions for smoother animations
4. **Different targets** - Actions can target different elements than the inspected element
5. **Check reports** - Markdown reports provide excellent documentation

## Troubleshooting

### Element Not Found During Sequence

```javascript
// Solution: Add wait before action
{ type: 'wait', duration: 500 },
{ type: 'click', target: '.dynamic-element' }
```

### Scroll Behavior Issues

The automatic scroll should handle most cases. If issues occur:
- Element might be hidden or have `display: none`
- Parent container might have `overflow: hidden`
- Element might be covered by fixed headers

### Performance

For better performance with long sequences:
- Use `captureIntermediate: false`
- Use `captureViewport: true`
- Increase `captureDelay` to reduce screenshot frequency

## See Also

- [Inspector Guide](./INSPECTOR_GUIDE.md)
- [Quick Start](./quick-start.md)
- [API Documentation](./api.md)

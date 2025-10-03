# UIsentinel MCP Tools - Usage Guide

Complete guide for using UIsentinel's 11 MCP tools with AI agents (Claude Desktop, Cursor, etc.)

---

## Prerequisites

Before using any inspection tools, you need:
1. ✅ MCP server configured in Claude Desktop (see QUICKSTART.md)
2. ✅ A **running web server** with your app
3. ✅ The URL of your app (e.g., `http://localhost:3000`)

**Important:** Most tools require an active web page to inspect!

---

## Tool 1: `uisentinel_inspect_element`

### Purpose
Deep inspection of a specific element with full metadata, screenshots, and box model.

### Required Parameters
- `url` (string) - URL of the page
- `selector` (string) - CSS selector (e.g., `"button"`, `".hero-section"`, `"#login-form"`)

### Optional Parameters
```json
{
  "viewport": "desktop|mobile|tablet",  // default: "desktop"
  "showOverlay": true,                   // Show DevTools-style highlight
  "captureScreenshot": true,             // Full page screenshot
  "captureElementScreenshot": true,      // Cropped element screenshot
  "captureZoomedScreenshot": false,      // Zoomed-in screenshot
  "zoomLevel": 2,                        // Zoom level (2x, 3x, etc.)
  "includeParent": true,                 // Include parent element data
  "includeChildren": true,               // Include children data
  "includeComputedStyles": true,         // All computed CSS
  "includeAttributes": true              // HTML attributes
}
```

### Example Usage in Claude Desktop

**Natural language:**
```
"Inspect the login button on http://localhost:3000"
```

**What Claude will call:**
```json
{
  "url": "http://localhost:3000",
  "selector": "button[type='submit']",
  "captureScreenshot": true,
  "includeComputedStyles": true
}
```

### Response Structure
```json
{
  "success": true,
  "data": {
    "element": {
      "tagName": "BUTTON",
      "rect": { "width": 120, "height": 40, "x": 100, "y": 200 },
      "boxModel": {
        "margin": { "top": 10, "right": 0, "bottom": 10, "left": 0 },
        "padding": { "top": 12, "right": 24, "bottom": 12, "left": 24 },
        "border": { "top": 1, "right": 1, "bottom": 1, "left": 1 }
      },
      "styles": {
        "backgroundColor": "rgb(37, 99, 235)",
        "color": "rgb(255, 255, 255)",
        "fontSize": "16px"
      },
      "attributes": { "type": "submit", "class": "btn-primary" }
    }
  },
  "files": {
    "screenshots": ["./mcp-output/inspections/element-1234.png"],
    "json": ["./mcp-output/inspections/element-1234.json"]
  }
}
```

---

## Tool 2: `uisentinel_check_accessibility`

### Purpose
Run WCAG 2.1 accessibility checks and get violation reports.

### Required Parameters
- `url` (string) - URL of the page

### Optional Parameters
```json
{
  "viewport": "desktop|mobile|tablet",  // default: "desktop"
  "showViolations": true,                // Show markers on screenshot
  "highlightIssues": true                // Highlight problematic elements
}
```

### Example Usage
```
"Check accessibility of http://localhost:3000"
```

### Response Structure
```json
{
  "success": true,
  "data": {
    "score": 95,
    "violations": [
      {
        "severity": "serious",
        "rule": "color-contrast",
        "description": "Elements must have sufficient color contrast",
        "affectedElements": [".text-gray"]
      }
    ],
    "summary": {
      "total": 2,
      "critical": 0,
      "serious": 1,
      "moderate": 1,
      "minor": 0
    }
  }
}
```

---

## Tool 3: `uisentinel_check_contrast`

### Purpose
Analyze color contrast ratios for all text elements.

### Required Parameters
- `url` (string) - URL of the page

### Optional Parameters
```json
{
  "viewport": "desktop|mobile|tablet",
  "minRatioAA": 4.5,    // WCAG AA standard
  "minRatioAAA": 7,     // WCAG AAA standard
  "highlightIssues": true
}
```

### Example Usage
```
"Check text contrast on http://localhost:3000"
```

### Response
```json
{
  "success": true,
  "data": {
    "issues": [
      {
        "selector": ".hero-text",
        "ratio": 3.2,
        "passAA": false,
        "passAAA": false,
        "foreground": "#60a5fa",
        "background": "#ffffff",
        "suggestedFix": "Change to #2563eb for 7.1:1 ratio"
      }
    ]
  }
}
```

---

## Tool 4: `uisentinel_measure_element`

### Purpose
Get visual box model measurements with overlays.

### Required Parameters
- `url` (string)
- `selector` (string)

### Optional Parameters
```json
{
  "viewport": "desktop|mobile|tablet",
  "showDimensions": true,
  "showMargin": true,
  "showPadding": true,
  "showBorder": true
}
```

### Example Usage
```
"Measure the hero section dimensions"
```

---

## Tool 5: `uisentinel_detect_components`

### Purpose
Auto-detect all UI components on the page.

### Required Parameters
- `url` (string)

### Optional Parameters
```json
{
  "viewport": "desktop|mobile|tablet",
  "includePosition": false,
  "highlightComponents": false
}
```

### Example Usage
```
"What components are on http://localhost:3000?"
```

### Response
```json
{
  "success": true,
  "data": {
    "components": {
      "buttons": 5,
      "forms": 1,
      "inputs": 3,
      "links": 12,
      "images": 8
    },
    "details": [
      { "type": "button", "selector": ".btn-primary", "text": "Submit" },
      { "type": "input", "selector": "#email", "label": "Email Address" }
    ]
  }
}
```

---

## Tool 6: `uisentinel_check_breakpoints`

### Purpose
Test responsive design across all viewports.

### Required Parameters
- `url` (string)

### Optional Parameters
```json
{
  "captureAllBreakpoints": true  // Captures mobile, tablet, desktop
}
```

### Example Usage
```
"Test responsive design of http://localhost:3000"
```

---

## Tool 7: `uisentinel_analyze_layout` ⭐ NEW

### Purpose
Detect layout issues like overflows, invisible text, positioning problems.

### Required Parameters
- `url` (string)

### Optional Parameters
```json
{
  "viewport": "desktop|mobile|tablet"
}
```

### Example Usage
```
"Analyze the layout of http://localhost:3000"
"Are there any overflows on the page?"
```

### Response
```json
{
  "success": true,
  "data": {
    "elements": [
      {
        "selector": "div#container",
        "boundingBox": { "x": 0, "y": 0, "width": 1200, "height": 800 },
        "visible": true,
        "zIndex": 0
      }
    ],
    "overflows": [
      {
        "element": "div.sidebar",
        "overflowX": 0,
        "overflowY": 50  // Overflowing by 50px
      }
    ],
    "invisibleText": [
      {
        "element": "span.hidden-label",
        "reason": "Text color matches background"
      }
    ]
  }
}
```

---

## Tool 8: `uisentinel_detect_project` ⭐ NEW

### Purpose
Detect framework, package manager, and project configuration.

### Required Parameters
- `projectPath` (string) - Path to project directory

### Example Usage
```
"What framework is this project using?"
"Detect the project configuration"
```

### Response
```json
{
  "success": true,
  "data": {
    "framework": "nextjs",
    "packageManager": "pnpm",
    "devCommand": "next dev",
    "defaultPort": 3000,
    "configFiles": ["next.config.js"],
    "lockFile": "pnpm-lock.yaml",
    "confidence": 100
  }
}
```

**Note:** This tool doesn't require a running server!

---

## Tool 9: `uisentinel_inspect_multiple`

### Purpose
Compare multiple elements at once.

### Required Parameters
- `url` (string)
- `selectors` (array) - Array of CSS selectors

### Example Usage
```
"Compare all the buttons on the page"
```

**Claude will call:**
```json
{
  "url": "http://localhost:3000",
  "selectors": [".btn-primary", ".btn-secondary", ".btn-danger"]
}
```

---

## Tool 10: `uisentinel_inspect_with_action`

### Purpose
Test interactions (hover, click, focus, scroll) with before/after comparison.

### Required Parameters
- `url` (string)
- `selector` (string)
- `action` (string) - One of: `"click"`, `"hover"`, `"focus"`, `"scroll"`

### Optional Parameters
```json
{
  "viewport": "desktop|mobile|tablet",
  "captureDelay": 500  // Wait 500ms after action before capturing
}
```

### Example Usage
```
"Test the hover state of the menu button"
"What happens when I click the dropdown?"
```

---

## Tool 11: `uisentinel_show_grid`

### Purpose
Show alignment grids on the page.

### Required Parameters
- `url` (string)

### Optional Parameters
```json
{
  "gridSize": 8,                           // 8px baseline grid
  "gridType": "8px|12-column|alignment-guides",
  "viewport": "desktop|mobile|tablet"
}
```

### Example Usage
```
"Show me the 8px grid on the page"
"Does the layout align to a 12-column grid?"
```

---

## Common Issues & Solutions

### Issue 1: "Connection refused" or "ECONNREFUSED"
**Problem:** The web server isn't running.
**Solution:** Start your dev server first:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Issue 2: "Element not found"
**Problem:** Selector doesn't match any element.
**Solution:**
1. Ask Claude to detect components first: `"What components are on the page?"`
2. Use the correct selector from the results
3. Or use generic selectors: `"button"`, `"input"`, `"form"`

### Issue 3: "Tool returns no data"
**Problem:** Page might not be fully loaded.
**Solution:** The tools wait for `networkidle` automatically, but complex apps may need more time.

### Issue 4: "MCP server not responding"
**Problem:** MCP server isn't running or configured.
**Solution:** Check Claude Desktop config:
```json
{
  "mcpServers": {
    "uisentinel": {
      "command": "uisentinel-mcp"
    }
  }
}
```
Then restart Claude Desktop.

---

## Pro Tips for AI Agents

### 1. Start with Component Detection
```
"What components are on http://localhost:3000?"
```
This gives you all available selectors.

### 2. Chain Tools Together
```
1. "Detect components on the page"
2. "Inspect the first button found"
3. "Check the contrast of that button"
4. "Test the hover state"
```

### 3. Use Natural Language
You don't need to know the exact tool names. Just ask:
- ❌ "Use uisentinel_inspect_element with selector button"
- ✅ "Inspect the button on the page"

### 4. Viewport Testing
Always test mobile after desktop:
```
"Inspect the navigation on desktop and mobile"
```

### 5. Accessibility First
After building any UI:
```
"Check accessibility and contrast for http://localhost:3000"
```

---

## Quick Reference Table

| Task | Natural Language Prompt | Tool Called |
|------|------------------------|-------------|
| Inspect element | "Inspect the button" | `inspect_element` |
| Check accessibility | "Is this accessible?" | `check_accessibility` |
| Test contrast | "Is the text readable?" | `check_contrast` |
| Find components | "What's on the page?" | `detect_components` |
| Test responsive | "Does it work on mobile?" | `check_breakpoints` |
| Check layout | "Are there any overflows?" | `analyze_layout` |
| Detect framework | "What framework is this?" | `detect_project` |
| Test interaction | "What happens on hover?" | `inspect_with_action` |

---

## Testing Without Claude Desktop

You can test tools using the CLI:

```bash
# Detect project (no server needed)
uisentinel detect-project

# Analyze layout (requires running server)
uisentinel analyze-layout --url http://localhost:3000

# Capture with accessibility checks
uisentinel capture --url http://localhost:3000 --a11y
```

---

**Last Updated:** v0.2.1 - Phase 1 Implementation

# 🔌 MCP Integration Guide

**UIsentinel Model Context Protocol (MCP) Server**

This guide shows you how to use UIsentinel's browser extensions as MCP tools for AI coding agents like Claude, Copilot, and Cursor.

---

## What is MCP?

**Model Context Protocol** is a standard that allows AI agents to discover and use external tools with structured inputs/outputs. Instead of parsing CLI output, agents can call functions directly and get structured JSON responses.

---

## Installation

```bash
# Install UIsentinel globally
npm install -g uisentinel

# Verify MCP server is available
which uisentinel-mcp
```

---

## Configuration

### For Claude Desktop

Add UIsentinel to your Claude Desktop configuration:

**macOS/Linux**: `~/.config/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "uisentinel": {
      "command": "uisentinel-mcp"
    }
  }
}
```

After saving, restart Claude Desktop. The UIsentinel tools will appear in Claude's tool list.

### For Cursor / Other Editors

Follow your editor's MCP integration documentation and point to the `uisentinel-mcp` command.

---

## Available Tools

UIsentinel exposes **9 MCP tools** for comprehensive web UI inspection and debugging:

### 1. Element Inspection

#### `uisentinel_inspect_element`
Comprehensively inspect a web element with CDP, capturing screenshots, box model, styles, attributes, and hierarchy.

**Use when**: You need detailed information about a specific element's styling, position, or structure.

**Example**:
```json
{
  "url": "http://localhost:3000",
  "selector": ".hero-section",
  "captureScreenshot": true,
  "captureZoomedScreenshot": true,
  "zoomLevel": 2,
  "includeComputedStyles": true
}
```

**Returns**:
- Full element metadata (dimensions, position, box model)
- Computed CSS styles
- Parent and children hierarchy
- Full page screenshot
- Element-specific screenshot
- Zoomed screenshot (if requested)
- JSON metadata file
- Markdown report

#### `uisentinel_inspect_multiple`
Inspect multiple elements at once and generate a comparison report.

**Use when**: You want to compare multiple elements for layout consistency or audit several components.

**Example**:
```json
{
  "url": "http://localhost:3000",
  "selectors": [".btn-primary", ".btn-secondary", ".btn-tertiary"],
  "captureScreenshots": true
}
```

#### `uisentinel_inspect_with_action`
Inspect an element before and after an interaction (click, hover, focus, scroll).

**Use when**: Testing interactive components like buttons, modals, dropdowns, or hover effects.

**Example**:
```json
{
  "url": "http://localhost:3000",
  "selector": ".dropdown-menu",
  "action": "hover"
}
```

**Returns**:
- Before screenshot
- After screenshot
- Element state changes
- JSON with both states

---

### 2. Accessibility

#### `uisentinel_check_accessibility`
Run WCAG 2.1 accessibility checks using axe-core and visualize violations.

**Use when**: After creating forms, interactive elements, or when accessibility is mentioned.

**Example**:
```json
{
  "url": "http://localhost:3000",
  "showViolations": true,
  "highlightIssues": true
}
```

**Returns**:
- Accessibility score (0-100)
- List of violations with:
  - Severity (critical, serious, moderate, minor)
  - WCAG rule ID
  - Description and help URL
  - Affected elements
  - Fix suggestions
- Screenshot with visual markers

#### `uisentinel_check_contrast`
Analyze color contrast ratios for all text elements according to WCAG AA/AAA standards.

**Use when**: Checking if text is readable against its background.

**Example**:
```json
{
  "url": "http://localhost:3000",
  "minRatioAA": 4.5,
  "minRatioAAA": 7,
  "highlightIssues": true
}
```

**Returns**:
- List of all text elements with contrast ratios
- Pass/fail status for AA and AAA
- Color suggestions for fixes
- Screenshot with highlighted low-contrast elements

---

### 3. Layout & Measurement

#### `uisentinel_measure_element`
Display visual box model measurements for an element (dimensions, margin, padding, border).

**Use when**: Debugging layout issues or verifying spacing.

**Example**:
```json
{
  "url": "http://localhost:3000",
  "selector": ".card",
  "showDimensions": true,
  "showMargin": true,
  "showPadding": true
}
```

**Returns**:
- Box model data (margin, padding, border, content)
- Screenshot with measurement overlays

#### `uisentinel_show_grid`
Overlay a visual grid on the page to verify alignment and spacing.

**Use when**: Ensuring consistent spacing and layout alignment.

**Example**:
```json
{
  "url": "http://localhost:3000",
  "gridType": "8px"
}
```

**Grid types**:
- `8px` - 8px baseline grid
- `12-column` - Responsive 12-column grid
- `alignment-guides` - Center and edge alignment guides

---

### 4. Component Analysis

#### `uisentinel_detect_components`
Automatically detect and categorize UI components (buttons, forms, inputs, modals, navigation, etc.).

**Use when**: Auditing a page's UI components or generating documentation.

**Example**:
```json
{
  "url": "http://localhost:3000",
  "includePosition": true,
  "highlightComponents": true
}
```

**Returns**:
- Categorized list of all components:
  - Buttons
  - Links
  - Forms and inputs
  - Images
  - Modals
  - Navigation
  - Headings
  - Tables, lists, videos, iframes
- Position and dimensions (if requested)
- Screenshot with highlighted components

---

### 5. Responsive Design

#### `uisentinel_check_breakpoints`
Test responsive design across multiple breakpoints and capture screenshots at each.

**Use when**: Verifying responsive behavior across devices.

**Example**:
```json
{
  "url": "http://localhost:3000",
  "captureAllBreakpoints": true
}
```

**Returns**:
- Screenshots at mobile (375px), tablet (768px), and desktop (1920px)
- Breakpoint indicators on each screenshot
- Viewport dimensions

---

## Common Workflows

### Workflow 1: Complete Element Analysis

```
1. Agent: uisentinel_inspect_element
   - Get full element details
2. Agent: uisentinel_check_accessibility
   - Check if element is accessible
3. Agent: uisentinel_check_contrast
   - Verify text contrast
4. Agent: Apply fixes based on findings
5. Agent: uisentinel_inspect_element (again)
   - Verify fixes worked
```

### Workflow 2: Interactive Component Testing

```
1. Agent: uisentinel_inspect_with_action (hover)
   - Check hover state
2. Agent: uisentinel_inspect_with_action (click)
   - Check click behavior
3. Agent: uisentinel_check_accessibility
   - Ensure interactions are accessible
```

### Workflow 3: Responsive Design Audit

```
1. Agent: uisentinel_check_breakpoints
   - Capture all breakpoints
2. Agent: uisentinel_inspect_element (for each viewport)
   - Verify element behavior
3. Agent: uisentinel_show_grid
   - Check alignment consistency
```

---

## Output Files

All MCP tools save their output to `./mcp-output/` in the current working directory:

```
mcp-output/
  inspections/         # Element inspection data
    *.json            # Metadata files
    *.md              # Reports
    *.png             # Screenshots
  a11y/               # Accessibility checks
  contrast/           # Contrast analysis
  measurements/       # Box model measurements
  grids/              # Grid overlays
  components/         # Component detection
  breakpoints/        # Responsive tests
```

---

## Example: AI Agent Workflow

**User**: "I just created a hero section. Make sure it looks good and is accessible."

**Agent (internal)**:
```
1. Call uisentinel_inspect_element:
   {
     "url": "http://localhost:3000",
     "selector": ".hero-section",
     "captureScreenshot": true,
     "includeComputedStyles": true
   }

2. Review element data:
   - Width: 1200px
   - Height: 600px
   - Background: #1a1a1a
   - Text color: #e0e0e0

3. Call uisentinel_check_accessibility:
   {
     "url": "http://localhost:3000",
     "highlightIssues": true
   }

4. Found issue: Heading contrast ratio is 3.8:1 (needs 4.5:1)

5. Apply fix: Change text color to #f5f5f5

6. Call uisentinel_check_contrast:
   {
     "url": "http://localhost:3000",
     "highlightIssues": true
   }

7. Verify: Contrast now 7.2:1 ✓
```

**Agent (to user)**: "I validated your hero section. Found 1 issue: heading contrast was too low (3.8:1, needs 4.5:1). Fixed by changing text color to #f5f5f5. Re-validated: now passes all checks with 7.2:1 contrast ratio ✓"

---

## Troubleshooting

### MCP Server Not Found

If Claude can't find `uisentinel-mcp`:

```bash
# Find the full path
which uisentinel-mcp

# Use full path in config
{
  "mcpServers": {
    "uisentinel": {
      "command": "/usr/local/bin/uisentinel-mcp"
    }
  }
}
```

### Tools Not Appearing

1. Restart Claude Desktop after config changes
2. Check Claude's logs: `~/Library/Logs/Claude/mcp.log` (macOS)
3. Verify MCP server runs: `uisentinel-mcp` (should block)

### Port Already in Use

If dev server port is in use, UIsentinel will try the next available port automatically.

---

## Advanced Configuration

### Custom Output Directory

Set environment variable before starting Claude:

```bash
export UISENTINEL_OUTPUT_DIR="./my-output"
```

### Headless vs Headed

By default, MCP tools run headless. To see browser windows (for debugging):

Edit handlers in `src/mcp/handlers.ts` and set `headless: false`.

---

## Next Steps

- Read the [Browser Extensions Guide](../README.md) for extension details
- See [examples/](../examples/) for programmatic usage
- Check [roadmap](../roadmap/ADVANCED_FEATURES_ROADMAP_V2.md) for upcoming features

---

**Let AI agents see what they build!** 👁️🤖

---

*Last updated: October 2, 2025*

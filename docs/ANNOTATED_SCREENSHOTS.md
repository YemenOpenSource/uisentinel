# Annotated Screenshots Feature

**Added in v0.2.1** - DevTools-style info overlay on element inspection screenshots

---

## What It Does

When you inspect an element with `uisentinel_inspect_element`, you now get an **additional annotated screenshot** with a DevTools-style info tooltip overlay showing:

- **Element name and dimensions** (e.g., h1 600 × 38)
- **Color** (hex format)
- **Font** (size and family)
- **Margin** (box model)
- **ACCESSIBILITY Section:**
  - Contrast ratio (with AA/AAA compliance indicator)
  - Accessible name
  - ARIA role
  - Keyboard-focusable status

---

## Files Generated

When you call `uisentinel_inspect_element`, you get **4 files**:

1. **`element-xxx-fullpage.png`** - Full page screenshot with CDP highlight
2. **`element-xxx-annotated.png`** ⭐ **NEW!** - Full page with DevTools-style info overlay
3. **`element-xxx-element.png`** - Cropped element screenshot
4. **`element-xxx-metadata.json`** - Complete JSON with all data

---

## Example

### Input (MCP Tool Call)
```json
{
  "url": "https://example.com",
  "selector": "h1"
}
```

### Output Screenshot

The annotated screenshot shows a tooltip with:

```
┌─────────────────────────────────────┐
│ h1                      600 × 38    │
│ Color                     #000000    │
│ Font           32px -apple-system    │
│ Margin              21px 0px 21px 0px│
│                                      │
│ ACCESSIBILITY                        │
│ Contrast           Aa 20.87 ✓       │
│ Name                 Example Domain  │
│ Role                        heading  │
│ Keyboard-focusable              ✗   │
└─────────────────────────────────────┘
```

---

## How Accessibility Info is Calculated

### Contrast Ratio
- Parses foreground text color and background color
- Walks up DOM tree to find opaque background if transparent
- Calculates WCAG 2.1 contrast ratio
- Shows ✓ if ratio ≥ 4.5:1 (WCAG AA standard)

### Accessible Name
- Checks `aria-label` attribute
- Checks `aria-labelledby` reference
- Falls back to text content (first 30 chars)

### Role
- Checks explicit `role` attribute
- Falls back to implicit ARIA role based on element type
- Supports: button, link, textbox, combobox, heading, navigation, main, etc.

### Keyboard-Focusable
- Checks if element is naturally focusable (A, BUTTON, INPUT, TEXTAREA, SELECT)
- Checks `tabindex` attribute
- Returns true if element can receive keyboard focus

---

## Technical Implementation

### Architecture

```
ElementInspector
  └─> ScreenshotAnnotator (new)
      └─> Sharp (image processing)
          └─> SVG overlay compositing
```

### Key Classes

**`ScreenshotAnnotator`** (`src/extensions/screenshot-annotator.ts`)
- Generates SVG overlay with element info
- Uses Sharp to composite SVG onto screenshot
- Positions tooltip intelligently (avoids going off-screen)
- Formats colors, dimensions, and accessibility data

**`ElementInspector.calculateAccessibility()`**
- Runs in browser context via `page.evaluate()`
- Calculates contrast ratio using WCAG formula
- Determines role and keyboard-focusable status
- Returns structured accessibility data

---

## Using in Claude Desktop

### Before (v0.2.0)
```
"Inspect the button on http://localhost:3000"
```
**Returns:**
- Full page screenshot (with blue CDP highlight)
- Element screenshot
- JSON metadata

### After (v0.2.1)
```
"Inspect the button on http://localhost:3000"
```
**Returns:**
- Full page screenshot (with blue CDP highlight)
- ⭐ **Annotated screenshot (with DevTools-style info overlay)**
- Element screenshot
- JSON metadata

Claude can now see the annotated screenshot showing all element details and accessibility info at a glance!

---

## CLI Usage

The annotated screenshot is also available via CLI:

```bash
# Inspect an element
uisentinel element --url http://localhost:3000 --selector button

# Check output folder
ls mcp-output/inspections/
# You'll see:
# element-button-xxx-fullpage.png
# element-button-xxx-annotated.png  ← NEW!
# element-button-xxx-element.png
# element-button-xxx-metadata.json
```

---

## Configuration

The annotated screenshot is **always generated** when:
- `captureScreenshot: true` (default)
- `showOverlay: true` (default)

To disable it, set `showOverlay: false`:

```typescript
await inspector.inspect(page, 'button', {
  showOverlay: false,  // No annotation
  captureScreenshot: true
});
```

---

## Comparison to Chrome DevTools

### Chrome DevTools Inspect Tool
✅ Shows element highlight
✅ Shows tooltip with dimensions, colors, font, margin
❌ Tooltip disappears when you move mouse
❌ Can't export/share the tooltip view
❌ Limited accessibility info in tooltip

### UIsentinel Annotated Screenshots
✅ Shows element highlight
✅ Shows tooltip with dimensions, colors, font, margin
✅ **Tooltip is permanently on the screenshot**
✅ **Can export/share screenshots with annotation**
✅ **Full accessibility info (contrast, role, keyboard-focusable)**
✅ **AI agents can see and understand the annotations**

---

## Benefits for AI Agents

1. **Visual Understanding**: AI can see element properties without parsing JSON
2. **Accessibility Awareness**: Contrast issues are visually apparent
3. **Quick Validation**: At-a-glance check of element dimensions and styles
4. **Documentation**: Screenshots with annotations are perfect for bug reports
5. **Comparison**: Easy to compare before/after or different elements visually

---

## Future Enhancements

Potential additions for future versions:

- [ ] Customizable annotation position
- [ ] Multiple annotation styles (compact, detailed, minimal)
- [ ] Dark mode annotation theme
- [ ] Box model diagram overlay
- [ ] Computed layout flow visualization
- [ ] Z-index stacking context visualization

---

## Examples in the Wild

### Button Inspection
```
┌───────────────────────────────┐
│ button                120 × 40│
│ Color                 #FFFFFF │
│ Font         16px sans-serif  │
│ Margin               0px 0px  │
│                               │
│ ACCESSIBILITY                 │
│ Contrast        Aa 7.2 ✓     │
│ Name                   Submit │
│ Role                   button │
│ Keyboard-focusable         ✓ │
└───────────────────────────────┘
```

### Heading Inspection
```
┌───────────────────────────────┐
│ h2                   800 × 48 │
│ Color                #111827  │
│ Font         36px system-ui   │
│ Margin          32px 0px 16px │
│                               │
│ ACCESSIBILITY                 │
│ Contrast       Aa 15.4 ✓     │
│ Name           Welcome Back!  │
│ Role                  heading │
│ Keyboard-focusable        ✗  │
└───────────────────────────────┘
```

---

**This is exactly what you asked for!** 🎉

The tool now inspects elements just like F12/DevTools and captures that inspection view with full JSON metadata + accessibility information.

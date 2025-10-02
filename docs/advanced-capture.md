# Advanced Capture Features - UI/UX Developer Guide

## 🎯 Overview

UIsentinel now includes **advanced capture capabilities** that allow you to capture specific parts of a webpage, zoom in/out, highlight elements, and capture before/after states - just like a UI/UX developer or designer would do!

---

## 📸 Capture Modes

### 1. Element Capture
Capture a specific element (component-level screenshots)

```bash
# Capture a specific element
uisentinel element \
  --url http://localhost:3000 \
  --selector "#main-nav" \
  --padding 10 \
  --name navigation_bar

# Capture multiple components
uisentinel element -u http://localhost:3000 -s ".hero-section" -n hero
uisentinel element -u http://localhost:3000 -s "#footer" -n footer
```

**Options:**
- `-s, --selector <selector>` - CSS selector (required)
- `-p, --padding <px>` - Padding around element (default: 0)
- `--scroll` - Scroll into view before capture (default: true)
- `-n, --name <name>` - Output filename
- `--viewport <preset>` - Viewport: mobile, tablet, desktop

**Use Cases:**
- Component library documentation
- Design system screenshots
- Bug reports (isolate specific UI elements)
- A/B testing visuals

---

### 2. Clip/Region Capture
Capture a specific rectangular area

```bash
# Capture hero section at specific coordinates
uisentinel clip \
  --url http://localhost:3000 \
  -x 0 \
  -y 0 \
  --width 1200 \
  --height 600 \
  --name hero_region

# Capture sidebar
uisentinel clip \
  --url http://localhost:3000 \
  -x 1200 \
  -y 0 \
  --width 300 \
  --height 1000 \
  --name sidebar
```

**Options:**
- `-x <pixels>` - X coordinate (required)
- `-y <pixels>` - Y coordinate (required)
- `-w, --width <pixels>` - Width (required)
- `--height <pixels>` - Height (required)
- `-n, --name <name>` - Output filename

**Use Cases:**
- Precise area capture
- Crop specific regions
- Compare layout sections
- Extract design elements

---

### 3. Page Zoom Capture
Capture entire page with CSS zoom applied

```bash
# 200% zoom for detailed inspection
uisentinel zoom \
  --url http://localhost:3000 \
  --zoom 2 \
  --name zoomed_in

# 50% zoom for overview
uisentinel zoom \
  --url http://localhost:3000 \
  --zoom 0.5 \
  --full-page \
  --name overview

# 150% zoom
uisentinel zoom -u http://localhost:3000 -z 1.5 -n detail_view
```

**Options:**
- `-z, --zoom <level>` - Zoom level (e.g., 0.5, 1.5, 2) (required)
- `--full-page` - Capture full page (default: false)
- `-n, --name <name>` - Output filename
- `--viewport <preset>` - Initial viewport

**Use Cases:**
- High-DPI screenshots
- Detail inspection
- Typography review
- Icon/graphic quality check
- Print-ready captures

---

### 3a. Element Zoom Capture 🆕
Capture specific element with zoom applied (zoomed component view)

```bash
# 2x zoom on button for detail inspection
uisentinel element-zoom \
  --url http://localhost:3000 \
  --selector ".primary-button" \
  --zoom 2 \
  --padding 10 \
  --name button_detail

# 1.5x zoom on navigation
uisentinel element-zoom \
  -u http://localhost:3000 \
  -s "#main-nav" \
  -z 1.5 \
  -p 20 \
  -n nav_detail
```

**Options:**
- `-u, --url <url>` - URL to visit (required)
- `-s, --selector <selector>` - CSS selector (required)
- `-z, --zoom <level>` - Zoom level (e.g., 1.5, 2, 3) (required)
- `-p, --padding <px>` - Padding around element (default: 0)
- `-n, --name <name>` - Output filename
- `--scroll` - Scroll into view (default: true)
- `--viewport <preset>` - Viewport preset

**Use Cases:**
- Component detail inspection
- Button/icon quality check
- Typography verification
- Small UI element magnification
- Design system documentation with details

---

### 3b. Region Zoom Capture 🆕
Capture specific area with zoom (magnified region)

```bash
# 2x zoom on hero section
uisentinel region-zoom \
  --url http://localhost:3000 \
  -x 0 \
  -y 0 \
  --width 600 \
  --height 400 \
  --zoom 2 \
  --name hero_detail

# 3x zoom on small area
uisentinel region-zoom \
  -u http://localhost:3000 \
  -x 50 \
  -y 50 \
  -w 200 \
  --height 150 \
  -z 3 \
  -n detail_area
```

**Options:**
- `-u, --url <url>` - URL to visit (required)
- `-x <pixels>` - X coordinate (required)
- `-y <pixels>` - Y coordinate (required)
- `-w, --width <pixels>` - Width (required)
- `--height <pixels>` - Height (required)
- `-z, --zoom <level>` - Zoom level (required)
- `-n, --name <name>` - Output filename
- `--viewport <preset>` - Viewport preset

**Use Cases:**
- Hero section detail view
- Specific area magnification
- Layout detail inspection
- Pixel-perfect verification
- Print-quality region captures

---

### 4. Highlight Capture
Capture with element highlighted (outlined)

```bash
# Highlight important button
uisentinel highlight \
  --url http://localhost:3000 \
  --selector ".primary-button" \
  --color "#ff0000" \
  --width 3 \
  --name button_highlighted

# Highlight form field
uisentinel highlight \
  -u http://localhost:3000 \
  -s "#email-input" \
  -c "#00ff00" \
  -n email_field
```

**Options:**
- `-s, --selector <selector>` - Element to highlight (required)
- `-c, --color <color>` - Outline color (default: #ff0000)
- `-w, --width <px>` - Outline width (default: 3)
- `-n, --name <name>` - Output filename

**Use Cases:**
- Documentation with annotations
- Tutorial screenshots
- Bug reports (highlight problem area)
- Design review (point out specific elements)
- User guides

---

### 5. Before/After Capture
Capture element states before and after interaction

```bash
# Hover effect
uisentinel before-after \
  --url http://localhost:3000 \
  --selector ".fancy-button" \
  --action hover \
  --name button_hover

# Focus state
uisentinel before-after \
  -u http://localhost:3000 \
  -s "#search-input" \
  -a focus \
  -n search_focus

# Click state (e.g., dropdown)
uisentinel before-after \
  -u http://localhost:3000 \
  -s ".dropdown-toggle" \
  -a click \
  -n dropdown_expanded
```

**Options:**
- `-s, --selector <selector>` - Element selector (required)
- `-a, --action <action>` - Action: hover, focus, or click (required)
- `-n, --name <name>` - Base name (generates `{name}_before.png` and `{name}_after.png`)

**Output:**
- `{name}_before.png` - Initial state
- `{name}_after.png` - After interaction

**Use Cases:**
- Document hover effects
- Test focus indicators
- Show interactive states
- CSS transition documentation
- Animation screenshots

---

## 🔥 Programmatic API

### Element Capture

```javascript
const { UISentinel } = require('uisentinel');

const sentinel = new UISentinel();
await sentinel.start();

// Get browser engine
const page = await sentinel.getBrowserEngine().createPage('http://localhost:3000');
const advCapture = sentinel.getBrowserEngine().getAdvancedCapture(page);

// Capture specific element
const screenshot = await advCapture.captureElement({
  selector: '#main-header',
  padding: 20,
  scrollIntoView: true,
  path: 'header.png'
});

console.log('Screenshot saved:', screenshot);

await page.close();
await sentinel.close();
```

### Multiple Elements

```javascript
// Capture component library
const elements = [
  { selector: '.button-primary', path: 'button-primary.png' },
  { selector: '.button-secondary', path: 'button-secondary.png' },
  { selector: '.button-danger', path: 'button-danger.png' }
];

const screenshots = await advCapture.captureElements(elements);
```

### Clip Capture

```javascript
// Capture hero section
const heroShot = await advCapture.captureClip({
  x: 0,
  y: 0,
  width: 1200,
  height: 600,
  path: 'hero.png'
});
```

### Page Zoom Capture

```javascript
// 2x zoom for details
const zoomedIn = await advCapture.captureWithZoom({
  zoom: 2,
  fullPage: false,
  path: 'details.png'
});

// 0.5x zoom for overview
const overview = await advCapture.captureWithZoom({
  zoom: 0.5,
  fullPage: true,
  path: 'overview.png'
});
```

### Element Zoom Capture 🆕

```javascript
// Capture button at 2x zoom
const buttonDetail = await advCapture.captureElementWithZoom({
  selector: '.primary-button',
  zoom: 2,
  padding: 10,
  path: 'button_detail.png'
});

// Capture navigation at 1.5x zoom
const navDetail = await advCapture.captureElementWithZoom({
  selector: '#main-nav',
  zoom: 1.5,
  padding: 20,
  scrollIntoView: true,
  path: 'nav_detail.png'
});
```

### Region Zoom Capture 🆕

```javascript
// Capture hero section at 2x zoom
const heroZoomed = await advCapture.captureRegionWithZoom({
  x: 0,
  y: 0,
  width: 600,
  height: 400,
  zoom: 2,
  path: 'hero_detail.png'
});

// Capture small area at 3x zoom for pixel-perfect inspection
const detailArea = await advCapture.captureRegionWithZoom({
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  zoom: 3,
  path: 'detail_3x.png'
});
```

### Highlight Capture

```javascript
// Highlight CTA button
const highlighted = await advCapture.captureWithHighlight({
  selector: '.cta-button',
  highlightColor: '#ff0000',
  highlightWidth: 3,
  path: 'cta-highlighted.png'
});
```

### Before/After Capture

```javascript
// Capture hover effect
const [before, after] = await advCapture.captureBeforeAfter({
  selector: '.nav-link',
  action: 'hover',
  beforePath: 'nav-normal.png',
  afterPath: 'nav-hover.png'
});

console.log('Before:', before);
console.log('After:', after);
```

### Scroll Position Capture

```javascript
// Capture at specific scroll position
const scrolled = await advCapture.captureAtScrollPosition({
  y: 1000,
  path: 'scrolled-1000px.png'
});

// Test sticky header at different scroll positions
await advCapture.captureAtScrollPosition({ y: 0, path: 'header-top.png' });
await advCapture.captureAtScrollPosition({ y: 500, path: 'header-scroll.png' });
```

---

## 🎨 Real-World Examples

### Example 1: Component Documentation

```bash
# Document all button states
uisentinel element -u http://localhost:3000 -s ".btn-primary" -n btn_primary
uisentinel element -u http://localhost:3000 -s ".btn-secondary" -n btn_secondary
uisentinel before-after -u http://localhost:3000 -s ".btn-primary" -a hover -n btn_hover
```

### Example 2: Responsive Testing

```bash
# Test navigation on different viewports
uisentinel element \
  -u http://localhost:3000 \
  -s "#main-nav" \
  --viewport mobile \
  -n nav_mobile

uisentinel element \
  -u http://localhost:3000 \
  -s "#main-nav" \
  --viewport desktop \
  -n nav_desktop
```

### Example 3: Bug Report

```bash
# Highlight problematic element
uisentinel highlight \
  -u http://localhost:3000 \
  -s ".broken-layout" \
  -c "#ff0000" \
  -n bug_broken_layout

# Capture with zoom for details
uisentinel zoom \
  -u http://localhost:3000 \
  -z 2 \
  -n bug_detail_view
```

### Example 4: Design System

```bash
# Capture all colors
uisentinel element -u http://localhost:3000/colors -s ".color-primary" -n color_primary
uisentinel element -u http://localhost:3000/colors -s ".color-secondary" -n color_secondary

# Capture typography
uisentinel zoom -u http://localhost:3000/typography -z 1.5 -n typography_detail

# Capture spacing
uisentinel element -u http://localhost:3000/spacing -s ".spacing-examples" -n spacing
```

---

## 🤖 AI Agent Integration

### GitHub Copilot Workflow

When building UI, AI agents can use these commands to:

1. **Verify Component Implementation**
   ```
   User: "Create a navigation bar"
   Agent: [Creates code]
   Agent: Running: uisentinel element -s "#nav" -n navigation_bar
   Agent: "Navigation bar created ✅ Screenshot: navigation_bar.png"
   ```

2. **Document Interactive States**
   ```
   User: "Add hover effect to buttons"
   Agent: [Adds CSS]
   Agent: Running: uisentinel before-after -s ".button" -a hover -n button_effect
   Agent: "Hover effect implemented ✅ Before/After screenshots saved"
   ```

3. **Verify Responsive Design**
   ```
   User: "Make hero section responsive"
   Agent: [Updates CSS]
   Agent: Running: uisentinel element -s ".hero" --viewport mobile -n hero_mobile
   Agent: Running: uisentinel element -s ".hero" --viewport desktop -n hero_desktop
   Agent: "Responsive design verified ✅"
   ```

---

## 📚 Chatmode Instructions

Add to `.github/chatmodes/Ui Web Developer.chatmode.md`:

```markdown
## Advanced Visual Capture

When building/modifying UI components:

### Component-Level Testing
- Use `element` command to capture specific components
- Use `before-after` to document interactive states
- Use `highlight` to point out important elements in screenshots

### Verification Workflow
1. Implement feature
2. Capture relevant screenshots:
   - Element: `uisentinel element -s <selector> -n <name>`
   - Before/After: `uisentinel before-after -s <selector> -a <action> -n <name>`
   - Zoom: `uisentinel zoom -z <level> -n <name>` (for details)
3. Review and confirm visually
4. Only then mark complete

### Examples

**Button Implementation:**
```bash
# Capture button
uisentinel element -s ".primary-button" -n button_primary

# Capture hover state
uisentinel before-after -s ".primary-button" -a hover -n button_hover
```

**Navigation Bar:**
```bash
# Mobile view
uisentinel element -s "#nav" --viewport mobile -n nav_mobile

# Desktop view
uisentinel element -s "#nav" --viewport desktop -n nav_desktop
```

**Form Validation:**
```bash
# Highlight error field
uisentinel highlight -s ".input-error" -c "#ff0000" -n input_error
```
```

---

## 🎯 Best Practices

### 1. Use Descriptive Names
```bash
# ✅ Good
uisentinel element -s "#hero" -n hero_section_mobile

# ❌ Bad
uisentinel element -s "#hero" -n screenshot
```

### 2. Combine with Viewport Testing
```bash
# Test element on all viewports
for viewport in mobile tablet desktop; do
  uisentinel element \
    -s ".card" \
    --viewport $viewport \
    -n card_$viewport
done
```

### 3. Use Padding for Context
```bash
# Capture button with surrounding context
uisentinel element -s ".button" -p 50 -n button_with_context
```

### 4. Document State Changes
```bash
# Dropdown states
uisentinel before-after -s ".dropdown" -a click -n dropdown_states
```

### 5. Use Zoom for Typography
```bash
# 2x zoom to verify font rendering
uisentinel zoom -z 2 -n typography_check
```

---

## 🔧 Troubleshooting

### Element Not Found
```bash
# Make sure element exists and selector is correct
# Use browser devtools to verify selector
uisentinel element -s ".my-element" -n test

# Add wait time if element loads dynamically
uisentinel capture --url <url> --wait 2000 --click ".load-more"
```

### Element Not Visible
```bash
# Use --scroll option (enabled by default)
uisentinel element -s ".footer-element" --scroll -n footer

# Or scroll first with capture command
uisentinel capture --url <url> --scroll-to ".footer-element"
```

### Wrong Clip Coordinates
```bash
# Use browser devtools to get exact coordinates
# Right-click element → Inspect → Check position/dimensions

# Or use element capture with padding instead
uisentinel element -s ".hero" -p 20 -n hero
```

---

## 📊 Command Comparison

| Command | Best For | Output Files |
|---------|----------|--------------|
| `element` | Components, specific UI parts | 1 PNG |
| `clip` | Exact coordinates, regions | 1 PNG |
| `zoom` | Details, overview, print | 1 PNG |
| `highlight` | Documentation, annotations | 1 PNG |
| `before-after` | Interactive states, effects | 2 PNGs |

---

## ✨ Tips & Tricks

### 1. Batch Component Capture
```bash
# Create script for component library
cat > capture-components.sh << 'EOF'
#!/bin/bash
COMPONENTS=("button" "card" "modal" "nav" "footer")
for comp in "${COMPONENTS[@]}"; do
  uisentinel element -u http://localhost:3000 -s ".$comp" -n $comp
done
EOF
chmod +x capture-components.sh
./capture-components.sh
```

### 2. Responsive Comparison
```bash
# Compare element across viewports
for vp in mobile tablet desktop; do
  uisentinel element -s ".hero" --viewport $vp -n hero_$vp
done
```

### 3. State Documentation
```bash
# Document all button states
uisentinel element -s ".button" -n button_default
uisentinel before-after -s ".button" -a hover -n button_hover
uisentinel before-after -s ".button" -a focus -n button_focus
```

---

## 🎉 Summary

**You can now capture:**
- ✅ Specific elements (`element`)
- ✅ Custom regions (`clip`)
- ✅ Zoomed views (`zoom`)
- ✅ Highlighted elements (`highlight`)
- ✅ Before/after states (`before-after`)

**Just like a UI/UX developer would!** 👁️✨

---

*Need more examples? Check out the examples directory or run `uisentinel <command> --help`*

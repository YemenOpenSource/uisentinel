# 🚀 UIsentinel MCP Server - Quick Start Guide

Complete step-by-step guide to install, run, and use UIsentinel's MCP server with AI agents.

---

## 📋 Prerequisites

- **Node.js**: 16.0.0 or higher
- **npm**: 7.0.0 or higher
- **AI Agent**: Claude Desktop, Cursor, or other MCP-compatible client

Check your versions:
```bash
node --version  # Should be >= v16.0.0
npm --version   # Should be >= 7.0.0
```

---

## 📦 Step 1: Install UIsentinel

```bash
# Install globally (recommended)
npm install -g uisentinel

# Verify installation
uisentinel --version
# Output: 0.2.0

# Check MCP server binary exists
which uisentinel-mcp
# Output: /usr/local/bin/uisentinel-mcp (or similar)
```

---

## 🧪 Step 2: Test MCP Server Manually

```bash
# Run the MCP server (it will start and wait for input)
uisentinel-mcp
```

**Expected output:**
```
UIsentinel MCP server running
Available tools: 9
  - uisentinel_inspect_element
  - uisentinel_inspect_multiple
  - uisentinel_inspect_with_action
  - uisentinel_check_accessibility
  - uisentinel_check_contrast
  - uisentinel_measure_element
  - uisentinel_show_grid
  - uisentinel_detect_components
  - uisentinel_check_breakpoints
```

Press `Ctrl+C` to stop. ✅ **Server works!**

---

## 🔧 Step 3: Configure Claude Desktop

### Create/Edit Config File

**macOS/Linux:**
```bash
# Create directory if it doesn't exist
mkdir -p ~/.config/Claude

# Edit config file
nano ~/.config/Claude/claude_desktop_config.json
```

**Windows:**
```cmd
notepad %APPDATA%\Claude\claude_desktop_config.json
```

### Add UIsentinel Configuration

```json
{
  "mcpServers": {
    "uisentinel": {
      "command": "uisentinel-mcp"
    }
  }
}
```

**If you already have other MCP servers:**
```json
{
  "mcpServers": {
    "uisentinel": {
      "command": "uisentinel-mcp"
    },
    "other-server": {
      "command": "other-mcp-server"
    }
  }
}
```

**Save the file and restart Claude Desktop completely.**

---

## ✅ Step 4: Verify Tools in Claude

1. Open **Claude Desktop**
2. Start a **new conversation**
3. Ask: **"What tools do you have access to?"**

**Expected response:**
```
I have access to the following tools:
- uisentinel_inspect_element
- uisentinel_inspect_multiple
- uisentinel_inspect_with_action
- uisentinel_check_accessibility
- uisentinel_check_contrast
- uisentinel_measure_element
- uisentinel_show_grid
- uisentinel_detect_components
- uisentinel_check_breakpoints
```

✅ **If you see these tools, you're ready to use UIsentinel!**

---

## 🎯 Step 5: Use the Tools - Real Examples

**Prerequisite:** Start a local development server first:
```bash
# Example: Next.js app
cd my-nextjs-app
npm run dev
# Server starts at http://localhost:3000
```

### Example 1: Inspect an Element

**You ask Claude:**
```
Inspect the hero section on http://localhost:3000
Use selector .hero-section
Include computed styles and capture a zoomed screenshot
```

**What Claude does internally:**

Claude automatically calls:
```typescript
uisentinel_inspect_element({
  url: "http://localhost:3000",
  selector: ".hero-section",
  captureZoomedScreenshot: true,
  zoomLevel: 2,
  includeComputedStyles: true
})
```

**Claude responds to you:**
```
I inspected your hero section. Here's what I found:

📐 Dimensions: 1200px × 600px
🎨 Background: #1a1a1a
📏 Padding: 40px all around
📦 Margin: 20px top/bottom

Generated files:
- Full page: mcp-output/inspections/hero-fullpage.png
- Element: mcp-output/inspections/hero-element.png
- Zoomed (2x): mcp-output/inspections/hero-zoomed-2x.png
- Metadata: mcp-output/inspections/hero-metadata.json

Everything looks good! The hero section has proper spacing and dimensions.
```

---

### Example 2: Check Accessibility

**You ask Claude:**
```
Check accessibility on http://localhost:3000 and show me any violations
```

**Claude responds:**
```
Accessibility check complete. Score: 78/100 ⚠️

Found 2 issues:

🔴 SERIOUS: Color contrast insufficient
   Affected elements: .btn-primary, .hero-text
   Fix: Increase contrast ratio to at least 4.5:1

🟡 MODERATE: Missing image alt text
   Affected element: img.logo
   Fix: Add descriptive alt attribute

Would you like me to suggest specific color fixes?
```

**You respond:** "Yes, please suggest fixes"

**Claude continues:**
```
Here are specific color fixes:

1. .btn-primary
   Current: #60a5fa on #ffffff (3.2:1) ❌
   Suggested: #2563eb on #ffffff (7.1:1) ✅

2. .hero-text
   Current: #94a3b8 on #1a1a1a (2.8:1) ❌
   Suggested: #e2e8f0 on #1a1a1a (11.2:1) ✅

Apply these changes to meet WCAG AA standards.

Screenshot with highlighted issues:
- mcp-output/a11y/a11y-check-1234567.png
```

---

### Example 3: Test Interactive Elements

**You ask Claude:**
```
Test the hover state of my primary button at http://localhost:3000
```

**Claude responds:**
```
Tested button hover state:

Before:
- Background: #3b82f6
- Border: none
- Shadow: none

After (on hover):
- Background: #2563eb (darker) ✓
- Border: none
- Shadow: 0 4px 6px rgba(0,0,0,0.1) ✓

Screenshots:
- Before: mcp-output/inspections/btn-hover-before.png
- After: mcp-output/inspections/btn-hover-after.png

The hover effect is clearly visible and provides good user feedback!
```

---

### Example 4: Compare Multiple Elements

**You ask Claude:**
```
Compare these three buttons for consistency:
.btn-primary, .btn-secondary, .btn-tertiary
```

**Claude responds:**
```
Compared 3 buttons:

1. .btn-primary
   Size: 120px × 44px
   Padding: 12px 24px
   Font: 16px

2. .btn-secondary
   Size: 120px × 44px
   Padding: 12px 24px
   Font: 16px

3. .btn-tertiary
   Size: 118px × 40px ⚠️
   Padding: 10px 20px ⚠️
   Font: 14px ⚠️

Issue: .btn-tertiary is inconsistent with the other buttons.
Recommendation: Update to match .btn-primary/.btn-secondary dimensions.

Comparison report: mcp-output/inspections/button-comparison-summary.json
```

---

### Example 5: Test Responsive Design

**You ask Claude:**
```
Test my homepage across mobile, tablet, and desktop breakpoints
```

**Claude responds:**
```
Tested responsive behavior across all breakpoints:

📱 Mobile (375px):
   - Layout: Single column ✓
   - Navigation: Hamburger menu ✓
   - Text: Readable size ✓

📱 Tablet (768px):
   - Layout: Two columns ✓
   - Navigation: Visible menu ✓
   - Images: Properly scaled ✓

🖥️ Desktop (1920px):
   - Layout: Full grid ✓
   - Navigation: Full menu bar ✓
   - Content: Centered, max-width ✓

Screenshots:
- Mobile: mcp-output/breakpoints/breakpoint-mobile-*.png
- Tablet: mcp-output/breakpoints/breakpoint-tablet-*.png
- Desktop: mcp-output/breakpoints/breakpoint-desktop-*.png

All breakpoints look great!
```

---

## 📂 Step 6: View Generated Files

All output is saved to `./mcp-output/` in your current directory:

```bash
# Navigate to output directory
cd mcp-output

# List all generated files
ls -R

# Example structure:
# mcp-output/
#   inspections/
#     hero-fullpage.png
#     hero-element.png
#     hero-zoomed-2x.png
#     hero-metadata.json
#     hero-report.md
#   a11y/
#     a11y-check-1234567.png
#   contrast/
#     contrast-check-1234567.png
#   breakpoints/
#     breakpoint-mobile-*.png
#     breakpoint-tablet-*.png
#     breakpoint-desktop-*.png

# View a screenshot (macOS)
open inspections/hero-element.png

# View a screenshot (Linux)
xdg-open inspections/hero-element.png

# Read JSON metadata with formatting
cat inspections/hero-metadata.json | jq

# Read markdown report
cat inspections/hero-report.md
```

---

## 🎨 Step 7: Complete Workflow Example

Here's a complete end-to-end workflow:

**You:** "Create a hero section with heading, subtitle, and CTA button"

**Claude:**
```
Creating hero section...

[Writes HTML/CSS code]

Now validating with UIsentinel tools...

→ Inspecting hero section...
  Called: uisentinel_inspect_element
  Dimensions: 1200×600px ✓

→ Checking accessibility...
  Called: uisentinel_check_accessibility
  Score: 85/100 ⚠️
  Found 2 issues:

  1. Button contrast: 3.2:1 (needs 4.5:1)
  2. Missing heading hierarchy

→ Checking contrast ratios...
  Called: uisentinel_check_contrast
  Found specific fixes needed

→ Applying fixes...
  - Changed button color #60a5fa → #2563eb (7.1:1 contrast)
  - Added proper h1 tag instead of div

→ Re-validating...
  Called: uisentinel_check_accessibility
  Score: 98/100 ✓

✅ Hero section complete and validated!

Generated files:
- Screenshots: mcp-output/inspections/hero-*.png
- Metadata: mcp-output/inspections/hero-metadata.json
- Report: mcp-output/inspections/hero-report.md

All accessibility checks passed!
```

---

## 🎯 Quick Reference

### Common Commands

```bash
# Check installation
uisentinel --version

# Find MCP binary location
which uisentinel-mcp

# Test MCP server manually
uisentinel-mcp

# View generated output
ls -R mcp-output/

# Clean output directory
rm -rf mcp-output/
```

### Common Claude Prompts

```
"Inspect the .hero element on localhost:3000"

"Check accessibility on localhost:3000 and fix any issues"

"Test hover state of .btn-primary"

"Show me the contrast ratios for all text elements"

"Compare these three buttons: .btn-primary, .btn-secondary, .btn-tertiary"

"Test responsive behavior across mobile, tablet, and desktop"

"Measure the .card element and show me the box model"

"Detect all components on the page"

"Show me a grid overlay to check alignment"
```

### Tool Quick Reference

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `uisentinel_inspect_element` | Deep element inspection | Get detailed info about any element |
| `uisentinel_inspect_multiple` | Compare elements | Check consistency across similar elements |
| `uisentinel_inspect_with_action` | Test interactions | Verify hover, click, focus states |
| `uisentinel_check_accessibility` | WCAG compliance | After creating any UI component |
| `uisentinel_check_contrast` | Color contrast analysis | Ensure text readability |
| `uisentinel_measure_element` | Box model visualization | Debug layout issues |
| `uisentinel_show_grid` | Alignment grid overlay | Verify spacing consistency |
| `uisentinel_detect_components` | Component discovery | Audit page components |
| `uisentinel_check_breakpoints` | Responsive testing | Test mobile/tablet/desktop |

---

## 🐛 Troubleshooting

### Issue 1: Tools Don't Appear in Claude

**Symptoms:** Claude says "I don't have access to those tools"

**Solutions:**

1. **Check config file exists:**
   ```bash
   cat ~/.config/Claude/claude_desktop_config.json
   ```

2. **Verify JSON syntax:**
   ```bash
   cat ~/.config/Claude/claude_desktop_config.json | jq
   # Should output valid JSON without errors
   ```

3. **Check Claude logs:**
   ```bash
   # macOS
   tail -f ~/Library/Logs/Claude/mcp.log

   # Look for errors like:
   # "Failed to start MCP server: uisentinel"
   ```

4. **Restart Claude Desktop completely:**
   - Quit Claude Desktop (Cmd+Q on macOS, not just close window)
   - Reopen Claude Desktop
   - Start a **new conversation**

---

### Issue 2: MCP Server Not Found

**Symptoms:** Error: "Command not found: uisentinel-mcp"

**Solutions:**

1. **Find the full path:**
   ```bash
   which uisentinel-mcp
   # Output: /usr/local/bin/uisentinel-mcp

   # If nothing, check npm global location:
   npm list -g uisentinel
   ```

2. **Use full path in config:**
   ```json
   {
     "mcpServers": {
       "uisentinel": {
         "command": "/usr/local/bin/uisentinel-mcp"
       }
     }
   }
   ```

3. **Or use npx:**
   ```json
   {
     "mcpServers": {
       "uisentinel": {
         "command": "npx",
         "args": ["uisentinel-mcp"]
       }
     }
   }
   ```

---

### Issue 3: No Output Files Generated

**Symptoms:** Tools run but no files in `mcp-output/`

**Solutions:**

1. **Check working directory:**
   ```bash
   pwd
   # Files go to mcp-output/ relative to this location
   ```

2. **Search for output:**
   ```bash
   find ~ -name "mcp-output" -type d 2>/dev/null
   ```

3. **Check permissions:**
   ```bash
   ls -la mcp-output/
   # Should be readable/writable
   ```

---

### Issue 4: Browser Won't Start

**Symptoms:** Error about Chromium not found

**Solution:**
```bash
# Install Playwright browsers
npx playwright install chromium

# Verify
npx playwright --version
```

---

### Issue 5: Port Already in Use

**Symptoms:** Dev server won't start

**Solution:**
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
npm run dev -- --port 3001
```

---

### Issue 6: MCP Server Hangs

**Symptoms:** Server starts but doesn't respond

**Solution:**

1. **Check if server is actually running:**
   ```bash
   ps aux | grep uisentinel-mcp
   ```

2. **Kill and restart:**
   ```bash
   pkill -f uisentinel-mcp
   # Then restart Claude Desktop
   ```

3. **Check for errors:**
   ```bash
   uisentinel-mcp 2>&1 | tee mcp-debug.log
   # Run manually to see errors
   ```

---

## 📚 Next Steps

### Learn More
- 📖 [Full MCP Integration Guide](./MCP_INTEGRATION.md)
- 🎨 [AI Agent Chat Mode](../.github/chatmodes/UI%20Visual%20Inspector.chatmode.md)
- 🔧 [Browser Extensions Guide](../README.md)
- 🗺️ [Advanced Features Roadmap](../roadmap/ADVANCED_FEATURES_ROADMAP_V2.md)

### Try These Workflows

1. **Element inspection**: Inspect every component you create
2. **Accessibility audits**: Run checks on all pages
3. **Responsive testing**: Test mobile, tablet, desktop
4. **Interactive testing**: Test hover, focus, click states
5. **Layout debugging**: Use grid overlays and measurements

### Advanced Usage

- Create custom workflows combining multiple tools
- Set up pre-commit hooks to run accessibility checks
- Integrate with CI/CD pipelines
- Build custom AI agent prompts

---

## 💡 Pro Tips

### 1. Always Run Local Dev Server First
```bash
# Start your app before asking Claude to inspect it
npm run dev
# Wait for "Ready on http://localhost:3000"
```

### 2. Use Specific Selectors
```
✅ Good: "Inspect the .hero-section"
✅ Good: "Inspect #main-nav"
❌ Bad: "Inspect the first div"
❌ Bad: "Look at that blue thing"
```

### 3. Request Multiple Checks in One Prompt
```
"Create a button and validate:
- Accessibility (WCAG AA)
- Contrast ratios
- Hover state
- Focus state
- Responsive behavior"
```

### 4. Ask for Evidence
```
"Show me the screenshot and exact contrast ratios"
"Give me the file paths to review"
```

### 5. Iterate Until Perfect
```
"Keep fixing accessibility issues until score is >= 95"
"Don't stop until all text meets WCAG AAA"
```

### 6. Batch Similar Elements
```
✅ Efficient: "Compare all buttons: .btn-primary, .btn-secondary, .btn-tertiary"
❌ Slow: "Inspect .btn-primary" (repeat 3 times)
```

### 7. Save Common Prompts
Create a file with your common prompts:
```
# my-prompts.md
- "Inspect the {selector} and check accessibility"
- "Test hover and focus states of {selector}"
- "Validate responsive behavior from mobile to desktop"
```

---

## 🎉 Success!

You're now ready to use UIsentinel MCP tools! Your AI agent can:

- 👁️ **See** web UIs through screenshots
- 🔍 **Inspect** elements in comprehensive detail
- ♿ **Validate** WCAG 2.1 accessibility
- 🎨 **Check** visual quality and contrast
- 📱 **Test** responsive behavior
- 🔄 **Iterate** until perfect

**Start using it:** Just ask your AI agent to inspect, validate, or test any UI element!

---

## 📞 Get Help

- 📖 **Documentation**: [docs/MCP_INTEGRATION.md](./MCP_INTEGRATION.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/mhjabreel/uisentinel/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/mhjabreel/uisentinel/discussions)

---

*Happy visual validation! 🎨🔍*

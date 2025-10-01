# Quick Start Guide

Get up and running with **uisentinel** in 5 minutes.

## Installation

### Global Installation (Recommended for CLI)

```bash
npm install -g uisentinel
```

### Local Installation (For programmatic use)

```bash
npm install --save-dev uisentinel
```

## First Steps

### 1. Test with an existing project

Navigate to any web project and run:

```bash
uisentinel validate --project .
```

This will:
1. Auto-detect your framework (Next.js, Vite, etc.)
2. Start your dev server
3. Capture screenshots at multiple viewports
4. Run accessibility checks
5. Generate a report

### 2. Quick capture (no project)

Test any live URL:

```bash
uisentinel capture --url https://example.com --a11y
```

### 3. Initialize configuration

Create a config file in your project:

```bash
uisentinel init
```

This creates `uisentinel.config.js` with sensible defaults.

## Common Use Cases

### Use Case 1: GitHub Copilot Agent Integration

**Step 1:** Add to your GitHub Copilot custom instructions:

```markdown
After creating or modifying UI components, always run:
`npx uisentinel validate --project . --agent-mode`

Review the output and fix any issues before proceeding.
```

**Step 2:** Let the agent use it:

```
User: Create a landing page with a hero section

Agent: [Creates code]
Agent: Let me validate the UI...
Agent: [Runs uisentinel validate]
Agent: Found 2 issues:
  1. Button contrast too low
  2. Mobile overflow on hero image
Agent: [Fixes issues]
Agent: ✓ Validation passed!
```

### Use Case 2: Visual Regression Testing

**Step 1:** Capture baseline:

```bash
uisentinel capture --url http://localhost:3000
# Creates screenshot in uisentinel-output/screenshots/
```

**Step 2:** Create baseline:

```javascript
const { UISentinel } = require('uisentinel');

const nb = new UISentinel();
await nb.start();
const result = await nb.capture({ url: '/' });
await nb.createBaseline(result.screenshots[0].path, 'homepage');
await nb.close();
```

**Step 3:** Compare after changes:

```bash
uisentinel diff --baseline ./baselines/homepage.png --current ./screenshots/latest.png
```

### Use Case 3: CI/CD Integration

Add to `.github/workflows/ui-test.yml`:

```yaml
- name: Run uisentinel
  run: npx uisentinel validate --project . --agent-mode

- name: Upload screenshots
  uses: actions/upload-artifact@v3
  with:
    name: screenshots
    path: uisentinel-output/
```

### Use Case 4: Multi-page Testing

```bash
uisentinel validate --project . --routes /,/about,/products,/contact
```

## Programmatic Usage

```javascript
const { UISentinel } = require('uisentinel');

async function testUI() {
  const nb = new UISentinel({
    projectPath: '.',
    routes: ['/'],
  });

  try {
    await nb.start();
    
    const results = await nb.validate();
    
    results.forEach(result => {
      console.log(`Page: ${result.url}`);
      console.log(`Status: ${result.status}`);
      console.log(`A11y Score: ${result.accessibility?.score}/100`);
      
      if (result.suggestions.length > 0) {
        console.log('Issues:', result.suggestions);
      }
    });
    
    // Get agent-friendly report
    const report = await nb.agentReport();
    console.log(report);
    
  } finally {
    await nb.close();
  }
}

testUI();
```

## Framework-Specific Examples

### Next.js

```bash
cd my-nextjs-app
uisentinel validate --project . --routes /,/about,/blog
```

Auto-detected and runs `npm run dev`

### Vite (React, Vue, Svelte)

```bash
cd my-vite-app
uisentinel capture --url http://localhost:5173
```

Auto-detected and runs `npm run dev`

### Static HTML

```bash
cd my-static-site
uisentinel validate --project .
```

Auto-detected and runs `npx serve`

### Custom Server

```javascript
// Start your server manually
npm run start

// Then capture
uisentinel capture --url http://localhost:8080
```

## Tips

### 1. Speed up captures

Test fewer viewports during development:

```bash
uisentinel capture --viewports desktop
```

### 2. Focus on specific areas

```bash
uisentinel agent-report --focus accessibility
```

### 3. Open screenshots automatically

```bash
uisentinel capture --open
```

### 4. Save reports

```bash
uisentinel agent-report --output ui-report.md
```

### 5. Custom viewports

```javascript
const result = await nb.capture({
  url: '/',
  viewports: [
    { width: 414, height: 896 }, // iPhone 11
    { width: 2560, height: 1440 }, // 2K display
  ],
});
```

## Troubleshooting

**Problem:** "Unable to detect project type"
- **Solution:** Make sure you have a `package.json` or HTML files in the directory

**Problem:** "Port already in use"
- **Solution:** uisentinel will automatically find an available port

**Problem:** "Server start timeout"
- **Solution:** Increase timeout: `--wait-timeout 60000`

**Problem:** Screenshots are blank
- **Solution:** Add a wait: `--wait-selector ".main-content"`

## Next Steps

- Read the [API Documentation](./docs/api.md)
- Check out [Copilot Integration Guide](./docs/copilot-integration.md)
- See [Examples](./examples/usage.ts)
- Star the repo! ⭐

## Get Help

- Issues: [GitHub Issues](https://github.com/yourusername/uisentinel/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/uisentinel/discussions)

---

**Made for AI agents who shouldn't code blindly** 👁️

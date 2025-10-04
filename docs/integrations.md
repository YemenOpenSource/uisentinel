# 🤖 AI Agent Integrations

UISentinel integrates with AI coding assistants to give them vision and validation capabilities.

## 🎯 Claude Code (Recommended)

**Status:** ✅ Fully supported with native integration

Claude Code has first-class support for UISentinel. You describe what you want validated, and Claude automatically selects the right tools, runs them, analyzes results, and provides fixes.

### Setup

1. **Install UISentinel globally:**
   ```bash
   npm install -g uisentinel
   ```

2. **Launch Claude Code** and start using the `/uisentinel` slash command!

### How It Works

You provide a task description, Claude does all the work:

```
You: "/uisentinel analyze this page for accessibility issues"

Claude:
1. Analyzes your task
2. Selects appropriate validation tools
3. Runs the validations
4. Views screenshots and JSON reports
5. Analyzes the results
6. Provides specific fixes with code examples
7. Applies fixes if you approve
8. Re-validates to confirm
```

### What Claude Can Do

- ✅ **Intelligent tool selection** - Claude picks the right validations for your task
- ✅ **Natural language interface** - Describe what you want, Claude handles the rest
- ✅ **Screenshot viewing** - Claude can view and analyze generated screenshots
- ✅ **Structured analysis** - Parses JSON reports automatically
- ✅ **Iterative fixes** - Analyzes, fixes, and re-validates automatically
- ✅ **Multi-tool workflows** - Runs multiple validations in sequence

### Example Workflow

```
You: "Create a hero section with a CTA button"

Claude: [creates the component]

You: "/uisentinel validate the hero section for accessibility and mobile"

Claude:
  Analyzing your hero section...

  Running validations for:
  ✓ Accessibility compliance
  ✓ Responsive design (mobile)
  ✓ Color contrast

  Found 2 issues:

  1. Button contrast 3.1:1 (needs 4.5:1)
     Location: .cta-button
     Fix: Change background from #60a5fa to #2563eb

  2. Missing alt text on hero background image
     Location: .hero-image
     Fix: Add alt="Professional team collaboration"

  Applying fixes...
  [updates code with specific changes]

  Re-validating...
  ✓ Accessibility: 98/100
  ✓ Mobile layout: Perfect
  ✓ All checks passed!

  Screenshots and reports saved to ./uisentinel-output/
```

### Task Examples

You can describe tasks in natural language - Claude will figure out what to validate:

**Accessibility validation:**
```
/uisentinel check this page for WCAG compliance
/uisentinel find any color contrast issues
/uisentinel validate accessibility and show me violations
```

**Responsive design:**
```
/uisentinel analyze how this looks on mobile and tablet
/uisentinel check if the layout breaks on small screens
/uisentinel capture screenshots on all devices
```

**Layout analysis:**
```
/uisentinel measure the header spacing
/uisentinel show me the grid alignment
/uisentinel detect all the buttons on this page
```

**Comprehensive validation:**
```
/uisentinel validate this page for accessibility, responsive design, and mobile UX
/uisentinel check everything - accessibility, layout, and contrast
```

### What Claude Gets

When you use `/uisentinel`, Claude receives:

**Visual Feedback:**
- Screenshots at different viewports
- Component-level captures
- Layout overlays and measurements
- Visual indicators of issues

**Structured Data:**
- JSON reports with actionable information
- Specific issues with exact locations
- Concrete fixes (not vague suggestions)
- Measurable scores and metrics

**Validation Results:**
- ♿ Accessibility compliance (WCAG 2.1 AA)
- 📱 Responsive design analysis
- 📐 Layout measurements
- 🎨 Visual quality checks

---

## 🐙 GitHub Copilot

**Status:** ⚠️ Limited support (no image viewing)

GitHub Copilot can parse UISentinel's JSON output but cannot view screenshots directly.

### Limitations

- ❌ Cannot view screenshots
- ❌ No native command integration
- ⚠️ Requires manual validation runs
- ⚠️ Must copy/paste JSON results

### Workflow Pattern

```javascript
// 1. Copilot generates UI code
// components/Hero.tsx

// 2. You run UISentinel validation manually
// (in terminal)

// 3. Copy JSON output to Copilot
// Paste the JSON into chat

// 4. Copilot analyzes and suggests fixes
"I see 2 accessibility issues. Let me fix them..."
```

### Recommendations

For GitHub Copilot users:
1. Run UISentinel validations manually
2. Review screenshots yourself
3. Share JSON results with Copilot for analysis
4. Use Copilot to apply suggested fixes

---

## 🔮 Other AI Agents

### Programmatic API

For custom AI agents or automation, use the programmatic API:

```typescript
import { UISentinel } from 'uisentinel';

const sentinel = new UISentinel({
  headless: true,
  output: { directory: './output', format: 'json' }
});

// Start browser
await sentinel.start();

// Run validations
const accessibility = await sentinel.checkAccessibility('http://localhost:3000');
const responsive = await sentinel.analyzeResponsive('http://localhost:3000');

// Parse results
if (accessibility.score < 90) {
  console.log('Accessibility issues found:', accessibility.violations);
}

// Cleanup
await sentinel.close();
```

**See [API Documentation](./api.md) for complete reference.**

---

## 🎯 Integration Patterns

### Pattern 1: Post-Generation Validation

```
1. AI generates UI code
2. Run UISentinel validation
3. AI analyzes results
4. AI applies fixes
5. Re-validate
```

**Best for:** All AI agents

### Pattern 2: Continuous Validation

```
1. Watch for file changes
2. Auto-run UISentinel on save
3. Display results in terminal
4. AI monitors for issues
```

**Best for:** Claude Code, custom scripts

### Pattern 3: Pre-Commit Validation

```
1. Add UISentinel to git hooks
2. Run validation before commit
3. Block commit if score < threshold
4. AI reviews and fixes issues
```

**Best for:** Team workflows, CI/CD

---

## 📊 Output Formats

All integrations receive structured JSON output:

### Accessibility Check
```json
{
  "score": 73,
  "violations": [
    {
      "impact": "serious",
      "message": "Button color contrast 3.1:1, needs 4.5:1",
      "selector": ".cta-button",
      "fix": "Change background from #60a5fa to #2563eb"
    }
  ],
  "summary": {
    "total": 1,
    "critical": 0,
    "serious": 1,
    "moderate": 0,
    "minor": 0
  }
}
```

### Responsive Analysis
```json
{
  "score": 77,
  "fixedElements": [
    {
      "selector": ".container",
      "width": "1200px",
      "recommendation": "Use max-width instead of width"
    }
  ],
  "overflows": [
    {
      "selector": ".hero",
      "viewport": "mobile",
      "overflowX": 45
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "issue": "Fixed width container",
      "fix": "Change width: 1200px to max-width: 1200px"
    }
  ]
}
```

### Layout Measurements
```json
{
  "selector": "h1",
  "dimensions": {
    "width": 600,
    "height": 38
  },
  "position": {
    "x": 660,
    "y": 133
  },
  "margin": {
    "top": 21.44,
    "right": 0,
    "bottom": 21.44,
    "left": 0
  },
  "padding": {
    "top": 0,
    "right": 0,
    "bottom": 0,
    "left": 0
  }
}
```

---

## 🚀 Best Practices

### For All AI Agents

1. **Validate after every UI change**
2. **Set minimum score thresholds** (e.g., 90/100 for accessibility)
3. **Fix critical issues first**
4. **Re-validate after fixes**
5. **Save screenshots for visual verification**

### For Agents Without Image Support

1. **Describe issues from JSON** - Parse structured data
2. **Apply specific fixes** - Use exact values from recommendations
3. **Track metrics** - Monitor score improvements
4. **Human review** - Have developer verify screenshots

### For Agents With Image Support (Claude Code)

1. **Show screenshots** - Display visual evidence
2. **Annotate issues** - Point to specific problems
3. **Compare before/after** - Show improvements
4. **Visual debugging** - Use overlays and measurements

---

## 🛠️ Troubleshooting

### Agent can't run UISentinel

**Solution:** Install globally
```bash
npm install -g uisentinel
```

### JSON output not found

**Solution:** Check output directory configuration
```bash
# Default output directory
ls ./uisentinel-output/
```

### Screenshots not accessible

**Solution:** Verify output directory permissions
```bash
chmod 755 ./uisentinel-output
```

---

## 📚 Additional Resources

- **[Claude Code Command Config](./.claude/commands/uisentinel.md)** - Complete Claude Code integration
- **[API Documentation](./api.md)** - Programmatic API reference
- **[Configuration Guide](./CONFIGURATION.md)** - Configuration options

---

## 🤝 Contributing

Want to improve AI agent integrations? We welcome contributions!

- Add example workflows
- Create integration guides
- Build plugins and extensions
- Share best practices

See [CONTRIBUTING.md](../CONTRIBUTING.md) for details.

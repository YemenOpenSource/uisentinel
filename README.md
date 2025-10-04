# 👁️ UISentinel

[![npm version](https://img.shields.io/npm/v/uisentinel.svg?style=flat-square)](https://www.npmjs.com/package/uisentinel)
[![npm downloads](https://img.shields.io/npm/dm/uisentinel.svg?style=flat-square)](https://www.npmjs.com/package/uisentinel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub tag](https://img.shields.io/github/v/tag/mhjabreel/uisentinel.svg?style=flat-square)](https://github.com/mhjabreel/uisentinel/tags)

**Give AI coding agents vision to debug and analyze their UI/UX designs.**

UISentinel enables AI agents to see, analyze, and debug the web UIs they create. Instead of generating code blindly, AI agents can now visually validate their work, check accessibility, measure layouts, and iterate on designs with visual feedback.

## 🎯 The Problem

AI coding agents write UI code without seeing the result. They can:
- ❌ Generate a button but can't see if the contrast is readable
- ❌ Create a responsive layout but can't verify it works on mobile
- ❌ Build a navigation menu but can't check if it's accessible
- ❌ Design a hero section but can't measure if spacing matches specs
- ❌ Fix layout issues through trial and error without visual confirmation

**They're designing blind.**

## 💡 The Solution

UISentinel gives AI agents vision and validation capabilities:

### What AI Agents Can Now Do

**🎨 See Their Work**
- Capture visual snapshots of what they build
- View designs across different screen sizes (mobile, tablet, desktop)
- Inspect specific components and elements
- Compare layouts at different breakpoints

**♿ Validate Accessibility**
- Check WCAG 2.1 AA compliance automatically
- Verify color contrast ratios meet standards
- Find missing alt text and ARIA labels
- Identify keyboard navigation issues
- Get specific fixes, not just "improve accessibility"

**📱 Test Responsive Designs**
- Analyze how layouts adapt across viewports
- Detect fixed-width elements that break on mobile
- Find overflow and layout issues
- Verify breakpoints and media queries work correctly
- Check touch target sizes for mobile UX

**📐 Measure & Analyze Layouts**
- Get exact measurements of elements and spacing
- Verify alignment and grid systems
- Detect UI components and their properties
- Check if designs match specifications
- Validate visual hierarchy and structure

**🔄 Iterate with Confidence**
- Make a change → validate → see the result
- Get structured feedback with specific fixes
- Re-validate after applying fixes
- Know when something is actually fixed (not guessing)

## ✨ Why This Matters

### Without UISentinel

```
AI Agent: "I created a hero section with a CTA button"
Developer: "The button is hard to read and it breaks on mobile"
AI Agent: "I'll try changing the colors" [guesses]
Developer: "Still not right..."
❌ Multiple iterations based on guesswork
```

### With UISentinel

```
AI Agent: "I created a hero section with a CTA button"
AI Agent: [validates design]
AI Agent: "I found 2 issues:
  - Button contrast 3.1:1 (needs 4.5:1) → Fix: #60a5fa to #2563eb
  - Layout overflows by 45px on mobile → Fix: max-width: 100%"
AI Agent: [applies specific fixes]
AI Agent: [re-validates]
AI Agent: "✅ All checks passed. Accessibility: 98/100"
✅ Fixed on the first try with confidence
```

### The Difference

**Before:** AI agents generate code → hope it works → fix blindly when it doesn't

**After:** AI agents generate code → validate visually → apply specific fixes → confirm success

## 🚀 Installation

```bash
npm install -g uisentinel
```

Initialize UISentinel in your project to set up configuration, then integrate it with your AI coding agent.

**See the [Integration Guide](./docs/integrations.md) to get started with your AI agent.**

## 🤖 Integration with AI Coding Agents

UISentinel works seamlessly with AI coding assistants, giving them visual validation capabilities.

### Claude Code

**Full native integration.** Claude can automatically select validation tools, view screenshots, parse results, and apply fixes.

```
/uisentinel <describe what you want to validate>
```

**Examples:**
```
/uisentinel check this page for accessibility issues
/uisentinel validate the mobile layout
/uisentinel analyze everything - accessibility, responsive design, and contrast
```

Claude will select the right tools, run validations, analyze visual and structural results, and provide specific code fixes.

**[See detailed integration guide →](./docs/integrations.md#claude-code)**

### GitHub Copilot

Limited support - can parse JSON reports, but cannot view screenshots.

**[See integration guide →](./docs/integrations.md#github-copilot)**

### Other AI Agents

Full programmatic API available for building custom integrations.

**[See API documentation →](./docs/api.md)**

## 📊 What AI Agents Get

### Visual Feedback
- Screenshots at any viewport size
- Component-level captures
- Layout overlays and measurements
- Visual indicators of issues

### Structured Analysis
- JSON reports with actionable data
- Specific issues with exact locations
- Concrete fixes, not vague suggestions
- Measurable scores and metrics

### Validation Capabilities
- ♿ **Accessibility**: WCAG compliance, contrast, ARIA, keyboard navigation
- 📱 **Responsive Design**: Layout analysis, breakpoints, overflow detection
- 📐 **Layout Quality**: Measurements, alignment, spacing, component detection
- 🎨 **Visual Quality**: Contrast ratios, color analysis, design validation

## ⚙️ Configuration

Create `uisentinel.config.js`:

```javascript
module.exports = {
  output: {
    directory: './uisentinel-output',
    format: 'json'
  },
  accessibility: {
    standard: 'WCAG21AA'
  }
};
```

All validations respect your configuration.

## 🎯 Use Cases

### AI-Driven UI Development
Enable AI agents to:
- Validate designs as they create them
- Fix accessibility issues automatically
- Test responsive behavior across devices
- Measure and verify layout specifications
- Iterate with visual confidence

### Automated Testing
- CI/CD integration for visual validation
- Accessibility compliance checks
- Responsive design testing
- Layout regression detection

### Developer Workflow
- Quick visual validation during development
- Pre-commit accessibility checks
- Layout debugging and measurement
- Design system verification

## 🛠️ Framework Support

Works with all major web frameworks:
- Next.js, Vite, Create React App
- Angular, SvelteKit, Astro
- Plain HTML and custom setups

UISentinel auto-detects your framework and handles setup automatically.

## 📚 Documentation

- **[AI Agent Integrations](./docs/integrations.md)** - Integration guides for Claude Code and others
- **[Configuration](./docs/CONFIGURATION.md)** - Configuration options
- **[Responsive Testing](./docs/RESPONSIVE_DESIGN_TESTING.md)** - Responsive design validation
- **[Roadmap](./docs/roadmap.md)** - Future features and plans
- **[API Documentation](./docs/api.md)** - Programmatic API reference

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - See [LICENSE](./LICENSE)

## 🌟 Support

- **Issues**: [GitHub Issues](https://github.com/mhjabreel/uisentinel/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mhjabreel/uisentinel/discussions)

---

**Built for AI agents and the developers who use them** ❤️

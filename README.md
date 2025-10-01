# 🎯 uisentinel

**Visual validation toolkit for AI coding agents** - Give AI the power to see and validate web UIs.

> 🤖 **Built specifically for AI coding agents** including GitHub Copilot, Claude Code, Cursor, Codeium, and other AI-powered development tools. Give your AI assistant the ability to see and validate what it builds!

> 🌐 **Currently focused on Web UI** - With architecture designed to expand to mobile (iOS/Android), desktop (Electron), and other platforms in the future.

## 🚀 The Problem

AI coding agents (GitHub Copilot, Claude, Cursor, etc.) generate web UI code without visual feedback. They can't see the result, leading to:
- ❌ Layout issues that could be spotted visually in seconds
- ❌ Color contrast problems that fail WCAG standards
- ❌ Responsive design failures on mobile/tablet/desktop
- ❌ Accessibility violations affecting real users
- ❌ Components that don't match specifications
- ❌ No feedback loop for iterative improvements

## 💡 The Solution

**uisentinel** gives AI agents eyes and a feedback loop. It enables agents to:
1. 👁️ **See what they build** - Capture screenshots at multiple viewports
2. ♿ **Validate accessibility** - Run WCAG 2.1 AA compliance checks automatically
3. 📱 **Test responsiveness** - Check mobile, tablet, and desktop layouts
4. 🎨 **Verify visual quality** - Detect layout overflows, contrast issues, and more
5. 🔄 **Iterate intelligently** - Receive structured feedback and fix issues
6. 📊 **Report clearly** - Get actionable suggestions in AI-friendly format

### How It Works

1. **Auto-detects** your framework (Next.js, Vite, React, plain HTML, etc.)
2. **Starts your dev server** automatically (if needed)
3. **Captures screenshots** at mobile/tablet/desktop viewports
4. **Runs accessibility checks** using axe-core (WCAG compliance)
5. **Performs layout analysis** to detect overflows and issues
6. **Generates structured reports** that AI agents can parse and act on
7. **Returns actionable feedback** like "Button contrast 3.1:1, needs 4.5:1 - change #60a5fa to #2563eb"

## 📦 Installation

```bash
# Global installation (recommended for AI agents)
npm install -g uisentinel

# Or as dev dependency
npm install --save-dev uisentinel
```

## 🤖 AI Agent Integration

**uisentinel** integrates seamlessly with major AI coding assistants:

### ⭐ Featured: GitHub Copilot Chat Mode

We provide a **complete, production-ready GitHub Copilot Chat Mode** that transforms how AI agents build UIs:

📄 **[.github/chatmodes/Ui Web Developer.chatmode.md](./.github/chatmodes/Ui%20Web%20Developer.chatmode.md)**

**What's Included:**
- 📋 Complete workflow instructions for GitHub Copilot
- ✅ Validation checklist (never skip visual checks)
- 🎯 Priority-based issue handling (Critical → Serious → Moderate)
- 📊 Accessibility scoring guidelines (minimum 90/100)
- 🔄 Re-validation loop (fix → validate → repeat until perfect)
- 💡 Common fixes library (contrast, alt text, overflows)
- 🎓 Training examples with before/after code
- 🚨 Error handling and troubleshooting

**This Chat Mode Teaches GitHub Copilot To:**
- ✅ **Never complete a UI task without visual validation**
- ✅ Run `uisentinel validate` after every UI change
- ✅ Fix accessibility issues automatically (WCAG 2.1 AA)
- ✅ Test mobile, tablet, and desktop responsiveness
- ✅ Apply specific fixes (not generic advice)
- ✅ Re-validate until score >= 90/100
- ✅ Provide visual evidence (screenshots + reports)

**Quick Setup (3 steps):**
```bash
# 1. Copy the chat mode to your project
mkdir -p .github/chatmodes
cp node_modules/uisentinel/.github/chatmodes/Ui\ Web\ Developer.chatmode.md .github/chatmodes/

# 2. GitHub Copilot auto-detects it
# (no additional configuration needed)

# 3. Start using it!
# Copilot will now validate all UI work automatically
```

**Example Interaction:**
```
You: "Create a hero section with CTA button"

Copilot: 
✅ Created hero section
⏳ Validating with uisentinel...
⚠️ Found 2 issues:
  - Button contrast 3.1:1 (needs 4.5:1)
  - Hero text overflows on mobile
🔧 Applying fixes...
✅ Re-validated: 98/100 accessibility score
✅ Task complete!
```

### Other AI Assistants
- **Claude Code**: Use the CLI commands in your prompts
- **Cursor**: Add validation steps to your `.cursorrules` file
- **Codeium**: Integrate commands in your workflow scripts
- **Custom Agents**: Use the programmatic API

**Example prompt for any AI agent:**
```
After generating the UI component, run:
npx uisentinel validate --project . --agent-mode

Then fix any reported issues and re-validate.
```

## 🎯 Quick Start

### Basic Screenshot

```bash
uisentinel capture --url http://localhost:3000
```

### Full Visual Validation (AI Agent Mode)

```bash
# This is the main command for AI agents
uisentinel validate --project . --agent-mode
```

### Multi-Route Validation

```bash
uisentinel validate --project . --routes /,/about,/contact
```

### Generate AI-Friendly Report

```bash
uisentinel agent-report --project . --focus accessibility,layout
```

## 🛠️ Features

### 1. Web Framework Auto-Detection
Automatically detects and starts your web dev server:
- ✅ Next.js (dev & production)
- ✅ Vite (React, Vue, Svelte, etc.)
- ✅ Create React App
- ✅ Plain HTML (static server)
- ✅ Angular
- ✅ SvelteKit
- ✅ Astro
- ✅ Custom web servers

### 2. Visual Capture (Web Browsers)
- 📸 Multiple viewport sizes (mobile, tablet, desktop web)
- 🎨 Full page screenshots
- 🎯 Element-specific captures
- ⚡ Parallel capture for speed
- 🌐 Works with Chrome, Firefox, Safari via Playwright

### 3. Web Accessibility Analysis
- ♿ WCAG 2.1 Level AA compliance
- 🎨 Color contrast checking (web standards)
- 🏷️ ARIA label validation
- ⌨️ Keyboard navigation testing
- 🔍 Semantic HTML validation

### 4. Visual Regression (Web UI)
- 📊 Pixel-by-pixel comparison
- 🎯 Diff highlighting
- 📈 Change percentage
- 🗂️ Baseline management

### 5. AI-Friendly Output
Structured JSON output perfect for agents:
```json
{
  "status": "success",
  "screenshots": [...],
  "accessibility": {
    "violations": [...],
    "score": 95
  },
  "layout": {
    "viewport": "1920x1080",
    "elements": [...]
  },
  "suggestions": [
    "Increase contrast ratio on button",
    "Add alt text to images"
  ]
}
```

## 📚 Usage Examples

### Programmatic API

```typescript
import { UISentinel } from 'uisentinel';

const nb = new UISentinel({
  projectPath: '.',
  headless: true
});

// Start the project
await nb.start();

// Capture homepage
const result = await nb.capture({
  url: '/',
  viewports: ['mobile', 'desktop'],
  accessibility: true,
  screenshot: true
});

console.log(result.suggestions);

// Cleanup
await nb.close();
```

### CLI Commands

```bash
# Capture with accessibility check
uisentinel capture --url http://localhost:3000 --a11y

# Visual regression test
uisentinel diff --baseline ./screenshots/baseline --current ./screenshots/current

# Full validation report
uisentinel validate --project . --routes /,/about --output report.json

# Agent-friendly summary
uisentinel agent-report --project . --focus layout,accessibility
```

## 🎨 Use Cases

### For AI Coding Agents (Primary Use Case)

**The Challenge:** AI agents generate code but can't see the visual result, leading to:
- Inaccessible UIs that fail WCAG standards
- Responsive design issues on different devices
- Visual bugs that could be caught immediately
- No way to verify the code matches specifications

**The Solution:** uisentinel provides AI agents with visual feedback

```bash
# Agent generates UI code
[Agent creates component]

# Agent validates automatically
npx uisentinel validate --project . --agent-mode

# Agent receives structured, actionable feedback
{
  "suggestions": [
    "Button contrast 3.1:1 fails WCAG AA (needs 4.5:1). Fix: #60a5fa → #2563eb",
    "Mobile (375px): navbar overflows container by 45px. Fix: add max-width: 100%",
    "3 images missing alt text. Fix: add descriptive alt attributes"
  ],
  "accessibility": { "score": 73, "violations": 3 },
  "priority": ["CRITICAL", "SERIOUS", "MODERATE"]
}

# Agent applies specific fixes
[Agent updates code with exact solutions]

# Agent re-validates to confirm
[Score: 98/100 ✅]
```

**Benefits for AI Agents:**
- 🎯 **Specific fixes** - Not "improve accessibility" but "change #60a5fa to #2563eb"
- 🔄 **Feedback loop** - Validate → Fix → Re-validate until perfect
- 📊 **Measurable results** - 73/100 → 98/100 accessibility score
- 🚀 **Faster iteration** - No need for human to check visually
- ✅ **Quality assurance** - Never ship broken UIs

### For Developers

```bash
# Quick visual check during development
uisentinel capture --url http://localhost:3000 --open

# Before committing changes
uisentinel diff --baseline main --warn-threshold 5%

# Full project validation
uisentinel validate --project . --routes /,/about,/products

# Generate reports for team
uisentinel agent-report --project . --output validation-report.md
```

### For QA & Testing

```bash
# Automated accessibility testing
uisentinel validate --project . --routes /* --focus accessibility

# Visual regression in CI/CD
uisentinel diff --baseline ./baselines --current ./screenshots --threshold 2

# Multi-viewport testing
uisentinel capture --viewports mobile,tablet,desktop,mobile-landscape
```

## 🔧 Configuration

Create `uisentinel.config.js`:

```javascript
module.exports = {
  framework: 'auto', // or 'nextjs', 'vite', 'html'
  port: 3000,
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 }
  },
  accessibility: {
    standard: 'WCAG21AA',
    ignore: []
  },
  screenshot: {
    fullPage: true,
    format: 'png'
  },
  output: {
    directory: './uisentinel-output',
    format: 'json'
  }
};
```

## 🧪 Example Workflow: AI Agent with Visual Feedback

### The Complete Workflow

```bash
# 1. 🤖 AI Agent generates UI
GitHub Copilot: "create a landing page with hero section and CTA button"

# 2. 👁️ Validate visually
npx uisentinel validate --project . --agent-mode

# 3. 📊 Agent receives structured feedback
{
  "status": "warning",
  "accessibility": {
    "score": 73,
    "violations": [
      {
        "impact": "serious",
        "message": "Button color contrast 3.1:1, needs 4.5:1",
        "fix": "Change background from #60a5fa to #2563eb"
      }
    ]
  },
  "layout": {
    "overflows": [
      {
        "element": ".hero-section",
        "viewport": "mobile",
        "overflowX": 45
      }
    ]
  },
  "suggestions": [
    "Increase button contrast: #60a5fa → #2563eb (achieves 7.2:1 ratio)",
    "Add max-width: 100% to .hero-section for mobile",
    "Missing alt text on hero background image"
  ]
}

# 4. 🔧 Agent applies fixes automatically
GitHub Copilot: "Applying fixes..."
- ✅ Changed button background to #2563eb
- ✅ Added responsive max-width to hero section
- ✅ Added alt="Hero background" to image

# 5. ✅ Re-validate to confirm
npx uisentinel validate --project . --agent-mode

# 6. 🎉 Success!
{
  "status": "success",
  "accessibility": { "score": 98, "violations": [] },
  "layout": { "overflows": [] }
}
```

### Why This Matters

**Without uisentinel (Traditional AI Agent):**
```
User: "Create a landing page"
Agent: [Generates code]
User: "The button is hard to read and it breaks on mobile"
Agent: [Guesses at fixes without visual feedback]
User: "Still not right..."
❌ Multiple iterations without visual feedback
```

**With uisentinel (AI Agent with Visual Feedback):**
```
User: "Create a landing page"
Agent: [Generates code]
Agent: [Auto-validates with uisentinel]
Agent: "I found 3 issues. Fixing them now..."
Agent: [Applies specific fixes]
Agent: [Re-validates]
Agent: "✅ Landing page complete! 98/100 accessibility score"
✅ One iteration, validated result
```

### Real-World Example

See our complete GitHub Copilot Chat Mode in action:
📄 [.github/chatmodes/Ui Web Developer.chatmode.md](./.github/chatmodes/Ui%20Web%20Developer.chatmode.md)

This chat mode teaches the agent to:
- Never complete a UI task without validation
- Always check accessibility (WCAG 2.1 AA)
- Test on mobile, tablet, and desktop
- Fix critical issues first
- Re-validate after each fix
- Provide visual evidence

## 🗺️ Roadmap & Future Features

### 🤖 AI Agent Integrations
- [x] ✅ **GitHub Copilot** - Complete chat mode integration
- [ ] 🚧 **Claude Code (Anthropic)** - Native Claude Desktop integration
- [ ] 🚧 **Cursor** - `.cursorrules` templates and commands
- [ ] 🚧 **Codeium** - Autocomplete and chat integration
- [ ] 🚧 **Cody (Sourcegraph)** - Context-aware validation
- [ ] 🚧 **Continue.dev** - VSCode extension integration
- [ ] 🚧 **Tabnine** - AI validation suggestions
- [ ] 🚧 **Amazon Q** - AWS-integrated validation
- [ ] 🚧 **Gemini Code Assist** - Google AI integration
- [ ] 🚧 **Replit AI** - Online IDE integration

### 📸 Advanced Capture Features
- [ ] 🚧 **Interactive screenshots** - Click, scroll, hover captures
- [ ] 🚧 **Element isolation** - Capture specific components
- [ ] 🚧 **Zoom and pan** - High-resolution detail captures
- [ ] 🚧 **Comparison view** - Side-by-side before/after
- [ ] 🚧 **Annotation tools** - Mark up screenshots with notes
- [ ] 🚧 **Video recording** - Capture user interactions
- [ ] 🚧 **Animation capture** - Record CSS/JS animations
- [ ] 🚧 **PDF generation** - Export validation reports as PDF
- [ ] 🚧 **Multi-page flows** - Capture entire user journeys
- [ ] 🚧 **Responsive timeline** - Show viewport changes over time

### 🎨 Visual Analysis Enhancements
- [ ] 🚧 **AI visual description** - GPT-4 Vision describes what's on screen
- [ ] 🚧 **Component detection** - Auto-identify UI components
- [ ] 🚧 **Design system validation** - Check against style guide
- [ ] 🚧 **Typography analysis** - Font size, weight, hierarchy checks
- [ ] 🚧 **Spacing validation** - Consistent padding/margins
- [ ] 🚧 **Color palette extraction** - Detect all colors used
- [ ] 🚧 **Shadow analysis** - Validate elevation system
- [ ] 🚧 **Grid alignment** - Check pixel-perfect alignment
- [ ] 🚧 **Icon consistency** - Verify icon sizes and styles
- [ ] 🚧 **Brand compliance** - Match against brand guidelines

### ⚡ Performance & Metrics
- [ ] 🚧 **Core Web Vitals** - LCP, FID, CLS measurement
- [ ] 🚧 **Lighthouse integration** - Full performance audits
- [ ] 🚧 **Bundle size tracking** - Monitor JavaScript/CSS size
- [ ] 🚧 **Image optimization** - Detect unoptimized images
- [ ] 🚧 **Lazy loading detection** - Verify performance optimizations
- [ ] 🚧 **Network waterfall** - Request timing visualization
- [ ] 🚧 **Memory profiling** - Detect memory leaks
- [ ] 🚧 **CPU profiling** - Identify performance bottlenecks

### ♿ Accessibility Enhancements
- [ ] 🚧 **Screen reader testing** - Automated VoiceOver/NVDA tests
- [ ] 🚧 **Keyboard navigation** - Tab order validation
- [ ] 🚧 **Focus management** - Visual focus indicator checks
- [ ] 🚧 **ARIA validation** - Advanced ARIA pattern checks
- [ ] 🚧 **Color blindness simulation** - Test all colorblindness types
- [ ] 🚧 **Magnification testing** - Verify 200% zoom support
- [ ] 🚧 **Motion sensitivity** - Detect problematic animations
- [ ] 🚧 **Reading level** - Content readability scoring

### 🔄 Testing & CI/CD
- [ ] 🚧 **GitHub Actions** - Official action for CI/CD
- [ ] 🚧 **GitLab CI** - Native GitLab integration
- [ ] 🚧 **Jenkins plugin** - Enterprise CI integration
- [ ] 🚧 **CircleCI orb** - CircleCI integration
- [ ] 🚧 **Azure Pipelines** - Microsoft DevOps integration
- [ ] 🚧 **Baseline management** - Smart baseline updates
- [ ] 🚧 **Visual regression** - Enhanced diffing algorithms
- [ ] 🚧 **Test reporting** - Beautiful HTML reports
- [ ] 🚧 **Parallel testing** - Multi-browser parallel runs

### 🧹 Developer Experience
- [ ] 🚧 **VSCode extension** - Inline validation results
- [ ] 🚧 **Browser DevTools** - Chrome extension integration
- [ ] 🚧 **Watch mode** - Auto-validate on file changes
- [ ] 🚧 **Configuration UI** - Web-based config generator
- [ ] 🚧 **Interactive CLI** - Guided validation setup
- [ ] 🚧 **Hot reload** - Fast incremental validation
- [ ] 🚧 **Smart caching** - Skip unchanged routes
- [ ] 🚧 **Progress indicators** - Real-time validation status
- [ ] 🚧 **Error recovery** - Graceful failure handling
- [ ] 🚧 **Debug mode** - Verbose logging for troubleshooting

### 🌐 Web Framework Support
- [x] ✅ **Next.js** - Full support (pages & app router)
- [x] ✅ **Vite** - React, Vue, Svelte, Solid
- [x] ✅ **Create React App** - Full support
- [x] ✅ **Plain HTML** - Static file serving
- [x] ✅ **Angular** - Full support
- [x] ✅ **SvelteKit** - Full support
- [x] ✅ **Astro** - Full support
- [ ] 🚧 **Nuxt.js** - Vue 3 meta-framework
- [ ] 🚧 **Remix** - React meta-framework
- [ ] 🚧 **Gatsby** - Static site generator
- [ ] 🚧 **Docusaurus** - Documentation sites
- [ ] 🚧 **Storybook** - Component validation
- [ ] 🚧 **Qwik** - Resumable framework

### 📱 Platform Expansion (Future)
- [ ] 🔮 **iOS Native** - Swift/SwiftUI validation
- [ ] 🔮 **Android Native** - Kotlin/Compose validation
- [ ] 🔮 **React Native** - Cross-platform mobile validation
- [ ] 🔮 **Flutter** - Cross-platform UI validation
- [ ] 🔮 **Electron** - Desktop application validation
- [ ] 🔮 **Tauri** - Lightweight desktop validation
- [ ] 🔮 **Unity** - Game UI validation
- [ ] 🔮 **Unreal Engine** - Game UI validation
- [ ] 🔮 **SwiftUI (macOS)** - Native macOS validation
- [ ] 🔮 **WinUI 3** - Windows desktop validation

### 🎯 Usage & Workflow
- [ ] 🚧 **Project templates** - Pre-configured starter projects
- [ ] 🚧 **Usage analytics** - Track validation patterns (opt-in)
- [ ] 🚧 **Best practices** - AI-suggested improvements
- [ ] 🚧 **Code generation** - Auto-fix certain issues
- [ ] 🚧 **Learning mode** - Explain issues in detail
- [ ] 🚧 **Team dashboards** - Centralized validation tracking
- [ ] 🚧 **Slack/Discord bots** - Notifications and reports
- [ ] 🚧 **API webhooks** - Custom integrations

### 📊 Priority Labels
- ✅ **Complete** - Feature is implemented and tested
- 🚧 **Planned** - On the roadmap for web UI, not yet started
- � **Future** - Platform expansion beyond web (mobile, desktop, etc.)
- �🔥 **High Priority** - Planned for next release
- 💡 **Community Request** - Suggested by users

**Want to contribute?** Pick any 🚧 item and open a PR! We welcome contributions.

### 🎯 Current Focus
**Web UI First:** We're laser-focused on making web UI validation exceptional before expanding to other platforms. The architecture is designed to support mobile (iOS/Android), desktop (Electron/Tauri), and game engines in the future.

## 📖 Documentation

### For AI Agents
- 🤖 **[GitHub Copilot Chat Mode](./.github/chatmodes/Ui%20Web%20Developer.chatmode.md)** - Complete integration guide
- 📚 **[Agent Workflow Guide](./docs/agent-workflow.md)** - Best practices for AI assistants
- 🎯 **[Validation Checklist](./docs/validation-checklist.md)** - Step-by-step validation guide

### For Developers
- 🚀 **[Quick Start Guide](./docs/quick-start.md)** - Get up and running in 5 minutes
- 📖 **[API Documentation](./docs/api.md)** - Complete API reference
- 💻 **[CLI Reference](./docs/cli-reference.md)** - All command-line options
- 🎨 **[Framework Examples](./docs/framework-examples.md)** - Integration examples
- 🔧 **[Configuration Guide](./docs/configuration.md)** - Advanced configuration

### Resources
- 📊 **[Project Summary](./PROJECT_SUMMARY.md)** - Complete project overview
- 🎬 **[Video Tutorials](./docs/tutorials.md)** - Step-by-step videos
- ❓ **[FAQ](./docs/faq.md)** - Frequently asked questions
- 🐛 **[Troubleshooting](./docs/troubleshooting.md)** - Common issues and solutions

## 🎬 Getting Started

```bash
# Install globally
npm install -g uisentinel

# Validate your project
cd your-project
uisentinel validate --project . --agent-mode

# Or use programmatically
npm install --save-dev uisentinel
```

```javascript
const { UISentinel } = require('uisentinel');

const nb = new UISentinel({ projectPath: '.' });
await nb.start();
const results = await nb.validate();
console.log('Accessibility score:', results[0].accessibility?.score);
await nb.close();
```

## 🤝 Contributing

Contributions welcome! This tool is designed to make AI agents better at building UIs.

Ideas for contributions:
- Add support for more frameworks
- Improve visual analysis algorithms
- Add more accessibility checks
- Create integration examples
- Improve documentation

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.

## 🌟 Star Us!

If you find uisentinel helpful, please star the repository to help others discover it!

## 💬 Community

- **Issues**: Found a bug? [Open an issue](https://github.com/yourusername/uisentinel/issues)
- **Discussions**: Have ideas? [Start a discussion](https://github.com/yourusername/uisentinel/discussions)
- **Twitter**: Follow for updates [@uisentinel](https://twitter.com/uisentinel)

---

**Built with ❤️ for AI agents and the developers who use them**

*"The best UI is one that works for everyone, and can be verified automatically."*

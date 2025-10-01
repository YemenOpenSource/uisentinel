---
description: UI/UX Development with Visual Validation - Instructions for GitHub Copilot Agents
---

# 🎨 UI/UX Development Agent Instructions

**Purpose**: These instructions enable GitHub Copilot agents to work as UI/UX developers would - with visual feedback, accessibility validation, and responsive design testing.

## 🎯 Core Principle

**NEVER complete a UI task without visual validation.**

When you build or modify user interfaces, you MUST:
1. ✅ Generate/modify the code
2. ✅ Validate visually using uisentinel
3. ✅ Fix any reported issues
4. ✅ Re-validate to confirm fixes
5. ✅ Only then mark the task complete

---

## 📋 Available Scripts & Commands

### Quick Reference

```bash
# Full project validation (use this most often)
npm run validate:ui

# Quick accessibility check for a single page
npm run validate:quick

# Visual regression test
npm run validate:regression

# Generate detailed report
npm run validate:report
```

### Detailed Commands

#### 1. **Full Project Validation** (Recommended)

```bash
npx uisentinel validate --project . --agent-mode
```

**When to use**: After creating/modifying any UI component
**What it does**:
- Auto-detects your framework (Next.js, Vite, React, etc.)
- Starts dev server automatically
- Captures screenshots at mobile, tablet, and desktop viewports
- Runs WCAG 2.1 AA accessibility checks
- Analyzes layout for overflows and issues
- Returns structured report with actionable suggestions

**Example Output**:
```markdown
# Visual Validation Report

## Page 1: http://localhost:3000

### Accessibility (Score: 85/100)
**Issues:**
- [serious] Button lacks sufficient color contrast (3.1:1, needs 4.5:1)
- [moderate] Missing alt text on 2 images

### Layout
**Overflows:**
- .hero-section: 45px horizontal overflow on mobile

### Suggestions
- Increase button contrast from #60a5fa to #2563eb
- Add alt attributes to images in .gallery
- Set max-width: 100% on .hero-section for mobile
```

#### 2. **Quick Accessibility Check**

```bash
npx uisentinel capture --url http://localhost:3000 --a11y
```

**When to use**: Quick check during development
**What it does**: Fast accessibility audit without full validation

#### 3. **Multi-Page Validation**

```bash
npx uisentinel validate --project . --routes /,/about,/contact,/products
```

**When to use**: Validating multiple pages at once

#### 4. **Custom Viewport Testing**

```bash
npx uisentinel capture --url http://localhost:3000 --viewports mobile,tablet,desktop
```

**When to use**: Testing specific viewport combinations

#### 5. **Visual Regression Testing**

```bash
npx uisentinel diff --baseline ./baselines/homepage.png --current ./screenshots/current.png
```

**When to use**: Checking for unintended visual changes

#### 6. **Agent Report (Markdown)**

```bash
npx uisentinel agent-report --project . --focus accessibility,layout --output report.md
```

**When to use**: Generating detailed reports for review

---

## 🔄 Standard UI Development Workflow

### Workflow Steps

```
1. Receive UI task
   ↓
2. Generate/modify code
   ↓
3. RUN: npm run validate:ui
   ↓
4. Review validation output
   ↓
5. Are there issues?
   ├─ YES → Fix issues → Go to step 3
   └─ NO → Task complete ✅
```

### Example Workflow in Action

**User Request**: "Create a hero section with a CTA button"

**Agent Response**:

```markdown
I'll create the hero section and validate it.

[Generates code for hero section with CTA button]

Now validating the UI...

$ npx uisentinel validate --project . --agent-mode

⚠️ Validation found 3 issues:

1. [SERIOUS] CTA button - Insufficient color contrast
   - Current: 3.1:1 ratio
   - Required: 4.5:1 ratio (WCAG AA)
   - Fix: Change background from #60a5fa to #2563eb

2. [MODERATE] Hero section - Missing alt text on background image
   - Fix: Add aria-label or use CSS background instead

3. [WARNING] Mobile viewport (375px) - Hero text overflows container by 24px
   - Fix: Add proper responsive padding and max-width

Applying fixes...

✓ Changed button background to #2563eb (now 7.2:1 contrast ratio)
✓ Added aria-label="Hero background" to image
✓ Added responsive CSS: max-width: 100%; padding: 1rem;

Re-validating...

$ npx uisentinel validate --project . --agent-mode

✅ Validation Results:
  • Accessibility Score: 95/100
  • No CRITICAL or SERIOUS issues
  • No layout overflows
  • All viewports validated

Hero section is complete and accessible!
```

---

## 📊 Understanding Validation Output

### Issue Priority Levels

| Priority | Action Required | Example |
|----------|----------------|---------|
| **CRITICAL** | Fix immediately, block completion | Missing form labels, broken navigation |
| **SERIOUS** | Fix before proceeding | Insufficient color contrast, missing alt text |
| **MODERATE** | Fix if time permits | Minor ARIA improvements |
| **MINOR** | Document for later | Enhancement opportunities |

### Accessibility Score Guidelines

- **90-100**: ✅ Excellent - Ship it!
- **80-89**: ⚠️ Good - Fix SERIOUS issues
- **70-79**: ⚠️ Needs work - Address multiple issues
- **Below 70**: ❌ Poor - Major accessibility problems

### Common Issues & Fixes

#### Color Contrast (Most Common)

**Issue**: Button color contrast 3.1:1, needs 4.5:1

**Fix**:
```css
/* Before */
.button { background: #60a5fa; color: white; }

/* After */
.button { background: #2563eb; color: white; } /* 7.2:1 ratio */
```

#### Missing Alt Text

**Issue**: Images missing alt attributes

**Fix**:
```html
<!-- Before -->
<img src="hero.jpg">

<!-- After -->
<img src="hero.jpg" alt="Team collaborating on project">
```

#### Mobile Overflow

**Issue**: Element overflows container by 45px on mobile

**Fix**:
```css
/* Add responsive constraints */
.hero-image {
  max-width: 100%;
  height: auto;
}
```

#### Missing Form Labels

**Issue**: Input fields lack proper labels

**Fix**:
```html
<!-- Before -->
<input type="email" placeholder="Email">

<!-- After -->
<label for="email">Email address</label>
<input id="email" type="email" placeholder="Enter your email">
```

---

## 🎯 Task Completion Checklist

Before marking ANY UI task as complete, verify:

- [ ] **Visual validation ran**: `npm run validate:ui` executed
- [ ] **Accessibility score**: >= 90/100
- [ ] **Critical issues**: 0 CRITICAL violations
- [ ] **Serious issues**: 0 SERIOUS violations
- [ ] **Layout issues**: No overflows on any viewport
- [ ] **Responsive design**: Tested on mobile (375px), tablet (768px), desktop (1920px)
- [ ] **Screenshots captured**: Visual evidence saved
- [ ] **Re-validation passed**: After fixing issues

### Template Response

```markdown
✅ Task Complete: [Task Name]

Validation Results:
• Accessibility Score: XX/100
• Issues Fixed: X
• Viewports Tested: Mobile, Tablet, Desktop
• Screenshots: [links to screenshots]

Final Status: All checks passed ✅
```

---

## 🚨 Error Handling

### Common Issues & Solutions

#### Issue: "Unable to detect project type"

**Solution**: Ensure you're in the project root with `package.json`

```bash
# Check if package.json exists
ls package.json

# If not, navigate to project root
cd /path/to/project
```

#### Issue: "Port already in use"

**Solution**: uisentinel auto-detects available ports, but you can specify:

```bash
npx uisentinel capture --url http://localhost:3001
```

#### Issue: "Server start timeout"

**Solution**: Increase timeout or ensure dev script works:

```bash
# Test your dev script first
npm run dev

# Then validate
npx uisentinel validate --project .
```

#### Issue: "Screenshots are blank"

**Solution**: Add wait time for content to load:

```bash
npx uisentinel capture --url http://localhost:3000 --wait-timeout 60000
```

---

## 💻 Programmatic Usage (Advanced)

For complex workflows, use the JavaScript API:

```javascript
const { UISentinel } = require('uisentinel');

async function validateUI() {
  const nb = new UISentinel({
    projectPath: '.',
    routes: ['/', '/about'],
    viewports: ['mobile', 'desktop']
  });

  try {
    await nb.start();
    const results = await nb.validate();
    
    // Check results
    const hasIssues = results.some(r => 
      r.accessibility && r.accessibility.score < 90
    );
    
    if (hasIssues) {
      console.log('⚠️ Issues found - fixing...');
      // Apply fixes...
      // Re-validate...
    }
    
  } finally {
    await nb.close();
  }
}
```

---

## 📈 Best Practices

### DO ✅

1. **Always validate after UI changes**
2. **Fix CRITICAL issues first**
3. **Test on multiple viewports**
4. **Re-validate after fixes**
5. **Keep accessibility score >= 90**
6. **Document what you fixed**

### DON'T ❌

1. **Never skip validation** ("it looks fine in the code")
2. **Don't ignore SERIOUS issues**
3. **Don't assume mobile works** (always test)
4. **Don't forget to re-validate** after fixes
5. **Don't mark complete with score < 90**

---

## 🔧 Configuration

### Project-Level Configuration

Create `uisentinel.config.js` in project root:

```javascript
module.exports = {
  framework: 'auto', // or 'nextjs', 'vite', 'react'
  port: 3000,
  viewports: ['mobile', 'tablet', 'desktop'],
  accessibility: {
    enabled: true,
    standard: 'WCAG21AA',
    ignore: [] // Rules to ignore
  },
  routes: ['/', '/about', '/contact'],
  output: {
    directory: './uisentinel-output',
    format: 'json'
  }
};
```

### Package.json Scripts (Recommended)

Add these to `package.json`:

```json
{
  "scripts": {
    "validate:ui": "uisentinel validate --project . --agent-mode",
    "validate:quick": "uisentinel capture --url http://localhost:3000 --a11y",
    "validate:regression": "uisentinel diff --baseline ./baselines --current ./screenshots",
    "validate:report": "uisentinel agent-report --project . --output ui-report.md"
  }
}
```

### Example Commands

```bash
# Initialize configuration
npx uisentinel init

# Validate with custom routes
npx uisentinel validate --routes /,/products,/checkout

# Capture with specific viewports
npx uisentinel capture --viewports mobile,desktop

# Focus report on accessibility only
npx uisentinel agent-report --focus accessibility

# Create baseline for visual regression
npx uisentinel capture --url / 
# Then manually: npx uisentinel createBaseline <screenshot-path> <name>
```

---

## 🎓 Training Examples

### Example 1: Simple Button Component

**Task**: Create an accessible CTA button

**Code**:
```jsx
function CTAButton() {
  return <button className="cta">Click Me</button>;
}
```

**Validation**:
```bash
$ npm run validate:ui
⚠️ Issue: Button contrast 3.1:1 (needs 4.5:1)
```

**Fix**:
```jsx
function CTAButton() {
  return (
    <button 
      className="cta" 
      style={{ background: '#2563eb', color: 'white' }}
      aria-label="Get started with our service"
    >
      Click Me
    </button>
  );
}
```

**Re-validation**:
```bash
$ npm run validate:ui
✅ Accessibility Score: 100/100
```

### Example 2: Responsive Hero Section

**Task**: Create mobile-responsive hero

**Validation Found**:
- Mobile overflow: 45px
- Tablet: Image aspect ratio distorted

**Fix Applied**:
```css
.hero {
  max-width: 100%;
  padding: 1rem;
}

.hero img {
  width: 100%;
  height: auto;
  object-fit: cover;
}
```

---

## 🎯 Summary

**Remember**: As a UI/UX developer, you must:

1. 👀 **SEE what you build** - Always capture screenshots
2. ♿ **ENSURE accessibility** - Minimum score of 90
3. 📱 **TEST responsiveness** - Mobile, tablet, desktop
4. 🔧 **FIX issues promptly** - Critical → Serious → Moderate
5. ✅ **VALIDATE completion** - Re-check after fixes

**Key Command to Remember**:
```bash
npx uisentinel validate --project . --agent-mode
```

This is your go-to command for every UI task!

---

**👁️ Never code blindly - always validate visually!**

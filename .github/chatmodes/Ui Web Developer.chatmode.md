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
3. ✅ Fix any reported issues (technical AND visual)
4. ✅ Re-validate to confirm fixes
5. ✅ Only then mark the task complete

**Critical Rule**: If screenshots show visual problems, those problems MUST be fixed regardless of technical validation scores.

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

# Interactive capture - test dynamic UI states (NEW!)
npx uisentinel capture --url http://localhost:3000 \
  --name modal_open \
  --description "Testing modal accessibility" \
  --click "#open-modal" \
  --wait 500 \
  --a11y
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

#### 7. **Interactive Capture - Test Dynamic UI States** (NEW!)

```bash
# Simple: Single action
npx uisentinel capture \
  --url http://localhost:3000 \
  --name modal_open \
  --description "Test modal accessibility when opened" \
  --click "#open-modal-btn" \
  --wait 500 \
  --a11y

# Advanced: Multiple actions
npx uisentinel capture \
  --url http://localhost:3000 \
  --name dropdown_keyboard \
  --description "Test dropdown keyboard navigation" \
  --actions '[
    {"type":"click","selector":".dropdown-trigger"},
    {"type":"wait","duration":300},
    {"type":"hover","selector":".menu-item"}
  ]' \
  --a11y
```

**When to use**: Testing modals, dropdowns, tooltips, hover states, form validations
**What it does**:
- Executes browser actions (click, hover, scroll, type, wait)
- Captures screenshots AFTER interactions
- Validates accessibility in the interactive state
- Generates markdown report with test documentation

**Supported Actions**:
- `--click "selector"` - Click an element
- `--hover "selector"` - Hover over an element  
- `--scroll-to "selector"` - Scroll to an element
- `--wait <ms>` - Wait for specified milliseconds
- `--actions '[...]'` - Multiple actions as JSON array

**Output**:
- Screenshots: `{name}_{viewport}_{timestamp}.png`
- Report: `{name}.md` (includes actions performed, results, screenshots)

---

## 🎯 Element Accessibility for Interactive Testing

### CRITICAL: Make Interactive Elements Targetable

When building UI components that will be tested with interactive capture, you MUST ensure elements can be easily targeted by selectors.

### Element Identification Strategy

**Priority Order for Selectors:**

1. **Semantic HTML + ARIA** (Best - Accessible to all)
   ```html
   <button aria-label="Open modal">Get Started</button>
   <!-- Target: button[aria-label="Open modal"] -->
   
   <nav aria-label="Main navigation">...</nav>
   <!-- Target: nav[aria-label="Main navigation"] -->
   ```

2. **Classes** (Good - Reusable, semantic)
   ```html
   <button class="open-modal-btn">Click Me</button>
   <!-- Target: .open-modal-btn -->
   
   <div class="dropdown-menu">...</div>
   <!-- Target: .dropdown-menu -->
   ```

3. **IDs** (Use sparingly - only for unique components)
   ```html
   <div id="contact-modal">...</div>
   <!-- Target: #contact-modal -->
   
   <button id="submit-form">Submit</button>
   <!-- Target: #submit-form -->
   ```

4. **Data Attributes** (Good for testing, doesn't affect styling)
   ```html
   <button data-testid="modal-trigger">Open</button>
   <!-- Target: [data-testid="modal-trigger"] -->
   ```

### DO ✅

```html
<!-- Clear, semantic, targetable -->
<button class="cta-button" aria-label="Get early access">
  Join Waitlist
</button>

<div class="modal-overlay" role="dialog" aria-modal="true">
  <button class="modal-close" aria-label="Close modal">×</button>
</div>

<nav class="main-nav" aria-label="Primary navigation">
  <button class="menu-toggle" aria-label="Toggle menu">☰</button>
</nav>

<form class="contact-form">
  <input id="email" type="email" name="email" />
  <button type="submit" class="submit-btn">Send</button>
</form>
```

**Selectors for testing:**
- `.cta-button` or `button[aria-label="Get early access"]`
- `.modal-close` or `button[aria-label="Close modal"]`
- `.menu-toggle` or `.main-nav button`
- `.submit-btn` or `.contact-form button[type="submit"]`

### DON'T ❌

```html
<!-- Hard to target, not semantic -->
<div onclick="openModal()">
  <span>Click Me</span>
</div>

<div class="x">×</div> <!-- No semantic meaning -->

<div class="btn">Submit</div> <!-- Should be <button> -->

<a href="#">Menu</a> <!-- Links without href or role -->
```

**Problems:**
- Non-semantic elements harder to target
- No ARIA labels makes automation difficult
- Generic class names like "x", "btn" are ambiguous
- Missing proper roles and semantics

### Best Practices for Interactive UI

#### 1. **Modals & Dialogs**
```html
<div class="modal-overlay" role="dialog" aria-modal="true" 
     aria-labelledby="modal-title">
  <div class="modal-content">
    <h2 id="modal-title">Contact Us</h2>
    <button class="modal-close" aria-label="Close dialog">×</button>
    <form class="modal-form">...</form>
  </div>
</div>
```

**Test selectors:**
- Open trigger: `.open-modal-btn` or `button[aria-haspopup="dialog"]`
- Close: `.modal-close` or `button[aria-label="Close dialog"]`
- Form: `.modal-form` or `[role="dialog"] form`

#### 2. **Dropdowns & Menus**
```html
<div class="dropdown">
  <button class="dropdown-trigger" aria-haspopup="true" 
          aria-expanded="false">
    Options ▼
  </button>
  <ul class="dropdown-menu" role="menu" hidden>
    <li role="menuitem"><a href="#" class="menu-item">Profile</a></li>
    <li role="menuitem"><a href="#" class="menu-item">Settings</a></li>
  </ul>
</div>
```

**Test selectors:**
- Trigger: `.dropdown-trigger` or `button[aria-haspopup="true"]`
- Menu items: `.menu-item` or `[role="menuitem"]`
- First item: `.dropdown-menu .menu-item:first-child`

#### 3. **Tooltips & Popovers**
```html
<button class="info-btn" 
        aria-describedby="tooltip-1"
        data-tooltip="More information">
  ℹ️
</button>
<div id="tooltip-1" role="tooltip" class="tooltip">
  This is additional information
</div>
```

**Test selectors:**
- Trigger: `.info-btn` or `button[aria-describedby="tooltip-1"]`
- Tooltip: `#tooltip-1` or `.tooltip[role="tooltip"]`

#### 4. **Form Validations**
```html
<form class="signup-form">
  <div class="form-field">
    <label for="email">Email</label>
    <input id="email" type="email" required 
           aria-describedby="email-error" />
    <span id="email-error" class="error-message" role="alert" hidden>
      Please enter a valid email
    </span>
  </div>
  <button type="submit" class="submit-btn">Sign Up</button>
</form>
```

**Test selectors:**
- Email field: `#email` or `.signup-form input[type="email"]`
- Submit: `.submit-btn` or `.signup-form button[type="submit"]`
- Error: `.error-message` or `[role="alert"]`

### Selector Selection Guide

**When choosing selectors for interactive testing, agents should:**

1. **Prefer semantic meaning over structure**
   - ✅ `button[aria-label="Close modal"]`
   - ❌ `.modal > div > div > span:last-child`

2. **Use stable identifiers**
   - ✅ `.modal-close` (explicit class for functionality)
   - ❌ `.text-sm.absolute.top-2.right-2` (utility classes change)

3. **Be specific but not fragile**
   - ✅ `.contact-form .submit-btn`
   - ❌ `body > div:nth-child(3) > form > button:nth-of-type(2)`

4. **Leverage ARIA attributes**
   - ✅ `button[aria-haspopup="dialog"]`
   - ✅ `[role="menuitem"]`
   - ✅ `input[aria-invalid="true"]`

5. **Consider viewport context**
   - Mobile: `.mobile-menu-toggle` or `.hamburger-btn`
   - Desktop: `.desktop-nav a` or `.main-nav .nav-link`

### Interactive Testing Workflow

When building UI that needs interactive testing:

```
1. Design component
   ↓
2. Add semantic HTML + ARIA attributes
   ↓
3. Add targetable classes/IDs
   ↓
4. Build functionality
   ↓
5. Test with uisentinel interactive capture
   ↓
6. If selector fails → Improve element identification
   ↓
7. Re-test until stable
```

### Example: Building a Testable Modal

```jsx
// ✅ GOOD - Easy to target, accessible, semantic
function ContactModal({ isOpen, onClose }) {
  return (
    <div 
      className={`modal-overlay ${isOpen ? 'active' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <div className="modal-content">
        <button 
          className="modal-close"
          onClick={onClose}
          aria-label="Close contact form"
        >
          ×
        </button>
        
        <h2 id="contact-modal-title" className="modal-title">
          Contact Us
        </h2>
        
        <form className="contact-form" onSubmit={handleSubmit}>
          <input 
            id="contact-email"
            type="email"
            className="form-input"
            aria-label="Email address"
            required
          />
          <button 
            type="submit"
            className="submit-btn"
            aria-label="Send message"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

// Test with:
// --click "button[aria-haspopup='dialog']"  (to open)
// --click ".modal-close"                     (to close)
// --click ".contact-form .submit-btn"        (to submit)
```

---

## 🔄 Standard UI Development Workflow

### Workflow Steps

```
1. Receive UI task
   ↓
2. Generate/modify code with targetable elements
   - Add semantic HTML
   - Add clear classes/IDs for interactive elements
   - Include ARIA attributes
   ↓
3. RUN: npm run validate:ui (static validation)
   ↓
4. Is component interactive? (modal, dropdown, tooltip, etc.)
   ├─ YES → RUN: Interactive capture with actions
   │         npx uisentinel capture --name X --click Y --a11y
   └─ NO → Continue to step 5
   ↓
5. Review validation output + screenshots
   ↓
6. Are there issues (technical OR visual)?
   ├─ YES → Fix issues → Go to step 3
   └─ NO → Task complete ✅
```

### Example Workflow 1: Static Component

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

**Reviewing captured screenshots...**

**Mobile Screenshot Analysis** (`mobile_1234567890.png`):
- Hero section spans full width but text is cut off on right edge
- CTA button appears very light blue, barely visible against background
- Navigation menu is compressed, hard to read
- Overall layout functional but needs contrast and spacing fixes

**Desktop Screenshot Analysis** (`desktop_1234567890.png`):
- Hero section well-proportioned, good use of whitespace
- CTA button contrast issue visible here too
- Text hierarchy clear and readable
- Layout appears professional and clean

Applying fixes based on technical report + visual analysis...

✓ Changed button background to #2563eb (now 7.2:1 contrast ratio)
✓ Added aria-label="Hero background" to image
✓ Added responsive CSS: max-width: 100%; padding: 1rem;

Re-validating and capturing new screenshots...

$ npx uisentinel validate --project . --agent-mode

✅ Validation Results:
  • Accessibility Score: 95/100
  • No CRITICAL or SERIOUS issues
  • No layout overflows
  • All viewports validated

**Final Screenshot Review**:
- **Mobile**: Text now properly contained, button clearly visible with good contrast
- **Desktop**: Maintains professional appearance, improved button visibility
- **Visual Confirmation**: All technical fixes verified visually across viewports

Hero section is complete and accessible!
```

### Example Workflow 2: Interactive Component (NEW!)

**User Request**: "Create a contact modal that opens when clicking 'Contact Us' button"

**Agent Response**:

```markdown
I'll create a contact modal with proper accessibility and interactive testing.

[Generates modal component with targetable elements]

```jsx
function ContactModal() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button 
        className="open-modal-btn"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
      >
        Contact Us
      </button>
      
      <div 
        className={`modal-overlay ${isOpen ? 'active' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-content">
          <button 
            className="modal-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close contact form"
          >
            ×
          </button>
          <h2 id="modal-title">Contact Us</h2>
          <form className="contact-form">
            <input id="email" type="email" required />
            <button type="submit" className="submit-btn">Send</button>
          </form>
        </div>
      </div>
    </>
  );
}
```

✅ Element accessibility added:
- Button has `.open-modal-btn` class for targeting
- Modal has `role="dialog"` and proper ARIA attributes
- Close button has `.modal-close` class and `aria-label`
- Form inputs have IDs for accessibility
- All interactive elements easily targetable

Now validating static state...

$ npx uisentinel validate --project . --agent-mode

✅ Static validation passed (score: 95/100)

Now testing INTERACTIVE state (modal open)...

$ npx uisentinel capture \
  --url http://localhost:3000 \
  --name modal_open \
  --description "Contact modal accessibility when opened" \
  --click ".open-modal-btn" \
  --wait 500 \
  --a11y

⚠️ Interactive validation found issues:

1. [SERIOUS] Modal description text has low contrast (1.8:1)
   - Fix: Change color from #cbd5e0 to #4a5568

2. [MODERATE] Close button too small for touch (32x32px)
   - Fix: Increase to minimum 44x44px

3. [MODERATE] No focus trap - users can tab outside modal
   - Fix: Implement keyboard trap

**Screenshots Analysis**:
- **Mobile**: Modal displays but close button barely visible, text hard to read
- **Desktop**: Modal centered properly but contrast issues evident

Applying fixes...

✓ Fixed text contrast (#4a5568)
✓ Increased close button size to 44x44px
✓ Added keyboard focus trap
✓ Added ESC key handler

Re-testing interactive state...

$ npx uisentinel capture \
  --url http://localhost:3000 \
  --name modal_open_fixed \
  --description "Contact modal - all issues fixed" \
  --click ".open-modal-btn" \
  --wait 500 \
  --a11y

✅ Interactive validation results:
  • Accessibility Score: 100/100
  • No violations in open state
  • All touch targets adequate
  • Keyboard navigation working

**Final Screenshots**:
- **Mobile**: Modal clearly visible, text readable, close button adequate size
- **Desktop**: Professional appearance, perfect contrast, accessible

📄 Generated report: `modal_open_fixed.md` with:
- Test description
- Actions performed (click .open-modal-btn, wait 500ms)
- Accessibility score (100/100)
- Screenshots embedded

Contact modal is complete and fully accessible in both states!
```

**Key Differences from Static Testing**:
1. ✅ Used `--click` to interact with button before capture
2. ✅ Added `--wait` to allow modal animation to complete
3. ✅ Generated named report (`modal_open_fixed.md`) documenting the test
4. ✅ Validated accessibility in the OPEN state (the state users interact with)
5. ✅ Ensured all interactive elements were targetable with clear selectors

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

### Static Validation
- [ ] **Elements targetable**: All interactive elements have clear classes/IDs/ARIA
- [ ] **Semantic HTML**: Proper element types (button, nav, form, etc.)
- [ ] **Visual validation ran**: `npm run validate:ui` executed
- [ ] **Accessibility score**: >= 90/100
- [ ] **Critical issues**: 0 CRITICAL violations
- [ ] **Serious issues**: 0 SERIOUS violations
- [ ] **Layout issues**: No overflows on any viewport
- [ ] **Responsive design**: Tested on mobile (375px), tablet (768px), desktop (1920px)

### Interactive Validation (if applicable)
- [ ] **Interactive testing completed**: For modals, dropdowns, tooltips, etc.
- [ ] **Actions work**: Click, hover, scroll actions execute successfully
- [ ] **Selectors stable**: Elements targeted with semantic, maintainable selectors
- [ ] **Interactive state validated**: Accessibility checked in open/active/hover states
- [ ] **Markdown report generated**: `{name}.md` created with test documentation

### Screenshot Analysis
- [ ] **Screenshots captured**: Visual evidence saved for all states
- [ ] **Images analyzed**: Screenshots reviewed and described
- [ ] **Responsive compatibility verified**: Checked across all viewports
- [ ] **Responsive issues identified**: Breakpoint problems documented
- [ ] **Visual issues addressed**: ALL screenshot problems fixed
- [ ] **Responsive issues fixed**: ALL compatibility problems resolved

### Final Verification
- [ ] **Re-validation passed**: After fixing issues (both static AND interactive)
- [ ] **All states tested**: Closed, open, hover, focus, error states as applicable

## 📸 Screenshot Analysis & Documentation

### Mandatory Image Review Process

**CRITICAL**: After every UI validation, you MUST:

1. **Capture Screenshots**: Use uisentinel to generate screenshots
2. **Read Screenshots**: Analyze the captured images visually
3. **Document Findings**: Describe what you see in the screenshots
4. **Compare Across Viewports**: Note differences between mobile/desktop
5. **Fix Visual Issues**: Address ANY problems found in screenshots - this is mandatory

### How to Read Captured Screenshots

#### 1. **Screenshot Files Are Listed in validation-report.json**
The validation report contains screenshot paths for each viewport:
```json
"screenshots": [
  {
    "viewport": "mobile",
    "path": "/path/to/mobile_timestamp.png",
    "width": 375, "height": 667
  },
  {
    "viewport": "desktop", 
    "path": "/path/to/desktop_timestamp.png",
    "width": 1920, "height": 1080
  }
]
```

#### 2. **Analyze Each Screenshot**
For each captured image, document:
- **Layout Quality**: Is content properly arranged?
- **Visual Hierarchy**: Does the design guide user attention correctly?
- **Responsive Behavior**: How does content adapt across screen sizes?
- **Accessibility Visual Cues**: Are interactive elements clearly visible?
- **Content Overflow**: Is all content contained within viewport?
- **Responsive Compatibility**: Does layout work across all viewport sizes without breaking?

#### 3. **Simplified Screenshot Documentation**
```markdown
## Screenshot Analysis

### Mobile (375px)
**Observations**:
- Layout: [Describe layout structure]
- Usability: [Button sizes, readability, navigation]
- Issues: [List any problems found]

### Desktop (1920px)
**Observations**:
- Layout: [Describe layout structure] 
- Usability: [Text hierarchy, spacing, interaction elements]
- Issues: [List any problems found]
```

#### 4. **Common Visual Issues to Check**

**IMPORTANT**: These visual issues have the same priority as technical validation issues and MUST be fixed:

**Layout Problems** (CRITICAL):
- Content cutoff or overflow
- Elements overlapping
- Inconsistent spacing
- Broken grid systems

**Typography Issues** (HIGH):
- Text too small to read
- Poor line height
- Insufficient contrast visible in screenshots
- Text wrapping problems

**Interactive Elements** (HIGH):
- Buttons too small for touch
- Links not visually distinct
- Form fields hard to identify
- Navigation unclear

**Responsive Design** (CRITICAL):
- Content doesn't scale properly
- Images distorted or pixelated
- Horizontal scrolling on mobile
- Elements bunched together

**Responsive Compatibility Issues** (CRITICAL):
- Layout breaks at specific breakpoints
- Navigation unusable on mobile
- Touch targets too small (< 44x44px)
- Content hidden or inaccessible on smaller screens
- Fixed width elements causing horizontal scroll
- Text not readable on mobile (too small)
- Images not adapting to viewport size

**Visual Issue Resolution Priority**:
1. **CRITICAL**: Layout breaks, content overflow, broken responsive design, responsive compatibility failures
2. **HIGH**: Typography problems, interaction issues, touch target sizing
3. **MODERATE**: Minor spacing, visual hierarchy improvements

### 5. **Simplified Screenshot Review Steps**

```markdown
Before marking any UI task complete:

1. ✅ Check validation-report.json for screenshot paths
2. ✅ Review mobile screenshot - describe layout and usability
3. ✅ Review desktop screenshot - confirm functionality
4. ✅ **VERIFY RESPONSIVE COMPATIBILITY** - Compare viewports side-by-side
5. ✅ Identify responsive issues - document breakpoint problems
6. ✅ Document visual findings in task completion
7. ✅ **MANDATORY**: Fix ANY visual issues discovered in screenshots
8. ✅ **MANDATORY**: Fix ALL responsive compatibility issues
9. ✅ Re-validate and review new screenshots to confirm fixes
```

### 6. **Responsive Compatibility Verification**

**CRITICAL**: You MUST verify and fix responsive design issues across viewports.

**What to Check**:
- [ ] **Mobile (375px)**: Navigation works, content readable, no horizontal scroll
- [ ] **Tablet (768px)**: Layout transitions properly, touch targets adequate
- [ ] **Desktop (1920px)**: Content properly centered/maxed, whitespace balanced
- [ ] **Breakpoint Transitions**: Smooth transitions between viewport sizes
- [ ] **Touch Targets**: All interactive elements >= 44x44px on mobile
- [ ] **Text Scaling**: Text readable at all sizes (min 16px body on mobile)
- [ ] **Image Responsiveness**: Images scale properly, maintain aspect ratio
- [ ] **Navigation Pattern**: Appropriate for each viewport (hamburger on mobile, etc.)

**Common Responsive Issues to Fix**:
1. **Fixed widths causing overflow**: Replace with `max-width: 100%`
2. **Text too small on mobile**: Increase font-size for mobile viewport
3. **Buttons too small for touch**: Ensure min 44x44px hit areas
4. **Navigation hidden on mobile**: Implement mobile-friendly navigation
5. **Tables not responsive**: Use card layout or horizontal scroll indicators
6. **Images breaking layout**: Add `max-width: 100%; height: auto;`
7. **Content not centered on large screens**: Add `max-width` container

**CRITICAL RULE**: If screenshots reveal ANY visual problems (layout issues, poor contrast, broken responsive design, compatibility failures, etc.), these MUST be fixed before task completion, regardless of technical validation scores.

### Template Response

```markdown
✅ Task Complete: [Task Name]

Validation Results:
• Accessibility Score: XX/100
• Issues Fixed: X
• Viewports Tested: Mobile, Tablet, Desktop
• Screenshots: [links to screenshots]

**Screenshot Analysis Summary:**
• Mobile (375px): [Brief description of mobile layout and any issues]
• Desktop (1920px): [Brief description of desktop layout quality]
• Visual Issues Found: [List any visual problems discovered]
• Visual Issues Fixed: [List fixes applied based on screenshot review]

**Responsive Compatibility Assessment:**
• Breakpoint Transitions: [Smooth/Issues found]
• Mobile Navigation: [Working/Fixed]
• Touch Targets: [All adequate/Fixed undersized elements]
• Content Scaling: [Proper/Issues resolved]
• Responsive Issues Found: [List compatibility problems]
• Responsive Issues Fixed: [List fixes applied]

Final Status: All checks passed ✅
```

### Enhanced Workflow with Screenshot Analysis

```
1. Receive UI task
   ↓
2. Generate/modify code
   ↓
3. RUN: npm run validate:ui
   ↓
4. Review accessibility/layout report
   ↓
5. READ & ANALYZE captured screenshots
   ↓
6. Document visual findings
   ↓
7. Are there technical OR visual issues?
   ├─ YES → Fix ALL issues (technical + visual) → Go to step 3
   └─ NO → Task complete ✅
```

**Critical Addition**: Step 5 (screenshot analysis) is now mandatory and must be documented in your response.

**New Rule**: Visual issues found in screenshots have equal priority to technical validation issues and MUST be fixed.

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

### Reading Screenshot Files

Screenshots paths are automatically included in `validation-report.json`:

```json
"screenshots": [
  {
    "viewport": "mobile",
    "path": "/Users/.../mobile_1759305896208.png", 
    "width": 375, "height": 667
  },
  {
    "viewport": "desktop",
    "path": "/Users/.../desktop_1759305897212.png",
    "width": 1920, "height": 1080  
  }
]
```

**No need to manually locate files** - the validation report provides exact paths.

### Accessing Screenshots

```bash
# Open screenshots for visual inspection (macOS)
open ./uisentinel-output/screenshots/

# Copy screenshots to accessible location if needed
cp ./uisentinel-output/screenshots/*.png ./public/screenshots/
```

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

1. **Always add targetable elements** - Use semantic HTML, clear classes, ARIA attributes
2. **Always validate after UI changes** - Both static AND interactive states
3. **Test interactive components** - Use interactive capture for modals, dropdowns, etc.
4. **READ and ANALYZE captured screenshots** - Never skip visual review
5. **Fix ALL visual issues found in screenshots** - This is mandatory
6. **Fix CRITICAL technical issues first**
7. **Test on multiple viewports** - Mobile, tablet, desktop
8. **Document visual findings** from screenshot analysis
9. **Re-validate AND re-screenshot after fixes**
10. **Keep accessibility score >= 90** in all states
11. **Compare before/after screenshots** when fixing issues
12. **Verify visual fixes match technical fixes**
13. **Generate markdown reports** for interactive tests (--name parameter)
14. **Use stable selectors** - Prefer semantic over positional selectors
15. **Document what you fixed**

### DON'T ❌

1. **Never skip element accessibility** - All interactive elements must be targetable
2. **Never use fragile selectors** - Avoid nth-child, deeply nested paths
3. **Never skip validation** ("it looks fine in the code")
4. **Never test only static state** - Interactive components need interactive testing
5. **Never ignore captured screenshots** - Always analyze them visually
6. **Never ignore visual issues found in screenshots** - They must be fixed
7. **Don't ignore SERIOUS technical issues**
8. **Don't assume mobile works** (always test AND screenshot)
9. **Don't forget to re-validate AND re-screenshot** after fixes
10. **Don't mark complete with score < 90** in any state
11. **Don't rely solely on technical reports** - Visual confirmation is required
12. **Don't skip cross-viewport comparison** of screenshots
13. **Don't complete tasks with unresolved visual problems**
14. **Don't overuse IDs** - Use classes for reusable components
15. **Don't skip interactive testing** for dynamic components

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

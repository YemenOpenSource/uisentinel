---
description: UI/UX Development with Visual Validation - Instructions for GitHub Copilot Agents
---

# UI/UX Development Agent Instructions

**Purpose**: These instructions establish standardized procedures for UI/UX development that incorporate visual validation, accessibility compliance, and responsive design testing.

## Core Development Principle

**Visual validation is mandatory for all UI development tasks.**

When developing or modifying user interfaces, adhere to the following workflow:
1. Generate or modify code implementation
2. Execute visual validation using UIsentinel
3. Address all identified issues (technical and visual)
4. Re-validate to confirm resolution
5. Complete task only after validation passes

**Critical Requirement**: Visual defects identified in screenshots must be corrected regardless of technical validation scores.

---

## Standard UI Development Workflow

### Workflow Steps

```
1. Receive UI task request
   ↓
2. Generate/modify code implementation
   ↓
3. Execute UIsentinel validation tools
   ↓
4. Review validation output and screenshots
   ↓
5. Issues identified?
   ├─ YES → Apply corrections → Return to step 3
   └─ NO → Task complete ✅
```

---

## UIsentinel CLI Reference

### Command Overview

```bash
Usage: uisentinel [options] [command]

Visual validation toolkit for AI coding agents

Options:
  -V, --version           Output the version number
  -h, --help              Display help for command

Commands:
  capture [options]       Capture screenshots and run validation
  validate [options]      Validate entire project
  diff [options]          Compare screenshots for visual regression
  agent-report [options]  Generate agent-friendly validation report
  init                    Initialize uisentinel configuration
  help [command]          Display help for command
```

### Capture Command

```bash
Usage: uisentinel capture [options]

Capture screenshots and run validation

Options:
  -u, --url <url>              URL to capture (default: "http://localhost:3000")
  -v, --viewports <viewports>  Viewports (comma-separated) (default: "mobile,desktop")
  --a11y                       Run accessibility checks (default: false)
  --layout                     Run layout analysis (default: true)
  --full-page                  Capture full page (default: true)
  --open                       Open screenshots after capture (default: false)
  -o, --output <dir>           Output directory (default: "./uisentinel-output")
  --name <name>                Snake_case name for output files (e.g., mobile_menu_open)
  --description <desc>         Description of what you are testing
  --click <selector>           Click element before capture
  --hover <selector>           Hover element before capture
  --fill <selector:value>      Fill input before capture (format: selector:value)
  --scroll-to <selector>       Scroll to element before capture
  --wait <ms>                  Wait duration in ms before capture
  --actions <json>             JSON array of actions to execute
  -h, --help                   Display help for command
```

### Validate Command

```bash
Usage: uisentinel validate [options]

Validate entire project

Options:
  -p, --project <path>   Project path (default: ".")
  -r, --routes <routes>  Routes to validate (comma-separated) (default: "/")
  -o, --output <dir>     Output directory (default: "./uisentinel-output")
  --agent-mode           Output in agent-friendly format (default: false)
  -h, --help             Display help for command
```

### Diff Command

```bash
Usage: uisentinel diff [options]

Compare screenshots for visual regression

Options:
  -b, --baseline <path>      Baseline image path
  -c, --current <path>       Current image path
  -t, --threshold <percent>  Difference threshold (%) (default: "5")
  -o, --output <dir>         Output directory (default: "./uisentinel-output")
  -h, --help                 display help for command
```

### Agent Report Command

```bash
Usage: uisentinel agent-report [options]

Generate agent-friendly validation report

Options:
  -p, --project <path>   Project path (default: ".")
  -r, --routes <routes>  Routes to validate (comma-separated) (default: "/")
  -f, --focus <areas>    Focus areas (comma-separated) (default: "accessibility,layout")
  -o, --output <file>    Output file
  -h, --help             Display help for command
```

---

## Available Scripts & Commands

### Quick Reference

```bash
# Full project validation (recommended for most use cases)
npm run validate:ui

# Quick accessibility check for a single page
npm run validate:quick

# Visual regression test
npm run validate:regression

# Generate detailed report
npm run validate:report

# Interactive capture - test dynamic UI states
npx uisentinel capture --url http://localhost:3000 \
  --name modal_open \
  --description "Testing modal accessibility" \
  --click "#open-modal" \
  --wait 500 \
  --a11y
```

### Detailed Command Usage

#### 1. Full Project Validation (Recommended)

```bash
npx uisentinel validate --project . --agent-mode
```

**Use case**: Post-implementation validation for any UI component
**Capabilities**:
- Framework auto-detection (Next.js, Vite, React, etc.)
- Automatic dev server initialization
- Multi-viewport screenshot capture (mobile, tablet, desktop)
- WCAG 2.1 AA accessibility compliance checking
- Layout overflow and positioning analysis
- Structured reporting with actionable recommendations

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

#### 2. Quick Accessibility Check

```bash
npx uisentinel capture --url http://localhost:3000 --a11y
```

**Use case**: Rapid accessibility audit during development iteration
**Capabilities**: Streamlined accessibility assessment without comprehensive validation

#### 3. Multi-Page Validation

```bash
npx uisentinel validate --project . --routes /,/about,/contact,/products
```

**Use case**: Comprehensive validation across multiple application routes

#### 4. Custom Viewport Testing

```bash
npx uisentinel capture --url http://localhost:3000 --viewports mobile,tablet,desktop
```

**Use case**: Targeted responsive design testing for specific viewport combinations

#### 5. Visual Regression Testing

```bash
npx uisentinel diff --baseline ./baselines/homepage.png --current ./screenshots/current.png
```

**Use case**: Detection of unintended visual modifications between versions

#### 6. Agent Report Generation

```bash
npx uisentinel agent-report --project . --focus accessibility,layout --output report.md
```

**Use case**: Comprehensive documentation and review reporting

#### 7. Interactive Capture - Dynamic UI State Testing

```bash
# Single action
npx uisentinel capture \
  --url http://localhost:3000 \
  --name modal_open \
  --description "Test modal accessibility when opened" \
  --click "#open-modal-btn" \
  --wait 500 \
  --a11y

# Multiple actions
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

**Use case**: Testing interactive components (modals, dropdowns, tooltips, hover states, form validations)
**Capabilities**:
- Browser interaction execution (click, hover, scroll, type, wait)
- Post-interaction screenshot capture
- Accessibility validation in interactive states
- Automated markdown report generation with test documentation

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

## Element Accessibility for Interactive Testing

### Critical Requirement: Interactive Element Targeting

All interactive UI components must be designed with clear, semantic selectors to enable automated testing.

### Element Identification Strategy

**Priority Order for Selectors:**

1. **Semantic HTML + ARIA** (Best - Universally accessible)
   ```html
   <button aria-label="Open modal">Get Started</button>
   <!-- Target: button[aria-label="Open modal"] -->

   <nav aria-label="Main navigation">...</nav>
   <!-- Target: nav[aria-label="Main navigation"] -->
   ```

2. **Classes** (Good - Reusable and semantic)
   ```html
   <button class="open-modal-btn">Click Me</button>
   <!-- Target: .open-modal-btn -->

   <div class="dropdown-menu">...</div>
   <!-- Target: .dropdown-menu -->
   ```

3. **IDs** (Use sparingly - unique components only)
   ```html
   <div id="contact-modal">...</div>
   <!-- Target: #contact-modal -->

   <button id="submit-form">Submit</button>
   <!-- Target: #submit-form -->
   ```

4. **Data Attributes** (Good - Testing-specific, styling-independent)
   ```html
   <button data-testid="modal-trigger">Open</button>
   <!-- Target: [data-testid="modal-trigger"] -->
   ```

### Recommended Practices

```html
<!-- Correct: Clear, semantic, targetable -->
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

### Practices to Avoid

```html
<!-- Incorrect: Non-semantic, difficult to target -->
<div onclick="openModal()">
  <span>Click Me</span>
</div>

<div class="x">×</div> <!-- No semantic meaning -->

<div class="btn">Submit</div> <!-- Should be <button> -->

<a href="#">Menu</a> <!-- Links without proper href or role -->
```

**Issues**:
- Non-semantic elements complicate targeting
- Missing ARIA labels impede automation
- Generic class names create ambiguity
- Absence of proper roles and semantics

### Best Practices for Interactive UI Components

#### 1. Modals & Dialogs
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

#### 2. Dropdowns & Menus
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

#### 3. Tooltips & Popovers
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

#### 4. Form Validations
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

### Selector Selection Guidelines

When implementing selectors for interactive testing:

1. **Prioritize semantic meaning over structural positioning**
   - ✅ `button[aria-label="Close modal"]`
   - ❌ `.modal > div > div > span:last-child`

2. **Use stable identifiers**
   - ✅ `.modal-close` (explicit functional class)
   - ❌ `.text-sm.absolute.top-2.right-2` (utility classes subject to change)

3. **Maintain specificity without fragility**
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

```
1. Design component architecture
   ↓
2. Implement semantic HTML + ARIA attributes
   ↓
3. Add targetable classes/IDs
   ↓
4. Develop functionality
   ↓
5. Execute UIsentinel interactive capture
   ↓
6. Selector failure? → Improve element identification
   ↓
7. Re-test until stable
```

### Example: Testable Modal Implementation

```jsx
// Correct implementation - Accessible, semantic, easily targetable
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

// Test commands:
// --click "button[aria-haspopup='dialog']"  (to open)
// --click ".modal-close"                     (to close)
// --click ".contact-form .submit-btn"        (to submit)
```

---

## Enhanced UI Development Workflow

### Comprehensive Workflow Steps

```
1. Receive UI task request
   ↓
2. Generate/modify code with targetable elements
   - Implement semantic HTML
   - Add clear classes/IDs for interactive elements
   - Include ARIA attributes
   ↓
3. EXECUTE: npm run validate:ui (static validation)
   ↓
4. Component contains interactive elements?
   ├─ YES → EXECUTE: Interactive capture with actions
   │         npx uisentinel capture --name X --click Y --a11y
   └─ NO → Proceed to step 5
   ↓
5. Review validation output + screenshot analysis
   ↓
6. Issues identified (technical OR visual)?
   ├─ YES → Apply corrections → Return to step 3
   └─ NO → Task complete ✅
```

### Example Workflow 1: Static Component Implementation

**User Request**: "Create a hero section with a CTA button"

**Agent Response**:

```markdown
Implementing hero section with CTA button...

[Code generation for hero section with CTA button]

Executing UI validation...

$ npx uisentinel validate --project . --agent-mode

⚠️ Validation identified 3 issues:

1. [SERIOUS] CTA button - Insufficient color contrast
   - Current: 3.1:1 ratio
   - Required: 4.5:1 ratio (WCAG AA)
   - Recommendation: Change background from #60a5fa to #2563eb

2. [MODERATE] Hero section - Missing alt text on background image
   - Recommendation: Add aria-label or implement CSS background

3. [WARNING] Mobile viewport (375px) - Hero text overflow: 24px
   - Recommendation: Add responsive padding and max-width

**Screenshot Analysis:**

**Mobile Screenshot** (`mobile_1234567890.png`):
- Hero section spans full width with right-edge text truncation
- CTA button exhibits low contrast, minimal visibility against background
- Navigation menu compressed, reduced readability
- Layout functional but requires contrast and spacing corrections

**Desktop Screenshot** (`desktop_1234567890.png`):
- Hero section well-proportioned with appropriate whitespace
- CTA button contrast issue persists
- Text hierarchy clear and readable
- Layout professional and clean

Applying corrections based on validation report and visual analysis...

✓ Modified button background to #2563eb (7.2:1 contrast ratio)
✓ Added aria-label="Hero background" to image
✓ Implemented responsive CSS: max-width: 100%; padding: 1rem;

Executing re-validation and screenshot capture...

$ npx uisentinel validate --project . --agent-mode

✅ Validation Results:
  • Accessibility Score: 95/100
  • No CRITICAL or SERIOUS issues
  • No layout overflows
  • All viewports validated

**Final Screenshot Review**:
- **Mobile**: Text properly contained, button clearly visible with good contrast
- **Desktop**: Professional appearance maintained, improved button visibility
- **Visual Confirmation**: All technical corrections verified visually across viewports

Hero section implementation complete and accessible.
```

### Example Workflow 2: Interactive Component Implementation

**User Request**: "Create a contact modal that opens when clicking 'Contact Us' button"

**Agent Response**:

```markdown
Implementing contact modal with accessibility features and interactive testing capabilities...

[Modal component code generation with targetable elements]

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

✅ Element accessibility implemented:
- Button: `.open-modal-btn` class for targeting
- Modal: `role="dialog"` with proper ARIA attributes
- Close button: `.modal-close` class with `aria-label`
- Form inputs: IDs for accessibility
- All interactive elements easily targetable

Executing static state validation...

$ npx uisentinel validate --project . --agent-mode

✅ Static validation passed (score: 95/100)

Executing interactive state validation (modal open)...

$ npx uisentinel capture \
  --url http://localhost:3000 \
  --name modal_open \
  --description "Contact modal accessibility when opened" \
  --click ".open-modal-btn" \
  --wait 500 \
  --a11y

⚠️ Interactive validation identified issues:

1. [SERIOUS] Modal description text - Low contrast (1.8:1)
   - Recommendation: Change color from #cbd5e0 to #4a5568

2. [MODERATE] Close button - Insufficient touch target size (32x32px)
   - Recommendation: Increase to minimum 44x44px

3. [MODERATE] Missing focus trap - Tab navigation exits modal
   - Recommendation: Implement keyboard focus containment

**Screenshot Analysis**:
- **Mobile**: Modal displays but close button barely visible, text readability compromised
- **Desktop**: Modal properly centered but contrast issues evident

Applying corrections...

✓ Modified text contrast (#4a5568)
✓ Increased close button size to 44x44px
✓ Implemented keyboard focus trap
✓ Added ESC key handler

Executing interactive state re-validation...

$ npx uisentinel capture \
  --url http://localhost:3000 \
  --name modal_open_fixed \
  --description "Contact modal - all issues resolved" \
  --click ".open-modal-btn" \
  --wait 500 \
  --a11y

✅ Interactive validation results:
  • Accessibility Score: 100/100
  • No violations in open state
  • All touch targets adequate
  • Keyboard navigation functional

**Final Screenshot Review**:
- **Mobile**: Modal clearly visible, text readable, close button adequate size
- **Desktop**: Professional appearance, optimal contrast, fully accessible

📄 Generated report: `modal_open_fixed.md` containing:
- Test description
- Actions performed (click .open-modal-btn, wait 500ms)
- Accessibility score (100/100)
- Embedded screenshots

Contact modal implementation complete and fully accessible in all states.
```

**Key Distinctions from Static Testing**:
1. ✅ Utilized `--click` to interact with button before capture
2. ✅ Implemented `--wait` to accommodate modal animation
3. ✅ Generated named report (`modal_open_fixed.md`) documenting test execution
4. ✅ Validated accessibility in interactive (open) state
5. ✅ Verified all interactive elements targetable with clear selectors

---

## Validation Output Interpretation

### Issue Priority Classification

| Priority | Action Required | Examples |
|----------|----------------|----------|
| **CRITICAL** | Fix immediately, blocks completion | Missing form labels, broken navigation |
| **SERIOUS** | Fix before proceeding | Insufficient color contrast, missing alt text |
| **MODERATE** | Fix if time permits | Minor ARIA improvements |
| **MINOR** | Document for future iteration | Enhancement opportunities |

### Accessibility Score Guidelines

- **90-100**: ✅ Excellent - Production ready
- **80-89**: ⚠️ Good - Resolve SERIOUS issues
- **70-79**: ⚠️ Needs improvement - Address multiple issues
- **Below 70**: ❌ Poor - Major accessibility deficiencies

### Common Issues & Resolutions

#### Color Contrast

**Issue**: Button color contrast 3.1:1, requires 4.5:1

**Resolution**:
```css
/* Before */
.button { background: #60a5fa; color: white; }

/* After */
.button { background: #2563eb; color: white; } /* 7.2:1 ratio */
```

#### Missing Alt Text

**Issue**: Images missing alt attributes

**Resolution**:
```html
<!-- Before -->
<img src="hero.jpg">

<!-- After -->
<img src="hero.jpg" alt="Team collaborating on project">
```

#### Mobile Overflow

**Issue**: Element overflows container by 45px on mobile

**Resolution**:
```css
/* Add responsive constraints */
.hero-image {
  max-width: 100%;
  height: auto;
}
```

#### Missing Form Labels

**Issue**: Input fields lack proper labels

**Resolution**:
```html
<!-- Before -->
<input type="email" placeholder="Email">

<!-- After -->
<label for="email">Email address</label>
<input id="email" type="email" placeholder="Enter your email">
```

---

## Task Completion Checklist

Before marking any UI task as complete, verify:

### Static Validation
- [ ] **Elements targetable**: All interactive elements have clear classes/IDs/ARIA
- [ ] **Semantic HTML**: Proper element types (button, nav, form, etc.)
- [ ] **Visual validation executed**: `npm run validate:ui` completed
- [ ] **Accessibility score**: >= 90/100
- [ ] **Critical issues**: 0 CRITICAL violations
- [ ] **Serious issues**: 0 SERIOUS violations
- [ ] **Layout issues**: No overflows on any viewport
- [ ] **Responsive design**: Tested on mobile (375px), tablet (768px), desktop (1920px)

### Interactive Validation (when applicable)
- [ ] **Interactive testing completed**: For modals, dropdowns, tooltips, etc.
- [ ] **Actions execute successfully**: Click, hover, scroll actions work
- [ ] **Selectors stable**: Elements targeted with semantic, maintainable selectors
- [ ] **Interactive state validated**: Accessibility checked in open/active/hover states
- [ ] **Markdown report generated**: `{name}.md` created with test documentation

### Screenshot Analysis
- [ ] **Screenshots captured**: Visual evidence saved for all states
- [ ] **Images analyzed**: Screenshots reviewed and described
- [ ] **Responsive compatibility verified**: Checked across all viewports
- [ ] **Responsive issues identified**: Breakpoint problems documented
- [ ] **Visual issues addressed**: ALL screenshot problems corrected
- [ ] **Responsive issues resolved**: ALL compatibility problems fixed

### Final Verification
- [ ] **Re-validation passed**: After fixing issues (both static AND interactive)
- [ ] **All states tested**: Closed, open, hover, focus, error states as applicable

## Screenshot Analysis & Documentation

### Mandatory Image Review Process

**Critical Requirement**: After every UI validation:

1. **Capture Screenshots**: Execute UIsentinel to generate screenshots
2. **Read Screenshots**: Analyze captured images visually
3. **Document Findings**: Describe observations from screenshots
4. **Compare Across Viewports**: Note differences between mobile/desktop
5. **Fix Visual Issues**: Address ANY problems found in screenshots - mandatory step

### Screenshot File Location

#### Validation Report Contains Screenshot Paths
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

#### Screenshot Analysis Requirements

For each captured image, document:
- **Layout Quality**: Content arrangement and organization
- **Visual Hierarchy**: Design guidance for user attention
- **Responsive Behavior**: Content adaptation across screen sizes
- **Accessibility Visual Cues**: Interactive element visibility
- **Content Overflow**: Viewport containment verification
- **Responsive Compatibility**: Layout integrity across viewport sizes

#### Documentation Template

```markdown
## Screenshot Analysis

### Mobile (375px)
**Observations**:
- Layout: [Describe layout structure]
- Usability: [Button sizes, readability, navigation]
- Issues: [List any problems identified]

### Desktop (1920px)
**Observations**:
- Layout: [Describe layout structure]
- Usability: [Text hierarchy, spacing, interaction elements]
- Issues: [List any problems identified]
```

#### Common Visual Issues Requiring Correction

**Important**: Visual issues have equivalent priority to technical validation issues and must be corrected.

**Layout Problems** (CRITICAL):
- Content cutoff or overflow
- Element overlap
- Inconsistent spacing
- Grid system failures

**Typography Issues** (HIGH):
- Text too small for readability
- Poor line height
- Insufficient contrast visible in screenshots
- Text wrapping problems

**Interactive Elements** (HIGH):
- Touch targets too small
- Links not visually distinct
- Form fields difficult to identify
- Navigation unclear

**Responsive Design** (CRITICAL):
- Content scaling failures
- Image distortion or pixelation
- Horizontal scrolling on mobile
- Element compression

**Responsive Compatibility Issues** (CRITICAL):
- Layout breaks at specific breakpoints
- Navigation unusable on mobile
- Touch targets insufficient (< 44x44px)
- Content hidden or inaccessible on smaller screens
- Fixed width elements causing horizontal scroll
- Text unreadable on mobile devices
- Images not adapting to viewport size

**Visual Issue Resolution Priority**:
1. **CRITICAL**: Layout breaks, content overflow, broken responsive design, compatibility failures
2. **HIGH**: Typography problems, interaction issues, touch target sizing
3. **MODERATE**: Minor spacing, visual hierarchy improvements

### Screenshot Review Process

```markdown
Before completing any UI task:

1. ✅ Check validation-report.json for screenshot paths
2. ✅ Review mobile screenshot - describe layout and usability
3. ✅ Review desktop screenshot - confirm functionality
4. ✅ **VERIFY RESPONSIVE COMPATIBILITY** - Compare viewports
5. ✅ Identify responsive issues - document breakpoint problems
6. ✅ Document visual findings in task completion
7. ✅ **MANDATORY**: Correct ANY visual issues discovered
8. ✅ **MANDATORY**: Resolve ALL responsive compatibility issues
9. ✅ Re-validate and review new screenshots to confirm corrections
```

### Responsive Compatibility Verification

**Critical Requirement**: Verify and correct responsive design issues across all viewports.

**Verification Checklist**:
- [ ] **Mobile (375px)**: Navigation functional, content readable, no horizontal scroll
- [ ] **Tablet (768px)**: Layout transitions properly, touch targets adequate
- [ ] **Desktop (1920px)**: Content properly centered/constrained, whitespace balanced
- [ ] **Breakpoint Transitions**: Smooth transitions between viewport sizes
- [ ] **Touch Targets**: All interactive elements >= 44x44px on mobile
- [ ] **Text Scaling**: Text readable at all sizes (minimum 16px body on mobile)
- [ ] **Image Responsiveness**: Images scale properly, maintain aspect ratio
- [ ] **Navigation Pattern**: Appropriate for each viewport (e.g., hamburger on mobile)

**Common Responsive Issues to Resolve**:
1. **Fixed widths causing overflow**: Replace with `max-width: 100%`
2. **Text too small on mobile**: Increase font-size for mobile viewport
3. **Buttons too small for touch**: Ensure minimum 44x44px hit areas
4. **Navigation hidden on mobile**: Implement mobile-friendly navigation
5. **Tables not responsive**: Use card layout or horizontal scroll indicators
6. **Images breaking layout**: Add `max-width: 100%; height: auto;`
7. **Content not centered on large screens**: Add `max-width` container

**Critical Rule**: Screenshots revealing ANY visual problems (layout issues, poor contrast, broken responsive design, compatibility failures) must be corrected before task completion, regardless of technical validation scores.

### Task Completion Template

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
• Visual Issues Fixed: [List corrections applied based on screenshot review]

**Responsive Compatibility Assessment:**
• Breakpoint Transitions: [Smooth/Issues found]
• Mobile Navigation: [Functional/Fixed]
• Touch Targets: [All adequate/Fixed undersized elements]
• Content Scaling: [Proper/Issues resolved]
• Responsive Issues Found: [List compatibility problems]
• Responsive Issues Fixed: [List corrections applied]

Final Status: All checks passed ✅
```

### Enhanced Workflow with Screenshot Analysis

```
1. Receive UI task request
   ↓
2. Generate/modify code implementation
   ↓
3. EXECUTE: npm run validate:ui
   ↓
4. Review accessibility/layout report
   ↓
5. READ & ANALYZE captured screenshots
   ↓
6. Document visual findings
   ↓
7. Technical OR visual issues identified?
   ├─ YES → Correct ALL issues (technical + visual) → Return to step 3
   └─ NO → Task complete ✅
```

**Critical Addition**: Step 5 (screenshot analysis) is mandatory and must be documented in response.

**New Rule**: Visual issues identified in screenshots have equal priority to technical validation issues and must be corrected.

---

## Error Handling

### Common Issues & Resolutions

#### Issue: "Unable to detect project type"

**Resolution**: Verify location in project root containing `package.json`

```bash
# Verify package.json exists
ls package.json

# Navigate to project root if needed
cd /path/to/project
```

#### Issue: "Port already in use"

**Resolution**: UIsentinel auto-detects available ports; manual specification available:

```bash
npx uisentinel capture --url http://localhost:3001
```

#### Issue: "Server start timeout"

**Resolution**: Verify dev script functionality or increase timeout:

```bash
# Test dev script
npm run dev

# Execute validation
npx uisentinel validate --project .
```

#### Issue: "Screenshots are blank"

**Resolution**: Add wait time for content loading:

```bash
npx uisentinel capture --url http://localhost:3000 --wait-timeout 60000
```

---

## Programmatic Usage

### Reading Screenshot Files

Screenshot paths are automatically included in `validation-report.json`:

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

**Note**: Manual file location unnecessary - validation report provides exact paths.

### Accessing Screenshots

```bash
# Open screenshots for visual inspection (macOS)
open ./uisentinel-output/screenshots/

# Copy screenshots to accessible location
cp ./uisentinel-output/screenshots/*.png ./public/screenshots/
```

### JavaScript API

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

    // Evaluate results
    const hasIssues = results.some(r =>
      r.accessibility && r.accessibility.score < 90
    );

    if (hasIssues) {
      console.log('⚠️ Issues identified - applying corrections...');
      // Apply corrections...
      // Re-validate...
    }

  } finally {
    await nb.close();
  }
}
```

---

## Best Practices

### Recommended Practices

1. **Always add targetable elements** - Use semantic HTML, clear classes, ARIA attributes
2. **Always validate after UI changes** - Both static AND interactive states
3. **Test interactive components** - Use interactive capture for modals, dropdowns, etc.
4. **READ and ANALYZE captured screenshots** - Visual review is mandatory
5. **Fix ALL visual issues found in screenshots** - This is required
6. **Fix CRITICAL technical issues first**
7. **Test on multiple viewports** - Mobile, tablet, desktop
8. **Document visual findings** from screenshot analysis
9. **Re-validate AND re-screenshot after corrections**
10. **Maintain accessibility score >= 90** in all states
11. **Compare before/after screenshots** when fixing issues
12. **Verify visual corrections match technical corrections**
13. **Generate markdown reports** for interactive tests (--name parameter)
14. **Use stable selectors** - Prefer semantic over positional selectors
15. **Document corrections applied**

### Practices to Avoid

1. **Never skip element accessibility** - All interactive elements must be targetable
2. **Never use fragile selectors** - Avoid nth-child, deeply nested paths
3. **Never skip validation** (assumptions about code correctness)
4. **Never test only static state** - Interactive components require interactive testing
5. **Never ignore captured screenshots** - Always analyze visually
6. **Never ignore visual issues in screenshots** - Correction is mandatory
7. **Do not ignore SERIOUS technical issues**
8. **Do not assume mobile compatibility** (always test AND screenshot)
9. **Do not forget to re-validate AND re-screenshot** after corrections
10. **Do not mark complete with score < 90** in any state
11. **Do not rely solely on technical reports** - Visual confirmation required
12. **Do not skip cross-viewport comparison** of screenshots
13. **Do not complete tasks with unresolved visual problems**
14. **Do not overuse IDs** - Use classes for reusable components
15. **Do not skip interactive testing** for dynamic components

---

## Configuration

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
```

---

## Training Examples

### Example 1: Accessible Button Component

**Task**: Create an accessible CTA button

**Implementation**:
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

**Correction**:
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

**Task**: Create mobile-responsive hero section

**Validation Findings**:
- Mobile overflow: 45px
- Tablet: Image aspect ratio distorted

**Corrections Applied**:
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

## Summary

**Core Requirements for UI/UX Development**:

1. 👀 **Visual verification mandatory** - Always capture screenshots
2. ♿ **Accessibility compliance** - Minimum score of 90
3. 📱 **Responsive design testing** - Mobile, tablet, desktop
4. 🔧 **Prompt issue resolution** - Critical → Serious → Moderate
5. ✅ **Completion validation** - Re-verification after corrections

**Primary Command**:
```bash
npx uisentinel validate --project . --agent-mode
```

This is the standard command for all UI development tasks.

---

**Visual validation is non-negotiable for all UI development work.**

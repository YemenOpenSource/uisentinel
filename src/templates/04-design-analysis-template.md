# Design Analysis

**Page/Component:** [What we're analyzing]
**Analysis Date:** [YYYY-MM-DD HH:MM]
**Analyzer:** AI Web Designer Agent
**Status:** [initial | in-progress | complete]

## Executive Summary

**Overall Score:** [X/100]
- Responsive Design: [X/100]
- Mobile UX: [X/100]
- Accessibility: [X/100]
- Visual Design: [X/100]

**Key Findings:**
1. [Finding 1 - most critical]
2. [Finding 2]
3. [Finding 3]

**Recommendation:** [Pass | Needs Minor Fixes | Needs Major Redesign]

---

## Responsive Design Analysis

### Score: [X/100]

#### Media Queries
- **Has Media Queries:** [Yes | No]
- **Approach:** [Mobile-first | Desktop-first | Mixed | None]
- **Breakpoints Found:** [List: 768px, 1024px, ...]
- **Missing Breakpoints:** [List]

**Issues:**
- [ ] **[Priority]** [Issue description]
  - **Selector:** `[CSS selector or location]`
  - **Current:** [What's wrong]
  - **Expected:** [What it should be]
  - **Fix:** [Specific solution]

#### Fixed-Width Elements
- **Critical (exceeds viewport):** [Count]
- **High priority:** [Count]

**Elements List:**
1. **`[selector]`** - [Width: Xpx]
   - **Issue:** [e.g., "1200px container breaks on mobile"]
   - **Fix:** `max-width: 100%; width: auto;`
   - **Screenshot:** `[path]`

#### Layout Types
- **Flexbox:** [Count] layouts
- **Grid:** [Count] layouts
- **Table:** [Count] layouts
- **Non-responsive:** [Count] layouts

**Non-Responsive Layouts:**
1. **`[selector]`**
   - **Type:** [flex | block | table]
   - **Issue:** [e.g., "No flex-wrap, overflows on mobile"]
   - **Fix:** [Solution]

#### CSS Units
- **px:** [X]%
- **%:** [X]%
- **rem/em:** [X]%
- **vw/vh:** [X]%

**Recommendation:** [e.g., "Convert fixed px to rem for better scalability"]

---

## Mobile UX Analysis

### Score: [X/100]

#### Viewport Meta Tag
- **Has viewport meta:** [Yes | No]
- **Content:** `[meta tag content]`
- **Valid:** [Yes | No]
- **Issues:** [List]

#### Touch Targets
- **WCAG Compliant:** [Yes | No]
- **Total Issues:** [Count]
- **Critical (< 32px):** [Count]
- **High priority (< 44px):** [Count]

**Touch Target Issues:**
1. **`[selector]`** - "[Text]"
   - **Size:** [W×H]px
   - **Severity:** [critical | high | medium]
   - **Fix:** `padding: Xpx Ypx; min-width: 44px; min-height: 44px;`
   - **Screenshot:** `[path]`

#### Text Readability
- **WCAG Compliant:** [Yes | No]
- **Issues Found:** [Count]

**Readability Issues:**
1. **`[selector]`**
   - **Font Size:** [X]px (min: 16px)
   - **Priority:** [high | medium | low]
   - **Fix:** `font-size: 1rem; /* 16px */`

#### Tap Collisions
- **Pairs too close:** [Count]

**Collision Issues:**
1. **`[selector1]` ↔️ `[selector2]`**
   - **Distance:** [X]px (min: 8px)
   - **Severity:** [high | medium]
   - **Fix:** `margin-bottom: 8px;` or increase gap

---

## Accessibility Analysis

### Score: [X/100]

#### Contrast Ratios
- **WCAG AA Compliant:** [Yes | No]
- **Issues Found:** [Count]

**Contrast Issues:**
1. **`[selector]`**
   - **Current Ratio:** [X.XX:1]
   - **Required:** [4.5:1 | 3:1]
   - **Foreground:** [#XXXXXX]
   - **Background:** [#XXXXXX]
   - **Fix:** [Suggested color]

#### Keyboard Navigation
- **Focusable Elements:** [Count]
- **Focus Indicators:** [Visible | Invisible | Partial]
- **Tab Order:** [Logical | Issues found]

**Issues:**
- [ ] **[Element]** has no focus indicator
- [ ] Tab order is not logical at **[location]**

#### ARIA & Semantics
- **Semantic HTML:** [Good | Needs improvement]
- **ARIA Labels:** [Present | Missing where needed]
- **Headings Structure:** [Proper | Issues]

**Issues:**
- [ ] **[Element]** needs `aria-label`
- [ ] Heading structure skips from h1 to h3

---

## Visual Design Analysis

### Score: [X/100]

#### Layout & Spacing
- **Consistency:** [Excellent | Good | Poor]
- **Spacing Scale:** [Consistent | Arbitrary values]
- **Alignment:** [Precise | Needs refinement]

**Issues:**
- [ ] Inconsistent spacing between sections (24px, 30px, 35px)
- [ ] Elements not aligned to grid

#### Typography
- **Font Families:** [List]
- **Type Scale:** [Consistent | Needs standardization]
- **Line Height:** [Appropriate | Too tight | Too loose]

**Issues:**
- [ ] Too many font sizes (7 different sizes)
- [ ] Line height too tight on paragraphs (1.2, should be 1.5-1.8)

#### Color Usage
- **Palette:** [Cohesive | Scattered]
- **Contrast:** [Good | Needs improvement]
- **Semantic Colors:** [Clear | Unclear]

**Issues:**
- [ ] Too many shades of gray (8 different grays)
- [ ] Button colors don't indicate action type

#### Visual Hierarchy
- **Clear:** [Yes | No | Partial]
- **Headings:** [Distinct | Similar]
- **CTAs:** [Stand out | Blend in]

**Issues:**
- [ ] Hero CTA doesn't stand out enough
- [ ] All headings look too similar

---

## Screenshots & Evidence

### Desktop (1920×1080)
![Desktop](path/to/desktop.png)

**Observations:**
- [What we see]

### Tablet (768×1024)
![Tablet](path/to/tablet.png)

**Observations:**
- [What we see]

### Mobile (375×667)
![Mobile](path/to/mobile.png)

**Observations:**
- [What breaks, what works]

### View-by-View (Mobile)
- View 1: `path/to/view-001.png` - [Header & Hero]
- View 2: `path/to/view-002.png` - [Services Section]
- View 3: `path/to/view-003.png` - [Footer]

---

## Interaction Testing

### Actions Tested
1. **Click Mobile Menu**
   - Before: `path/to/before.png`
   - After: `path/to/after.png`
   - **Result:** [Pass | Fail]
   - **Issues:** [List]

2. **Hover CTA Button**
   - **Result:** [Pass | Fail]
   - **Transition:** [Smooth | Janky | None]

3. **Focus Form Input**
   - **Result:** [Pass | Fail]
   - **Focus Indicator:** [Visible | Not visible]

---

## Recommendations Summary

### Critical (Fix Immediately)
1. [ ] Add viewport meta tag
2. [ ] Fix 5 elements exceeding viewport width
3. [ ] Increase 13 touch targets to 44×44px minimum

### High Priority
1. [ ] Add media queries for tablet and mobile
2. [ ] Convert fixed px to responsive units
3. [ ] Fix 4 text contrast issues

### Medium Priority
1. [ ] Standardize spacing scale
2. [ ] Reduce font size variations
3. [ ] Add focus indicators to all interactive elements

### Nice to Have
1. [ ] Add smooth transitions to interactive elements
2. [ ] Optimize images for mobile
3. [ ] Add loading states to async actions

---

## Next Actions

See `design-tasks.md` for prioritized task breakdown.

**Estimated Effort:** [X hours/days]

---

**Template Version:** 1.0
**Instructions:** Run this analysis after major changes. Update scores and issues as you fix them. Keep evidence (screenshots) up to date!

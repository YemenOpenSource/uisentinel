# 👁️ UISentinel Demo

This demo demonstrates how UISentinel gives AI coding agents vision to find and fix UI/UX issues.

## 📋 What This Demo Shows

The `landing-page.html` contains **11 intentional issues** across:
- ♿ Accessibility (WCAG 2.1 AA violations)
- 📱 Responsive design problems
- 📐 Layout issues
- 🎨 Visual quality problems

## 🚀 Running the Demo

### Step 1: Start a Local Server

```bash
# From the .demos directory
cd .demos
python3 -m http.server 8080
```

Or use any static server. The demo will be at `http://localhost:8080/landing-page.html`

### Step 2: Use UISentinel with Claude Code

Now let's use Claude Code to analyze this page and find all the issues!

#### Example 1: Find Accessibility Issues

```
/uisentinel check this page for accessibility issues at http://localhost:8080/landing-page.html
```

**What Claude finds:**
- ✅ Poor color contrast on CTA button (3.1:1, needs 4.5:1)
- ✅ Hero subtitle text has low contrast
- ✅ Navigation links too small for touch (mobile)
- ✅ Missing skip navigation link
- ✅ Footer text too small (10px)
- ✅ Decorative icons should have role="presentation"

#### Example 2: Check Responsive Design

```
/uisentinel analyze the responsive design and check mobile layout at http://localhost:8080/landing-page.html
```

**What Claude finds:**
- ✅ Fixed width container (1200px) breaks on mobile
- ✅ Feature cards overflow horizontally on small screens
- ✅ No flex-wrap on feature grid
- ✅ Fixed min-width on cards causes horizontal scroll

#### Example 3: Comprehensive Validation

```
/uisentinel validate everything - accessibility, responsive design, and mobile UX at http://localhost:8080/landing-page.html
```

**What Claude finds:**
All issues from above plus:
- ✅ Touch targets below 44x44px minimum
- ✅ Layout breaks at tablet viewport
- ✅ Horizontal scrolling on mobile
- ✅ Text readability issues

### Step 3: Let Claude Fix The Issues

After validation, Claude will:

1. **Show you exactly what's wrong** with screenshots and specific locations
2. **Provide concrete fixes** (not vague suggestions like "improve accessibility")
3. **Apply the fixes** to the code
4. **Re-validate** to confirm everything works

## 🔍 The 11 Issues Explained

### Accessibility Issues

**Issue 1: Poor Button Contrast**
```css
/* BEFORE */
.cta-button {
    background: #60a5fa;  /* 3.1:1 ratio ❌ */
    color: #ffffff;
}

/* AFTER - Claude will suggest */
.cta-button {
    background: #2563eb;  /* 7.2:1 ratio ✅ */
    color: #ffffff;
}
```

**Issue 2: Low Contrast Hero Text**
```css
/* BEFORE */
.hero p {
    color: #a0a0ff;  /* Poor contrast ❌ */
}

/* AFTER */
.hero p {
    color: #ffffff;  /* Good contrast ✅ */
}
```

**Issue 3: Touch Targets Too Small**
```css
/* BEFORE */
.nav-link {
    padding: 5px 10px;  /* Too small for mobile ❌ */
}

/* AFTER */
.nav-link {
    padding: 12px 16px;  /* 44x44px minimum ✅ */
}
```

**Issue 4: Footer Text Too Small**
```css
/* BEFORE */
.footer-small {
    font-size: 10px;  /* Below minimum ❌ */
}

/* AFTER */
.footer-small {
    font-size: 14px;  /* Readable ✅ */
}
```

### Responsive Design Issues

**Issue 5: Fixed Width Container**
```css
/* BEFORE */
.container {
    width: 1200px;  /* Overflows on mobile ❌ */
}

/* AFTER */
.container {
    max-width: 1200px;  /* Responsive ✅ */
    width: 100%;
    padding: 0 20px;
}
```

**Issue 6: Feature Grid No Wrap**
```css
/* BEFORE */
.feature-grid {
    display: flex;
    gap: 30px;  /* No wrap - breaks on mobile ❌ */
}

/* AFTER */
.feature-grid {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;  /* Wraps on small screens ✅ */
}
```

**Issue 7: Fixed Min-Width on Cards**
```css
/* BEFORE */
.feature-card {
    min-width: 300px;  /* Causes overflow ❌ */
}

/* AFTER */
.feature-card {
    min-width: min(300px, 100%);  /* Responsive ✅ */
}
```

### Semantic/Structure Issues

**Issue 8-11: Missing Semantic Elements**
- Missing skip navigation link for keyboard users
- Using `<div>` instead of `<img>` for icons (no alt text)
- No ARIA labels on decorative elements

## 📊 Expected Validation Results

### Before Fixes

```
Accessibility Score: 62/100 ❌
- 4 serious violations
- 3 moderate violations
- 2 minor violations

Responsive Score: 45/100 ❌
- Fixed width container
- Layout overflow on mobile
- Touch targets too small

Mobile UX Score: 58/100 ❌
- Horizontal scrolling detected
- Poor readability on small screens
```

### After Fixes

```
Accessibility Score: 98/100 ✅
- 0 serious violations
- 0 moderate violations
- 1 minor violation (can be ignored)

Responsive Score: 95/100 ✅
- Fluid layout
- No overflow
- Proper breakpoints

Mobile UX Score: 96/100 ✅
- No scrolling issues
- Excellent readability
- Proper touch targets
```

## 🎯 What This Demonstrates

### Without UISentinel

**AI Agent:** "I created a landing page"
**Developer:** "It breaks on mobile and has contrast issues"
**AI Agent:** "Let me try some fixes..." [guesses]
**Developer:** "Still not quite right..."

❌ Multiple iterations, no confidence

### With UISentinel

**AI Agent:** "I created a landing page"
**AI Agent:** [validates with UISentinel]
**AI Agent:** "I found 11 issues. Here are specific fixes for each..."
**AI Agent:** [applies exact fixes]
**AI Agent:** [re-validates]
**AI Agent:** "✅ All fixed! Scores: A11y 98/100, Responsive 95/100"

✅ Fixed on first try with confidence

## 🔄 Try It Yourself

1. **Open Claude Code** in this repository
2. **Start the demo server** (python3 -m http.server 8080 in .demos folder)
3. **Run validation**: `/uisentinel check accessibility and responsive design at http://localhost:8080/landing-page.html`
4. **Watch Claude**:
   - Capture screenshots
   - Analyze visual and structural issues
   - Provide specific fixes
   - Show you exactly what's wrong and how to fix it

## 💡 Key Takeaways

1. **Specific Fixes, Not Vague Advice**
   - Not: "Improve button contrast"
   - But: "Change #60a5fa to #2563eb (achieves 7.2:1 ratio)"

2. **Visual + Structural Analysis**
   - Screenshots show visual problems
   - JSON reports provide exact data
   - Claude gets both perspectives

3. **Measurable Results**
   - Score: 62/100 → 98/100
   - Exact metrics, not guesswork

4. **Confidence Through Validation**
   - Make change → validate → confirm
   - No more "hope it works"

## 🚀 Next Steps

Try asking Claude to:
- Fix all issues automatically
- Explain each issue in detail
- Show before/after screenshots
- Validate specific aspects (just accessibility, just responsive, etc.)
- Create a report of all findings

---

**This demo shows why UISentinel is essential for AI-driven UI development.**

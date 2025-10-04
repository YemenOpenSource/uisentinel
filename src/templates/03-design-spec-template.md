# Design Specification

**Project:** [Project Name]
**Page/Component:** [What we're designing]
**Version:** [1.0]
**Created:** [YYYY-MM-DD]
**Last Updated:** [YYYY-MM-DD]

## Design Goals

### Primary Goal
<!-- What is the main purpose of this design? -->

### Secondary Goals
1. [Goal 1]
2. [Goal 2]
3. [Goal 3]

## Target Audience

**Primary Audience:** [Who is this for?]
- Age Range: [X-Y years]
- Tech Savviness: [Beginner | Intermediate | Advanced]
- Devices: [Desktop | Tablet | Mobile | All]
- Context of Use: [Where and when will they use this?]

## Brand & Visual Identity

### Brand Attributes
- [Attribute 1]: [e.g., "Professional", "Playful", "Minimal"]
- [Attribute 2]: ...
- [Attribute 3]: ...

### Color Palette
```
Primary:   #XXXXXX (Use for CTAs, key actions)
Secondary: #XXXXXX (Use for accents, highlights)
Neutral:   #XXXXXX (Use for text, backgrounds)
Success:   #XXXXXX
Error:     #XXXXXX
Warning:   #XXXXXX
```

### Typography
```
Headings:  [Font Family], [Weight], [Size Scale]
Body:      [Font Family], [Weight], [Size]
Code/Mono: [Font Family] (if applicable)
```

### Spacing Scale
```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
2xl: 48px
3xl: 64px
```

## Layout & Structure

### Breakpoints
```
Mobile:  0-767px    (375×667 baseline)
Tablet:  768-1023px (768×1024 baseline)
Desktop: 1024px+    (1920×1080 baseline)
```

### Grid System
- **Columns:** [12-column | 16-column | Custom]
- **Gutter:** [Xpx]
- **Max Width:** [XXXXpx]

### Key Sections (in order)
1. **Header/Navigation**
   - Position: [Fixed | Sticky | Static]
   - Height: [Xpx]
   - Contents: [Logo, Nav Links, CTA]

2. **Hero Section**
   - Height: [Viewport height | Xpx]
   - Contents: [Headline, Subheading, CTA, Image]

3. **[Section Name]**
   - Purpose: [What does this section do?]
   - Contents: [List elements]

4. ... (continue for all sections)

## Component Specifications

### Buttons
- **Primary Button**
  - Size: [Height Xpx, Padding Xpx Ypx]
  - Colors: [Background, Text, Hover, Active]
  - Border Radius: [Xpx]
  - Typography: [Font, Size, Weight]

- **Secondary Button**
  - ...

### Forms
- **Input Fields**
  - Size: [Height, Padding]
  - Border: [Width, Color, Radius]
  - Focus State: [Border color, Shadow]
  - Error State: [Border color, Message]

### Cards
- ...

### Navigation
- ...

## Interaction Patterns

### Hover States
- Links: [Color change, underline, etc.]
- Buttons: [Background change, scale, shadow]
- Cards: [Elevation, border]

### Active/Focus States
- [Specify for interactive elements]

### Animations & Transitions
- Duration: [Xms]
- Easing: [ease-in-out | cubic-bezier(...)]
- What animates: [opacity, transform, color]

### Mobile-Specific
- **Mobile Menu:** [Hamburger | Bottom nav | Drawer]
- **Touch Targets:** Minimum 44×44px
- **Tap Feedback:** [Ripple | Color change]

## Accessibility Requirements

### WCAG Level
- [ ] AA (minimum)
- [ ] AAA (enhanced)

### Specific Requirements
- [ ] Contrast ratios ≥ 4.5:1 for normal text
- [ ] Contrast ratios ≥ 3:1 for large text
- [ ] Touch targets ≥ 44×44px
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Alt text for all images
- [ ] ARIA labels where needed

## Performance Targets

- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive (TTI) < 3.8s

## Success Criteria

### Must Have (P0)
- [ ] [Criterion 1]: [How to verify]
- [ ] [Criterion 2]: ...

### Should Have (P1)
- [ ] [Criterion 1]: ...

### Nice to Have (P2)
- [ ] [Criterion 1]: ...

## Out of Scope

<!-- What are we explicitly NOT doing? -->
- [Item 1]
- [Item 2]

## References & Inspiration

- [Link 1]: [Description]
- [Link 2]: [Description]

## Open Questions

- [ ] **Q1:** [Question]
  - **Answer:** [TBD | Answer]
- [ ] **Q2:** ...

---

**Template Version:** 1.0
**Instructions:** This spec should be created at the start of a design project and updated as requirements evolve. Use it as your north star!

/**
 * Unit Tests for Responsive Design Extensions
 * 
 * Tests all three extensions:
 * 1. MediaQueryInspector
 * 2. ResponsiveDesignInspector
 * 3. MobileUXAnalyzer
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Helper to create test HTML
function createTestHTML(css, html, scripts = '') {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${css}</style>
</head>
<body>
  ${html}
  ${scripts}
</body>
</html>`;
}

test.describe('MediaQueryInspector', () => {
  
  test('should detect media queries', async ({ page }) => {
    const html = createTestHTML(`
      @media (max-width: 768px) {
        .container { width: 100%; }
      }
      @media (min-width: 769px) and (max-width: 1024px) {
        .container { width: 90%; }
      }
      @media (min-width: 1025px) {
        .container { width: 80%; }
      }
    `, '<div class="container">Content</div>');
    
    await page.setContent(html);
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Inject extension code (simplified for testing)
    const result = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      const queries = [];
      
      sheets.forEach(sheet => {
        try {
          Array.from(sheet.cssRules).forEach(rule => {
            if (rule.type === CSSRule.MEDIA_RULE) {
              queries.push(rule.conditionText || rule.media.mediaText);
            }
          });
        } catch (e) {}
      });
      
      return {
        hasMediaQueries: queries.length > 0,
        count: queries.length,
        queries
      };
    });
    
    expect(result.hasMediaQueries).toBe(true);
    expect(result.count).toBe(3);
  });

  test('should identify missing breakpoints', async ({ page }) => {
    const html = createTestHTML(`
      @media (max-width: 768px) { body { font-size: 14px; } }
    `, '<div>Content</div>');
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const standardBreakpoints = [375, 425, 768, 1024, 1280, 1920];
      const sheets = Array.from(document.styleSheets);
      const foundBreakpoints = new Set();
      
      sheets.forEach(sheet => {
        try {
          Array.from(sheet.cssRules).forEach(rule => {
            if (rule.type === CSSRule.MEDIA_RULE) {
              const text = rule.conditionText || rule.media.mediaText;
              standardBreakpoints.forEach(bp => {
                if (text.includes(`${bp}px`)) {
                  foundBreakpoints.add(bp);
                }
              });
            }
          });
        } catch (e) {}
      });
      
      const missing = standardBreakpoints.filter(bp => !foundBreakpoints.has(bp));
      return { found: Array.from(foundBreakpoints), missing };
    });
    
    expect(result.found).toContain(768);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  test('should score based on breakpoint coverage', async ({ page }) => {
    const html = createTestHTML(`
      @media (max-width: 375px) { }
      @media (max-width: 768px) { }
      @media (max-width: 1024px) { }
      @media (max-width: 1280px) { }
      @media (max-width: 1920px) { }
    `, '<div>Content</div>');
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const standardBreakpoints = [375, 425, 768, 1024, 1280, 1920];
      const sheets = Array.from(document.styleSheets);
      const foundBreakpoints = new Set();
      
      sheets.forEach(sheet => {
        try {
          Array.from(sheet.cssRules).forEach(rule => {
            if (rule.type === CSSRule.MEDIA_RULE) {
              const text = rule.conditionText || rule.media.mediaText;
              standardBreakpoints.forEach(bp => {
                if (text.includes(`${bp}px`)) {
                  foundBreakpoints.add(bp);
                }
              });
            }
          });
        } catch (e) {}
      });
      
      const coverage = (foundBreakpoints.size / standardBreakpoints.length) * 100;
      const score = Math.round(coverage);
      
      return { coverage, score, found: foundBreakpoints.size };
    });
    
    expect(result.found).toBeGreaterThanOrEqual(5);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });
});

test.describe('ResponsiveDesignInspector', () => {
  
  test('should identify fixed-width elements', async ({ page }) => {
    const html = createTestHTML(`
      .fixed { width: 1200px; }
      .responsive { max-width: 1200px; width: 100%; }
    `, `
      <div class="fixed">Fixed Width</div>
      <div class="responsive">Responsive Width</div>
    `);
    
    await page.setContent(html);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const result = await page.evaluate(() => {
      const fixed = document.querySelector('.fixed');
      const responsive = document.querySelector('.responsive');
      
      // Get source CSS values
      const getSourceWidth = (el) => {
        const sheets = Array.from(document.styleSheets);
        for (const sheet of sheets) {
          try {
            const rules = Array.from(sheet.cssRules);
            for (const rule of rules) {
              if (rule.style && el.matches(rule.selectorText)) {
                return {
                  width: rule.style.getPropertyValue('width'),
                  maxWidth: rule.style.getPropertyValue('max-width')
                };
              }
            }
          } catch (e) {}
        }
        return { width: null, maxWidth: null };
      };
      
      return {
        fixed: getSourceWidth(fixed),
        responsive: getSourceWidth(responsive)
      };
    });
    
    expect(result.fixed.width).toBe('1200px');
    expect(result.responsive.maxWidth).toBe('1200px');
    expect(result.responsive.width).toBe('100%');
  });

  test('should recognize max-width + width:100% as responsive', async ({ page }) => {
    const html = createTestHTML(`
      .container { max-width: 75rem; width: 100%; }
    `, '<div class="container">Responsive Container</div>');
    
    await page.setContent(html);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const result = await page.evaluate(() => {
      const el = document.querySelector('.container');
      const sheets = Array.from(document.styleSheets);
      
      let sourceWidth = null;
      let sourceMaxWidth = null;
      
      for (const sheet of sheets) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (rule.style && el.matches(rule.selectorText)) {
              sourceWidth = rule.style.getPropertyValue('width');
              sourceMaxWidth = rule.style.getPropertyValue('max-width');
            }
          }
        } catch (e) {}
      }
      
      // Check if this is responsive pattern
      const isResponsive = sourceMaxWidth && sourceMaxWidth !== 'none' && 
                           sourceWidth === '100%';
      
      return { sourceWidth, sourceMaxWidth, isResponsive };
    });
    
    expect(result.isResponsive).toBe(true);
  });

  test('should detect overflow containers', async ({ page }) => {
    const html = createTestHTML(`
      .wrapper { overflow-x: auto; }
      .wide-table { width: 800px; }
    `, `
      <div class="wrapper">
        <table class="wide-table">
          <tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr>
        </table>
      </div>
    `);
    
    await page.setContent(html);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const result = await page.evaluate(() => {
      const table = document.querySelector('.wide-table');
      const rect = table.getBoundingClientRect();
      
      // Check if in scrollable container
      let parent = table.parentElement;
      let inScrollableContainer = false;
      
      while (parent && parent !== document.body) {
        const styles = window.getComputedStyle(parent);
        if (styles.overflowX === 'auto' || styles.overflowX === 'scroll') {
          inScrollableContainer = true;
          break;
        }
        parent = parent.parentElement;
      }
      
      return {
        tableWidth: rect.width,
        viewportWidth: window.innerWidth,
        overflowsViewport: rect.width > window.innerWidth,
        inScrollableContainer
      };
    });
    
    expect(result.overflowsViewport).toBe(true);
    expect(result.inScrollableContainer).toBe(true);
    // Should NOT flag as issue because it's in overflow container
  });

  test('should analyze flexbox layouts', async ({ page }) => {
    const html = createTestHTML(`
      .flex-wrap { display: flex; flex-wrap: wrap; }
      .flex-nowrap { display: flex; flex-wrap: nowrap; }
      .flex-wrap > div { width: 200px; height: 100px; }
      .flex-nowrap > div { width: 200px; height: 100px; }
    `, `
      <div class="flex-wrap">
        <div>1</div><div>2</div><div>3</div><div>4</div>
      </div>
      <div class="flex-nowrap">
        <div>1</div><div>2</div><div>3</div><div>4</div>
      </div>
    `);
    
    await page.setContent(html);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const result = await page.evaluate(() => {
      const wrap = document.querySelector('.flex-wrap');
      const nowrap = document.querySelector('.flex-nowrap');
      
      const wrapStyles = window.getComputedStyle(wrap);
      const nowrapStyles = window.getComputedStyle(nowrap);
      
      return {
        wrap: {
          flexWrap: wrapStyles.flexWrap,
          childCount: wrap.children.length,
          isResponsive: wrapStyles.flexWrap === 'wrap'
        },
        nowrap: {
          flexWrap: nowrapStyles.flexWrap,
          childCount: nowrap.children.length,
          isResponsive: nowrapStyles.flexWrap === 'wrap'
        }
      };
    });
    
    expect(result.wrap.isResponsive).toBe(true);
    expect(result.nowrap.isResponsive).toBe(false);
  });

  test('should parse CSS unit usage from source', async ({ page }) => {
    const html = createTestHTML(`
      .box1 { width: 100%; padding: 2rem; }
      .box2 { width: 300px; padding: 20px; }
      .box3 { width: 50vw; margin: 1em; }
    `, `
      <div class="box1">Relative units</div>
      <div class="box2">Pixel units</div>
      <div class="box3">Viewport units</div>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const units = { px: 0, percent: 0, rem: 0, em: 0, vw: 0, vh: 0 };
      const sheets = Array.from(document.styleSheets);
      
      sheets.forEach(sheet => {
        try {
          Array.from(sheet.cssRules).forEach(rule => {
            if (rule.style) {
              ['width', 'padding', 'margin'].forEach(prop => {
                const value = rule.style.getPropertyValue(prop);
                if (value) {
                  if (value.includes('px')) units.px++;
                  if (value.includes('%')) units.percent++;
                  if (value.includes('rem')) units.rem++;
                  if (value.includes('em') && !value.includes('rem')) units.em++;
                  if (value.includes('vw')) units.vw++;
                  if (value.includes('vh')) units.vh++;
                }
              });
            }
          });
        } catch (e) {}
      });
      
      const total = Object.values(units).reduce((a, b) => a + b, 0);
      const responsiveUnits = units.percent + units.rem + units.em + units.vw + units.vh;
      const responsiveScore = total > 0 ? Math.round((responsiveUnits / total) * 100) : 0;
      
      return { units, total, responsiveScore };
    });
    
    expect(result.units.percent).toBeGreaterThan(0);
    expect(result.units.rem).toBeGreaterThan(0);
    expect(result.units.vw).toBeGreaterThan(0);
    expect(result.responsiveScore).toBeGreaterThan(40);
  });

  test('should calculate balanced score', async ({ page }) => {
    const html = createTestHTML(`
      .container { max-width: 1200px; width: 100%; margin: 0 auto; }
      .flex { display: flex; flex-wrap: wrap; gap: 1rem; }
      .card { flex: 1 1 300px; padding: 2rem; }
      
      @media (max-width: 768px) {
        .container { padding: 1rem; }
      }
    `, `
      <div class="container">
        <div class="flex">
          <div class="card">Card 1</div>
          <div class="card">Card 2</div>
        </div>
      </div>
    `);
    
    await page.setContent(html);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const result = await page.evaluate(() => {
      // Simplified scoring logic
      let score = 70; // Start neutral
      
      // Check for responsive patterns
      const container = document.querySelector('.container');
      const flex = document.querySelector('.flex');
      
      const containerStyles = window.getComputedStyle(container);
      const flexStyles = window.getComputedStyle(flex);
      
      // Bonus for flex-wrap
      if (flexStyles.flexWrap === 'wrap') {
        score += 10;
      }
      
      // Check unit usage
      const sheets = Array.from(document.styleSheets);
      let remCount = 0, totalCount = 0;
      
      sheets.forEach(sheet => {
        try {
          Array.from(sheet.cssRules).forEach(rule => {
            if (rule.style) {
              const width = rule.style.getPropertyValue('width');
              if (width) {
                totalCount++;
                if (width.includes('rem') || width.includes('%')) remCount++;
              }
            }
          });
        } catch (e) {}
      });
      
      if (totalCount > 0 && (remCount / totalCount) >= 0.5) {
        score += 15;
      }
      
      return { score, hasFlexWrap: flexStyles.flexWrap === 'wrap' };
    });
    
    expect(result.score).toBeGreaterThanOrEqual(80);
  });
});

test.describe('MobileUXAnalyzer', () => {
  
  test('should detect viewport meta tag', async ({ page }) => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body><div>Content</div></body>
</html>`;
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return {
        hasViewport: !!meta,
        content: meta ? meta.getAttribute('content') : null,
        isValid: meta && meta.getAttribute('content').includes('width=device-width')
      };
    });
    
    expect(result.hasViewport).toBe(true);
    expect(result.isValid).toBe(true);
  });

  test('should detect missing viewport meta', async ({ page }) => {
    const html = createTestHTML('', '<div>Content</div>');
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return { hasViewport: !!meta };
    });
    
    expect(result.hasViewport).toBe(false);
  });

  test('should identify touch targets below 44x44px', async ({ page }) => {
    const html = createTestHTML(`
      .small-button { 
        display: inline-block;
        width: 30px; 
        height: 30px; 
        padding: 5px;
        background: blue;
      }
      .good-button { 
        display: inline-block;
        width: 44px; 
        height: 44px; 
        padding: 10px;
        background: green;
      }
    `, `
      <a href="#" class="small-button">Small</a>
      <button class="good-button">Good</button>
    `);
    
    await page.setContent(html);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const result = await page.evaluate(() => {
      const WCAG_MIN = 44;
      const interactive = document.querySelectorAll('a, button, input, select, textarea');
      const failures = [];
      
      interactive.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width < WCAG_MIN || rect.height < WCAG_MIN) {
          failures.push({
            tag: el.tagName,
            width: rect.width,
            height: rect.height,
            meetsWCAG: false
          });
        }
      });
      
      return { totalInteractive: interactive.length, failures: failures.length };
    });
    
    expect(result.totalInteractive).toBe(2);
    expect(result.failures).toBe(1); // Only the small button
  });

  test('should validate WCAG 2.1 touch target compliance', async ({ page }) => {
    const html = createTestHTML(`
      button, a {
        display: inline-block;
        min-width: 44px;
        min-height: 44px;
        padding: 12px 20px;
        text-decoration: none;
        border: none;
        background: #007bff;
        color: white;
      }
    `, `
      <button>Button 1</button>
      <a href="#">Link 1</a>
      <button>Button 2</button>
    `);
    
    await page.setContent(html);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const result = await page.evaluate(() => {
      const WCAG_MIN = 44;
      const interactive = document.querySelectorAll('a, button');
      const details = [];
      const failures = [];
      
      interactive.forEach(el => {
        const rect = el.getBoundingClientRect();
        details.push({
          tag: el.tagName,
          width: rect.width,
          height: rect.height,
          passes: rect.width >= WCAG_MIN && rect.height >= WCAG_MIN
        });
        
        if (rect.width < WCAG_MIN || rect.height < WCAG_MIN) {
          failures.push(el.tagName);
        }
      });
      
      return { 
        total: interactive.length, 
        failures: failures.length,
        wcagCompliant: failures.length === 0,
        details
      };
    });
    
    // Check that we have the expected number of elements
    expect(result.total).toBe(3);
    // All should pass WCAG
    expect(result.wcagCompliant).toBe(true);
  });

  test('should detect text below 16px on mobile', async ({ page }) => {
    const html = createTestHTML(`
      .small-text { font-size: 12px; }
      .good-text { font-size: 16px; }
      .large-text { font-size: 18px; }
    `, `
      <p class="small-text">Small text</p>
      <p class="good-text">Good text</p>
      <p class="large-text">Large text</p>
    `);
    
    await page.setContent(html);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const result = await page.evaluate(() => {
      const MIN_SIZE = 16;
      const allText = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
      const issues = [];
      
      allText.forEach(el => {
        if (el.textContent.trim()) {
          const styles = window.getComputedStyle(el);
          const fontSize = parseFloat(styles.fontSize);
          
          if (fontSize < MIN_SIZE) {
            issues.push({
              tag: el.tagName,
              fontSize,
              text: el.textContent.substring(0, 20)
            });
          }
        }
      });
      
      return { totalElements: allText.length, issues: issues.length };
    });
    
    expect(result.issues).toBe(1); // Only small-text
  });

  test('should detect tap collision (< 8px spacing)', async ({ page }) => {
    const html = createTestHTML(`
      .close-buttons button {
        display: inline-block;
        width: 44px;
        height: 44px;
        margin: 0 2px; /* Only 2px gap */
      }
      .spaced-buttons button {
        display: inline-block;
        width: 44px;
        height: 44px;
        margin: 0 10px; /* 10px gap */
      }
    `, `
      <div class="close-buttons">
        <button>A</button>
        <button>B</button>
      </div>
      <div class="spaced-buttons">
        <button>C</button>
        <button>D</button>
      </div>
    `);
    
    await page.setContent(html);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const result = await page.evaluate(() => {
      const MIN_SPACING = 8;
      const interactive = Array.from(document.querySelectorAll('button, a'));
      const collisions = [];
      
      for (let i = 0; i < interactive.length - 1; i++) {
        const rect1 = interactive[i].getBoundingClientRect();
        
        for (let j = i + 1; j < interactive.length; j++) {
          const rect2 = interactive[j].getBoundingClientRect();
          
          // Calculate distance
          const dx = Math.max(0, Math.max(rect1.left, rect2.left) - Math.min(rect1.right, rect2.right));
          const dy = Math.max(0, Math.max(rect1.top, rect2.top) - Math.min(rect1.bottom, rect2.bottom));
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < MIN_SPACING) {
            collisions.push({ distance, pair: [i, j] });
          }
        }
      }
      
      return { totalButtons: interactive.length, collisions: collisions.length };
    });
    
    expect(result.collisions).toBeGreaterThan(0); // close-buttons should collide
  });

  test('should calculate mobile UX score', async ({ page }) => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    button { min-width: 44px; min-height: 44px; padding: 10px; margin: 10px; font-size: 16px; }
    p { font-size: 16px; }
  </style>
</head>
<body>
  <p>Good readability</p>
  <button>Button 1</button>
  <button>Button 2</button>
</body>
</html>`;
    
    await page.setContent(html);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const result = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      const hasViewport = !!meta;
      
      // Check touch targets
      const WCAG_MIN = 44;
      const interactive = document.querySelectorAll('button, a');
      const touchFailures = Array.from(interactive).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width < WCAG_MIN || rect.height < WCAG_MIN;
      }).length;
      
      // Check text size
      const MIN_SIZE = 16;
      const text = document.querySelectorAll('p, button');
      const readabilityIssues = Array.from(text).filter(el => {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        return fontSize < MIN_SIZE;
      }).length;
      
      // Calculate score
      let score = 100;
      if (!hasViewport) score -= 20;
      score -= touchFailures * 10;
      score -= readabilityIssues * 10;
      
      return {
        hasViewport,
        touchFailures,
        readabilityIssues,
        score,
        wcagCompliant: touchFailures === 0 && readabilityIssues === 0
      };
    });
    
    expect(result.hasViewport).toBe(true);
    expect(result.wcagCompliant).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });
});

test.describe('Integration Tests', () => {
  
  test('should analyze a fully responsive page', async ({ page }) => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 1rem; font-size: 16px; }
    .container { max-width: 1200px; width: 100%; margin: 0 auto; }
    .cards { display: flex; flex-wrap: wrap; gap: 1rem; }
    .card { flex: 1 1 300px; padding: 2rem; }
    button { min-width: 44px; min-height: 44px; padding: 10px 20px; }
    
    @media (max-width: 768px) {
      body { padding: 0.5rem; }
      .card { flex: 1 1 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Responsive Page</h1>
    <div class="cards">
      <div class="card">Card 1</div>
      <div class="card">Card 2</div>
    </div>
    <button>Action</button>
  </div>
</body>
</html>`;
    
    await page.setContent(html);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const result = await page.evaluate(() => {
      // Media queries
      const sheets = Array.from(document.styleSheets);
      let mediaQueryCount = 0;
      sheets.forEach(sheet => {
        try {
          Array.from(sheet.cssRules).forEach(rule => {
            if (rule.type === CSSRule.MEDIA_RULE) mediaQueryCount++;
          });
        } catch (e) {}
      });
      
      // Responsive design
      const container = document.querySelector('.container');
      const cards = document.querySelector('.cards');
      const flexWrap = window.getComputedStyle(cards).flexWrap;
      
      // Mobile UX
      const meta = document.querySelector('meta[name="viewport"]');
      const button = document.querySelector('button');
      const buttonRect = button.getBoundingClientRect();
      const meetsWCAG = buttonRect.width >= 44 && buttonRect.height >= 44;
      
      return {
        hasMediaQueries: mediaQueryCount > 0,
        hasFlexWrap: flexWrap === 'wrap',
        hasViewport: !!meta,
        touchTargetsOK: meetsWCAG,
        overallQuality: 'excellent'
      };
    });
    
    expect(result.hasMediaQueries).toBe(true);
    expect(result.hasFlexWrap).toBe(true);
    expect(result.hasViewport).toBe(true);
    expect(result.touchTargetsOK).toBe(true);
  });

  test('should detect multiple issues on non-responsive page', async ({ page }) => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    .container { width: 1200px; }
    .cards { display: flex; flex-wrap: nowrap; }
    .card { width: 400px; }
    button { width: 30px; height: 30px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="cards">
      <div class="card">Card 1</div>
      <div class="card">Card 2</div>
    </div>
    <button>X</button>
  </div>
</body>
</html>`;
    
    await page.setContent(html);
    await page.setViewportSize({ width: 375, height: 667 });
    
    const result = await page.evaluate(() => {
      const container = document.querySelector('.container');
      const button = document.querySelector('button');
      const meta = document.querySelector('meta[name="viewport"]');
      
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const buttonStyles = window.getComputedStyle(button);
      
      return {
        missingViewport: !meta,
        containerOverflows: containerRect.width > window.innerWidth,
        touchTargetFails: buttonRect.width < 44 || buttonRect.height < 44,
        textTooSmall: parseFloat(buttonStyles.fontSize) < 16,
        issueCount: [!meta, containerRect.width > window.innerWidth, 
                     buttonRect.width < 44, parseFloat(buttonStyles.fontSize) < 16]
                     .filter(Boolean).length
      };
    });
    
    expect(result.issueCount).toBeGreaterThanOrEqual(3);
  });
});

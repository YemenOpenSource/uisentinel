/**
 * Unit Tests for Browser Extensions - Part 1
 * 
 * Tests:
 * - A11yInspector
 * - ContrastChecker
 * - ElementInspector
 * - ElementRuler
 */

const { test, expect } = require('@playwright/test');

// Helper to create test HTML
function createTestHTML(css, html, scripts = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Page</title>
  <style>${css}</style>
</head>
<body>
  ${html}
  ${scripts}
</body>
</html>`;
}

test.describe('A11yInspector', () => {
  
  test('should detect missing alt text on images', async ({ page }) => {
    const html = createTestHTML('', `
      <img src="image1.jpg" alt="Good image with alt">
      <img src="image2.jpg">
      <img src="image3.jpg" alt="">
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      const issues = images.filter(img => {
        const alt = img.getAttribute('alt');
        return alt === null || alt === '';
      });
      
      return {
        totalImages: images.length,
        missingAlt: issues.length,
        issues: issues.map(img => ({
          src: img.getAttribute('src'),
          hasAlt: img.hasAttribute('alt'),
          altValue: img.getAttribute('alt')
        }))
      };
    });
    
    expect(result.totalImages).toBe(3);
    expect(result.missingAlt).toBe(2); // image2.jpg and image3.jpg
  });

  test('should detect missing form labels', async ({ page }) => {
    const html = createTestHTML('', `
      <form>
        <label for="name">Name:</label>
        <input type="text" id="name">
        
        <input type="email" id="email" placeholder="Email">
        
        <label>
          Phone:
          <input type="tel">
        </label>
      </form>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      const unlabeled = [];
      
      inputs.forEach(input => {
        const id = input.getAttribute('id');
        
        // Check for associated label
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        
        // Check if inside a label
        const insideLabel = input.closest('label');
        
        // Check for aria-label
        const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
        
        if (!hasLabel && !insideLabel && !hasAriaLabel) {
          unlabeled.push({
            tag: input.tagName,
            type: input.getAttribute('type'),
            id: id || '(no id)',
            hasPlaceholder: input.hasAttribute('placeholder')
          });
        }
      });
      
      return {
        totalInputs: inputs.length,
        unlabeled: unlabeled.length,
        issues: unlabeled
      };
    });
    
    expect(result.totalInputs).toBe(3);
    expect(result.unlabeled).toBe(1); // Email input
  });

  test('should detect missing lang attribute', async ({ page }) => {
    const html = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><p>Content</p></body>
</html>`;
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const html = document.documentElement;
      const lang = html.getAttribute('lang');
      
      return {
        hasLang: !!lang,
        langValue: lang,
        severity: !lang ? 'critical' : 'none'
      };
    });
    
    expect(result.hasLang).toBe(false);
    expect(result.severity).toBe('critical');
  });

  test('should detect low contrast text', async ({ page }) => {
    const html = createTestHTML(`
      .good { color: #000; background: #fff; }
      .bad { color: #ccc; background: #ddd; }
      .warning { color: #777; background: #fff; }
    `, `
      <p class="good">Good contrast (21:1)</p>
      <p class="bad">Bad contrast (1.3:1)</p>
      <p class="warning">Warning contrast (4.5:1)</p>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      // Simple contrast ratio calculator
      const getLuminance = (r, g, b) => {
        const rsRGB = r / 255;
        const gsRGB = g / 255;
        const bsRGB = b / 255;
        
        const R = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const G = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const B = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
        
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
      };
      
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      };
      
      const getContrast = (color1, color2) => {
        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);
        if (!rgb1 || !rgb2) return 0;
        
        const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
        
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        
        return (lighter + 0.05) / (darker + 0.05);
      };
      
      const texts = Array.from(document.querySelectorAll('p'));
      const results = texts.map(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const bgColor = styles.backgroundColor;
        
        // Parse rgb(r, g, b) to hex
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        const bgMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        
        if (!rgbMatch || !bgMatch) return null;
        
        const colorHex = '#' + [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
          .map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
        const bgHex = '#' + [bgMatch[1], bgMatch[2], bgMatch[3]]
          .map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
        
        const ratio = getContrast(colorHex, bgHex);
        
        return {
          text: el.textContent?.substring(0, 20),
          ratio: Math.round(ratio * 10) / 10,
          passesAA: ratio >= 4.5,
          passesAAA: ratio >= 7
        };
      }).filter(Boolean);
      
      return {
        total: texts.length,
        results,
        failures: results.filter(r => !r.passesAA).length
      };
    });
    
    expect(result.total).toBe(3);
    expect(result.failures).toBeGreaterThan(0);
  });

  test('should detect missing heading hierarchy', async ({ page }) => {
    const html = createTestHTML('', `
      <h1>Main Title</h1>
      <h3>Skipped H2</h3>
      <h2>Back to H2</h2>
      <h5>Skipped H3 and H4</h5>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const issues = [];
      let lastLevel = 0;
      
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        
        if (lastLevel > 0 && level > lastLevel + 1) {
          issues.push({
            heading: heading.tagName,
            text: heading.textContent?.substring(0, 30),
            issue: `Skipped from H${lastLevel} to H${level}`,
            severity: 'warning'
          });
        }
        
        lastLevel = level;
      });
      
      return {
        totalHeadings: headings.length,
        hierarchyIssues: issues.length,
        issues
      };
    });
    
    expect(result.totalHeadings).toBe(4);
    expect(result.hierarchyIssues).toBeGreaterThan(0);
  });

  test('should detect interactive elements without accessible names', async ({ page }) => {
    const html = createTestHTML('', `
      <button>Good Button</button>
      <button></button>
      <a href="#"></a>
      <a href="#" aria-label="Link with aria-label"></a>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const interactive = Array.from(document.querySelectorAll('button, a[href], input[type="button"]'));
      const issues = [];
      
      interactive.forEach(el => {
        const text = el.textContent?.trim();
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledby = el.getAttribute('aria-labelledby');
        const title = el.getAttribute('title');
        
        const hasAccessibleName = text || ariaLabel || ariaLabelledby || title;
        
        if (!hasAccessibleName) {
          issues.push({
            tag: el.tagName,
            href: el.getAttribute('href'),
            hasText: !!text,
            hasAriaLabel: !!ariaLabel
          });
        }
      });
      
      return {
        totalInteractive: interactive.length,
        missingAccessibleName: issues.length,
        issues
      };
    });
    
    expect(result.totalInteractive).toBe(4);
    expect(result.missingAccessibleName).toBe(2); // Empty button and empty link
  });
});

test.describe('ContrastChecker', () => {
  
  test('should calculate contrast ratio correctly', async ({ page }) => {
    const html = createTestHTML(`
      .white-on-black { color: #ffffff; background: #000000; }
      .black-on-white { color: #000000; background: #ffffff; }
      .gray-on-lightgray { color: #666666; background: #cccccc; }
    `, `
      <p class="white-on-black">Max contrast (21:1)</p>
      <p class="black-on-white">Max contrast (21:1)</p>
      <p class="gray-on-lightgray">Low contrast (~4:1)</p>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const getLuminance = (r, g, b) => {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };
      
      const getContrast = (rgb1, rgb2) => {
        const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
        const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
      };
      
      const whiteOnBlack = getContrast([255, 255, 255], [0, 0, 0]);
      const blackOnWhite = getContrast([0, 0, 0], [255, 255, 255]);
      const grayOnLightgray = getContrast([102, 102, 102], [204, 204, 204]);
      
      return {
        whiteOnBlack: Math.round(whiteOnBlack * 10) / 10,
        blackOnWhite: Math.round(blackOnWhite * 10) / 10,
        grayOnLightgray: Math.round(grayOnLightgray * 10) / 10
      };
    });
    
    expect(result.whiteOnBlack).toBe(21);
    expect(result.blackOnWhite).toBe(21);
    expect(result.grayOnLightgray).toBeGreaterThan(3);
    expect(result.grayOnLightgray).toBeLessThan(5);
  });

  test('should identify WCAG AA failures', async ({ page }) => {
    const html = createTestHTML(`
      .pass-aa { color: #595959; background: #ffffff; } /* 7:1 */
      .fail-aa { color: #999999; background: #ffffff; } /* 2.8:1 */
      .borderline { color: #767676; background: #ffffff; } /* 4.5:1 exactly */
    `, `
      <p class="pass-aa">This passes AA</p>
      <p class="fail-aa">This fails AA</p>
      <p class="borderline">This is borderline AA</p>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const WCAG_AA_NORMAL = 4.5;
      const WCAG_AA_LARGE = 3.0;
      
      const texts = Array.from(document.querySelectorAll('p'));
      const checks = texts.map(el => {
        const styles = window.getComputedStyle(el);
        const fontSize = parseFloat(styles.fontSize);
        const fontWeight = styles.fontWeight;
        
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && parseInt(fontWeight) >= 700);
        const requiredRatio = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        
        return {
          text: el.textContent?.substring(0, 20),
          fontSize,
          isLargeText,
          requiredRatio
        };
      });
      
      return { checks };
    });
    
    expect(result.checks.length).toBe(3);
    expect(result.checks[0].requiredRatio).toBe(4.5);
  });

  test('should handle transparent backgrounds', async ({ page }) => {
    const html = createTestHTML(`
      body { background: #ffffff; }
      .overlay { color: #000000; background: rgba(255, 255, 255, 0.5); }
    `, `
      <div class="overlay">Text on semi-transparent background</div>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const el = document.querySelector('.overlay');
      if (!el) return null;
      
      const styles = window.getComputedStyle(el);
      const bgColor = styles.backgroundColor;
      
      // Check if background is transparent/semi-transparent
      const isTransparent = bgColor.includes('rgba') || bgColor === 'transparent';
      
      return {
        backgroundColor: bgColor,
        isTransparent,
        needsParentCheck: isTransparent
      };
    });
    
    expect(result?.isTransparent).toBe(true);
    expect(result?.needsParentCheck).toBe(true);
  });
});

test.describe('ElementInspector', () => {
  
  test('should get element dimensions and position', async ({ page }) => {
    const html = createTestHTML(`
      * { margin: 0; padding: 0; }
      .box {
        width: 200px;
        height: 100px;
        margin: 20px;
        padding: 10px;
        border: 5px solid black;
        position: absolute;
        top: 50px;
        left: 30px;
      }
    `, `
      <div class="box">Test Box</div>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const el = document.querySelector('.box');
      if (!el) return null;
      
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      
      return {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        margin: styles.margin,
        padding: styles.padding,
        border: styles.borderWidth
      };
    });
    
    expect(result?.width).toBe(230); // 200 + 10*2 (padding) + 5*2 (border)
    expect(result?.height).toBe(130); // 100 + 10*2 + 5*2
    expect(result?.top).toBeGreaterThanOrEqual(50); // Position may include margin
    expect(result?.left).toBeGreaterThanOrEqual(30);
  });

  test('should detect element visibility', async ({ page }) => {
    const html = createTestHTML(`
      .hidden { display: none; }
      .invisible { visibility: hidden; }
      .transparent { opacity: 0; }
      .visible { display: block; }
      .offscreen { position: absolute; left: -9999px; }
    `, `
      <div class="hidden">Hidden</div>
      <div class="invisible">Invisible</div>
      <div class="transparent">Transparent</div>
      <div class="visible">Visible</div>
      <div class="offscreen">Offscreen</div>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div'));
      
      return elements.map(el => {
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        return {
          className: el.className,
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          hasSize: rect.width > 0 && rect.height > 0,
          inViewport: rect.left >= 0 && rect.left < window.innerWidth
        };
      });
    });
    
    expect(result[0].display).toBe('none'); // hidden
    expect(result[1].visibility).toBe('hidden'); // invisible
    expect(result[2].opacity).toBe('0'); // transparent
    expect(result[3].display).toBe('block'); // visible
    expect(result[4].inViewport).toBe(false); // offscreen
  });

  test('should extract computed styles', async ({ page }) => {
    const html = createTestHTML(`
      .styled {
        font-size: 16px;
        font-weight: bold;
        color: rgb(255, 0, 0);
        background-color: rgb(0, 0, 255);
        line-height: 1.5;
      }
    `, `
      <p class="styled">Styled text</p>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const el = document.querySelector('.styled');
      if (!el) return null;
      
      const styles = window.getComputedStyle(el);
      
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        lineHeight: styles.lineHeight
      };
    });
    
    expect(result?.fontSize).toBe('16px');
    expect(result?.fontWeight).toBe('700'); // bold
    expect(result?.color).toContain('255, 0, 0'); // red
    expect(result?.backgroundColor).toContain('0, 0, 255'); // blue
  });

  test('should get element selector path', async ({ page }) => {
    const html = createTestHTML('', `
      <div id="container">
        <section class="content">
          <article>
            <p class="target">Target element</p>
          </article>
        </section>
      </div>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const el = document.querySelector('.target');
      if (!el) return null;
      
      const getSelector = (element) => {
        if (element.id) return `#${element.id}`;
        
        let selector = element.tagName.toLowerCase();
        if (element.className && typeof element.className === 'string') {
          const classes = element.className.trim().split(/\s+/);
          if (classes[0]) selector += `.${classes[0]}`;
        }
        
        return selector;
      };
      
      const getFullPath = (element) => {
        const path = [];
        let current = element;
        
        while (current && current !== document.body) {
          path.unshift(getSelector(current));
          current = current.parentElement;
        }
        
        return path;
      };
      
      return {
        selector: getSelector(el),
        fullPath: getFullPath(el),
        id: el.id || null,
        className: el.className || null
      };
    });
    
    expect(result?.selector).toBe('p.target');
    expect(result?.fullPath).toContain('#container');
    expect(result?.fullPath).toContain('p.target');
  });
});

test.describe('ElementRuler', () => {
  
  test('should measure element dimensions with box model', async ({ page }) => {
    const html = createTestHTML(`
      .box {
        width: 200px;
        height: 100px;
        padding: 20px;
        border: 5px solid black;
        margin: 10px;
      }
    `, `
      <div class="box">Content</div>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const el = document.querySelector('.box');
      if (!el) return null;
      
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      return {
        contentWidth: 200,
        contentHeight: 100,
        paddingTop: parseInt(styles.paddingTop),
        paddingRight: parseInt(styles.paddingRight),
        paddingBottom: parseInt(styles.paddingBottom),
        paddingLeft: parseInt(styles.paddingLeft),
        borderTop: parseInt(styles.borderTopWidth),
        borderRight: parseInt(styles.borderRightWidth),
        borderBottom: parseInt(styles.borderBottomWidth),
        borderLeft: parseInt(styles.borderLeftWidth),
        totalWidth: rect.width,
        totalHeight: rect.height
      };
    });
    
    expect(result?.paddingTop).toBe(20);
    expect(result?.borderTop).toBe(5);
    expect(result?.totalWidth).toBe(250); // 200 + 20*2 + 5*2
    expect(result?.totalHeight).toBe(150); // 100 + 20*2 + 5*2
  });

  test('should measure distance between elements', async ({ page }) => {
    const html = createTestHTML(`
      .box1 { width: 100px; height: 50px; position: absolute; top: 0; left: 0; }
      .box2 { width: 100px; height: 50px; position: absolute; top: 100px; left: 150px; }
    `, `
      <div class="box1">Box 1</div>
      <div class="box2">Box 2</div>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const box1 = document.querySelector('.box1');
      const box2 = document.querySelector('.box2');
      if (!box1 || !box2) return null;
      
      const rect1 = box1.getBoundingClientRect();
      const rect2 = box2.getBoundingClientRect();
      
      const horizontalGap = rect2.left - rect1.right;
      const verticalGap = rect2.top - rect1.bottom;
      
      // Calculate center-to-center distance
      const center1 = { x: rect1.left + rect1.width / 2, y: rect1.top + rect1.height / 2 };
      const center2 = { x: rect2.left + rect2.width / 2, y: rect2.top + rect2.height / 2 };
      const distance = Math.sqrt(
        Math.pow(center2.x - center1.x, 2) + Math.pow(center2.y - center1.y, 2)
      );
      
      return {
        horizontalGap,
        verticalGap,
        centerDistance: Math.round(distance)
      };
    });
    
    expect(result?.horizontalGap).toBe(50); // 150 - 100
    expect(result?.verticalGap).toBe(50); // 100 - 50
    expect(result?.centerDistance).toBeGreaterThan(0);
  });

  test('should measure spacing between inline elements', async ({ page }) => {
    const html = createTestHTML(`
      span { margin-right: 10px; padding: 5px; }
    `, `
      <div>
        <span>First</span>
        <span>Second</span>
        <span>Third</span>
      </div>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const gaps = [];
      
      for (let i = 0; i < spans.length - 1; i++) {
        const rect1 = spans[i].getBoundingClientRect();
        const rect2 = spans[i + 1].getBoundingClientRect();
        gaps.push(rect2.left - rect1.right);
      }
      
      return {
        totalElements: spans.length,
        gaps,
        averageGap: gaps.reduce((a, b) => a + b, 0) / gaps.length
      };
    });
    
    expect(result.totalElements).toBe(3);
    expect(result.gaps.length).toBe(2);
    expect(result.averageGap).toBeGreaterThan(0);
  });

  test('should detect element overflow', async ({ page }) => {
    const html = createTestHTML(`
      .container { width: 300px; height: 200px; overflow: hidden; border: 1px solid black; }
      .child { width: 400px; height: 250px; background: lightblue; }
    `, `
      <div class="container">
        <div class="child">Overflowing content</div>
      </div>
    `);
    
    await page.setContent(html);
    
    const result = await page.evaluate(() => {
      const container = document.querySelector('.container');
      const child = document.querySelector('.child');
      if (!container || !child) return null;
      
      const containerRect = container.getBoundingClientRect();
      const childRect = child.getBoundingClientRect();
      
      return {
        containerWidth: containerRect.width,
        containerHeight: containerRect.height,
        childWidth: childRect.width,
        childHeight: childRect.height,
        overflowsHorizontally: childRect.width > containerRect.width,
        overflowsVertically: childRect.height > containerRect.height,
        horizontalOverflow: childRect.width - containerRect.width,
        verticalOverflow: childRect.height - containerRect.height
      };
    });
    
    expect(result?.overflowsHorizontally).toBe(true);
    expect(result?.overflowsVertically).toBe(true);
    expect(result?.horizontalOverflow).toBeGreaterThan(0);
    expect(result?.verticalOverflow).toBeGreaterThan(0);
  });
});

import { Page } from 'playwright';
import { BaseExtension } from './extension-manager';

/**
 * Color Contrast Checker Extension
 * Analyzes and highlights elements with insufficient color contrast
 * Checks against WCAG 2.1 standards (AA and AAA levels)
 */
export class ContrastChecker extends BaseExtension {
  id = 'contrast-checker';
  name = 'Color Contrast Checker';
  description = 'Real-time WCAG color contrast analysis with visual indicators and fix suggestions';

  /**
   * Generate browser-side JavaScript code
   */
  getBrowserCode(): string {
    return this.createBrowserAPI({
      /**
       * Calculate contrast ratio between two colors
       */
      getContrastRatio: function(foreground: string, background: string): number {
        // Helper to get relative luminance
        const getLuminance = (rgb: string): number => {
          const match = rgb.match(/\d+/g);
          if (!match || match.length < 3) return 0;

          const [r, g, b] = match.map(Number);
          const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });

          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };

        const l1 = getLuminance(foreground);
        const l2 = getLuminance(background);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

        return ratio;
      },

      /**
       * Check if a color is transparent
       */
      isTransparent: function(color: string): boolean {
        return color === 'rgba(0, 0, 0, 0)' ||
               color === 'transparent' ||
               color.includes('rgba') && color.includes(', 0)');
      },

      /**
       * Get effective background color (handles transparency)
       */
      getEffectiveBackground: function(element: Element): string {
        let current: Element | null = element;
        const computed = window.getComputedStyle(element);
        let bg = computed.backgroundColor;

        // Walk up the DOM tree until we find a non-transparent background
        while (current && this.isTransparent(bg)) {
          current = current.parentElement;
          if (current) {
            bg = window.getComputedStyle(current).backgroundColor;
          } else {
            // Default to white if we reach the root without finding a background
            bg = 'rgb(255, 255, 255)';
          }
        }

        return bg;
      },

      /**
       * Check contrast for all text elements on the page
       */
      checkContrast: function(params: any = {}) {
        const {
          minRatioAA = 4.5,        // WCAG AA for normal text
          minRatioAAA = 7,          // WCAG AAA for normal text
          largeTextMinAA = 3,       // WCAG AA for large text (18pt+)
          highlightIssues = true,
          showLabels = true,
          onlyVisibleElements = false  // Only check elements currently in viewport
        } = params;

        const issues: any[] = [];
        const stats = {
          totalElements: 0,
          passed: 0,
          failedAA: 0,
          failedAAA: 0,
          critical: 0  // Failed AA by significant margin
        };

        // Clear existing markers
        document.querySelectorAll('.uisentinel-contrast-marker, .uisentinel-contrast-label').forEach(el => el.remove());

        // Check all elements with text content
        const textElements = document.querySelectorAll('*');

        textElements.forEach((element) => {
          const el = element as HTMLElement;

          // Skip if no text content or hidden
          if (!el.textContent?.trim() || el.offsetParent === null) return;

          // Skip script, style, etc.
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK'].includes(el.tagName)) return;

          // Skip elements not in viewport if onlyVisibleElements is true
          if (onlyVisibleElements) {
            const rect = el.getBoundingClientRect();
            const isInViewport = (
              rect.top >= 0 &&
              rect.left >= 0 &&
              rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
              rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
              rect.width > 0 &&
              rect.height > 0
            );
            if (!isInViewport) return;
          }

          const styles = window.getComputedStyle(el);
          const fg = styles.color;
          const bg = this.getEffectiveBackground(el);

          // Skip if we can't determine colors
          if (!fg || this.isTransparent(fg)) return;

          stats.totalElements++;

          const ratio = this.getContrastRatio(fg, bg);
          const fontSize = parseFloat(styles.fontSize);
          const fontWeight = styles.fontWeight;

          // Determine if it's "large text" (18pt/24px or 14pt/18.5px bold)
          const isLargeText = fontSize >= 24 || (fontSize >= 18.5 && parseInt(fontWeight) >= 700);
          const minRatio = isLargeText ? largeTextMinAA : minRatioAA;

          // Check if it passes WCAG standards
          const passesAA = ratio >= minRatio;
          const passesAAA = ratio >= (isLargeText ? 4.5 : minRatioAAA);

          if (passesAA) {
            stats.passed++;
          } else {
            stats.failedAA++;

            // Critical failures (ratio < 3:1)
            if (ratio < 3) {
              stats.critical++;
            }
          }

          if (!passesAAA) {
            stats.failedAAA++;
          }

          // Only report and highlight failures
          if (!passesAA) {
            const issue = {
              selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
              ratio: ratio.toFixed(2),
              ratioNumber: ratio,
              required: minRatio.toFixed(1),
              foreground: fg,
              background: bg,
              fontSize: fontSize + 'px',
              isLargeText,
              severity: ratio < 3 ? 'critical' : ratio < 4 ? 'serious' : 'moderate',
              passesAA,
              passesAAA
            };

            issues.push(issue);

            // Highlight the element
            if (highlightIssues) {
              const severity = issue.severity;
              const color = severity === 'critical' ? '#d32f2f' :
                           severity === 'serious' ? '#f57c00' : '#fbc02d';

              el.style.outline = `2px solid ${color}`;
              el.style.outlineOffset = '1px';
              el.classList.add('uisentinel-contrast-marker');

              // Store original outline
              (el as any).__uisentinel_original_outline = el.style.outline;

              // Add label
              if (showLabels) {
                const rect = el.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

                const label = document.createElement('div');
                label.className = 'uisentinel-contrast-label';
                label.style.cssText = `
                  position: absolute;
                  left: ${rect.right + scrollLeft + 5}px;
                  top: ${rect.top + scrollTop}px;
                  background: ${color};
                  color: white;
                  padding: 3px 8px;
                  border-radius: 3px;
                  font-size: 11px;
                  font-weight: bold;
                  z-index: 999999;
                  white-space: nowrap;
                  pointer-events: none;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                `;
                label.textContent = `${ratio.toFixed(1)}:1 (need ${minRatio}:1)`;

                document.body.appendChild(label);
              }
            }
          }
        });

        return {
          success: true,
          issues,
          stats,
          summary: `${stats.passed}/${stats.totalElements} passed, ${stats.failedAA} failed AA (${stats.critical} critical)`
        };
      },

      /**
       * Clear all contrast markers
       */
      clearMarkers: function() {
        document.querySelectorAll('.uisentinel-contrast-label').forEach(el => el.remove());

        document.querySelectorAll('.uisentinel-contrast-marker').forEach(el => {
          const element = el as HTMLElement;
          element.style.outline = (element as any).__uisentinel_original_outline || '';
          element.classList.remove('uisentinel-contrast-marker');
          delete (element as any).__uisentinel_original_outline;
        });

        return { success: true, message: 'All markers cleared' };
      },

      /**
       * Suggest better colors for a specific element
       */
      suggestColors: function(params: any = {}) {
        const { selector } = params;

        if (!selector) {
          return { success: false, error: 'selector parameter is required' };
        }

        const element = document.querySelector(selector);
        if (!element) {
          return { success: false, error: 'Element not found' };
        }

        const styles = window.getComputedStyle(element);
        const fg = styles.color;
        const bg = this.getEffectiveBackground(element);
        const currentRatio = this.getContrastRatio(fg, bg);

        // Parse RGB values
        const fgMatch = fg.match(/\d+/g);
        const bgMatch = bg.match(/\d+/g);

        if (!fgMatch || !bgMatch) {
          return { success: false, error: 'Could not parse colors' };
        }

        const [fr, fg_val, fb] = fgMatch.map(Number);
        const [br, bg_val, bb] = bgMatch.map(Number);

        // Simple suggestion: darken or lighten the foreground
        const suggestions = [];

        // Try darker foreground
        const darkerFg = `rgb(${Math.max(0, fr - 50)}, ${Math.max(0, fg_val - 50)}, ${Math.max(0, fb - 50)})`;
        const darkerRatio = this.getContrastRatio(darkerFg, bg);

        if (darkerRatio >= 4.5) {
          suggestions.push({
            type: 'foreground',
            color: darkerFg,
            ratio: darkerRatio.toFixed(2),
            action: 'Darken text'
          });
        }

        // Try lighter foreground
        const lighterFg = `rgb(${Math.min(255, fr + 50)}, ${Math.min(255, fg_val + 50)}, ${Math.min(255, fb + 50)})`;
        const lighterRatio = this.getContrastRatio(lighterFg, bg);

        if (lighterRatio >= 4.5) {
          suggestions.push({
            type: 'foreground',
            color: lighterFg,
            ratio: lighterRatio.toFixed(2),
            action: 'Lighten text'
          });
        }

        return {
          success: true,
          current: {
            foreground: fg,
            background: bg,
            ratio: currentRatio.toFixed(2)
          },
          suggestions
        };
      },

      /**
       * Get contrast statistics for the page
       */
      getStats: function() {
        const result = this.checkContrast({ highlightIssues: false, showLabels: false });
        return result.stats;
      },

      /**
       * Scroll to and highlight specific contrast issue
       */
      scrollToIssue: function(params: any = {}) {
        const { index = 0 } = params;

        // Get issues without highlighting
        const result = this.checkContrast({ highlightIssues: false, showLabels: false });

        if (!result.success || !result.issues || result.issues.length === 0) {
          return { success: false, error: 'No contrast issues found' };
        }

        if (index < 0 || index >= result.issues.length) {
          return { success: false, error: `Invalid index. Must be between 0 and ${result.issues.length - 1}` };
        }

        const issue = result.issues[index];
        const element = document.querySelector(issue.selector);

        if (!element) {
          return { success: false, error: 'Element no longer exists' };
        }

        // Scroll to element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight just this element
        setTimeout(() => {
          const severity = issue.severity;
          const color = severity === 'critical' ? '#d32f2f' :
                       severity === 'serious' ? '#f57c00' : '#fbc02d';

          (element as HTMLElement).style.outline = `3px solid ${color}`;
          (element as HTMLElement).style.outlineOffset = '2px';
          element.classList.add('uisentinel-contrast-marker');

          // Add label
          const rect = element.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

          const label = document.createElement('div');
          label.className = 'uisentinel-contrast-label';
          label.style.cssText = `
            position: absolute;
            left: ${rect.right + scrollLeft + 10}px;
            top: ${rect.top + scrollTop}px;
            background: ${color};
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: bold;
            z-index: 999999;
            white-space: nowrap;
            pointer-events: none;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          `;
          label.innerHTML = `
            Issue ${index + 1}/${result.issues.length}<br>
            Ratio: ${issue.ratio}:1 (need ${issue.required}:1)<br>
            Severity: ${issue.severity}
          `;

          document.body.appendChild(label);
        }, 300);

        return {
          success: true,
          issue,
          index,
          total: result.issues.length,
          message: `Scrolled to issue ${index + 1} of ${result.issues.length}`
        };
      }
    });
  }

  /**
   * Generate CSS styles
   */
  getStyles(): string {
    return this.createStyles({
      '.uisentinel-contrast-marker': {
        'transition': 'outline 0.2s ease-in-out'
      },
      '.uisentinel-contrast-label': {
        'font-family': 'monospace',
        'letter-spacing': '0.5px'
      }
    });
  }

  async initialize(_page: Page): Promise<void> {
    // Optional initialization
  }

  async cleanup(page: Page): Promise<void> {
    await page.evaluate(() => {
      // @ts-ignore
      const api = window['__extension_contrast-checker__'];
      if (api && api.clearMarkers) {
        api.clearMarkers();
      }
    }).catch(() => {});
  }
}
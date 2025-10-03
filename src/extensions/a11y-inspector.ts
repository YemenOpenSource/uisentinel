import { Page } from 'playwright';
import { BaseExtension } from './extension-manager';

/**
 * Accessibility Inspector Extension
 * Visually highlights accessibility issues on the page
 * Similar to Chrome DevTools A11y inspector
 */
export class A11yInspector extends BaseExtension {
  id = 'a11y-inspector';
  name = 'Accessibility Inspector';
  description = 'Visual overlay showing WCAG accessibility violations with tooltips and severity indicators';

  /**
   * Generate browser-side JavaScript code
   */
  getBrowserCode(): string {
    return this.createBrowserAPI({
      /**
       * Show accessibility violations on the page
       * @param params Object containing violations array and options
       */
      showViolations: function(params: any = {}) {
        const {
          violations = [],
          showTooltips = true,
          showSeverityBadges = true,
          enableHover = true,
          colorBySeverity = true
        } = params;

        if (!violations || !Array.isArray(violations)) {
          return { success: false, error: 'violations array is required' };
        }

        // Clear any existing markers
        document.querySelectorAll('.uisentinel-a11y-marker, .uisentinel-a11y-tooltip').forEach(el => el.remove());

        const severityColors = {
          critical: { outline: '#d32f2f', bg: '#d32f2f', badge: '#b71c1c' },
          serious: { outline: '#f57c00', bg: '#f57c00', badge: '#e65100' },
          moderate: { outline: '#fbc02d', bg: '#fbc02d', badge: '#f9a825' },
          minor: { outline: '#7cb342', bg: '#7cb342', badge: '#689f38' }
        };

        let totalMarkers = 0;

        violations.forEach((violation: any, violationIndex: number) => {
          const impact = violation.impact || 'moderate';
          const colors = severityColors[impact as keyof typeof severityColors] || severityColors.moderate;

          violation.nodes.forEach((node: any, nodeIndex: number) => {
            try {
              const selector = node.target[0];
              const element = document.querySelector(selector);

              if (!element) return;

              // Add outline to element
              const originalOutline = (element as HTMLElement).style.outline;
              const originalOutlineOffset = (element as HTMLElement).style.outlineOffset;

              (element as HTMLElement).style.outline = `3px solid ${colors.outline}`;
              (element as HTMLElement).style.outlineOffset = '2px';
              (element as HTMLElement).classList.add('uisentinel-a11y-marker');

              // Store original styles for cleanup
              (element as any).__uisentinel_original_outline = originalOutline;
              (element as any).__uisentinel_original_offset = originalOutlineOffset;

              // Create tooltip
              if (showTooltips) {
                const rect = element.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

                const tooltip = document.createElement('div');
                tooltip.className = 'uisentinel-a11y-tooltip';
                tooltip.setAttribute('data-severity', impact);
                tooltip.setAttribute('data-violation-id', `${violationIndex}-${nodeIndex}`);

                // Tooltip content
                tooltip.innerHTML = `
                  <div class="a11y-tooltip-header">
                    <span class="a11y-severity-badge" style="background: ${colors.badge}">
                      ${impact.toUpperCase()}
                    </span>
                    <span class="a11y-violation-id">#${totalMarkers + 1}</span>
                  </div>
                  <div class="a11y-tooltip-title">${violation.help}</div>
                  <div class="a11y-tooltip-description">${violation.description}</div>
                  <div class="a11y-tooltip-impact">Impact: ${impact}</div>
                  <a href="${violation.helpUrl}" target="_blank" class="a11y-tooltip-link">Learn more →</a>
                `;

                // Position tooltip
                tooltip.style.position = 'absolute';
                tooltip.style.left = `${rect.left + scrollLeft}px`;
                tooltip.style.top = `${rect.top + scrollTop - 10}px`;
                tooltip.style.transform = 'translateY(-100%)';
                tooltip.style.zIndex = '999999';
                tooltip.style.maxWidth = '350px';
                tooltip.style.backgroundColor = colors.bg;
                tooltip.style.color = 'white';
                tooltip.style.padding = '12px';
                tooltip.style.borderRadius = '6px';
                tooltip.style.fontSize = '13px';
                tooltip.style.lineHeight = '1.5';
                tooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                tooltip.style.pointerEvents = 'auto';
                tooltip.style.display = enableHover ? 'none' : 'block';

                document.body.appendChild(tooltip);

                // Show/hide tooltip on hover
                if (enableHover) {
                  element.addEventListener('mouseenter', () => {
                    tooltip.style.display = 'block';
                  });
                  element.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none';
                  });
                }

                totalMarkers++;
              }

            } catch (error) {
              console.warn('Failed to highlight element:', error);
            }
          });
        });

        return {
          success: true,
          markersCreated: totalMarkers,
          violationsProcessed: violations.length
        };
      },

      /**
       * Clear all accessibility markers
       */
      clearViolations: function() {
        // Remove all tooltips
        document.querySelectorAll('.uisentinel-a11y-tooltip').forEach(el => el.remove());

        // Restore original outlines
        document.querySelectorAll('.uisentinel-a11y-marker').forEach(el => {
          const element = el as HTMLElement;
          element.style.outline = (element as any).__uisentinel_original_outline || '';
          element.style.outlineOffset = (element as any).__uisentinel_original_offset || '';
          element.classList.remove('uisentinel-a11y-marker');
          delete (element as any).__uisentinel_original_outline;
          delete (element as any).__uisentinel_original_offset;
        });

        return { success: true, message: 'All markers cleared' };
      },

      /**
       * Highlight a specific violation by index
       */
      highlightViolation: function(params: any = {}) {
        const { violationIndex } = params;

        if (violationIndex === undefined) {
          return { success: false, error: 'violationIndex parameter is required' };
        }

        const tooltip = document.querySelector(`[data-violation-id^="${violationIndex}-"]`) as HTMLElement;
        if (tooltip) {
          tooltip.style.display = 'block';
          tooltip.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Flash the tooltip
          tooltip.style.animation = 'uisentinel-flash 0.5s ease-in-out 2';

          return { success: true, violationIndex };
        }
        return { success: false, error: 'Violation not found' };
      },

      /**
       * Get statistics about current violations
       */
      getStats: function() {
        const markers = document.querySelectorAll('.uisentinel-a11y-marker');
        const tooltips = document.querySelectorAll('.uisentinel-a11y-tooltip');

        const bySeverity: Record<string, number> = {
          critical: 0,
          serious: 0,
          moderate: 0,
          minor: 0
        };

        tooltips.forEach(tooltip => {
          const severity = tooltip.getAttribute('data-severity') || 'moderate';
          bySeverity[severity] = (bySeverity[severity] || 0) + 1;
        });

        return {
          totalMarkers: markers.length,
          totalTooltips: tooltips.length,
          bySeverity
        };
      }
    });
  }

  /**
   * Generate CSS styles for the extension
   */
  getStyles(): string {
    return this.createStyles({
      '.uisentinel-a11y-tooltip': {
        'font-family': 'system-ui, -apple-system, sans-serif',
        'transition': 'opacity 0.2s ease-in-out',
        'cursor': 'default'
      },
      '.a11y-tooltip-header': {
        'display': 'flex',
        'justify-content': 'space-between',
        'align-items': 'center',
        'margin-bottom': '8px',
        'padding-bottom': '8px',
        'border-bottom': '1px solid rgba(255,255,255,0.3)'
      },
      '.a11y-severity-badge': {
        'display': 'inline-block',
        'padding': '3px 8px',
        'border-radius': '3px',
        'font-size': '10px',
        'font-weight': 'bold',
        'letter-spacing': '0.5px'
      },
      '.a11y-violation-id': {
        'font-size': '11px',
        'opacity': '0.8'
      },
      '.a11y-tooltip-title': {
        'font-weight': 'bold',
        'margin-bottom': '6px',
        'font-size': '14px'
      },
      '.a11y-tooltip-description': {
        'margin-bottom': '6px',
        'font-size': '12px',
        'opacity': '0.9'
      },
      '.a11y-tooltip-impact': {
        'font-size': '11px',
        'margin-bottom': '8px',
        'opacity': '0.8'
      },
      '.a11y-tooltip-link': {
        'color': 'white',
        'text-decoration': 'underline',
        'font-size': '12px',
        'display': 'inline-block',
        'margin-top': '4px'
      },
      '.a11y-tooltip-link:hover': {
        'opacity': '0.8'
      }
    }) + `
      @keyframes uisentinel-flash {
        0%, 100% { opacity: 1; transform: translateY(-100%) scale(1); }
        50% { opacity: 0.8; transform: translateY(-100%) scale(1.05); }
      }
    `;
  }

  /**
   * Optional initialization (Node.js side)
   */
  async initialize(page: Page): Promise<void> {
    // Add any server-side initialization if needed
    // For example, we could set up listeners for page events
  }

  /**
   * Cleanup when extension is removed
   */
  async cleanup(page: Page): Promise<void> {
    // Clear all markers before cleanup
    await page.evaluate(() => {
      // @ts-ignore
      const api = window['__extension_a11y-inspector__'];
      if (api && api.clearViolations) {
        api.clearViolations();
      }
    }).catch(() => {
      // Ignore errors if extension wasn't properly injected
    });
  }
}
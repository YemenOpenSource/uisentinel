import { BaseExtension } from './extension-manager';

/**
 * Responsive Design Inspector Extension
 * 
 * Analyzes page elements for responsive design issues including:
 * - Fixed-width elements that should be flexible
 * - Layout types (flex, grid, table, block)
 * - Responsive unit usage (px vs %, rem, vw, etc.)
 * - Elements that exceed viewport width
 * - Suggests specific CSS fixes
 */
export class ResponsiveDesignInspector extends BaseExtension {
  id = 'responsive-design-inspector';
  name = 'Responsive Design Inspector';
  description = 'Analyzes elements for responsive design issues and suggests fixes';

  /**
   * Generate browser-side JavaScript code
   */
  getBrowserCode(): string {
    return this.createBrowserAPI({
      /**
       * Scan for fixed-width elements
       */
      scanFixedWidthElements: function(params: any = {}) {
        const { includeHidden = false, minWidth = 400 } = params;

        const fixedWidthElements: any[] = [];

        try {
          const allElements = document.querySelectorAll('*');

          for (const el of Array.from(allElements)) {
            const element = el as HTMLElement;

            // Skip hidden elements if requested
            if (!includeHidden && element.offsetParent === null) continue;

            // Skip script, style, etc.
            if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK'].includes(element.tagName)) {
              continue;
            }

            const styles = window.getComputedStyle(element);
            const width = styles.width;
            const minWidthStyle = styles.minWidth;
            const maxWidthStyle = styles.maxWidth;

            // Check for fixed pixel widths
            const hasFixedWidth = width && width.match(/^\d+px$/) && parseInt(width) >= minWidth;
            const hasFixedMinWidth = minWidthStyle && minWidthStyle.match(/^\d+px$/) && parseInt(minWidthStyle) >= minWidth;

            if (hasFixedWidth || hasFixedMinWidth) {
              const rect = element.getBoundingClientRect();
              const selector = this.getElementSelector(element);

              // Determine suggested fix
              let suggestedFix = '';
              let priority: 'critical' | 'high' | 'medium' = 'medium';

              if (hasFixedWidth) {
                const widthValue = parseInt(width);
                if (widthValue > window.innerWidth) {
                  priority = 'critical';
                  suggestedFix = `Replace "width: ${width}" with "max-width: 100%; width: auto;"`;
                } else if (widthValue > 1000) {
                  priority = 'high';
                  suggestedFix = `Replace "width: ${width}" with "max-width: ${width}; width: 100%;"`;
                } else {
                  suggestedFix = `Consider replacing "width: ${width}" with flexible units or max-width`;
                }
              } else if (hasFixedMinWidth) {
                priority = 'high';
                suggestedFix = `"min-width: ${minWidthStyle}" prevents element from shrinking on small screens`;
              }

              fixedWidthElements.push({
                selector,
                tagName: element.tagName,
                id: element.id || null,
                className: element.className || null,
                width: width,
                minWidth: minWidthStyle,
                maxWidth: maxWidthStyle,
                computedWidth: rect.width,
                exceedsViewport: rect.width > window.innerWidth,
                priority,
                suggestedFix,
                position: {
                  top: rect.top + window.pageYOffset,
                  left: rect.left + window.pageXOffset
                }
              });
            }
          }

          return {
            success: true,
            elements: fixedWidthElements,
            count: fixedWidthElements.length,
            criticalCount: fixedWidthElements.filter(e => e.priority === 'critical').length,
            highCount: fixedWidthElements.filter(e => e.priority === 'high').length
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Analyze layout types used on the page
       */
      analyzeLayoutTypes: function(params: any = {}) {
        const { containerOnly = true } = params;

        const layouts: any[] = [];

        try {
          // Get elements that are likely containers
          const selectors = containerOnly 
            ? ['div', 'section', 'article', 'main', 'aside', 'header', 'footer', 'nav']
            : ['*'];

          const elements = document.querySelectorAll(selectors.join(','));

          for (const el of Array.from(elements)) {
            const element = el as HTMLElement;

            // Skip hidden or tiny elements
            if (element.offsetParent === null || element.offsetWidth < 100) continue;

            const styles = window.getComputedStyle(element);
            const display = styles.display;
            const position = styles.position;
            const width = styles.width;

            // Detect layout type
            let layoutType = 'block';
            let isResponsive = true;
            let suggestion = '';

            if (display.includes('flex')) {
              layoutType = 'flex';
              const flexWrap = styles.flexWrap;
              if (flexWrap === 'nowrap' && element.children.length > 3) {
                isResponsive = false;
                suggestion = 'Add "flex-wrap: wrap;" to allow items to wrap on small screens';
              }
            } else if (display.includes('grid')) {
              layoutType = 'grid';
              const gridColumns = styles.gridTemplateColumns;
              if (gridColumns && !gridColumns.includes('fr') && !gridColumns.includes('minmax')) {
                isResponsive = false;
                suggestion = 'Use "fr" units or "minmax()" for responsive grid columns';
              }
            } else if (display === 'table' || element.tagName === 'TABLE') {
              layoutType = 'table';
              isResponsive = false;
              suggestion = 'Consider using flexbox or grid for better mobile responsiveness';
            } else if (display === 'inline-block') {
              layoutType = 'inline-block';
              if (element.children.length > 2) {
                isResponsive = false;
                suggestion = 'Consider using flexbox for more flexible layout';
              }
            }

            // Check for fixed widths
            if (width && width.match(/^\d+px$/)) {
              isResponsive = false;
              if (!suggestion) {
                suggestion = `Fixed width (${width}) should use relative units or max-width`;
              }
            }

            if (!isResponsive || layoutType !== 'block') {
              const selector = this.getElementSelector(element);
              layouts.push({
                selector,
                tagName: element.tagName,
                layoutType,
                display,
                isResponsive,
                suggestion,
                childCount: element.children.length,
                width: element.offsetWidth
              });
            }
          }

          const summary = {
            flex: layouts.filter(l => l.layoutType === 'flex').length,
            grid: layouts.filter(l => l.layoutType === 'grid').length,
            table: layouts.filter(l => l.layoutType === 'table').length,
            inlineBlock: layouts.filter(l => l.layoutType === 'inline-block').length,
            nonResponsive: layouts.filter(l => !l.isResponsive).length
          };

          return {
            success: true,
            layouts,
            summary,
            hasIssues: summary.nonResponsive > 0
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Analyze responsive unit usage
       */
      analyzeUnitUsage: function() {
        try {
          const units: any = {
            px: 0,
            percent: 0,
            rem: 0,
            em: 0,
            vw: 0,
            vh: 0,
            fr: 0,
            auto: 0
          };

          const allElements = document.querySelectorAll('*');

          for (const el of Array.from(allElements)) {
            const element = el as HTMLElement;
            if (element.offsetParent === null) continue;

            const styles = window.getComputedStyle(element);
            
            // Check width
            const width = styles.width;
            if (width) {
              if (width.includes('px')) units.px++;
              else if (width.includes('%')) units.percent++;
              else if (width.includes('rem')) units.rem++;
              else if (width.includes('em')) units.em++;
              else if (width.includes('vw')) units.vw++;
              else if (width === 'auto') units.auto++;
            }

            // Check font size
            const fontSize = styles.fontSize;
            if (fontSize) {
              if (fontSize.includes('px')) units.px++;
              else if (fontSize.includes('rem')) units.rem++;
              else if (fontSize.includes('em')) units.em++;
            }
          }

          const total = Object.values(units).reduce((a: any, b: any) => a + b, 0) as number;
          const percentages: any = {};
          
          for (const [unit, count] of Object.entries(units)) {
            percentages[unit] = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
          }

          // Determine if approach is responsive
          const responsiveUnits = units.percent + units.rem + units.em + units.vw + units.vh + units.fr + units.auto;
          const responsiveScore = total > 0 ? Math.round((responsiveUnits / (total as number)) * 100) : 0;

          return {
            success: true,
            units,
            percentages,
            responsiveScore,
            isResponsive: responsiveScore >= 50,
            recommendation: responsiveScore < 50 
              ? 'Use more relative units (%, rem, vw) instead of fixed pixels for better responsiveness'
              : 'Good use of responsive units'
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Detect elements exceeding viewport
       */
      detectViewportOverflow: function() {
        try {
          const overflowingElements: any[] = [];
          const viewportWidth = window.innerWidth;
          const allElements = document.querySelectorAll('*');

          for (const el of Array.from(allElements)) {
            const element = el as HTMLElement;
            if (element.offsetParent === null) continue;

            const rect = element.getBoundingClientRect();
            
            // Check if element extends beyond viewport
            if (rect.width > viewportWidth + 10) { // +10px tolerance
              const styles = window.getComputedStyle(element);
              const selector = this.getElementSelector(element);

              overflowingElements.push({
                selector,
                tagName: element.tagName,
                width: rect.width,
                viewportWidth,
                overflow: rect.width - viewportWidth,
                computedWidth: styles.width,
                minWidth: styles.minWidth,
                suggestedFix: `Add "max-width: 100%;" or "box-sizing: border-box;" to prevent overflow`,
                position: {
                  top: rect.top + window.pageYOffset,
                  left: rect.left + window.pageXOffset
                }
              });
            }
          }

          return {
            success: true,
            hasOverflow: overflowingElements.length > 0,
            elements: overflowingElements,
            count: overflowingElements.length
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Comprehensive responsive analysis
       */
      analyzeResponsiveness: function(params: any = {}) {
        try {
          const fixedWidths = this.scanFixedWidthElements(params);
          const layouts = this.analyzeLayoutTypes(params);
          const units = this.analyzeUnitUsage();
          const overflow = this.detectViewportOverflow();

          // Calculate responsive score (0-100)
          let score = 100;

          // Deduct for fixed widths
          if (fixedWidths.success) {
            score -= fixedWidths.criticalCount * 15;
            score -= fixedWidths.highCount * 10;
            score -= (fixedWidths.count - fixedWidths.criticalCount - fixedWidths.highCount) * 5;
          }

          // Deduct for non-responsive layouts
          if (layouts.success && layouts.summary) {
            score -= layouts.summary.nonResponsive * 10;
            score -= layouts.summary.table * 5;
          }

          // Factor in unit usage
          if (units.success) {
            score -= (100 - units.responsiveScore) * 0.3;
          }

          // Deduct for overflow
          if (overflow.success && overflow.hasOverflow) {
            score -= overflow.count * 10;
          }

          score = Math.max(0, Math.min(100, Math.round(score)));

          return {
            success: true,
            score,
            isResponsive: score >= 70,
            fixedWidthElements: fixedWidths.success ? fixedWidths.elements : [],
            layoutIssues: layouts.success ? layouts.layouts.filter((l: any) => !l.isResponsive) : [],
            unitAnalysis: units.success ? units : null,
            overflowElements: overflow.success ? overflow.elements : [],
            summary: {
              totalIssues: (fixedWidths.count || 0) + (layouts.summary?.nonResponsive || 0) + (overflow.count || 0),
              criticalIssues: fixedWidths.criticalCount || 0,
              highIssues: fixedWidths.highCount || 0
            },
            recommendations: this.generateRecommendations(fixedWidths, layouts, units, overflow)
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Generate actionable recommendations
       */
      generateRecommendations: function(fixedWidths: any, layouts: any, units: any, overflow: any) {
        const recommendations: any[] = [];

        // Fixed width issues
        if (fixedWidths.success && fixedWidths.count > 0) {
          if (fixedWidths.criticalCount > 0) {
            recommendations.push({
              priority: 'critical',
              issue: `${fixedWidths.criticalCount} elements exceed viewport width`,
              fix: 'Add max-width: 100% to prevent horizontal scrolling',
              affectedElements: fixedWidths.elements.filter((e: any) => e.priority === 'critical').length
            });
          }
          
          if (fixedWidths.highCount > 0) {
            recommendations.push({
              priority: 'high',
              issue: `${fixedWidths.highCount} elements have large fixed widths`,
              fix: 'Convert fixed widths to max-width with 100% width or use relative units',
              affectedElements: fixedWidths.highCount
            });
          }
        }

        // Layout issues
        if (layouts.success && layouts.summary && layouts.summary.nonResponsive > 0) {
          recommendations.push({
            priority: 'high',
            issue: `${layouts.summary.nonResponsive} layouts not optimized for mobile`,
            fix: 'Add flex-wrap: wrap or use responsive grid units',
            affectedElements: layouts.summary.nonResponsive
          });
        }

        if (layouts.success && layouts.summary && layouts.summary.table > 0) {
          recommendations.push({
            priority: 'medium',
            issue: `${layouts.summary.table} table layouts detected`,
            fix: 'Consider replacing tables with flexbox or grid for better mobile experience',
            affectedElements: layouts.summary.table
          });
        }

        // Unit usage
        if (units.success && !units.isResponsive) {
          recommendations.push({
            priority: 'medium',
            issue: `Heavy use of fixed pixels (${units.percentages.px}%)`,
            fix: 'Use more relative units: %, rem, em, vw for responsive sizing',
            currentScore: units.responsiveScore
          });
        }

        // Overflow
        if (overflow.success && overflow.hasOverflow) {
          recommendations.push({
            priority: 'critical',
            issue: `${overflow.count} elements cause horizontal overflow`,
            fix: 'Add max-width: 100% and box-sizing: border-box',
            affectedElements: overflow.count
          });
        }

        return recommendations;
      },

      /**
       * Helper to get element selector
       */
      getElementSelector: function(element: HTMLElement): string {
        if (element.id) {
          return `#${element.id}`;
        }
        
        let selector = element.tagName.toLowerCase();
        
        if (element.className && typeof element.className === 'string') {
          const classes = element.className.trim().split(/\s+/);
          if (classes.length > 0 && classes[0]) {
            selector += `.${classes[0]}`;
          }
        }
        
        return selector;
      }
    });
  }

  /**
   * Generate CSS styles
   */
  getStyles(): string {
    return `
      /* Responsive Design Inspector styles */
      .uisentinel-responsive-marker {
        outline: 3px dashed #ff6b6b !important;
        outline-offset: 2px !important;
        position: relative;
      }

      .uisentinel-responsive-marker.critical {
        outline-color: #ff0000 !important;
        background: rgba(255, 0, 0, 0.1) !important;
      }

      .uisentinel-responsive-marker.high {
        outline-color: #ff9800 !important;
        background: rgba(255, 152, 0, 0.1) !important;
      }

      .uisentinel-responsive-label {
        position: absolute;
        background: #ff6b6b;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
        font-family: monospace;
        z-index: 999999;
        pointer-events: none;
        white-space: nowrap;
      }

      .uisentinel-responsive-label.critical {
        background: #ff0000;
      }

      .uisentinel-responsive-label.high {
        background: #ff9800;
      }
    `;
  }
}

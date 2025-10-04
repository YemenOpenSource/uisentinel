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
       * Get source CSS value for a property (not computed)
       * Checks inline styles and stylesheets
       */
      getSourceStyleValue: function(element: HTMLElement, property: string): string | null {
        // Check inline style first
        const inlineValue = (element.style as any)[property];
        if (inlineValue) return inlineValue;

        // Parse stylesheets
        try {
          const sheets = Array.from(document.styleSheets);
          
          for (const sheet of sheets) {
            try {
              const rules = Array.from(sheet.cssRules || sheet.rules || []);
              
              for (const rule of rules) {
                if ((rule as any).style) {
                  const cssRule = rule as CSSStyleRule;
                  
                  // Check if this rule applies to our element
                  try {
                    if (element.matches(cssRule.selectorText)) {
                      const value = cssRule.style.getPropertyValue(property);
                      if (value) return value;
                    }
                  } catch (e) {
                    // Invalid selector, skip
                  }
                }
              }
            } catch (e) {
              // Cross-origin stylesheet, skip
            }
          }
        } catch (e) {
          // Error parsing stylesheets
        }

        return null;
      },

      /**
       * Check if element uses responsive width pattern
       */
      isResponsiveWidth: function(element: HTMLElement): { isResponsive: boolean; reason: string; pattern?: string } {
        const computed = window.getComputedStyle(element);
        const computedWidth = computed.width;
        const computedMaxWidth = computed.maxWidth;
        
        // Get source CSS values (not computed)
        const sourceWidth = this.getSourceStyleValue(element, 'width');
        const sourceMaxWidth = this.getSourceStyleValue(element, 'max-width');
        const sourceMinWidth = this.getSourceStyleValue(element, 'min-width');

        // Pattern 1: max-width + width: 100% (responsive)
        if (sourceMaxWidth && sourceMaxWidth !== 'none' && 
            sourceWidth && (sourceWidth === '100%' || sourceWidth === 'auto')) {
          return { 
            isResponsive: true, 
            reason: 'Uses max-width with flexible width',
            pattern: `max-width: ${sourceMaxWidth}; width: ${sourceWidth}`
          };
        }

        // Pattern 2: width in percentage/vw (responsive)
        if (sourceWidth && (sourceWidth.includes('%') || sourceWidth.includes('vw') || sourceWidth === 'auto')) {
          return { 
            isResponsive: true, 
            reason: 'Uses relative width unit',
            pattern: `width: ${sourceWidth}`
          };
        }

        // Pattern 3: No explicit width set (defaults to auto, responsive)
        if (!sourceWidth || sourceWidth === 'auto') {
          // But check if it has problematic min-width
          if (sourceMinWidth && sourceMinWidth.includes('px')) {
            const minWidthPx = parseInt(sourceMinWidth);
            if (minWidthPx > window.innerWidth) {
              return {
                isResponsive: false,
                reason: `min-width: ${sourceMinWidth} exceeds viewport`,
                pattern: `min-width: ${sourceMinWidth}`
              };
            }
          }
          return { 
            isResponsive: true, 
            reason: 'No fixed width set',
            pattern: 'width: auto (default)'
          };
        }

        // Pattern 4: Fixed pixel width without max-width (non-responsive)
        if (sourceWidth && sourceWidth.includes('px')) {
          const widthPx = parseInt(sourceWidth);
          
          // If it's a small fixed width, it's okay
          if (widthPx < 300) {
            return { 
              isResponsive: true, 
              reason: 'Small fixed width acceptable',
              pattern: `width: ${sourceWidth}`
            };
          }
          
          // Large fixed width is problematic
          return {
            isResponsive: false,
            reason: `Fixed width ${sourceWidth} without max-width`,
            pattern: `width: ${sourceWidth}`
          };
        }

        // Pattern 5: Uses rem/em (responsive)
        if (sourceWidth && (sourceWidth.includes('rem') || sourceWidth.includes('em'))) {
          return { 
            isResponsive: true, 
            reason: 'Uses relative em/rem units',
            pattern: `width: ${sourceWidth}`
          };
        }

        // Default: check computed width
        const rect = element.getBoundingClientRect();
        if (rect.width <= window.innerWidth) {
          return { 
            isResponsive: true, 
            reason: 'Fits within viewport',
            pattern: 'width: (fits)'
          };
        }

        return {
          isResponsive: false,
          reason: 'Exceeds viewport width',
          pattern: computedWidth
        };
      },

      /**
       * Check if element is in a scrollable container
       */
      isInScrollableContainer: function(element: HTMLElement): boolean {
        let parent = element.parentElement;
        
        while (parent && parent !== document.body) {
          const styles = window.getComputedStyle(parent);
          const overflowX = styles.overflowX;
          
          if (overflowX === 'auto' || overflowX === 'scroll') {
            return true;
          }
          
          parent = parent.parentElement;
        }
        
        return false;
      },

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

            // Check if width is responsive using source CSS
            const responsiveCheck = this.isResponsiveWidth(element);
            
            // Only flag if non-responsive and significant size
            const rect = element.getBoundingClientRect();
            if (!responsiveCheck.isResponsive && rect.width >= minWidth) {
              const selector = this.getElementSelector(element);
              const computed = window.getComputedStyle(element);

              // Determine priority and suggested fix
              let priority: 'critical' | 'high' | 'medium' = 'medium';
              let suggestedFix = '';

              if (rect.width > window.innerWidth) {
                priority = 'critical';
                suggestedFix = `Add "max-width: 100%; width: auto;" - ${responsiveCheck.reason}`;
              } else if (rect.width > 1000) {
                priority = 'high';
                suggestedFix = `Use "max-width: ${rect.width}px; width: 100%;" - ${responsiveCheck.reason}`;
              } else {
                suggestedFix = responsiveCheck.reason;
              }

              fixedWidthElements.push({
                selector,
                tagName: element.tagName,
                id: element.id || null,
                className: element.className || null,
                sourceWidth: responsiveCheck.pattern,
                computedWidth: rect.width,
                exceedsViewport: rect.width > window.innerWidth,
                priority,
                suggestedFix,
                reason: responsiveCheck.reason,
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
            
            // Check responsive width using source CSS
            const responsiveCheck = this.isResponsiveWidth(element);

            // Detect layout type
            let layoutType = 'block';
            let isResponsive = responsiveCheck.isResponsive;
            let suggestion = '';

            if (display.includes('flex')) {
              layoutType = 'flex';
              const flexWrap = styles.flexWrap;
              
              // Only flag nowrap if it has many children AND they're wide
              if (flexWrap === 'nowrap' && element.children.length > 3) {
                let totalChildWidth = 0;
                Array.from(element.children).forEach((child: any) => {
                  totalChildWidth += child.offsetWidth;
                });
                
                // If children overflow, suggest wrap
                if (totalChildWidth > element.offsetWidth) {
                  isResponsive = false;
                  suggestion = 'Add "flex-wrap: wrap;" to allow items to wrap on small screens';
                }
              }
            } else if (display.includes('grid')) {
              layoutType = 'grid';
              const gridColumns = styles.gridTemplateColumns;
              
              // Only flag if using only fixed units
              if (gridColumns && !gridColumns.includes('fr') && !gridColumns.includes('minmax') && 
                  !gridColumns.includes('%') && !gridColumns.includes('auto')) {
                isResponsive = false;
                suggestion = 'Use "fr" units, "minmax()", or "auto" for responsive grid columns';
              }
            } else if (display === 'table' || element.tagName === 'TABLE') {
              layoutType = 'table';
              
              // Tables are only problematic if not in overflow container
              if (!this.isInScrollableContainer(element)) {
                isResponsive = false;
                suggestion = 'Wrap in <div style="overflow-x: auto;"> or use flexbox/grid instead';
              } else {
                isResponsive = true; // Tables in scroll containers are fine
                suggestion = 'Table in scrollable container - OK for mobile';
              }
            } else if (display === 'inline-block') {
              layoutType = 'inline-block';
              if (element.children.length > 2) {
                isResponsive = false;
                suggestion = 'Consider using flexbox for more flexible layout';
              }
            }

            // Override with width check
            if (!responsiveCheck.isResponsive) {
              isResponsive = false;
              if (!suggestion) {
                suggestion = responsiveCheck.reason;
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
       * Analyze responsive unit usage (from source CSS, not computed)
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

          // Parse stylesheets for actual CSS values
          const sheets = Array.from(document.styleSheets);
          
          for (const sheet of sheets) {
            try {
              const rules = Array.from(sheet.cssRules || sheet.rules || []);
              
              for (const rule of rules) {
                if ((rule as any).style) {
                  const cssRule = rule as CSSStyleRule;
                  const style = cssRule.style;
                  
                  // Check width property
                  const width = style.getPropertyValue('width');
                  if (width) {
                    if (width.includes('px')) units.px++;
                    else if (width.includes('%')) units.percent++;
                    else if (width.includes('rem')) units.rem++;
                    else if (width.includes('em')) units.em++;
                    else if (width.includes('vw')) units.vw++;
                    else if (width.includes('vh')) units.vh++;
                    else if (width === 'auto') units.auto++;
                  }
                  
                  // Check max-width (responsive pattern)
                  const maxWidth = style.getPropertyValue('max-width');
                  if (maxWidth && maxWidth !== 'none') {
                    if (maxWidth.includes('px')) units.px++;
                    else if (maxWidth.includes('%')) units.percent++;
                    else if (maxWidth.includes('rem')) units.rem++;
                    else if (maxWidth.includes('em')) units.em++;
                    else if (maxWidth.includes('vw')) units.vw++;
                  }
                  
                  // Check font-size
                  const fontSize = style.getPropertyValue('font-size');
                  if (fontSize) {
                    if (fontSize.includes('px')) units.px++;
                    else if (fontSize.includes('rem')) units.rem++;
                    else if (fontSize.includes('em')) units.em++;
                  }
                  
                  // Check padding/margin (important for spacing)
                  ['padding', 'margin', 'padding-top', 'padding-bottom', 'margin-top', 'margin-bottom'].forEach(prop => {
                    const value = style.getPropertyValue(prop);
                    if (value) {
                      if (value.includes('px')) units.px++;
                      else if (value.includes('%')) units.percent++;
                      else if (value.includes('rem')) units.rem++;
                      else if (value.includes('em')) units.em++;
                    }
                  });
                }
              }
            } catch (e) {
              // Cross-origin stylesheet, skip
            }
          }

          const total = Object.values(units).reduce((a: any, b: any) => a + b, 0) as number;
          const percentages: any = {};
          
          for (const [unit, count] of Object.entries(units)) {
            percentages[unit] = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
          }

          // Determine if approach is responsive
          const responsiveUnits = units.percent + units.rem + units.em + units.vw + units.vh + units.fr + units.auto;
          const responsiveScore = total > 0 ? Math.round((responsiveUnits / (total as number)) * 100) : 100;

          return {
            success: true,
            units,
            percentages,
            responsiveScore,
            isResponsive: responsiveScore >= 40, // Lower threshold since some px is OK
            recommendation: responsiveScore < 40 
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
              
              // Skip if element is in a scrollable container (intentional overflow)
              if (this.isInScrollableContainer(element)) {
                continue;
              }

              const styles = window.getComputedStyle(element);
              const selector = this.getElementSelector(element);
              
              // Check if element itself is scrollable
              const overflowX = styles.overflowX;
              if (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden') {
                continue; // This overflow is handled/intentional
              }

              overflowingElements.push({
                selector,
                tagName: element.tagName,
                width: rect.width,
                viewportWidth,
                overflow: rect.width - viewportWidth,
                computedWidth: styles.width,
                minWidth: styles.minWidth,
                suggestedFix: `Add "max-width: 100%;" or wrap in container with "overflow-x: auto;"`,
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

          // Calculate responsive score (0-100) - NEW BALANCED FORMULA
          let score = 70; // Start at 70 (neutral)

          // Add points for good practices
          if (units.success && units.responsiveScore >= 50) {
            score += 15; // Bonus for using responsive units
          } else if (units.success && units.responsiveScore >= 30) {
            score += 10; // Partial credit
          }

          // Count responsive layouts as positive
          if (layouts.success && layouts.summary) {
            const responsiveLayouts = layouts.layouts.filter((l: any) => l.isResponsive).length;
            score += Math.min(15, responsiveLayouts * 2); // Up to +15 for responsive layouts
          }

          // Deduct for actual issues (reduced penalties)
          if (fixedWidths.success) {
            score -= fixedWidths.criticalCount * 10; // Reduced from 15
            score -= fixedWidths.highCount * 5;      // Reduced from 10
            score -= (fixedWidths.count - fixedWidths.criticalCount - fixedWidths.highCount) * 2; // Reduced from 5
          }

          // Deduct for non-responsive layouts (reduced)
          if (layouts.success && layouts.summary) {
            score -= layouts.summary.nonResponsive * 3; // Reduced from 10
          }

          // Deduct for overflow (only real overflow)
          if (overflow.success && overflow.hasOverflow) {
            score -= overflow.count * 5; // Reduced from 10
          }

          score = Math.max(0, Math.min(100, Math.round(score)));

          // Determine overall responsiveness
          const isResponsive = score >= 60;

          return {
            success: true,
            score,
            isResponsive,
            fixedWidthElements: fixedWidths.success ? fixedWidths.elements : [],
            layoutIssues: layouts.success ? layouts.layouts.filter((l: any) => !l.isResponsive) : [],
            layoutSuccesses: layouts.success ? layouts.layouts.filter((l: any) => l.isResponsive) : [],
            unitAnalysis: units.success ? units : null,
            overflowElements: overflow.success ? overflow.elements : [],
            summary: {
              totalIssues: (fixedWidths.count || 0) + (layouts.summary?.nonResponsive || 0) + (overflow.count || 0),
              criticalIssues: fixedWidths.criticalCount || 0,
              highIssues: fixedWidths.highCount || 0,
              responsivePatterns: layouts.success ? layouts.layouts.filter((l: any) => l.isResponsive).length : 0
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

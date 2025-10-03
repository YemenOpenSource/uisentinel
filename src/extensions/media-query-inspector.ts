import { BaseExtension } from './extension-manager';

/**
 * Media Query Inspector Extension
 * 
 * Analyzes CSS media queries to understand responsive breakpoints,
 * test their effectiveness, and suggest improvements.
 * 
 * Features:
 * - Extract all @media rules from stylesheets
 * - List all defined breakpoints
 * - Test media query effectiveness at different viewports
 * - Identify redundant or unused media queries
 * - Suggest missing breakpoints
 * - Detect mobile-first vs desktop-first approach
 */
export class MediaQueryInspector extends BaseExtension {
  id = 'media-query-inspector';
  name = 'Media Query Inspector';
  description = 'Analyzes CSS media queries and responsive breakpoints';

  /**
   * Generate browser-side JavaScript code
   */
  getBrowserCode(): string {
    return this.createBrowserAPI({
      /**
       * Extract all media queries from stylesheets
       */
      extractMediaQueries: function(params: any = {}) {
        const { includeInline = true } = params;

        const mediaQueries: any[] = [];
        const breakpoints = new Set<number>();

        try {
          // Get all stylesheets (external and inline)
          const stylesheets = Array.from(document.styleSheets);

          for (const stylesheet of stylesheets) {
            try {
              // Skip if stylesheet is from different origin
              const rules = stylesheet.cssRules || stylesheet.rules;
              if (!rules) continue;

              for (const rule of Array.from(rules)) {
                if (rule instanceof CSSMediaRule) {
                  const mediaText = rule.media.mediaText;
                  
                  // Parse min-width and max-width values
                  const minWidthMatch = mediaText.match(/min-width:\s*(\d+)px/);
                  const maxWidthMatch = mediaText.match(/max-width:\s*(\d+)px/);
                  
                  const minWidth = minWidthMatch ? parseInt(minWidthMatch[1]) : undefined;
                  const maxWidth = maxWidthMatch ? parseInt(maxWidthMatch[1]) : undefined;

                  // Add to breakpoints
                  if (minWidth) breakpoints.add(minWidth);
                  if (maxWidth) breakpoints.add(maxWidth);

                  // Get CSS rules within this media query
                  const cssRules: string[] = [];
                  for (const innerRule of Array.from(rule.cssRules)) {
                    cssRules.push(innerRule.cssText);
                  }

                  mediaQueries.push({
                    mediaText,
                    minWidth,
                    maxWidth,
                    cssRules,
                    ruleCount: rule.cssRules.length,
                    source: (stylesheet as any).href || 'inline'
                  });
                }
              }
            } catch (e) {
              // Cross-origin stylesheet - skip
              console.warn('Cannot access stylesheet:', e);
            }
          }

          // Sort breakpoints
          const sortedBreakpoints = Array.from(breakpoints).sort((a, b) => a - b);

          // Detect approach (mobile-first vs desktop-first)
          const minWidthCount = mediaQueries.filter(mq => mq.minWidth).length;
          const maxWidthCount = mediaQueries.filter(mq => mq.maxWidth).length;
          const approach = minWidthCount > maxWidthCount ? 'mobile-first' : 
                          maxWidthCount > minWidthCount ? 'desktop-first' : 'mixed';

          return {
            success: true,
            hasMediaQueries: mediaQueries.length > 0,
            mediaQueries,
            breakpoints: sortedBreakpoints,
            approach,
            stats: {
              totalMediaQueries: mediaQueries.length,
              minWidthQueries: minWidthCount,
              maxWidthQueries: maxWidthCount,
              uniqueBreakpoints: sortedBreakpoints.length
            }
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Test media query effectiveness at current viewport
       */
      testMediaQueryEffectiveness: function(params: any = {}) {
        const { breakpoint } = params;

        try {
          const currentWidth = window.innerWidth;
          const testWidth = breakpoint || currentWidth;

          // Extract media queries
          const result = this.extractMediaQueries();
          if (!result.success) return result;

          const activeQueries: any[] = [];
          const inactiveQueries: any[] = [];

          // Test each media query
          for (const mq of result.mediaQueries) {
            let isActive = false;

            // Test if media query matches current/test viewport
            if (mq.minWidth && mq.maxWidth) {
              isActive = testWidth >= mq.minWidth && testWidth <= mq.maxWidth;
            } else if (mq.minWidth) {
              isActive = testWidth >= mq.minWidth;
            } else if (mq.maxWidth) {
              isActive = testWidth <= mq.maxWidth;
            } else {
              // No width restrictions - always active
              isActive = true;
            }

            if (isActive) {
              activeQueries.push(mq);
            } else {
              inactiveQueries.push(mq);
            }
          }

          return {
            success: true,
            testWidth,
            currentWidth,
            activeQueries,
            inactiveQueries,
            stats: {
              active: activeQueries.length,
              inactive: inactiveQueries.length,
              effectivenessRatio: result.mediaQueries.length > 0 
                ? activeQueries.length / result.mediaQueries.length 
                : 0
            }
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Suggest missing breakpoints based on common standards
       */
      suggestBreakpoints: function() {
        try {
          // Common breakpoints
          const standardBreakpoints = {
            mobile: 375,
            mobileLarge: 425,
            tablet: 768,
            laptop: 1024,
            desktop: 1280,
            desktopLarge: 1920
          };

          // Extract current breakpoints
          const result = this.extractMediaQueries();
          if (!result.success) return result;

          const currentBreakpoints = new Set(result.breakpoints);
          const missingBreakpoints: any[] = [];

          // Check which standard breakpoints are missing
          for (const [name, value] of Object.entries(standardBreakpoints)) {
            if (!currentBreakpoints.has(value)) {
              missingBreakpoints.push({
                name,
                value,
                recommendation: `Add @media (min-width: ${value}px) for ${name} devices`
              });
            }
          }

          return {
            success: true,
            currentBreakpoints: result.breakpoints,
            standardBreakpoints: Object.values(standardBreakpoints),
            missingBreakpoints,
            hasMissingBreakpoints: missingBreakpoints.length > 0
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Analyze breakpoint gaps (large gaps between breakpoints)
       */
      analyzeBreakpointGaps: function() {
        try {
          const result = this.extractMediaQueries();
          if (!result.success) return result;

          const breakpoints = result.breakpoints;
          const gaps: any[] = [];

          // Check gaps between consecutive breakpoints
          for (let i = 0; i < breakpoints.length - 1; i++) {
            const gap = breakpoints[i + 1] - breakpoints[i];
            
            // Flag gaps > 300px as potentially problematic
            if (gap > 300) {
              gaps.push({
                from: breakpoints[i],
                to: breakpoints[i + 1],
                gap,
                severity: gap > 500 ? 'high' : 'medium',
                recommendation: `Consider adding intermediate breakpoint around ${Math.round((breakpoints[i] + breakpoints[i + 1]) / 2)}px`
              });
            }
          }

          return {
            success: true,
            breakpoints,
            gaps,
            hasLargeGaps: gaps.length > 0,
            averageGap: breakpoints.length > 1 
              ? (breakpoints[breakpoints.length - 1] - breakpoints[0]) / (breakpoints.length - 1)
              : 0
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Check for redundant media queries
       */
      detectRedundantQueries: function() {
        try {
          const result = this.extractMediaQueries();
          if (!result.success) return result;

          const redundant: any[] = [];
          const queries = result.mediaQueries;

          // Check for overlapping media queries with similar rules
          for (let i = 0; i < queries.length; i++) {
            for (let j = i + 1; j < queries.length; j++) {
              const q1 = queries[i];
              const q2 = queries[j];

              // Check if breakpoints overlap
              const overlaps = (
                (q1.minWidth && q2.minWidth && q1.minWidth === q2.minWidth) ||
                (q1.maxWidth && q2.maxWidth && q1.maxWidth === q2.maxWidth) ||
                (q1.minWidth && q2.maxWidth && q1.minWidth <= q2.maxWidth) ||
                (q2.minWidth && q1.maxWidth && q2.minWidth <= q1.maxWidth)
              );

              if (overlaps && q1.ruleCount > 0 && q2.ruleCount > 0) {
                redundant.push({
                  query1: q1.mediaText,
                  query2: q2.mediaText,
                  reason: 'Overlapping breakpoint ranges',
                  recommendation: 'Consider consolidating these media queries'
                });
              }
            }
          }

          return {
            success: true,
            redundantQueries: redundant,
            hasRedundancy: redundant.length > 0,
            totalChecked: queries.length
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Generate comprehensive media query report
       */
      generateReport: function() {
        try {
          const extraction = this.extractMediaQueries();
          const suggestions = this.suggestBreakpoints();
          const gaps = this.analyzeBreakpointGaps();
          const redundancy = this.detectRedundantQueries();

          // Calculate score (0-100)
          let score = 100;
          
          // Deduct points for issues
          if (!extraction.hasMediaQueries) score -= 50; // No media queries at all
          if (suggestions.hasMissingBreakpoints) score -= suggestions.missingBreakpoints.length * 5;
          if (gaps.hasLargeGaps) score -= gaps.gaps.length * 10;
          if (redundancy.hasRedundancy) score -= redundancy.redundantQueries.length * 5;

          score = Math.max(0, Math.min(100, score));

          return {
            success: true,
            score,
            hasMediaQueries: extraction.hasMediaQueries,
            approach: extraction.approach,
            breakpoints: extraction.breakpoints,
            stats: extraction.stats,
            missingBreakpoints: suggestions.missingBreakpoints,
            breakpointGaps: gaps.gaps,
            redundantQueries: redundancy.redundantQueries,
            recommendations: this.generateRecommendations(extraction, suggestions, gaps, redundancy)
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
      generateRecommendations: function(extraction: any, suggestions: any, gaps: any, redundancy: any) {
        const recommendations: any[] = [];

        // No media queries
        if (!extraction.hasMediaQueries) {
          recommendations.push({
            priority: 'critical',
            issue: 'No media queries found',
            fix: 'Add responsive media queries at standard breakpoints: 768px (tablet), 1024px (laptop), 1920px (desktop)',
            example: '@media (min-width: 768px) { /* tablet styles */ }'
          });
        }

        // Missing breakpoints
        if (suggestions.hasMissingBreakpoints) {
          for (const bp of suggestions.missingBreakpoints) {
            recommendations.push({
              priority: 'high',
              issue: `Missing ${bp.name} breakpoint`,
              fix: bp.recommendation,
              example: `@media (min-width: ${bp.value}px) { /* ${bp.name} styles */ }`
            });
          }
        }

        // Large gaps
        if (gaps.hasLargeGaps) {
          for (const gap of gaps.gaps) {
            recommendations.push({
              priority: gap.severity === 'high' ? 'high' : 'medium',
              issue: `Large gap (${gap.gap}px) between breakpoints`,
              fix: gap.recommendation
            });
          }
        }

        // Redundancy
        if (redundancy.hasRedundancy) {
          for (const red of redundancy.redundantQueries) {
            recommendations.push({
              priority: 'low',
              issue: 'Redundant media queries detected',
              fix: red.recommendation,
              queries: [red.query1, red.query2]
            });
          }
        }

        return recommendations;
      }
    });
  }

  /**
   * Generate CSS styles for the extension
   */
  getStyles(): string {
    return `
      /* Media Query Inspector styles */
      .uisentinel-mq-marker {
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(102, 126, 234, 0.95);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 14px;
        font-weight: 600;
        z-index: 999999;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        pointer-events: none;
      }

      .uisentinel-mq-list {
        position: fixed;
        top: 60px;
        right: 10px;
        background: white;
        border: 2px solid #667eea;
        border-radius: 8px;
        padding: 15px;
        max-height: 400px;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 13px;
        z-index: 999998;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .uisentinel-mq-item {
        margin-bottom: 10px;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 4px;
        border-left: 3px solid #667eea;
      }

      .uisentinel-mq-item.active {
        background: #e7f3ff;
        border-left-color: #28a745;
      }

      .uisentinel-mq-item.inactive {
        opacity: 0.5;
      }
    `;
  }
}

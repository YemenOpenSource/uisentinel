import { BaseExtension } from './extension-manager';

/**
 * Mobile UX Analyzer Extension
 * 
 * Analyzes mobile-specific UX issues including:
 * - Touch target sizes (WCAG 2.1 requires >= 44x44px)
 * - Text readability (minimum font sizes)
 * - Tap area collisions (overlapping interactive elements)
 * - Mobile viewport meta tag
 * - Mobile-first best practices
 */
export class MobileUXAnalyzer extends BaseExtension {
  id = 'mobile-ux-analyzer';
  name = 'Mobile UX Analyzer';
  description = 'Validates mobile UX and accessibility requirements';

  /**
   * Generate browser-side JavaScript code
   */
  getBrowserCode(): string {
    return this.createBrowserAPI({
      /**
       * Validate touch target sizes
       */
      analyzeTouchTargets: function(params: any = {}) {
        const { minSize = 44, includeHidden = false } = params;

        const touchTargets: any[] = [];

        try {
          // Interactive elements
          const selectors = [
            'a', 'button', 'input:not([type="hidden"])', 'select', 'textarea',
            '[onclick]', '[role="button"]', '[role="link"]', '[tabindex]:not([tabindex="-1"])'
          ];

          const elements = document.querySelectorAll(selectors.join(','));

          for (const el of Array.from(elements)) {
            const element = el as HTMLElement;

            // Skip hidden elements if requested
            if (!includeHidden && element.offsetParent === null) continue;

            const rect = element.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Check if meets WCAG 2.1 requirements (44x44px)
            const meetsWCAG = width >= minSize && height >= minSize;
            
            // Get element text
            const text = element.textContent?.trim().substring(0, 50) || '';
            
            // Determine severity
            let severity: 'critical' | 'high' | 'medium' = 'medium';
            if (element.tagName === 'BUTTON' || element.tagName === 'A') {
              severity = !meetsWCAG ? 'high' : 'medium';
            }
            if (width < 32 || height < 32) {
              severity = 'critical';
            }

            // Build selector
            const selector = this.getElementSelector(element);

            if (!meetsWCAG) {
              touchTargets.push({
                selector,
                tagName: element.tagName,
                text: text || `<${element.tagName.toLowerCase()}>`,
                width: Math.round(width),
                height: Math.round(height),
                meetsWCAG,
                severity,
                gap: {
                  width: Math.max(0, minSize - width),
                  height: Math.max(0, minSize - height)
                },
                recommendation: `Increase size to at least ${minSize}×${minSize}px. Current: ${Math.round(width)}×${Math.round(height)}px`,
                suggestedCSS: this.generateTouchTargetFix(element, width, height, minSize),
                position: {
                  top: rect.top + window.pageYOffset,
                  left: rect.left + window.pageXOffset
                }
              });
            }
          }

          // Sort by severity
          touchTargets.sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2 };
            return severityOrder[a.severity] - severityOrder[b.severity];
          });

          return {
            success: true,
            touchTargets,
            count: touchTargets.length,
            criticalCount: touchTargets.filter(t => t.severity === 'critical').length,
            highCount: touchTargets.filter(t => t.severity === 'high').length,
            wcagCompliance: touchTargets.length === 0
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Generate CSS fix for touch target
       */
      generateTouchTargetFix: function(element: HTMLElement, width: number, height: number, minSize: number) {
        const suggestions: string[] = [];

        if (width < minSize) {
          const paddingNeeded = Math.ceil((minSize - width) / 2);
          suggestions.push(`padding-left: ${paddingNeeded}px;`);
          suggestions.push(`padding-right: ${paddingNeeded}px;`);
        }

        if (height < minSize) {
          const paddingNeeded = Math.ceil((minSize - height) / 2);
          suggestions.push(`padding-top: ${paddingNeeded}px;`);
          suggestions.push(`padding-bottom: ${paddingNeeded}px;`);
        }

        // Alternative: set min dimensions
        suggestions.push(`min-width: ${minSize}px;`);
        suggestions.push(`min-height: ${minSize}px;`);

        return suggestions.join(' ');
      },

      /**
       * Analyze text readability on mobile
       */
      analyzeTextReadability: function(params: any = {}) {
        const { minFontSize = 16, viewport = 375 } = params;

        const readabilityIssues: any[] = [];

        try {
          // Elements with text content
          const textElements = document.querySelectorAll('p, span, div, a, button, li, td, th, h1, h2, h3, h4, h5, h6, label');

          for (const el of Array.from(textElements)) {
            const element = el as HTMLElement;

            // Skip if no text or hidden
            if (!element.textContent?.trim() || element.offsetParent === null) continue;

            const styles = window.getComputedStyle(element);
            const fontSize = parseFloat(styles.fontSize);
            const lineHeight = parseFloat(styles.lineHeight);
            
            // Check if font size is too small
            if (fontSize < minFontSize) {
              const selector = this.getElementSelector(element);
              const text = element.textContent.trim().substring(0, 50);

              readabilityIssues.push({
                selector,
                tagName: element.tagName,
                text: text + (text.length >= 50 ? '...' : ''),
                fontSize: Math.round(fontSize),
                lineHeight: isNaN(lineHeight) ? 'normal' : Math.round(lineHeight),
                minFontSize,
                isReadableOnMobile: false,
                priority: fontSize < 12 ? 'high' : 'medium',
                recommendation: `Increase font-size to at least ${minFontSize}px for better mobile readability`,
                suggestedCSS: `font-size: ${minFontSize}px; /* was ${Math.round(fontSize)}px */`
              });
            }
          }

          return {
            success: true,
            readabilityIssues,
            count: readabilityIssues.length,
            wcagCompliance: readabilityIssues.length === 0
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Detect tap area collisions (overlapping interactive elements)
       */
      detectTapCollisions: function(params: any = {}) {
        const { minSpacing = 8 } = params;

        const collisions: any[] = [];

        try {
          const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [onclick], [role="button"]');
          const elements = Array.from(interactiveElements) as HTMLElement[];

          // Check each pair of elements
          for (let i = 0; i < elements.length; i++) {
            for (let j = i + 1; j < elements.length; j++) {
              const el1 = elements[i];
              const el2 = elements[j];

              // Skip hidden elements
              if (el1.offsetParent === null || el2.offsetParent === null) continue;

              const rect1 = el1.getBoundingClientRect();
              const rect2 = el2.getBoundingClientRect();

              // Calculate distance between elements
              const horizontalDistance = Math.max(0, 
                Math.max(rect1.left, rect2.left) - Math.min(rect1.right, rect2.right)
              );
              
              const verticalDistance = Math.max(0,
                Math.max(rect1.top, rect2.top) - Math.min(rect1.bottom, rect2.bottom)
              );

              // Check if elements are too close
              const distance = Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2);
              
              if (distance < minSpacing) {
                const selector1 = this.getElementSelector(el1);
                const selector2 = this.getElementSelector(el2);

                collisions.push({
                  element1: {
                    selector: selector1,
                    tagName: el1.tagName,
                    text: el1.textContent?.trim().substring(0, 30) || ''
                  },
                  element2: {
                    selector: selector2,
                    tagName: el2.tagName,
                    text: el2.textContent?.trim().substring(0, 30) || ''
                  },
                  distance: Math.round(distance),
                  minSpacing,
                  severity: distance < 4 ? 'high' : 'medium',
                  recommendation: `Add at least ${minSpacing}px spacing between interactive elements to prevent mis-taps`
                });
              }
            }
          }

          return {
            success: true,
            collisions,
            count: collisions.length,
            hasCollisions: collisions.length > 0
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Check mobile viewport meta tag
       */
      checkViewportMeta: function() {
        try {
          const metaViewport = document.querySelector('meta[name="viewport"]');
          
          if (!metaViewport) {
            return {
              success: true,
              hasViewportMeta: false,
              isValid: false,
              recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> to <head>',
              priority: 'critical'
            };
          }

          const content = metaViewport.getAttribute('content') || '';
          
          // Check for required attributes
          const hasWidthDevice = content.includes('width=device-width');
          const hasInitialScale = content.includes('initial-scale=1');
          const hasUserScalable = !content.includes('user-scalable=no'); // Should allow zooming
          
          const isValid = hasWidthDevice && hasInitialScale;

          const issues: string[] = [];
          if (!hasWidthDevice) issues.push('Missing "width=device-width"');
          if (!hasInitialScale) issues.push('Missing "initial-scale=1"');
          if (!hasUserScalable) issues.push('Should allow user scaling (remove user-scalable=no)');

          return {
            success: true,
            hasViewportMeta: true,
            content,
            isValid,
            hasWidthDevice,
            hasInitialScale,
            hasUserScalable,
            issues,
            recommendation: issues.length > 0 
              ? `Fix viewport meta tag: ${issues.join(', ')}`
              : 'Viewport meta tag is correctly configured'
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Comprehensive mobile UX analysis
       */
      analyzeMobileUX: function(params: any = {}) {
        try {
          const touchTargets = this.analyzeTouchTargets(params);
          const textReadability = this.analyzeTextReadability(params);
          const tapCollisions = this.detectTapCollisions(params);
          const viewportMeta = this.checkViewportMeta();

          // Calculate mobile UX score (0-100)
          let score = 100;

          // Deduct for touch target issues
          if (touchTargets.success) {
            score -= touchTargets.criticalCount * 15;
            score -= touchTargets.highCount * 10;
            score -= (touchTargets.count - touchTargets.criticalCount - touchTargets.highCount) * 5;
          }

          // Deduct for readability issues
          if (textReadability.success) {
            score -= textReadability.count * 5;
          }

          // Deduct for collisions
          if (tapCollisions.success) {
            score -= tapCollisions.count * 8;
          }

          // Deduct for missing/invalid viewport meta
          if (viewportMeta.success && !viewportMeta.isValid) {
            score -= 20;
          }

          score = Math.max(0, Math.min(100, Math.round(score)));

          return {
            success: true,
            score,
            isMobileFriendly: score >= 70,
            touchTargets: touchTargets.success ? touchTargets.touchTargets : [],
            readabilityIssues: textReadability.success ? textReadability.readabilityIssues : [],
            tapCollisions: tapCollisions.success ? tapCollisions.collisions : [],
            viewportMeta: viewportMeta.success ? viewportMeta : null,
            summary: {
              totalIssues: (touchTargets.count || 0) + (textReadability.count || 0) + (tapCollisions.count || 0),
              touchTargetIssues: touchTargets.count || 0,
              readabilityIssues: textReadability.count || 0,
              collisionIssues: tapCollisions.count || 0,
              wcagCompliance: touchTargets.wcagCompliance && textReadability.wcagCompliance
            },
            recommendations: this.generateMobileRecommendations(touchTargets, textReadability, tapCollisions, viewportMeta)
          };

        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Generate mobile UX recommendations
       */
      generateMobileRecommendations: function(touchTargets: any, textReadability: any, tapCollisions: any, viewportMeta: any) {
        const recommendations: any[] = [];

        // Viewport meta
        if (viewportMeta.success && !viewportMeta.isValid) {
          recommendations.push({
            priority: 'critical',
            category: 'viewport',
            issue: viewportMeta.hasViewportMeta ? 'Invalid viewport meta tag' : 'Missing viewport meta tag',
            fix: viewportMeta.recommendation
          });
        }

        // Touch targets
        if (touchTargets.success && touchTargets.count > 0) {
          if (touchTargets.criticalCount > 0) {
            recommendations.push({
              priority: 'critical',
              category: 'touch-targets',
              issue: `${touchTargets.criticalCount} interactive elements are too small (< 32px)`,
              fix: 'Increase touch target size to at least 44×44px using padding or min-width/min-height',
              affectedElements: touchTargets.criticalCount
            });
          }
          
          if (touchTargets.highCount > 0) {
            recommendations.push({
              priority: 'high',
              category: 'touch-targets',
              issue: `${touchTargets.highCount} buttons/links don't meet WCAG 2.1 guidelines`,
              fix: 'Add padding to increase touch target size to 44×44px minimum',
              affectedElements: touchTargets.highCount
            });
          }
        }

        // Text readability
        if (textReadability.success && textReadability.count > 0) {
          recommendations.push({
            priority: 'medium',
            category: 'text-readability',
            issue: `${textReadability.count} text elements have font size below 16px`,
            fix: 'Increase font-size to at least 16px for better mobile readability',
            affectedElements: textReadability.count
          });
        }

        // Tap collisions
        if (tapCollisions.success && tapCollisions.count > 0) {
          recommendations.push({
            priority: 'high',
            category: 'spacing',
            issue: `${tapCollisions.count} pairs of interactive elements are too close`,
            fix: 'Add at least 8px spacing between buttons, links, and other interactive elements',
            affectedElements: tapCollisions.count
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
      /* Mobile UX Analyzer styles */
      .uisentinel-touch-target-marker {
        outline: 2px solid #ff6b6b !important;
        outline-offset: 2px !important;
        position: relative;
      }

      .uisentinel-touch-target-marker.critical {
        outline-color: #ff0000 !important;
        outline-width: 3px !important;
        background: rgba(255, 0, 0, 0.15) !important;
      }

      .uisentinel-touch-target-marker.high {
        outline-color: #ff9800 !important;
        background: rgba(255, 152, 0, 0.1) !important;
      }

      .uisentinel-touch-size-label {
        position: absolute;
        background: #ff6b6b;
        color: white;
        padding: 3px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        font-family: monospace;
        z-index: 999999;
        pointer-events: none;
        white-space: nowrap;
        top: -25px;
        left: 0;
      }

      .uisentinel-touch-size-label.critical {
        background: #ff0000;
      }

      .uisentinel-touch-size-label.high {
        background: #ff9800;
      }

      .uisentinel-collision-marker {
        outline: 2px dashed #ffa500 !important;
        outline-offset: 2px !important;
      }
    `;
  }
}

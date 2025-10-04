import { Page } from 'playwright';
import { BaseExtension } from './extension-manager';

/**
 * Element Ruler Extension
 * Visual measurement tool showing pixel dimensions, spacing, margins, and padding
 * Like browser DevTools element inspector but with visual overlays
 */
export class ElementRuler extends BaseExtension {
  id = 'element-ruler';
  name = 'Element Ruler';
  description = 'Visual measurement tool displaying element dimensions, margins, padding, and positioning';

  /**
   * Generate browser-side JavaScript code
   */
  getBrowserCode(): string {
    return this.createBrowserAPI({
      /**
       * Measure and visualize an element's box model
       */
      measureElement: function(params: any = {}) {
        const {
          selector,
          showDimensions = true,
          showMargin = true,
          showPadding = true,
          showBorder = true,
          showPosition = true,
          persistent = false,
          scrollIntoView = true  // Auto-scroll to element
        } = params;

        if (!selector) {
          return { success: false, error: 'selector parameter is required' };
        }

        const element = document.querySelector(selector);
        if (!element) {
          return { success: false, error: 'Element not found' };
        }

        // Scroll element into view if requested and not already visible
        if (scrollIntoView) {
          const rect = element.getBoundingClientRect();
          const isInViewport = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
          );

          if (!isInViewport) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Return a message indicating we scrolled
            return {
              success: true,
              scrolled: true,
              message: 'Element scrolled into view. Call measureElement again to show measurements.',
              selector
            };
          }
        }

        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        // Get box model values
        const measurements = {
          content: {
            width: rect.width,
            height: rect.height
          },
          margin: {
            top: parseFloat(styles.marginTop) || 0,
            right: parseFloat(styles.marginRight) || 0,
            bottom: parseFloat(styles.marginBottom) || 0,
            left: parseFloat(styles.marginLeft) || 0
          },
          padding: {
            top: parseFloat(styles.paddingTop) || 0,
            right: parseFloat(styles.paddingRight) || 0,
            bottom: parseFloat(styles.paddingBottom) || 0,
            left: parseFloat(styles.paddingLeft) || 0
          },
          border: {
            top: parseFloat(styles.borderTopWidth) || 0,
            right: parseFloat(styles.borderRightWidth) || 0,
            bottom: parseFloat(styles.borderBottomWidth) || 0,
            left: parseFloat(styles.borderLeftWidth) || 0
          },
          position: {
            x: rect.left + scrollLeft,
            y: rect.top + scrollTop
          }
        };

        // Clear previous measurements if not persistent
        if (!persistent) {
          document.querySelectorAll('.uisentinel-ruler-overlay').forEach(el => el.remove());
        }

        // Create overlay container
        const overlay = document.createElement('div');
        overlay.className = 'uisentinel-ruler-overlay';
        overlay.style.cssText = `
          position: absolute;
          left: ${rect.left + scrollLeft}px;
          top: ${rect.top + scrollTop}px;
          width: ${rect.width}px;
          height: ${rect.height}px;
          pointer-events: none;
          z-index: 999998;
        `;

        // Content box
        const contentBox = document.createElement('div');
        contentBox.style.cssText = `
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid #60a5fa;
          background: rgba(96, 165, 250, 0.1);
        `;

        // Dimensions label (center)
        if (showDimensions) {
          const dimensionLabel = document.createElement('div');
          dimensionLabel.className = 'uisentinel-ruler-label';
          dimensionLabel.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #60a5fa;
            color: white;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            font-family: monospace;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          `;
          dimensionLabel.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
          contentBox.appendChild(dimensionLabel);
        }

        overlay.appendChild(contentBox);

        // Margin overlay
        if (showMargin && (measurements.margin.top || measurements.margin.right || measurements.margin.bottom || measurements.margin.left)) {
          const m = measurements.margin;

          // Top margin
          if (m.top > 0) {
            const topMargin = document.createElement('div');
            topMargin.style.cssText = `
              position: absolute;
              left: 0;
              top: -${m.top}px;
              width: 100%;
              height: ${m.top}px;
              background: rgba(246, 178, 107, 0.3);
              border: 1px dashed #f6b26b;
            `;
            const label = this.createMeasurementLabel(m.top, '#f6b26b');
            label.style.top = '50%';
            label.style.left = '50%';
            label.style.transform = 'translate(-50%, -50%)';
            topMargin.appendChild(label);
            overlay.appendChild(topMargin);
          }

          // Right margin
          if (m.right > 0) {
            const rightMargin = document.createElement('div');
            rightMargin.style.cssText = `
              position: absolute;
              right: -${m.right}px;
              top: 0;
              width: ${m.right}px;
              height: 100%;
              background: rgba(246, 178, 107, 0.3);
              border: 1px dashed #f6b26b;
            `;
            const label = this.createMeasurementLabel(m.right, '#f6b26b');
            label.style.top = '50%';
            label.style.left = '50%';
            label.style.transform = 'translate(-50%, -50%)';
            rightMargin.appendChild(label);
            overlay.appendChild(rightMargin);
          }

          // Bottom margin
          if (m.bottom > 0) {
            const bottomMargin = document.createElement('div');
            bottomMargin.style.cssText = `
              position: absolute;
              left: 0;
              bottom: -${m.bottom}px;
              width: 100%;
              height: ${m.bottom}px;
              background: rgba(246, 178, 107, 0.3);
              border: 1px dashed #f6b26b;
            `;
            const label = this.createMeasurementLabel(m.bottom, '#f6b26b');
            label.style.top = '50%';
            label.style.left = '50%';
            label.style.transform = 'translate(-50%, -50%)';
            bottomMargin.appendChild(label);
            overlay.appendChild(bottomMargin);
          }

          // Left margin
          if (m.left > 0) {
            const leftMargin = document.createElement('div');
            leftMargin.style.cssText = `
              position: absolute;
              left: -${m.left}px;
              top: 0;
              width: ${m.left}px;
              height: 100%;
              background: rgba(246, 178, 107, 0.3);
              border: 1px dashed #f6b26b;
            `;
            const label = this.createMeasurementLabel(m.left, '#f6b26b');
            label.style.top = '50%';
            label.style.left = '50%';
            label.style.transform = 'translate(-50%, -50%)';
            leftMargin.appendChild(label);
            overlay.appendChild(leftMargin);
          }
        }

        // Padding overlay
        if (showPadding && (measurements.padding.top || measurements.padding.right || measurements.padding.bottom || measurements.padding.left)) {
          const p = measurements.padding;

          // Top padding
          if (p.top > 0) {
            const topPadding = document.createElement('div');
            topPadding.style.cssText = `
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: ${p.top}px;
              background: rgba(147, 196, 125, 0.3);
              border: 1px dashed #93c47d;
            `;
            const label = this.createMeasurementLabel(p.top, '#93c47d');
            label.style.top = '50%';
            label.style.left = '50%';
            label.style.transform = 'translate(-50%, -50%)';
            topPadding.appendChild(label);
            contentBox.appendChild(topPadding);
          }

          // Right padding
          if (p.right > 0) {
            const rightPadding = document.createElement('div');
            rightPadding.style.cssText = `
              position: absolute;
              right: 0;
              top: 0;
              width: ${p.right}px;
              height: 100%;
              background: rgba(147, 196, 125, 0.3);
              border: 1px dashed #93c47d;
            `;
            const label = this.createMeasurementLabel(p.right, '#93c47d');
            label.style.top = '50%';
            label.style.left = '50%';
            label.style.transform = 'translate(-50%, -50%)';
            rightPadding.appendChild(label);
            contentBox.appendChild(rightPadding);
          }

          // Bottom padding
          if (p.bottom > 0) {
            const bottomPadding = document.createElement('div');
            bottomPadding.style.cssText = `
              position: absolute;
              left: 0;
              bottom: 0;
              width: 100%;
              height: ${p.bottom}px;
              background: rgba(147, 196, 125, 0.3);
              border: 1px dashed #93c47d;
            `;
            const label = this.createMeasurementLabel(p.bottom, '#93c47d');
            label.style.top = '50%';
            label.style.left = '50%';
            label.style.transform = 'translate(-50%, -50%)';
            bottomPadding.appendChild(label);
            contentBox.appendChild(bottomPadding);
          }

          // Left padding
          if (p.left > 0) {
            const leftPadding = document.createElement('div');
            leftPadding.style.cssText = `
              position: absolute;
              left: 0;
              top: 0;
              width: ${p.left}px;
              height: 100%;
              background: rgba(147, 196, 125, 0.3);
              border: 1px dashed #93c47d;
            `;
            const label = this.createMeasurementLabel(p.left, '#93c47d');
            label.style.top = '50%';
            label.style.left = '50%';
            label.style.transform = 'translate(-50%, -50%)';
            leftPadding.appendChild(label);
            contentBox.appendChild(leftPadding);
          }
        }

        // Position indicator
        if (showPosition) {
          const posLabel = document.createElement('div');
          posLabel.className = 'uisentinel-ruler-label';
          posLabel.style.cssText = `
            position: absolute;
            top: -25px;
            left: 0;
            background: #374151;
            color: white;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-family: monospace;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          `;
          posLabel.textContent = `x: ${Math.round(measurements.position.x)}, y: ${Math.round(measurements.position.y)}`;
          overlay.appendChild(posLabel);
        }

        document.body.appendChild(overlay);

        return {
          success: true,
          measurements,
          selector
        };
      },

      /**
       * Helper to create measurement labels
       */
      createMeasurementLabel: function(value: number, color: string): HTMLElement {
        const label = document.createElement('div');
        label.style.cssText = `
          position: absolute;
          background: ${color};
          color: white;
          padding: 2px 6px;
          border-radius: 2px;
          font-size: 10px;
          font-family: monospace;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        `;
        label.textContent = Math.round(value) + 'px';
        return label;
      },

      /**
       * Compare two elements' spacing
       */
      compareElements: function(params: any = {}) {
        const { selector1, selector2 } = params;

        if (!selector1 || !selector2) {
          return { success: false, error: 'selector1 and selector2 parameters are required' };
        }

        const el1 = document.querySelector(selector1);
        const el2 = document.querySelector(selector2);

        if (!el1 || !el2) {
          return { success: false, error: 'One or both elements not found' };
        }

        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();

        const spacing = {
          horizontal: Math.abs(rect2.left - rect1.right),
          vertical: Math.abs(rect2.top - rect1.bottom),
          centerDistance: Math.sqrt(
            Math.pow((rect2.left + rect2.width / 2) - (rect1.left + rect1.width / 2), 2) +
            Math.pow((rect2.top + rect2.height / 2) - (rect1.top + rect1.height / 2), 2)
          )
        };

        return {
          success: true,
          spacing,
          elements: {
            first: selector1,
            second: selector2
          }
        };
      },

      /**
       * Clear all measurement overlays
       */
      clearMeasurements: function() {
        document.querySelectorAll('.uisentinel-ruler-overlay').forEach(el => el.remove());
        return { success: true, message: 'All measurements cleared' };
      },

      /**
       * Get element's computed layout info
       */
      getLayoutInfo: function(params: any = {}) {
        const { selector } = params;

        if (!selector) {
          return { success: false, error: 'selector parameter is required' };
        }

        const element = document.querySelector(selector);
        if (!element) {
          return { success: false, error: 'Element not found' };
        }

        const styles = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return {
          success: true,
          layout: {
            display: styles.display,
            position: styles.position,
            float: styles.float,
            flexDirection: styles.flexDirection,
            gridTemplate: styles.gridTemplateColumns,
            width: rect.width,
            height: rect.height,
            zIndex: styles.zIndex
          }
        };
      }
    });
  }

  /**
   * Generate CSS styles
   */
  getStyles(): string {
    return this.createStyles({
      '.uisentinel-ruler-overlay': {
        'font-family': 'system-ui, -apple-system, sans-serif'
      },
      '.uisentinel-ruler-label': {
        'user-select': 'none',
        'pointer-events': 'none'
      }
    });
  }

  async initialize(_page: Page): Promise<void> {
    // Optional initialization
  }

  async cleanup(page: Page): Promise<void> {
    await page.evaluate(() => {
      // @ts-ignore
      const api = window['__extension_element-ruler__'];
      if (api && api.clearMeasurements) {
        api.clearMeasurements();
      }
    }).catch(() => {});
  }
}

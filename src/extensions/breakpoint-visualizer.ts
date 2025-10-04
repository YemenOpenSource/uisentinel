import { Page } from 'playwright';
import { BaseExtension } from './extension-manager';

/**
 * Breakpoint Visualizer Extension
 * Shows which responsive breakpoints are active
 * Displays viewport size and breakpoint information
 */
export class BreakpointVisualizer extends BaseExtension {
  id = 'breakpoint-visualizer';
  name = 'Breakpoint Visualizer';
  description = 'Visual indicator showing current viewport size and active responsive breakpoints';

  /**
   * Generate browser-side JavaScript code
   */
  getBrowserCode(): string {
    return this.createBrowserAPI({
      /**
       * Show breakpoint indicator
       */
      showBreakpoints: function(params: any = {}) {
        const {
          breakpoints = [
            { name: 'mobile', min: 0, max: 640, color: '#f87171' },
            { name: 'tablet', min: 641, max: 1024, color: '#fbbf24' },
            { name: 'desktop', min: 1025, max: 1920, color: '#34d399' },
            { name: 'wide', min: 1921, max: Infinity, color: '#60a5fa' },
          ],
          position = 'bottom-right',
          showDimensions = true,
          showOrientation = true
        } = params;

        // Remove existing indicator
        this.hideBreakpoints();

        const width = window.innerWidth;
        const height = window.innerHeight;
        const active = breakpoints.find((bp: any) => width >= bp.min && width <= bp.max) || breakpoints[0];

        // Get orientation
        const orientation = width > height ? 'landscape' : 'portrait';

        // Create indicator
        const indicator = document.createElement('div');
        indicator.id = 'uisentinel-breakpoint-indicator';
        indicator.className = 'uisentinel-breakpoint-indicator';

        // Position styles
        const positions: Record<string, string> = {
          'top-left': 'top: 20px; left: 20px;',
          'top-right': 'top: 20px; right: 20px;',
          'bottom-left': 'bottom: 20px; left: 20px;',
          'bottom-right': 'bottom: 20px; right: 20px;',
        };

        indicator.style.cssText = `
          position: fixed;
          ${positions[position] || positions['bottom-right']}
          background: ${active.color};
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 14px;
          font-family: monospace;
          z-index: 999999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          min-width: 200px;
          pointer-events: none;
        `;

        // Build content
        let content = `<div style="font-size: 16px; margin-bottom: 4px;">${active.name.toUpperCase()}</div>`;

        if (showDimensions) {
          content += `<div style="font-size: 12px; opacity: 0.9;">${width} × ${height} px</div>`;
        }

        if (showOrientation) {
          content += `<div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">${orientation}</div>`;
        }

        // Add breakpoint ranges
        content += `<div style="font-size: 10px; opacity: 0.7; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 6px;">`;
        breakpoints.forEach((bp: any) => {
          const isActive = bp.name === active.name;
          const rangeText = bp.max === Infinity ? `${bp.min}px+` : `${bp.min}-${bp.max}px`;
          content += `<div style="margin: 2px 0; ${isActive ? 'font-weight: bold;' : 'opacity: 0.6;'}">${bp.name}: ${rangeText}</div>`;
        });
        content += `</div>`;

        indicator.innerHTML = content;
        document.body.appendChild(indicator);

        // Auto-update on resize
        if (!(window as any).__uisentinel_breakpoint_listener) {
          (window as any).__uisentinel_breakpoint_listener = () => {
            const api = (window as any)['__extension_breakpoint-visualizer__'];
            if (api && api.showBreakpoints) {
              api.showBreakpoints(params);
            }
          };
          window.addEventListener('resize', (window as any).__uisentinel_breakpoint_listener);
        }

        return {
          success: true,
          active: active.name,
          width,
          height,
          orientation,
          breakpoints: breakpoints.map((bp: any) => ({ name: bp.name, range: `${bp.min}-${bp.max === Infinity ? '∞' : bp.max}` }))
        };
      },

      /**
       * Hide breakpoint indicator
       */
      hideBreakpoints: function() {
        const indicator = document.getElementById('uisentinel-breakpoint-indicator');
        if (indicator) {
          indicator.remove();
        }

        // Remove resize listener
        if ((window as any).__uisentinel_breakpoint_listener) {
          window.removeEventListener('resize', (window as any).__uisentinel_breakpoint_listener);
          delete (window as any).__uisentinel_breakpoint_listener;
        }

        return { success: true, message: 'Breakpoint indicator hidden' };
      },

      /**
       * Get current breakpoint info
       */
      getCurrentBreakpoint: function(params: any = {}) {
        const {
          breakpoints = [
            { name: 'mobile', min: 0, max: 640 },
            { name: 'tablet', min: 641, max: 1024 },
            { name: 'desktop', min: 1025, max: 1920 },
            { name: 'wide', min: 1921, max: Infinity },
          ]
        } = params;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const active = breakpoints.find((bp: any) => width >= bp.min && width <= bp.max);

        return {
          success: true,
          breakpoint: active?.name || 'unknown',
          width,
          height,
          orientation: width > height ? 'landscape' : 'portrait',
          devicePixelRatio: window.devicePixelRatio || 1
        };
      },

      /**
       * Show viewport size overlay (minimal)
       */
      showViewportSize: function() {
        // Remove existing
        const existing = document.getElementById('uisentinel-viewport-size');
        if (existing) {
          existing.remove();
        }

        const sizeDisplay = document.createElement('div');
        sizeDisplay.id = 'uisentinel-viewport-size';
        sizeDisplay.style.cssText = `
          position: fixed;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: #fff;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
          z-index: 999999;
          pointer-events: none;
        `;

        const updateSize = () => {
          sizeDisplay.textContent = `${window.innerWidth} × ${window.innerHeight}`;
        };

        updateSize();

        // Update on resize
        if (!(window as any).__uisentinel_size_listener) {
          (window as any).__uisentinel_size_listener = updateSize;
          window.addEventListener('resize', (window as any).__uisentinel_size_listener);
        }

        document.body.appendChild(sizeDisplay);

        return {
          success: true,
          width: window.innerWidth,
          height: window.innerHeight
        };
      },

      /**
       * Hide viewport size display
       */
      hideViewportSize: function() {
        const display = document.getElementById('uisentinel-viewport-size');
        if (display) {
          display.remove();
        }

        if ((window as any).__uisentinel_size_listener) {
          window.removeEventListener('resize', (window as any).__uisentinel_size_listener);
          delete (window as any).__uisentinel_size_listener;
        }

        return { success: true, message: 'Viewport size display hidden' };
      },

      /**
       * Test responsive behavior at different breakpoints
       */
      testBreakpoints: function(params: any = {}) {
        const {
          selector,
          breakpoints = [
            { name: 'mobile', width: 375 },
            { name: 'tablet', width: 768 },
            { name: 'desktop', width: 1920 },
          ]
        } = params;

        if (!selector) {
          return { success: false, error: 'selector parameter is required' };
        }

        const element = document.querySelector(selector);
        if (!element) {
          return { success: false, error: 'Element not found' };
        }

        // Get current computed styles
        const styles = window.getComputedStyle(element);
        const currentInfo = {
          display: styles.display,
          fontSize: styles.fontSize,
          width: styles.width,
          padding: styles.padding,
          margin: styles.margin,
        };

        return {
          success: true,
          element: selector,
          currentViewport: window.innerWidth,
          currentStyles: currentInfo,
          note: 'To test different breakpoints, resize the viewport or use device emulation'
        };
      }
    });
  }

  /**
   * Generate CSS styles
   */
  getStyles(): string {
    return this.createStyles({
      '.uisentinel-breakpoint-indicator': {
        'user-select': 'none',
        'transition': 'all 0.3s ease-in-out'
      }
    });
  }

  async initialize(_page: Page): Promise<void> {
    // Optional initialization
  }

  async cleanup(page: Page): Promise<void> {
    await page.evaluate(() => {
      // @ts-ignore
      const api = window['__extension_breakpoint-visualizer__'];
      if (api) {
        if (api.hideBreakpoints) api.hideBreakpoints();
        if (api.hideViewportSize) api.hideViewportSize();
      }
    }).catch(() => {});
  }
}

import { Page } from 'playwright';
import { BaseExtension } from './extension-manager';

/**
 * Layout Grid Extension
 * Overlays a visual grid to help verify alignment and spacing
 * Useful for ensuring consistent layouts
 */
export class LayoutGrid extends BaseExtension {
  id = 'layout-grid';
  name = 'Layout Grid';
  description = 'Visual grid overlay for verifying alignment, spacing, and layout consistency';

  /**
   * Generate browser-side JavaScript code
   */
  getBrowserCode(): string {
    return this.createBrowserAPI({
      /**
       * Show a grid overlay
       */
      showGrid: function(params: any = {}) {
        const {
          gridSize = 8,
          color = 'rgba(255, 0, 0, 0.2)',
          lineWidth = 0.5,
          showRuler = true,
          showCenterLines = true
        } = params;

        // Remove existing grid
        this.hideGrid();

        // Create canvas for grid
        const canvas = document.createElement('canvas');
        canvas.id = 'uisentinel-layout-grid';
        canvas.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 999997;
        `;

        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return { success: false, error: 'Could not get canvas context' };
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;

        // Draw vertical lines
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Draw center lines if requested
        if (showCenterLines) {
          ctx.strokeStyle = 'rgba(0, 0, 255, 0.4)';
          ctx.lineWidth = 1;

          // Vertical center
          ctx.beginPath();
          ctx.moveTo(width / 2, 0);
          ctx.lineTo(width / 2, height);
          ctx.stroke();

          // Horizontal center
          ctx.beginPath();
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
          ctx.stroke();
        }

        document.body.appendChild(canvas);

        // Add ruler if requested
        if (showRuler) {
          this.createRuler(gridSize);
        }

        return {
          success: true,
          gridSize,
          dimensions: { width, height },
          message: `Grid overlay created with ${gridSize}px spacing`
        };
      },

      /**
       * Create ruler overlays
       */
      createRuler: function(gridSize: number) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Horizontal ruler
        const hRuler = document.createElement('div');
        hRuler.className = 'uisentinel-ruler-horizontal';
        hRuler.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 30px;
          background: rgba(50, 50, 50, 0.9);
          color: white;
          font-family: monospace;
          font-size: 10px;
          z-index: 999998;
          pointer-events: none;
          display: flex;
          align-items: center;
        `;

        for (let x = 0; x < width; x += gridSize * 10) {
          const marker = document.createElement('div');
          marker.style.cssText = `
            position: absolute;
            left: ${x}px;
            height: 100%;
            border-left: 1px solid white;
            padding-left: 4px;
            line-height: 30px;
          `;
          marker.textContent = x.toString();
          hRuler.appendChild(marker);
        }

        // Vertical ruler
        const vRuler = document.createElement('div');
        vRuler.className = 'uisentinel-ruler-vertical';
        vRuler.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 30px;
          height: 100%;
          background: rgba(50, 50, 50, 0.9);
          color: white;
          font-family: monospace;
          font-size: 10px;
          z-index: 999998;
          pointer-events: none;
        `;

        for (let y = 0; y < height; y += gridSize * 10) {
          const marker = document.createElement('div');
          marker.style.cssText = `
            position: absolute;
            top: ${y}px;
            width: 100%;
            border-top: 1px solid white;
            padding-top: 2px;
            padding-left: 4px;
          `;
          marker.textContent = y.toString();
          vRuler.appendChild(marker);
        }

        document.body.appendChild(hRuler);
        document.body.appendChild(vRuler);
      },

      /**
       * Hide the grid overlay
       */
      hideGrid: function() {
        const canvas = document.getElementById('uisentinel-layout-grid');
        if (canvas) {
          canvas.remove();
        }

        document.querySelectorAll('.uisentinel-ruler-horizontal, .uisentinel-ruler-vertical').forEach(el => el.remove());

        return { success: true, message: 'Grid overlay removed' };
      },

      /**
       * Show column layout grid (for responsive design)
       */
      showColumnGrid: function(params: any = {}) {
        const {
          columns = 12,
          gutter = 20,
          maxWidth = 1200,
          color = 'rgba(0, 150, 255, 0.15)'
        } = params;

        // Remove existing grids
        this.hideGrid();

        const container = document.createElement('div');
        container.id = 'uisentinel-layout-grid';
        container.style.cssText = `
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: ${maxWidth}px;
          height: 100%;
          pointer-events: none;
          z-index: 999997;
          display: flex;
          gap: ${gutter}px;
          padding: 0 ${gutter}px;
        `;

        for (let i = 0; i < columns; i++) {
          const column = document.createElement('div');
          column.style.cssText = `
            flex: 1;
            background: ${color};
            border-left: 1px solid rgba(0, 150, 255, 0.3);
            border-right: 1px solid rgba(0, 150, 255, 0.3);
            position: relative;
          `;

          // Add column number
          const label = document.createElement('div');
          label.style.cssText = `
            position: sticky;
            top: 10px;
            text-align: center;
            color: rgba(0, 150, 255, 0.7);
            font-size: 12px;
            font-weight: bold;
            font-family: monospace;
          `;
          label.textContent = (i + 1).toString();
          column.appendChild(label);

          container.appendChild(column);
        }

        document.body.appendChild(container);

        return {
          success: true,
          columns,
          gutter,
          maxWidth,
          message: `${columns}-column grid created`
        };
      },

      /**
       * Highlight element alignment
       */
      highlightAlignment: function(params: any = {}) {
        const { selector } = params;

        if (!selector) {
          return { success: false, error: 'selector parameter is required' };
        }

        const element = document.querySelector(selector);
        if (!element) {
          return { success: false, error: 'Element not found' };
        }

        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        // Create alignment guides
        const guides = document.createElement('div');
        guides.className = 'uisentinel-alignment-guides';
        guides.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 999996;
        `;

        // Vertical line from top
        const vLine = document.createElement('div');
        vLine.style.cssText = `
          position: absolute;
          left: ${rect.left + scrollLeft}px;
          top: 0;
          width: 1px;
          height: 100%;
          background: rgba(255, 0, 255, 0.5);
          border-left: 1px dashed rgba(255, 0, 255, 0.8);
        `;

        // Horizontal line from left
        const hLine = document.createElement('div');
        hLine.style.cssText = `
          position: absolute;
          left: 0;
          top: ${rect.top + scrollTop}px;
          width: 100%;
          height: 1px;
          background: rgba(255, 0, 255, 0.5);
          border-top: 1px dashed rgba(255, 0, 255, 0.8);
        `;

        guides.appendChild(vLine);
        guides.appendChild(hLine);
        document.body.appendChild(guides);

        return {
          success: true,
          element: selector,
          position: {
            left: Math.round(rect.left),
            top: Math.round(rect.top)
          }
        };
      },

      /**
       * Clear alignment guides
       */
      clearAlignment: function() {
        document.querySelectorAll('.uisentinel-alignment-guides').forEach(el => el.remove());
        return { success: true, message: 'Alignment guides cleared' };
      },

      /**
       * Toggle grid visibility
       */
      toggleGrid: function(params: any = {}) {
        const existing = document.getElementById('uisentinel-layout-grid');

        if (existing) {
          this.hideGrid();
          return { success: true, visible: false };
        } else {
          this.showGrid(params);
          return { success: true, visible: true };
        }
      }
    });
  }

  async initialize(_page: Page): Promise<void> {
    // Optional initialization
  }

  async cleanup(page: Page): Promise<void> {
    await page.evaluate(() => {
      // @ts-ignore
      const api = window['__extension_layout-grid__'];
      if (api && api.hideGrid) {
        api.hideGrid();
      }
      if (api && api.clearAlignment) {
        api.clearAlignment();
      }
    }).catch(() => {});
  }
}

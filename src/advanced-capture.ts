import { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Options for element-specific capture
 */
export interface ElementCaptureOptions {
  selector: string;
  padding?: number;
  scrollIntoView?: boolean;
  path?: string;
}

/**
 * Options for clip-based capture (custom rectangle)
 */
export interface ClipCaptureOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  path?: string;
}

/**
 * Options for zoom-based capture
 */
export interface ZoomCaptureOptions {
  zoom: number; // 0.5 = 50%, 2 = 200%
  path?: string;
  fullPage?: boolean;
}

/**
 * Advanced capture capabilities for UI/UX testing
 */
export class AdvancedCapture {
  constructor(private page: Page, private outputDir: string) {}

  /**
   * Capture a specific element on the page
   * Perfect for component-level screenshots
   * 
   * @example
   * ```js
   * await advCapture.captureElement({
   *   selector: '#main-nav',
   *   padding: 10,
   *   path: 'navigation.png'
   * });
   * ```
   */
  async captureElement(options: ElementCaptureOptions): Promise<string> {
    const { selector, padding = 0, scrollIntoView = true, path: customPath } = options;

    // Find the element
    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    // Scroll into view if needed
    if (scrollIntoView) {
      await element.scrollIntoViewIfNeeded();
      // Wait a bit for scroll animations
      await this.page.waitForTimeout(300);
    }

    // Get element's bounding box
    const box = await element.boundingBox();
    if (!box) {
      throw new Error(`Element has no dimensions: ${selector}`);
    }

    // Generate output path
    const filename = customPath || this.generateFilename(selector, 'element');
    const outputPath = path.join(this.outputDir, 'screenshots', filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Capture with optional padding
    if (padding > 0) {
      await this.page.screenshot({
        path: outputPath,
        clip: {
          x: Math.max(0, box.x - padding),
          y: Math.max(0, box.y - padding),
          width: box.width + (padding * 2),
          height: box.height + (padding * 2),
        },
      });
    } else {
      await element.screenshot({ path: outputPath });
    }

    return outputPath;
  }

  /**
   * Capture multiple elements in sequence
   * Useful for component library documentation
   * 
   * @example
   * ```js
   * const screenshots = await advCapture.captureElements([
   *   { selector: '.button-primary', path: 'button-primary.png' },
   *   { selector: '.button-secondary', path: 'button-secondary.png' }
   * ]);
   * ```
   */
  async captureElements(elements: ElementCaptureOptions[]): Promise<string[]> {
    const results: string[] = [];
    
    for (const elementOptions of elements) {
      const screenshotPath = await this.captureElement(elementOptions);
      results.push(screenshotPath);
    }
    
    return results;
  }

  /**
   * Capture a specific rectangular region
   * Perfect for cropping specific areas
   * 
   * @example
   * ```js
   * await advCapture.captureClip({
   *   x: 100,
   *   y: 200,
   *   width: 400,
   *   height: 300,
   *   path: 'hero-section.png'
   * });
   * ```
   */
  async captureClip(options: ClipCaptureOptions): Promise<string> {
    const { x, y, width, height, path: customPath } = options;

    // Generate output path
    const filename = customPath || this.generateFilename('clip', 'region');
    const outputPath = path.join(this.outputDir, 'screenshots', filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    await this.page.screenshot({
      path: outputPath,
      clip: { x, y, width, height },
    });

    return outputPath;
  }

  /**
   * Capture page with zoom applied
   * Useful for high-DPI or detailed inspections
   * 
   * @example
   * ```js
   * // 200% zoom for detailed view
   * await advCapture.captureWithZoom({
   *   zoom: 2,
   *   path: 'zoomed-in.png'
   * });
   * ```
   */
  async captureWithZoom(options: ZoomCaptureOptions): Promise<string> {
    const { zoom, path: customPath, fullPage = false } = options;

    // Apply zoom via CSS
    await this.page.evaluate((zoomLevel) => {
      // @ts-ignore - running in browser context
      document.body.style.zoom = `${zoomLevel * 100}%`;
    }, zoom);

    // Wait for zoom to apply
    await this.page.waitForTimeout(300);

    // Generate output path
    const filename = customPath || this.generateFilename(`zoom-${zoom}x`, 'zoom');
    const outputPath = path.join(this.outputDir, 'screenshots', filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    await this.page.screenshot({
      path: outputPath,
      fullPage,
    });

    // Reset zoom
    await this.page.evaluate(() => {
      // @ts-ignore - running in browser context
      document.body.style.zoom = '100%';
    });

    return outputPath;
  }

  /**
   * Capture element with zoom applied
   * Perfect for detailed component inspection
   * 
   * @example
   * ```js
   * // Capture button at 2x zoom
   * await advCapture.captureElementWithZoom({
   *   selector: '.button',
   *   zoom: 2,
   *   padding: 10,
   *   path: 'button_zoomed.png'
   * });
   * ```
   */
  async captureElementWithZoom(options: {
    selector: string;
    zoom: number;
    padding?: number;
    scrollIntoView?: boolean;
    path?: string;
  }): Promise<string> {
    const { selector, zoom, padding = 0, scrollIntoView = true, path: customPath } = options;

    // Find element
    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    // Scroll into view if needed
    if (scrollIntoView) {
      await element.scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(300);
    }

    // Apply zoom to the element only
    await this.page.evaluate(
      ({ sel, zoomLevel }) => {
        // @ts-ignore - running in browser context
        const el = document.querySelector(sel);
        if (el) {
          // @ts-ignore - running in browser context
          (el as HTMLElement).style.zoom = `${zoomLevel * 100}%`;
        }
      },
      { sel: selector, zoomLevel: zoom }
    );

    // Wait for zoom to apply
    await this.page.waitForTimeout(300);

    // Get element's bounding box after zoom
    const box = await element.boundingBox();
    if (!box) {
      throw new Error(`Element has no dimensions: ${selector}`);
    }

    // Generate output path
    const filename = customPath || this.generateFilename(`${selector}_zoom${zoom}x`, 'element-zoom');
    const outputPath = path.join(this.outputDir, 'screenshots', filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Capture with padding
    if (padding > 0) {
      await this.page.screenshot({
        path: outputPath,
        clip: {
          x: Math.max(0, box.x - padding),
          y: Math.max(0, box.y - padding),
          width: box.width + (padding * 2),
          height: box.height + (padding * 2),
        },
      });
    } else {
      await element.screenshot({ path: outputPath });
    }

    // Reset zoom
    await this.page.evaluate((sel) => {
      // @ts-ignore - running in browser context
      const el = document.querySelector(sel);
      if (el) {
        // @ts-ignore - running in browser context
        (el as HTMLElement).style.zoom = '100%';
      }
    }, selector);

    return outputPath;
  }

  /**
   * Capture region with zoom applied
   * Zoom into a specific area for detailed inspection
   * 
   * @example
   * ```js
   * await advCapture.captureRegionWithZoom({
   *   x: 0,
   *   y: 0,
   *   width: 400,
   *   height: 300,
   *   zoom: 2,
   *   path: 'hero_zoomed.png'
   * });
   * ```
   */
  async captureRegionWithZoom(options: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
    path?: string;
  }): Promise<string> {
    const { x, y, width, height, zoom, path: customPath } = options;

    // Apply zoom
    await this.page.evaluate((zoomLevel) => {
      // @ts-ignore - running in browser context
      document.body.style.zoom = `${zoomLevel * 100}%`;
    }, zoom);

    // Wait for zoom to apply
    await this.page.waitForTimeout(300);

    // Adjust coordinates for zoom
    const adjustedX = x * zoom;
    const adjustedY = y * zoom;
    const adjustedWidth = width * zoom;
    const adjustedHeight = height * zoom;

    // Generate output path
    const filename = customPath || this.generateFilename(`region_zoom${zoom}x`, 'region-zoom');
    const outputPath = path.join(this.outputDir, 'screenshots', filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    await this.page.screenshot({
      path: outputPath,
      clip: {
        x: adjustedX,
        y: adjustedY,
        width: adjustedWidth,
        height: adjustedHeight,
      },
    });

    // Reset zoom
    await this.page.evaluate(() => {
      // @ts-ignore - running in browser context
      document.body.style.zoom = '100%';
    });

    return outputPath;
  }

  /**
   * Capture element with automatic highlight/annotation
   * Great for documentation and tutorials
   * 
   * @example
   * ```js
   * await advCapture.captureWithHighlight({
   *   selector: '.important-button',
   *   highlightColor: '#ff0000',
   *   path: 'highlighted-button.png'
   * });
   * ```
   */
  async captureWithHighlight(options: {
    selector: string;
    highlightColor?: string;
    highlightWidth?: number;
    path?: string;
  }): Promise<string> {
    const {
      selector,
      highlightColor = '#ff0000',
      highlightWidth = 3,
      path: customPath,
    } = options;

    // Add highlight outline
    await this.page.evaluate(
      ({ sel, color, width }) => {
        // @ts-ignore - running in browser context
        const element = document.querySelector(sel);
        if (element) {
          // @ts-ignore - running in browser context
          (element as HTMLElement).style.outline = `${width}px solid ${color}`;
          // @ts-ignore - running in browser context
          (element as HTMLElement).style.outlineOffset = '2px';
        }
      },
      { sel: selector, color: highlightColor, width: highlightWidth }
    );

    // Scroll into view
    const element = await this.page.$(selector);
    if (element) {
      await element.scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(300);
    }

    // Generate output path
    const filename = customPath || this.generateFilename(selector, 'highlighted');
    const outputPath = path.join(this.outputDir, 'screenshots', filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Take screenshot
    await this.page.screenshot({
      path: outputPath,
      fullPage: false,
    });

    // Remove highlight
    await this.page.evaluate((sel) => {
      // @ts-ignore - running in browser context
      const element = document.querySelector(sel);
      if (element) {
        // @ts-ignore - running in browser context
        (element as HTMLElement).style.outline = '';
        // @ts-ignore - running in browser context
        (element as HTMLElement).style.outlineOffset = '';
      }
    }, selector);

    return outputPath;
  }

  /**
   * Capture before/after states (e.g., hover effects)
   * Perfect for documenting interactive states
   * 
   * @example
   * ```js
   * const [before, after] = await advCapture.captureBeforeAfter({
   *   selector: '.fancy-button',
   *   action: 'hover',
   *   beforePath: 'button-normal.png',
   *   afterPath: 'button-hover.png'
   * });
   * ```
   */
  async captureBeforeAfter(options: {
    selector: string;
    action: 'hover' | 'focus' | 'click';
    beforePath?: string;
    afterPath?: string;
  }): Promise<[string, string]> {
    const { selector, action, beforePath, afterPath } = options;

    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    await element.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(300);

    // Capture BEFORE state
    const beforeFilename = beforePath || this.generateFilename(selector, 'before');
    const beforeOutput = path.join(this.outputDir, 'screenshots', beforeFilename);
    fs.mkdirSync(path.dirname(beforeOutput), { recursive: true });
    await element.screenshot({ path: beforeOutput });

    // Perform action
    switch (action) {
      case 'hover':
        await element.hover();
        break;
      case 'focus':
        await element.focus();
        break;
      case 'click':
        await element.click();
        break;
    }

    // Wait for transition/animation
    await this.page.waitForTimeout(500);

    // Capture AFTER state
    const afterFilename = afterPath || this.generateFilename(selector, 'after');
    const afterOutput = path.join(this.outputDir, 'screenshots', afterFilename);
    await element.screenshot({ path: afterOutput });

    return [beforeOutput, afterOutput];
  }

  /**
   * Capture viewport at specific scroll position
   * Useful for testing sticky headers, infinite scroll, etc.
   * 
   * @example
   * ```js
   * await advCapture.captureAtScrollPosition({
   *   y: 1000,
   *   path: 'scrolled-1000px.png'
   * });
   * ```
   */
  async captureAtScrollPosition(options: {
    x?: number;
    y?: number;
    path?: string;
  }): Promise<string> {
    const { x = 0, y = 0, path: customPath } = options;

    // Scroll to position
    await this.page.evaluate(
      ({ scrollX, scrollY }) => {
        // @ts-ignore - running in browser context
        window.scrollTo(scrollX, scrollY);
      },
      { scrollX: x, scrollY: y }
    );

    // Wait for scroll to complete
    await this.page.waitForTimeout(300);

    // Generate output path
    const filename = customPath || this.generateFilename(`scroll-${y}`, 'scroll');
    const outputPath = path.join(this.outputDir, 'screenshots', filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    await this.page.screenshot({
      path: outputPath,
      fullPage: false,
    });

    return outputPath;
  }

  /**
   * Generate filename from selector
   */
  private generateFilename(identifier: string, suffix: string): string {
    const timestamp = Date.now();
    const cleanId = identifier
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 50);
    return `${cleanId}_${suffix}_${timestamp}.png`;
  }
}

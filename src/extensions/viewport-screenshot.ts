import { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { BaseExtension } from './extension-manager';

/**
 * Viewport Screenshot Extension
 * Captures page view-by-view with window-wise scrolling
 * Perfect for AI agents to see progressive page layout
 */
export class ViewportScreenshotExtension extends BaseExtension {
  id = 'viewport-screenshot';
  name = 'Viewport Screenshot (View-by-View)';
  description = 'Capture page screenshots view-by-view with automatic viewport scrolling';

  private outputDir: string = './screenshots/views';

  /**
   * Set output directory for screenshots
   */
  setOutputDir(dir: string): void {
    this.outputDir = path.resolve(dir);
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Capture page view-by-view
   */
  async captureViews(page: Page, options: {
    outputName?: string;
    waitForLoad?: boolean;
    scrollDelay?: number;
    device?: 'desktop' | 'tablet' | 'mobile' | 'custom';
    viewport?: { width: number; height: number };
    overlap?: number; // Overlap between views in pixels (default: 50px)
    expectation?: string;
  } = {}): Promise<any> {
    const {
      outputName,
      waitForLoad = true,
      scrollDelay = 500,
      device = 'desktop',
      viewport,
      overlap = 50,
      expectation,
    } = options;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = outputName || `views-${timestamp}`;

    // Ensure output directory exists
    const viewsDir = path.join(this.outputDir, baseName);
    if (!fs.existsSync(viewsDir)) {
      fs.mkdirSync(viewsDir, { recursive: true });
    }

    // Set viewport based on device
    if (viewport) {
      await page.setViewportSize(viewport);
    } else {
      const deviceViewports = {
        desktop: { width: 1920, height: 1080 },
        tablet: { width: 768, height: 1024 },
        mobile: { width: 375, height: 667 },
        custom: page.viewportSize() || { width: 1920, height: 1080 },
      };
      await page.setViewportSize(deviceViewports[device]);
    }

    const currentViewport = page.viewportSize();
    if (!currentViewport) {
      throw new Error('Could not determine viewport size');
    }

    // Wait for page to load
    if (waitForLoad) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    // Get total page height
    const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const viewportHeight = currentViewport.height;

    // Calculate number of views needed
    const scrollStep = viewportHeight - overlap;
    const viewCount = Math.ceil(totalHeight / scrollStep);

    const views: Array<{
      index: number;
      scrollY: number;
      screenshot: string;
      viewport: { width: number; height: number };
    }> = [];

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(scrollDelay);

    // Capture each view
    for (let i = 0; i < viewCount; i++) {
      const scrollY = i * scrollStep;

      // Scroll to position
      await page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(scrollDelay);

      // Capture screenshot
      const screenshotPath = path.join(viewsDir, `view-${String(i + 1).padStart(3, '0')}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      views.push({
        index: i + 1,
        scrollY,
        screenshot: screenshotPath,
        viewport: currentViewport,
      });
    }

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));

    const result = {
      success: true,
      timestamp,
      device: device || 'custom',
      viewport: currentViewport,
      totalHeight,
      viewCount,
      overlap,
      views,
      directory: viewsDir,
      expectation: expectation || null,
      metExpectation: expectation ? await this.validateExpectation(page, expectation) : null,
    };

    // Save metadata
    const metadataPath = path.join(viewsDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(result, null, 2), 'utf-8');

    // Generate index.md for easy viewing
    const indexMd = this.generateIndexMarkdown(result);
    fs.writeFileSync(path.join(viewsDir, 'index.md'), indexMd, 'utf-8');

    return result;
  }

  /**
   * Capture views for multiple devices
   */
  async captureViewsMultiDevice(page: Page, options: {
    outputName?: string;
    devices?: Array<'desktop' | 'tablet' | 'mobile'>;
    overlap?: number;
    expectation?: string;
  } = {}): Promise<any> {
    const {
      outputName = 'multidevice-views',
      devices = ['desktop', 'tablet', 'mobile'],
      overlap = 50,
      expectation,
    } = options;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const results: any[] = [];

    for (const device of devices) {
      const result = await this.captureViews(page, {
        outputName: `${outputName}-${device}-${timestamp}`,
        device,
        overlap,
        expectation,
      });
      results.push(result);
    }

    const summary = {
      success: true,
      timestamp,
      totalDevices: devices.length,
      devices,
      expectation: expectation || null,
      results,
    };

    // Save summary
    const summaryPath = path.join(this.outputDir, `${outputName}-summary-${timestamp}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

    return summary;
  }

  /**
   * Generate markdown index for views
   */
  private generateIndexMarkdown(data: any): string {
    const lines: string[] = [];

    lines.push(`# Page Views - ${data.timestamp}`);
    lines.push('');
    lines.push(`**Device:** ${data.device}`);
    lines.push(`**Viewport:** ${data.viewport.width} × ${data.viewport.height}px`);
    lines.push(`**Total Height:** ${data.totalHeight}px`);
    lines.push(`**View Count:** ${data.viewCount}`);
    lines.push(`**Overlap:** ${data.overlap}px`);

    if (data.expectation) {
      lines.push('');
      lines.push(`**Expectation:** ${data.expectation}`);
      lines.push(`**Met:** ${data.metExpectation?.met ? '✓ Yes' : '✗ No'}`);
      if (data.metExpectation?.details) {
        lines.push(`**Details:** ${data.metExpectation.details}`);
      }
    }

    lines.push('');
    lines.push('## Views');
    lines.push('');

    data.views.forEach((view: any) => {
      lines.push(`### View ${view.index}`);
      lines.push('');
      lines.push(`**Scroll Position:** ${view.scrollY}px`);
      lines.push('');
      lines.push(`![View ${view.index}](${path.basename(view.screenshot)})`);
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Validate expectation
   */
  private async validateExpectation(page: Page, expectation: string): Promise<{
    met: boolean;
    details: string;
  }> {
    try {
      // Check if expectation is a selector
      if (expectation.startsWith('#') || expectation.startsWith('.') || expectation.includes('[')) {
        const element = await page.$(expectation);
        return {
          met: element !== null,
          details: element ? `Element found: ${expectation}` : `Element not found: ${expectation}`,
        };
      }

      // Check if text is present on page
      const hasText = await page.evaluate((text) => {
        return document.body.innerText.toLowerCase().includes(text.toLowerCase());
      }, expectation);

      return {
        met: hasText,
        details: hasText ? `Text found: "${expectation}"` : `Text not found: "${expectation}"`,
      };
    } catch (error) {
      return {
        met: false,
        details: `Error validating expectation: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * No browser-side code needed
   */
  getBrowserCode(): string {
    return this.createBrowserAPI({
      noop: () => ({ message: 'Viewport screenshot uses server-side logic only' }),
    });
  }
}

import { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { BaseExtension } from './extension-manager';

/**
 * Full Page Screenshot Extension
 * Captures complete page screenshots with smart scrolling to load all content
 * Supports multiple device viewports (desktop, tablet, mobile)
 */
export class FullPageScreenshotExtension extends BaseExtension {
  id = 'fullpage-screenshot';
  name = 'Full Page Screenshot';
  description = 'Capture full page screenshots with automatic scrolling and lazy-load detection';

  private outputDir: string = './screenshots';

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
   * Capture full page screenshot with smart scrolling
   */
  async capture(page: Page, options: {
    outputName?: string;
    waitForLoad?: boolean;
    scrollToEnd?: boolean;
    scrollDelay?: number; // Delay between scrolls (for lazy loading)
    device?: 'desktop' | 'tablet' | 'mobile' | 'custom';
    viewport?: { width: number; height: number };
    expectation?: string; // What the AI agent expects to see
  } = {}): Promise<any> {
    const {
      outputName,
      waitForLoad = true,
      scrollToEnd = true,
      scrollDelay = 500,
      device = 'desktop',
      viewport,
      expectation,
    } = options;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = outputName || `fullpage-${timestamp}`;

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
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

    // Wait for page to load
    if (waitForLoad) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Additional buffer for animations and lazy content
    }

    // Scroll to end to load lazy content, then back to top
    if (scrollToEnd) {
      await this.scrollToBottom(page, scrollDelay);
      await page.waitForTimeout(2000); // Wait for lazy-loaded content
      await page.evaluate(() => window.scrollTo(0, 0)); // Scroll back to top
      await page.waitForTimeout(2000); // Wait for scroll to settle
    }

    // Wait before capture to ensure everything is rendered
    await page.waitForTimeout(2000);

    // Capture screenshot
    const screenshotPath = path.join(this.outputDir, `${baseName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Get page metrics
    const metrics = await page.evaluate(() => {
      return {
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        clientHeight: document.documentElement.clientHeight,
        clientWidth: document.documentElement.clientWidth,
      };
    });

    const result = {
      success: true,
      timestamp,
      device: device || 'custom',
      viewport: currentViewport,
      screenshot: screenshotPath,
      metrics,
      expectation: expectation || null,
      metExpectation: expectation ? await this.validateExpectation(page, expectation) : null,
    };

    // Save metadata
    const metadataPath = path.join(this.outputDir, `${baseName}-metadata.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(result, null, 2), 'utf-8');

    return result;
  }

  /**
   * Capture full page for multiple devices
   */
  async captureMultiDevice(page: Page, options: {
    outputName?: string;
    devices?: Array<'desktop' | 'tablet' | 'mobile'>;
    expectation?: string;
  } = {}): Promise<any> {
    const {
      outputName = 'multidevice',
      devices = ['desktop', 'tablet', 'mobile'],
      expectation,
    } = options;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const results: any[] = [];

    for (const device of devices) {
      const result = await this.capture(page, {
        outputName: `${outputName}-${device}-${timestamp}`,
        device,
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
   * Scroll to bottom of page with delays for lazy loading
   */
  private async scrollToBottom(page: Page, delay: number = 500): Promise<void> {
    await page.evaluate(async (scrollDelay) => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 300; // Scroll 300px at a time
        const timer = setInterval(() => {
          const scrollHeight = document.documentElement.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, scrollDelay);
      });
    }, delay);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(delay);
  }

  /**
   * Validate expectation using simple text or element presence check
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
      noop: () => ({ message: 'Full page screenshot uses server-side logic only' }),
    });
  }
}

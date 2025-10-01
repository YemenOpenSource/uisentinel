import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as axe from 'axe-core';
import {
  Viewport,
  ViewportPreset,
  VIEWPORT_PRESETS,
  ScreenshotResult,
  AccessibilityResult,
  LayoutAnalysis,
  CaptureOptions,
  Action,
} from './types';
import { InteractionEngine } from './interaction-engine';

/**
 * Handles browser automation and visual capture
 */
export class BrowserEngine {
  private browser: Browser | null = null;
  private outputDir: string;

  constructor(outputDir: string = './uisentinel-output') {
    this.outputDir = path.resolve(outputDir);
    this.ensureOutputDir();
  }

  /**
   * Initialize the browser
   */
  async init(headless: boolean = true): Promise<void> {
    if (this.browser) {
      return;
    }

    this.browser = await chromium.launch({
      headless,
      args: ['--disable-dev-shm-usage'],
    });
  }

  /**
   * Capture screenshots and run analysis
   */
  async capture(options: CaptureOptions): Promise<{
    screenshots: ScreenshotResult[];
    accessibility?: AccessibilityResult;
    layout?: LayoutAnalysis;
  }> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    const viewports = this.resolveViewports(options.viewports || ['desktop']);
    const screenshots: ScreenshotResult[] = [];
    let accessibility: AccessibilityResult | undefined;
    let layout: LayoutAnalysis | undefined;

    for (const viewport of viewports) {
      const page = await this.browser.newPage({
        viewport,
        deviceScaleFactor: viewport.deviceScaleFactor,
      });

      try {
        // Navigate to URL
        await page.goto(options.url, {
          waitUntil: 'networkidle',
          timeout: options.waitForTimeout || 30000,
        });

        // Wait for specific selector if provided
        if (options.waitForSelector) {
          await page.waitForSelector(options.waitForSelector, {
            timeout: options.waitForTimeout || 30000,
          });
        }

        // NEW: Execute interactive actions before capture
        if (options.actions && options.actions.length > 0) {
          const interactionEngine = new InteractionEngine(page);
          await interactionEngine.executeSequence(options.actions);
        }

        // Take screenshot
        if (options.screenshot !== false) {
          const namePrefix = options.name || this.generateNameFromUrl(options.url);
          const screenshotPath = await this.takeScreenshot(page, viewport, options.url, namePrefix);
          screenshots.push({
            viewport: this.getViewportName(viewport),
            path: screenshotPath,
            width: viewport.width,
            height: viewport.height,
            timestamp: new Date().toISOString(),
            url: options.url,
          });
        }

        // Run accessibility checks (once, on first viewport)
        if (options.accessibility && !accessibility) {
          accessibility = await this.runAccessibilityChecks(page);
        }

        // Analyze layout
        if (options.layoutAnalysis) {
          layout = await this.analyzeLayout(page, viewport);
        }
      } finally {
        await page.close();
      }
    }

    return { screenshots, accessibility, layout };
  }

  /**
   * Take a screenshot
   */
  private async takeScreenshot(page: Page, viewport: Viewport, url: string, namePrefix?: string): Promise<string> {
    const timestamp = Date.now();
    const viewportName = this.getViewportName(viewport);
    const prefix = namePrefix || this.generateNameFromUrl(url);
    const filename = `${prefix}_${viewportName}_${timestamp}.png`;
    const screenshotPath = path.join(this.outputDir, 'screenshots', filename);

    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    return screenshotPath;
  }

  /**
   * Generate snake_case name from URL
   */
  private generateNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      let name = urlObj.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '_');
      if (!name || name === '') {
        name = 'home';
      }
      return name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    } catch {
      return url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }
  }

  /**
   * Run accessibility checks using axe-core
   */
  private async runAccessibilityChecks(page: Page): Promise<AccessibilityResult> {
    // Inject axe-core
    await page.addScriptTag({
      content: fs.readFileSync(require.resolve('axe-core'), 'utf-8'),
    });

    // Run axe
    const results = await page.evaluate(() => {
      // @ts-ignore - running in browser context
      return window.axe.run({
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      });
    });

    const violations = results.violations.map((v: any) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n: any) => ({
        html: n.html,
        target: n.target,
        failureSummary: n.failureSummary,
      })),
    }));

    // Calculate score (100 - weighted violations)
    const impactWeights = { minor: 5, moderate: 10, serious: 20, critical: 40 };
    const totalWeight = violations.reduce((sum, v) => {
      const weight = impactWeights[v.impact as keyof typeof impactWeights] || 10;
      return sum + (weight * v.nodes.length);
    }, 0);
    const score = Math.max(0, 100 - totalWeight);

    return {
      violations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      score,
      wcagLevel: 'WCAG21AA',
    };
  }

  /**
   * Analyze page layout for common issues
   */
  private async analyzeLayout(page: Page, viewport: Viewport): Promise<LayoutAnalysis> {
    const analysis = await page.evaluate(() => {
      const elements: any[] = [];
      const overflows: any[] = [];
      const invisibleText: any[] = [];

      // @ts-ignore - running in browser context
      // Get all visible elements
      const allElements = document.querySelectorAll('*');
      allElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // @ts-ignore - running in browser context
        const styles = window.getComputedStyle(el);

        if (rect.width > 0 && rect.height > 0) {
          elements.push({
            selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
            boundingBox: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            },
            visible: styles.display !== 'none' && styles.visibility !== 'hidden',
            zIndex: parseInt(styles.zIndex) || 0,
          });

          // Check for overflow
          if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
            overflows.push({
              element: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
              overflowX: el.scrollWidth - el.clientWidth,
              overflowY: el.scrollHeight - el.clientHeight,
            });
          }

          // Check for invisible text (low contrast)
          if (el.textContent && el.textContent.trim()) {
            const bgColor = styles.backgroundColor;
            const textColor = styles.color;
            // Simplified check - real implementation would calculate contrast ratio
            if (textColor === bgColor) {
              invisibleText.push({
                element: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
                reason: 'Text color matches background',
              });
            }
          }
        }
      });

      return { elements, overflows, invisibleText };
    });

    return {
      viewport,
      ...analysis,
    };
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private resolveViewports(viewports: (ViewportPreset | Viewport)[]): Viewport[] {
    return viewports.map((v) => {
      if (typeof v === 'string') {
        return VIEWPORT_PRESETS[v];
      }
      return v;
    });
  }

  private getViewportName(viewport: Viewport): string {
    // Try to match with preset
    for (const [name, preset] of Object.entries(VIEWPORT_PRESETS)) {
      if (preset.width === viewport.width && preset.height === viewport.height) {
        return name;
      }
    }
    return `${viewport.width}x${viewport.height}`;
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }
}

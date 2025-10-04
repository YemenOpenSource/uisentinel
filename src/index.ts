import * as path from 'path';
import * as fs from 'fs';
import { ServerManager } from './server-manager';
import { BrowserEngine } from './browser-engine';
import { VisualDiff } from './visual-diff';
import {
  UISentinelConfig,
  CaptureOptions,
  ValidationResult,
  ViewportPreset,
} from './types';

/**
 * Main UISentinel class - orchestrates all operations
 */
export class UISentinel {
  private config: Required<UISentinelConfig>;
  private serverManager: ServerManager;
  private browserEngine: BrowserEngine;
  private visualDiff: VisualDiff;
  private isStarted: boolean = false;

  constructor(config: UISentinelConfig = {}) {
    this.config = this.mergeConfig(config);
    this.serverManager = new ServerManager(this.config.projectPath);
    this.browserEngine = new BrowserEngine(this.config.output.directory);
    this.visualDiff = new VisualDiff(this.config.output.directory);
  }

  /**
   * Start the project server and initialize browser
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      return;
    }

    console.log('🚀 Starting uisentinel...');

    // Start server if project path is provided and is a valid directory
    if (this.config.projectPath && this.config.projectPath !== process.cwd()) {
      const serverInfo = await this.serverManager.start(this.config.port);
      console.log(`✓ Server started at ${serverInfo.url}`);
      this.config.host = serverInfo.url;
      this.config.port = serverInfo.port;
    }

    // Initialize browser
    await this.browserEngine.init(this.config.headless);
    console.log('✓ Browser initialized');

    this.isStarted = true;
  }


  /**
   * Get the browser engine for advanced capture operations
   * Use this to access element-specific captures, clipping, zoom, etc.
   */
  getBrowserEngine(): BrowserEngine {
    return this.browserEngine;
  }

  /**
   * Capture full page screenshot with smart scrolling
   * @param url - URL to capture
   * @param options - Capture options including device, viewport, expectations
   * @returns Capture result with screenshot path and expectation validation
   */
  async captureFullPage(url: string, options: {
    device?: 'desktop' | 'tablet' | 'mobile' | 'custom';
    viewport?: { width: number; height: number };
    scrollToEnd?: boolean;
    scrollDelay?: number;
    outputName?: string;
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { FullPageScreenshotExtension } = await import('./extensions/fullpage-screenshot');
    const extension = new FullPageScreenshotExtension();
    extension.setOutputDir(this.config.output.directory);

    const page = await this.browserEngine.createPage(url, options.device as ViewportPreset || 'desktop');

    const result = await extension.capture(page, {
      device: options.device,
      viewport: options.viewport,
      scrollToEnd: options.scrollToEnd,
      scrollDelay: options.scrollDelay,
      outputName: options.outputName,
      expectation: options.expectations,
    });

    await page.close();
    return result;
  }

  /**
   * Capture full page screenshots across multiple devices
   */
  async captureFullPageMulti(url: string, options: {
    devices?: ('desktop' | 'tablet' | 'mobile')[];
    outputName?: string;
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { FullPageScreenshotExtension } = await import('./extensions/fullpage-screenshot');
    const extension = new FullPageScreenshotExtension();
    extension.setOutputDir(this.config.output.directory);

    const page = await this.browserEngine.createPage(url, 'desktop');

    const result = await extension.captureMultiDevice(page, {
      devices: options.devices || ['desktop', 'tablet', 'mobile'],
      outputName: options.outputName,
      expectation: options.expectations,
    });

    await page.close();
    return result;
  }

  /**
   * Capture view-by-view screenshots with window-wise scrolling
   */
  async captureViews(url: string, options: {
    device?: 'desktop' | 'tablet' | 'mobile' | 'custom';
    viewport?: { width: number; height: number };
    overlap?: number;
    scrollDelay?: number;
    outputName?: string;
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { ViewportScreenshotExtension } = await import('./extensions/viewport-screenshot');
    const extension = new ViewportScreenshotExtension();
    extension.setOutputDir(this.config.output.directory);

    const page = await this.browserEngine.createPage(url, options.device as ViewportPreset || 'desktop');

    const result = await extension.captureViews(page, {
      device: options.device,
      viewport: options.viewport,
      overlap: options.overlap,
      scrollDelay: options.scrollDelay,
      outputName: options.outputName,
      expectation: options.expectations,
    });

    await page.close();
    return result;
  }

  /**
   * Capture view-by-view screenshots across multiple devices
   */
  async captureViewsMulti(url: string, options: {
    devices?: ('desktop' | 'tablet' | 'mobile')[];
    overlap?: number;
    outputName?: string;
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { ViewportScreenshotExtension } = await import('./extensions/viewport-screenshot');
    const extension = new ViewportScreenshotExtension();
    extension.setOutputDir(this.config.output.directory);

    const page = await this.browserEngine.createPage(url, 'desktop');

    const result = await extension.captureViewsMultiDevice(page, {
      devices: options.devices || ['desktop', 'tablet', 'mobile'],
      overlap: options.overlap,
      outputName: options.outputName,
      expectation: options.expectations,
    });

    await page.close();
    return result;
  }

  /**
   * Inspect a specific element with optional action
   */
  async inspectElement(url: string, selector: string, options: {
    viewport?: 'mobile' | 'tablet' | 'desktop';
    action?: 'click' | 'hover' | 'focus';
    captureViewport?: boolean;
    captureElement?: boolean;
    showOverlay?: boolean;
    showInfo?: boolean;
    showRulers?: boolean;
    showExtensionLines?: boolean;
    captureZoomed?: boolean;
    zoomLevel?: number;
    includeParent?: boolean;
    includeChildren?: boolean;
    includeComputedStyles?: boolean;
    includeAttributes?: boolean;
    autoSave?: boolean;
    outputName?: string;
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { ElementInspector } = await import('./extensions/element-inspector');
    const extension = new ElementInspector();
    extension.setOutputDir(this.config.output.directory);

    const manager = this.browserEngine.getExtensionManager();
    manager.register(extension);

    const page = await this.browserEngine.createPage(url, options.viewport as ViewportPreset || 'desktop');
    await manager.injectExtension(page, 'element-inspector');

    let result: any;
    if (options.action) {
      result = await extension.inspectWithActionSequence(page, selector, [
        { type: options.action, target: selector },
      ], {
        captureIntermediate: true,
        captureViewport: options.captureViewport ?? true,
        outputName: options.outputName,
      });
    } else {
      result = await extension.inspect(page, selector, {
        captureViewportScreenshot: options.captureViewport ?? true,
        captureElementScreenshot: options.captureElement ?? true,
        captureZoomedScreenshot: options.captureZoomed ?? false,
        zoomLevel: options.zoomLevel ?? 2,
        showOverlay: options.showOverlay ?? true,
        showInfo: options.showInfo ?? true,
        showRulers: options.showRulers ?? false,
        showExtensionLines: options.showExtensionLines ?? true,
        includeParent: options.includeParent ?? true,
        includeChildren: options.includeChildren ?? true,
        includeComputedStyles: options.includeComputedStyles ?? true,
        includeAttributes: options.includeAttributes ?? true,
        autoSave: options.autoSave ?? true,
        outputName: options.outputName,
      });
    }

    await page.close();
    return result;
  }

  /**
   * Analyze responsive design patterns and fixed-width elements
   */
  async analyzeResponsive(url: string, options: {
    viewport?: 'mobile' | 'tablet' | 'desktop';
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { ResponsiveDesignInspector } = await import('./extensions/responsive-design-inspector');
    const extension = new ResponsiveDesignInspector();

    const manager = this.browserEngine.getExtensionManager();
    manager.register(extension);

    const page = await this.browserEngine.createPage(url, options.viewport as ViewportPreset || 'mobile');
    await manager.injectExtension(page, 'responsive-design-inspector');

    const report = await manager.executeExtension(page, 'responsive-design-inspector', 'analyzeResponsiveness');

    await page.close();

    if (!report.success) {
      throw new Error(`Responsive analysis failed: ${report.error}`);
    }

    return {
      ...report.data,
      expectations: options.expectations,
    };
  }

  /**
   * Analyze mobile UX including touch targets, readability, and WCAG compliance
   */
  async analyzeMobileUX(url: string, options: {
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { MobileUXAnalyzer } = await import('./extensions/mobile-ux-analyzer');
    const extension = new MobileUXAnalyzer();

    const manager = this.browserEngine.getExtensionManager();
    manager.register(extension);

    const page = await this.browserEngine.createPage(url, 'mobile');
    await manager.injectExtension(page, 'mobile-ux-analyzer');

    const report = await manager.executeExtension(page, 'mobile-ux-analyzer', 'analyzeMobileUX');

    await page.close();

    if (!report.success) {
      throw new Error(`Mobile UX analysis failed: ${report.error}`);
    }

    return {
      ...report.data,
      expectations: options.expectations,
    };
  }

  /**
   * Check accessibility compliance using axe-core
   */
  async checkAccessibility(url: string, options: {
    viewport?: 'mobile' | 'tablet' | 'desktop';
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const page = await this.browserEngine.createPage(url, options.viewport as ViewportPreset || 'desktop');
    await page.waitForLoadState('networkidle');

    // Run axe-core accessibility checks
    const result = await this.browserEngine.runAccessibilityChecks(page);

    await page.close();

    return {
      standard: 'WCAG 2.1 AA',
      ...result,
      expectations: options.expectations,
    };
  }

  /**
   * Check contrast ratios
   */
  async checkContrast(url: string, options: {
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { ContrastChecker } = await import('./extensions/contrast-checker');
    const extension = new ContrastChecker();

    const manager = this.browserEngine.getExtensionManager();
    manager.register(extension);

    const page = await this.browserEngine.createPage(url, 'desktop');
    await manager.injectExtension(page, 'contrast-checker');

    const result = await manager.executeExtension(page, 'contrast-checker', 'checkContrast');

    await page.close();

    if (!result.success) {
      throw new Error(`Contrast check failed: ${result.error}`);
    }

    return {
      ...result.data,
      expectations: options.expectations,
    };
  }

  /**
   * Measure element dimensions, margins, padding with visual overlay
   */
  async measureElement(url: string, selector: string, options: {
    viewport?: 'mobile' | 'tablet' | 'desktop';
    showDimensions?: boolean;
    showMargin?: boolean;
    showPadding?: boolean;
    showBorder?: boolean;
    showPosition?: boolean;
    persistent?: boolean;
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { ElementRuler } = await import('./extensions/element-ruler');
    const extension = new ElementRuler();

    const manager = this.browserEngine.getExtensionManager();
    manager.register(extension);

    const page = await this.browserEngine.createPage(url, options.viewport as ViewportPreset || 'desktop');
    await manager.injectExtension(page, 'element-ruler');

    const params = {
      params: {
        selector,
        showDimensions: options.showDimensions ?? true,
        showMargin: options.showMargin ?? true,
        showPadding: options.showPadding ?? true,
        showBorder: options.showBorder ?? true,
        showPosition: options.showPosition ?? true,
        persistent: options.persistent ?? false,
        scrollIntoView: true,
      }
    };

    // First call might scroll element into view
    let result = await manager.executeExtension(page, 'element-ruler', 'measureElement', params);

    // If element was scrolled, wait and call again WITHOUT scrolling to get measurements
    if (result.success && result.data?.scrolled) {
      await page.waitForTimeout(1000);  // Wait for smooth scroll animation
      const paramsNoScroll = {
        params: {
          ...params.params,
          scrollIntoView: false,
        }
      };
      result = await manager.executeExtension(page, 'element-ruler', 'measureElement', paramsNoScroll);
    }

    // Wait for overlays to render
    await page.waitForTimeout(300);

    // Capture screenshot with measurements visible
    const screenshotPath = path.join(
      this.config.output.directory,
      `measure-${selector.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: false });

    await page.close();

    if (!result.success) {
      throw new Error(`Element measurement failed: ${result.error}`);
    }

    return {
      ...result.data,
      screenshot: screenshotPath,
      expectations: options.expectations,
    };
  }

  /**
   * Detect UI components on the page
   */
  async detectComponents(url: string, options: {
    type?: string;
    highlightComponents?: boolean;
    includePosition?: boolean;
    viewport?: 'mobile' | 'tablet' | 'desktop';
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { ComponentDetector } = await import('./extensions/component-detector');
    const extension = new ComponentDetector();

    const manager = this.browserEngine.getExtensionManager();
    manager.register(extension);

    const page = await this.browserEngine.createPage(url, options.viewport as ViewportPreset || 'desktop');
    await manager.injectExtension(page, 'component-detector');

    let result: any;
    if (options.type) {
      result = await manager.executeExtension(page, 'component-detector', 'detectByType', {
        params: {
          type: options.type,
        }
      });
    } else {
      result = await manager.executeExtension(page, 'component-detector', 'detectComponents', {
        params: {
          includePosition: options.includePosition ?? false,
          highlightComponents: options.highlightComponents ?? false,
        }
      });
    }

    // Capture screenshot if highlighting
    let screenshotPath: string | undefined;
    if (options.highlightComponents) {
      await page.waitForTimeout(300);
      screenshotPath = path.join(
        this.config.output.directory,
        `components-${Date.now()}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    await page.close();

    if (!result.success) {
      throw new Error(`Component detection failed: ${result.error}`);
    }

    return {
      ...result.data,
      screenshot: screenshotPath,
      expectations: options.expectations,
    };
  }

  /**
   * Show layout grid overlay
   */
  async showLayoutGrid(url: string, options: {
    gridSize?: number;
    columns?: number;
    gutter?: number;
    maxWidth?: number;
    showRuler?: boolean;
    showCenterLines?: boolean;
    viewport?: 'mobile' | 'tablet' | 'desktop';
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { LayoutGrid } = await import('./extensions/layout-grid');
    const extension = new LayoutGrid();

    const manager = this.browserEngine.getExtensionManager();
    manager.register(extension);

    const page = await this.browserEngine.createPage(url, options.viewport as ViewportPreset || 'desktop');
    await manager.injectExtension(page, 'layout-grid');

    let result: any;
    if (options.columns) {
      result = await manager.executeExtension(page, 'layout-grid', 'showColumnGrid', {
        params: {
          columns: options.columns,
          gutter: options.gutter ?? 20,
          maxWidth: options.maxWidth ?? 1200,
        }
      });
    } else {
      result = await manager.executeExtension(page, 'layout-grid', 'showGrid', {
        params: {
          gridSize: options.gridSize ?? 8,
          showRuler: options.showRuler ?? true,
          showCenterLines: options.showCenterLines ?? true,
        }
      });
    }

    // Wait for grid to render
    await page.waitForTimeout(300);

    // Capture screenshot with grid visible
    const screenshotPath = path.join(
      this.config.output.directory,
      `grid-${Date.now()}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: false });

    await page.close();

    if (!result.success) {
      throw new Error(`Layout grid failed: ${result.error}`);
    }

    return {
      ...result.data,
      screenshot: screenshotPath,
      expectations: options.expectations,
    };
  }

  /**
   * Show responsive breakpoints indicator
   */
  async showBreakpoints(url: string, options: {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    showDimensions?: boolean;
    showOrientation?: boolean;
    viewport?: 'mobile' | 'tablet' | 'desktop';
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { BreakpointVisualizer } = await import('./extensions/breakpoint-visualizer');
    const extension = new BreakpointVisualizer();

    const manager = this.browserEngine.getExtensionManager();
    manager.register(extension);

    const page = await this.browserEngine.createPage(url, options.viewport as ViewportPreset || 'desktop');
    await manager.injectExtension(page, 'breakpoint-visualizer');

    const result = await manager.executeExtension(page, 'breakpoint-visualizer', 'showBreakpoints', {
      params: {
        position: options.position ?? 'bottom-right',
        showDimensions: options.showDimensions ?? true,
        showOrientation: options.showOrientation ?? true,
      }
    });

    // Wait for indicator to render
    await page.waitForTimeout(300);

    // Capture screenshot with breakpoint indicator visible
    const screenshotPath = path.join(
      this.config.output.directory,
      `breakpoints-${Date.now()}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: false });

    await page.close();

    if (!result.success) {
      throw new Error(`Breakpoint visualization failed: ${result.error}`);
    }

    return {
      ...result.data,
      screenshot: screenshotPath,
      expectations: options.expectations,
    };
  }

  /**
   * Analyze CSS media queries
   */
  async analyzeMediaQueries(url: string, options: {
    viewport?: 'mobile' | 'tablet' | 'desktop';
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { MediaQueryInspector } = await import('./extensions/media-query-inspector');
    const extension = new MediaQueryInspector();

    const manager = this.browserEngine.getExtensionManager();
    manager.register(extension);

    const page = await this.browserEngine.createPage(url, options.viewport as ViewportPreset || 'desktop');
    await manager.injectExtension(page, 'media-query-inspector');

    const result = await manager.executeExtension(page, 'media-query-inspector', 'generateReport');

    await page.close();

    if (!result.success) {
      throw new Error(`Media query analysis failed: ${result.error}`);
    }

    return {
      ...result.data,
      expectations: options.expectations,
    };
  }

  /**
   * Visually inspect accessibility violations with overlays
   */
  async inspectA11y(url: string, options: {
    viewport?: 'mobile' | 'tablet' | 'desktop';
    showTooltips?: boolean;
    enableHover?: boolean;
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { A11yInspector } = await import('./extensions/a11y-inspector');
    const extension = new A11yInspector();

    const manager = this.browserEngine.getExtensionManager();
    manager.register(extension);

    const page = await this.browserEngine.createPage(url, options.viewport as ViewportPreset || 'desktop');

    // First run accessibility checks to get violations
    const violations = await this.browserEngine.runAccessibilityChecks(page);

    await manager.injectExtension(page, 'a11y-inspector');

    // Show violations on the page
    const result = await manager.executeExtension(page, 'a11y-inspector', 'showViolations', {
      params: {
        violations: violations.violations || [],
        showTooltips: options.showTooltips ?? true,
        enableHover: options.enableHover ?? true,
      }
    });

    // Wait for overlays to render
    await page.waitForTimeout(500);

    // Capture screenshot with violations highlighted
    const screenshotPath = path.join(
      this.config.output.directory,
      `a11y-violations-${Date.now()}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await page.close();

    if (!result.success) {
      throw new Error(`A11y inspection failed: ${result.error}`);
    }

    return {
      ...result.data,
      violations,
      screenshot: screenshotPath,
      expectations: options.expectations,
    };
  }

  /**
   * Inspect element with action sequence
   */
  async inspectWithSequence(url: string, selector: string, actions: Array<{
    type: 'click' | 'hover' | 'focus' | 'type' | 'wait';
    target?: string;
    value?: string;
    duration?: number;
  }>, options: {
    viewport?: 'mobile' | 'tablet' | 'desktop';
    captureIntermediate?: boolean;
    captureViewport?: boolean;
    expectations?: string;
  } = {}): Promise<any> {
    if (!this.isStarted) {
      await this.start();
    }

    const { ElementInspector } = await import('./extensions/element-inspector');
    const extension = new ElementInspector();
    extension.setOutputDir(this.config.output.directory);

    const manager = this.browserEngine.getExtensionManager();
    manager.register(extension);

    const page = await this.browserEngine.createPage(url, options.viewport as ViewportPreset || 'desktop');
    await manager.injectExtension(page, 'element-inspector');

    const result = await extension.inspectWithActionSequence(page, selector, actions, {
      captureIntermediate: options.captureIntermediate ?? false,
      captureViewport: options.captureViewport ?? false,
    });

    await page.close();

    return {
      ...result,
      expectations: options.expectations,
    };
  }

  /**
   * Stop server and close browser
   */
  async close(): Promise<void> {
    console.log('🛑 Shutting down...');

    await this.browserEngine.close();
    await this.serverManager.stop();

    this.isStarted = false;
    console.log('✓ Cleanup complete');
  }


  /**
   * Merge user config with defaults
   */
  private mergeConfig(config: UISentinelConfig): Required<UISentinelConfig> {
    return {
      projectPath: config.projectPath || process.cwd(),
      framework: config.framework || 'auto',
      port: config.port || 3000,
      host: config.host || 'http://localhost:3000',
      headless: config.headless ?? true,
      viewports: config.viewports || ['mobile', 'desktop'] as ViewportPreset[],
      accessibility: {
        enabled: config.accessibility?.enabled ?? true,
        standard: config.accessibility?.standard || 'WCAG21AA',
        ignore: config.accessibility?.ignore || [],
      },
      screenshot: {
        enabled: config.screenshot?.enabled ?? true,
        fullPage: config.screenshot?.fullPage ?? true,
        format: config.screenshot?.format || 'png',
        quality: config.screenshot?.quality || 90,
      },
      output: {
        directory: config.output?.directory || './uisentinel-output',
        format: config.output?.format || 'json',
      },
      timeout: config.timeout || 30000,
      routes: config.routes || ['/'],
    };
  }
}

// Export for use
export * from './types';
export { ExtensionManager, BrowserExtension, BaseExtension } from './extensions/extension-manager';
export { ElementInspector } from './extensions/element-inspector';
export { A11yInspector } from './extensions/a11y-inspector';
export { ContrastChecker } from './extensions/contrast-checker';
export { ElementRuler } from './extensions/element-ruler';
export { ComponentDetector } from './extensions/component-detector';
export { LayoutGrid } from './extensions/layout-grid';
export { BreakpointVisualizer } from './extensions/breakpoint-visualizer';
// New responsive design extensions
export { MediaQueryInspector } from './extensions/media-query-inspector';
export { ResponsiveDesignInspector } from './extensions/responsive-design-inspector';
export { MobileUXAnalyzer } from './extensions/mobile-ux-analyzer';
// AI Agent screenshot extensions
export { FullPageScreenshotExtension } from './extensions/fullpage-screenshot';
export { ViewportScreenshotExtension } from './extensions/viewport-screenshot';

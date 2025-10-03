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
   * Capture and validate a URL
   */
  async capture(options: Partial<CaptureOptions>): Promise<ValidationResult> {
    if (!this.isStarted) {
      await this.start();
    }

    const captureOptions: CaptureOptions = {
      url: options.url || this.config.host || 'http://localhost:3000',
      viewports: options.viewports || this.config.viewports,
      accessibility: options.accessibility ?? this.config.accessibility.enabled,
      screenshot: options.screenshot ?? this.config.screenshot.enabled,
      layoutAnalysis: options.layoutAnalysis ?? true,
      fullPage: options.fullPage ?? this.config.screenshot.fullPage,
      waitForSelector: options.waitForSelector,
      waitForTimeout: options.waitForTimeout || this.config.timeout,
      name: options.name,
      description: options.description,
      actions: options.actions,
    };

    console.log(`📸 Capturing ${captureOptions.url}...`);

    const result = await this.browserEngine.capture(captureOptions);
    const suggestions = this.generateSuggestions(result);

    // Generate markdown report if name is provided
    if (captureOptions.name) {
      const reportContent = this.browserEngine.generateCaptureReport(
        captureOptions,
        result.screenshots,
        result.accessibility
      );
      
      if (reportContent) {
        const reportPath = path.join(
          this.config.output.directory,
          `${captureOptions.name}.md`
        );
        fs.writeFileSync(reportPath, reportContent);
      }
    }

    return {
      status: suggestions.length === 0 ? 'success' : 'warning',
      url: captureOptions.url,
      timestamp: new Date().toISOString(),
      screenshots: result.screenshots,
      accessibility: result.accessibility,
      layout: result.layout,
      suggestions,
      errors: [],
    };
  }

  /**
   * Validate multiple routes
   */
  async validate(routes?: string[]): Promise<ValidationResult[]> {
    if (!this.isStarted) {
      await this.start();
    }

    const routesToValidate = routes || this.config.routes || ['/'];
    const results: ValidationResult[] = [];

    for (const route of routesToValidate) {
      const url = new URL(route, this.config.host).href;
      const result = await this.capture({ url });
      results.push(result);
    }

    return results;
  }

  /**
   * Run visual diff against baseline
   */
  async diff(currentScreenshot: string, baseline?: string): Promise<ValidationResult> {
    const baselinePath = baseline || this.findMatchingBaseline(currentScreenshot);
    
    if (!baselinePath) {
      throw new Error('No baseline found. Create one with createBaseline()');
    }

    const diffResult = await this.visualDiff.compare(baselinePath, currentScreenshot);
    
    return {
      status: diffResult.passed ? 'success' : 'error',
      url: '',
      timestamp: new Date().toISOString(),
      screenshots: [],
      visualDiff: diffResult,
      suggestions: diffResult.passed 
        ? [] 
        : [`Visual regression detected: ${diffResult.diffPercentage}% difference`],
      errors: [],
    };
  }

  /**
   * Create a baseline from current screenshot
   */
  async createBaseline(screenshotPath: string, name: string): Promise<string> {
    return this.visualDiff.createBaseline(screenshotPath, name);
  }

  /**
   * Generate agent-friendly report
   */
  async agentReport(focus?: string[]): Promise<string> {
    const results = await this.validate();
    return this.formatForAgent(results, focus);
  }

  /**
   * Get the browser engine for advanced capture operations
   * Use this to access element-specific captures, clipping, zoom, etc.
   */
  getBrowserEngine(): BrowserEngine {
    return this.browserEngine;
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
   * Generate actionable suggestions from results
   */
  private generateSuggestions(result: any): string[] {
    const suggestions: string[] = [];

    // Accessibility suggestions
    if (result.accessibility) {
      result.accessibility.violations.forEach((violation: any) => {
        const impact = violation.impact.toUpperCase();
        suggestions.push(
          `[${impact}] ${violation.help} - ${violation.nodes.length} instance(s)`
        );
      });

      if (result.accessibility.score < 80) {
        suggestions.push(
          `Accessibility score is ${result.accessibility.score}/100. Aim for 90+.`
        );
      }
    }

    // Layout suggestions
    if (result.layout) {
      result.layout.overflows.forEach((overflow: any) => {
        suggestions.push(
          `Element ${overflow.element} overflows by ${overflow.overflowX}px horizontally`
        );
      });

      result.layout.invisibleText.forEach((text: any) => {
        suggestions.push(`Invisible text detected on ${text.element}: ${text.reason}`);
      });
    }

    return suggestions;
  }

  /**
   * Find matching baseline for a screenshot
   */
  private findMatchingBaseline(screenshotPath: string): string | null {
    const baselines = this.visualDiff.getBaselines();
    const screenshotName = path.basename(screenshotPath);
    
    // Try to find exact match or similar name
    return baselines.find(b => path.basename(b) === screenshotName) || baselines[0] || null;
  }

  /**
   * Format results for AI agent consumption
   */
  private formatForAgent(results: ValidationResult[], focus?: string[]): string {
    let report = '# Visual Validation Report\n\n';

    results.forEach((result, index) => {
      report += `## Page ${index + 1}: ${result.url}\n\n`;

      if (!focus || focus.includes('accessibility')) {
        if (result.accessibility) {
          report += `### Accessibility (Score: ${result.accessibility.score}/100)\n`;
          if (result.accessibility.violations.length > 0) {
            report += '**Issues:**\n';
            result.accessibility.violations.forEach(v => {
              report += `- [${v.impact}] ${v.help}\n`;
            });
          } else {
            report += '✓ No violations found\n';
          }
          report += '\n';
        }
      }

      if (!focus || focus.includes('layout')) {
        if (result.layout) {
          report += '### Layout\n';
          if (result.layout.overflows.length > 0) {
            report += '**Overflows:**\n';
            result.layout.overflows.forEach(o => {
              report += `- ${o.element}: ${o.overflowX}px horizontal\n`;
            });
          } else {
            report += '✓ No overflow issues\n';
          }
          report += '\n';
        }
      }

      if (result.suggestions.length > 0) {
        report += '### Suggestions\n';
        result.suggestions.forEach(s => {
          report += `- ${s}\n`;
        });
        report += '\n';
      }
    });

    return report;
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

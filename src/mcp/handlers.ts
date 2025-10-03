/**
 * MCP Tool Handlers
 *
 * These handlers execute browser extension functionality in response to MCP tool calls.
 * Each handler creates a UISentinel instance, runs the appropriate extension, and returns
 * structured results for AI agents.
 */

import * as path from 'path';
import * as fs from 'fs';
import { UISentinel } from '../index';
import { ElementInspector } from '../extensions/element-inspector';
import { A11yInspector } from '../extensions/a11y-inspector';
import { ContrastChecker } from '../extensions/contrast-checker';
import { ElementRuler } from '../extensions/element-ruler';
import { ComponentDetector } from '../extensions/component-detector';
import { LayoutGrid } from '../extensions/layout-grid';
import { BreakpointVisualizer } from '../extensions/breakpoint-visualizer';
import type {
  MCPToolResponse,
  InspectElementParams,
  InspectMultipleParams,
  InspectWithActionParams,
  CheckAccessibilityParams,
  CheckContrastParams,
  MeasureElementParams,
  DetectComponentsParams,
  ShowGridParams,
  ShowBreakpointsParams,
  AnalyzeLayoutParams,
  DetectProjectParams,
} from './types';
import { FrameworkDetector } from '../framework-detector';

const DEFAULT_OUTPUT_DIR = './mcp-output';

/**
 * Helper function to save agent expectations to a markdown file.
 * This enables hypothesis-driven testing where agents document what they expect to see
 * BEFORE capturing/analyzing, then compare results against expectations.
 *
 * @param expectations - The agent's expectations/hypothesis
 * @param outputDir - Directory to save the expectations file
 * @param prefix - Filename prefix (e.g., 'inspect', 'accessibility')
 * @returns Path to the saved expectations file, or undefined if no expectations provided
 */
function saveExpectations(expectations: string | undefined, outputDir: string, prefix: string): string | undefined {
  if (!expectations) return undefined;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${prefix}-expectations-${timestamp}.md`;
  const filepath = path.join(outputDir, filename);

  // Create markdown content with metadata
  const content = `# Test Expectations

**Generated**: ${new Date().toISOString()}
**Test Type**: ${prefix}

## Agent's Hypothesis

${expectations}

---

**Instructions for Analysis**:
1. Read this expectations document first
2. Review the captured screenshots and metadata
3. Compare actual results against the expectations documented above
4. Note any discrepancies between expected and actual behavior
5. Document findings and determine if the test passed or failed based on expectations
`;

  fs.writeFileSync(filepath, content, 'utf-8');
  return filepath;
}

/**
 * Element Inspection Handlers
 */

export async function handleInspectElement(params: InspectElementParams): Promise<MCPToolResponse> {
  const sentinel = new UISentinel({
    headless: true,
    output: { directory: DEFAULT_OUTPUT_DIR, format: 'json' },
  });

  try {
    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    // Register and set up ElementInspector
    const inspector = new ElementInspector();
    const outputDir = path.join(process.cwd(), DEFAULT_OUTPUT_DIR, 'inspections');
    inspector.setOutputDir(outputDir);
    manager.register(inspector);

    // Save agent expectations before capturing
    const expectationsFile = saveExpectations(params.expectations, outputDir, 'inspect-element');

    // Create page
    const page = await engine.createPage(params.url, params.viewport || 'desktop');
    await page.waitForLoadState('networkidle');

    // Inject extension
    await manager.injectExtension(page, 'element-inspector');

    // Run inspection
    const result = await inspector.inspect(page, params.selector, {
      showOverlay: params.showOverlay ?? true,
      captureScreenshot: params.captureScreenshot ?? true,
      captureElementScreenshot: params.captureElementScreenshot ?? true,
      captureZoomedScreenshot: params.captureZoomedScreenshot ?? false,
      zoomLevel: params.zoomLevel ?? 2,
      includeParent: params.includeParent ?? true,
      includeChildren: params.includeChildren ?? true,
      includeComputedStyles: params.includeComputedStyles ?? true,
      includeAttributes: params.includeAttributes ?? true,
      autoSave: true,
    });

    await page.close();
    await sentinel.close();

    // If inspection failed, return error
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Element inspection failed',
      };
    }

    return {
      success: result.success,
      data: {
        element: result.element,
        selector: result.selector,
        timestamp: result.timestamp,
      },
      files: {
        screenshots: Object.values(result.screenshots || {}),
        json: result.files?.metadata ? [result.files.metadata] : [],
        reports: result.files?.report ? [result.files.report] : [],
        expectations: expectationsFile,
      },
    };
  } catch (error) {
    await sentinel.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function handleInspectMultiple(params: InspectMultipleParams): Promise<MCPToolResponse> {
  const sentinel = new UISentinel({
    headless: true,
    output: { directory: DEFAULT_OUTPUT_DIR, format: 'json' },
  });

  try {
    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    const inspector = new ElementInspector();
    const outputDir = path.join(process.cwd(), DEFAULT_OUTPUT_DIR, 'inspections');
    inspector.setOutputDir(outputDir);
    manager.register(inspector);

    // Save agent expectations before capturing
    const expectationsFile = saveExpectations(params.expectations, outputDir, 'inspect-multiple');

    const page = await engine.createPage(params.url, params.viewport || 'desktop');
    await page.waitForLoadState('networkidle');
    await manager.injectExtension(page, 'element-inspector');

    const result = await inspector.inspectMultiple(page, params.selectors, {
      captureScreenshots: params.captureScreenshots ?? true,
    });

    await page.close();
    await sentinel.close();

    return {
      success: result.success,
      data: result.summary,
      files: {
        json: result.files?.summary ? [result.files.summary] : [],
        reports: result.files?.report ? [result.files.report] : [],
        expectations: expectationsFile,
      },
    };
  } catch (error) {
    await sentinel.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function handleInspectWithAction(params: InspectWithActionParams): Promise<MCPToolResponse> {
  const sentinel = new UISentinel({
    headless: true,
    output: { directory: DEFAULT_OUTPUT_DIR, format: 'json' },
  });

  try {
    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    const inspector = new ElementInspector();
    const outputDir = path.join(process.cwd(), DEFAULT_OUTPUT_DIR, 'inspections');
    inspector.setOutputDir(outputDir);
    manager.register(inspector);

    // Save agent expectations before capturing
    const expectationsFile = saveExpectations(params.expectations, outputDir, 'inspect-with-action');

    const page = await engine.createPage(params.url, params.viewport || 'desktop');
    await page.waitForLoadState('networkidle');
    await manager.injectExtension(page, 'element-inspector');

    const result = await inspector.inspectWithAction(
      page,
      params.selector,
      { type: params.action },
      { captureDelay: params.captureDelay ?? 500 }
    );

    await page.close();
    await sentinel.close();

    return {
      success: result.success,
      data: {
        action: result.action,
        selector: result.selector,
        elementState: result.elementState,
        timestamp: result.timestamp,
      },
      files: {
        screenshots: [result.screenshots?.before, result.screenshots?.after].filter(Boolean),
        json: result.files?.result ? [result.files.result] : [],
        expectations: expectationsFile,
      },
    };
  } catch (error) {
    await sentinel.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Accessibility Handlers
 */

export async function handleCheckAccessibility(params: CheckAccessibilityParams): Promise<MCPToolResponse> {
  const sentinel = new UISentinel({
    headless: true,
    output: { directory: DEFAULT_OUTPUT_DIR, format: 'json' },
  });

  try {
    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    const a11yInspector = new A11yInspector();
    manager.register(a11yInspector);

    const outputDir = path.join(process.cwd(), DEFAULT_OUTPUT_DIR, 'a11y');

    // Save agent expectations before capturing
    const expectationsFile = saveExpectations(params.expectations, outputDir, 'check-accessibility');

    const page = await engine.createPage(params.url, params.viewport || 'desktop');
    await page.waitForLoadState('networkidle');
    await manager.injectExtension(page, 'a11y-inspector');

    // Run accessibility check
    const checkResult = await manager.executeExtension(page, 'a11y-inspector', 'checkAccessibility', {});

    if (!checkResult.success || !checkResult.data) {
      throw new Error('Accessibility check failed');
    }

    const violations = checkResult.data.violations || [];

    // Show violations if requested
    if (params.showViolations && violations.length > 0) {
      await manager.executeExtension(page, 'a11y-inspector', 'showViolations', {
        params: {
          violations,
          showTooltips: true,
          highlightIssues: params.highlightIssues ?? true,
        },
      });
    }

    // Capture screenshot
    const screenshotPath = path.join(outputDir, `a11y-check-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await page.close();
    await sentinel.close();

    return {
      success: true,
      data: {
        score: checkResult.data.score,
        violations: violations.map((v: any) => ({
          severity: v.impact,
          rule: v.id,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          affectedElements: v.nodes.map((n: any) => n.target[0]),
        })),
        summary: {
          total: violations.length,
          critical: violations.filter((v: any) => v.impact === 'critical').length,
          serious: violations.filter((v: any) => v.impact === 'serious').length,
          moderate: violations.filter((v: any) => v.impact === 'moderate').length,
          minor: violations.filter((v: any) => v.impact === 'minor').length,
        },
      },
      files: {
        screenshots: [screenshotPath],
        expectations: expectationsFile,
      },
    };
  } catch (error) {
    await sentinel.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function handleCheckContrast(params: CheckContrastParams): Promise<MCPToolResponse> {
  const sentinel = new UISentinel({
    headless: true,
    output: { directory: DEFAULT_OUTPUT_DIR, format: 'json' },
  });

  try {
    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    const contrastChecker = new ContrastChecker();
    manager.register(contrastChecker);

    const outputDir = path.join(process.cwd(), DEFAULT_OUTPUT_DIR, 'contrast');

    // Save agent expectations before capturing
    const expectationsFile = saveExpectations(params.expectations, outputDir, 'check-contrast');

    const page = await engine.createPage(params.url, params.viewport || 'desktop');
    await page.waitForLoadState('networkidle');
    await manager.injectExtension(page, 'contrast-checker');

    const result = await manager.executeExtension(page, 'contrast-checker', 'checkContrast', {
      params: {
        minRatioAA: params.minRatioAA ?? 4.5,
        minRatioAAA: params.minRatioAAA ?? 7,
        highlightIssues: params.highlightIssues ?? true,
      },
    });

    // Capture screenshot
    const screenshotPath = path.join(outputDir, `contrast-check-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await page.close();
    await sentinel.close();

    return {
      success: result.success,
      data: result.data,
      files: {
        screenshots: [screenshotPath],
        expectations: expectationsFile,
      },
    };
  } catch (error) {
    await sentinel.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Layout & Measurement Handlers
 */

export async function handleMeasureElement(params: MeasureElementParams): Promise<MCPToolResponse> {
  const sentinel = new UISentinel({
    headless: true,
    output: { directory: DEFAULT_OUTPUT_DIR, format: 'json' },
  });

  try {
    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    const ruler = new ElementRuler();
    manager.register(ruler);

    const outputDir = path.join(process.cwd(), DEFAULT_OUTPUT_DIR, 'measurements');

    // Save agent expectations before capturing
    const expectationsFile = saveExpectations(params.expectations, outputDir, 'measure-element');

    const page = await engine.createPage(params.url, params.viewport || 'desktop');
    await page.waitForLoadState('networkidle');
    await manager.injectExtension(page, 'element-ruler');

    const result = await manager.executeExtension(page, 'element-ruler', 'measureElement', {
      params: {
        selector: params.selector,
        showDimensions: params.showDimensions ?? true,
        showMargin: params.showMargin ?? true,
        showPadding: params.showPadding ?? true,
        showBorder: params.showBorder ?? true,
      },
    });

    // Capture screenshot
    const screenshotPath = path.join(outputDir, `measure-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await page.close();
    await sentinel.close();

    return {
      success: result.success,
      data: result.data,
      files: {
        screenshots: [screenshotPath],
        expectations: expectationsFile,
      },
    };
  } catch (error) {
    await sentinel.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function handleShowGrid(params: ShowGridParams): Promise<MCPToolResponse> {
  const sentinel = new UISentinel({
    headless: true,
    output: { directory: DEFAULT_OUTPUT_DIR, format: 'json' },
  });

  try {
    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    const layoutGrid = new LayoutGrid();
    manager.register(layoutGrid);

    const outputDir = path.join(process.cwd(), DEFAULT_OUTPUT_DIR, 'grids');

    // Save agent expectations before capturing
    const expectationsFile = saveExpectations(params.expectations, outputDir, 'show-grid');

    const page = await engine.createPage(params.url, params.viewport || 'desktop');
    await page.waitForLoadState('networkidle');
    await manager.injectExtension(page, 'layout-grid');

    const gridType = params.gridType || '8px';
    let result;

    if (gridType === '12-column') {
      result = await manager.executeExtension(page, 'layout-grid', 'showResponsiveGrid', {});
    } else if (gridType === 'alignment-guides') {
      result = await manager.executeExtension(page, 'layout-grid', 'showAlignmentGuides', {});
    } else {
      result = await manager.executeExtension(page, 'layout-grid', 'showGrid', {
        params: { gridSize: params.gridSize ?? 8 },
      });
    }

    // Capture screenshot
    const screenshotPath = path.join(outputDir, `grid-${gridType}-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await page.close();
    await sentinel.close();

    return {
      success: result.success,
      data: result.data,
      files: {
        screenshots: [screenshotPath],
        expectations: expectationsFile,
      },
    };
  } catch (error) {
    await sentinel.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Component Analysis Handlers
 */

export async function handleDetectComponents(params: DetectComponentsParams): Promise<MCPToolResponse> {
  const sentinel = new UISentinel({
    headless: true,
    output: { directory: DEFAULT_OUTPUT_DIR, format: 'json' },
  });

  try {
    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    const componentDetector = new ComponentDetector();
    manager.register(componentDetector);

    const outputDir = path.join(process.cwd(), DEFAULT_OUTPUT_DIR, 'components');

    // Save agent expectations before capturing
    const expectationsFile = saveExpectations(params.expectations, outputDir, 'detect-components');

    const page = await engine.createPage(params.url, params.viewport || 'desktop');
    await page.waitForLoadState('networkidle');
    await manager.injectExtension(page, 'component-detector');

    const result = await manager.executeExtension(page, 'component-detector', 'detectComponents', {
      params: {
        includePosition: params.includePosition ?? false,
        highlightComponents: params.highlightComponents ?? false,
      },
    });

    // Capture screenshot if highlighting
    let screenshotPath;
    if (params.highlightComponents) {
      screenshotPath = path.join(outputDir, `components-${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    await page.close();
    await sentinel.close();

    return {
      success: result.success,
      data: result.data,
      files: screenshotPath ? { screenshots: [screenshotPath], expectations: expectationsFile } : { expectations: expectationsFile },
    };
  } catch (error) {
    await sentinel.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Responsive Design Handlers
 */

export async function handleCheckBreakpoints(params: ShowBreakpointsParams): Promise<MCPToolResponse> {
  const sentinel = new UISentinel({
    headless: true,
    output: { directory: DEFAULT_OUTPUT_DIR, format: 'json' },
  });

  try {
    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    const breakpointViz = new BreakpointVisualizer();
    manager.register(breakpointViz);

    const outputDir = path.join(process.cwd(), DEFAULT_OUTPUT_DIR, 'breakpoints');

    // Save agent expectations before capturing
    const expectationsFile = saveExpectations(params.expectations, outputDir, 'check-breakpoints');

    const viewports: Array<'mobile' | 'tablet' | 'desktop'> = ['mobile', 'tablet', 'desktop'];
    const screenshots: string[] = [];

    for (const viewport of viewports) {
      const page = await engine.createPage(params.url, viewport);
      await page.waitForLoadState('networkidle');
      await manager.injectExtension(page, 'breakpoint-visualizer');

      await manager.executeExtension(page, 'breakpoint-visualizer', 'showBreakpoints', {});

      const screenshotPath = path.join(
        outputDir,
        `breakpoint-${viewport}-${Date.now()}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
      screenshots.push(screenshotPath);

      await page.close();
    }

    await sentinel.close();

    return {
      success: true,
      data: {
        breakpoints: viewports.map((v, i) => ({
          viewport: v,
          screenshot: screenshots[i],
        })),
      },
      files: {
        screenshots,
        expectations: expectationsFile,
      },
    };
  } catch (error) {
    await sentinel.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Layout Analysis Handlers
 */

export async function handleAnalyzeLayout(params: AnalyzeLayoutParams): Promise<MCPToolResponse> {
  const sentinel = new UISentinel({
    headless: true,
    output: { directory: DEFAULT_OUTPUT_DIR, format: 'json' },
  });

  try {
    await sentinel.start();
    const engine = sentinel.getBrowserEngine();

    const outputDir = path.join(process.cwd(), DEFAULT_OUTPUT_DIR, 'layout');

    // Save agent expectations before capturing
    const expectationsFile = saveExpectations(params.expectations, outputDir, 'analyze-layout');

    const page = await engine.createPage(params.url, params.viewport || 'desktop');
    await page.waitForLoadState('networkidle');

    // Use browser engine's analyzeLayout method
    const result = await engine.capture({
      url: params.url,
      viewports: [params.viewport || 'desktop'],
      layoutAnalysis: true,
      screenshot: true,
    });

    const screenshotPath = path.join(
      outputDir,
      `layout-analysis-${Date.now()}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await page.close();
    await sentinel.close();

    if (!result.layout) {
      throw new Error('Layout analysis failed');
    }

    return {
      success: true,
      data: {
        elements: result.layout.elements,
        overflows: result.layout.overflows,
        invisibleText: result.layout.invisibleText,
        viewport: result.layout.viewport,
      },
      files: {
        screenshots: [screenshotPath],
        expectations: expectationsFile,
      },
    };
  } catch (error) {
    await sentinel.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Project Detection Handlers
 */

export async function handleDetectProject(params: DetectProjectParams): Promise<MCPToolResponse> {
  try {
    const detector = new FrameworkDetector(params.projectPath);
    const result = await detector.detect();
    const packageManager = detector.getPackageManager();

    return {
      success: true,
      data: {
        framework: result.framework,
        packageManager,
        devCommand: result.command,
        defaultPort: result.port,
        configFiles: result.configFile ? [result.configFile] : [],
        lockFile: result.lockFile,
        confidence: result.confidence,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

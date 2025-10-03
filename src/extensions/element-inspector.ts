import { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { BaseExtension } from './extension-manager';
import { ScreenshotAnnotator, AnnotationConfig } from './screenshot-annotator';

/**
 * Enhanced Element Inspector Extension
 * Comprehensive element inspection with CDP, JSON export, and screenshot annotation
 * Designed for AI agents to understand, debug, and document UIs
 */
export class ElementInspector extends BaseExtension {
  id = 'element-inspector';
  name = 'Element Inspector';
  description = 'Comprehensive element inspection with CDP, JSON export, screenshots, and annotations';

  private cdpSessions: Map<Page, any> = new Map();
  private outputDir: string = './inspection-output';
  private annotator: ScreenshotAnnotator = new ScreenshotAnnotator();

  /**
   * Set output directory for all inspection artifacts
   */
  setOutputDir(dir: string): void {
    this.outputDir = path.resolve(dir);
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Initialize CDP session for the page
   */
  async initialize(page: Page): Promise<void> {
    const client = await page.context().newCDPSession(page);
    await client.send('DOM.enable');
    await client.send('CSS.enable');
    await client.send('Overlay.enable');
    this.cdpSessions.set(page, client);
  }

  /**
   * Cleanup CDP session
   */
  async cleanup(page: Page): Promise<void> {
    const client = this.cdpSessions.get(page);
    if (client) {
      await client.send('Overlay.hideHighlight').catch(() => {});
      await client.send('Overlay.disable').catch(() => {});
      this.cdpSessions.delete(page);
    }
  }

  /**
   * Comprehensive element inspection with full metadata
   */
  async inspect(page: Page, selector: string, options: {
    showOverlay?: boolean;
    showInfo?: boolean;
    showRulers?: boolean;
    showExtensionLines?: boolean;
    captureScreenshot?: boolean;
    captureViewportScreenshot?: boolean;
    captureElementScreenshot?: boolean;
    captureZoomedScreenshot?: boolean;
    zoomLevel?: number;
    includeParent?: boolean;
    includeChildren?: boolean;
    includeComputedStyles?: boolean;
    includeAttributes?: boolean;
    autoSave?: boolean;
    outputName?: string;
  } = {}): Promise<any> {
    const {
      showOverlay = true,
      showInfo = true,
      showRulers = false,
      showExtensionLines = true,
      captureScreenshot = true,
      captureViewportScreenshot = true,
      captureElementScreenshot = true,
      captureZoomedScreenshot = false,
      zoomLevel = 2,
      includeParent = true,
      includeChildren = true,
      includeComputedStyles = true,
      includeAttributes = true,
      autoSave = true,
      outputName,
    } = options;

    // Ensure output directory exists
    if (autoSave && !fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = outputName || `element-${selector.replace(/[^a-z0-9]/gi, '_')}-${timestamp}`;
    const element = await page.$(selector);

    if (!element) {
      return { success: false, error: `Element not found: ${selector}` };
    }

    // Check if element is in viewport, and scroll if needed
    const isInViewport = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }, selector);

    // Only scroll if element is not in viewport
    if (!isInViewport) {
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }

    // Get comprehensive element information
    const elementInfo = await this.gatherElementInfo(page, selector, {
      includeParent,
      includeChildren,
      includeComputedStyles,
      includeAttributes,
    });

    if (!elementInfo.success) {
      return elementInfo;
    }

    const result: any = {
      success: true,
      timestamp,
      selector,
      element: elementInfo.data,
      screenshots: {},
      files: {},
    };

    // Show CDP overlay if requested
    if (showOverlay) {
      await this.showCDPOverlay(page, selector, { showInfo, showRulers, showExtensionLines });
    }

    // Capture full-page screenshots
    if (captureScreenshot) {
      const fullPagePath = path.join(this.outputDir, `${baseName}-fullpage.png`);
      await page.screenshot({ path: fullPagePath, fullPage: true });
      result.screenshots.fullPage = fullPagePath;
      result.files.fullPageScreenshot = fullPagePath;

      // Add DevTools-style annotation overlay
      if (showOverlay && result.element) {
        try {
          // Calculate accessibility info once
          const accessibility = await this.calculateAccessibility(page, selector);

          // Use absolute rect coordinates for full-page screenshots
          const annotationConfig: AnnotationConfig = {
            element: {
              tagName: result.element.tagName,
              rect: result.element.rect, // Use absolute page coordinates
              styles: result.element.styles,
              boxModel: result.element.boxModel,
            },
            accessibility,
          };

          // Full page with annotation
          const annotatedPath = path.join(this.outputDir, `${baseName}-annotated.png`);
          await this.annotator.annotateScreenshot(fullPagePath, annotationConfig, annotatedPath, false);
          result.screenshots.annotated = annotatedPath;
          result.files.annotatedScreenshot = annotatedPath;

          // Cropped element with annotation (close-up view)
          const annotatedElementPath = path.join(this.outputDir, `${baseName}-annotated-element.png`);
          await this.annotator.annotateScreenshot(fullPagePath, annotationConfig, annotatedElementPath, true);
          result.screenshots.annotatedElement = annotatedElementPath;
          result.files.annotatedElementScreenshot = annotatedElementPath;
        } catch (error) {
          console.error('Failed to annotate screenshot:', error);
        }
      }
    }

    // Capture viewport (current view) screenshots
    if (captureViewportScreenshot) {
      const viewportPath = path.join(this.outputDir, `${baseName}-viewport.png`);
      await page.screenshot({ path: viewportPath, fullPage: false });
      result.screenshots.viewport = viewportPath;
      result.files.viewportScreenshot = viewportPath;

      // Add DevTools-style annotation overlay for viewport
      if (showOverlay && result.element) {
        try {
          // Calculate accessibility info if not already done
          const accessibility = await this.calculateAccessibility(page, selector);

          // Use viewport position coordinates for viewport screenshots
          const viewportAnnotationConfig: AnnotationConfig = {
            element: {
              tagName: result.element.tagName,
              rect: result.element.viewportPosition, // Use viewport coordinates
              styles: result.element.styles,
              boxModel: result.element.boxModel,
            },
            accessibility,
          };

          // Viewport with annotation
          const annotatedViewportPath = path.join(this.outputDir, `${baseName}-viewport-annotated.png`);
          await this.annotator.annotateScreenshot(viewportPath, viewportAnnotationConfig, annotatedViewportPath, false);
          result.screenshots.viewportAnnotated = annotatedViewportPath;
          result.files.viewportAnnotatedScreenshot = annotatedViewportPath;

          // Cropped element from viewport with annotation
          const annotatedViewportElementPath = path.join(this.outputDir, `${baseName}-viewport-annotated-element.png`);
          await this.annotator.annotateScreenshot(viewportPath, viewportAnnotationConfig, annotatedViewportElementPath, true);
          result.screenshots.viewportAnnotatedElement = annotatedViewportElementPath;
          result.files.viewportAnnotatedElementScreenshot = annotatedViewportElementPath;
        } catch (error) {
          console.error('Failed to annotate viewport screenshot:', error);
        }
      }
    }

    if (captureElementScreenshot) {
      const elementPath = path.join(this.outputDir, `${baseName}-element.png`);
        const box = await element.boundingBox();
        if (box) {
          // Get viewport size to ensure clip doesn't exceed bounds
          const viewport = page.viewportSize();
          const viewportWidth = viewport?.width || 1920;
          const viewportHeight = viewport?.height || 1080;

          // Calculate safe clip region with padding
          const padding = 10;
          const clipX = Math.max(0, box.x - padding);
          const clipY = Math.max(0, box.y - padding);
          const clipWidth = Math.min(box.width + padding * 2, viewportWidth - clipX);
          const clipHeight = Math.min(box.height + padding * 2, viewportHeight - clipY);

          // Only capture if clip region is valid
          if (clipWidth > 0 && clipHeight > 0) {
            await page.screenshot({
              path: elementPath,
              clip: {
                x: clipX,
                y: clipY,
                width: clipWidth,
                height: clipHeight,
              }
            });
            result.screenshots.element = elementPath;
            result.files.elementScreenshot = elementPath;
          }
        }
    }

    if (captureZoomedScreenshot && zoomLevel > 1) {
      const zoomedPath = path.join(this.outputDir, `${baseName}-zoomed-${zoomLevel}x.png`);
      const element = await page.$(selector);
      if (element) {
        const box = await element.boundingBox();
        if (box) {
          // Calculate zoomed dimensions
          const zoomedWidth = box.width * zoomLevel;
          const zoomedHeight = box.height * zoomLevel;

          await page.screenshot({
            path: zoomedPath,
            clip: {
              x: Math.max(0, box.x),
              y: Math.max(0, box.y),
              width: box.width,
              height: box.height,
            }
          });
          result.screenshots.zoomed = zoomedPath;
          result.files.zoomedScreenshot = zoomedPath;
        }
      }
    }

    // Save comprehensive JSON metadata
    if (autoSave) {
      const jsonPath = path.join(this.outputDir, `${baseName}-metadata.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
      result.files.metadata = jsonPath;
    }

    // Generate markdown report
    if (autoSave) {
      const reportPath = path.join(this.outputDir, `${baseName}-report.md`);
      const report = this.generateMarkdownReport(result);
      fs.writeFileSync(reportPath, report, 'utf-8');
      result.files.report = reportPath;
    }

    return result;
  }

  /**
   * Gather comprehensive element information
   */
  private async gatherElementInfo(page: Page, selector: string, options: {
    includeParent?: boolean;
    includeChildren?: boolean;
    includeComputedStyles?: boolean;
    includeAttributes?: boolean;
  }): Promise<any> {
    const {
      includeParent = true,
      includeChildren = true,
      includeComputedStyles = true,
      includeAttributes = true,
    } = options;

    const elementData = await page.evaluate(({ sel, opts }) => {
      const el = document.querySelector(sel);
      if (!el) return { success: false, error: 'Element not found' };

      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      const data: any = {
        // Basic info
        tagName: el.tagName.toLowerCase(),
        id: el.id || null,
        className: el.className && typeof el.className === 'string' ? el.className : null,
        textContent: el.textContent?.trim().substring(0, 500) || null,
        innerHTML: (el as HTMLElement).innerHTML?.substring(0, 1000) || null,

        // Position and dimensions
        rect: {
          x: rect.x + scrollLeft,
          y: rect.y + scrollTop,
          width: rect.width,
          height: rect.height,
          top: rect.top + scrollTop,
          right: rect.right + scrollLeft,
          bottom: rect.bottom + scrollTop,
          left: rect.left + scrollLeft,
        },

        // Viewport position (without scroll)
        viewportPosition: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },

        // Box model
        boxModel: {
          margin: {
            top: parseFloat(computed.marginTop) || 0,
            right: parseFloat(computed.marginRight) || 0,
            bottom: parseFloat(computed.marginBottom) || 0,
            left: parseFloat(computed.marginLeft) || 0,
          },
          padding: {
            top: parseFloat(computed.paddingTop) || 0,
            right: parseFloat(computed.paddingRight) || 0,
            bottom: parseFloat(computed.paddingBottom) || 0,
            left: parseFloat(computed.paddingLeft) || 0,
          },
          border: {
            top: parseFloat(computed.borderTopWidth) || 0,
            right: parseFloat(computed.borderRightWidth) || 0,
            bottom: parseFloat(computed.borderBottomWidth) || 0,
            left: parseFloat(computed.borderLeftWidth) || 0,
          },
        },

        // Key styles
        styles: {
          position: computed.position,
          display: computed.display,
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontFamily: computed.fontFamily.split(',')[0].replace(/['"]/g, ''),
          fontWeight: computed.fontWeight,
          lineHeight: computed.lineHeight,
          textAlign: computed.textAlign,
          zIndex: computed.zIndex,
          opacity: computed.opacity,
          visibility: computed.visibility,
          overflow: computed.overflow,
          cursor: computed.cursor,
        },

        // Visibility
        visibility: {
          isVisible: (el as HTMLElement).offsetParent !== null,
          inViewport: rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0,
          hasContent: !!el.textContent?.trim(),
        },
      };

      // Attributes
      if (opts.includeAttributes) {
        data.attributes = {};
        Array.from(el.attributes).forEach(attr => {
          data.attributes[attr.name] = attr.value;
        });
      }

      // Computed styles (full)
      if (opts.includeComputedStyles) {
        data.computedStyles = {};
        const styleKeys = [
          'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
          'margin', 'padding', 'border', 'borderRadius',
          'flex', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems',
          'grid', 'gridTemplateColumns', 'gridTemplateRows', 'gap',
          'transform', 'transition', 'animation',
          'boxShadow', 'textShadow', 'filter', 'backdropFilter',
        ];
        styleKeys.forEach(key => {
          data.computedStyles[key] = computed.getPropertyValue(key);
        });
      }

      // Parent info
      if (opts.includeParent && el.parentElement) {
        const parent = el.parentElement;
        const parentRect = parent.getBoundingClientRect();
        data.parent = {
          tagName: parent.tagName.toLowerCase(),
          id: parent.id || null,
          className: parent.className && typeof parent.className === 'string' ? parent.className : null,
          rect: {
            width: parentRect.width,
            height: parentRect.height,
          },
        };
      }

      // Children info
      if (opts.includeChildren) {
        data.children = Array.from(el.children).map(child => ({
          tagName: child.tagName.toLowerCase(),
          id: child.id || null,
          className: child.className && typeof child.className === 'string' ? child.className : null,
          textContent: child.textContent?.trim().substring(0, 100) || null,
        }));
      }

      return { success: true, data };
    }, { sel: selector, opts: options });

    return elementData;
  }

  /**
   * Show CDP overlay
   */
  private async showCDPOverlay(page: Page, selector: string, options: {
    showInfo?: boolean;
    showRulers?: boolean;
    showExtensionLines?: boolean;
  }): Promise<void> {
    const { showInfo = true, showRulers = false, showExtensionLines = true } = options;

    let client = this.cdpSessions.get(page);
    if (!client) {
      client = await page.context().newCDPSession(page);
      await client.send('DOM.enable');
      await client.send('CSS.enable');
      await client.send('Overlay.enable');
      this.cdpSessions.set(page, client);
    }

    const { root } = await client.send('DOM.getDocument');
    const { nodeId } = await client.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector,
    });

    if (!nodeId) {
      throw new Error(`Could not find DOM node for selector: ${selector}`);
    }

    await client.send('Overlay.highlightNode', {
      highlightConfig: {
        showInfo,
        showRulers,
        showExtensionLines,
        contentColor: { r: 111, g: 168, b: 220, a: 0.66 },
        paddingColor: { r: 147, g: 196, b: 125, a: 0.55 },
        borderColor: { r: 255, g: 229, b: 153, a: 0.66 },
        marginColor: { r: 246, g: 178, b: 107, a: 0.66 },
      },
      nodeId,
    });
  }

  /**
   * Clear CDP overlay
   */
  async clear(page: Page): Promise<void> {
    const client = this.cdpSessions.get(page);
    if (client) {
      await client.send('Overlay.hideHighlight');
    }
  }

  /**
   * Inspect multiple elements and create a comparison report
   */
  async inspectMultiple(page: Page, selectors: string[], options: {
    outputName?: string;
    captureScreenshots?: boolean;
    captureViewportScreenshots?: boolean;
  } = {}): Promise<any> {
    const { outputName = 'multi-element-inspection', captureScreenshots = true, captureViewportScreenshots = false } = options;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = `${outputName}-${timestamp}`;

    const results = [];

    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      try {
        const result = await this.inspect(page, selector, {
          showOverlay: false,
          captureScreenshot: false,
          captureViewportScreenshot: captureViewportScreenshots,
          captureElementScreenshot: captureScreenshots,
          autoSave: false,
          includeParent: false,
          includeChildren: false,
        });

        if (result.success) {
          results.push({
            index: i + 1,
            selector,
            success: true,
            element: result.element,
            screenshots: result.screenshots,
          });
        } else {
          results.push({
            index: i + 1,
            selector,
            success: false,
            error: result.error,
          });
        }
      } catch (error) {
        results.push({
          index: i + 1,
          selector,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Create summary
    const summary = {
      timestamp,
      totalElements: selectors.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };

    // Save summary JSON
    const jsonPath = path.join(this.outputDir, `${baseName}-summary.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf-8');

    // Generate comparison report
    const reportPath = path.join(this.outputDir, `${baseName}-comparison.md`);
    const report = this.generateComparisonReport(summary);
    fs.writeFileSync(reportPath, report, 'utf-8');

    return {
      success: true,
      summary,
      files: {
        summary: jsonPath,
        report: reportPath,
      },
    };
  }

  /**
   * Inspect with interaction (click, hover, focus) and capture before/after
   * Note: Scrolling is now handled automatically, no need for 'scroll' action
   */
  async inspectWithAction(page: Page, selector: string, action: {
    type: 'click' | 'hover' | 'focus';
    target?: string; // If action is on a different element
  }, options: {
    outputName?: string;
    captureDelay?: number;
  } = {}): Promise<any> {
    const { outputName, captureDelay = 500 } = options;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = outputName || `action-${action.type}-${selector.replace(/[^a-z0-9]/gi, '_')}-${timestamp}`;

    // Capture before state
    const beforePath = path.join(this.outputDir, `${baseName}-before.png`);
    await page.screenshot({ path: beforePath, fullPage: true });

    // Perform action
    const actionTarget = action.target || selector;
    const element = await page.$(actionTarget);

    if (!element) {
      return { success: false, error: `Element not found: ${actionTarget}` };
    }

    // Check if element is in viewport before performing action
    const isInViewport = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }, actionTarget);

    // Only scroll if not in viewport
    if (!isInViewport) {
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(captureDelay);
    }

    switch (action.type) {
      case 'click':
        await element.click();
        break;
      case 'hover':
        await element.hover();
        break;
      case 'focus':
        await element.focus();
        break;
    }

    // Wait for changes
    await page.waitForTimeout(captureDelay);

    // Capture after state
    const afterPath = path.join(this.outputDir, `${baseName}-after.png`);
    await page.screenshot({ path: afterPath, fullPage: true });

    // Inspect element after action
    const inspection = await this.inspect(page, selector, {
      autoSave: false,
      captureScreenshot: false,
      outputName: baseName,
    });

    const result = {
      success: true,
      timestamp,
      selector,
      action,
      screenshots: {
        before: beforePath,
        after: afterPath,
      },
      elementState: inspection.element,
    };

    // Save result
    const jsonPath = path.join(this.outputDir, `${baseName}-action-result.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');

    return {
      ...result,
      files: { result: jsonPath },
    };
  }

  /**
   * Inspect with a sequence of actions and capture states
   * Allows capturing intermediate states or only the final state
   */
  async inspectWithActionSequence(page: Page, selector: string, actions: Array<{
    type: 'click' | 'hover' | 'focus' | 'type' | 'wait';
    target?: string; // If action is on a different element
    value?: string; // For 'type' action
    duration?: number; // For 'wait' action (milliseconds)
  }>, options: {
    outputName?: string;
    captureDelay?: number;
    captureIntermediate?: boolean; // Capture after each action
    captureViewport?: boolean; // Capture viewport instead of full page
  } = {}): Promise<any> {
    const { 
      outputName, 
      captureDelay = 500, 
      captureIntermediate = false,
      captureViewport = false 
    } = options;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = outputName || `action-sequence-${selector.replace(/[^a-z0-9]/gi, '_')}-${timestamp}`;

    // Capture initial state
    const initialPath = path.join(this.outputDir, `${baseName}-0-initial.png`);
    await page.screenshot({ path: initialPath, fullPage: !captureViewport });

    const screenshots: Array<{ step: number; action: string; path: string }> = [
      { step: 0, action: 'initial', path: initialPath }
    ];

    // Execute actions sequentially
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const actionTarget = action.target || selector;
      
      // Ensure element is in viewport if needed
      const element = await page.$(actionTarget);
      if (!element) {
        return { 
          success: false, 
          error: `Element not found at step ${i + 1}: ${actionTarget}`,
          completedSteps: i,
        };
      }

      // Check if element is in viewport
      const isInViewport = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
      }, actionTarget);

      // Only scroll if not in viewport
      if (!isInViewport) {
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(captureDelay);
      }

      // Perform the action
      switch (action.type) {
        case 'click':
          await element.click();
          break;
        case 'hover':
          await element.hover();
          break;
        case 'focus':
          await element.focus();
          break;
        case 'type':
          if (action.value) {
            await element.type(action.value);
          }
          break;
        case 'wait':
          await page.waitForTimeout(action.duration || 1000);
          break;
      }

      // Wait for effects to settle
      await page.waitForTimeout(captureDelay);

      // Capture intermediate state if requested
      if (captureIntermediate || i === actions.length - 1) {
        const stepPath = path.join(
          this.outputDir, 
          `${baseName}-${i + 1}-${action.type}.png`
        );
        await page.screenshot({ path: stepPath, fullPage: !captureViewport });
        screenshots.push({ 
          step: i + 1, 
          action: `${action.type}${action.value ? `: ${action.value}` : ''}`, 
          path: stepPath 
        });
      }
    }

    // Inspect final element state
    const finalInspection = await this.inspect(page, selector, {
      autoSave: false,
      captureScreenshot: false,
      captureViewportScreenshot: false,
      outputName: baseName,
    });

    const result = {
      success: true,
      timestamp,
      selector,
      actionsPerformed: actions.length,
      actions: actions.map((a, i) => ({
        step: i + 1,
        type: a.type,
        target: a.target || selector,
        value: a.value,
      })),
      screenshots,
      finalElementState: finalInspection.element,
      captureMode: captureViewport ? 'viewport' : 'fullPage',
    };

    // Save result
    const jsonPath = path.join(this.outputDir, `${baseName}-sequence-result.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');

    // Generate sequence report
    const reportPath = path.join(this.outputDir, `${baseName}-sequence-report.md`);
    const report = this.generateSequenceReport(result);
    fs.writeFileSync(reportPath, report, 'utf-8');

    return {
      ...result,
      files: { 
        result: jsonPath,
        report: reportPath,
      },
    };
  }

  /**
   * Calculate accessibility information for an element
   */
  private async calculateAccessibility(page: Page, selector: string): Promise<{
    contrast?: number;
    name?: string;
    role?: string;
    keyboardFocusable?: boolean;
  }> {
    try {
      const a11yInfo = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return {};

        const computed = window.getComputedStyle(el);
        const result: any = {};

        // Get accessible name
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        if (ariaLabel) {
          result.name = ariaLabel;
        } else if (ariaLabelledBy) {
          const labelEl = document.getElementById(ariaLabelledBy);
          if (labelEl) result.name = labelEl.textContent?.trim();
        } else if (el.textContent) {
          result.name = el.textContent.trim().substring(0, 30);
        }

        // Get role
        const explicitRole = el.getAttribute('role');
        if (explicitRole) {
          result.role = explicitRole;
        } else {
          // Implicit roles
          const tagName = el.tagName.toLowerCase();
          const implicitRoles: Record<string, string> = {
            'button': 'button',
            'a': 'link',
            'input': 'textbox',
            'textarea': 'textbox',
            'select': 'combobox',
            'h1': 'heading',
            'h2': 'heading',
            'h3': 'heading',
            'h4': 'heading',
            'h5': 'heading',
            'h6': 'heading',
            'nav': 'navigation',
            'main': 'main',
            'aside': 'complementary',
            'header': 'banner',
            'footer': 'contentinfo',
          };
          result.role = implicitRoles[tagName] || '';
        }

        // Check if keyboard focusable
        const tabIndex = el.getAttribute('tabindex');
        const isFocusableElement = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
        result.keyboardFocusable = isFocusableElement || (tabIndex !== null && parseInt(tabIndex) >= 0);

        // Calculate contrast ratio
        const color = computed.color;
        const bgColor = computed.backgroundColor;

        // Helper to parse rgb/rgba colors
        const parseColor = (colorStr: string) => {
          const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          if (match) {
            return {
              r: parseInt(match[1]),
              g: parseInt(match[2]),
              b: parseInt(match[3]),
              a: match[4] ? parseFloat(match[4]) : 1,
            };
          }
          return null;
        };

        // Helper to get luminance
        const getLuminance = (r: number, g: number, b: number) => {
          const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };

        const fgColor = parseColor(color);
        let bgColorParsed = parseColor(bgColor);

        // If background is transparent, walk up the DOM tree
        if (bgColorParsed && bgColorParsed.a < 1) {
          let parent = el.parentElement;
          while (parent && bgColorParsed.a < 1) {
            const parentBg = window.getComputedStyle(parent).backgroundColor;
            const parentBgParsed = parseColor(parentBg);
            if (parentBgParsed && parentBgParsed.a > 0) {
              bgColorParsed = parentBgParsed;
              break;
            }
            parent = parent.parentElement;
          }
          // Fallback to white if no opaque background found
          if (bgColorParsed.a < 1) {
            bgColorParsed = { r: 255, g: 255, b: 255, a: 1 };
          }
        }

        if (fgColor && bgColorParsed) {
          const fgLum = getLuminance(fgColor.r, fgColor.g, fgColor.b);
          const bgLum = getLuminance(bgColorParsed.r, bgColorParsed.g, bgColorParsed.b);
          const contrastRatio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
          result.contrast = Math.round(contrastRatio * 100) / 100;
        }

        return result;
      }, selector);

      return a11yInfo;
    } catch (error) {
      console.error('Failed to calculate accessibility info:', error);
      return {};
    }
  }

  /**
   * Generate markdown report from inspection data
   */
  private generateMarkdownReport(data: any): string {
    const lines = [];

    lines.push(`# Element Inspection Report`);
    lines.push('');
    lines.push(`**Timestamp:** ${data.timestamp}`);
    lines.push(`**Selector:** \`${data.selector}\``);
    lines.push('');

    lines.push(`## Element Information`);
    lines.push('');
    lines.push(`- **Tag:** \`${data.element.tagName}\``);
    if (data.element.id) lines.push(`- **ID:** \`${data.element.id}\``);
    if (data.element.className) lines.push(`- **Class:** \`${data.element.className}\``);
    lines.push('');

    lines.push(`## Dimensions & Position`);
    lines.push('');
    lines.push(`- **Size:** ${Math.round(data.element.rect.width)} × ${Math.round(data.element.rect.height)} px`);
    lines.push(`- **Position:** (${Math.round(data.element.rect.x)}, ${Math.round(data.element.rect.y)})`);
    lines.push('');

    lines.push(`## Box Model`);
    lines.push('');
    const bm = data.element.boxModel;
    lines.push(`- **Margin:** T${bm.margin.top} R${bm.margin.right} B${bm.margin.bottom} L${bm.margin.left}`);
    lines.push(`- **Padding:** T${bm.padding.top} R${bm.padding.right} B${bm.padding.bottom} L${bm.padding.left}`);
    lines.push(`- **Border:** T${bm.border.top} R${bm.border.right} B${bm.border.bottom} L${bm.border.left}`);
    lines.push('');

    lines.push(`## Key Styles`);
    lines.push('');
    lines.push('```css');
    Object.entries(data.element.styles).forEach(([key, value]) => {
      lines.push(`${key}: ${value};`);
    });
    lines.push('```');
    lines.push('');

    if (data.screenshots && Object.keys(data.screenshots).length > 0) {
      lines.push(`## Screenshots`);
      lines.push('');
      Object.entries(data.screenshots).forEach(([type, filepath]: [string, any]) => {
        const filename = path.basename(filepath);
        lines.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)}`);
        lines.push(`![${type}](${filename})`);
        lines.push('');
      });
    }

    return lines.join('\n');
  }

  /**
   * Generate sequence report for action sequence
   */
  private generateSequenceReport(data: any): string {
    const lines = [];

    lines.push(`# Action Sequence Inspection Report`);
    lines.push('');
    lines.push(`**Timestamp:** ${data.timestamp}`);
    lines.push(`**Selector:** \`${data.selector}\``);
    lines.push(`**Actions Performed:** ${data.actionsPerformed}`);
    lines.push(`**Capture Mode:** ${data.captureMode}`);
    lines.push('');

    lines.push(`## Action Sequence`);
    lines.push('');
    data.actions.forEach((action: any) => {
      lines.push(`${action.step}. **${action.type.toUpperCase()}**`);
      if (action.target !== data.selector) {
        lines.push(`   - Target: \`${action.target}\``);
      }
      if (action.value) {
        lines.push(`   - Value: "${action.value}"`);
      }
    });
    lines.push('');

    lines.push(`## Screenshots Captured`);
    lines.push('');
    data.screenshots.forEach((screenshot: any) => {
      const filename = path.basename(screenshot.path);
      lines.push(`### Step ${screenshot.step}: ${screenshot.action}`);
      lines.push(`![${screenshot.action}](${filename})`);
      lines.push('');
    });

    if (data.finalElementState) {
      lines.push(`## Final Element State`);
      lines.push('');
      const el = data.finalElementState;
      lines.push(`- **Tag:** \`${el.tagName}\``);
      if (el.id) lines.push(`- **ID:** \`${el.id}\``);
      if (el.className) lines.push(`- **Class:** \`${el.className}\``);
      lines.push(`- **Size:** ${Math.round(el.rect.width)} × ${Math.round(el.rect.height)} px`);
      lines.push(`- **Position:** (${Math.round(el.rect.x)}, ${Math.round(el.rect.y)})`);
      if (el.textContent) {
        lines.push(`- **Text:** "${el.textContent.substring(0, 200)}${el.textContent.length > 200 ? '...' : ''}"`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate comparison report for multiple elements
   */
  private generateComparisonReport(summary: any): string {
    const lines = [];

    lines.push(`# Multi-Element Inspection Report`);
    lines.push('');
    lines.push(`**Timestamp:** ${summary.timestamp}`);
    lines.push(`**Total Elements:** ${summary.totalElements}`);
    lines.push(`**Successful:** ${summary.successful}`);
    lines.push(`**Failed:** ${summary.failed}`);
    lines.push('');

    lines.push(`## Elements`);
    lines.push('');

    summary.results.forEach((result: any) => {
      if (result.success) {
        const el = result.element;
        lines.push(`### ${result.index}. ${result.selector}`);
        lines.push('');
        lines.push(`- **Tag:** \`${el.tagName}\``);
        lines.push(`- **Size:** ${Math.round(el.rect.width)} × ${Math.round(el.rect.height)} px`);
        lines.push(`- **Position:** (${Math.round(el.rect.x)}, ${Math.round(el.rect.y)})`);
        if (el.textContent) {
          lines.push(`- **Text:** "${el.textContent.substring(0, 100)}${el.textContent.length > 100 ? '...' : ''}"`);
        }
        lines.push('');
      } else {
        lines.push(`### ${result.index}. ${result.selector}`);
        lines.push('');
        lines.push(`⚠️ **Error:** ${result.error}`);
        lines.push('');
      }
    });

    return lines.join('\n');
  }

  /**
   * No browser-side code needed - everything is done via CDP
   */
  getBrowserCode(): string {
    return this.createBrowserAPI({
      noop: () => ({ message: 'Element inspection uses CDP, not browser-side code' }),
    });
  }
}

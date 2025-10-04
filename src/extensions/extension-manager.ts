import { Page } from 'playwright';

/**
 * Base interface for all browser extensions
 */
export interface BrowserExtension {
  /**
   * Unique identifier for the extension
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Extension description
   */
  description: string;

  /**
   * Browser-side JavaScript code to inject
   * This code runs in the browser context
   */
  getBrowserCode(): string;

  /**
   * Optional CSS styles to inject
   */
  getStyles?(): string;

  /**
   * Initialize the extension (Node.js side)
   */
  initialize?(page: Page): Promise<void>;

  /**
   * Cleanup when extension is disabled
   */
  cleanup?(page: Page): Promise<void>;
}

/**
 * Options for extension execution
 */
export interface ExtensionExecutionOptions {
  /**
   * Extension-specific parameters
   */
  params?: Record<string, any>;

  /**
   * Whether to wait for extension to finish before returning
   */
  waitForCompletion?: boolean;

  /**
   * Timeout in milliseconds
   */
  timeout?: number;
}

/**
 * Result from extension execution
 */
export interface ExtensionExecutionResult {
  /**
   * Whether execution was successful
   */
  success: boolean;

  /**
   * Result data from the extension
   */
  data?: any;

  /**
   * Error message if execution failed
   */
  error?: string;

  /**
   * Execution time in milliseconds
   */
  duration?: number;
}

/**
 * Extension Manager
 * Handles registration, injection, and execution of browser extensions
 */
export class ExtensionManager {
  private extensions: Map<string, BrowserExtension> = new Map();
  private injectedExtensions: Map<string, Set<string>> = new Map(); // pageId -> Set<extensionId>

  /**
   * Register a new extension
   */
  register(extension: BrowserExtension): void {
    if (this.extensions.has(extension.id)) {
      throw new Error(`Extension with id '${extension.id}' is already registered`);
    }
    this.extensions.set(extension.id, extension);
  }

  /**
   * Unregister an extension
   */
  unregister(extensionId: string): void {
    this.extensions.delete(extensionId);
  }

  /**
   * Get a registered extension
   */
  getExtension(extensionId: string): BrowserExtension | undefined {
    return this.extensions.get(extensionId);
  }

  /**
   * List all registered extensions
   */
  listExtensions(): BrowserExtension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Inject an extension into a page
   */
  async injectExtension(page: Page, extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension '${extensionId}' not found`);
    }

    const pageId = this.getPageId(page);
    
    // Check if already injected
    const injectedSet = this.injectedExtensions.get(pageId) || new Set();
    if (injectedSet.has(extensionId)) {
      return; // Already injected
    }

    // Initialize extension (Node.js side)
    if (extension.initialize) {
      await extension.initialize(page);
    }

    // Inject CSS styles if provided
    if (extension.getStyles) {
      const styles = extension.getStyles();
      await page.addStyleTag({ content: styles });
    }

    // Inject JavaScript code
    const browserCode = extension.getBrowserCode();
    
    // Use page.evaluate instead of addScriptTag to execute the code directly
    await page.evaluate((code) => {
      // @ts-ignore
      eval(code);
    }, browserCode);

    // Mark as injected
    injectedSet.add(extensionId);
    this.injectedExtensions.set(pageId, injectedSet);
  }

  /**
   * Inject multiple extensions
   */
  async injectExtensions(page: Page, extensionIds: string[]): Promise<void> {
    for (const id of extensionIds) {
      await this.injectExtension(page, id);
    }
  }

  /**
   * Execute an extension method
   */
  async executeExtension(
    page: Page,
    extensionId: string,
    method: string,
    options: ExtensionExecutionOptions = {}
  ): Promise<ExtensionExecutionResult> {
    const startTime = Date.now();

    try {
      // Ensure extension is injected
      await this.injectExtension(page, extensionId);

      // Execute the method in browser context
      const result = await page.evaluate(
        ({ extensionId, method, params }) => {
          // @ts-ignore - window extensions object
          const extensionAPI = window[`__extension_${extensionId}__`];
          if (!extensionAPI) {
            throw new Error(`Extension '${extensionId}' not found in browser context`);
          }

          if (typeof extensionAPI[method] !== 'function') {
            throw new Error(`Method '${method}' not found in extension '${extensionId}'`);
          }

          return extensionAPI[method](params);
        },
        { extensionId, method, params: options.params || {} }
      );

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Remove extension from page
   */
  async removeExtension(page: Page, extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      return;
    }

    const pageId = this.getPageId(page);
    const injectedSet = this.injectedExtensions.get(pageId);
    
    if (!injectedSet || !injectedSet.has(extensionId)) {
      return; // Not injected
    }

    // Cleanup (Node.js side)
    if (extension.cleanup) {
      await extension.cleanup(page);
    }

    // Remove from browser context
    await page.evaluate((extensionId) => {
      // @ts-ignore
      delete window[`__extension_${extensionId}__`];
    }, extensionId);

    // Mark as removed
    injectedSet.delete(extensionId);
  }

  /**
   * Check if extension is injected in page
   */
  isInjected(page: Page, extensionId: string): boolean {
    const pageId = this.getPageId(page);
    const injectedSet = this.injectedExtensions.get(pageId);
    return injectedSet ? injectedSet.has(extensionId) : false;
  }

  /**
   * Clear all extensions from page
   */
  async clearAll(page: Page): Promise<void> {
    const pageId = this.getPageId(page);
    const injectedSet = this.injectedExtensions.get(pageId);
    
    if (!injectedSet) {
      return;
    }

    for (const extensionId of injectedSet) {
      await this.removeExtension(page, extensionId);
    }

    this.injectedExtensions.delete(pageId);
  }

  /**
   * Get unique page identifier
   */
  private getPageId(page: Page): string {
    // Use page URL + creation time as unique identifier
    // @ts-ignore - accessing internal property
    return page._guid || String(Math.random());
  }
}

/**
 * Base class for creating browser extensions
 */
export abstract class BaseExtension implements BrowserExtension {
  abstract id: string;
  abstract name: string;
  abstract description: string;

  /**
   * Generate the browser-side code
   * Override this method to provide custom implementation
   */
  abstract getBrowserCode(): string;

  /**
   * Optional: Generate CSS styles
   */
  getStyles?(): string;

  /**
   * Optional: Initialize extension
   */
  async initialize?(page: Page): Promise<void>;

  /**
   * Optional: Cleanup extension
   */
  async cleanup?(page: Page): Promise<void>;

  /**
   * Helper: Create a browser function wrapper
   * Wraps a function so it can be called from Node.js via executeExtension
   */
  protected createBrowserAPI(functions: Record<string, Function>): string {
    // Convert each function to a proper string representation
    const functionStrings = Object.entries(functions)
      .map(([name, fn]) => {
        const fnStr = fn.toString();
        // If it's an arrow function, we need to wrap it properly
        if (fnStr.includes('=>')) {
          return `"${name}": ${fnStr}`;
        }
        // For regular functions
        return `"${name}": ${fnStr}`;
      })
      .join(',\n    ');

    return `
      (function() {
        window["__extension_${this.id}__"] = {
          ${functionStrings}
        };
      })();
    `;
  }

  /**
   * Helper: Create CSS rules
   */
  protected createStyles(rules: Record<string, Record<string, string>>): string {
    return Object.entries(rules)
      .map(([selector, props]) => {
        const properties = Object.entries(props)
          .map(([key, value]) => `  ${key}: ${value};`)
          .join('\n');
        return `${selector} {\n${properties}\n}`;
      })
      .join('\n\n');
  }
}

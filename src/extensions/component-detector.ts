import { Page } from 'playwright';
import { BaseExtension } from './extension-manager';

/**
 * Component Detector Extension
 * Automatically detects and categorizes UI components on the page
 * Useful for AI agents to understand page structure
 */
export class ComponentDetector extends BaseExtension {
  id = 'component-detector';
  name = 'Component Detector';
  description = 'Automatically detect and categorize UI components (buttons, forms, navigation, etc.)';

  /**
   * Generate browser-side JavaScript code
   */
  getBrowserCode(): string {
    return this.createBrowserAPI({
      /**
       * Detect all UI components on the page
       */
      detectComponents: function(params: any = {}) {
        const { includePosition = false, highlightComponents = false } = params;

        const components = {
          buttons: [] as any[],
          links: [] as any[],
          forms: [] as any[],
          inputs: [] as any[],
          images: [] as any[],
          modals: [] as any[],
          navigation: [] as any[],
          headings: [] as any[],
          tables: [] as any[],
          lists: [] as any[],
          videos: [] as any[],
          iframes: [] as any[],
        };

        // Helper to get element info
        const getElementInfo = (el: Element) => {
          const rect = el.getBoundingClientRect();
          const info: any = {
            tagName: el.tagName.toLowerCase(),
            id: el.id || null,
            className: (el as HTMLElement).className || null,
            text: el.textContent?.trim().substring(0, 50) || null,
          };

          if (includePosition) {
            info.position = {
              x: Math.round(rect.left),
              y: Math.round(rect.top),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          }

          return info;
        };

        // Detect buttons
        document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]').forEach(el => {
          components.buttons.push(getElementInfo(el));
        });

        // Detect links
        document.querySelectorAll('a[href]').forEach(el => {
          const info = getElementInfo(el);
          info.href = (el as HTMLAnchorElement).href;
          components.links.push(info);
        });

        // Detect forms
        document.querySelectorAll('form').forEach(el => {
          const info = getElementInfo(el);
          info.action = (el as HTMLFormElement).action || null;
          info.method = (el as HTMLFormElement).method || null;
          components.forms.push(info);
        });

        // Detect inputs
        document.querySelectorAll('input, textarea, select').forEach(el => {
          const info = getElementInfo(el);
          info.type = (el as HTMLInputElement).type || null;
          info.name = (el as HTMLInputElement).name || null;
          components.inputs.push(info);
        });

        // Detect images
        document.querySelectorAll('img').forEach(el => {
          const info = getElementInfo(el);
          info.src = (el as HTMLImageElement).src;
          info.alt = (el as HTMLImageElement).alt || null;
          info.hasAlt = !!(el as HTMLImageElement).alt;
          components.images.push(info);
        });

        // Detect modals/dialogs
        document.querySelectorAll('[role="dialog"], [role="alertdialog"], .modal, [aria-modal="true"], dialog').forEach(el => {
          const info = getElementInfo(el);
          info.visible = (el as HTMLElement).offsetParent !== null;
          components.modals.push(info);
        });

        // Detect navigation
        document.querySelectorAll('nav, [role="navigation"]').forEach(el => {
          const info = getElementInfo(el);
          info.linkCount = el.querySelectorAll('a').length;
          components.navigation.push(info);
        });

        // Detect headings
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
          const info = getElementInfo(el);
          info.level = parseInt(el.tagName.substring(1));
          components.headings.push(info);
        });

        // Detect tables
        document.querySelectorAll('table').forEach(el => {
          const info = getElementInfo(el);
          info.rows = el.querySelectorAll('tr').length;
          info.hasHeader = el.querySelector('thead') !== null;
          components.tables.push(info);
        });

        // Detect lists
        document.querySelectorAll('ul, ol').forEach(el => {
          const info = getElementInfo(el);
          info.type = el.tagName.toLowerCase();
          info.itemCount = el.querySelectorAll('li').length;
          components.lists.push(info);
        });

        // Detect videos
        document.querySelectorAll('video').forEach(el => {
          const info = getElementInfo(el);
          info.src = (el as HTMLVideoElement).src || null;
          info.controls = (el as HTMLVideoElement).controls;
          components.videos.push(info);
        });

        // Detect iframes
        document.querySelectorAll('iframe').forEach(el => {
          const info = getElementInfo(el);
          info.src = (el as HTMLIFrameElement).src;
          components.iframes.push(info);
        });

        // Highlight components if requested
        if (highlightComponents) {
          this.highlightAllComponents(components);
        }

        // Calculate totals
        const totals = {
          buttons: components.buttons.length,
          links: components.links.length,
          forms: components.forms.length,
          inputs: components.inputs.length,
          images: components.images.length,
          modals: components.modals.length,
          navigation: components.navigation.length,
          headings: components.headings.length,
          tables: components.tables.length,
          lists: components.lists.length,
          videos: components.videos.length,
          iframes: components.iframes.length,
        };

        return {
          success: true,
          components,
          totals,
          summary: `Found ${Object.values(totals).reduce((a, b) => a + b, 0)} components across ${Object.keys(totals).filter(k => totals[k as keyof typeof totals] > 0).length} categories`
        };
      },

      /**
       * Highlight all detected components with color-coded outlines
       */
      highlightAllComponents: function(components: any) {
        const colors = {
          buttons: '#4caf50',
          links: '#2196f3',
          forms: '#ff9800',
          inputs: '#9c27b0',
          images: '#e91e63',
          modals: '#f44336',
          navigation: '#00bcd4',
          headings: '#795548',
          tables: '#607d8b',
          lists: '#3f51b5',
          videos: '#ff5722',
          iframes: '#9e9e9e',
        };

        // Clear existing highlights
        document.querySelectorAll('.uisentinel-component-marker').forEach(el => {
          (el as HTMLElement).style.outline = '';
          el.classList.remove('uisentinel-component-marker');
        });

        // Highlight each component type
        Object.entries(components).forEach(([type, items]: [string, any]) => {
          if (Array.isArray(items) && items.length > 0) {
            items.forEach((item: any) => {
              let selector = item.tagName;
              if (item.id) selector += `#${item.id}`;
              else if (item.className && typeof item.className === 'string') {
                const firstClass = item.className.split(' ')[0];
                if (firstClass) selector += `.${firstClass}`;
              }

              const el = document.querySelector(selector);
              if (el) {
                (el as HTMLElement).style.outline = `2px solid ${colors[type as keyof typeof colors] || '#000'}`;
                (el as HTMLElement).style.outlineOffset = '2px';
                el.classList.add('uisentinel-component-marker');
              }
            });
          }
        });
      },

      /**
       * Detect components by type
       */
      detectByType: function(params: any = {}) {
        const { type } = params;

        if (!type) {
          return { success: false, error: 'type parameter is required' };
        }

        const result = this.detectComponents({ includePosition: true });

        if (result.success && result.components[type]) {
          return {
            success: true,
            type,
            components: result.components[type],
            count: result.components[type].length
          };
        }

        return {
          success: false,
          error: `Unknown component type: ${type}`
        };
      },

      /**
       * Clear component highlights
       */
      clearHighlights: function() {
        document.querySelectorAll('.uisentinel-component-marker').forEach(el => {
          (el as HTMLElement).style.outline = '';
          el.classList.remove('uisentinel-component-marker');
        });

        return { success: true, message: 'All component highlights cleared' };
      },

      /**
       * Get page structure summary
       */
      getPageStructure: function() {
        const result = this.detectComponents({});

        if (!result.success) {
          return result;
        }

        // Analyze heading hierarchy
        const headingHierarchy = result.components.headings.map((h: any) => ({
          level: h.level,
          text: h.text
        }));

        // Check for accessibility issues
        const issues = [];

        // Missing alt text on images
        const missingAlt = result.components.images.filter((img: any) => !img.hasAlt);
        if (missingAlt.length > 0) {
          issues.push(`${missingAlt.length} images missing alt text`);
        }

        // Forms without labels
        if (result.totals.forms > 0 && result.totals.inputs > result.totals.forms * 3) {
          issues.push('Potentially unlabeled form inputs detected');
        }

        // No main navigation
        if (result.totals.navigation === 0 && result.totals.links > 5) {
          issues.push('No navigation element found despite having multiple links');
        }

        return {
          success: true,
          structure: {
            componentCounts: result.totals,
            headingHierarchy,
            hasNavigation: result.totals.navigation > 0,
            hasForms: result.totals.forms > 0,
            imageCount: result.totals.images,
            interactiveElements: result.totals.buttons + result.totals.links + result.totals.inputs,
          },
          issues,
          summary: result.summary
        };
      },

      /**
       * Scroll through components of a specific type
       */
      scrollToComponent: function(params: any = {}) {
        const { type, index = 0 } = params;

        if (!type) {
          return { success: false, error: 'type parameter is required' };
        }

        // Get components
        const result = this.detectComponents({ includePosition: true });

        if (!result.success) {
          return result;
        }

        const components = result.components[type];

        if (!components || components.length === 0) {
          return { success: false, error: `No components of type '${type}' found` };
        }

        if (index < 0 || index >= components.length) {
          return { success: false, error: `Invalid index. Must be between 0 and ${components.length - 1}` };
        }

        const component = components[index];

        // Build selector
        let selector = component.tagName;
        if (component.id) {
          selector += `#${component.id}`;
        } else if (component.className && typeof component.className === 'string') {
          const firstClass = component.className.split(' ')[0];
          if (firstClass) selector += `.${firstClass}`;
        }

        const element = document.querySelector(selector);

        if (!element) {
          return { success: false, error: 'Component element not found' };
        }

        // Clear previous highlights
        this.clearHighlights();

        // Scroll to element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight after scroll
        setTimeout(() => {
          const colors = {
            buttons: '#4caf50',
            links: '#2196f3',
            forms: '#ff9800',
            inputs: '#9c27b0',
            images: '#e91e63',
            modals: '#f44336',
            navigation: '#00bcd4',
            headings: '#795548',
            tables: '#607d8b',
            lists: '#3f51b5',
            videos: '#ff5722',
            iframes: '#9e9e9e',
          };

          const color = colors[type as keyof typeof colors] || '#000';
          (element as HTMLElement).style.outline = `3px solid ${color}`;
          (element as HTMLElement).style.outlineOffset = '3px';
          element.classList.add('uisentinel-component-marker');

          // Add label
          const rect = element.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

          const label = document.createElement('div');
          label.className = 'uisentinel-component-label';
          label.style.cssText = `
            position: absolute;
            left: ${rect.left + scrollLeft}px;
            top: ${rect.top + scrollTop - 30}px;
            background: ${color};
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            z-index: 999999;
            white-space: nowrap;
            pointer-events: none;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          `;
          label.textContent = `${type.toUpperCase()} ${index + 1}/${components.length}`;

          document.body.appendChild(label);
        }, 300);

        return {
          success: true,
          type,
          index,
          total: components.length,
          component,
          message: `Scrolled to ${type} ${index + 1} of ${components.length}`
        };
      }
    });
  }

  /**
   * Optional: Add CSS styles for component markers
   */
  getStyles(): string {
    return this.createStyles({
      '.uisentinel-component-marker': {
        'transition': 'outline 0.2s ease-in-out'
      }
    });
  }

  async initialize(_page: Page): Promise<void> {
    // Optional initialization
  }

  async cleanup(page: Page): Promise<void> {
    await page.evaluate(() => {
      // @ts-ignore
      const api = window['__extension_component-detector__'];
      if (api && api.clearHighlights) {
        api.clearHighlights();
      }
      // Clean up labels too
      document.querySelectorAll('.uisentinel-component-label').forEach(el => el.remove());
    }).catch(() => {});
  }
}

/**
 * MCP Tool Definitions for UIsentinel Browser Extensions
 *
 * These tools expose the browser extensions (ElementInspector, A11yInspector, etc.)
 * as MCP tools that AI agents can use to inspect, debug, and analyze web UIs.
 */

export const MCP_TOOLS = {
  /**
   * Element Inspection Tools
   */
  uisentinel_inspect_element: {
    name: 'uisentinel_inspect_element',
    description: 'Comprehensively inspect a web element with CDP, capturing screenshots, box model, styles, attributes, and hierarchy. Returns detailed JSON metadata perfect for AI agents to understand element structure and styling. When expectations are provided, results include an expectations file for comparison.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the page to inspect',
        },
        selector: {
          type: 'string',
          description: 'CSS selector of the element to inspect',
        },
        showOverlay: {
          type: 'boolean',
          description: 'Show CDP DevTools-style overlay on the element',
          default: true,
        },
        captureScreenshot: {
          type: 'boolean',
          description: 'Capture full page screenshot',
          default: true,
        },
        captureElementScreenshot: {
          type: 'boolean',
          description: 'Capture cropped screenshot of the element',
          default: true,
        },
        captureZoomedScreenshot: {
          type: 'boolean',
          description: 'Capture zoomed screenshot for detailed inspection',
          default: false,
        },
        zoomLevel: {
          type: 'number',
          description: 'Zoom level for zoomed screenshot (e.g., 2 for 2x)',
          default: 2,
        },
        includeParent: {
          type: 'boolean',
          description: 'Include parent element information',
          default: true,
        },
        includeChildren: {
          type: 'boolean',
          description: 'Include children elements information',
          default: true,
        },
        includeComputedStyles: {
          type: 'boolean',
          description: 'Include computed CSS styles',
          default: true,
        },
        includeAttributes: {
          type: 'boolean',
          description: 'Include HTML attributes',
          default: true,
        },
        expectations: {
          type: 'string',
          description: 'IMPORTANT: Document your hypothesis/expectations BEFORE inspecting. Describe what you expect to see, what you\'re testing for, or what behavior you\'re validating. This enables scientific, hypothesis-driven testing. After receiving results, you MUST read the expectations file first (returned in files.expectations), then compare the actual screenshots/data against your documented expectations.',
        },
        viewport: {
          type: 'string',
          enum: ['mobile', 'tablet', 'desktop'],
          description: 'Viewport size for inspection',
          default: 'desktop',
        },
      },
      required: ['url', 'selector'],
    },
  },

  uisentinel_inspect_multiple: {
    name: 'uisentinel_inspect_multiple',
    description: 'Inspect multiple elements at once and generate a comparison report. Useful for analyzing layout consistency, comparing component variants, or auditing multiple elements simultaneously. When expectations are provided, results include an expectations file for comparison.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the page to inspect',
        },
        selectors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of CSS selectors to inspect',
        },
        captureScreenshots: {
          type: 'boolean',
          description: 'Capture screenshots of each element',
          default: true,
        },
        expectations: {
          type: 'string',
          description: 'IMPORTANT: Document your hypothesis/expectations BEFORE inspecting. Describe what you expect to see, what you\'re testing for, or what behavior you\'re validating. This enables scientific, hypothesis-driven testing. After receiving results, you MUST read the expectations file first (returned in files.expectations), then compare the actual screenshots/data against your documented expectations.',
        },
        viewport: {
          type: 'string',
          enum: ['mobile', 'tablet', 'desktop'],
          description: 'Viewport size for inspection',
          default: 'desktop',
        },
      },
      required: ['url', 'selectors'],
    },
  },

  uisentinel_inspect_with_action: {
    name: 'uisentinel_inspect_with_action',
    description: 'Inspect an element before and after an interaction (click, hover, focus, scroll). Captures element state changes and generates before/after screenshots. Perfect for testing interactive components like buttons, modals, dropdowns, or hover effects. When expectations are provided, results include an expectations file for comparison.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the page',
        },
        selector: {
          type: 'string',
          description: 'CSS selector of the element to interact with',
        },
        action: {
          type: 'string',
          enum: ['click', 'hover', 'focus', 'scroll'],
          description: 'Action to perform on the element',
        },
        captureDelay: {
          type: 'number',
          description: 'Delay in ms before capturing after action',
          default: 500,
        },
        expectations: {
          type: 'string',
          description: 'IMPORTANT: Document your hypothesis/expectations BEFORE inspecting. Describe what you expect to see, what you\'re testing for, or what behavior you\'re validating. This enables scientific, hypothesis-driven testing. After receiving results, you MUST read the expectations file first (returned in files.expectations), then compare the actual screenshots/data against your documented expectations.',
        },
        viewport: {
          type: 'string',
          enum: ['mobile', 'tablet', 'desktop'],
          description: 'Viewport size',
          default: 'desktop',
        },
      },
      required: ['url', 'selector', 'action'],
    },
  },

  /**
   * Accessibility Tools
   */
  uisentinel_check_accessibility: {
    name: 'uisentinel_check_accessibility',
    description: 'Run WCAG 2.1 accessibility checks using axe-core and visualize violations on the page. Returns detailed violation data with severity levels, affected elements, and fix suggestions. Optionally highlights issues with visual markers. When expectations are provided, results include an expectations file for comparison.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the page to check',
        },
        showViolations: {
          type: 'boolean',
          description: 'Show visual markers for violations on screenshot',
          default: true,
        },
        highlightIssues: {
          type: 'boolean',
          description: 'Highlight problematic elements',
          default: true,
        },
        expectations: {
          type: 'string',
          description: 'IMPORTANT: Document your hypothesis/expectations BEFORE inspecting. Describe what you expect to see, what you\'re testing for, or what behavior you\'re validating. This enables scientific, hypothesis-driven testing. After receiving results, you MUST read the expectations file first (returned in files.expectations), then compare the actual screenshots/data against your documented expectations.',
        },
        viewport: {
          type: 'string',
          enum: ['mobile', 'tablet', 'desktop'],
          description: 'Viewport size',
          default: 'desktop',
        },
      },
      required: ['url'],
    },
  },

  uisentinel_check_contrast: {
    name: 'uisentinel_check_contrast',
    description: 'Analyze color contrast ratios for all text elements on the page according to WCAG AA/AAA standards. Identifies low-contrast text and suggests color fixes. Returns detailed contrast data with pass/fail status. When expectations are provided, results include an expectations file for comparison.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the page',
        },
        minRatioAA: {
          type: 'number',
          description: 'Minimum contrast ratio for WCAG AA (default: 4.5)',
          default: 4.5,
        },
        minRatioAAA: {
          type: 'number',
          description: 'Minimum contrast ratio for WCAG AAA (default: 7)',
          default: 7,
        },
        highlightIssues: {
          type: 'boolean',
          description: 'Highlight low-contrast elements visually',
          default: true,
        },
        expectations: {
          type: 'string',
          description: 'IMPORTANT: Document your hypothesis/expectations BEFORE inspecting. Describe what you expect to see, what you\'re testing for, or what behavior you\'re validating. This enables scientific, hypothesis-driven testing. After receiving results, you MUST read the expectations file first (returned in files.expectations), then compare the actual screenshots/data against your documented expectations.',
        },
        viewport: {
          type: 'string',
          enum: ['mobile', 'tablet', 'desktop'],
          description: 'Viewport size',
          default: 'desktop',
        },
      },
      required: ['url'],
    },
  },

  /**
   * Layout & Measurement Tools
   */
  uisentinel_measure_element: {
    name: 'uisentinel_measure_element',
    description: 'Display visual box model measurements for an element, showing dimensions, margin, padding, and border. Creates annotated screenshots with measurement overlays. Perfect for debugging layout issues. When expectations are provided, results include an expectations file for comparison.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the page',
        },
        selector: {
          type: 'string',
          description: 'CSS selector of the element to measure',
        },
        showDimensions: {
          type: 'boolean',
          description: 'Show width/height',
          default: true,
        },
        showMargin: {
          type: 'boolean',
          description: 'Show margin',
          default: true,
        },
        showPadding: {
          type: 'boolean',
          description: 'Show padding',
          default: true,
        },
        showBorder: {
          type: 'boolean',
          description: 'Show border',
          default: true,
        },
        expectations: {
          type: 'string',
          description: 'IMPORTANT: Document your hypothesis/expectations BEFORE inspecting. Describe what you expect to see, what you\'re testing for, or what behavior you\'re validating. This enables scientific, hypothesis-driven testing. After receiving results, you MUST read the expectations file first (returned in files.expectations), then compare the actual screenshots/data against your documented expectations.',
        },
        viewport: {
          type: 'string',
          enum: ['mobile', 'tablet', 'desktop'],
          description: 'Viewport size',
          default: 'desktop',
        },
      },
      required: ['url', 'selector'],
    },
  },

  uisentinel_show_grid: {
    name: 'uisentinel_show_grid',
    description: 'Overlay a visual grid on the page to verify alignment and spacing. Supports 8px baseline grid, 12-column responsive grid, and alignment guides. Helps ensure consistent spacing and layout. When expectations are provided, results include an expectations file for comparison.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the page',
        },
        gridSize: {
          type: 'number',
          description: 'Grid size in pixels (for 8px grid)',
          default: 8,
        },
        gridType: {
          type: 'string',
          enum: ['8px', '12-column', 'alignment-guides'],
          description: 'Type of grid to show',
          default: '8px',
        },
        expectations: {
          type: 'string',
          description: 'IMPORTANT: Document your hypothesis/expectations BEFORE inspecting. Describe what you expect to see, what you\'re testing for, or what behavior you\'re validating. This enables scientific, hypothesis-driven testing. After receiving results, you MUST read the expectations file first (returned in files.expectations), then compare the actual screenshots/data against your documented expectations.',
        },
        viewport: {
          type: 'string',
          enum: ['mobile', 'tablet', 'desktop'],
          description: 'Viewport size',
          default: 'desktop',
        },
      },
      required: ['url'],
    },
  },

  /**
   * Component Analysis Tools
   */
  uisentinel_detect_components: {
    name: 'uisentinel_detect_components',
    description: 'Automatically detect and categorize UI components on the page (buttons, forms, inputs, modals, navigation, etc.). Returns structured data about all components with their properties and locations. Useful for UI audits and documentation. When expectations are provided, results include an expectations file for comparison.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the page',
        },
        includePosition: {
          type: 'boolean',
          description: 'Include position/dimensions for each component',
          default: false,
        },
        highlightComponents: {
          type: 'boolean',
          description: 'Visually highlight detected components',
          default: false,
        },
        expectations: {
          type: 'string',
          description: 'IMPORTANT: Document your hypothesis/expectations BEFORE inspecting. Describe what you expect to see, what you\'re testing for, or what behavior you\'re validating. This enables scientific, hypothesis-driven testing. After receiving results, you MUST read the expectations file first (returned in files.expectations), then compare the actual screenshots/data against your documented expectations.',
        },
        viewport: {
          type: 'string',
          enum: ['mobile', 'tablet', 'desktop'],
          description: 'Viewport size',
          default: 'desktop',
        },
      },
      required: ['url'],
    },
  },

  /**
   * Responsive Design Tools
   */
  uisentinel_check_breakpoints: {
    name: 'uisentinel_check_breakpoints',
    description: 'Test responsive design across multiple breakpoints and capture screenshots at each. Shows active breakpoint indicators and viewport dimensions. Helps verify responsive behavior. When expectations are provided, results include an expectations file for comparison.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the page',
        },
        captureAllBreakpoints: {
          type: 'boolean',
          description: 'Capture screenshots at all standard breakpoints',
          default: true,
        },
        expectations: {
          type: 'string',
          description: 'IMPORTANT: Document your hypothesis/expectations BEFORE inspecting. Describe what you expect to see, what you\'re testing for, or what behavior you\'re validating. This enables scientific, hypothesis-driven testing. After receiving results, you MUST read the expectations file first (returned in files.expectations), then compare the actual screenshots/data against your documented expectations.',
        },
      },
      required: ['url'],
    },
  },

  /**
   * Layout Analysis Tools
   */
  uisentinel_analyze_layout: {
    name: 'uisentinel_analyze_layout',
    description: 'Analyze page layout to detect common issues like element overflows, invisible text (text color matching background), and positioning problems. Returns detailed information about all visible elements with their dimensions, z-index, and potential layout issues. When expectations are provided, results include an expectations file for comparison.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the page to analyze',
        },
        expectations: {
          type: 'string',
          description: 'IMPORTANT: Document your hypothesis/expectations BEFORE inspecting. Describe what you expect to see, what you\'re testing for, or what behavior you\'re validating. This enables scientific, hypothesis-driven testing. After receiving results, you MUST read the expectations file first (returned in files.expectations), then compare the actual screenshots/data against your documented expectations.',
        },
        viewport: {
          type: 'string',
          enum: ['mobile', 'tablet', 'desktop'],
          description: 'Viewport size for analysis',
          default: 'desktop',
        },
      },
      required: ['url'],
    },
  },

  /**
   * Project Detection Tools
   */
  uisentinel_detect_project: {
    name: 'uisentinel_detect_project',
    description: 'Detect the web framework and project configuration by analyzing package.json and project files. Returns framework type (Next.js, Vite, CRA, Angular, SvelteKit, Astro, etc.), package manager (npm, yarn, pnpm, bun), dev command, default port, and configuration files. Helps AI agents understand project structure before making changes. When expectations are provided, results include an expectations file for comparison.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project directory (absolute or relative)',
        },
        expectations: {
          type: 'string',
          description: 'IMPORTANT: Document your hypothesis/expectations BEFORE inspecting. Describe what you expect to see, what you\'re testing for, or what behavior you\'re validating. This enables scientific, hypothesis-driven testing. After receiving results, you MUST read the expectations file first (returned in files.expectations), then compare the actual screenshots/data against your documented expectations.',
        },
      },
      required: ['projectPath'],
    },
  },
};

export type ToolName = keyof typeof MCP_TOOLS;

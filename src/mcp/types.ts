/**
 * MCP Tool Types for UIsentinel Browser Extensions
 */

export interface MCPToolResponse {
  success: boolean;
  data?: any;
  error?: string;
  files?: {
    screenshots?: string[];
    json?: string[];
    reports?: string[];
    expectations?: string;  // Path to expectations markdown file
  };
}

export interface InspectElementParams {
  url: string;
  selector: string;
  showOverlay?: boolean;
  captureScreenshot?: boolean;
  captureElementScreenshot?: boolean;
  captureZoomedScreenshot?: boolean;
  zoomLevel?: number;
  includeParent?: boolean;
  includeChildren?: boolean;
  includeComputedStyles?: boolean;
  includeAttributes?: boolean;
  viewport?: 'mobile' | 'tablet' | 'desktop';
  expectations?: string;  // What the agent expects to see/validate
}

export interface InspectMultipleParams {
  url: string;
  selectors: string[];
  captureScreenshots?: boolean;
  viewport?: 'mobile' | 'tablet' | 'desktop';
  expectations?: string;
}

export interface InspectWithActionParams {
  url: string;
  selector: string;
  action: 'click' | 'hover' | 'focus';
  captureDelay?: number;
  viewport?: 'mobile' | 'tablet' | 'desktop';
  expectations?: string;
}

export interface CheckAccessibilityParams {
  url: string;
  showViolations?: boolean;
  highlightIssues?: boolean;
  viewport?: 'mobile' | 'tablet' | 'desktop';
  expectations?: string;
}

export interface CheckContrastParams {
  url: string;
  minRatioAA?: number;
  minRatioAAA?: number;
  highlightIssues?: boolean;
  viewport?: 'mobile' | 'tablet' | 'desktop';
  expectations?: string;
}

export interface MeasureElementParams {
  url: string;
  selector: string;
  showDimensions?: boolean;
  showMargin?: boolean;
  showPadding?: boolean;
  showBorder?: boolean;
  viewport?: 'mobile' | 'tablet' | 'desktop';
  expectations?: string;
}

export interface DetectComponentsParams {
  url: string;
  includePosition?: boolean;
  highlightComponents?: boolean;
  viewport?: 'mobile' | 'tablet' | 'desktop';
  expectations?: string;
}

export interface ShowGridParams {
  url: string;
  gridSize?: number;
  gridType?: '8px' | '12-column' | 'alignment-guides';
  viewport?: 'mobile' | 'tablet' | 'desktop';
  expectations?: string;
}

export interface ShowBreakpointsParams {
  url: string;
  captureAllBreakpoints?: boolean;
  expectations?: string;
}

export interface AnalyzeLayoutParams {
  url: string;
  viewport?: 'mobile' | 'tablet' | 'desktop';
  expectations?: string;
}

export interface DetectProjectParams {
  projectPath: string;
}

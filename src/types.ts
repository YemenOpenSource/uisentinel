/**
 * Core types for uisentinel
 */

export type Viewport = {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
};

export type ViewportPreset = 'mobile' | 'tablet' | 'desktop' | 'mobile-landscape';

export const VIEWPORT_PRESETS: Record<ViewportPreset, Viewport> = {
  mobile: { width: 375, height: 667, deviceScaleFactor: 2, isMobile: true },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true },
  desktop: { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false },
  'mobile-landscape': { width: 667, height: 375, deviceScaleFactor: 2, isMobile: true },
};

export type Framework = 
  | 'nextjs' 
  | 'vite' 
  | 'cra' 
  | 'html' 
  | 'angular' 
  | 'svelte-kit' 
  | 'astro'
  | 'custom'
  | 'auto';

export type AccessibilityStandard = 'WCAG21A' | 'WCAG21AA' | 'WCAG21AAA';

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

export interface AccessibilityResult {
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  score: number; // 0-100
  wcagLevel: AccessibilityStandard;
}

export interface ScreenshotResult {
  viewport: string;
  path: string;
  width: number;
  height: number;
  timestamp: string;
  url: string;
}

export interface VisualDiffResult {
  diffPath: string;
  diffPixels: number;
  diffPercentage: number;
  totalPixels: number;
  passed: boolean;
  threshold: number;
}

export interface LayoutAnalysis {
  viewport: Viewport;
  elements: Array<{
    selector: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    visible: boolean;
    zIndex: number;
  }>;
  overflows: Array<{
    element: string;
    overflowX: number;
    overflowY: number;
  }>;
  invisibleText: Array<{
    element: string;
    reason: string;
  }>;
}

export interface ValidationResult {
  status: 'success' | 'error' | 'warning';
  url: string;
  timestamp: string;
  screenshots: ScreenshotResult[];
  accessibility?: AccessibilityResult;
  layout?: LayoutAnalysis;
  visualDiff?: VisualDiffResult;
  suggestions: string[];
  errors: string[];
}

export interface UISentinelConfig {
  projectPath?: string;
  framework?: Framework;
  port?: number;
  host?: string;
  headless?: boolean;
  viewports?: ViewportPreset[] | Viewport[];
  accessibility?: {
    enabled: boolean;
    standard: AccessibilityStandard;
    ignore?: string[];
  };
  screenshot?: {
    enabled: boolean;
    fullPage: boolean;
    format: 'png' | 'jpeg';
    quality?: number;
  };
  output?: {
    directory: string;
    format: 'json' | 'html' | 'markdown';
  };
  timeout?: number;
  routes?: string[];
}

// Interactive Action Types
export interface ActionClick {
  type: 'click';
  selector: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
}

export interface ActionHover {
  type: 'hover';
  selector: string;
  duration?: number;
}

export interface ActionFill {
  type: 'fill';
  selector: string;
  value: string;
}

export interface ActionType {
  type: 'type';
  selector: string;
  text: string;
  delay?: number;
}

export interface ActionScroll {
  type: 'scroll';
  selector?: string;
  x?: number;
  y?: number;
}

export interface ActionWait {
  type: 'wait';
  selector?: string;
  duration?: number;
}

export interface ActionPress {
  type: 'press';
  key: string;
}

export interface ActionSelect {
  type: 'select';
  selector: string;
  value: string;
}

export type Action = 
  | ActionClick
  | ActionHover
  | ActionFill
  | ActionType
  | ActionScroll
  | ActionWait
  | ActionPress
  | ActionSelect;

export interface CaptureOptions {
  url: string;
  viewports?: ViewportPreset[] | Viewport[];
  accessibility?: boolean;
  screenshot?: boolean;
  layoutAnalysis?: boolean;
  fullPage?: boolean;
  waitForSelector?: string;
  waitForTimeout?: number;
  // Interactive capture options
  name?: string;
  description?: string;
  actions?: Action[];
}

export interface FrameworkDetectionResult {
  framework: Framework;
  confidence: number;
  command: string;
  port: number;
  lockFile?: string;
  configFile?: string;
}

export interface ServerInfo {
  url: string;
  port: number;
  pid: number;
  framework: Framework;
}

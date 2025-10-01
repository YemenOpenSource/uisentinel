# API Documentation

## UISentinel Class

The main class for interacting with uisentinel.

### Constructor

```typescript
new UISentinel(config?: UISentinelConfig)
```

**Parameters:**
- `config` (optional): Configuration object

### Methods

#### `start(): Promise<void>`

Starts the development server (if project path is provided) and initializes the browser.

```typescript
const nb = new UISentinel({ projectPath: './my-app' });
await nb.start();
```

#### `capture(options: CaptureOptions): Promise<ValidationResult>`

Captures screenshots and runs validation for a single URL.

```typescript
const result = await nb.capture({
  url: 'http://localhost:3000',
  viewports: ['mobile', 'desktop'],
  accessibility: true,
  layoutAnalysis: true,
});
```

**Parameters:**
- `url`: URL to capture
- `viewports`: Array of viewport presets or custom viewports
- `accessibility`: Whether to run accessibility checks
- `layoutAnalysis`: Whether to analyze layout
- `fullPage`: Capture full page scroll
- `waitForSelector`: CSS selector to wait for
- `waitForTimeout`: Maximum wait time in ms

**Returns:** `ValidationResult` with screenshots, accessibility data, and suggestions

#### `validate(routes?: string[]): Promise<ValidationResult[]>`

Validates multiple routes.

```typescript
const results = await nb.validate(['/home', '/about', '/contact']);
```

**Parameters:**
- `routes` (optional): Array of routes to validate. Defaults to config.routes or ['/']

**Returns:** Array of `ValidationResult` objects

#### `diff(currentScreenshot: string, baseline?: string): Promise<ValidationResult>`

Compares a screenshot with a baseline for visual regression testing.

```typescript
const result = await nb.diff('./screenshot.png', './baseline.png');
console.log(result.visualDiff?.diffPercentage); // e.g., 2.5
```

**Parameters:**
- `currentScreenshot`: Path to current screenshot
- `baseline` (optional): Path to baseline screenshot. Auto-detects if not provided.

**Returns:** `ValidationResult` with visual diff data

#### `createBaseline(screenshotPath: string, name: string): Promise<string>`

Creates a baseline from a current screenshot.

```typescript
const baselinePath = await nb.createBaseline('./screenshot.png', 'homepage');
```

#### `agentReport(focus?: string[]): Promise<string>`

Generates an agent-friendly markdown report.

```typescript
const report = await nb.agentReport(['accessibility', 'layout']);
console.log(report);
```

**Parameters:**
- `focus` (optional): Areas to focus on. Options: 'accessibility', 'layout'

**Returns:** Markdown-formatted report string

#### `close(): Promise<void>`

Stops the server and closes the browser.

```typescript
await nb.close();
```

## Types

### UISentinelConfig

```typescript
interface UISentinelConfig {
  projectPath?: string;           // Path to project (enables auto-start)
  framework?: Framework;           // Framework type or 'auto'
  port?: number;                   // Port for dev server
  host?: string;                   // Host URL
  headless?: boolean;              // Run browser in headless mode
  viewports?: ViewportPreset[] | Viewport[]; // Viewports to test
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
  timeout?: number;                // Timeout in ms
  routes?: string[];               // Routes to validate
}
```

### ValidationResult

```typescript
interface ValidationResult {
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
```

### AccessibilityResult

```typescript
interface AccessibilityResult {
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  score: number;              // 0-100
  wcagLevel: AccessibilityStandard;
}
```

### VisualDiffResult

```typescript
interface VisualDiffResult {
  diffPath: string;           // Path to diff image
  diffPixels: number;         // Number of different pixels
  diffPercentage: number;     // Percentage difference
  totalPixels: number;        // Total pixels compared
  passed: boolean;            // Whether diff is within threshold
  threshold: number;          // Threshold used
}
```

### Viewport Presets

```typescript
type ViewportPreset = 'mobile' | 'tablet' | 'desktop' | 'mobile-landscape';

// Preset dimensions:
// mobile: 375x667 (iPhone SE)
// tablet: 768x1024 (iPad)
// desktop: 1920x1080 (Full HD)
// mobile-landscape: 667x375
```

### Custom Viewport

```typescript
interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor?: number;  // Default: 1
  isMobile?: boolean;          // Default: false
}
```

## CLI Commands

### `uisentinel capture`

Capture screenshots and run validation.

```bash
uisentinel capture [options]

Options:
  -u, --url <url>              URL to capture (default: http://localhost:3000)
  -v, --viewports <viewports>  Viewports (comma-separated) (default: mobile,desktop)
  --a11y                       Run accessibility checks
  --layout                     Run layout analysis (default: true)
  --full-page                  Capture full page (default: true)
  --open                       Open screenshots after capture
  -o, --output <dir>           Output directory (default: ./uisentinel-output)
```

### `uisentinel validate`

Validate entire project.

```bash
uisentinel validate [options]

Options:
  -p, --project <path>         Project path (default: .)
  -r, --routes <routes>        Routes to validate (comma-separated) (default: /)
  -o, --output <dir>           Output directory (default: ./uisentinel-output)
  --agent-mode                 Output in agent-friendly format
```

### `uisentinel diff`

Compare screenshots for visual regression.

```bash
uisentinel diff [options]

Options:
  -b, --baseline <path>        Baseline image path
  -c, --current <path>         Current image path
  -t, --threshold <percent>    Difference threshold (%) (default: 5)
  -o, --output <dir>           Output directory (default: ./uisentinel-output)
```

### `uisentinel agent-report`

Generate agent-friendly validation report.

```bash
uisentinel agent-report [options]

Options:
  -p, --project <path>         Project path (default: .)
  -r, --routes <routes>        Routes to validate (comma-separated) (default: /)
  -f, --focus <areas>          Focus areas (comma-separated) (default: accessibility,layout)
  -o, --output <file>          Output file
```

### `uisentinel init`

Initialize uisentinel configuration.

```bash
uisentinel init
```

Creates `uisentinel.config.js` in current directory.

## Examples

See the [examples directory](../examples/) for complete usage examples:

- `usage.ts` - Basic usage patterns
- Check [Copilot Integration Guide](./copilot-integration.md) for AI agent workflows

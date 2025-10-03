# MCP Tools Analysis & Recommendations

Analysis of existing UIsentinel functionality to determine what should be MCP tools vs. internal/deprecated.

---

## Current MCP Tools (9)

✅ Already implemented:
1. `uisentinel_inspect_element` - Comprehensive element inspection
2. `uisentinel_inspect_multiple` - Compare multiple elements
3. `uisentinel_inspect_with_action` - Before/after interaction testing
4. `uisentinel_check_accessibility` - WCAG compliance
5. `uisentinel_check_contrast` - Color contrast analysis
6. `uisentinel_measure_element` - Box model measurements
7. `uisentinel_show_grid` - Alignment grids
8. `uisentinel_detect_components` - Component detection
9. `uisentinel_check_breakpoints` - Responsive testing

---

## Additional Features Analysis

### 1. Advanced Capture (`src/advanced-capture.ts`)

**Currently has:**
- `captureElement()` - ✅ **Covered by** `uisentinel_inspect_element`
- `captureClip()` - ⭐ **Consider adding** as MCP tool
- `captureWithZoom()` - ✅ **Covered by** `uisentinel_inspect_element` (has zoomLevel option)
- `captureElementWithZoom()` - ✅ **Covered by** `uisentinel_inspect_element`
- `captureWithHighlight()` - ⭐ **Consider adding** as MCP tool (useful for docs)
- `captureBeforeAfter()` - ✅ **Covered by** `uisentinel_inspect_with_action`
- `captureAtScrollPosition()` - ⭐ **Consider adding** as MCP tool

**Recommendations:**
- ✅ Keep as internal library (used by other tools)
- ⭐ Add 3 new MCP tools:
  - `uisentinel_capture_region` - Capture specific x,y,width,height
  - `uisentinel_capture_with_highlight` - Highlight element for documentation
  - `uisentinel_capture_at_scroll` - Test scroll positions

---

### 2. Interaction Engine (`src/interaction-engine.ts`)

**Currently has:**
- `executeAction()` - Single action (click, hover, fill, type, scroll, wait, press, select)
- `executeSequence()` - Multiple actions

**Usage:** Already used by `uisentinel_inspect_with_action`

**Recommendations:**
- ✅ Keep as internal library
- ❌ Don't expose individual actions as MCP tools
- Reason: `uisentinel_inspect_with_action` is sufficient for testing interactions
- AI agents can test click, hover, focus, scroll via existing tool

---

### 3. Browser Engine (`src/browser-engine.ts`)

**Currently has:**
- `capture()` - Takes screenshots + accessibility + layout
- `runAccessibilityChecks()` - ✅ **Covered by** `uisentinel_check_accessibility`
- `analyzeLayout()` - ⭐ **Consider adding** as MCP tool
- Extension manager - ✅ Already integrated in MCP tools

**Layout Analysis provides:**
- Element positions and dimensions
- Overflow detection (elements scrolling outside bounds)
- Invisible text detection (text color = background color)

**Recommendations:**
- ⭐ Add new MCP tool:
  - `uisentinel_analyze_layout` - Detect overflows, invisible text, layout issues

---

### 4. Server Manager (`src/server-manager.ts`)

**Currently has:**
- `start()` - Start dev server
- `stop()` - Stop dev server
- `findAvailablePort()` - Port detection
- Framework detection integration

**Recommendations:**
- ❌ Don't add as MCP tools
- Reason: MCP tools should work with already-running servers
- AI agents should validate UIs, not manage dev servers
- Keep as CLI/internal functionality only

---

### 5. Framework Detector (`src/framework-detector.ts`)

**Currently has:**
- `detect()` - Detect Next.js, Vite, CRA, Angular, SvelteKit, Astro, etc.
- `getPackageManager()` - npm, yarn, pnpm, bun

**Recommendations:**
- ⭐ Add new MCP tool:
  - `uisentinel_detect_project` - Get framework, package manager, config files
- Use case: AI agent can understand project structure before making changes
- Example: "This is a Next.js project using pnpm"

---

### 6. CLI Commands (`src/cli.ts`)

**Currently has:**
- `capture` - Screenshot + analysis
- `validate` - Full project validation
- `agent-report` - Generate AI-friendly reports
- `element-zoom` - Zoom to element

**Recommendations:**
- ✅ Keep as CLI commands (workflows)
- ❌ Don't duplicate as MCP tools
- Reason: These are higher-level workflows composed of multiple MCP tools
- AI agents can compose MCP tools to achieve same results

---

## Summary: New MCP Tools to Add

### High Priority (Useful for AI agents)

#### 1. `uisentinel_analyze_layout`
**Purpose:** Detect layout issues (overflows, invisible text, positioning problems)

**When to use:** After creating layouts, debugging visual issues

**Parameters:**
```typescript
{
  url: string;
  viewport?: 'mobile' | 'tablet' | 'desktop';
}
```

**Returns:**
```typescript
{
  success: boolean;
  data: {
    elements: Array<{
      selector: string;
      boundingBox: { x, y, width, height };
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
}
```

---

#### 2. `uisentinel_detect_project`
**Purpose:** Understand project framework and structure

**When to use:** Before making code changes, understanding project setup

**Parameters:**
```typescript
{
  projectPath: string;
}
```

**Returns:**
```typescript
{
  success: boolean;
  data: {
    framework: 'nextjs' | 'vite' | 'cra' | 'angular' | 'svelte-kit' | 'astro' | 'html' | 'custom';
    packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
    devCommand: string;
    defaultPort: number;
    configFiles: string[];
    lockFile?: string;
  }
}
```

---

### Medium Priority (Nice to have)

#### 3. `uisentinel_capture_region`
**Purpose:** Capture specific rectangular area

**When to use:** Cropping specific sections, region-specific screenshots

**Parameters:**
```typescript
{
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  viewport?: 'mobile' | 'tablet' | 'desktop';
}
```

**Returns:**
```typescript
{
  success: boolean;
  files: {
    screenshots: [string]; // Path to region screenshot
  }
}
```

---

#### 4. `uisentinel_highlight_element`
**Purpose:** Capture element with visual highlight for documentation

**When to use:** Creating tutorials, documentation, highlighting important elements

**Parameters:**
```typescript
{
  url: string;
  selector: string;
  highlightColor?: string; // Default: '#ff0000'
  highlightWidth?: number; // Default: 3
  viewport?: 'mobile' | 'tablet' | 'desktop';
}
```

**Returns:**
```typescript
{
  success: boolean;
  files: {
    screenshots: [string]; // Path to highlighted screenshot
  }
}
```

---

#### 5. `uisentinel_capture_scroll_position`
**Purpose:** Test page at specific scroll positions (sticky headers, infinite scroll)

**When to use:** Testing scroll-based interactions, sticky elements

**Parameters:**
```typescript
{
  url: string;
  x?: number; // Default: 0
  y?: number; // Default: 0
  viewport?: 'mobile' | 'tablet' | 'desktop';
}
```

**Returns:**
```typescript
{
  success: boolean;
  files: {
    screenshots: [string]; // Path to scrolled screenshot
  }
}
```

---

### Low Priority / Not Recommended

#### ❌ Individual Interaction Actions
- Don't add: `uisentinel_click`, `uisentinel_hover`, etc.
- Reason: `uisentinel_inspect_with_action` covers this

#### ❌ Server Management
- Don't add: `uisentinel_start_server`, `uisentinel_stop_server`
- Reason: Out of scope for visual validation tools

#### ❌ CLI Workflows
- Don't add: `uisentinel_validate_project`, `uisentinel_agent_report`
- Reason: These are compositions of existing tools, agents can compose themselves

---

## Deprecation Candidates

### Consider Deprecating from CLI:

#### 1. `element-zoom` command
- **Why:** Covered by `uisentinel_inspect_element` with `captureZoomedScreenshot: true`
- **Impact:** Low - rarely used command
- **Recommendation:** Deprecate in v0.3.0

#### 2. Standalone `capture` command
- **Why:** Too generic, MCP tools are more specific and useful
- **Impact:** Medium - might be used in scripts
- **Recommendation:** Keep for backward compatibility, but document MCP tools as preferred

---

## Implementation Priority

### Phase 1 (Next Release - v0.2.1)
1. ✅ `uisentinel_analyze_layout` - High value for debugging
2. ✅ `uisentinel_detect_project` - Helps AI understand context

### Phase 2 (v0.2.2)
3. ✅ `uisentinel_capture_region` - Useful for specific captures
4. ✅ `uisentinel_highlight_element` - Good for documentation

### Phase 3 (v0.3.0)
5. ✅ `uisentinel_capture_scroll_position` - Niche but useful
6. 🗑️ Deprecate `element-zoom` CLI command

---

## Current Status

**Total MCP Tools:**
- Current: 9 tools
- After Phase 1: 11 tools (+2)
- After Phase 2: 13 tools (+2)
- After Phase 3: 14 tools (+1)

**Recommended Final Count:** 14 MCP tools

---

## Decision Matrix

| Feature | Current State | Add as MCP? | Reason |
|---------|--------------|-------------|--------|
| Inspect Element | ✅ MCP Tool | ✅ Done | Core functionality |
| Inspect Multiple | ✅ MCP Tool | ✅ Done | Comparison tool |
| Inspect with Action | ✅ MCP Tool | ✅ Done | Interactive testing |
| Check Accessibility | ✅ MCP Tool | ✅ Done | WCAG compliance |
| Check Contrast | ✅ MCP Tool | ✅ Done | Color analysis |
| Measure Element | ✅ MCP Tool | ✅ Done | Box model |
| Show Grid | ✅ MCP Tool | ✅ Done | Alignment |
| Detect Components | ✅ MCP Tool | ✅ Done | Component audit |
| Check Breakpoints | ✅ MCP Tool | ✅ Done | Responsive |
| **Analyze Layout** | Internal | ⭐ Add | Overflow detection |
| **Detect Project** | Internal | ⭐ Add | Framework detection |
| **Capture Region** | Internal | ⭐ Add | Specific areas |
| **Highlight Element** | Internal | ⭐ Add | Documentation |
| **Capture Scroll** | Internal | ⭐ Add | Scroll states |
| Individual Actions | Internal | ❌ No | Covered by inspect_with_action |
| Server Management | Internal | ❌ No | Out of scope |
| CLI Workflows | CLI | ❌ No | Agent compositions |

---

## Next Steps

1. **Review this analysis** - Approve Phase 1 additions
2. **Implement Phase 1** - Add 2 new tools (`analyze_layout`, `detect_project`)
3. **Update documentation** - Add new tools to MCP_INTEGRATION.md
4. **Update chat mode** - Add new tools to AI agent instructions
5. **Test integration** - Verify with Claude Desktop
6. **Release v0.2.1** - Announce new tools

---

*Last updated: October 2, 2025*

/**
 * All Browser Extensions Demo
 *
 * Comprehensive demonstration of all 7 browser extensions:
 * 1. A11yInspector - Accessibility violations
 * 2. ContrastChecker - Color contrast analysis
 * 3. ElementRuler - Element measurements
 * 4. ComponentDetector - UI component detection
 * 5. LayoutGrid - Grid overlay
 * 6. BreakpointVisualizer - Responsive breakpoints
 * 7. ElementInspector - CDP-based inspection (bonus)
 */

const { UISentinel } = require('../dist/index');
const {
  A11yInspector,
  ContrastChecker,
  ElementRuler,
  ComponentDetector,
  LayoutGrid,
  BreakpointVisualizer,
  ElementInspector
} = require('../dist/index');
const path = require('path');

async function demonstrateAllExtensions() {
  const sentinel = new UISentinel({
    headless: false,
    output: { directory: './all-extensions-output' },
  });

  try {
    console.log('🎨 ALL Browser Extensions Demo');
    console.log('═══════════════════════════════════════════════════════════════\n');

    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    // Register all browser-side extensions
    const extensions = {
      a11y: new A11yInspector(),
      contrast: new ContrastChecker(),
      ruler: new ElementRuler(),
      components: new ComponentDetector(),
      grid: new LayoutGrid(),
      breakpoints: new BreakpointVisualizer(),
      inspector: new ElementInspector(),
    };

    Object.values(extensions).forEach(ext => {
      if (ext.id !== 'element-inspector') { // CDP inspector registered separately
        manager.register(ext);
      }
    });

    console.log('✓ Registered 6 browser extensions\n');

    // Load test page
    const testPagePath = 'file://' + path.resolve(__dirname, 'test-page.html');
    const page = await engine.createPage(testPagePath, 'desktop');
    await page.waitForLoadState('networkidle');
    console.log(`✓ Loaded test page\n`);

    const outputDir = './all-extensions-output';

    // ═══════════════════════════════════════════════════════════════
    // Extension 1: Component Detector
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 Extension 1: Component Detector');
    console.log('─────────────────────────────────────────────────────────────');

    await manager.injectExtension(page, 'component-detector');

    const componentsResult = await manager.executeExtension(page, 'component-detector', 'detectComponents', {
      params: {
        includePosition: true,
        highlightComponents: true
      }
    });

    if (componentsResult.success) {
      console.log(`✓ Detected components:`);
      console.log(`  Buttons: ${componentsResult.data.totals.buttons}`);
      console.log(`  Links: ${componentsResult.data.totals.links}`);
      console.log(`  Forms: ${componentsResult.data.totals.forms}`);
      console.log(`  Inputs: ${componentsResult.data.totals.inputs}`);
      console.log(`  Images: ${componentsResult.data.totals.images}`);
      console.log(`  Headings: ${componentsResult.data.totals.headings}`);
      console.log(`  ${componentsResult.data.summary}\n`);
    }

    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(outputDir, '1-component-detector.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 1-component-detector.png\n');

    await manager.executeExtension(page, 'component-detector', 'clearHighlights');

    // ═══════════════════════════════════════════════════════════════
    // Extension 2: Layout Grid
    // ═══════════════════════════════════════════════════════════════
    console.log('📐 Extension 2: Layout Grid');
    console.log('─────────────────────────────────────────────────────────────');

    await manager.injectExtension(page, 'layout-grid');

    const gridResult = await manager.executeExtension(page, 'layout-grid', 'showGrid', {
      params: {
        gridSize: 8,
        color: 'rgba(255, 0, 0, 0.15)',
        showRuler: true,
        showCenterLines: true
      }
    });

    if (gridResult.success) {
      console.log(`✓ Grid overlay created:`);
      console.log(`  Grid size: ${gridResult.data.gridSize}px`);
      console.log(`  Dimensions: ${gridResult.data.dimensions.width}×${gridResult.data.dimensions.height}\n`);
    }

    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(outputDir, '2-layout-grid.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 2-layout-grid.png\n');

    await manager.executeExtension(page, 'layout-grid', 'hideGrid');

    // Show column grid
    await manager.executeExtension(page, 'layout-grid', 'showColumnGrid', {
      params: {
        columns: 12,
        gutter: 20,
        maxWidth: 1200
      }
    });

    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(outputDir, '2b-column-grid.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 2b-column-grid.png\n');

    await manager.executeExtension(page, 'layout-grid', 'hideGrid');

    // ═══════════════════════════════════════════════════════════════
    // Extension 3: Breakpoint Visualizer
    // ═══════════════════════════════════════════════════════════════
    console.log('📱 Extension 3: Breakpoint Visualizer');
    console.log('─────────────────────────────────────────────────────────────');

    await manager.injectExtension(page, 'breakpoint-visualizer');

    const breakpointResult = await manager.executeExtension(page, 'breakpoint-visualizer', 'showBreakpoints', {
      params: {
        position: 'bottom-right',
        showDimensions: true,
        showOrientation: true
      }
    });

    if (breakpointResult.success) {
      console.log(`✓ Breakpoint indicator shown:`);
      console.log(`  Active breakpoint: ${breakpointResult.data.active}`);
      console.log(`  Viewport: ${breakpointResult.data.width}×${breakpointResult.data.height}`);
      console.log(`  Orientation: ${breakpointResult.data.orientation}\n`);
    }

    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(outputDir, '3-breakpoint-visualizer.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 3-breakpoint-visualizer.png\n');

    await manager.executeExtension(page, 'breakpoint-visualizer', 'hideBreakpoints');

    // ═══════════════════════════════════════════════════════════════
    // Extension 4: Element Ruler
    // ═══════════════════════════════════════════════════════════════
    console.log('📏 Extension 4: Element Ruler');
    console.log('─────────────────────────────────────────────────────────────');

    await manager.injectExtension(page, 'element-ruler');

    const rulerResult = await manager.executeExtension(page, 'element-ruler', 'measureElement', {
      params: {
        selector: '.info-box',
        showDimensions: true,
        showMargin: true,
        showPadding: true,
        showPosition: true
      }
    });

    if (rulerResult.success) {
      const m = rulerResult.data.measurements;
      console.log(`✓ Measured .info-box:`);
      console.log(`  Size: ${Math.round(m.content.width)}×${Math.round(m.content.height)}px`);
      console.log(`  Position: (${Math.round(m.position.x)}, ${Math.round(m.position.y)})`);
      console.log(`  Margin: T${m.margin.top} R${m.margin.right} B${m.margin.bottom} L${m.margin.left}\n`);
    }

    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(outputDir, '4-element-ruler.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 4-element-ruler.png\n');

    await manager.executeExtension(page, 'element-ruler', 'clearMeasurements');

    // ═══════════════════════════════════════════════════════════════
    // Extension 5: Contrast Checker
    // ═══════════════════════════════════════════════════════════════
    console.log('🎨 Extension 5: Contrast Checker');
    console.log('─────────────────────────────────────────────────────────────');

    await manager.injectExtension(page, 'contrast-checker');

    const contrastResult = await manager.executeExtension(page, 'contrast-checker', 'checkContrast', {
      params: {
        minRatioAA: 4.5,
        highlightIssues: true,
        showLabels: true
      }
    });

    if (contrastResult.success) {
      console.log(`✓ Contrast analysis:`);
      console.log(`  Total elements: ${contrastResult.data.stats.totalElements}`);
      console.log(`  Passed: ${contrastResult.data.stats.passed}`);
      console.log(`  Failed AA: ${contrastResult.data.stats.failedAA}`);
      console.log(`  Critical: ${contrastResult.data.stats.critical}\n`);
    }

    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(outputDir, '5-contrast-checker.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 5-contrast-checker.png\n');

    await manager.executeExtension(page, 'contrast-checker', 'clearMarkers');

    // ═══════════════════════════════════════════════════════════════
    // Extension 6: A11y Inspector
    // ═══════════════════════════════════════════════════════════════
    console.log('♿ Extension 6: Accessibility Inspector');
    console.log('─────────────────────────────────────────────────────────────');

    const a11yCheck = await sentinel.capture({
      url: testPagePath,
      accessibility: true,
      screenshot: false
    });

    console.log(`Found ${a11yCheck.accessibility?.violations.length || 0} violations\n`);

    if (a11yCheck.accessibility && a11yCheck.accessibility.violations.length > 0) {
      await manager.injectExtension(page, 'a11y-inspector');

      const a11yResult = await manager.executeExtension(page, 'a11y-inspector', 'showViolations', {
        params: {
          violations: a11yCheck.accessibility.violations,
          showTooltips: true,
          enableHover: false
        }
      });

      if (a11yResult.success) {
        console.log(`✓ Created ${a11yResult.data.markersCreated} visual markers\n`);
      }

      await page.waitForTimeout(3000);
      await page.screenshot({
        path: path.join(outputDir, '6-a11y-inspector.png'),
        fullPage: true
      });
      console.log('✓ Screenshot: 6-a11y-inspector.png\n');

      await manager.executeExtension(page, 'a11y-inspector', 'clearViolations');
    }

    // ═══════════════════════════════════════════════════════════════
    // Extension 7: Element Inspector (CDP-based)
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 Extension 7: Element Inspector (CDP)');
    console.log('─────────────────────────────────────────────────────────────');

    const inspector = extensions.inspector;
    await inspector.initialize(page);

    const inspectResult = await inspector.inspect(page, 'h1', {
      showInfo: true,
      showExtensionLines: true,
      saveToFile: path.join(outputDir, 'h1-inspection.json')
    });

    console.log(`✓ Inspected h1 element:`);
    console.log(`  Tag: ${inspectResult.element.tagName}`);
    console.log(`  Text: "${inspectResult.element.textContent}"`);
    console.log(`  Size: ${Math.round(inspectResult.element.rect.width)}×${Math.round(inspectResult.element.rect.height)}px`);
    console.log(`  Saved: h1-inspection.json\n`);

    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(outputDir, '7-element-inspector.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 7-element-inspector.png\n');

    await inspector.clear(page);

    // ═══════════════════════════════════════════════════════════════
    // FINALE: All Extensions Together
    // ═══════════════════════════════════════════════════════════════
    console.log('🎆 FINALE: All Extensions Together');
    console.log('─────────────────────────────────────────────────────────────');

    // Grid
    await manager.executeExtension(page, 'layout-grid', 'showGrid', {
      params: { gridSize: 8, showRuler: false, showCenterLines: false }
    });

    // Breakpoint
    await manager.executeExtension(page, 'breakpoint-visualizer', 'showBreakpoints', {
      params: { position: 'top-right' }
    });

    // Component highlights
    await manager.executeExtension(page, 'component-detector', 'detectComponents', {
      params: { highlightComponents: true }
    });

    // Contrast issues
    await manager.executeExtension(page, 'contrast-checker', 'checkContrast', {
      params: { highlightIssues: true, showLabels: false }
    });

    console.log('✓ All extensions active simultaneously!\n');

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: path.join(outputDir, '8-all-extensions-combined.png'),
      fullPage: true
    });
    console.log('✓ Screenshot: 8-all-extensions-combined.png\n');

    // Cleanup
    await manager.clearAll(page);
    await inspector.cleanup(page);

    // ═══════════════════════════════════════════════════════════════
    // Summary
    // ═══════════════════════════════════════════════════════════════
    console.log('\n✨ All Browser Extensions Demo Complete!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📁 Output directory: ${outputDir}`);
    console.log('\n📸 Generated Screenshots:');
    console.log('  1. 1-component-detector.png - Color-coded component highlights');
    console.log('  2. 2-layout-grid.png - 8px grid with rulers and center lines');
    console.log('  3. 2b-column-grid.png - 12-column responsive grid');
    console.log('  4. 3-breakpoint-visualizer.png - Viewport size and breakpoint');
    console.log('  5. 4-element-ruler.png - Box model measurements');
    console.log('  6. 5-contrast-checker.png - Color contrast issues highlighted');
    console.log('  7. 6-a11y-inspector.png - Accessibility violations marked');
    console.log('  8. 7-element-inspector.png - CDP DevTools-style inspection');
    console.log('  9. 8-all-extensions-combined.png - All extensions together!');
    console.log('\n📊 JSON Exports:');
    console.log('  • h1-inspection.json - Element inspection metadata');
    console.log('\n🎯 Extension Summary:');
    console.log('  ✓ 7 extensions implemented');
    console.log('  ✓ 6 browser-side extensions (injected JavaScript)');
    console.log('  ✓ 1 CDP-based extension (native DevTools Protocol)');
    console.log('  ✓ All working together harmoniously');
    console.log('\n🤖 For AI Agents:');
    console.log('  • Detect UI components automatically');
    console.log('  • Verify layout alignment with grids');
    console.log('  • Check responsive breakpoints');
    console.log('  • Measure element dimensions precisely');
    console.log('  • Validate color contrast (WCAG)');
    console.log('  • Find accessibility issues');
    console.log('  • Inspect elements with DevTools precision');

    await page.close();
    await sentinel.close();

  } catch (error) {
    console.error('❌ Error:', error);
    await sentinel.close();
    process.exit(1);
  }
}

demonstrateAllExtensions().catch(console.error);

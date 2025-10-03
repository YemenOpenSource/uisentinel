/**
 * Browser Extensions Demo
 *
 * Demonstrates the new browser extensions:
 * 1. A11yInspector - Visual accessibility violation markers
 * 2. ContrastChecker - WCAG color contrast analysis
 * 3. ElementRuler - Element measurement tool
 */

const { UISentinel } = require('../dist/index');
const { A11yInspector } = require('../dist/extensions/a11y-inspector');
const { ContrastChecker } = require('../dist/extensions/contrast-checker');
const { ElementRuler } = require('../dist/extensions/element-ruler');
const path = require('path');

async function demonstrateBrowserExtensions() {
  const sentinel = new UISentinel({
    headless: false, // Show browser to see the visual effects
    output: {
      directory: './browser-extensions-output',
    },
  });

  try {
    console.log('🧩 Browser Extensions Demo');
    console.log('═══════════════════════════════════════════════════════\n');

    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    // Register all extensions
    const a11yInspector = new A11yInspector();
    const contrastChecker = new ContrastChecker();
    const elementRuler = new ElementRuler();

    manager.register(a11yInspector);
    manager.register(contrastChecker);
    manager.register(elementRuler);

    console.log('✓ Registered extensions:');
    console.log(`  • ${a11yInspector.name}`);
    console.log(`  • ${contrastChecker.name}`);
    console.log(`  • ${elementRuler.name}\n`);

    // Create a test page with accessibility issues
    const page = await engine.createPage('https://example.com', 'desktop');
    await page.waitForLoadState('networkidle');
    console.log('✓ Page loaded: https://example.com\n');

    const outputDir = './browser-extensions-output';

    // ═══════════════════════════════════════════════════════
    // DEMO 1: Accessibility Inspector
    // ═══════════════════════════════════════════════════════
    console.log('📋 DEMO 1: Accessibility Inspector');
    console.log('─────────────────────────────────────────────────────');

    // First, run accessibility checks
    const a11yResult = await sentinel.capture({
      url: 'https://example.com',
      accessibility: true,
      screenshot: false,
    });

    console.log(`Found ${a11yResult.accessibility?.violations.length || 0} accessibility violations\n`);

    // Inject the A11y Inspector extension
    await manager.injectExtension(page, 'a11y-inspector');
    console.log('✓ A11y Inspector extension injected\n');

    // Show violations with visual markers
    if (a11yResult.accessibility && a11yResult.accessibility.violations.length > 0) {
      const result = await manager.executeExtension(page, 'a11y-inspector', 'showViolations', {
        params: {
          violations: a11yResult.accessibility.violations,
          showTooltips: true,
          enableHover: true
        }
      });

      if (result.success) {
        console.log(`✓ Created ${result.data.markersCreated} visual markers for violations`);
        console.log(`  Processed ${result.data.violationsProcessed} violation types\n`);
      }

      // Wait and take screenshot
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(outputDir, 'demo1-a11y-violations.png'),
        fullPage: true
      });
      console.log('✓ Screenshot saved: demo1-a11y-violations.png\n');

      // Get statistics
      const stats = await manager.executeExtension(page, 'a11y-inspector', 'getStats');
      if (stats.success) {
        console.log('📊 A11y Markers Statistics:');
        console.log(`   Total markers: ${stats.data.totalMarkers}`);
        console.log(`   By severity:`, stats.data.bySeverity);
        console.log('');
      }

      await page.waitForTimeout(2000);

      // Clear violations
      await manager.executeExtension(page, 'a11y-inspector', 'clearViolations');
      console.log('✓ Cleared all A11y markers\n');
    }

    // ═══════════════════════════════════════════════════════
    // DEMO 2: Contrast Checker
    // ═══════════════════════════════════════════════════════
    console.log('🎨 DEMO 2: Color Contrast Checker');
    console.log('─────────────────────────────────────────────────────');

    // Inject the Contrast Checker extension
    await manager.injectExtension(page, 'contrast-checker');
    console.log('✓ Contrast Checker extension injected\n');

    // Run contrast check
    const contrastResult = await manager.executeExtension(page, 'contrast-checker', 'checkContrast', {
      params: {
        minRatioAA: 4.5,
        highlightIssues: true,
        showLabels: true
      }
    });

    if (contrastResult.success) {
      console.log('📊 Contrast Check Results:');
      console.log(`   ${contrastResult.data.stats.passed}/${contrastResult.data.stats.totalElements} elements passed`);
      console.log(`   ${contrastResult.data.stats.failedAA} failed WCAG AA`);
      console.log(`   ${contrastResult.data.stats.critical} critical failures (ratio < 3:1)`);
      console.log(`   Summary: ${contrastResult.data.summary}\n`);

      if (contrastResult.data.issues.length > 0) {
        console.log('⚠️  Top Contrast Issues:');
        contrastResult.data.issues.slice(0, 5).forEach((issue, idx) => {
          console.log(`   ${idx + 1}. ${issue.selector}`);
          console.log(`      Ratio: ${issue.ratio}:1 (need ${issue.required}:1)`);
          console.log(`      Severity: ${issue.severity}`);
        });
        console.log('');
      }

      // Take screenshot with contrast markers
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(outputDir, 'demo2-contrast-issues.png'),
        fullPage: true
      });
      console.log('✓ Screenshot saved: demo2-contrast-issues.png\n');

      await page.waitForTimeout(2000);

      // Clear markers
      await manager.executeExtension(page, 'contrast-checker', 'clearMarkers');
      console.log('✓ Cleared all contrast markers\n');
    }

    // ═══════════════════════════════════════════════════════
    // DEMO 3: Element Ruler
    // ═══════════════════════════════════════════════════════
    console.log('📐 DEMO 3: Element Ruler (Measurement Tool)');
    console.log('─────────────────────────────────────────────────────');

    // Inject the Element Ruler extension
    await manager.injectExtension(page, 'element-ruler');
    console.log('✓ Element Ruler extension injected\n');

    // Measure the h1 element
    console.log('Measuring h1 element...');
    const h1Measurement = await manager.executeExtension(page, 'element-ruler', 'measureElement', {
      params: {
        selector: 'h1',
        showDimensions: true,
        showMargin: true,
        showPadding: true,
        showPosition: true,
        persistent: false
      }
    });

    if (h1Measurement.success) {
      const m = h1Measurement.data.measurements;
      console.log(`✓ H1 Element Measurements:`);
      console.log(`   Content: ${Math.round(m.content.width)}×${Math.round(m.content.height)}px`);
      console.log(`   Position: (${Math.round(m.position.x)}, ${Math.round(m.position.y)})`);
      console.log(`   Margin: T${m.margin.top} R${m.margin.right} B${m.margin.bottom} L${m.margin.left}`);
      console.log(`   Padding: T${m.padding.top} R${m.padding.right} B${m.padding.bottom} L${m.padding.left}`);
      console.log('');

      // Take screenshot with measurement overlays
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(outputDir, 'demo3-measure-h1.png'),
        fullPage: true
      });
      console.log('✓ Screenshot saved: demo3-measure-h1.png\n');

      await page.waitForTimeout(2000);
    }

    // Clear measurements
    await manager.executeExtension(page, 'element-ruler', 'clearMeasurements');

    // Measure multiple elements
    console.log('Measuring paragraph element...');
    const pMeasurement = await manager.executeExtension(page, 'element-ruler', 'measureElement', {
      params: {
        selector: 'p',
        showDimensions: true,
        showMargin: true,
        showPadding: true
      }
    });

    if (pMeasurement.success) {
      const m = pMeasurement.data.measurements;
      console.log(`✓ Paragraph Measurements:`);
      console.log(`   Content: ${Math.round(m.content.width)}×${Math.round(m.content.height)}px`);
      console.log(`   Margin: T${m.margin.top} R${m.margin.right} B${m.margin.bottom} L${m.margin.left}`);
      console.log('');

      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(outputDir, 'demo3-measure-paragraph.png'),
        fullPage: true
      });
      console.log('✓ Screenshot saved: demo3-measure-paragraph.png\n');

      await page.waitForTimeout(2000);
    }

    // Get layout info
    const layoutInfo = await manager.executeExtension(page, 'element-ruler', 'getLayoutInfo', {
      params: { selector: 'h1' }
    });

    if (layoutInfo.success) {
      console.log('📐 H1 Layout Info:');
      console.log(`   Display: ${layoutInfo.data.layout.display}`);
      console.log(`   Position: ${layoutInfo.data.layout.position}`);
      console.log(`   Dimensions: ${Math.round(layoutInfo.data.layout.width)}×${Math.round(layoutInfo.data.layout.height)}px`);
      console.log('');
    }

    // Clear all measurements
    await manager.executeExtension(page, 'element-ruler', 'clearMeasurements');
    console.log('✓ Cleared all measurements\n');

    // ═══════════════════════════════════════════════════════
    // DEMO 4: Combined Extensions
    // ═══════════════════════════════════════════════════════
    console.log('🎭 DEMO 4: All Extensions Together');
    console.log('─────────────────────────────────────────────────────');

    console.log('Activating all extensions simultaneously...\n');

    // Show A11y violations
    if (a11yResult.accessibility && a11yResult.accessibility.violations.length > 0) {
      await manager.executeExtension(page, 'a11y-inspector', 'showViolations', {
        params: {
          violations: a11yResult.accessibility.violations,
          showTooltips: false  // Hide tooltips for cleaner combined view
        }
      });
      console.log('✓ A11y violations highlighted');
    }

    // Show contrast issues
    await manager.executeExtension(page, 'contrast-checker', 'checkContrast', {
      params: {
        highlightIssues: true,
        showLabels: false  // Hide labels for cleaner view
      }
    });
    console.log('✓ Contrast issues highlighted');

    // Show measurements
    await manager.executeExtension(page, 'element-ruler', 'measureElement', {
      params: { selector: 'h1' }
    });
    console.log('✓ Element measurements displayed\n');

    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(outputDir, 'demo4-combined-extensions.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: demo4-combined-extensions.png\n');

    await page.waitForTimeout(3000);

    // Cleanup
    await manager.clearAll(page);
    console.log('✓ Cleared all extensions\n');

    // ═══════════════════════════════════════════════════════
    // FINAL SUMMARY
    // ═══════════════════════════════════════════════════════
    console.log('\n✨ Browser Extensions Demo Complete!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📁 Output directory: ${outputDir}`);
    console.log('\n📸 Generated Screenshots:');
    console.log('   • demo1-a11y-violations.png - Accessibility issues highlighted');
    console.log('   • demo2-contrast-issues.png - Color contrast problems');
    console.log('   • demo3-measure-h1.png - H1 element measurements');
    console.log('   • demo3-measure-paragraph.png - Paragraph measurements');
    console.log('   • demo4-combined-extensions.png - All extensions active');
    console.log('\n🎯 Extension Capabilities Demonstrated:');
    console.log('   ✓ A11yInspector: Visual WCAG violation markers with severity levels');
    console.log('   ✓ ContrastChecker: Real-time color contrast analysis');
    console.log('   ✓ ElementRuler: Precise box model measurements with overlays');
    console.log('   ✓ Combined: Multiple extensions working together');
    console.log('\n🤖 AI Agent Benefits:');
    console.log('   • See accessibility issues visually');
    console.log('   • Get exact measurements for layout debugging');
    console.log('   • Validate WCAG contrast compliance');
    console.log('   • Combine multiple analysis tools');

    await page.close();
    await sentinel.close();

  } catch (error) {
    console.error('❌ Error:', error);
    await sentinel.close();
    process.exit(1);
  }
}

// Run the demo
demonstrateBrowserExtensions().catch(console.error);

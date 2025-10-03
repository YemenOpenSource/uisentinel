/**
 * Test Visual Extensions on Custom HTML Page
 * This will verify that the visual overlays are actually appearing
 */

const { UISentinel } = require('../dist/index');
const { A11yInspector } = require('../dist/extensions/a11y-inspector');
const { ContrastChecker } = require('../dist/extensions/contrast-checker');
const { ElementRuler } = require('../dist/extensions/element-ruler');
const path = require('path');

async function testVisualExtensions() {
  const sentinel = new UISentinel({
    headless: false, // Show browser so we can see the overlays
    output: { directory: './visual-test-output' },
  });

  try {
    console.log('🧪 Testing Visual Extensions with Custom HTML\n');

    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    // Register extensions
    manager.register(new A11yInspector());
    manager.register(new ContrastChecker());
    manager.register(new ElementRuler());
    console.log('✓ Extensions registered\n');

    // Load test HTML file
    const testPagePath = 'file://' + path.resolve(__dirname, 'test-page.html');
    const page = await engine.createPage(testPagePath, 'desktop');
    await page.waitForLoadState('networkidle');
    console.log(`✓ Loaded test page: ${testPagePath}\n`);

    const outputDir = './visual-test-output';

    // Test 1: Contrast Checker
    console.log('🎨 Test 1: Contrast Checker with Visual Markers');
    console.log('─────────────────────────────────────────────────');

    await manager.injectExtension(page, 'contrast-checker');

    const contrastResult = await manager.executeExtension(page, 'contrast-checker', 'checkContrast', {
      params: {
        minRatioAA: 4.5,
        highlightIssues: true,
        showLabels: true
      }
    });

    if (contrastResult.success) {
      console.log(`✓ Checked ${contrastResult.data.stats.totalElements} elements`);
      console.log(`  Passed: ${contrastResult.data.stats.passed}`);
      console.log(`  Failed AA: ${contrastResult.data.stats.failedAA}`);
      console.log(`  Critical: ${contrastResult.data.stats.critical}\n`);

      if (contrastResult.data.issues.length > 0) {
        console.log('Issues found (showing visual markers):');
        contrastResult.data.issues.forEach((issue, idx) => {
          console.log(`  ${idx + 1}. ${issue.selector}`);
          console.log(`     Ratio: ${issue.ratio}:1 (need ${issue.required}:1) - ${issue.severity}`);
        });
        console.log('');
      }
    }

    console.log('⏸️  Pausing 3 seconds so you can see the contrast markers...');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(outputDir, 'test1-contrast-markers.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: test1-contrast-markers.png\n');

    await manager.executeExtension(page, 'contrast-checker', 'clearMarkers');
    await page.waitForTimeout(500);

    // Test 2: Element Ruler
    console.log('📐 Test 2: Element Ruler with Visual Measurements');
    console.log('─────────────────────────────────────────────────');

    await manager.injectExtension(page, 'element-ruler');

    const rulerResult = await manager.executeExtension(page, 'element-ruler', 'measureElement', {
      params: {
        selector: 'h1',
        showDimensions: true,
        showMargin: true,
        showPadding: true,
        showPosition: true
      }
    });

    if (rulerResult.success) {
      const m = rulerResult.data.measurements;
      console.log('✓ H1 Measurements:');
      console.log(`  Size: ${Math.round(m.content.width)}×${Math.round(m.content.height)}px`);
      console.log(`  Position: (${Math.round(m.position.x)}, ${Math.round(m.position.y)})`);
      console.log(`  Margin: T${m.margin.top} R${m.margin.right} B${m.margin.bottom} L${m.margin.left}`);
      console.log(`  Padding: T${m.padding.top} R${m.padding.right} B${m.padding.bottom} L${m.padding.left}\n`);
    }

    console.log('⏸️  Pausing 3 seconds so you can see the ruler overlay...');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(outputDir, 'test2-element-ruler.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: test2-element-ruler.png\n');

    await manager.executeExtension(page, 'element-ruler', 'clearMeasurements');

    // Measure the low-contrast div
    await manager.executeExtension(page, 'element-ruler', 'measureElement', {
      params: {
        selector: '.low-contrast',
        showDimensions: true,
        showMargin: true,
        showPadding: true
      }
    });

    console.log('⏸️  Pausing 3 seconds for .low-contrast measurement...');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(outputDir, 'test2b-measure-low-contrast.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: test2b-measure-low-contrast.png\n');

    await manager.executeExtension(page, 'element-ruler', 'clearMeasurements');
    await page.waitForTimeout(500);

    // Test 3: A11y Inspector
    console.log('♿ Test 3: Accessibility Inspector');
    console.log('─────────────────────────────────────────────────');

    // Run accessibility check
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
          enableHover: false  // Show all tooltips immediately
        }
      });

      if (a11yResult.success) {
        console.log(`✓ Created ${a11yResult.data.markersCreated} visual markers`);
        console.log(`  Violations processed: ${a11yResult.data.violationsProcessed}\n`);

        const stats = await manager.executeExtension(page, 'a11y-inspector', 'getStats');
        if (stats.success) {
          console.log('Severity breakdown:', stats.data.bySeverity);
          console.log('');
        }
      }

      console.log('⏸️  Pausing 5 seconds so you can see the A11y markers...');
      await page.waitForTimeout(5000);

      await page.screenshot({
        path: path.join(outputDir, 'test3-a11y-violations.png'),
        fullPage: true
      });
      console.log('✓ Screenshot saved: test3-a11y-violations.png\n');

      await manager.executeExtension(page, 'a11y-inspector', 'clearViolations');
    }

    // Test 4: All Combined
    console.log('🎭 Test 4: All Extensions Combined');
    console.log('─────────────────────────────────────────────────');

    // Apply all extensions
    await manager.executeExtension(page, 'contrast-checker', 'checkContrast', {
      params: { highlightIssues: true, showLabels: false }
    });

    await manager.executeExtension(page, 'element-ruler', 'measureElement', {
      params: { selector: 'h1', showDimensions: true, showMargin: true }
    });

    if (a11yCheck.accessibility && a11yCheck.accessibility.violations.length > 0) {
      await manager.executeExtension(page, 'a11y-inspector', 'showViolations', {
        params: {
          violations: a11yCheck.accessibility.violations,
          showTooltips: false
        }
      });
    }

    console.log('✓ All extensions active');
    console.log('⏸️  Pausing 5 seconds for combined view...\n');
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: path.join(outputDir, 'test4-all-combined.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: test4-all-combined.png\n');

    console.log('\n✨ Visual Extension Test Complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log('📁 Check ./visual-test-output/ for screenshots with visual overlays');
    console.log('\nScreenshots:');
    console.log('  • test1-contrast-markers.png - Orange/red outlines for low contrast');
    console.log('  • test2-element-ruler.png - Blue box with measurements for H1');
    console.log('  • test2b-measure-low-contrast.png - Measurements for .low-contrast div');
    console.log('  • test3-a11y-violations.png - Red outlines for accessibility issues');
    console.log('  • test4-all-combined.png - All extensions working together');

    await page.close();
    await sentinel.close();

  } catch (error) {
    console.error('❌ Error:', error);
    await sentinel.close();
    process.exit(1);
  }
}

testVisualExtensions().catch(console.error);

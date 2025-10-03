/**
 * Element Inspector Demo
 * 
 * Demonstrates DevTools-like element inspection
 */

const { UISentinel, ElementInspector } = require('../dist/index');

async function demonstrateInspector() {
  const sentinel = new UISentinel({
    headless: false, // Show browser to see the inspection
    output: {
      directory: './inspector-output',
    },
  });

  try {
    console.log('🔍 Starting Element Inspector demo...\n');

    await sentinel.start();

    // Get browser engine and extension manager
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    // Register the inspector extension
    const inspectorExt = new ElementInspector();
    manager.register(inspectorExt);
    console.log(`✓ Registered extension: ${inspectorExt.name}\n`);

    // Create a page
    const page = await engine.createPage('https://example.com', 'desktop');
    await page.waitForLoadState('networkidle');
    console.log('✓ Page loaded\n');

    // Inject the inspector extension (initializes CDP)
    await manager.injectExtension(page, 'element-inspector');
    console.log('✓ Inspector extension injected (CDP enabled)\n');

    // Get the inspector instance to call CDP methods directly
    const inspector = manager.getExtension('element-inspector');

    // Demo 1: Inspect the h1 element using native browser overlay
    console.log('🔍 Demo 1: Inspecting h1 element with native CDP overlay...');
    const h1Inspection = await inspector.inspect(page, 'h1', {
      showInfo: true,
      showExtensionLines: true,
      showRulers: false,
    });
    
    console.log('   Element:', h1Inspection.element.tagName);
    console.log('   Dimensions:', h1Inspection.element.rect);
    console.log('   Box Model:');
    console.log('     - Padding:', h1Inspection.element.boxModel.padding);
    console.log('     - Border:', h1Inspection.element.boxModel.border);
    console.log('     - Margin:', h1Inspection.element.boxModel.margin);
    console.log('   Styles:', h1Inspection.element.styles);

    await page.waitForTimeout(1000);
    await page.screenshot({ path: './inspector-output/1-inspect-h1.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 1-inspect-h1.png\n');

    // Wait to see the overlay
    await page.waitForTimeout(2000);

    // Clear and inspect paragraph
    await inspector.clear(page);
    
    console.log('🔍 Demo 2: Inspecting paragraph element...');
    const paraInspection = await inspector.inspect(page, 'p');
    
    console.log('   Element:', paraInspection.element.tagName);
    console.log('   Dimensions:', paraInspection.element.rect);
    console.log('   Box Model:', paraInspection.element.boxModel);

    await page.waitForTimeout(1000);
    await page.screenshot({ path: './inspector-output/2-inspect-paragraph.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 2-inspect-paragraph.png\n');

    await page.waitForTimeout(2000);

    // Clear and inspect the link
    await inspector.clear(page);
    
    console.log('🔍 Demo 3: Inspecting link element...');
    const linkInspection = await inspector.inspect(page, 'a');
    
    console.log('   Element:', linkInspection.element.tagName);
    console.log('   Dimensions:', linkInspection.element.rect);
    console.log('   Styles:', linkInspection.element.styles);

    await page.waitForTimeout(1000);
    await page.screenshot({ path: './inspector-output/3-inspect-link.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 3-inspect-link.png\n');

    await page.waitForTimeout(2000);

    // Demo 4: Inspect multiple elements
    await inspector.clear(page);
    
    console.log('🔍 Demo 4: Inspecting multiple elements...');
    const multiResults = await inspector.inspectMultiple(page, ['h1', 'p', 'div', 'a']);
    
    console.log(`   Inspected ${multiResults.length} elements:`);
    multiResults.forEach((result) => {
      if (result.success) {
        const { selector, element } = result;
        console.log(`     - ${selector}: ${Math.round(element.rect.width)}×${Math.round(element.rect.height)} at (${Math.round(element.rect.x)}, ${Math.round(element.rect.y)})`);
      } else {
        console.log(`     - ${result.selector}: ${result.error}`);
      }
    });

    await page.waitForTimeout(1000);
    await page.screenshot({ path: './inspector-output/4-inspect-multiple.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 4-inspect-multiple.png\n');

    await page.waitForTimeout(3000);

    // Close page
    await page.close();

    console.log('\n✅ Inspector demo complete!');
    console.log('\n📁 Check the ./inspector-output directory for screenshots:');
    console.log('   - 1-inspect-h1.png: DevTools-like inspection of h1');
    console.log('   - 2-inspect-paragraph.png: Paragraph inspection');
    console.log('   - 3-inspect-link.png: Link inspection');
    console.log('   - 4-inspect-multiple.png: Multiple elements highlighted\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sentinel.close();
  }
}

// Run the demo
demonstrateInspector().catch(console.error);

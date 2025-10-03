const path = require('path');
const { UISentinel, ElementInspector } = require('../dist/index');

async function runEnhancedInspectorDemo() {
  const sentinel = new UISentinel({
    headless: true,
    output: {
      directory: './r2-enhanced-inspector-output',
    },
  });

  const outputDir = path.join(__dirname, '..', 'r2-enhanced-inspector-output');

  console.log('🔍 Enhanced ElementInspector Demo');
  console.log('='.repeat(50));
  console.log(`Output directory: ${outputDir}\n`);

  try {
    await sentinel.start();

    // Get browser engine and extension manager
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    // Register the inspector extension
    const inspectorExt = new ElementInspector();
    inspectorExt.setOutputDir(outputDir);
    manager.register(inspectorExt);
    console.log(`✓ Registered extension: ${inspectorExt.name}\n`);

    // Create a page
    const page = await engine.createPage(`file://${path.join(__dirname, 'test-page.html')}`, 'desktop');
    await page.waitForLoadState('networkidle');
    console.log('✓ Page loaded\n');

    // Inject the inspector extension (initializes CDP)
    await manager.injectExtension(page, 'element-inspector');
    console.log('✓ Inspector extension injected (CDP enabled)\n');

    // Use the inspector instance directly (already have reference from inspectorExt)
    const inspector = inspectorExt;

  // Test 1: Basic inspection with all metadata and screenshots
  console.log('Test 1: Comprehensive element inspection (h1)');
  console.log('-'.repeat(50));
  const h1Result = await inspector.inspect(page, 'h1', {
    showOverlay: true,
    showInfo: true,
    captureScreenshot: true,
    captureElementScreenshot: true,
    captureZoomedScreenshot: true,
    zoomLevel: 2,
    includeParent: true,
    includeChildren: true,
    includeComputedStyles: true,
    includeAttributes: true,
    autoSave: true,
    outputName: 'h1-comprehensive'
  });

  console.log(`✓ Inspected: ${h1Result.selector}`);
  console.log(`✓ Tag: ${h1Result.element?.tagName}`);
  console.log(`✓ Text: "${h1Result.element?.textContent}"`);
  console.log(`✓ Dimensions: ${Math.round(h1Result.element?.rect.width)}x${Math.round(h1Result.element?.rect.height)}`);
  console.log(`✓ Screenshots: ${Object.keys(h1Result.screenshots || {}).length}`);
  console.log(`✓ JSON file: ${h1Result.files?.metadata || 'N/A'}`);
  console.log(`✓ Markdown report: ${h1Result.files?.report || 'N/A'}\n`);

  // Test 2: Inspect multiple elements for comparison
  console.log('Test 2: Compare multiple elements');
  console.log('-'.repeat(50));
  const multiResult = await inspector.inspectMultiple(page, [
    'h1',
    '.good-contrast',
    '.low-contrast',
    'button'
  ], {
    captureScreenshots: true,
    outputName: 'element-comparison'
  });

  console.log(`✓ Inspected ${multiResult.summary?.totalElements || 0} elements:`);
  console.log(`✓ Successful: ${multiResult.summary?.successful || 0}`);
  console.log(`✓ Failed: ${multiResult.summary?.failed || 0}`);
  console.log(`✓ JSON file: ${multiResult.files?.summary || 'N/A'}\n`);

  // Test 3: Inspect with action - click button
  console.log('Test 3: Inspect with action - Button click');
  console.log('-'.repeat(50));
  const clickResult = await inspector.inspectWithAction(page, 'button', {
    type: 'click'
  }, {
    outputName: 'button-click-action'
  });

  console.log(`✓ Action: ${clickResult.action?.type}`);
  console.log(`✓ Selector: ${clickResult.selector}`);
  console.log(`✓ Before: ${clickResult.screenshots?.before || 'N/A'}`);
  console.log(`✓ After: ${clickResult.screenshots?.after || 'N/A'}`);
  console.log(`✓ JSON file: ${clickResult.files?.result || 'N/A'}\n`);

  // Test 4: Inspect with action - hover on info box
  console.log('Test 4: Inspect with action - Hover effect');
  console.log('-'.repeat(50));
  const hoverResult = await inspector.inspectWithAction(page, '.info-box', {
    type: 'hover'
  }, {
    outputName: 'info-box-hover'
  });

  console.log(`✓ Action: ${hoverResult.action?.type}`);
  console.log(`✓ Selector: ${hoverResult.selector}`);
  console.log(`✓ Before: ${hoverResult.screenshots?.before || 'N/A'}`);
  console.log(`✓ After: ${hoverResult.screenshots?.after || 'N/A'}`);
  console.log(`✓ JSON file: ${hoverResult.files?.result || 'N/A'}\n`);

  // Test 5: Inspect with action - focus on input
  console.log('Test 5: Inspect with action - Input focus');
  console.log('-'.repeat(50));
  const focusResult = await inspector.inspectWithAction(page, 'input[type="text"]', {
    type: 'focus'
  }, {
    outputName: 'input-focus-action'
  });

  console.log(`✓ Action: ${focusResult.action?.type}`);
  console.log(`✓ Selector: ${focusResult.selector}`);
  console.log(`✓ Before: ${focusResult.screenshots?.before || 'N/A'}`);
  console.log(`✓ After: ${focusResult.screenshots?.after || 'N/A'}`);
  console.log(`✓ JSON file: ${focusResult.files?.result || 'N/A'}\n`);

  // Test 6: Inspect with scroll to element
  console.log('Test 6: Inspect with action - Scroll to element');
  console.log('-'.repeat(50));
  const scrollResult = await inspector.inspectWithAction(page, '.better-contrast-text', {
    type: 'scroll'
  }, {
    outputName: 'scroll-to-element'
  });

  console.log(`✓ Action: ${scrollResult.action?.type}`);
  console.log(`✓ Selector: ${scrollResult.selector}`);
  console.log(`✓ Before: ${scrollResult.screenshots?.before || 'N/A'}`);
  console.log(`✓ After: ${scrollResult.screenshots?.after || 'N/A'}`);
  console.log(`✓ JSON file: ${scrollResult.files?.result || 'N/A'}\n`);

  // Test 7: Element with computed styles and full hierarchy
  console.log('Test 7: Deep element analysis');
  console.log('-'.repeat(50));
  const deepResult = await inspector.inspect(page, '.info-box', {
    showOverlay: true,
    captureScreenshot: true,
    captureElementScreenshot: true,
    includeParent: true,
    includeChildren: true,
    includeComputedStyles: true,
    includeAttributes: true,
    autoSave: true,
    outputName: 'deep-analysis'
  });

  console.log(`✓ Selector: ${deepResult.selector}`);
  console.log(`✓ Computed styles: ${Object.keys(deepResult.element?.computedStyles || {}).length} properties`);
  console.log(`✓ Attributes: ${Object.keys(deepResult.element?.attributes || {}).length} attributes`);
  console.log(`✓ Parent: ${deepResult.element?.parent?.tagName || 'N/A'}`);
  console.log(`✓ Children: ${deepResult.element?.children?.length || 0} elements`);
  console.log(`✓ JSON file: ${deepResult.files?.metadata || 'N/A'}\n`);

  console.log('='.repeat(50));
  console.log('✅ Enhanced ElementInspector Demo Complete!');
  console.log(`📁 Check output directory: ${outputDir}`);
  console.log('='.repeat(50));

  await page.close();

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sentinel.close();
  }
}

runEnhancedInspectorDemo().catch(console.error);

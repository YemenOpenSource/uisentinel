/**
 * Element Capture with Metadata Demo
 * 
 * Demonstrates the new capture capabilities:
 * 1. Inspect and capture specific elements with cropped screenshots
 * 2. Get image metadata (dimensions, bounding boxes)
 * 3. Capture multiple elements in batch
 * 4. Capture custom regions with element positions
 */

const { UISentinel, ElementInspector } = require('../dist/index');
const path = require('path');
const fs = require('fs');

async function demonstrateCaptureCapabilities() {
  const sentinel = new UISentinel({
    headless: false,
    output: {
      directory: './capture-demo-output',
    },
  });

  try {
    console.log('📸 Element Capture with Metadata Demo');
    console.log('═══════════════════════════════════════════════════════\n');

    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    
    const page = await engine.createPage('https://example.com', 'desktop');
    await page.waitForLoadState('networkidle');
    console.log('✓ Page loaded\n');

    const outputDir = path.join(__dirname, '../capture-demo-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const inspector = new ElementInspector();
    await inspector.initialize(page);

    // ═══════════════════════════════════════════════════════
    // DEMO 1: Inspect and Capture Single Element
    // ═══════════════════════════════════════════════════════
    console.log('🎯 Demo 1: Inspect and Capture Single Element');
    console.log('─────────────────────────────────────────────────────');

    const h1Result = await inspector.inspectAndCapture(page, 'h1', {
      padding: 30,
      screenshotPath: path.join(outputDir, 'h1-captured.png'),
      metadataPath: path.join(outputDir, 'h1-metadata.json'),
    });

    console.log('✓ Captured h1 element');
    console.log(`  Screenshot: h1-captured.png`);
    console.log(`  Image size: ${h1Result.capture.imageSize.width}x${h1Result.capture.imageSize.height}px`);
    console.log(`  Element position in image: (${h1Result.capture.elementBoundingBox.x}, ${h1Result.capture.elementBoundingBox.y})`);
    console.log(`  Element size: ${h1Result.capture.elementBoundingBox.width}x${h1Result.capture.elementBoundingBox.height}px`);
    console.log(`  Padding: ${h1Result.capture.padding}px`);
    console.log(`  Metadata: h1-metadata.json\n`);

    // ═══════════════════════════════════════════════════════
    // DEMO 2: Batch Capture Multiple Elements
    // ═══════════════════════════════════════════════════════
    console.log('📦 Demo 2: Batch Capture Multiple Elements');
    console.log('─────────────────────────────────────────────────────');

    const batchResult = await inspector.inspectAndCaptureMultiple(
      page,
      ['h1', 'p', 'a', 'div'],
      {
        padding: 20,
        outputDir: path.join(outputDir, 'batch'),
        includeFullPage: true,
      }
    );

    console.log(`✓ Batch capture complete`);
    console.log(`  Total elements: ${batchResult.totalElements}`);
    console.log(`  Successful: ${batchResult.successfulCaptures}`);
    console.log(`  Failed: ${batchResult.failedCaptures}`);
    console.log(`  Full page: ${batchResult.fullPage?.path}`);
    console.log(`  Summary: batch/capture-summary.json\n`);

    batchResult.elements.forEach((el, idx) => {
      if (el.success) {
        console.log(`  ${idx + 1}. ${el.selector}`);
        console.log(`     Screenshot: ${path.basename(el.screenshotPath)}`);
        console.log(`     Image: ${el.capture.imageSize.width}x${el.capture.imageSize.height}px`);
        console.log(`     Element: ${el.capture.elementBoundingBox.width}x${el.capture.elementBoundingBox.height}px at (${el.capture.elementBoundingBox.x}, ${el.capture.elementBoundingBox.y})`);
      }
    });
    console.log();

    // ═══════════════════════════════════════════════════════
    // DEMO 3: Capture Custom Region with Elements
    // ═══════════════════════════════════════════════════════
    console.log('🔲 Demo 3: Capture Custom Region with Elements');
    console.log('─────────────────────────────────────────────────────');

    // Define a custom region (e.g., top portion of the page)
    const customRegion = {
      x: 0,
      y: 0,
      width: 1920,
      height: 400,
    };

    const regionResult = await inspector.captureRegionWithElements(
      page,
      customRegion,
      ['h1', 'p', 'a', 'div', 'body'],
      {
        screenshotPath: path.join(outputDir, 'custom-region.png'),
        metadataPath: path.join(outputDir, 'custom-region-metadata.json'),
      }
    );

    console.log('✓ Captured custom region');
    console.log(`  Region: ${customRegion.x}, ${customRegion.y}, ${customRegion.width}x${customRegion.height}`);
    console.log(`  Screenshot: custom-region.png`);
    console.log(`  Elements inspected: ${regionResult.elements.length}`);
    console.log(`  Visible elements: ${regionResult.visibleElementsCount}`);
    console.log(`  Metadata: custom-region-metadata.json\n`);

    regionResult.elements.forEach((el, idx) => {
      if (el.visible) {
        console.log(`  ${idx + 1}. ${el.selector} (visible)`);
        console.log(`     Position in region: (${Math.round(el.relativeBoundingBox.x)}, ${Math.round(el.relativeBoundingBox.y)})`);
        console.log(`     Size: ${Math.round(el.relativeBoundingBox.width)}x${Math.round(el.relativeBoundingBox.height)}px`);
      }
    });
    console.log();

    // ═══════════════════════════════════════════════════════
    // DEMO 4: Capture with Different Padding
    // ═══════════════════════════════════════════════════════
    console.log('📐 Demo 4: Capture with Different Padding');
    console.log('─────────────────────────────────────────────────────');

    const paddings = [0, 10, 30, 50];
    for (const padding of paddings) {
      const result = await inspector.inspectAndCapture(page, 'a', {
        padding,
        screenshotPath: path.join(outputDir, `link-padding-${padding}.png`),
      });

      console.log(`✓ Padding ${padding}px: ${result.capture.imageSize.width}x${result.capture.imageSize.height}px`);
    }
    console.log();

    // ═══════════════════════════════════════════════════════
    // Display Summary
    // ═══════════════════════════════════════════════════════
    console.log('\n✨ Demo Complete!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📁 Output directory: ${outputDir}`);
    console.log('\n📋 Generated Files:');
    console.log('\nSingle Element Captures:');
    console.log('  • h1-captured.png - H1 with 30px padding');
    console.log('  • h1-metadata.json - Full inspection + image metadata');
    console.log('\nBatch Captures (batch/):');
    console.log('  • fullpage.png - Complete page context');
    console.log('  • element-1-h1.png, element-1-h1.json');
    console.log('  • element-2-p.png, element-2-p.json');
    console.log('  • element-3-a.png, element-3-a.json');
    console.log('  • element-4-div.png, element-4-div.json');
    console.log('  • capture-summary.json - Complete batch report');
    console.log('\nCustom Region:');
    console.log('  • custom-region.png - Cropped 1920x400 region');
    console.log('  • custom-region-metadata.json - Elements within region');
    console.log('\nPadding Variations:');
    console.log('  • link-padding-0.png through link-padding-50.png');
    
    console.log('\n🤖 AI Agent Usage:');
    console.log('  1. Use inspectAndCapture() for focused element analysis');
    console.log('  2. Use inspectAndCaptureMultiple() for batch processing');
    console.log('  3. Use captureRegionWithElements() for area-based analysis');
    console.log('  4. Image metadata includes size + element bounding boxes');
    console.log('  5. Bounding boxes are relative to captured image (not page)');

    // Display example metadata structure
    console.log('\n📄 Metadata Structure Example:');
    console.log(JSON.stringify({
      success: true,
      timestamp: '2025-10-02T...',
      selector: 'h1',
      element: {
        tagName: 'h1',
        rect: { x: 660, y: 133, width: 600, height: 38 },
        '...': '...'
      },
      capture: {
        region: { x: 630, y: 103, width: 660, height: 98 },
        imageSize: { width: 660, height: 98 },
        elementBoundingBox: { x: 30, y: 30, width: 600, height: 38 },
        padding: 30
      }
    }, null, 2));

    await inspector.cleanup(page);
    await sentinel.close();

  } catch (error) {
    console.error('❌ Error:', error);
    await sentinel.close();
    process.exit(1);
  }
}

demonstrateCaptureCapabilities().catch(console.error);

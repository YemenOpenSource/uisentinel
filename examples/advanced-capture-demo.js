/**
 * Advanced Capture Example
 * Demonstrates element-specific capture, zoom, highlight, and before/after
 */

const { UISentinel } = require('../dist/index');
const path = require('path');

async function advancedCaptureDemo() {
  console.log('🎯 Advanced Capture Demo\n');

  const sentinel = new UISentinel({
    output: { directory: path.join(__dirname, '../advanced-output'), format: 'json' },
    headless: true
  });

  try {
    console.log('🚀 Starting UIsentinel...');
    await sentinel.start();

    // Test URL
    const testUrl = 'https://example.com';
    
    // Create a page
    const page = await sentinel.getBrowserEngine().createPage(testUrl);
    const advCapture = sentinel.getBrowserEngine().getAdvancedCapture(page);

    // 1. Capture specific element
    console.log('\n📸 1. Capturing <h1> element...');
    const h1Screenshot = await advCapture.captureElement({
      selector: 'h1',
      padding: 20,
      scrollIntoView: true,
      path: 'heading_element.png'
    });
    console.log('   ✓ Saved:', path.basename(h1Screenshot));

    // 2. Capture with zoom
    console.log('\n🔍 2. Capturing with 2x zoom...');
    const zoomedScreenshot = await advCapture.captureWithZoom({
      zoom: 2,
      fullPage: false,
      path: 'zoomed_2x.png'
    });
    console.log('   ✓ Saved:', path.basename(zoomedScreenshot));

    // 3. Capture with highlight
    console.log('\n✨ 3. Capturing with highlight...');
    const highlightedScreenshot = await advCapture.captureWithHighlight({
      selector: 'h1',
      highlightColor: '#ff0000',
      highlightWidth: 3,
      path: 'heading_highlighted.png'
    });
    console.log('   ✓ Saved:', path.basename(highlightedScreenshot));

    // 4. Capture before/after hover
    console.log('\n🎭 4. Capturing before/after hover state...');
    const [beforePath, afterPath] = await advCapture.captureBeforeAfter({
      selector: 'a',
      action: 'hover',
      beforePath: 'link_before.png',
      afterPath: 'link_after.png'
    });
    console.log('   ✓ Before:', path.basename(beforePath));
    console.log('   ✓ After:', path.basename(afterPath));

    // 5. Capture multiple elements
    console.log('\n📦 5. Capturing multiple elements...');
    const elements = [
      { selector: 'h1', padding: 10, path: 'element_h1.png' },
      { selector: 'p', padding: 10, path: 'element_p.png' },
      { selector: 'a', padding: 10, path: 'element_a.png' }
    ];
    
    const multipleScreenshots = await advCapture.captureElements(elements);
    multipleScreenshots.forEach(screenshot => {
      console.log('   ✓', path.basename(screenshot));
    });

    // 6. Capture at scroll position
    console.log('\n📜 6. Capturing at scroll position...');
    const scrolledScreenshot = await advCapture.captureAtScrollPosition({
      y: 100,
      path: 'scrolled_100px.png'
    });
    console.log('   ✓ Saved:', path.basename(scrolledScreenshot));

    // 7. Capture custom clip/region
    console.log('\n✂️  7. Capturing custom region...');
    const clipScreenshot = await advCapture.captureClip({
      x: 0,
      y: 0,
      width: 400,
      height: 200,
      path: 'custom_region.png'
    });
    console.log('   ✓ Saved:', path.basename(clipScreenshot));

    console.log('\n✅ DEMO COMPLETE!');
    console.log('\nAll screenshots saved to:', path.join(__dirname, '../advanced-output/screenshots'));

    await page.close();
    await sentinel.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await sentinel.close();
    process.exit(1);
  }
}

// Run demo
advancedCaptureDemo();

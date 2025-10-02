/**
 * Zoom Capture Demo
 * Demonstrates all zoom-related capture modes
 */

const { UISentinel } = require('../dist/index');
const path = require('path');

async function zoomCaptureDemo() {
  console.log('🔍 Zoom Capture Demo\n');

  const sentinel = new UISentinel({
    output: { directory: path.join(__dirname, '../zoom-output'), format: 'json' },
    headless: true
  });

  try {
    console.log('🚀 Starting UIsentinel...');
    await sentinel.start();

    const testUrl = 'https://example.com';
    
    const page = await sentinel.getBrowserEngine().createPage(testUrl);
    const advCapture = sentinel.getBrowserEngine().getAdvancedCapture(page);

    // 1. Full page zoom
    console.log('\n🌐 1. Full page with 2x zoom...');
    const pageZoom = await advCapture.captureWithZoom({
      zoom: 2,
      fullPage: false,
      path: 'page_2x_zoom.png'
    });
    console.log('   ✓ Saved:', path.basename(pageZoom));

    // 2. Element with zoom (button/component detail)
    console.log('\n🔬 2. Element (h1) with 2x zoom...');
    const elementZoom = await advCapture.captureElementWithZoom({
      selector: 'h1',
      zoom: 2,
      padding: 20,
      path: 'element_h1_2x_zoom.png'
    });
    console.log('   ✓ Saved:', path.basename(elementZoom));

    // 3. Element with 1.5x zoom
    console.log('\n🔬 3. Element (p) with 1.5x zoom...');
    const elementZoom15 = await advCapture.captureElementWithZoom({
      selector: 'p',
      zoom: 1.5,
      padding: 15,
      path: 'element_p_1.5x_zoom.png'
    });
    console.log('   ✓ Saved:', path.basename(elementZoom15));

    // 4. Region with zoom (hero section detail)
    console.log('\n📐 4. Region (400x300) with 2x zoom...');
    const regionZoom = await advCapture.captureRegionWithZoom({
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      zoom: 2,
      path: 'region_400x300_2x_zoom.png'
    });
    console.log('   ✓ Saved:', path.basename(regionZoom));

    // 5. Small region with high zoom (tiny detail inspection)
    console.log('\n🔍 5. Small region (200x150) with 3x zoom...');
    const smallRegionZoom = await advCapture.captureRegionWithZoom({
      x: 50,
      y: 50,
      width: 200,
      height: 150,
      zoom: 3,
      path: 'region_200x150_3x_zoom.png'
    });
    console.log('   ✓ Saved:', path.basename(smallRegionZoom));

    // 6. Overview with 0.5x zoom
    console.log('\n🌍 6. Full page overview with 0.5x zoom...');
    const overview = await advCapture.captureWithZoom({
      zoom: 0.5,
      fullPage: true,
      path: 'page_overview_0.5x_zoom.png'
    });
    console.log('   ✓ Saved:', path.basename(overview));

    // 7. Element without zoom (for comparison)
    console.log('\n📊 7. Element (h1) without zoom (baseline)...');
    const elementNormal = await advCapture.captureElement({
      selector: 'h1',
      padding: 20,
      path: 'element_h1_normal.png'
    });
    console.log('   ✓ Saved:', path.basename(elementNormal));

    console.log('\n✅ ZOOM DEMO COMPLETE!');
    console.log('\n📁 All screenshots saved to:', path.join(__dirname, '../zoom-output/screenshots'));
    console.log('\n📖 Use Cases:');
    console.log('   • Page zoom: Full page detail inspection');
    console.log('   • Element zoom: Component/button detail view');
    console.log('   • Region zoom: Specific area magnification');
    console.log('   • Overview: See entire layout at once');

    await page.close();
    await sentinel.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await sentinel.close();
    process.exit(1);
  }
}

// Run demo
zoomCaptureDemo();

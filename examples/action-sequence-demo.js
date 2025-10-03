/**
 * Action Sequence Demo
 * Demonstrates the new inspectWithActionSequence method
 * Shows how to capture intermediate states or only final state
 */

const { chromium } = require('playwright');
const { ElementInspector } = require('../dist/extensions/element-inspector');

async function demoActionSequence() {
  console.log('🎬 Action Sequence Demo\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const inspector = new ElementInspector();
  inspector.setOutputDir('./action-sequence-output');
  await inspector.initialize(page);

  try {
    await page.goto('http://localhost:3010/action-sequence-test.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('📋 Demo 1: Interactive Button (hover → wait → click)');
    console.log('   Capturing: ALL intermediate states\n');
    
    const demo1 = await inspector.inspectWithActionSequence(
      page,
      '#interactiveBtn',
      [
        { type: 'hover' },
        { type: 'wait', duration: 500 },
        { type: 'click' },
        { type: 'wait', duration: 300 },
      ],
      {
        outputName: 'demo1-button-interaction',
        captureIntermediate: true,
        captureViewport: false, // Full page
      }
    );
    
    console.log(`   ✓ Completed ${demo1.actionsPerformed} actions`);
    console.log(`   ✓ Captured ${demo1.screenshots.length} screenshots`);
    console.log(`   Files saved to: ${demo1.files.report}\n`);

    // Reset page
    await page.goto('http://localhost:3010/action-sequence-test.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('📋 Demo 2: Dropdown Menu (click → hover → click)');
    console.log('   Capturing: ALL intermediate states\n');
    
    const demo2 = await inspector.inspectWithActionSequence(
      page,
      '#dropdown',
      [
        { type: 'click', target: '#dropdownTrigger' },
        { type: 'wait', duration: 400 },
        { type: 'hover', target: '.dropdown-item:nth-child(2)' },
        { type: 'wait', duration: 300 },
        { type: 'click', target: '.dropdown-item:nth-child(2)' },
      ],
      {
        outputName: 'demo2-dropdown-selection',
        captureIntermediate: true,
        captureViewport: true, // Viewport only
      }
    );
    
    console.log(`   ✓ Completed ${demo2.actionsPerformed} actions`);
    console.log(`   ✓ Captured ${demo2.screenshots.length} screenshots`);
    console.log(`   ✓ Capture mode: ${demo2.captureMode}`);
    console.log(`   Files saved to: ${demo2.files.report}\n`);

    // Reset page
    await page.goto('http://localhost:3010/action-sequence-test.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('📋 Demo 3: Form Input (focus → type → validate)');
    console.log('   Capturing: ONLY final state\n');
    
    const demo3 = await inspector.inspectWithActionSequence(
      page,
      '#contactForm',
      [
        { type: 'focus', target: '#name' },
        { type: 'type', target: '#name', value: 'John Doe' },
        { type: 'wait', duration: 300 },
        { type: 'focus', target: '#email' },
        { type: 'type', target: '#email', value: 'john@example.com' },
        { type: 'wait', duration: 300 },
        { type: 'focus', target: '#message' },
        { type: 'type', target: '#message', value: 'This is a test message for the action sequence demo!' },
        { type: 'wait', duration: 500 },
      ],
      {
        outputName: 'demo3-form-completion',
        captureIntermediate: false, // Only initial + final
        captureViewport: true,
      }
    );
    
    console.log(`   ✓ Completed ${demo3.actionsPerformed} actions`);
    console.log(`   ✓ Captured ${demo3.screenshots.length} screenshots (initial + final)`);
    console.log(`   Files saved to: ${demo3.files.report}\n`);

    // Reset page
    await page.goto('http://localhost:3010/action-sequence-test.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('📋 Demo 4: Accordion Expansion (click → wait → click)');
    console.log('   Capturing: ALL intermediate states\n');
    
    const demo4 = await inspector.inspectWithActionSequence(
      page,
      '.accordion-item[data-accordion="1"]',
      [
        { type: 'click', target: '.accordion-item[data-accordion="1"] .accordion-header' },
        { type: 'wait', duration: 400 },
        { type: 'click', target: '.accordion-item[data-accordion="2"] .accordion-header' },
        { type: 'wait', duration: 400 },
      ],
      {
        outputName: 'demo4-accordion-expansion',
        captureIntermediate: true,
        captureViewport: false,
      }
    );
    
    console.log(`   ✓ Completed ${demo4.actionsPerformed} actions`);
    console.log(`   ✓ Captured ${demo4.screenshots.length} screenshots`);
    console.log(`   Files saved to: ${demo4.files.report}\n`);

    // Reset page
    await page.goto('http://localhost:3010/action-sequence-test.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('📋 Demo 5: Card Selection (hover → wait → click)');
    console.log('   Capturing: ALL intermediate states\n');
    
    const demo5 = await inspector.inspectWithActionSequence(
      page,
      '.hover-card[data-card="pro"]',
      [
        { type: 'hover', target: '.hover-card[data-card="starter"]' },
        { type: 'wait', duration: 400 },
        { type: 'hover', target: '.hover-card[data-card="pro"]' },
        { type: 'wait', duration: 400 },
        { type: 'click', target: '.hover-card[data-card="pro"]' },
      ],
      {
        outputName: 'demo5-card-selection',
        captureIntermediate: true,
        captureViewport: true,
      }
    );
    
    console.log(`   ✓ Completed ${demo5.actionsPerformed} actions`);
    console.log(`   ✓ Captured ${demo5.screenshots.length} screenshots`);
    console.log(`   Files saved to: ${demo5.files.report}\n`);

    // Reset page
    await page.goto('http://localhost:3010/action-sequence-test.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('📋 Demo 6: Modal Open/Close (click → wait → click)');
    console.log('   Capturing: ALL intermediate states\n');
    
    const demo6 = await inspector.inspectWithActionSequence(
      page,
      '#modalOverlay',
      [
        { type: 'click', target: '#modalTrigger' },
        { type: 'wait', duration: 500 },
        { type: 'click', target: '#modalClose' },
      ],
      {
        outputName: 'demo6-modal-interaction',
        captureIntermediate: true,
        captureViewport: false,
      }
    );
    
    console.log(`   ✓ Completed ${demo6.actionsPerformed} actions`);
    console.log(`   ✓ Captured ${demo6.screenshots.length} screenshots`);
    console.log(`   Files saved to: ${demo6.files.report}\n`);

    // Reset and scroll to top for deep scroll test
    await page.goto('http://localhost:3010/action-sequence-test.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    console.log('📋 Demo 7: Deep Scroll Button (automatic scroll + click)');
    console.log('   Element is far down page - tests auto-scroll!\n');
    
    const demo7 = await inspector.inspectWithActionSequence(
      page,
      '#deepScrollBtn',
      [
        { type: 'hover' },  // Auto-scrolls to element!
        { type: 'wait', duration: 500 },
        { type: 'click' },
      ],
      {
        outputName: 'demo7-deep-scroll-auto',
        captureIntermediate: true,
        captureViewport: false, // Show full page to see scroll
      }
    );
    
    console.log(`   ✓ Completed ${demo7.actionsPerformed} actions`);
    console.log(`   ✓ Captured ${demo7.screenshots.length} screenshots`);
    console.log(`   ✓ Auto-scrolled from top to element!`);
    console.log(`   Files saved to: ${demo7.files.report}\n`);

    console.log('✨ All demos completed successfully!');
    console.log('\n📁 Output directory: ./action-sequence-output/');
    console.log('   - Check the *-sequence-report.md files for detailed reports');
    console.log('   - Review screenshots to see state changes at each step\n');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    throw error;
  } finally {
    await inspector.cleanup(page);
    await browser.close();
  }
}

// Run the demo
demoActionSequence().catch(console.error);

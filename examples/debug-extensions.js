/**
 * Debug Browser Extensions
 * Test to see what's actually happening with the extensions
 */

const { UISentinel } = require('../dist/index');
const { ElementRuler } = require('../dist/extensions/element-ruler');

async function debugExtensions() {
  const sentinel = new UISentinel({
    headless: false,
    output: { directory: './debug-output' },
  });

  try {
    console.log('🔍 Debugging Browser Extensions\n');

    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    const elementRuler = new ElementRuler();
    manager.register(elementRuler);
    console.log('✓ Registered ElementRuler\n');

    const page = await engine.createPage('https://example.com', 'desktop');
    await page.waitForLoadState('networkidle');
    console.log('✓ Page loaded\n');

    // Inject extension
    console.log('Injecting extension...');
    await manager.injectExtension(page, 'element-ruler');
    console.log('✓ Extension injected\n');

    // Check if the extension API is available in the browser
    console.log('Checking browser-side API...');
    const apiCheck = await page.evaluate(() => {
      return {
        hasExtension: typeof window['__extension_element-ruler__'] !== 'undefined',
        extensionKeys: window['__extension_element-ruler__'] ? Object.keys(window['__extension_element-ruler__']) : [],
        windowKeys: Object.keys(window).filter(k => k.includes('extension'))
      };
    });
    console.log('API Check:', JSON.stringify(apiCheck, null, 2));
    console.log('');

    if (!apiCheck.hasExtension) {
      console.log('❌ Extension API not found in browser!\n');

      // Try to see what code was injected
      console.log('Getting browser code that should be injected:');
      const code = elementRuler.getBrowserCode();
      console.log(code.substring(0, 500) + '...\n');

      return;
    }

    // Try to call measureElement directly
    console.log('Testing measureElement via evaluate...');
    try {
      const directResult = await page.evaluate((sel) => {
        const api = window['__extension_element-ruler__'];
        if (!api || !api.measureElement) {
          return { error: 'measureElement not found', api: typeof api };
        }
        return api.measureElement(sel, {
          showDimensions: true,
          showMargin: true,
          showPadding: true
        });
      }, 'h1');

      console.log('Direct result:', JSON.stringify(directResult, null, 2));
      console.log('');
    } catch (error) {
      console.log('Error calling measureElement:', error.message);
      console.log('');
    }

    // Now try via executeExtension
    console.log('Testing via executeExtension...');
    const result = await manager.executeExtension(page, 'element-ruler', 'measureElement', {
      params: {
        selector: 'h1',
        showDimensions: true
      }
    });

    console.log('executeExtension result:', JSON.stringify(result, null, 2));

    await page.waitForTimeout(5000);
    await page.close();
    await sentinel.close();

  } catch (error) {
    console.error('❌ Error:', error);
    await sentinel.close();
  }
}

debugExtensions().catch(console.error);

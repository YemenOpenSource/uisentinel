/**
 * Integrated Workflow Demo
 * 
 * Demonstrates the complete inspection and capture workflow:
 * 1. Inspect elements with CDP → Get detailed info
 * 2. Save inspection data as JSON → AI-consumable metadata
 * 3. Capture full page screenshot
 * 4. Capture zoomed/cropped element screenshots
 * 5. Read and analyze the generated files
 * 
 * This is the recommended workflow for AI agents to understand UIs
 */

const { UISentinel, ElementInspector } = require('../dist/index');
const path = require('path');
const fs = require('fs');

async function integratedWorkflow() {
  const sentinel = new UISentinel({
    headless: false,
    output: {
      directory: './integrated-workflow-output',
    },
  });

  try {
    console.log('🔄 Integrated Workflow Demo');
    console.log('═══════════════════════════════════════════════════════\n');

    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    
    // Navigate to target page
    const page = await engine.createPage('https://example.com', 'desktop');
    await page.waitForLoadState('networkidle');
    console.log('✓ Page loaded: https://example.com\n');

    // Create output directory
    const outputDir = path.join(__dirname, '../integrated-workflow-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // ═══════════════════════════════════════════════════════
    // STEP 1: INSPECT ELEMENTS & GET JSON METADATA
    // ═══════════════════════════════════════════════════════
    console.log('📋 STEP 1: Inspect Elements & Export JSON');
    console.log('─────────────────────────────────────────────────────');
    
    const inspector = new ElementInspector();
    await inspector.initialize(page);

    // Inspect main heading
    const h1Data = await inspector.inspect(page, 'h1', {
      showInfo: false,
      saveToFile: path.join(outputDir, 'metadata-h1.json'),
    });
    console.log(`✓ Inspected h1: "${h1Data.element.textContent}"`);
    console.log(`  Dimensions: ${Math.round(h1Data.element.rect.width)}x${Math.round(h1Data.element.rect.height)}px`);
    console.log(`  Position: (${Math.round(h1Data.element.rect.x)}, ${Math.round(h1Data.element.rect.y)})`);
    console.log(`  Saved: metadata-h1.json\n`);

    // Clear overlay
    await inspector.clear(page);

    // Inspect paragraph
    const pData = await inspector.inspect(page, 'p', {
      showInfo: false,
      saveToFile: path.join(outputDir, 'metadata-paragraph.json'),
    });
    console.log(`✓ Inspected paragraph`);
    console.log(`  Text: "${pData.element.textContent.substring(0, 50)}..."`);
    console.log(`  Dimensions: ${Math.round(pData.element.rect.width)}x${Math.round(pData.element.rect.height)}px`);
    console.log(`  Saved: metadata-paragraph.json\n`);

    await inspector.clear(page);

    // Inspect link
    const linkData = await inspector.inspect(page, 'a', {
      showInfo: false,
      saveToFile: path.join(outputDir, 'metadata-link.json'),
    });
    console.log(`✓ Inspected link`);
    console.log(`  Text: "${linkData.element.textContent}"`);
    console.log(`  Saved: metadata-link.json\n`);

    await inspector.clear(page);

    // ═══════════════════════════════════════════════════════
    // STEP 2: CAPTURE FULL PAGE SCREENSHOT
    // ═══════════════════════════════════════════════════════
    console.log('📸 STEP 2: Capture Full Page');
    console.log('─────────────────────────────────────────────────────');
    
    const fullPagePath = path.join(outputDir, 'screenshot-fullpage.png');
    await page.screenshot({
      path: fullPagePath,
      fullPage: true,
    });
    console.log(`✓ Full page screenshot saved: screenshot-fullpage.png\n`);

    // ═══════════════════════════════════════════════════════
    // STEP 3: CAPTURE ZOOMED/CROPPED ELEMENT SCREENSHOTS
    // ═══════════════════════════════════════════════════════
    console.log('🔍 STEP 3: Capture Element Screenshots (Zoom/Crop)');
    console.log('─────────────────────────────────────────────────────');

    // Capture h1 element (zoomed)
    const h1Element = await page.$('h1');
    if (h1Element) {
      const h1Box = await h1Element.boundingBox();
      if (h1Box) {
        await page.screenshot({
          path: path.join(outputDir, 'element-h1-zoomed.png'),
          clip: {
            x: h1Box.x - 10, // Add padding
            y: h1Box.y - 10,
            width: h1Box.width + 20,
            height: h1Box.height + 20,
          },
        });
        console.log('✓ H1 element screenshot: element-h1-zoomed.png');
      }
    }

    // Capture paragraph element
    const pElement = await page.$('p');
    if (pElement) {
      const pBox = await pElement.boundingBox();
      if (pBox) {
        await page.screenshot({
          path: path.join(outputDir, 'element-paragraph-zoomed.png'),
          clip: {
            x: pBox.x - 10,
            y: pBox.y - 10,
            width: pBox.width + 20,
            height: pBox.height + 20,
          },
        });
        console.log('✓ Paragraph element screenshot: element-paragraph-zoomed.png');
      }
    }

    // Capture link element
    const linkElement = await page.$('a');
    if (linkElement) {
      const linkBox = await linkElement.boundingBox();
      if (linkBox) {
        await page.screenshot({
          path: path.join(outputDir, 'element-link-zoomed.png'),
          clip: {
            x: linkBox.x - 10,
            y: linkBox.y - 10,
            width: linkBox.width + 20,
            height: linkBox.height + 20,
          },
        });
        console.log('✓ Link element screenshot: element-link-zoomed.png\n');
      }
    }

    // ═══════════════════════════════════════════════════════
    // STEP 4: INSPECT WITH CDP OVERLAY (Visual Documentation)
    // ═══════════════════════════════════════════════════════
    console.log('📐 STEP 4: Inspect with CDP Overlay (for Documentation)');
    console.log('─────────────────────────────────────────────────────');

    // Show CDP overlay on h1 for documentation
    await inspector.inspect(page, 'h1', {
      showInfo: true,
      showExtensionLines: true,
    });

    await page.screenshot({
      path: path.join(outputDir, 'screenshot-h1-with-overlay.png'),
      fullPage: true,
    });
    console.log('✓ H1 with CDP overlay: screenshot-h1-with-overlay.png\n');

    await inspector.clear(page);

    // ═══════════════════════════════════════════════════════
    // STEP 5: READ & ANALYZE FILES (AI AGENT WORKFLOW)
    // ═══════════════════════════════════════════════════════
    console.log('🤖 STEP 5: Read & Analyze Files (AI Agent Workflow)');
    console.log('─────────────────────────────────────────────────────');

    // Create analysis report
    const analysis = {
      url: 'https://example.com',
      timestamp: new Date().toISOString(),
      elements: [],
      screenshots: [],
      insights: [],
    };

    // Read all JSON metadata files
    const metadataFiles = ['metadata-h1.json', 'metadata-paragraph.json', 'metadata-link.json'];
    
    for (const filename of metadataFiles) {
      const filepath = path.join(outputDir, filename);
      if (fs.existsSync(filepath)) {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        analysis.elements.push({
          file: filename,
          selector: data.selector,
          tagName: data.element.tagName,
          text: data.element.textContent,
          dimensions: {
            width: Math.round(data.element.rect.width),
            height: Math.round(data.element.rect.height),
          },
          position: {
            x: Math.round(data.element.rect.x),
            y: Math.round(data.element.rect.y),
          },
          boxModel: data.element.boxModel,
          styles: data.element.styles,
        });
      }
    }

    // List screenshots
    const screenshotFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));
    analysis.screenshots = screenshotFiles.map(f => ({
      filename: f,
      path: path.join(outputDir, f),
      size: fs.statSync(path.join(outputDir, f)).size,
    }));

    // Generate insights
    analysis.insights.push({
      type: 'layout',
      description: 'Page has clear hierarchy: heading → paragraph → link',
      confidence: 'high',
    });

    if (analysis.elements.length > 0) {
      const h1 = analysis.elements.find(e => e.tagName === 'h1');
      if (h1) {
        analysis.insights.push({
          type: 'typography',
          description: `Main heading uses ${h1.styles.fontSize} font at (${h1.position.x}, ${h1.position.y})`,
          element: 'h1',
        });
      }
    }

    // Save analysis report
    const analysisPath = path.join(outputDir, 'analysis-report.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), 'utf-8');
    console.log('✓ Analysis report created: analysis-report.json\n');

    // Display analysis summary
    console.log('📊 Analysis Summary:');
    console.log(`   Elements analyzed: ${analysis.elements.length}`);
    console.log(`   Screenshots captured: ${analysis.screenshots.length}`);
    console.log(`   Insights generated: ${analysis.insights.length}`);
    console.log('\n   Elements:');
    analysis.elements.forEach(el => {
      console.log(`   • ${el.tagName}: "${el.text.substring(0, 40)}${el.text.length > 40 ? '...' : ''}"`);
      console.log(`     Size: ${el.dimensions.width}x${el.dimensions.height}px at (${el.position.x}, ${el.position.y})`);
    });
    console.log('\n   Screenshots:');
    analysis.screenshots.forEach(ss => {
      console.log(`   • ${ss.filename} (${Math.round(ss.size / 1024)}KB)`);
    });

    // ═══════════════════════════════════════════════════════
    // FINAL SUMMARY
    // ═══════════════════════════════════════════════════════
    console.log('\n\n✨ Workflow Complete!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📁 Output directory: ${outputDir}`);
    console.log('\n📋 Generated Files:');
    console.log('   Metadata (JSON):');
    console.log('   • metadata-h1.json - Heading inspection data');
    console.log('   • metadata-paragraph.json - Paragraph inspection data');
    console.log('   • metadata-link.json - Link inspection data');
    console.log('   • analysis-report.json - Complete analysis for AI agents');
    console.log('\n   Screenshots (PNG):');
    console.log('   • screenshot-fullpage.png - Full page capture');
    console.log('   • element-h1-zoomed.png - Zoomed heading');
    console.log('   • element-paragraph-zoomed.png - Zoomed paragraph');
    console.log('   • element-link-zoomed.png - Zoomed link');
    console.log('   • screenshot-h1-with-overlay.png - CDP DevTools overlay');
    console.log('\n🤖 AI Agent Usage:');
    console.log('   1. Read analysis-report.json for structured data');
    console.log('   2. Read metadata-*.json for detailed element info');
    console.log('   3. View screenshots for visual context');
    console.log('   4. Use insights for automated testing/validation');

    await inspector.cleanup(page);
    await sentinel.close();

  } catch (error) {
    console.error('❌ Error:', error);
    await sentinel.close();
    process.exit(1);
  }
}

// Run the workflow
integratedWorkflow().catch(console.error);

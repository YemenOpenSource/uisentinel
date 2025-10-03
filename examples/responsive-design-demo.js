/**
 * Comprehensive Responsive Design Analysis Demo
 * 
 * Demonstrates the 3 new responsive design extensions:
 * 1. Media Query Inspector - Analyzes CSS media queries
 * 2. Responsive Design Inspector - Detects fixed-width elements
 * 3. Mobile UX Analyzer - Validates mobile UX and touch targets
 */

const { UISentinel } = require('../dist/index');
const { MediaQueryInspector } = require('../dist/extensions/media-query-inspector');
const { ResponsiveDesignInspector } = require('../dist/extensions/responsive-design-inspector');
const { MobileUXAnalyzer } = require('../dist/extensions/mobile-ux-analyzer');
const path = require('path');
const fs = require('fs');

async function comprehensiveResponsiveDemo() {
  console.log('🔍 Comprehensive Responsive Design Analysis\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const sentinel = new UISentinel({
    headless: false,
    output: {
      directory: './responsive-demo-output',
    },
  });

  try {
    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    // Register all extensions
    const mediaQueryInspector = new MediaQueryInspector();
    const responsiveInspector = new ResponsiveDesignInspector();
    const mobileUXAnalyzer = new MobileUXAnalyzer();

    manager.register(mediaQueryInspector);
    manager.register(responsiveInspector);
    manager.register(mobileUXAnalyzer);

    console.log('✓ Registered 3 responsive design extensions:');
    console.log(`  • ${mediaQueryInspector.name}`);
    console.log(`  • ${responsiveInspector.name}`);
    console.log(`  • ${mobileUXAnalyzer.name}\n`);

    const testUrl = 'http://localhost:3010/test-non-responsive.html';
    const outputDir = './responsive-demo-output';

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // ============================================
    // Test 1: Media Query Inspector
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test 1: Media Query Inspector');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const page = await engine.createPage(testUrl, 'desktop');
    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Inject extension
    await manager.injectExtension(page, 'media-query-inspector');

    // Extract media queries
    console.log('   📝 Extracting media queries...\n');
    const mqExtraction = await manager.executeExtension(page, 'media-query-inspector', 'extractMediaQueries');

    if (mqExtraction.success) {
      console.log(`   Result:`);
      console.log(`     Has media queries: ${mqExtraction.data.hasMediaQueries ? 'Yes ✓' : 'No ❌'}`);
      console.log(`     Approach: ${mqExtraction.data.approach || 'N/A'}`);
      console.log(`     Total media queries: ${mqExtraction.data.stats.totalMediaQueries}`);
      console.log(`     Unique breakpoints: ${mqExtraction.data.stats.uniqueBreakpoints}`);
      
      if (mqExtraction.data.breakpoints.length > 0) {
        console.log(`     Breakpoints: ${mqExtraction.data.breakpoints.join(', ')}px`);
      } else {
        console.log(`     Breakpoints: None found`);
      }
      console.log('');
    }

    // Suggest missing breakpoints
    console.log('   💡 Checking for missing breakpoints...\n');
    const mqSuggestions = await manager.executeExtension(page, 'media-query-inspector', 'suggestBreakpoints');

    if (mqSuggestions.success && mqSuggestions.data.hasMissingBreakpoints) {
      console.log(`   Missing ${mqSuggestions.data.missingBreakpoints.length} standard breakpoints:`);
      mqSuggestions.data.missingBreakpoints.forEach((bp, i) => {
        console.log(`     ${i + 1}. ${bp.name} (${bp.value}px)`);
        console.log(`        ${bp.recommendation}`);
      });
      console.log('');
    } else {
      console.log('   ✓ All standard breakpoints are present\n');
    }

    // Generate comprehensive report
    console.log('   📋 Generating media query report...\n');
    const mqReport = await manager.executeExtension(page, 'media-query-inspector', 'generateReport');

    if (mqReport.success) {
      console.log(`   Media Query Score: ${mqReport.data.score}/100\n`);
      
      if (mqReport.data.recommendations && mqReport.data.recommendations.length > 0) {
        console.log('   Recommendations:');
        mqReport.data.recommendations.forEach((rec, i) => {
          console.log(`     ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
          console.log(`        Fix: ${rec.fix}`);
        });
        console.log('');
      }

      // Save report
      fs.writeFileSync(
        path.join(outputDir, 'media-query-report.json'),
        JSON.stringify(mqReport.data, null, 2)
      );
      console.log('   💾 Saved: media-query-report.json\n');
    }

    await page.close();

    // ============================================
    // Test 2: Responsive Design Inspector
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📐 Test 2: Responsive Design Inspector');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const page2 = await engine.createPage(testUrl, 'desktop');
    await page2.setViewportSize({ width: 375, height: 667 }); // Mobile viewport
    await page2.goto(testUrl);
    await page2.waitForLoadState('networkidle');
    await page2.waitForTimeout(500);

    // Inject extension
    await manager.injectExtension(page2, 'responsive-design-inspector');

    // Scan for fixed-width elements
    console.log('   🔍 Scanning for fixed-width elements...\n');
    const fixedWidths = await manager.executeExtension(page2, 'responsive-design-inspector', 'scanFixedWidthElements');

    if (fixedWidths.success) {
      console.log(`   Found ${fixedWidths.data.count} elements with fixed widths:`);
      console.log(`     Critical (exceeds viewport): ${fixedWidths.data.criticalCount}`);
      console.log(`     High priority: ${fixedWidths.data.highCount}\n`);

      if (fixedWidths.data.elements.length > 0) {
        console.log('   Top 5 issues:');
        fixedWidths.data.elements.slice(0, 5).forEach((el, i) => {
          console.log(`     ${i + 1}. ${el.selector} (${el.tagName})`);
          console.log(`        Width: ${el.width}`);
          console.log(`        Exceeds viewport: ${el.exceedsViewport ? 'Yes ⚠️' : 'No'}`);
          console.log(`        Fix: ${el.suggestedFix}`);
        });
        console.log('');
      }
    }

    // Analyze layout types
    console.log('   🏗️  Analyzing layout types...\n');
    const layouts = await manager.executeExtension(page2, 'responsive-design-inspector', 'analyzeLayoutTypes');

    if (layouts.success) {
      console.log('   Layout Summary:');
      console.log(`     Flexbox layouts: ${layouts.data.summary.flex}`);
      console.log(`     Grid layouts: ${layouts.data.summary.grid}`);
      console.log(`     Table layouts: ${layouts.data.summary.table}`);
      console.log(`     Non-responsive layouts: ${layouts.data.summary.nonResponsive}\n`);

      if (layouts.data.hasIssues && layouts.data.layouts.length > 0) {
        console.log('   Layout issues:');
        layouts.data.layouts.filter(l => !l.isResponsive).slice(0, 3).forEach((layout, i) => {
          console.log(`     ${i + 1}. ${layout.selector}`);
          console.log(`        Type: ${layout.layoutType}`);
          console.log(`        Suggestion: ${layout.suggestion}`);
        });
        console.log('');
      }
    }

    // Analyze unit usage
    console.log('   📏 Analyzing CSS unit usage...\n');
    const units = await manager.executeExtension(page2, 'responsive-design-inspector', 'analyzeUnitUsage');

    if (units.success) {
      console.log('   Unit Distribution:');
      console.log(`     Pixels (px): ${units.data.percentages.px}%`);
      console.log(`     Percent (%): ${units.data.percentages.percent}%`);
      console.log(`     Rem: ${units.data.percentages.rem}%`);
      console.log(`     Em: ${units.data.percentages.em}%`);
      console.log(`     Viewport (vw/vh): ${units.data.percentages.vw}%`);
      console.log(`\n   Responsive Score: ${units.data.responsiveScore}/100`);
      console.log(`   ${units.data.recommendation}\n`);
    }

    // Comprehensive analysis
    console.log('   🎯 Running comprehensive responsive analysis...\n');
    const responsiveAnalysis = await manager.executeExtension(page2, 'responsive-design-inspector', 'analyzeResponsiveness');

    if (responsiveAnalysis.success) {
      console.log(`   Overall Responsive Score: ${responsiveAnalysis.data.score}/100`);
      console.log(`   Is Responsive: ${responsiveAnalysis.data.isResponsive ? 'Yes ✓' : 'No ❌'}\n`);
      
      console.log('   Summary:');
      console.log(`     Total issues: ${responsiveAnalysis.data.summary.totalIssues}`);
      console.log(`     Critical issues: ${responsiveAnalysis.data.summary.criticalIssues}`);
      console.log(`     High priority issues: ${responsiveAnalysis.data.summary.highIssues}\n`);

      if (responsiveAnalysis.data.recommendations && responsiveAnalysis.data.recommendations.length > 0) {
        console.log('   Recommendations:');
        responsiveAnalysis.data.recommendations.forEach((rec, i) => {
          console.log(`     ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
          console.log(`        Fix: ${rec.fix}`);
        });
        console.log('');
      }

      // Save report
      fs.writeFileSync(
        path.join(outputDir, 'responsive-design-report.json'),
        JSON.stringify(responsiveAnalysis.data, null, 2)
      );
      console.log('   💾 Saved: responsive-design-report.json\n');
    }

    // Take screenshot
    await page2.screenshot({
      path: path.join(outputDir, 'mobile-viewport-375px.png'),
      fullPage: true
    });
    console.log('   📸 Screenshot: mobile-viewport-375px.png\n');

    await page2.close();

    // ============================================
    // Test 3: Mobile UX Analyzer
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 Test 3: Mobile UX Analyzer');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const page3 = await engine.createPage(testUrl, 'desktop');
    await page3.setViewportSize({ width: 375, height: 667 }); // Mobile viewport
    await page3.goto(testUrl);
    await page3.waitForLoadState('networkidle');
    await page3.waitForTimeout(500);

    // Inject extension
    await manager.injectExtension(page3, 'mobile-ux-analyzer');

    // Check viewport meta tag
    console.log('   🔍 Checking viewport meta tag...\n');
    const viewportMeta = await manager.executeExtension(page3, 'mobile-ux-analyzer', 'checkViewportMeta');

    if (viewportMeta.success) {
      console.log(`   Has viewport meta: ${viewportMeta.data.hasViewportMeta ? 'Yes ✓' : 'No ❌'}`);
      console.log(`   Is valid: ${viewportMeta.data.isValid ? 'Yes ✓' : 'No ❌'}`);
      
      if (viewportMeta.data.hasViewportMeta) {
        console.log(`   Content: "${viewportMeta.data.content}"`);
      }
      
      if (viewportMeta.data.issues && viewportMeta.data.issues.length > 0) {
        console.log('   Issues:');
        viewportMeta.data.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      }
      
      console.log(`   Recommendation: ${viewportMeta.data.recommendation}\n`);
    }

    // Analyze touch targets
    console.log('   👆 Analyzing touch targets...\n');
    const touchTargets = await manager.executeExtension(page3, 'mobile-ux-analyzer', 'analyzeTouchTargets');

    if (touchTargets.success) {
      console.log(`   Found ${touchTargets.data.count} touch targets below WCAG 2.1 guidelines:`);
      console.log(`     Critical (< 32px): ${touchTargets.data.criticalCount}`);
      console.log(`     High priority: ${touchTargets.data.highCount}`);
      console.log(`   WCAG Compliance: ${touchTargets.data.wcagCompliance ? 'Yes ✓' : 'No ❌'}\n`);

      if (touchTargets.data.touchTargets.length > 0) {
        console.log('   Top 5 issues:');
        touchTargets.data.touchTargets.slice(0, 5).forEach((target, i) => {
          console.log(`     ${i + 1}. ${target.selector} - "${target.text}"`);
          console.log(`        Size: ${target.width}×${target.height}px`);
          console.log(`        Severity: ${target.severity}`);
          console.log(`        ${target.recommendation}`);
        });
        console.log('');
      }
    }

    // Analyze text readability
    console.log('   📖 Analyzing text readability...\n');
    const textReadability = await manager.executeExtension(page3, 'mobile-ux-analyzer', 'analyzeTextReadability');

    if (textReadability.success) {
      console.log(`   Found ${textReadability.data.count} text elements below recommended size`);
      console.log(`   WCAG Compliance: ${textReadability.data.wcagCompliance ? 'Yes ✓' : 'No ❌'}\n`);

      if (textReadability.data.readabilityIssues.length > 0) {
        console.log('   Sample issues:');
        textReadability.data.readabilityIssues.slice(0, 3).forEach((issue, i) => {
          console.log(`     ${i + 1}. ${issue.selector}`);
          console.log(`        Font size: ${issue.fontSize}px (min: ${issue.minFontSize}px)`);
          console.log(`        Priority: ${issue.priority}`);
        });
        console.log('');
      }
    }

    // Detect tap collisions
    console.log('   🎯 Detecting tap area collisions...\n');
    const tapCollisions = await manager.executeExtension(page3, 'mobile-ux-analyzer', 'detectTapCollisions');

    if (tapCollisions.success) {
      console.log(`   Found ${tapCollisions.data.count} pairs of interactive elements too close together\n`);

      if (tapCollisions.data.collisions.length > 0) {
        console.log('   Sample collisions:');
        tapCollisions.data.collisions.slice(0, 3).forEach((collision, i) => {
          console.log(`     ${i + 1}. ${collision.element1.selector} ↔️ ${collision.element2.selector}`);
          console.log(`        Distance: ${collision.distance}px (min: ${collision.minSpacing}px)`);
          console.log(`        Severity: ${collision.severity}`);
        });
        console.log('');
      }
    }

    // Comprehensive mobile UX analysis
    console.log('   📊 Running comprehensive mobile UX analysis...\n');
    const mobileUX = await manager.executeExtension(page3, 'mobile-ux-analyzer', 'analyzeMobileUX');

    if (mobileUX.success) {
      console.log(`   Mobile UX Score: ${mobileUX.data.score}/100`);
      console.log(`   Is Mobile-Friendly: ${mobileUX.data.isMobileFriendly ? 'Yes ✓' : 'No ❌'}\n`);
      
      console.log('   Summary:');
      console.log(`     Total issues: ${mobileUX.data.summary.totalIssues}`);
      console.log(`     Touch target issues: ${mobileUX.data.summary.touchTargetIssues}`);
      console.log(`     Readability issues: ${mobileUX.data.summary.readabilityIssues}`);
      console.log(`     Collision issues: ${mobileUX.data.summary.collisionIssues}`);
      console.log(`     WCAG Compliance: ${mobileUX.data.summary.wcagCompliance ? 'Yes ✓' : 'No ❌'}\n`);

      if (mobileUX.data.recommendations && mobileUX.data.recommendations.length > 0) {
        console.log('   Recommendations:');
        mobileUX.data.recommendations.forEach((rec, i) => {
          console.log(`     ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.category.toUpperCase()}`);
          console.log(`        Issue: ${rec.issue}`);
          console.log(`        Fix: ${rec.fix}`);
        });
        console.log('');
      }

      // Save report
      fs.writeFileSync(
        path.join(outputDir, 'mobile-ux-report.json'),
        JSON.stringify(mobileUX.data, null, 2)
      );
      console.log('   💾 Saved: mobile-ux-report.json\n');
    }

    // Take screenshot
    await page3.screenshot({
      path: path.join(outputDir, 'mobile-ux-analysis.png'),
      fullPage: true
    });
    console.log('   📸 Screenshot: mobile-ux-analysis.png\n');

    await page3.close();

    // ============================================
    // Generate Comprehensive Report
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Generating Comprehensive Report');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const combinedReport = {
      timestamp: new Date().toISOString(),
      url: testUrl,
      viewport: '375×667 (Mobile)',
      scores: {
        mediaQuery: mqReport.data.score,
        responsiveDesign: responsiveAnalysis.data.score,
        mobileUX: mobileUX.data.score,
        overall: Math.round((mqReport.data.score + responsiveAnalysis.data.score + mobileUX.data.score) / 3)
      },
      summary: {
        hasMediaQueries: mqReport.data.hasMediaQueries,
        isResponsive: responsiveAnalysis.data.isResponsive,
        isMobileFriendly: mobileUX.data.isMobileFriendly,
        totalIssues: responsiveAnalysis.data.summary.totalIssues + mobileUX.data.summary.totalIssues
      },
      details: {
        mediaQueries: mqReport.data,
        responsiveDesign: responsiveAnalysis.data,
        mobileUX: mobileUX.data
      }
    };

    fs.writeFileSync(
      path.join(outputDir, 'comprehensive-responsive-report.json'),
      JSON.stringify(combinedReport, null, 2)
    );

    // Generate Markdown report
    let markdown = '# Comprehensive Responsive Design Analysis\n\n';
    markdown += `**Date:** ${new Date().toLocaleString()}\n`;
    markdown += `**URL:** ${testUrl}\n`;
    markdown += `**Viewport:** 375×667 (Mobile)\n\n`;
    markdown += '---\n\n';
    markdown += '## Overall Scores\n\n';
    markdown += `- **Media Query Score:** ${combinedReport.scores.mediaQuery}/100\n`;
    markdown += `- **Responsive Design Score:** ${combinedReport.scores.responsiveDesign}/100\n`;
    markdown += `- **Mobile UX Score:** ${combinedReport.scores.mobileUX}/100\n`;
    markdown += `- **Overall Score:** ${combinedReport.scores.overall}/100\n\n`;
    
    markdown += `**Status:** ${combinedReport.scores.overall >= 70 ? '✅ PASS' : '❌ FAIL'}\n\n`;
    markdown += '---\n\n';
    
    markdown += '## Key Findings\n\n';
    markdown += `- Has Media Queries: ${combinedReport.summary.hasMediaQueries ? '✓ Yes' : '✗ No'}\n`;
    markdown += `- Is Responsive: ${combinedReport.summary.isResponsive ? '✓ Yes' : '✗ No'}\n`;
    markdown += `- Is Mobile-Friendly: ${combinedReport.summary.isMobileFriendly ? '✓ Yes' : '✗ No'}\n`;
    markdown += `- Total Issues Found: ${combinedReport.summary.totalIssues}\n\n`;
    
    markdown += '---\n\n';
    markdown += '## Reports Generated\n\n';
    markdown += '- `media-query-report.json` - Detailed media query analysis\n';
    markdown += '- `responsive-design-report.json` - Fixed-width elements and layout issues\n';
    markdown += '- `mobile-ux-report.json` - Touch targets, readability, and mobile UX\n';
    markdown += '- `comprehensive-responsive-report.json` - Combined analysis\n';
    markdown += '- `mobile-viewport-375px.png` - Mobile viewport screenshot\n';
    markdown += '- `mobile-ux-analysis.png` - Mobile UX screenshot\n\n';

    fs.writeFileSync(
      path.join(outputDir, 'README.md'),
      markdown
    );

    console.log('✓ Reports generated:');
    console.log('   - comprehensive-responsive-report.json');
    console.log('   - README.md');
    console.log('   - 3 detailed JSON reports');
    console.log('   - 2 screenshots\n');

    // ============================================
    // Final Summary
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Analysis Complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Overall Score: ${combinedReport.scores.overall}/100`);
    console.log(`Status: ${combinedReport.scores.overall >= 70 ? '✅ PASS' : '❌ FAIL'}\n`);
    console.log('Scores by Category:');
    console.log(`  📊 Media Queries: ${combinedReport.scores.mediaQuery}/100`);
    console.log(`  📐 Responsive Design: ${combinedReport.scores.responsiveDesign}/100`);
    console.log(`  📱 Mobile UX: ${combinedReport.scores.mobileUX}/100\n`);
    console.log(`Output directory: ${outputDir}\n`);

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error(error);
  } finally {
    if (sentinel && sentinel.close) {
      await sentinel.close();
    }
  }
}

// Run the demo
comprehensiveResponsiveDemo()
  .then(() => {
    console.log('✓ Demo completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { UISentinel } from './index';
import { ViewportPreset } from './types';

const program = new Command();

program
  .name('uisentinel')
  .description('Visual validation toolkit for AI coding agents')
  .version('0.2.1');

program
  .command('capture')
  .description('Capture screenshots and run validation')
  .option('-u, --url <url>', 'URL to capture', 'http://localhost:3000')
  .option('-v, --viewports <viewports>', 'Viewports (comma-separated)', 'mobile,desktop')
  .option('--a11y', 'Run accessibility checks', false)
  .option('--layout', 'Run layout analysis', true)
  .option('--full-page', 'Capture full page', true)
  .option('--open', 'Open screenshots after capture', false)
  .option('-o, --output <dir>', 'Output directory', './uisentinel-output')
  .option('--name <name>', 'Snake_case name for output files (e.g., mobile_menu_open)')
  .option('--description <desc>', 'Description of what you are testing')
  .option('--click <selector>', 'Click element before capture')
  .option('--hover <selector>', 'Hover element before capture')
  .option('--fill <selector:value>', 'Fill input before capture (format: selector:value)')
  .option('--scroll-to <selector>', 'Scroll to element before capture')
  .option('--wait <ms>', 'Wait duration in ms before capture')
  .option('--actions <json>', 'JSON array of actions to execute')
  .action(async (options) => {
    const spinner = ora('Initializing...').start();
    try {
      // Validate name format (snake_case)
      if (options.name && !/^[a-z0-9_]+$/.test(options.name)) {
        spinner.fail('Invalid name format');
        console.error(chalk.red('❌ Error: --name must be snake_case (lowercase letters, numbers, underscores only)'));
        console.error(chalk.gray('   Example: mobile_menu_open, contact_modal_visible'));
        process.exit(1);
      }

      // Parse actions from CLI options
      const actions: any[] = [];

      if (options.actions) {
        try {
          const parsedActions = JSON.parse(options.actions);
          actions.push(...parsedActions);
        } catch (error) {
          spinner.fail('Invalid JSON in --actions');
          console.error(chalk.red('❌ Error parsing --actions JSON'));
          process.exit(1);
        }
      } else {
        if (options.click) actions.push({ type: 'click', selector: options.click });
        if (options.hover) actions.push({ type: 'hover', selector: options.hover });
        if (options.fill) {
          const [selector, value] = options.fill.split(':');
          if (!selector || !value) {
            spinner.fail('Invalid --fill format');
            console.error(chalk.red('❌ Error: --fill must be in format selector:value'));
            process.exit(1);
          }
          actions.push({ type: 'fill', selector, value });
        }
        if (options.scrollTo) actions.push({ type: 'scroll', selector: options.scrollTo });
        if (options.wait) actions.push({ type: 'wait', duration: parseInt(options.wait) });
      }

      const nb = new UISentinel({
        output: { directory: options.output, format: 'json' },
        headless: !options.open,
      });
      spinner.text = 'Starting browser...';
      await nb.start();
      
      if (actions.length > 0) {
        spinner.text = `Capturing ${options.url} with ${actions.length} action(s)...`;
      } else {
        spinner.text = `Capturing ${options.url}...`;
      }
      
      const result = await nb.capture({
        url: options.url,
        viewports: options.viewports.split(','),
        accessibility: options.a11y,
        layoutAnalysis: options.layout,
        fullPage: options.fullPage,
        name: options.name,
        description: options.description,
        actions: actions.length > 0 ? actions : undefined,
      });
      spinner.succeed('Capture complete!');
      
      if (options.name) {
        console.log(chalk.bold(`\n📝 Name: ${options.name}`));
      }
      if (options.description) {
        console.log(chalk.gray(`   ${options.description}`));
      }
      
      console.log(chalk.bold('\n📸 Screenshots:'));
      result.screenshots.forEach(s => {
        console.log(chalk.gray(`  ${s.viewport}: ${s.path}`));
      });
      if (result.accessibility) {
        console.log(chalk.bold('\n♿ Accessibility:'));
        console.log(`  Score: ${result.accessibility.score}/100`);
        console.log(`  Violations: ${result.accessibility.violations.length}`);
      }
      if (result.suggestions.length > 0) {
        console.log(chalk.bold('\n💡 Suggestions:'));
        result.suggestions.forEach(s => {
          console.log(chalk.yellow(`  • ${s}`));
        });
      }
      const reportPath = path.join(options.output, 'report.json');
      fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
      console.log(chalk.gray(`\n📄 Report saved to ${reportPath}`));
      await nb.close();
    } catch (error: any) {
      spinner.fail('Failed to capture');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate entire project')
  .option('-p, --project <path>', 'Project path', '.')
  .option('-r, --routes <routes>', 'Routes to validate (comma-separated)', '/')
  .option('-o, --output <dir>', 'Output directory', './uisentinel-output')
  .option('--agent-mode', 'Output in agent-friendly format', false)
  .action(async (options) => {
    const spinner = ora('Starting validation...').start();
    try {
      const nb = new UISentinel({
        projectPath: options.project,
        output: { directory: options.output, format: 'json' },
        routes: options.routes.split(','),
      });
      spinner.text = 'Starting project...';
      await nb.start();
      spinner.text = 'Validating routes...';
      const results = await nb.validate();
      spinner.succeed('Validation complete!');
      console.log(chalk.bold('\n📊 Validation Summary:'));
      results.forEach((result, index) => {
        console.log(chalk.bold(`\n\${index + 1}. \${result.url}`));
        if (result.accessibility) {
          const scoreColor = result.accessibility.score >= 90 ? chalk.green :
            result.accessibility.score >= 70 ? chalk.yellow : chalk.red;
          console.log(`  Accessibility: \${scoreColor(result.accessibility.score + '/100')}`);
        }
        if (result.suggestions.length > 0) {
          console.log('  Issues:');
          result.suggestions.slice(0, 3).forEach(s => {
            console.log(chalk.yellow(`    • \${s}`));
          });
          if (result.suggestions.length > 3) {
            console.log(chalk.gray(`    ... and \${result.suggestions.length - 3} more`));
          }
        } else {
          console.log(chalk.green('  ✓ No issues found'));
        }
      });
      const reportPath = path.join(options.output, 'validation-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
      console.log(chalk.gray(`\n📄 Full report saved to \${reportPath}`));
      if (options.agentMode) {
        const agentReport = await nb.agentReport();
        console.log('\n' + chalk.bold('Agent Report:'));
        console.log(agentReport);
      }
      await nb.close();
    } catch (error: any) {
      spinner.fail('Validation failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('diff')
  .description('Compare screenshots for visual regression')
  .option('-b, --baseline <path>', 'Baseline image path')
  .option('-c, --current <path>', 'Current image path')
  .option('-t, --threshold <percent>', 'Difference threshold (%)', '5')
  .option('-o, --output <dir>', 'Output directory', './uisentinel-output')
  .action(async (options) => {
    if (!options.baseline || !options.current) {
      console.error(chalk.red('Both --baseline and --current are required'));
      process.exit(1);
    }
    const spinner = ora('Comparing images...').start();
    try {
      const nb = new UISentinel({
        output: { directory: options.output, format: 'json' },
      });
      const result = await nb.diff(options.current, options.baseline);
      if (result.visualDiff?.passed) {
        spinner.succeed('Images match!');
        console.log(chalk.green(`Difference: \${result.visualDiff.diffPercentage}%`));
      } else {
        spinner.fail('Visual regression detected!');
        console.log(chalk.red(`Difference: \${result.visualDiff?.diffPercentage}%`));
        console.log(chalk.gray(`Diff image: \${result.visualDiff?.diffPath}`));
      }
      await nb.close();
      process.exit(result.visualDiff?.passed ? 0 : 1);
    } catch (error: any) {
      spinner.fail('Comparison failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('agent-report')
  .description('Generate agent-friendly validation report')
  .option('-p, --project <path>', 'Project path', '.')
  .option('-r, --routes <routes>', 'Routes to validate (comma-separated)', '/')
  .option('-f, --focus <areas>', 'Focus areas (comma-separated)', 'accessibility,layout')
  .option('-o, --output <file>', 'Output file')
  .action(async (options) => {
    const spinner = ora('Generating report...').start();
    try {
      const nb = new UISentinel({
        projectPath: options.project,
        routes: options.routes.split(','),
      });
      await nb.start();
      const report = await nb.agentReport(options.focus.split(','));
      spinner.succeed('Report generated!');
      console.log('\n' + report);
      if (options.output) {
        fs.writeFileSync(options.output, report);
        console.log(chalk.gray(`\nSaved to \${options.output}`));
      }
      await nb.close();
    } catch (error: any) {
      spinner.fail('Report generation failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Advanced capture commands
program
  .command('element')
  .description('Capture a specific element')
  .requiredOption('-u, --url <url>', 'URL to visit')
  .requiredOption('-s, --selector <selector>', 'CSS selector of element to capture')
  .option('-p, --padding <px>', 'Padding around element', '0')
  .option('-n, --name <name>', 'Output filename (without extension)')
  .option('-o, --output <dir>', 'Output directory', './uisentinel-output')
  .option('--scroll', 'Scroll element into view', true)
  .option('--viewport <viewport>', 'Viewport preset', 'desktop')
  .action(async (options) => {
    const spinner = ora('Capturing element...').start();
    try {
      const nb = new UISentinel({
        output: { directory: options.output, format: 'json' },
        headless: true,
      });
      await nb.start();
      
      const page = await nb.getBrowserEngine().createPage(options.url, options.viewport);
      const advCapture = nb.getBrowserEngine().getAdvancedCapture(page);
      
      const screenshotPath = await advCapture.captureElement({
        selector: options.selector,
        padding: parseInt(options.padding),
        scrollIntoView: options.scroll,
        path: options.name ? `${options.name}.png` : undefined,
      });
      
      spinner.succeed('Element captured!');
      console.log(chalk.green(`\n📸 Screenshot: ${screenshotPath}`));
      console.log(chalk.gray(`   Element: ${options.selector}`));
      
      await page.close();
      await nb.close();
    } catch (error: any) {
      spinner.fail('Element capture failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('clip')
  .description('Capture a specific rectangular region')
  .requiredOption('-u, --url <url>', 'URL to visit')
  .requiredOption('-x <pixels>', 'X coordinate')
  .requiredOption('-y <pixels>', 'Y coordinate')
  .requiredOption('-w, --width <pixels>', 'Width')
  .requiredOption('--height <pixels>', 'Height')
  .option('-n, --name <name>', 'Output filename (without extension)')
  .option('-o, --output <dir>', 'Output directory', './uisentinel-output')
  .option('--viewport <viewport>', 'Viewport preset', 'desktop')
  .action(async (options) => {
    const spinner = ora('Capturing region...').start();
    try {
      const nb = new UISentinel({
        output: { directory: options.output, format: 'json' },
        headless: true,
      });
      await nb.start();
      
      const page = await nb.getBrowserEngine().createPage(options.url, options.viewport);
      const advCapture = nb.getBrowserEngine().getAdvancedCapture(page);
      
      const screenshotPath = await advCapture.captureClip({
        x: parseInt(options.x),
        y: parseInt(options.y),
        width: parseInt(options.width),
        height: parseInt(options.height),
        path: options.name ? `${options.name}.png` : undefined,
      });
      
      spinner.succeed('Region captured!');
      console.log(chalk.green(`\n📸 Screenshot: ${screenshotPath}`));
      console.log(chalk.gray(`   Region: ${options.x},${options.y} ${options.width}x${options.height}`));
      
      await page.close();
      await nb.close();
    } catch (error: any) {
      spinner.fail('Region capture failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('zoom')
  .description('Capture with zoom applied')
  .requiredOption('-u, --url <url>', 'URL to visit')
  .requiredOption('-z, --zoom <level>', 'Zoom level (e.g., 0.5, 2, 1.5)')
  .option('-n, --name <name>', 'Output filename (without extension)')
  .option('-o, --output <dir>', 'Output directory', './uisentinel-output')
  .option('--full-page', 'Capture full page', false)
  .option('--viewport <viewport>', 'Viewport preset', 'desktop')
  .action(async (options) => {
    const spinner = ora(`Capturing with ${options.zoom}x zoom...`).start();
    try {
      const nb = new UISentinel({
        output: { directory: options.output, format: 'json' },
        headless: true,
      });
      await nb.start();
      
      const page = await nb.getBrowserEngine().createPage(options.url, options.viewport);
      const advCapture = nb.getBrowserEngine().getAdvancedCapture(page);
      
      const screenshotPath = await advCapture.captureWithZoom({
        zoom: parseFloat(options.zoom),
        fullPage: options.fullPage,
        path: options.name ? `${options.name}.png` : undefined,
      });
      
      spinner.succeed('Zoomed capture complete!');
      console.log(chalk.green(`\n📸 Screenshot: ${screenshotPath}`));
      console.log(chalk.gray(`   Zoom: ${options.zoom}x`));
      
      await page.close();
      await nb.close();
    } catch (error: any) {
      spinner.fail('Zoom capture failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('element-zoom')
  .description('Capture element with zoom applied')
  .requiredOption('-u, --url <url>', 'URL to visit')
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .requiredOption('-z, --zoom <level>', 'Zoom level (e.g., 2, 1.5)')
  .option('-p, --padding <px>', 'Padding around element', '0')
  .option('-n, --name <name>', 'Output filename (without extension)')
  .option('-o, --output <dir>', 'Output directory', './uisentinel-output')
  .option('--scroll', 'Scroll into view', true)
  .option('--viewport <viewport>', 'Viewport preset', 'desktop')
  .action(async (options) => {
    const spinner = ora(`Capturing element with ${options.zoom}x zoom...`).start();
    try {
      const nb = new UISentinel({
        output: { directory: options.output, format: 'json' },
        headless: true,
      });
      await nb.start();
      
      const page = await nb.getBrowserEngine().createPage(options.url, options.viewport);
      const advCapture = nb.getBrowserEngine().getAdvancedCapture(page);
      
      const screenshotPath = await advCapture.captureElementWithZoom({
        selector: options.selector,
        zoom: parseFloat(options.zoom),
        padding: parseInt(options.padding),
        scrollIntoView: options.scroll,
        path: options.name ? `${options.name}.png` : undefined,
      });
      
      spinner.succeed('Element zoom capture complete!');
      console.log(chalk.green(`\n📸 Screenshot: ${screenshotPath}`));
      console.log(chalk.gray(`   Element: ${options.selector}`));
      console.log(chalk.gray(`   Zoom: ${options.zoom}x`));
      
      await page.close();
      await nb.close();
    } catch (error: any) {
      spinner.fail('Element zoom capture failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('region-zoom')
  .description('Capture region with zoom applied')
  .requiredOption('-u, --url <url>', 'URL to visit')
  .requiredOption('-x <pixels>', 'X coordinate')
  .requiredOption('-y <pixels>', 'Y coordinate')
  .requiredOption('-w, --width <pixels>', 'Width')
  .requiredOption('--height <pixels>', 'Height')
  .requiredOption('-z, --zoom <level>', 'Zoom level (e.g., 2, 1.5)')
  .option('-n, --name <name>', 'Output filename (without extension)')
  .option('-o, --output <dir>', 'Output directory', './uisentinel-output')
  .option('--viewport <viewport>', 'Viewport preset', 'desktop')
  .action(async (options) => {
    const spinner = ora(`Capturing region with ${options.zoom}x zoom...`).start();
    try {
      const nb = new UISentinel({
        output: { directory: options.output, format: 'json' },
        headless: true,
      });
      await nb.start();
      
      const page = await nb.getBrowserEngine().createPage(options.url, options.viewport);
      const advCapture = nb.getBrowserEngine().getAdvancedCapture(page);
      
      const screenshotPath = await advCapture.captureRegionWithZoom({
        x: parseInt(options.x),
        y: parseInt(options.y),
        width: parseInt(options.width),
        height: parseInt(options.height),
        zoom: parseFloat(options.zoom),
        path: options.name ? `${options.name}.png` : undefined,
      });
      
      spinner.succeed('Region zoom capture complete!');
      console.log(chalk.green(`\n📸 Screenshot: ${screenshotPath}`));
      console.log(chalk.gray(`   Region: ${options.x},${options.y} ${options.width}x${options.height}`));
      console.log(chalk.gray(`   Zoom: ${options.zoom}x`));
      
      await page.close();
      await nb.close();
    } catch (error: any) {
      spinner.fail('Region zoom capture failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('highlight')
  .description('Capture element with highlight')
  .requiredOption('-u, --url <url>', 'URL to visit')
  .requiredOption('-s, --selector <selector>', 'CSS selector to highlight')
  .option('-c, --color <color>', 'Highlight color', '#ff0000')
  .option('-w, --width <px>', 'Highlight width', '3')
  .option('-n, --name <name>', 'Output filename (without extension)')
  .option('-o, --output <dir>', 'Output directory', './uisentinel-output')
  .option('--viewport <viewport>', 'Viewport preset', 'desktop')
  .action(async (options) => {
    const spinner = ora('Capturing with highlight...').start();
    try {
      const nb = new UISentinel({
        output: { directory: options.output, format: 'json' },
        headless: true,
      });
      await nb.start();
      
      const page = await nb.getBrowserEngine().createPage(options.url, options.viewport);
      const advCapture = nb.getBrowserEngine().getAdvancedCapture(page);
      
      const screenshotPath = await advCapture.captureWithHighlight({
        selector: options.selector,
        highlightColor: options.color,
        highlightWidth: parseInt(options.width),
        path: options.name ? `${options.name}.png` : undefined,
      });
      
      spinner.succeed('Highlighted capture complete!');
      console.log(chalk.green(`\n📸 Screenshot: ${screenshotPath}`));
      console.log(chalk.gray(`   Highlighted: ${options.selector}`));
      
      await page.close();
      await nb.close();
    } catch (error: any) {
      spinner.fail('Highlight capture failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('before-after')
  .description('Capture element before and after interaction')
  .requiredOption('-u, --url <url>', 'URL to visit')
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .requiredOption('-a, --action <action>', 'Action: hover, focus, or click')
  .option('-n, --name <name>', 'Base name for output files')
  .option('-o, --output <dir>', 'Output directory', './uisentinel-output')
  .option('--viewport <viewport>', 'Viewport preset', 'desktop')
  .action(async (options) => {
    const spinner = ora('Capturing before/after states...').start();
    try {
      if (!['hover', 'focus', 'click'].includes(options.action)) {
        throw new Error('Action must be: hover, focus, or click');
      }

      const nb = new UISentinel({
        output: { directory: options.output, format: 'json' },
        headless: true,
      });
      await nb.start();
      
      const page = await nb.getBrowserEngine().createPage(options.url, options.viewport);
      const advCapture = nb.getBrowserEngine().getAdvancedCapture(page);
      
      const [beforePath, afterPath] = await advCapture.captureBeforeAfter({
        selector: options.selector,
        action: options.action,
        beforePath: options.name ? `${options.name}_before.png` : undefined,
        afterPath: options.name ? `${options.name}_after.png` : undefined,
      });
      
      spinner.succeed('Before/after capture complete!');
      console.log(chalk.green('\n📸 Screenshots:'));
      console.log(chalk.gray(`   Before: ${beforePath}`));
      console.log(chalk.gray(`   After:  ${afterPath}`));
      console.log(chalk.gray(`   Action: ${options.action} on ${options.selector}`));
      
      await page.close();
      await nb.close();
    } catch (error: any) {
      spinner.fail('Before/after capture failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Extension-based inspection commands
program
  .command('inspect-element')
  .description('Comprehensive element inspection with DevTools-style annotations')
  .requiredOption('-u, --url <url>', 'URL to visit')
  .requiredOption('-s, --selector <selector>', 'CSS selector of element to inspect')
  .option('-v, --viewport <viewport>', 'Viewport preset (mobile|tablet|desktop)', 'desktop')
  .option('--overlay', 'Show overlay on element', true)
  .option('--screenshot', 'Capture full-page screenshot', true)
  .option('--element-screenshot', 'Capture element screenshot', true)
  .option('--zoom-screenshot', 'Capture zoomed element screenshot', false)
  .option('--zoom-level <level>', 'Zoom level for zoomed screenshot', '2')
  .option('--include-parent', 'Include parent element info', true)
  .option('--include-children', 'Include children elements info', true)
  .option('--computed-styles', 'Include computed styles', true)
  .option('--attributes', 'Include element attributes', true)
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory', './mcp-output')
  .action(async (options) => {
    const spinner = ora('Inspecting element...').start();
    try {
      const { handleInspectElement } = await import('./mcp/handlers');

      const result = await handleInspectElement({
        url: options.url,
        selector: options.selector,
        viewport: options.viewport,
        showOverlay: options.overlay,
        captureScreenshot: options.screenshot,
        captureElementScreenshot: options.elementScreenshot,
        captureZoomedScreenshot: options.zoomScreenshot,
        zoomLevel: parseFloat(options.zoomLevel),
        includeParent: options.includeParent,
        includeChildren: options.includeChildren,
        includeComputedStyles: options.computedStyles,
        includeAttributes: options.attributes,
        expectations: options.expectations,
      });

      if (!result.success) {
        throw new Error(result.error || 'Inspection failed');
      }

      spinner.succeed('Element inspection complete!');

      console.log(chalk.bold('\n🔍 Element Inspection Results:\n'));
      console.log(chalk.cyan(`Tag: ${result.data?.element?.tagName}`));
      console.log(chalk.cyan(`Selector: ${result.data?.selector}`));

      if (result.data?.element?.rect) {
        const rect = result.data.element.rect;
        console.log(chalk.cyan(`Dimensions: ${Math.round(rect.width)}px × ${Math.round(rect.height)}px`));
        console.log(chalk.cyan(`Position: (${Math.round(rect.x)}, ${Math.round(rect.y)})`));
      }

      if (result.files?.screenshots && result.files.screenshots.length > 0) {
        console.log(chalk.bold('\n📸 Screenshots:'));
        result.files.screenshots.forEach((file: string) => {
          const name = path.basename(file);
          console.log(chalk.gray(`  ${name}`));
        });
      }

      if (result.files?.json && result.files.json.length > 0) {
        console.log(chalk.bold('\n📄 Metadata:'));
        result.files.json.forEach((file: string) => {
          console.log(chalk.gray(`  ${file}`));
        });
      }

    } catch (error: any) {
      spinner.fail('Element inspection failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('inspect-multiple')
  .description('Compare multiple elements side-by-side')
  .requiredOption('-u, --url <url>', 'URL to visit')
  .requiredOption('-s, --selectors <selectors>', 'Comma-separated CSS selectors')
  .option('-v, --viewport <viewport>', 'Viewport preset', 'desktop')
  .option('--screenshots', 'Capture screenshots of each element', true)
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory', './mcp-output')
  .action(async (options) => {
    const spinner = ora('Inspecting multiple elements...').start();
    try {
      const { handleInspectMultiple } = await import('./mcp/handlers');

      const selectors = options.selectors.split(',').map((s: string) => s.trim());

      const result = await handleInspectMultiple({
        url: options.url,
        selectors,
        viewport: options.viewport,
        captureScreenshots: options.screenshots,
        expectations: options.expectations,
      });

      if (!result.success) {
        throw new Error(result.error || 'Multi-inspection failed');
      }

      spinner.succeed('Multiple elements inspected!');

      console.log(chalk.bold('\n🔍 Multi-Element Inspection:\n'));
      console.log(chalk.cyan(`Elements inspected: ${selectors.length}`));

      if (result.files?.json && result.files.json.length > 0) {
        console.log(chalk.bold('\n📄 Summary report:'));
        result.files.json.forEach((file: string) => {
          console.log(chalk.gray(`  ${file}`));
        });
      }

    } catch (error: any) {
      spinner.fail('Multi-element inspection failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('inspect-with-action')
  .description('Inspect element before and after interaction')
  .requiredOption('-u, --url <url>', 'URL to visit')
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .requiredOption('-a, --action <action>', 'Action: click, hover, or focus')
  .option('-v, --viewport <viewport>', 'Viewport preset', 'desktop')
  .option('--delay <ms>', 'Capture delay after action (ms)', '500')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory', './mcp-output')
  .action(async (options) => {
    const spinner = ora('Inspecting with action...').start();
    try {
      if (!['click', 'hover', 'focus'].includes(options.action)) {
        throw new Error('Action must be: click, hover, or focus');
      }

      const { handleInspectWithAction } = await import('./mcp/handlers');

      const result = await handleInspectWithAction({
        url: options.url,
        selector: options.selector,
        action: options.action,
        viewport: options.viewport,
        captureDelay: parseInt(options.delay),
        expectations: options.expectations,
      });

      if (!result.success) {
        throw new Error(result.error || 'Action inspection failed');
      }

      spinner.succeed('Interaction inspection complete!');

      console.log(chalk.bold('\n🔍 Before/After Inspection:\n'));
      console.log(chalk.cyan(`Element: ${result.data?.selector}`));
      console.log(chalk.cyan(`Action: ${result.data?.action}`));

      if (result.files?.screenshots && result.files.screenshots.length > 0) {
        console.log(chalk.bold('\n📸 Screenshots:'));
        result.files.screenshots.forEach((file: string) => {
          const name = path.basename(file);
          console.log(chalk.gray(`  ${name}`));
        });
      }

    } catch (error: any) {
      spinner.fail('Action inspection failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('check-accessibility')
  .description('Check WCAG accessibility compliance')
  .requiredOption('-u, --url <url>', 'URL to check')
  .option('-v, --viewport <viewport>', 'Viewport preset', 'desktop')
  .option('--show-violations', 'Show violations on page', true)
  .option('--highlight', 'Highlight accessibility issues', true)
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory', './mcp-output')
  .action(async (options) => {
    const spinner = ora('Checking accessibility...').start();
    try {
      const { handleCheckAccessibility } = await import('./mcp/handlers');

      const result = await handleCheckAccessibility({
        url: options.url,
        viewport: options.viewport,
        showViolations: options.showViolations,
        highlightIssues: options.highlight,
        expectations: options.expectations,
      });

      if (!result.success) {
        throw new Error(result.error || 'Accessibility check failed');
      }

      spinner.succeed('Accessibility check complete!');

      console.log(chalk.bold('\n♿ Accessibility Report:\n'));

      if (result.data?.score !== undefined) {
        const scoreColor = result.data.score >= 90 ? chalk.green :
          result.data.score >= 70 ? chalk.yellow : chalk.red;
        console.log(scoreColor(`Score: ${result.data.score}/100`));
      }

      if (result.data?.summary) {
        const s = result.data.summary;
        console.log(chalk.bold('\n📊 Violation Summary:'));
        console.log(chalk.gray(`  Total: ${s.total}`));
        if (s.critical > 0) console.log(chalk.red(`  Critical: ${s.critical}`));
        if (s.serious > 0) console.log(chalk.red(`  Serious: ${s.serious}`));
        if (s.moderate > 0) console.log(chalk.yellow(`  Moderate: ${s.moderate}`));
        if (s.minor > 0) console.log(chalk.gray(`  Minor: ${s.minor}`));
      }

      if (result.data?.violations && result.data.violations.length > 0) {
        console.log(chalk.bold('\n⚠️  Top Issues:'));
        result.data.violations.slice(0, 5).forEach((v: any) => {
          console.log(chalk.yellow(`  • ${v.rule}: ${v.description}`));
          console.log(chalk.gray(`    ${v.affectedElements.length} element(s) affected`));
        });

        if (result.data.violations.length > 5) {
          console.log(chalk.gray(`  ... and ${result.data.violations.length - 5} more issues`));
        }
      }

      if (result.files?.screenshots && result.files.screenshots.length > 0) {
        console.log(chalk.bold('\n📸 Screenshot saved:'));
        console.log(chalk.gray(`  ${result.files.screenshots[0]}`));
      }

    } catch (error: any) {
      spinner.fail('Accessibility check failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('check-contrast')
  .description('Check color contrast ratios (WCAG)')
  .requiredOption('-u, --url <url>', 'URL to check')
  .option('-v, --viewport <viewport>', 'Viewport preset', 'desktop')
  .option('--min-aa <ratio>', 'Minimum AA contrast ratio', '4.5')
  .option('--min-aaa <ratio>', 'Minimum AAA contrast ratio', '7')
  .option('--highlight', 'Highlight contrast issues', true)
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory', './mcp-output')
  .action(async (options) => {
    const spinner = ora('Checking contrast...').start();
    try {
      const { handleCheckContrast } = await import('./mcp/handlers');

      const result = await handleCheckContrast({
        url: options.url,
        viewport: options.viewport,
        minRatioAA: parseFloat(options.minAa),
        minRatioAAA: parseFloat(options.minAaa),
        highlightIssues: options.highlight,
        expectations: options.expectations,
      });

      if (!result.success) {
        throw new Error(result.error || 'Contrast check failed');
      }

      spinner.succeed('Contrast check complete!');

      console.log(chalk.bold('\n🎨 Contrast Analysis:\n'));

      if (result.data?.summary) {
        console.log(chalk.cyan(`Total elements checked: ${result.data.summary.total}`));
        console.log(chalk.green(`Passing AA: ${result.data.summary.passAA}`));
        console.log(chalk.green(`Passing AAA: ${result.data.summary.passAAA}`));
        console.log(chalk.red(`Failing: ${result.data.summary.failing}`));
      }

      if (result.data?.issues && Array.isArray(result.data.issues) && result.data.issues.length > 0) {
        console.log(chalk.bold('\n⚠️  Contrast Issues:'));
        result.data.issues.slice(0, 5).forEach((issue: any) => {
          console.log(chalk.yellow(`  • ${issue.selector || issue.element || 'Unknown element'}`));
          const ratio = typeof issue.ratio === 'number' ? issue.ratio.toFixed(2) : issue.ratio || 'N/A';
          const required = issue.required || 'N/A';
          console.log(chalk.gray(`    Ratio: ${ratio} (needs ${required})`));
        });

        if (result.data.issues.length > 5) {
          console.log(chalk.gray(`  ... and ${result.data.issues.length - 5} more issues`));
        }
      } else if (result.data) {
        console.log(chalk.gray('  No contrast issues found or unexpected data format'));
      }

      if (result.files?.screenshots && result.files.screenshots.length > 0) {
        console.log(chalk.bold('\n📸 Screenshot saved:'));
        console.log(chalk.gray(`  ${result.files.screenshots[0]}`));
      }

    } catch (error: any) {
      spinner.fail('Contrast check failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('measure-element')
  .description('Measure element dimensions and box model')
  .requiredOption('-u, --url <url>', 'URL to visit')
  .requiredOption('-s, --selector <selector>', 'CSS selector to measure')
  .option('-v, --viewport <viewport>', 'Viewport preset', 'desktop')
  .option('--dimensions', 'Show dimensions', true)
  .option('--margin', 'Show margin', true)
  .option('--padding', 'Show padding', true)
  .option('--border', 'Show border', true)
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory', './mcp-output')
  .action(async (options) => {
    const spinner = ora('Measuring element...').start();
    try {
      const { handleMeasureElement } = await import('./mcp/handlers');

      const result = await handleMeasureElement({
        url: options.url,
        selector: options.selector,
        viewport: options.viewport,
        showDimensions: options.dimensions,
        showMargin: options.margin,
        showPadding: options.padding,
        showBorder: options.border,
        expectations: options.expectations,
      });

      if (!result.success) {
        throw new Error(result.error || 'Element measurement failed');
      }

      spinner.succeed('Element measured!');

      console.log(chalk.bold('\n📏 Element Measurements:\n'));

      if (result.data?.dimensions) {
        const d = result.data.dimensions;
        console.log(chalk.cyan(`Width: ${d.width}px`));
        console.log(chalk.cyan(`Height: ${d.height}px`));
      }

      if (result.data?.boxModel) {
        console.log(chalk.bold('\n📦 Box Model:'));
        const box = result.data.boxModel;
        if (box.margin) console.log(chalk.gray(`  Margin: ${JSON.stringify(box.margin)}`));
        if (box.padding) console.log(chalk.gray(`  Padding: ${JSON.stringify(box.padding)}`));
        if (box.border) console.log(chalk.gray(`  Border: ${JSON.stringify(box.border)}`));
      }

      if (result.files?.screenshots && result.files.screenshots.length > 0) {
        console.log(chalk.bold('\n📸 Screenshot saved:'));
        console.log(chalk.gray(`  ${result.files.screenshots[0]}`));
      }

    } catch (error: any) {
      spinner.fail('Element measurement failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('show-grid')
  .description('Show layout grid overlay')
  .requiredOption('-u, --url <url>', 'URL to visit')
  .option('-v, --viewport <viewport>', 'Viewport preset', 'desktop')
  .option('-t, --type <type>', 'Grid type: 8px, 12-column, alignment-guides', '8px')
  .option('--size <pixels>', 'Grid size in pixels (for pixel grid)', '8')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory', './mcp-output')
  .action(async (options) => {
    const spinner = ora('Showing grid...').start();
    try {
      const { handleShowGrid } = await import('./mcp/handlers');

      const result = await handleShowGrid({
        url: options.url,
        viewport: options.viewport,
        gridType: options.type,
        gridSize: parseInt(options.size),
        expectations: options.expectations,
      });

      if (!result.success) {
        throw new Error(result.error || 'Grid display failed');
      }

      spinner.succeed('Grid displayed!');

      console.log(chalk.bold('\n🔲 Layout Grid:\n'));
      console.log(chalk.cyan(`Grid Type: ${options.type}`));

      if (options.type === '8px') {
        console.log(chalk.cyan(`Grid Size: ${options.size}px`));
      }

      if (result.files?.screenshots && result.files.screenshots.length > 0) {
        console.log(chalk.bold('\n📸 Screenshot saved:'));
        console.log(chalk.gray(`  ${result.files.screenshots[0]}`));
      }

    } catch (error: any) {
      spinner.fail('Grid display failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('detect-components')
  .description('Detect UI components on the page')
  .requiredOption('-u, --url <url>', 'URL to analyze')
  .option('-v, --viewport <viewport>', 'Viewport preset', 'desktop')
  .option('--position', 'Include component positions', false)
  .option('--highlight', 'Highlight detected components', false)
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory', './mcp-output')
  .action(async (options) => {
    const spinner = ora('Detecting components...').start();
    try {
      const { handleDetectComponents } = await import('./mcp/handlers');

      const result = await handleDetectComponents({
        url: options.url,
        viewport: options.viewport,
        includePosition: options.position,
        highlightComponents: options.highlight,
        expectations: options.expectations,
      });

      if (!result.success) {
        throw new Error(result.error || 'Component detection failed');
      }

      spinner.succeed('Components detected!');

      console.log(chalk.bold('\n🧩 Component Detection:\n'));

      if (result.data?.components && Array.isArray(result.data.components)) {
        console.log(chalk.cyan(`Components found: ${result.data.components.length}`));

        if (result.data.components.length > 0) {
          // Group by type
          const byType: Record<string, number> = {};
          result.data.components.forEach((c: any) => {
            byType[c.type] = (byType[c.type] || 0) + 1;
          });

          console.log(chalk.bold('\n📊 Component Types:'));
          Object.entries(byType).forEach(([type, count]) => {
            console.log(chalk.gray(`  ${type}: ${count}`));
          });
        } else {
          console.log(chalk.gray('  No components detected'));
        }
      } else if (result.data) {
        console.log(chalk.yellow('⚠️  Unexpected data format:'));
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        console.log(chalk.gray('  No component data returned'));
      }

      if (result.files?.screenshots && result.files.screenshots.length > 0) {
        console.log(chalk.bold('\n📸 Screenshot saved:'));
        console.log(chalk.gray(`  ${result.files.screenshots[0]}`));
      }

    } catch (error: any) {
      spinner.fail('Component detection failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('check-breakpoints')
  .description('Test responsive design across breakpoints')
  .requiredOption('-u, --url <url>', 'URL to test')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory', './mcp-output')
  .action(async (options) => {
    const spinner = ora('Testing breakpoints...').start();
    try {
      const { handleCheckBreakpoints } = await import('./mcp/handlers');

      const result = await handleCheckBreakpoints({
        url: options.url,
        expectations: options.expectations,
      });

      if (!result.success) {
        throw new Error(result.error || 'Breakpoint check failed');
      }

      spinner.succeed('Breakpoint testing complete!');

      console.log(chalk.bold('\n📱 Responsive Breakpoints:\n'));

      if (result.data?.breakpoints) {
        result.data.breakpoints.forEach((bp: any) => {
          console.log(chalk.cyan(`${bp.viewport}: ${path.basename(bp.screenshot)}`));
        });
      }

      if (result.files?.screenshots && result.files.screenshots.length > 0) {
        console.log(chalk.bold(`\n📸 ${result.files.screenshots.length} screenshots saved to:`));
        console.log(chalk.gray(`  ${path.dirname(result.files.screenshots[0])}`));
      }

    } catch (error: any) {
      spinner.fail('Breakpoint check failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('analyze-layout')
  .description('Analyze page layout for common issues (overflows, invisible text, positioning)')
  .requiredOption('-u, --url <url>', 'URL to analyze')
  .option('-v, --viewport <viewport>', 'Viewport size (mobile|tablet|desktop)', 'desktop')
  .option('-o, --output <dir>', 'Output directory', './uisentinel-output')
  .action(async (options) => {
    const spinner = ora('Analyzing layout...').start();

    const sentinel = new UISentinel({
      headless: true,
      output: { directory: options.output, format: 'json' },
    });

    try {
      await sentinel.start();
      const engine = sentinel.getBrowserEngine();

      spinner.text = `Loading ${options.url}...`;
      const page = await engine.createPage(options.url, options.viewport as ViewportPreset);
      await page.waitForLoadState('networkidle');

      spinner.text = 'Running layout analysis...';
      const result = await engine.capture({
        url: options.url,
        viewports: [options.viewport],
        layoutAnalysis: true,
        screenshot: true,
      });

      if (!result.layout) {
        throw new Error('Layout analysis failed');
      }

      await page.close();
      await sentinel.close();

      spinner.succeed('Layout analysis complete!');

      console.log(chalk.bold('\n📊 Layout Analysis Results:\n'));
      console.log(chalk.cyan(`Total Elements: ${result.layout.elements.length}`));
      console.log(chalk.yellow(`Overflows Detected: ${result.layout.overflows.length}`));
      console.log(chalk.red(`Invisible Text Issues: ${result.layout.invisibleText.length}`));

      if (result.layout.overflows.length > 0) {
        console.log(chalk.bold('\n⚠️  Overflow Issues:'));
        result.layout.overflows.forEach((overflow: any) => {
          console.log(`  - ${overflow.element}: X=${overflow.overflowX}px, Y=${overflow.overflowY}px`);
        });
      }

      if (result.layout.invisibleText.length > 0) {
        console.log(chalk.bold('\n👁️  Invisible Text:'));
        result.layout.invisibleText.forEach((issue: any) => {
          console.log(`  - ${issue.element}: ${issue.reason}`);
        });
      }

      const outputFile = path.join(options.output, 'layout-analysis.json');
      fs.writeFileSync(outputFile, JSON.stringify(result.layout, null, 2));
      console.log(chalk.gray(`\n📄 Full report saved: ${outputFile}`));

    } catch (error) {
      spinner.fail('Layout analysis failed');
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('detect-project')
  .description('Detect project framework and configuration')
  .option('-p, --project <path>', 'Project path', '.')
  .action(async (options) => {
    const spinner = ora('Detecting project...').start();

    try {
      const { FrameworkDetector } = await import('./framework-detector');
      const detector = new FrameworkDetector(options.project);
      const result = await detector.detect();
      const packageManager = detector.getPackageManager();

      spinner.succeed('Project detected!');

      console.log(chalk.bold('\n🔍 Project Detection Results:\n'));
      console.log(chalk.cyan(`Framework: ${result.framework}`));
      console.log(chalk.cyan(`Package Manager: ${packageManager}`));
      console.log(chalk.cyan(`Dev Command: ${result.command}`));
      console.log(chalk.cyan(`Default Port: ${result.port}`));
      console.log(chalk.cyan(`Confidence: ${result.confidence}%`));

      if (result.configFile) {
        console.log(chalk.cyan(`Config File: ${result.configFile}`));
      }

      if (result.lockFile) {
        console.log(chalk.cyan(`Lock File: ${result.lockFile}`));
      }

      console.log(chalk.bold('\n💡 Suggested Usage:\n'));
      console.log(chalk.gray(`  ${packageManager} ${result.command.startsWith('npm') ? 'run' : ''} ${result.command.replace('npm run ', '')}`));
      console.log(chalk.gray(`  uisentinel capture --url http://localhost:${result.port}\n`));

    } catch (error) {
      spinner.fail('Project detection failed');
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize uisentinel configuration')
  .action(() => {
    const configPath = path.join(process.cwd(), 'uisentinel.config.js');
    if (fs.existsSync(configPath)) {
      console.log(chalk.yellow('Configuration file already exists'));
      return;
    }
    const template = `module.exports = {
  framework: 'auto', // or 'nextjs', 'vite', 'html'
  port: 3000,
  viewports: ['mobile', 'desktop'],
  accessibility: {
    enabled: true,
    standard: 'WCAG21AA',
    ignore: []
  },
  screenshot: {
    enabled: true,
    fullPage: true,
    format: 'png'
  },
  output: {
    directory: './uisentinel-output',
    format: 'json'
  },
  routes: ['/']
};
`;
    fs.writeFileSync(configPath, template);
    console.log(chalk.green('✓ Created uisentinel.config.js'));
  });

program.parse();

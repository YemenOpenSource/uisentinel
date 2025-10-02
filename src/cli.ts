#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { UISentinel } from './index';

const program = new Command();

program
  .name('uisentinel')
  .description('Visual validation toolkit for AI coding agents')
  .version('0.1.0');

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

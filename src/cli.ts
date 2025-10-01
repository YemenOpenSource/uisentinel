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
  .action(async (options) => {
    const spinner = ora('Initializing...').start();
    try {
      const nb = new UISentinel({
        output: { directory: options.output, format: 'json' },
        headless: !options.open,
      });
      spinner.text = 'Starting browser...';
      await nb.start();
      spinner.text = `Capturing \${options.url}...`;
      const result = await nb.capture({
        url: options.url,
        viewports: options.viewports.split(','),
        accessibility: options.a11y,
        layoutAnalysis: options.layout,
        fullPage: options.fullPage,
      });
      spinner.succeed('Capture complete!');
      console.log(chalk.bold('\n📸 Screenshots:'));
      result.screenshots.forEach(s => {
        console.log(chalk.gray(`  \${s.viewport}: \${s.path}`));
      });
      if (result.accessibility) {
        console.log(chalk.bold('\n♿ Accessibility:'));
        console.log(`  Score: \${result.accessibility.score}/100`);
        console.log(`  Violations: \${result.accessibility.violations.length}`);
      }
      if (result.suggestions.length > 0) {
        console.log(chalk.bold('\n💡 Suggestions:'));
        result.suggestions.forEach(s => {
          console.log(chalk.yellow(`  • \${s}`));
        });
      }
      const reportPath = path.join(options.output, 'report.json');
      fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
      console.log(chalk.gray(`\n📄 Report saved to \${reportPath}`));
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

#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import * as fs from 'fs';
import * as path from 'path';
import { UISentinel } from './index';
import { ViewportPreset } from './types';
import { loadConfig } from './config-loader';

const program = new Command();

/**
 * Save expectations to a markdown file for documentation
 * @param expectations - The expectations text from the user
 * @param outputDir - Directory to save the file
 * @param prefix - Filename prefix (e.g., 'fullpage', 'analyze-responsive')
 * @returns Path to the saved expectations file, or undefined if no expectations provided
 */
function saveExpectations(expectations: string | undefined, outputDir: string, prefix: string): string | undefined {
  if (!expectations) return undefined;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${prefix}-expectations-${timestamp}.md`;
  const filepath = path.join(outputDir, filename);

  // Create markdown content with metadata
  const content = `# Expectations: ${prefix}

**Date:** ${new Date().toISOString()}
**Command:** ${prefix}

## Expectations

${expectations}

---

*This file documents what the AI agent expected to see/validate when running this command.*
*It serves as an audit trail for hypothesis-driven testing and debugging.*
`;

  fs.writeFileSync(filepath, content, 'utf-8');
  return filepath;
}

/**
 * Get configuration defaults from uisentinel.config.js
 * Falls back to hardcoded defaults if config not found
 */
let cachedConfig: ReturnType<typeof loadConfig> | null = null;

function getConfigDefaults() {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return {
    outputDir: cachedConfig.output?.directory || './uisentinel-output',
    headless: cachedConfig.headless ?? true,
    timeout: cachedConfig.timeout || 30000,
  };
}

// ASCII Art Banner
function showBanner() {
  console.log('');
  console.log(chalk.cyan('  ██╗   ██╗██╗    ') + chalk.magenta('███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗'));
  console.log(chalk.cyan('  ██║   ██║██║    ') + chalk.magenta('██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║'));
  console.log(chalk.cyan('  ██║   ██║██║    ') + chalk.magenta('███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║'));
  console.log(chalk.cyan('  ██║   ██║██║    ') + chalk.magenta('╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║'));
  console.log(chalk.cyan('  ╚██████╔╝██║    ') + chalk.magenta('███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗'));
  console.log(chalk.cyan('   ╚═════╝ ╚═╝    ') + chalk.magenta('╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝'));
  console.log('');
  console.log(chalk.gray('                    👁️  Visual Validation for AI Coding Agents  ✨'));
  console.log(chalk.gray('                           Screenshot · Analyze · Validate'));
  console.log('');
}

// Display banner on --help or -h
program.on('--help', () => {
  showBanner();
  console.log(chalk.bold('\n📚 Quick Examples:\n'));
  console.log(chalk.gray('  # Initialize configuration'));
  console.log(chalk.cyan('  $ uisentinel init\n'));
  console.log(chalk.gray('  # Capture full page screenshot'));
  console.log(chalk.cyan('  $ uisentinel fullpage -u http://localhost:3000 -e "baseline capture"\n'));
  console.log(chalk.gray('  # Analyze responsive design'));
  console.log(chalk.cyan('  $ uisentinel analyze-responsive -u http://localhost:3000 -v mobile\n'));
  console.log(chalk.gray('  # Check accessibility'));
  console.log(chalk.cyan('  $ uisentinel check-accessibility -u http://localhost:3000\n'));
  console.log(chalk.gray('📖 Documentation: https://github.com/mhjabreel/uisentinel\n'));
});

program
  .name('uisentinel')
  .description('👁️  Visual validation toolkit for AI coding agents')
  .version('0.2.1');

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
  .action(async () => {
    showBanner();
    const configPath = path.join(process.cwd(), 'uisentinel.config.js');
    if (fs.existsSync(configPath)) {
      console.log(chalk.yellow('⚠ Configuration file already exists'));
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: 'Do you want to overwrite it?',
        initial: false,
      });
      if (!overwrite) {
        console.log(chalk.gray('Cancelled.'));
        return;
      }
    }

    console.log(chalk.bold.cyan('\n⚙️  Configuration Setup'));
    console.log(chalk.gray('Configure default settings for screenshot capture and analysis\n'));

    const responses = await prompts([
      {
        type: 'select',
        name: 'aiAgent',
        message: 'Which AI coding agent are you using?',
        choices: [
          { title: 'Claude Code - Anthropic\'s CLI agent', value: 'claude' },
          { title: 'VS Code with GitHub Copilot', value: 'vscode' },
          { title: 'Skip - I\'ll configure manually', value: 'skip' },
        ],
        initial: 0,
      },
      {
        type: 'confirm',
        name: 'createSession',
        message: 'Initialize a design session with template files?',
        initial: true,
      },
      {
        type: (prev) => prev ? 'text' : null,
        name: 'projectName',
        message: 'Project name for this session:',
        initial: path.basename(process.cwd()),
        validate: (value) => value.length > 0 ? true : 'Project name is required',
      },
      {
        type: (prev, values) => values.createSession ? 'text' : null,
        name: 'pageName',
        message: 'Page/feature name (e.g., landing, dashboard, checkout):',
        initial: 'index',
        validate: (value) => value.length > 0 ? true : 'Page name is required',
      },
      {
        type: 'text',
        name: 'projectPath',
        message: 'Project path (leave empty for current directory):',
        initial: '.',
        validate: (value) => value.length > 0 ? true : 'Project path is required',
      },
      {
        type: 'select',
        name: 'framework',
        message: 'Framework (auto-detect or manual):',
        choices: [
          { title: 'Auto-detect', value: 'auto' },
          { title: 'Next.js', value: 'nextjs' },
          { title: 'Vite', value: 'vite' },
          { title: 'React (CRA)', value: 'react' },
          { title: 'Vue', value: 'vue' },
          { title: 'Static HTML', value: 'html' },
          { title: 'Other', value: 'other' },
        ],
        initial: 0,
      },
      {
        type: 'number',
        name: 'port',
        message: 'Default development server port:',
        initial: 3000,
        validate: (value) => value > 0 && value < 65536 ? true : 'Port must be between 1 and 65535',
      },
      {
        type: 'text',
        name: 'outputDir',
        message: 'Where should screenshots and reports be saved?',
        initial: './uisentinel-output',
        validate: (value) => value.length > 0 ? true : 'Output directory is required',
      },
      {
        type: 'multiselect',
        name: 'viewports',
        message: 'Which viewports do you want to test by default?',
        choices: [
          { title: 'Mobile (375×667px)', value: 'mobile', selected: true },
          { title: 'Tablet (768×1024px)', value: 'tablet', selected: true },
          { title: 'Desktop (1920×1080px)', value: 'desktop', selected: true },
        ],
        min: 1,
        hint: 'Space to select, Enter to confirm',
      },
      {
        type: 'select',
        name: 'a11yStandard',
        message: 'Which WCAG accessibility standard should be used?',
        choices: [
          { title: 'WCAG 2.1 AA - Recommended (4.5:1 contrast, 44px touch targets)', value: 'WCAG21AA' },
          { title: 'WCAG 2.1 AAA - Strict (7:1 contrast, enhanced requirements)', value: 'WCAG21AAA' },
        ],
        initial: 0,
      },
      {
        type: 'select',
        name: 'screenshotFormat',
        message: 'Preferred screenshot format?',
        choices: [
          { title: 'PNG - Lossless, best for UI (larger files)', value: 'png' },
          { title: 'JPEG - Compressed, smaller files', value: 'jpeg' },
        ],
        initial: 0,
      },
      {
        type: 'confirm',
        name: 'fullPage',
        message: 'Capture full page by default (scroll to end)?',
        initial: true,
      },
      {
        type: 'confirm',
        name: 'headless',
        message: 'Run browser in headless mode (no visible window)?',
        initial: true,
      },
      {
        type: 'number',
        name: 'timeout',
        message: 'Default timeout for page operations (milliseconds):',
        initial: 30000,
        validate: (value) => value > 0 ? true : 'Timeout must be greater than 0',
      },
      {
        type: 'list',
        name: 'routes',
        message: 'Routes to test (comma-separated, e.g. /, /about, /contact):',
        initial: '/',
        separator: ',',
      },
    ]);

    // Handle Ctrl+C cancellation
    if (!responses.outputDir) {
      console.log(chalk.gray('\nCancelled.'));
      return;
    }

    const config = {
      projectPath: responses.projectPath === '.' ? undefined : responses.projectPath,
      framework: responses.framework,
      port: responses.port,
      host: `http://localhost:${responses.port}`,
      headless: responses.headless,
      viewports: responses.viewports,
      accessibility: {
        enabled: true,
        standard: responses.a11yStandard,
        ignore: [],
      },
      screenshot: {
        enabled: true,
        fullPage: responses.fullPage,
        format: responses.screenshotFormat,
      },
      output: {
        directory: responses.outputDir,
        format: 'json',
      },
      timeout: responses.timeout,
      routes: responses.routes,
    };

    const template = `module.exports = ${JSON.stringify(config, null, 2)};
`;

    fs.writeFileSync(configPath, template);

    // Initialize design session if requested
    if (responses.createSession) {
      const sessionDir = path.join(process.cwd(), '.uisentinel', 'sessions', responses.projectName, responses.pageName);
      // Templates are bundled with the package in dist/templates
      const templateDir = path.join(__dirname, 'templates');

      console.log(chalk.cyan('\n📁 Initializing design session...'));

      // Create session directory structure
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      // Create screenshot directories
      const screenshotDirs = [
        path.join(sessionDir, 'screenshots', 'baseline'),
        path.join(sessionDir, 'screenshots', 'iterations'),
        path.join(sessionDir, 'screenshots', 'views'),
      ];
      screenshotDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });

      // Copy and customize templates
      const templateFiles = [
        '02-memory-template.md',
        '03-design-spec-template.md',
        '04-design-analysis-template.md',
        '05-design-tasks-template.md',
      ];

      const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const date = new Date().toISOString().slice(0, 10);

      templateFiles.forEach(templateFile => {
        const templatePath = path.join(templateDir, templateFile);
        // Remove number prefix and -template suffix: 02-memory-template.md → memory.md
        const targetName = templateFile.replace(/^\d+-/, '').replace('-template', '');
        const targetPath = path.join(sessionDir, targetName);

        if (fs.existsSync(templatePath)) {
          let content = fs.readFileSync(templatePath, 'utf-8');

          // Replace placeholders
          content = content.replace(/\[YYYY-MM-DD HH:MM\]/g, timestamp);
          content = content.replace(/\[YYYY-MM-DD\]/g, date);
          content = content.replace(/\[Project Name\]/g, responses.projectName);
          content = content.replace(/\[What we're designing\]/g, `${responses.pageName} page`);

          fs.writeFileSync(targetPath, content);
        }
      });

      // Create README for the session
      const readmeContent = `# Design Session: ${responses.projectName} / ${responses.pageName}

**Started:** ${timestamp}
**Status:** Active

## Session Files

- \`memory.md\` - Session context and decisions
- \`design-spec.md\` - Design requirements and specifications
- \`design-analysis.md\` - Current state analysis and findings
- \`design-tasks.md\` - Prioritized action items

## Screenshots

- \`screenshots/baseline/\` - Initial state captures
- \`screenshots/iterations/\` - Progress captures
- \`screenshots/views/\` - View-by-view captures

## Quick Start

1. Read the AI agent instructions: \`.uisentinel/templates/01-ai-web-designer-instructions.md\`
2. Fill out \`design-spec.md\` based on user requirements
3. Capture baseline screenshots
4. Run analysis and document in \`design-analysis.md\`
5. Create tasks in \`design-tasks.md\`
6. Start implementing and updating files as you progress

## AI Agent Commands

\`\`\`bash
# Capture full page across devices
uisentinel fullpage-multi -u <url> -d desktop,tablet,mobile -e "baseline capture"

# Capture view-by-view
uisentinel views -u <url> -d mobile -e "mobile view analysis"

# Inspect specific element
uisentinel inspect-element -u <url> -s ".hero-button" -e "hero CTA inspection"

# Run responsive analysis
uisentinel analyze-responsive -u <url> -v mobile -e "baseline responsive check"

# Run mobile UX analysis
uisentinel analyze-mobile-ux -u <url> -e "mobile UX baseline"

# Check accessibility
uisentinel check-accessibility -u <url> -e "WCAG AA compliance"
\`\`\`
`;

      fs.writeFileSync(path.join(sessionDir, 'README.md'), readmeContent);

      console.log(chalk.green(`✓ Session initialized at: ${sessionDir}`));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.cyan(`  1. cd ${sessionDir}`));
      console.log(chalk.cyan(`  2. Fill out design-spec.md`));
      console.log(chalk.cyan(`  3. Capture baseline screenshots`));
      console.log(chalk.cyan(`  4. Start designing!\n`));
    }

    // Copy AI agent template if needed
    if (responses.aiAgent !== 'skip') {
      // Templates are bundled with the package in dist/templates
      const templatePath = path.join(__dirname, 'templates', '01-ai-web-designer-instructions.md');

      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, 'utf-8');

        if (responses.aiAgent === 'claude') {
          const claudeDir = path.join(process.cwd(), '.claude', 'commands');
          const claudePath = path.join(claudeDir, 'uisentinel.md');

          if (!fs.existsSync(claudeDir)) {
            fs.mkdirSync(claudeDir, { recursive: true });
          }

          fs.writeFileSync(claudePath, templateContent);
          console.log(chalk.green('✓ Claude Code command installed at .claude/commands/uisentinel.md'));
        } else if (responses.aiAgent === 'vscode') {
          const vscodeDir = path.join(process.cwd(), '.github', 'prompts');
          const vscodePath = path.join(vscodeDir, 'uisentinel.prompt.md');

          if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir, { recursive: true });
          }

          const vscodeContent = `---
mode: agent
---

${templateContent}`;

          fs.writeFileSync(vscodePath, vscodeContent);
          console.log(chalk.green('✓ VS Code prompt installed at .github/prompts/uisentinel.prompt.md'));
        }
      } else {
        console.log(chalk.yellow('\n⚠ Template file not found in package'));
        console.log(chalk.gray('   Please reinstall uisentinel: npm install -g uisentinel'));
      }
    }

    // Success message with summary
    console.log(chalk.bold.green('\n✓ Configuration created successfully!\n'));
    console.log(chalk.bold('📋 Configuration Summary:\n'));

    // Create a nice table-like output
    const settings = [
      ['AI Agent', responses.aiAgent === 'claude' ? 'Claude Code' : responses.aiAgent === 'vscode' ? 'VS Code' : 'Manual'],
      ['Framework', responses.framework],
      ['Port', responses.port],
      ['Viewports', responses.viewports.join(', ')],
      ['WCAG Standard', responses.a11yStandard],
      ['Screenshot Format', responses.screenshotFormat.toUpperCase()],
      ['Full Page Capture', responses.fullPage ? 'Yes' : 'No'],
      ['Headless Mode', responses.headless ? 'Yes' : 'No'],
      ['Timeout', `${responses.timeout}ms`],
      ['Output Directory', responses.outputDir],
      ['Routes', responses.routes.join(', ')],
    ];

    settings.forEach(([key, value]) => {
      console.log(chalk.cyan(`  ${key.padEnd(20)}`), chalk.white(value));
    });

    console.log(chalk.bold('\n🚀 Quick Start:\n'));
    console.log(chalk.gray('  # Capture full page screenshot'));
    console.log(chalk.cyan(`  uisentinel fullpage -u http://localhost:${responses.port} -e "baseline capture"\n`));
    console.log(chalk.gray('  # Analyze responsive design'));
    console.log(chalk.cyan(`  uisentinel analyze-responsive -u http://localhost:${responses.port} -v mobile -e "mobile check"\n`));
    console.log(chalk.gray('  # Run accessibility check'));
    console.log(chalk.cyan(`  uisentinel check-accessibility -u http://localhost:${responses.port} -e "WCAG compliance"\n`));

    if (responses.aiAgent === 'claude') {
      console.log(chalk.bold('🤖 Claude Code Usage:\n'));
      console.log(chalk.gray('  Type in Claude Code:'));
      console.log(chalk.cyan('  @uisentinel help me analyze this page for responsive design issues\n'));
    } else if (responses.aiAgent === 'vscode') {
      console.log(chalk.bold('🤖 VS Code Usage:\n'));
      console.log(chalk.gray('  Open Command Palette (Cmd/Ctrl+Shift+P) and run:'));
      console.log(chalk.cyan('  GitHub Copilot: Run Agent Command > uisentinel\n'));
    }
  });

// AI Agent Web UI Commands
program
  .command('fullpage')
  .description('[AI Agent] Capture full page screenshot with smart scrolling')
  .requiredOption('-u, --url <url>', 'URL to capture')
  .option('-d, --device <device>', 'Device: desktop, tablet, mobile, or custom', 'desktop')
  .option('--width <pixels>', 'Custom viewport width')
  .option('--height <pixels>', 'Custom viewport height')
  .option('--scroll-delay <ms>', 'Delay between scrolls for lazy loading', '500')
  .option('--no-scroll-to-end', 'Skip scrolling to end')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-n, --name <name>', 'Output filename (without extension)')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      // Save expectations to file
      const expectationsFile = saveExpectations(options.expectations, outputDir, 'fullpage');

      spinner.text = `Loading ${options.url}...`;

      const viewport = options.width && options.height ? {
        width: parseInt(options.width),
        height: parseInt(options.height),
      } : undefined;

      const result = await sentinel.captureFullPage(options.url, {
        device: options.device,
        viewport,
        scrollToEnd: options.scrollToEnd,
        scrollDelay: parseInt(options.scrollDelay),
        outputName: options.name,
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('Full page capture complete!');

      console.log(chalk.bold('\n📸 Full Page Screenshot:\n'));
      console.log(chalk.cyan(`Device: ${result.device}`));
      console.log(chalk.cyan(`Viewport: ${result.viewport?.width}×${result.viewport?.height}px`));
      console.log(chalk.cyan(`Screenshot: ${result.screenshot}`));

      if (expectationsFile) {
        console.log(chalk.cyan(`Expectations: ${expectationsFile}`));
      }

      if (result.metExpectation) {
        console.log(chalk.bold('\n✓ Expectation Validation:'));
        console.log(result.metExpectation.met ? chalk.green('✓ Met') : chalk.red('✗ Not Met'));
        console.log(chalk.gray(`Details: ${result.metExpectation.details}`));
      }

      console.log('');
    } catch (error) {
      spinner.fail('Failed to capture screenshot');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('fullpage-multi')
  .description('[AI Agent] Capture full page screenshots across multiple devices')
  .requiredOption('-u, --url <url>', 'URL to capture')
  .option('-d, --devices <devices>', 'Comma-separated devices: desktop,tablet,mobile', 'desktop,tablet,mobile')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-n, --name <name>', 'Output directory name')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      // Save expectations to file
      const expectationsFile = saveExpectations(options.expectations, outputDir, 'fullpage-multi');

      spinner.text = `Loading ${options.url}...`;
      const devices = options.devices.split(',').map((d: string) => d.trim());

      const results = await sentinel.captureFullPageMulti(options.url, {
        devices: devices as ('desktop' | 'tablet' | 'mobile')[],
        outputName: options.name,
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('Multi-device capture complete!');

      console.log(chalk.bold('\n📸 Multi-Device Screenshots:\n'));
      if (results.results && Array.isArray(results.results)) {
        results.results.forEach((result: any) => {
          console.log(chalk.cyan(`${result.device}: ${result.viewport.width}×${result.viewport.height}px`));
          console.log(chalk.gray(`  Screenshot: ${result.screenshot}`));
          if (result.metadata) {
            console.log(chalk.gray(`  Metadata: ${result.metadata}`));
          }
        });
      }

      if (expectationsFile) {
        console.log(chalk.cyan(`\nExpectations: ${expectationsFile}`));
      }

      if (results.expectation) {
        console.log(chalk.bold('\n📝 Expectation:'));
        console.log(chalk.gray(`  "${results.expectation}"`));
      }

      console.log('');
    } catch (error) {
      spinner.fail('Failed to capture screenshots');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('views')
  .description('[AI Agent] Capture view-by-view screenshots with window-wise scrolling')
  .requiredOption('-u, --url <url>', 'URL to capture')
  .option('-d, --device <device>', 'Device: desktop, tablet, mobile, or custom', 'desktop')
  .option('--width <pixels>', 'Custom viewport width')
  .option('--height <pixels>', 'Custom viewport height')
  .option('--overlap <pixels>', 'Overlap between views in pixels', '50')
  .option('--scroll-delay <ms>', 'Delay between scrolls for lazy loading', '500')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-n, --name <name>', 'Output directory name')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      // Save expectations to file
      const expectationsFile = saveExpectations(options.expectations, outputDir, 'views');

      spinner.text = `Loading ${options.url}...`;

      const viewport = options.width && options.height ? {
        width: parseInt(options.width),
        height: parseInt(options.height),
      } : undefined;

      const result = await sentinel.captureViews(options.url, {
        device: options.device,
        viewport,
        overlap: parseInt(options.overlap),
        scrollDelay: parseInt(options.scrollDelay),
        outputName: options.name,
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('View-by-view capture complete!');

      console.log(chalk.bold('\n📸 View-by-View Capture:\n'));
      console.log(chalk.cyan(`Device: ${result.device}`));
      console.log(chalk.cyan(`Viewport: ${result.viewport?.width}×${result.viewport?.height}px`));
      console.log(chalk.cyan(`Total Views: ${result.viewCount}`));
      console.log(chalk.cyan(`Output Directory: ${result.directory}`));

      if (expectationsFile) {
        console.log(chalk.cyan(`Expectations: ${expectationsFile}`));
      }

      if (result.views) {
        console.log(chalk.bold('\n📋 Views:'));
        result.views.slice(0, 5).forEach((v: any) => {
          console.log(chalk.gray(`  View ${v.index}: Scroll ${v.scrollY}px`));
        });
        if (result.views.length > 5) {
          console.log(chalk.gray(`  ... and ${result.views.length - 5} more views`));
        }
      }

      if (result.metExpectation) {
        console.log(chalk.bold('\n✓ Expectation Validation:'));
        console.log(result.metExpectation.met ? chalk.green('✓ Met') : chalk.red('✗ Not Met'));
        console.log(chalk.gray(`Details: ${result.metExpectation.details}`));
      }

      console.log('');
    } catch (error) {
      spinner.fail('Failed to capture views');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('views-multi')
  .description('[AI Agent] Capture view-by-view screenshots across multiple devices')
  .requiredOption('-u, --url <url>', 'URL to capture')
  .option('-d, --devices <devices>', 'Comma-separated devices: desktop,tablet,mobile', 'desktop,tablet,mobile')
  .option('--overlap <pixels>', 'Overlap between views in pixels', '50')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-n, --name <name>', 'Output directory name')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      // Save expectations to file
      const expectationsFile = saveExpectations(options.expectations, outputDir, 'views-multi');

      spinner.text = `Loading ${options.url}...`;
      const devices = options.devices.split(',').map((d: string) => d.trim());

      const results = await sentinel.captureViewsMulti(options.url, {
        devices: devices as ('desktop' | 'tablet' | 'mobile')[],
        overlap: parseInt(options.overlap),
        outputName: options.name,
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('Multi-device view capture complete!');

      console.log(chalk.bold('\n📸 Multi-Device View Captures:\n'));
      results.results.forEach((result: any) => {
        console.log(chalk.cyan(`${result.device}: ${result.viewCount} views`));
        console.log(chalk.gray(`  ${result.directory}`));
      });

      if (expectationsFile) {
        console.log(chalk.cyan(`\nExpectations: ${expectationsFile}`));
      }

      console.log('');
    } catch (error) {
      spinner.fail('Failed to capture views');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('inspect-element')
  .description('[AI Agent] Inspect a specific element with optional interaction')
  .requiredOption('-u, --url <url>', 'URL to inspect')
  .requiredOption('-s, --selector <selector>', 'CSS selector of element to inspect')
  .option('-v, --viewport <viewport>', 'Viewport: mobile, tablet, desktop', 'desktop')
  .option('-a, --action <action>', 'Action to perform: click, hover, focus')
  .option('--no-capture-viewport', 'Skip viewport screenshot')
  .option('--no-capture-element', 'Skip element screenshot')
  .option('--no-overlay', 'Hide inspection overlay')
  .option('--show-info', 'Show info panel in CDP overlay')
  .option('--show-rulers', 'Show ruler overlay')
  .option('--no-extension-lines', 'Hide extension lines in overlay')
  .option('--capture-zoomed', 'Capture zoomed screenshot')
  .option('--zoom-level <level>', 'Zoom level for zoomed screenshots', '2')
  .option('--no-parent', 'Exclude parent element info')
  .option('--no-children', 'Exclude children elements info')
  .option('--no-computed-styles', 'Exclude full computed styles')
  .option('--no-attributes', 'Exclude HTML attributes')
  .option('--no-auto-save', 'Disable auto-save of JSON metadata and report')
  .option('-n, --name <name>', 'Output filename (without extension)')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      // Save expectations to file
      const expectationsFile = saveExpectations(options.expectations, outputDir, 'inspect-element');

      spinner.text = `Inspecting ${options.selector}...`;

      const result = await sentinel.inspectElement(options.url, options.selector, {
        viewport: options.viewport,
        action: options.action,
        captureViewport: options.captureViewport,
        captureElement: options.captureElement,
        showOverlay: !options.overlay,
        showInfo: options.showInfo,
        showRulers: options.showRulers,
        showExtensionLines: options.extensionLines,
        captureZoomed: options.captureZoomed,
        zoomLevel: options.zoomLevel ? parseInt(options.zoomLevel) : undefined,
        includeParent: options.parent,
        includeChildren: options.children,
        includeComputedStyles: options.computedStyles,
        includeAttributes: options.attributes,
        autoSave: options.autoSave,
        outputName: options.name,
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('Element inspection complete!');

      console.log(chalk.bold('\n🔍 Element Inspection:\n'));
      console.log(chalk.cyan(`Selector: ${options.selector}`));
      if (result.screenshots) {
        console.log(chalk.cyan(`Screenshots: ${result.screenshots.length}`));
      }

      if (expectationsFile) {
        console.log(chalk.cyan(`Expectations: ${expectationsFile}`));
      }

      console.log('');
    } catch (error) {
      spinner.fail('Failed to inspect element');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('analyze-responsive')
  .description('[AI Agent] Analyze responsive design patterns and fixed-width elements')
  .requiredOption('-u, --url <url>', 'URL to analyze')
  .option('-v, --viewport <viewport>', 'Viewport: mobile, tablet, desktop', 'mobile')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      // Save expectations to file
      const expectationsFile = saveExpectations(options.expectations, outputDir, 'analyze-responsive');

      spinner.text = 'Analyzing responsive design...';

      const data = await sentinel.analyzeResponsive(options.url, {
        viewport: options.viewport,
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('Responsive design analysis complete!');

      // Header with score
      console.log('');
      console.log(chalk.bold.cyan('  📱 RESPONSIVE DESIGN ANALYSIS'));
      console.log(chalk.gray('  ════════════════════════════════════════════════════════════\n'));

      // Score with visual indicator
      const scoreColor = data.score >= 80 ? chalk.green : data.score >= 60 ? chalk.yellow : chalk.red;
      const scoreBar = '█'.repeat(Math.floor(data.score / 5));
      console.log(chalk.bold('Overall Score: ') + scoreColor.bold(`${data.score}/100`));
      console.log(scoreColor(scoreBar) + chalk.gray('░'.repeat(20 - Math.floor(data.score / 5))) + '\n');

      // Issues Summary
      if (data.fixedWidthElements?.criticalCount > 0 || data.fixedWidthElements?.highCount > 0) {
        console.log(chalk.bold('🚨 Fixed-Width Issues:\n'));
        const issues = [];
        if (data.fixedWidthElements?.criticalCount > 0) {
          issues.push(['Critical', data.fixedWidthElements.criticalCount, chalk.red('●')]);
        }
        if (data.fixedWidthElements?.highCount > 0) {
          issues.push(['High', data.fixedWidthElements.highCount, chalk.yellow('●')]);
        }
        if (data.fixedWidthElements?.mediumCount > 0) {
          issues.push(['Medium', data.fixedWidthElements.mediumCount, chalk.blue('●')]);
        }
        issues.forEach(([severity, count, icon]) => {
          console.log(`  ${icon} ${String(severity).padEnd(10)} ${count} issue${count === 1 ? '' : 's'}`);
        });
        console.log('');
      }

      // CSS Units Distribution
      if (data.cssUnits) {
        console.log(chalk.bold('📏 CSS Units Distribution:\n'));
        const total = data.cssUnits.pxCount + data.cssUnits.remCount + data.cssUnits.percentCount;
        const units = [
          ['Pixel (px)', data.cssUnits.pxCount, total],
          ['Relative (rem/em)', data.cssUnits.remCount, total],
          ['Percentage (%)', data.cssUnits.percentCount, total],
        ];
        units.forEach(([name, count, total]) => {
          const percentage = total > 0 ? Math.round((count as number / total) * 100) : 0;
          const bar = '▓'.repeat(Math.floor(percentage / 5));
          console.log(`  ${String(name).padEnd(20)} ${String(count).padStart(4)} ${chalk.cyan(bar)}`);
        });
        console.log('');
      }

      // Layout Types
      if (data.layoutTypes) {
        console.log(chalk.bold('📐 Layout Systems:\n'));
        const layouts = [
          ['Flexbox', data.layoutTypes.flexCount],
          ['Grid', data.layoutTypes.gridCount],
        ];
        layouts.forEach(([name, count]) => {
          console.log(`  ${String(name).padEnd(20)} ${count}`);
        });
        console.log('');
      }

      // Top Recommendations
      if (data.recommendations && data.recommendations.length > 0) {
        console.log(chalk.bold('💡 Top Recommendations:\n'));
        data.recommendations.slice(0, 5).forEach((rec: any, i: number) => {
          const priorityBadge = rec.priority === 'critical' ? chalk.red('[CRITICAL]') :
                                rec.priority === 'high' ? chalk.yellow('[HIGH]') :
                                rec.priority === 'medium' ? chalk.blue('[MEDIUM]') :
                                chalk.gray('[LOW]');
          console.log(`  ${i + 1}. ${priorityBadge} ${rec.issue}`);
          console.log(chalk.gray(`     → ${rec.fix}\n`));
        });
        if (data.recommendations.length > 5) {
          console.log(chalk.gray(`  ... and ${data.recommendations.length - 5} more recommendations\n`));
        }
      }

      // Save JSON data
      const fs = await import('fs/promises');
      const jsonPath = `${outputDir}/responsive-analysis-${Date.now()}.json`;
      await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
      console.log(chalk.cyan(`📄 Data: ${jsonPath}\n`));

      // Expectations
      if (expectationsFile) {
        console.log(chalk.bold('📝 Expectations:'));
        console.log(chalk.gray(`  File: ${expectationsFile}`));
        console.log(chalk.gray(`  "${options.expectations}"\n`));
      }
    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('analyze-mobile-ux')
  .description('[AI Agent] Analyze mobile UX including touch targets, readability, and WCAG compliance')
  .requiredOption('-u, --url <url>', 'URL to analyze')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    // Save expectations to file
    const expectationsFile = saveExpectations(options.expectations, outputDir, 'analyze-mobile-ux');

    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      spinner.text = 'Analyzing mobile UX...';

      const data = await sentinel.analyzeMobileUX(options.url, {
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('Mobile UX analysis complete!');

      // Header with score
      console.log('');
      console.log(chalk.bold.cyan('  📱 MOBILE UX ANALYSIS'));
      console.log(chalk.gray('  ════════════════════════════════════════════════════════════\n'));

      // Score with visual indicator
      const scoreColor = data.score >= 80 ? chalk.green : data.score >= 60 ? chalk.yellow : chalk.red;
      const scoreBar = '█'.repeat(Math.floor(data.score / 5));
      console.log(chalk.bold('Overall Score: ') + scoreColor.bold(`${data.score}/100`));
      console.log(scoreColor(scoreBar) + chalk.gray('░'.repeat(20 - Math.floor(data.score / 5))) + '\n');

      // Touch Targets
      if (data.touchTargets) {
        console.log(chalk.bold('👆 Touch Target Compliance:\n'));
        const totalTargets = (data.touchTargets.criticalCount || 0) + (data.touchTargets.highCount || 0);

        if (totalTargets === 0) {
          console.log(chalk.green('  ✓ All touch targets meet WCAG 2.1 requirements (≥44×44px)\n'));
        } else {
          const checks = [];
          if (data.touchTargets.criticalCount > 0) {
            checks.push([chalk.red('✗'), 'Critical', `${data.touchTargets.criticalCount} targets < 32px`, chalk.red]);
          }
          if (data.touchTargets.highCount > 0) {
            checks.push([chalk.yellow('⚠'), 'High', `${data.touchTargets.highCount} targets < 44px (WCAG)`, chalk.yellow]);
          }
          checks.forEach(([icon, severity, message, colorFn]) => {
            console.log(`  ${icon} ${String(severity).padEnd(10)} ${colorFn(message)}`);
          });
          console.log('');
        }
      }

      // Text Readability
      if (data.textReadability) {
        console.log(chalk.bold('📖 Text Readability:\n'));
        if (data.textReadability.count > 0) {
          console.log(chalk.yellow(`  ⚠ ${data.textReadability.count} text element${data.textReadability.count === 1 ? '' : 's'} below 16px`));
          console.log(chalk.gray('    Recommended: Use at least 16px for body text\n'));
        } else {
          console.log(chalk.green('  ✓ All text meets minimum size requirements\n'));
        }
      }

      // Tap Collisions
      if (data.tapCollisions) {
        console.log(chalk.bold('⚡ Tap Target Spacing:\n'));
        if (data.tapCollisions.count > 0) {
          console.log(chalk.yellow(`  ⚠ ${data.tapCollisions.count} pair${data.tapCollisions.count === 1 ? '' : 's'} of elements too close`));
          console.log(chalk.gray('    Elements should have adequate spacing to prevent mis-taps\n'));
        } else {
          console.log(chalk.green('  ✓ No tap collision risks detected\n'));
        }
      }

      // Viewport Meta
      if (data.viewportMeta) {
        console.log(chalk.bold('📐 Viewport Configuration:\n'));
        if (data.viewportMeta.hasViewportMeta) {
          console.log(chalk.green('  ✓ Viewport meta tag present'));
          if (data.viewportMeta.content) {
            console.log(chalk.gray(`    ${data.viewportMeta.content}\n`));
          }
        } else {
          console.log(chalk.red('  ✗ Missing viewport meta tag'));
          console.log(chalk.gray('    Add: <meta name="viewport" content="width=device-width, initial-scale=1.0">\n'));
        }
      }

      // Recommendations
      if (data.recommendations && data.recommendations.length > 0) {
        console.log(chalk.bold('💡 Top Recommendations:\n'));
        data.recommendations.slice(0, 5).forEach((rec: any, i: number) => {
          const priorityBadge = rec.priority === 'critical' ? chalk.red('[CRITICAL]') :
                                rec.priority === 'high' ? chalk.yellow('[HIGH]') :
                                rec.priority === 'medium' ? chalk.blue('[MEDIUM]') :
                                chalk.gray('[LOW]');
          console.log(`  ${i + 1}. ${priorityBadge} ${rec.issue}`);
          console.log(chalk.gray(`     → ${rec.fix}\n`));
        });
        if (data.recommendations.length > 5) {
          console.log(chalk.gray(`  ... and ${data.recommendations.length - 5} more recommendations\n`));
        }
      }

      // Save JSON data
      const fs = await import('fs/promises');
      const jsonPath = `${outputDir}/mobile-ux-analysis-${Date.now()}.json`;
      await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
      console.log(chalk.cyan(`📄 Data: ${jsonPath}\n`));

      // Expectations
      if (expectationsFile) {
        console.log(chalk.bold('📝 Expectations:'));
        console.log(chalk.gray(`  File: ${expectationsFile}`));
        console.log(chalk.gray(`  "${options.expectations}"\n`));
      }
    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('check-accessibility')
  .description('[AI Agent] Check accessibility compliance (WCAG)')
  .requiredOption('-u, --url <url>', 'URL to check')
  .option('-v, --viewport <viewport>', 'Viewport: mobile, tablet, desktop', 'desktop')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    // Save expectations to file
    const expectationsFile = saveExpectations(options.expectations, outputDir, 'check-accessibility');

    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      spinner.text = 'Checking accessibility...';

      const data = await sentinel.checkAccessibility(options.url, {
        viewport: options.viewport,
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('Accessibility check complete!');

      // Header
      console.log('');
      console.log(chalk.bold.cyan('  ♿ ACCESSIBILITY COMPLIANCE'));
      console.log(chalk.gray('  ════════════════════════════════════════════════════════════\n'));

      // Standard and summary
      console.log(chalk.bold('Standard: ') + chalk.cyan(data.standard || 'WCAG 2.1 AA'));
      const violationCount = data.violations?.length || 0;
      const statusIcon = violationCount === 0 ? chalk.green('✓') : chalk.red('✗');
      const statusText = violationCount === 0 ? chalk.green('PASS') : chalk.red('FAIL');
      console.log(chalk.bold('Status: ') + `${statusIcon} ${statusText}`);
      console.log(chalk.bold('Violations: ') + (violationCount > 0 ? chalk.red(violationCount) : chalk.green('0')) + '\n');

      if (data.violations && data.violations.length > 0) {
        // Group by impact
        const grouped = data.violations.reduce((acc: any, v: any) => {
          if (!acc[v.impact]) acc[v.impact] = [];
          acc[v.impact].push(v);
          return acc;
        }, {});

        // Show summary by impact
        console.log(chalk.bold('Violations by Impact:\n'));
        const impacts = ['critical', 'serious', 'moderate', 'minor'];
        impacts.forEach(impact => {
          const count = grouped[impact]?.length || 0;
          if (count > 0) {
            const icon = impact === 'critical' ? chalk.red('●') :
                        impact === 'serious' ? chalk.yellow('●') :
                        impact === 'moderate' ? chalk.blue('●') :
                        chalk.gray('●');
            console.log(`  ${icon} ${String(impact.charAt(0).toUpperCase() + impact.slice(1)).padEnd(10)} ${count} issue${count === 1 ? '' : 's'}`);
          }
        });

        // Show top violations
        console.log(chalk.bold('\n⚠ Top Violations:\n'));
        data.violations.slice(0, 5).forEach((v: any, i: number) => {
          const impactBadge = v.impact === 'critical' ? chalk.red('[CRITICAL]') :
                             v.impact === 'serious' ? chalk.yellow('[SERIOUS]') :
                             v.impact === 'moderate' ? chalk.blue('[MODERATE]') :
                             chalk.gray('[MINOR]');
          console.log(`  ${i + 1}. ${impactBadge} ${v.help}`);
          console.log(chalk.gray(`     ${v.description}\n`));
        });
        if (data.violations.length > 5) {
          console.log(chalk.gray(`  ... and ${data.violations.length - 5} more violations\n`));
        }
      } else {
        console.log(chalk.green.bold('✓ No accessibility violations found!\n'));
        console.log(chalk.green('  Your page meets WCAG guidelines.\n'));
      }

      // Save JSON data
      const fs = await import('fs/promises');
      const jsonPath = `${outputDir}/accessibility-check-${Date.now()}.json`;
      await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
      console.log(chalk.cyan(`📄 Data: ${jsonPath}\n`));

      // Expectations
      if (expectationsFile) {
        console.log(chalk.bold('📝 Expectations:'));
        console.log(chalk.gray(`  File: ${expectationsFile}`));
        console.log(chalk.gray(`  "${options.expectations}"\n`));
      }
    } catch (error) {
      spinner.fail('Accessibility check failed');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('check-contrast')
  .description('[AI Agent] Check color contrast ratios')
  .requiredOption('-u, --url <url>', 'URL to check')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    // Save expectations to file
    const expectationsFile = saveExpectations(options.expectations, outputDir, 'check-contrast');

    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      spinner.text = 'Checking contrast ratios...';

      const data = await sentinel.checkContrast(options.url, {
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('Contrast check complete!');

      console.log(chalk.bold('\n🎨 Contrast Check:\n'));
      console.log(chalk.cyan(`Total Elements Checked: ${data.totalElements || 0}`));
      console.log(chalk.cyan(`Failing WCAG AA: ${data.failingAA || 0}`));
      console.log(chalk.cyan(`Failing WCAG AAA: ${data.failingAAA || 0}`));

      if (data.issues && data.issues.length > 0) {
        console.log(chalk.bold('\n⚠ Contrast Issues:'));
        data.issues.slice(0, 5).forEach((issue: any, i: number) => {
          console.log(chalk.yellow(`  ${i + 1}. ${issue.selector}`));
          console.log(chalk.gray(`     Ratio: ${issue.ratio} (requires ${issue.required})`));
        });
        if (data.issues.length > 5) {
          console.log(chalk.gray(`  ... and ${data.issues.length - 5} more issues`));
        }
      } else {
        console.log(chalk.green('\n✓ All contrast ratios meet WCAG guidelines!'));
      }

      // Save JSON data
      const fs = await import('fs/promises');
      const jsonPath = `${outputDir}/contrast-check-${Date.now()}.json`;
      await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
      console.log(chalk.cyan(`\n📄 Data: ${jsonPath}`));

      if (expectationsFile) {
        console.log(chalk.bold('\n📝 Expectations:'));
        console.log(chalk.gray(`  File: ${expectationsFile}`));
        console.log(chalk.gray(`  "${options.expectations}"`));
      }

      console.log('');
    } catch (error) {
      spinner.fail('Contrast check failed');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('measure')
  .description('[AI Agent] Measure element dimensions, margins, padding with visual overlay')
  .requiredOption('-u, --url <url>', 'URL to inspect')
  .requiredOption('-s, --selector <selector>', 'CSS selector of element to measure')
  .option('-v, --viewport <viewport>', 'Viewport: mobile, tablet, desktop', 'desktop')
  .option('--no-dimensions', 'Hide dimension labels')
  .option('--no-margin', 'Hide margin overlay')
  .option('--no-padding', 'Hide padding overlay')
  .option('--no-border', 'Hide border overlay')
  .option('--no-position', 'Hide position indicator')
  .option('--persistent', 'Keep measurements visible across multiple elements')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    const expectationsFile = saveExpectations(options.expectations, outputDir, 'measure');
    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      spinner.text = `Measuring ${options.selector}...`;

      const result = await sentinel.measureElement(options.url, options.selector, {
        viewport: options.viewport,
        showDimensions: options.dimensions,
        showMargin: options.margin,
        showPadding: options.padding,
        showBorder: options.border,
        showPosition: options.position,
        persistent: options.persistent,
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('Element measurement complete!');

      console.log(chalk.bold('\n📐 Element Measurements:\n'));
      console.log(chalk.cyan(`Selector: ${options.selector}`));
      if (result.measurements) {
        const m = result.measurements;
        console.log(chalk.cyan(`Dimensions: ${Math.round(m.content.width)} × ${Math.round(m.content.height)} px`));
        console.log(chalk.cyan(`Position: (${Math.round(m.position.x)}, ${Math.round(m.position.y)})`));
        if (m.margin) {
          console.log(chalk.yellow(`Margin: T${m.margin.top} R${m.margin.right} B${m.margin.bottom} L${m.margin.left}`));
        }
        if (m.padding) {
          console.log(chalk.green(`Padding: T${m.padding.top} R${m.padding.right} B${m.padding.bottom} L${m.padding.left}`));
        }

        // Save JSON data
        const jsonPath = `${outputDir}/measure-${options.selector.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.json`;
        const fs = await import('fs/promises');
        await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));
        console.log(chalk.cyan(`Data: ${jsonPath}`));
      }
      if (result.screenshot) {
        console.log(chalk.cyan(`Screenshot: ${result.screenshot}`));
      }

      if (expectationsFile) {
        console.log(chalk.bold('\n📝 Expectations:'));
        console.log(chalk.gray(`  File: ${expectationsFile}`));
      }

      console.log('');
    } catch (error) {
      spinner.fail('Measurement failed');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('detect-components')
  .description('[AI Agent] Detect UI components on the page (buttons, forms, navigation, etc.)')
  .requiredOption('-u, --url <url>', 'URL to analyze')
  .option('-t, --type <type>', 'Filter by component type (buttons, links, forms, inputs, images, etc.)')
  .option('--highlight', 'Highlight detected components with color-coded outlines')
  .option('--include-position', 'Include position data for each component')
  .option('-v, --viewport <viewport>', 'Viewport: mobile, tablet, desktop', 'desktop')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    const expectationsFile = saveExpectations(options.expectations, outputDir, 'detect-components');
    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      spinner.text = 'Detecting components...';

      const result = await sentinel.detectComponents(options.url, {
        type: options.type,
        highlightComponents: options.highlight,
        includePosition: options.includePosition,
        viewport: options.viewport,
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('Component detection complete!');

      console.log(chalk.bold('\n🔍 Component Detection:\n'));

      if (result.totals) {
        console.log(chalk.cyan('Components Found:'));
        Object.entries(result.totals).forEach(([type, count]) => {
          if (typeof count === 'number' && count > 0) {
            console.log(chalk.gray(`  ${type}: ${count}`));
          }
        });
      }

      if (result.summary) {
        console.log(chalk.bold(`\n${result.summary}`));
      }

      if (result.screenshot) {
        console.log(chalk.cyan(`\nScreenshot: ${result.screenshot}`));
      }

      // Save JSON data
      const fs = await import('fs/promises');
      const jsonPath = `${outputDir}/components-${Date.now()}.json`;
      await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));
      console.log(chalk.cyan(`📄 Data: ${jsonPath}`));

      if (expectationsFile) {
        console.log(chalk.bold('\n📝 Expectations:'));
        console.log(chalk.gray(`  File: ${expectationsFile}`));
      }

      console.log('');
    } catch (error) {
      spinner.fail('Component detection failed');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('show-grid')
  .description('[AI Agent] Show layout grid overlay for alignment verification')
  .requiredOption('-u, --url <url>', 'URL to analyze')
  .option('--grid-size <pixels>', 'Grid spacing in pixels', '8')
  .option('--columns <number>', 'Show column grid with specified number of columns')
  .option('--gutter <pixels>', 'Gutter size for column grid', '20')
  .option('--max-width <pixels>', 'Max width for column grid', '1200')
  .option('--no-ruler', 'Hide ruler overlays')
  .option('--no-center-lines', 'Hide center line guides')
  .option('-v, --viewport <viewport>', 'Viewport: mobile, tablet, desktop', 'desktop')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    const expectationsFile = saveExpectations(options.expectations, outputDir, 'show-grid');
    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      spinner.text = 'Creating grid overlay...';

      const result = await sentinel.showLayoutGrid(options.url, {
        gridSize: parseInt(options.gridSize),
        columns: options.columns ? parseInt(options.columns) : undefined,
        gutter: parseInt(options.gutter),
        maxWidth: parseInt(options.maxWidth),
        showRuler: options.ruler,
        showCenterLines: options.centerLines,
        viewport: options.viewport,
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('Grid overlay created!');

      console.log(chalk.bold('\n📐 Layout Grid:\n'));
      if (options.columns) {
        console.log(chalk.cyan(`Column Grid: ${options.columns} columns`));
        console.log(chalk.cyan(`Gutter: ${options.gutter}px`));
        console.log(chalk.cyan(`Max Width: ${options.maxWidth}px`));
      } else {
        console.log(chalk.cyan(`Grid Size: ${options.gridSize}px`));
      }
      console.log(chalk.cyan(`Screenshot: ${result.screenshot}`));

      // Save JSON data
      const fs = await import('fs/promises');
      const jsonPath = `${outputDir}/grid-${Date.now()}.json`;
      await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));
      console.log(chalk.cyan(`📄 Data: ${jsonPath}`));

      if (expectationsFile) {
        console.log(chalk.bold('\n📝 Expectations:'));
        console.log(chalk.gray(`  File: ${expectationsFile}`));
      }

      console.log('');
    } catch (error) {
      spinner.fail('Grid overlay failed');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('show-breakpoints')
  .description('[AI Agent] Show responsive breakpoint indicator')
  .requiredOption('-u, --url <url>', 'URL to analyze')
  .option('--position <position>', 'Indicator position: top-left, top-right, bottom-left, bottom-right', 'bottom-right')
  .option('--no-dimensions', 'Hide viewport dimensions')
  .option('--no-orientation', 'Hide orientation info')
  .option('-v, --viewport <viewport>', 'Viewport: mobile, tablet, desktop', 'desktop')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    const expectationsFile = saveExpectations(options.expectations, outputDir, 'show-breakpoints');
    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      spinner.text = 'Creating breakpoint indicator...';

      const result = await sentinel.showBreakpoints(options.url, {
        position: options.position as any,
        showDimensions: options.dimensions,
        showOrientation: options.orientation,
        viewport: options.viewport,
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('Breakpoint indicator created!');

      console.log(chalk.bold('\n📱 Breakpoint Info:\n'));
      console.log(chalk.cyan(`Active Breakpoint: ${result.active}`));
      console.log(chalk.cyan(`Viewport: ${result.width} × ${result.height} px`));
      console.log(chalk.cyan(`Orientation: ${result.orientation}`));
      console.log(chalk.cyan(`Screenshot: ${result.screenshot}`));

      // Save JSON data
      const fs = await import('fs/promises');
      const jsonPath = `${outputDir}/breakpoints-${Date.now()}.json`;
      await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));
      console.log(chalk.cyan(`📄 Data: ${jsonPath}`));

      if (expectationsFile) {
        console.log(chalk.bold('\n📝 Expectations:'));
        console.log(chalk.gray(`  File: ${expectationsFile}`));
      }

      console.log('');
    } catch (error) {
      spinner.fail('Breakpoint visualization failed');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('analyze-media-queries')
  .description('[AI Agent] Analyze CSS media queries and responsive breakpoints')
  .requiredOption('-u, --url <url>', 'URL to analyze')
  .option('-v, --viewport <viewport>', 'Viewport: mobile, tablet, desktop', 'desktop')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    const expectationsFile = saveExpectations(options.expectations, outputDir, 'analyze-media-queries');
    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      spinner.text = 'Analyzing media queries...';

      const data = await sentinel.analyzeMediaQueries(options.url, {
        viewport: options.viewport,
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('Media query analysis complete!');

      console.log(chalk.bold('\n📱 Media Query Analysis:\n'));

      const scoreColor = data.score >= 80 ? chalk.green : data.score >= 60 ? chalk.yellow : chalk.red;
      console.log(chalk.bold('Score: ') + scoreColor.bold(`${data.score}/100`));

      console.log(chalk.bold('\n📊 Statistics:'));
      console.log(chalk.cyan(`  Approach: ${data.approach}`));
      console.log(chalk.cyan(`  Total Media Queries: ${data.stats?.totalMediaQueries || 0}`));
      console.log(chalk.cyan(`  Unique Breakpoints: ${data.breakpoints?.length || 0}`));

      if (data.breakpoints && data.breakpoints.length > 0) {
        console.log(chalk.bold('\n📏 Breakpoints:'));
        console.log(chalk.gray(`  ${data.breakpoints.join('px, ')}px`));
      }

      if (data.recommendations && data.recommendations.length > 0) {
        console.log(chalk.bold('\n💡 Recommendations:'));
        data.recommendations.slice(0, 5).forEach((rec: any, i: number) => {
          const badge = rec.priority === 'critical' ? chalk.red('[CRITICAL]') :
                       rec.priority === 'high' ? chalk.yellow('[HIGH]') :
                       rec.priority === 'medium' ? chalk.blue('[MEDIUM]') : chalk.gray('[LOW]');
          console.log(`  ${i + 1}. ${badge} ${rec.issue}`);
          console.log(chalk.gray(`     → ${rec.fix}\n`));
        });
      }

      // Save JSON data
      const fs = await import('fs/promises');
      const jsonPath = `${outputDir}/media-queries-${Date.now()}.json`;
      await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
      console.log(chalk.cyan(`\n📄 Data: ${jsonPath}`));

      if (expectationsFile) {
        console.log(chalk.bold('\n📝 Expectations:'));
        console.log(chalk.gray(`  File: ${expectationsFile}`));
      }

      console.log('');
    } catch (error) {
      spinner.fail('Media query analysis failed');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('inspect-a11y')
  .description('[AI Agent] Visually inspect accessibility violations with overlays')
  .requiredOption('-u, --url <url>', 'URL to inspect')
  .option('-v, --viewport <viewport>', 'Viewport: mobile, tablet, desktop', 'desktop')
  .option('--no-tooltips', 'Disable violation tooltips')
  .option('--no-hover', 'Disable hover to show violations')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    const expectationsFile = saveExpectations(options.expectations, outputDir, 'inspect-a11y');
    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      spinner.text = 'Inspecting accessibility violations...';

      const result = await sentinel.inspectA11y(options.url, {
        viewport: options.viewport,
        showTooltips: options.tooltips,
        enableHover: options.hover,
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('A11y inspection complete!');

      console.log(chalk.bold('\n♿ Accessibility Inspection:\n'));
      console.log(chalk.cyan(`Violations Highlighted: ${result.markersCreated || 0}`));
      console.log(chalk.cyan(`Screenshot: ${result.screenshot}`));

      if (result.violations && result.violations.violations) {
        const violationCount = result.violations.violations.length;
        console.log(chalk.bold(`\nTotal Violations: ${violationCount > 0 ? chalk.red(violationCount) : chalk.green('0')}`));
      }

      // Save JSON data
      const fs = await import('fs/promises');
      const jsonPath = `${outputDir}/a11y-inspection-${Date.now()}.json`;
      await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));
      console.log(chalk.cyan(`📄 Data: ${jsonPath}`));

      if (expectationsFile) {
        console.log(chalk.bold('\n📝 Expectations:'));
        console.log(chalk.gray(`  File: ${expectationsFile}`));
      }

      console.log('');
    } catch (error) {
      spinner.fail('A11y inspection failed');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program
  .command('inspect-sequence')
  .description('[AI Agent] Inspect element with action sequence (click, type, wait, etc.)')
  .requiredOption('-u, --url <url>', 'URL to inspect')
  .requiredOption('-s, --selector <selector>', 'CSS selector of element')
  .requiredOption('-A, --actions <actions>', 'Comma-separated actions (e.g., "click,type:hello,wait:1000")')
  .option('-v, --viewport <viewport>', 'Viewport: mobile, tablet, desktop', 'desktop')
  .option('--capture-intermediate', 'Capture screenshot after each action')
  .option('--capture-viewport', 'Use viewport capture instead of fullpage')
  .option('-e, --expectations <text>', 'Document what you expect to see/validate (hypothesis-driven testing)')
  .option('-o, --output <dir>', 'Output directory (defaults to config or ./uisentinel-output)')
  .action(async (options) => {
    const configDefaults = getConfigDefaults();
    const outputDir = options.output || configDefaults.outputDir;

    const expectationsFile = saveExpectations(options.expectations, outputDir, 'inspect-sequence');
    const ora = (await import('ora')).default;
    const spinner = ora('Starting browser...').start();

    const sentinel = new UISentinel({
      headless: configDefaults.headless,
      output: { directory: outputDir, format: 'json' },
    });

    try {
      // Parse actions string
      const actionStrings = options.actions.split(',');
      const actions = actionStrings.map((actionStr: string) => {
        const parts = actionStr.trim().split(':');
        const type = parts[0];

        if (type === 'type' && parts[1]) {
          return { type: 'type', value: parts[1] };
        } else if (type === 'wait' && parts[1]) {
          return { type: 'wait', duration: parseInt(parts[1]) };
        } else {
          return { type };
        }
      });

      spinner.text = 'Executing action sequence...';

      const result = await sentinel.inspectWithSequence(options.url, options.selector, actions, {
        viewport: options.viewport,
        captureIntermediate: options.captureIntermediate,
        captureViewport: options.captureViewport,
        expectations: options.expectations,
      });

      await sentinel.close();
      spinner.succeed('Action sequence complete!');

      console.log(chalk.bold('\n🎬 Action Sequence:\n'));
      console.log(chalk.cyan(`Selector: ${options.selector}`));
      console.log(chalk.cyan(`Actions Performed: ${result.actionsPerformed}`));

      if (result.screenshots && result.screenshots.length > 0) {
        console.log(chalk.bold('\n📸 Screenshots:'));
        result.screenshots.forEach((s: any) => {
          console.log(chalk.gray(`  Step ${s.step} (${s.action}): ${s.path}`));
        });
      }

      if (result.files?.report) {
        console.log(chalk.cyan(`\nReport: ${result.files.report}`));
      }

      // Save JSON data
      const fs = await import('fs/promises');
      const jsonPath = `${outputDir}/sequence-${Date.now()}.json`;
      await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));
      console.log(chalk.cyan(`📄 Data: ${jsonPath}`));

      if (expectationsFile) {
        console.log(chalk.bold('\n📝 Expectations:'));
        console.log(chalk.gray(`  File: ${expectationsFile}`));
      }

      console.log('');
    } catch (error) {
      spinner.fail('Action sequence failed');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      await sentinel.close();
      process.exit(1);
    }
  });

program.parse();

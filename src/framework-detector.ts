import * as fs from 'fs';
import * as path from 'path';
import { Framework, FrameworkDetectionResult } from './types';

/**
 * Detects the web framework used in a project
 */
export class FrameworkDetector {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = path.resolve(projectPath);
  }

  /**
   * Detect the framework and return start command
   */
  async detect(): Promise<FrameworkDetectionResult> {
    // Check for package.json
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return this.detectFromPackageJson(packageJson);
    }

    // Check for static HTML
    if (this.hasHtmlFiles()) {
      return {
        framework: 'html',
        confidence: 100,
        command: 'npx serve',
        port: 3000,
      };
    }

    throw new Error('Unable to detect project type. No package.json or HTML files found.');
  }

  private detectFromPackageJson(packageJson: any): FrameworkDetectionResult {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const scripts = packageJson.scripts || {};

    // Next.js detection
    if (deps['next']) {
      const command = scripts.dev || scripts.start || 'next dev';
      return {
        framework: 'nextjs',
        confidence: 100,
        command,
        port: this.extractPortFromCommand(command) || 3000,
        lockFile: this.detectLockFile(),
        configFile: 'next.config.js',
      };
    }

    // Vite detection
    if (deps['vite']) {
      const command = scripts.dev || scripts.start || 'npm run dev';
      return {
        framework: 'vite',
        confidence: 100,
        command,
        port: this.extractPortFromCommand(command) || 5173,
        lockFile: this.detectLockFile(),
        configFile: 'vite.config.js',
      };
    }

    // Create React App
    if (deps['react-scripts']) {
      const command = scripts.start || 'react-scripts start';
      return {
        framework: 'cra',
        confidence: 100,
        command,
        port: this.extractPortFromCommand(command) || 3000,
        lockFile: this.detectLockFile(),
      };
    }

    // Angular
    if (deps['@angular/core']) {
      const command = scripts.start || 'ng serve';
      return {
        framework: 'angular',
        confidence: 100,
        command,
        port: this.extractPortFromCommand(command) || 4200,
        lockFile: this.detectLockFile(),
        configFile: 'angular.json',
      };
    }

    // SvelteKit
    if (deps['@sveltejs/kit']) {
      const command = scripts.dev || 'vite dev';
      return {
        framework: 'svelte-kit',
        confidence: 100,
        command,
        port: this.extractPortFromCommand(command) || 5173,
        lockFile: this.detectLockFile(),
        configFile: 'svelte.config.js',
      };
    }

    // Astro
    if (deps['astro']) {
      const command = scripts.dev || 'astro dev';
      return {
        framework: 'astro',
        confidence: 100,
        command,
        port: this.extractPortFromCommand(command) || 3000,
        lockFile: this.detectLockFile(),
        configFile: 'astro.config.mjs',
      };
    }

    // Generic - try to use dev or start script
    if (scripts.dev || scripts.start) {
      const command = scripts.dev || scripts.start;
      return {
        framework: 'custom',
        confidence: 50,
        command,
        port: this.extractPortFromCommand(command) || 3000,
        lockFile: this.detectLockFile(),
      };
    }

    // Fallback to static HTML
    if (this.hasHtmlFiles()) {
      return {
        framework: 'html',
        confidence: 70,
        command: 'npx serve',
        port: 3000,
      };
    }

    throw new Error('Unable to detect framework or find suitable start command.');
  }

  private hasHtmlFiles(): boolean {
    const htmlFiles = fs.readdirSync(this.projectPath)
      .filter(file => file.endsWith('.html'));
    return htmlFiles.length > 0;
  }

  private detectLockFile(): string | undefined {
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'];
    for (const lockFile of lockFiles) {
      if (fs.existsSync(path.join(this.projectPath, lockFile))) {
        return lockFile;
      }
    }
    return undefined;
  }

  private extractPortFromCommand(command: string): number | null {
    // Look for --port or -p flags
    const portMatch = command.match(/(?:--port|-p)\s+(\d+)/);
    if (portMatch) {
      return parseInt(portMatch[1], 10);
    }
    return null;
  }

  /**
   * Get the package manager to use
   */
  getPackageManager(): 'npm' | 'yarn' | 'pnpm' | 'bun' {
    if (fs.existsSync(path.join(this.projectPath, 'bun.lockb'))) {
      return 'bun';
    }
    if (fs.existsSync(path.join(this.projectPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (fs.existsSync(path.join(this.projectPath, 'yarn.lock'))) {
      return 'yarn';
    }
    return 'npm';
  }
}

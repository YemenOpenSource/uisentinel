import { spawn, ChildProcess } from 'child_process';
import detectPort from 'detect-port';
import treeKill from 'tree-kill';
import { ServerInfo, Framework } from './types';
import { FrameworkDetector } from './framework-detector';

/**
 * Manages starting and stopping development servers
 */
export class ServerManager {
  private projectPath: string;
  private process: ChildProcess | null = null;
  private serverInfo: ServerInfo | null = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Start the development server
   */
  async start(preferredPort?: number): Promise<ServerInfo> {
    if (this.serverInfo) {
      return this.serverInfo;
    }

    const detector = new FrameworkDetector(this.projectPath);
    const detection = await detector.detect();
    const packageManager = detector.getPackageManager();

    // Find available port
    const port = await this.findAvailablePort(preferredPort || detection.port);
    
    // Modify command to use available port
    const command = this.buildCommand(detection.command, port, packageManager);
    
    console.log(`Starting ${detection.framework} server on port ${port}...`);
    console.log(`Command: ${command}`);

    return new Promise((resolve, reject) => {
      this.process = spawn(command, {
        shell: true,
        cwd: this.projectPath,
        env: { ...process.env, PORT: port.toString() },
      });

      let output = '';
      let errorOutput = '';

      this.process.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text);

        // Detect when server is ready
        if (this.isServerReady(text, detection.framework)) {
          this.serverInfo = {
            url: `http://localhost:${port}`,
            port,
            pid: this.process!.pid!,
            framework: detection.framework,
          };
          resolve(this.serverInfo);
        }
      });

      this.process.stderr?.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        console.error(text);
      });

      this.process.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      this.process.on('exit', (code) => {
        if (code !== 0 && !this.serverInfo) {
          reject(new Error(`Server exited with code ${code}\n${errorOutput}`));
        }
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!this.serverInfo) {
          reject(new Error('Server start timeout (60s). Server output:\n' + output));
        }
      }, 60000);
    });
  }

  /**
   * Stop the development server
   */
  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    return new Promise((resolve) => {
      if (this.process!.pid) {
        treeKill(this.process!.pid, 'SIGTERM', (err) => {
          if (err) {
            console.error('Error killing process:', err);
          }
          this.process = null;
          this.serverInfo = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get server info if running
   */
  getServerInfo(): ServerInfo | null {
    return this.serverInfo;
  }

  private async findAvailablePort(preferredPort: number): Promise<number> {
    const availablePort = await detectPort(preferredPort);
    if (availablePort !== preferredPort) {
      console.log(`Port ${preferredPort} is busy, using ${availablePort} instead`);
    }
    return availablePort;
  }

  private buildCommand(baseCommand: string, port: number, packageManager: string): string {
    // If command already has port, return as-is
    if (baseCommand.includes('--port') || baseCommand.includes('-p')) {
      return baseCommand;
    }

    // If command doesn't start with a package manager, prepend it
    const pmCommands = ['npm', 'yarn', 'pnpm', 'bun'];
    const startsWithPm = pmCommands.some(pm => baseCommand.startsWith(pm));
    
    let command = baseCommand;
    
    if (!startsWithPm) {
      // Commands that are direct CLI tools
      const cliTools = ['vite', 'next', 'ng', 'astro'];
      const commandStart = baseCommand.split(' ')[0];
      
      if (cliTools.includes(commandStart)) {
        // These tools should be run via npx if not in scripts
        command = `npx ${baseCommand}`;
      } else if (['dev', 'start'].includes(commandStart)) {
        // These are likely npm scripts
        command = `${packageManager} run ${baseCommand}`;
      }
    }

    // Add port based on the command type
    if (!command.includes('--port') && !command.includes('-p')) {
      if (command.includes('serve')) {
        command += ` -l ${port}`;
      } else {
        command += ` --port ${port}`;
      }
    }

    return command;
  }

  private isServerReady(output: string, framework: Framework): boolean {
    const readyPatterns = {
      nextjs: /ready|started server|compiled client and server/i,
      vite: /local:.*http:\/\/localhost/i,
      cra: /compiled successfully|webpack compiled/i,
      angular: /compiled successfully|angular live development server/i,
      'svelte-kit': /local:.*http:\/\/localhost/i,
      astro: /astro.*ready/i,
      html: /serving|available on|accepting connections/i,
      custom: /ready|started|listening|running|accepting connections/i,
    };

    const pattern = readyPatterns[framework] || readyPatterns.custom;
    return pattern.test(output);
  }
}

import * as path from 'path';
import * as fs from 'fs';
import { UISentinelConfig } from './types';

/**
 * Load UISentinel configuration from uisentinel.config.js
 * @param configPath - Optional path to config file
 * @returns Loaded configuration or empty object if not found
 */
export function loadConfig(configPath?: string): Partial<UISentinelConfig> {
  const configLocations = [
    configPath,
    path.join(process.cwd(), 'uisentinel.config.js'),
    path.join(process.cwd(), '.uisentinel', 'config.js'),
  ].filter(Boolean) as string[];

  for (const location of configLocations) {
    if (fs.existsSync(location)) {
      try {
        // Clear require cache to ensure fresh load
        delete require.cache[require.resolve(location)];
        const config = require(location);
        return config.default || config;
      } catch (error) {
        console.warn(`Warning: Failed to load config from ${location}:`, error);
      }
    }
  }

  return {};
}

/**
 * Get default output directory from config or fallback
 * @param config - Loaded config
 * @param fallback - Fallback directory
 * @returns Output directory path
 */
export function getOutputDirectory(config: Partial<UISentinelConfig>, fallback: string): string {
  return config.output?.directory || fallback;
}

/**
 * Get timeout from config or fallback
 * @param config - Loaded config
 * @param fallback - Fallback timeout
 * @returns Timeout in milliseconds
 */
export function getTimeout(config: Partial<UISentinelConfig>, fallback: number): number {
  return config.timeout || fallback;
}

/**
 * Get headless setting from config or fallback
 * @param config - Loaded config
 * @param fallback - Fallback headless setting
 * @returns Whether to run in headless mode
 */
export function getHeadless(config: Partial<UISentinelConfig>, fallback: boolean): boolean {
  return config.headless ?? fallback;
}

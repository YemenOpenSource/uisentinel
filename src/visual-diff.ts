import * as fs from 'fs';
import * as path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import sharp from 'sharp';
import { VisualDiffResult } from './types';

/**
 * Compares images for visual regression testing
 */
export class VisualDiff {
  private outputDir: string;

  constructor(outputDir: string = './uisentinel-output') {
    this.outputDir = path.resolve(outputDir);
  }

  /**
   * Compare two images and generate a diff
   */
  async compare(
    baselinePath: string,
    currentPath: string,
    threshold: number = 0.1
  ): Promise<VisualDiffResult> {
    // Ensure both images exist
    if (!fs.existsSync(baselinePath)) {
      throw new Error(`Baseline image not found: ${baselinePath}`);
    }
    if (!fs.existsSync(currentPath)) {
      throw new Error(`Current image not found: ${currentPath}`);
    }

    // Load images
    const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
    const current = PNG.sync.read(fs.readFileSync(currentPath));

    // Resize if dimensions don't match
    if (baseline.width !== current.width || baseline.height !== current.height) {
      const resized = await this.resizeToMatch(currentPath, baseline.width, baseline.height);
      return this.compare(baselinePath, resized, threshold);
    }

    // Create diff image
    const { width, height } = baseline;
    const diff = new PNG({ width, height });

    // Compare pixels
    const diffPixels = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      width,
      height,
      { threshold: 0.1 }
    );

    // Save diff image
    const diffPath = path.join(
      this.outputDir,
      'diffs',
      `diff_${Date.now()}.png`
    );
    fs.mkdirSync(path.dirname(diffPath), { recursive: true });
    fs.writeFileSync(diffPath, PNG.sync.write(diff));

    const totalPixels = width * height;
    const diffPercentage = (diffPixels / totalPixels) * 100;
    const passed = diffPercentage <= threshold;

    return {
      diffPath,
      diffPixels,
      diffPercentage: parseFloat(diffPercentage.toFixed(2)),
      totalPixels,
      passed,
      threshold,
    };
  }

  /**
   * Resize an image to match target dimensions
   */
  private async resizeToMatch(imagePath: string, width: number, height: number): Promise<string> {
    const resizedPath = path.join(
      this.outputDir,
      'temp',
      `resized_${Date.now()}.png`
    );
    
    fs.mkdirSync(path.dirname(resizedPath), { recursive: true });

    await sharp(imagePath)
      .resize(width, height, { fit: 'fill' })
      .toFile(resizedPath);

    return resizedPath;
  }

  /**
   * Create a baseline from a current screenshot
   */
  async createBaseline(currentPath: string, name: string): Promise<string> {
    const baselinePath = path.join(this.outputDir, 'baselines', `${name}.png`);
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.copyFileSync(currentPath, baselinePath);
    return baselinePath;
  }

  /**
   * Get all baselines
   */
  getBaselines(): string[] {
    const baselineDir = path.join(this.outputDir, 'baselines');
    if (!fs.existsSync(baselineDir)) {
      return [];
    }
    return fs.readdirSync(baselineDir)
      .filter(f => f.endsWith('.png'))
      .map(f => path.join(baselineDir, f));
  }
}

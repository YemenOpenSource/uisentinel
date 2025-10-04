import sharp from 'sharp';
import * as path from 'path';

/**
 * Screenshot Annotator
 * Adds DevTools-style info overlays to screenshots
 */

export interface AnnotationConfig {
  element: {
    tagName: string;
    rect: { x: number; y: number; width: number; height: number };
    styles?: {
      color?: string;
      backgroundColor?: string;
      fontSize?: string;
      fontFamily?: string;
    };
    boxModel?: {
      margin?: { top: number; right: number; bottom: number; left: number };
      padding?: { top: number; right: number; bottom: number; left: number };
      border?: { top: number; right: number; bottom: number; left: number };
    };
  };
  accessibility?: {
    contrast?: number;
    name?: string;
    role?: string;
    keyboardFocusable?: boolean;
  };
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'auto';
}

export class ScreenshotAnnotator {
  /**
   * Add DevTools-style info overlay to screenshot
   */
  async annotateScreenshot(
    screenshotPath: string,
    config: AnnotationConfig,
    outputPath?: string,
    cropToElement?: boolean
  ): Promise<string> {
    const output = outputPath || screenshotPath.replace(/\.png$/, '-annotated.png');

    // Read the screenshot
    let image = sharp(screenshotPath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not read image dimensions');
    }

    let imageWidth = metadata.width;
    let imageHeight = metadata.height;
    let cropOffset = { x: 0, y: 0 };
    let adjustedConfig = config;

    // If cropping, calculate crop area and adjust coordinates
    if (cropToElement) {
      const { rect } = config.element;
      const tooltipWidth = 280;
      const lineHeight = 20;
      const tooltipPadding = 12;
      const approximateLines = 8 + (config.accessibility ? 5 : 0);
      const tooltipHeight = tooltipPadding * 2 + approximateLines * lineHeight;
      const gap = 20;
      const padding = 40;

      // Calculate tooltip position (same logic as in generateOverlaySVG)
      const positions = [
        { x: rect.x + rect.width + gap, y: rect.y, fits: (rect.x + rect.width + gap + tooltipWidth < metadata.width - 20) },
        { x: rect.x - tooltipWidth - gap, y: rect.y, fits: (rect.x - tooltipWidth - gap > 20) },
        { x: rect.x, y: rect.y - tooltipHeight - gap, fits: (rect.y - tooltipHeight - gap > 20) },
        { x: rect.x, y: rect.y + rect.height + gap, fits: true }
      ];
      const bestPosition = positions.find(p => p.fits) || positions[0];
      const tooltipX = Math.max(20, Math.min(bestPosition.x, metadata.width - tooltipWidth - 20));
      const tooltipY = Math.max(20, Math.min(bestPosition.y, metadata.height - tooltipHeight - 20));

      // Calculate crop area that includes both element and tooltip
      const minX = Math.max(0, Math.min(rect.x, tooltipX) - padding);
      const minY = Math.max(0, Math.min(rect.y, tooltipY) - padding);
      const maxX = Math.min(metadata.width, Math.max(rect.x + rect.width, tooltipX + tooltipWidth) + padding);
      const maxY = Math.min(metadata.height, Math.max(rect.y + rect.height, tooltipY + tooltipHeight) + padding);

      const cropWidth = maxX - minX;
      const cropHeight = maxY - minY;

      // Crop the base image first
      image = image.extract({
        left: Math.floor(minX),
        top: Math.floor(minY),
        width: Math.floor(cropWidth),
        height: Math.floor(cropHeight),
      });

      // Adjust config coordinates relative to crop
      cropOffset = { x: minX, y: minY };
      adjustedConfig = {
        ...config,
        element: {
          ...config.element,
          rect: {
            ...config.element.rect,
            x: config.element.rect.x - minX,
            y: config.element.rect.y - minY,
          },
        },
      };

      imageWidth = cropWidth;
      imageHeight = cropHeight;
    }

    // Generate the overlay SVG for the (possibly cropped) dimensions
    const { svg: overlay } = this.generateOverlaySVG(adjustedConfig, imageWidth, imageHeight);

    // Composite the overlay onto the (possibly cropped) screenshot
    const finalImage = image.composite([
      {
        input: Buffer.from(overlay),
        top: 0,
        left: 0,
      },
    ]);

    await finalImage.toFile(output);

    return output;
  }

  /**
   * Generate SVG overlay with element info
   */
  private generateOverlaySVG(config: AnnotationConfig, imageWidth: number, imageHeight: number): { svg: string; tooltipBounds?: { x: number; y: number; width: number; height: number } } {
    const { element, accessibility, position = 'auto' } = config;
    const { rect, tagName, styles, boxModel } = element;

    // Calculate tooltip position (smart positioning to avoid covering element)
    const tooltipWidth = 280;
    const tooltipPadding = 12;
    const gap = 20; // Gap between element and tooltip
    let tooltipX = rect.x;
    let tooltipY = rect.y;

    // Auto-position: choose best position to not obscure element
    if (position === 'auto') {
      // Calculate approximate tooltip height (will be refined later)
      const lineHeight = 20;
      const approximateLines = 8 + (accessibility ? 5 : 0);
      const tooltipHeight = tooltipPadding * 2 + approximateLines * lineHeight;

      // Try positions in order of preference: right, left, above, below
      const positions = [
        // Right of element
        {
          x: rect.x + rect.width + gap,
          y: rect.y,
          fits: (rect.x + rect.width + gap + tooltipWidth < imageWidth - 20) && (rect.y + tooltipHeight < imageHeight - 20)
        },
        // Left of element
        {
          x: rect.x - tooltipWidth - gap,
          y: rect.y,
          fits: (rect.x - tooltipWidth - gap > 20) && (rect.y + tooltipHeight < imageHeight - 20)
        },
        // Above element
        {
          x: rect.x,
          y: rect.y - tooltipHeight - gap,
          fits: (rect.y - tooltipHeight - gap > 20) && (rect.x + tooltipWidth < imageWidth - 20)
        },
        // Below element
        {
          x: rect.x,
          y: rect.y + rect.height + gap,
          fits: (rect.y + rect.height + gap + tooltipHeight < imageHeight - 20) && (rect.x + tooltipWidth < imageWidth - 20)
        }
      ];

      // Find first position that fits
      const bestPosition = positions.find(p => p.fits) || positions[0];
      tooltipX = Math.max(20, Math.min(bestPosition.x, imageWidth - tooltipWidth - 20));
      tooltipY = Math.max(20, Math.min(bestPosition.y, imageHeight - tooltipHeight - 20));
    }

    // Build info lines
    const lines: Array<{ label: string; value: string; color?: string }> = [];

    // Element name and dimensions
    lines.push({ label: tagName, value: `${Math.round(rect.width)} × ${Math.round(rect.height)}`, color: '#a855f7' });

    // Color
    if (styles?.color) {
      lines.push({ label: 'Color', value: this.formatColor(styles.color) });
    }

    // Font
    if (styles?.fontSize || styles?.fontFamily) {
      const fontParts = [];
      if (styles.fontSize) fontParts.push(styles.fontSize);
      if (styles.fontFamily) {
        const family = styles.fontFamily.split(',')[0].replace(/['"]/g, '');
        fontParts.push(family.length > 20 ? family.substring(0, 17) + '...' : family);
      }
      lines.push({ label: 'Font', value: fontParts.join(' ') });
    }

    // Margin
    if (boxModel?.margin) {
      const m = boxModel.margin;
      const marginStr = `${this.formatPx(m.top)} ${this.formatPx(m.right)} ${this.formatPx(m.bottom)} ${this.formatPx(m.left)}`;
      if (marginStr !== '0px 0px 0px 0px') {
        lines.push({ label: 'Margin', value: marginStr });
      }
    }

    // Accessibility section
    if (accessibility) {
      lines.push({ label: '', value: '', color: 'separator' });
      lines.push({ label: 'ACCESSIBILITY', value: '', color: '#9ca3af' });

      if (accessibility.contrast !== undefined) {
        const hasGoodContrast = accessibility.contrast >= 4.5;
        lines.push({
          label: 'Contrast',
          value: `Aa ${accessibility.contrast.toFixed(2)} ${hasGoodContrast ? '✓' : '✗'}`,
          color: hasGoodContrast ? '#10b981' : '#ef4444',
        });
      }

      if (accessibility.name) {
        lines.push({ label: 'Name', value: accessibility.name });
      }

      if (accessibility.role) {
        lines.push({ label: 'Role', value: accessibility.role });
      }

      if (accessibility.keyboardFocusable !== undefined) {
        lines.push({
          label: 'Keyboard-focusable',
          value: accessibility.keyboardFocusable ? '✓' : '✗',
          color: accessibility.keyboardFocusable ? '#10b981' : '#9ca3af',
        });
      }
    }

    // Calculate tooltip height
    const lineHeight = 20;
    const tooltipHeight = tooltipPadding * 2 + lines.length * lineHeight;

    // Generate SVG
    let svg = `<svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">`;

    // Draw element highlight box
    svg += `
      <rect
        x="${rect.x}"
        y="${rect.y}"
        width="${rect.width}"
        height="${rect.height}"
        fill="rgba(111, 168, 220, 0.3)"
        stroke="rgba(111, 168, 220, 0.8)"
        stroke-width="1"
      />
    `;

    // Draw tooltip background
    svg += `
      <rect
        x="${tooltipX}"
        y="${tooltipY}"
        width="${tooltipWidth}"
        height="${tooltipHeight}"
        rx="4"
        fill="rgba(255, 255, 255, 0.98)"
        stroke="rgba(0, 0, 0, 0.1)"
        stroke-width="1"
        filter="drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))"
      />
    `;

    // Draw info lines
    let currentY = tooltipY + tooltipPadding + 14;
    lines.forEach((line, index) => {
      if (line.color === 'separator') {
        // Draw separator line
        svg += `
          <line
            x1="${tooltipX + tooltipPadding}"
            y1="${currentY - 8}"
            x2="${tooltipX + tooltipWidth - tooltipPadding}"
            y2="${currentY - 8}"
            stroke="rgba(0, 0, 0, 0.1)"
            stroke-width="1"
          />
        `;
      } else if (line.label === 'ACCESSIBILITY') {
        // Section header
        svg += `
          <text
            x="${tooltipX + tooltipPadding}"
            y="${currentY}"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="10"
            font-weight="600"
            fill="#9ca3af"
            letter-spacing="0.5"
          >${line.label}</text>
        `;
      } else if (index === 0) {
        // First line (element name and dimensions) - larger and colored
        svg += `
          <text
            x="${tooltipX + tooltipPadding}"
            y="${currentY}"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="13"
            font-weight="600"
            fill="${line.color || '#000000'}"
          >${line.label}</text>
          <text
            x="${tooltipX + tooltipWidth - tooltipPadding}"
            y="${currentY}"
            text-anchor="end"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="13"
            font-weight="400"
            fill="#6b7280"
          >${line.value}</text>
        `;
      } else {
        // Regular info line
        const textColor = line.color || '#374151';
        svg += `
          <text
            x="${tooltipX + tooltipPadding}"
            y="${currentY}"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="11"
            font-weight="400"
            fill="#6b7280"
          >${line.label}</text>
          <text
            x="${tooltipX + tooltipWidth - tooltipPadding}"
            y="${currentY}"
            text-anchor="end"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="11"
            font-weight="400"
            fill="${textColor}"
          >${line.value}</text>
        `;
      }
      currentY += lineHeight;
    });

    svg += `</svg>`;
    return {
      svg,
      tooltipBounds: {
        x: tooltipX,
        y: tooltipY,
        width: tooltipWidth,
        height: tooltipHeight,
      },
    };
  }

  /**
   * Format color string for display
   */
  private formatColor(color: string): string {
    // Convert rgb(r,g,b) to hex if possible
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    return color;
  }

  /**
   * Format pixel value
   */
  private formatPx(value: number): string {
    return `${Math.round(value)}px`;
  }
}

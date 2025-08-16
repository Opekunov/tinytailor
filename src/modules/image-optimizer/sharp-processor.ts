import sharp from 'sharp';
import * as fs from 'fs-extra';
import { ImageMetadata } from '../../types';

export class SharpProcessor {
  async getMetadata(filePath: string): Promise<ImageMetadata> {
    try {
      const stats = await fs.stat(filePath);
      const metadata = await sharp(filePath).metadata();
      
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || '',
        size: stats.size,
      };
    } catch (error: unknown) {
      return {
        width: 0,
        height: 0,
        format: '',
        size: 0,
      };
    }
  }

  async recompressPng(
    srcPath: string,
    options: {
      sizeThreshold: number;
      pixelsThreshold: number;
      compressionLevel: number;
      effort: number;
      adaptiveFiltering: boolean;
    }
  ): Promise<{ compressed: boolean; originalSize: number; newSize: number }> {
    try {
      const stats = await fs.stat(srcPath);
      const metadata = await sharp(srcPath).metadata();
      
      if ((metadata.format || '').toLowerCase() !== 'png') {
        return { compressed: false, originalSize: stats.size, newSize: stats.size };
      }

      const pixels = (metadata.width || 0) * (metadata.height || 0);
      
      if (stats.size < options.sizeThreshold && pixels < options.pixelsThreshold) {
        return { compressed: false, originalSize: stats.size, newSize: stats.size };
      }

      const buffer = await sharp(srcPath)
        .png({
          compressionLevel: options.compressionLevel,
          effort: options.effort,
          adaptiveFiltering: options.adaptiveFiltering,
        })
        .toBuffer();

      // Only save if significantly smaller
      if (buffer.length + 1024 < stats.size) {
        await fs.writeFile(srcPath, buffer);
        return {
          compressed: true,
          originalSize: stats.size,
          newSize: buffer.length,
        };
      }

      return { compressed: false, originalSize: stats.size, newSize: stats.size };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`PNG recompression failed: ${errorMsg}`);
    }
  }

  async downscale(
    srcPath: string,
    destPath: string,
    targetWidth: number,
    quality: { jpg?: number; webp?: number; png?: boolean }
  ): Promise<{ created: boolean; originalSize: number; newSize: number }> {
    if (await fs.pathExists(destPath)) {
      const stats = await fs.stat(destPath);
      return { created: false, originalSize: 0, newSize: stats.size };
    }

    await fs.ensureDir(require('path').dirname(destPath));
    const originalStats = await fs.stat(srcPath);

    const { width } = await this.getMetadata(srcPath);
    
    // If original is smaller than target, just copy
    if (width && width <= targetWidth) {
      await fs.copy(srcPath, destPath);
      const newStats = await fs.stat(destPath);
      return {
        created: true,
        originalSize: originalStats.size,
        newSize: newStats.size,
      };
    }

    // Downscale the image
    const pipeline = sharp(srcPath).resize({ width: targetWidth, withoutEnlargement: true });
    const ext = require('path').extname(destPath).toLowerCase();

    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline.jpeg({ quality: quality.jpg || 78, mozjpeg: true });
    } else if (ext === '.png') {
      pipeline.png({ compressionLevel: 9, effort: 9, adaptiveFiltering: true });
    } else if (ext === '.webp') {
      pipeline.webp({ quality: quality.webp || 80 });
    }

    await pipeline.toFile(destPath);
    const newStats = await fs.stat(destPath);

    return {
      created: true,
      originalSize: originalStats.size,
      newSize: newStats.size,
    };
  }

  async convertToWebp(
    srcPath: string,
    destPath: string,
    quality: number = 80
  ): Promise<{ created: boolean; originalSize: number; newSize: number }> {
    if (await fs.pathExists(destPath)) {
      const stats = await fs.stat(destPath);
      return { created: false, originalSize: 0, newSize: stats.size };
    }

    await fs.ensureDir(require('path').dirname(destPath));
    const originalStats = await fs.stat(srcPath);

    await sharp(srcPath).webp({ quality }).toFile(destPath);
    const newStats = await fs.stat(destPath);

    return {
      created: true,
      originalSize: originalStats.size,
      newSize: newStats.size,
    };
  }
}
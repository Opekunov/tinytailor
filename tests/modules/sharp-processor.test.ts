import { SharpProcessor } from '../../src/modules/image-optimizer/sharp-processor';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('SharpProcessor', () => {
  let processor: SharpProcessor;
  let tempDir: string;
  let testImagePath: string;
  let largeImagePath: string;
  let smallImagePath: string;

  beforeEach(async () => {
    processor = new SharpProcessor();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sharp-test-'));
    
    // Copy test images to temp directory
    const fixturesDir = path.join(__dirname, '../fixtures/images');
    testImagePath = path.join(tempDir, 'test-image.png');
    largeImagePath = path.join(tempDir, 'large-test-image.png');
    smallImagePath = path.join(tempDir, 'small-test-image.jpg');
    
    await fs.copy(path.join(fixturesDir, 'test-image.png'), testImagePath);
    await fs.copy(path.join(fixturesDir, 'large-test-image.png'), largeImagePath);
    await fs.copy(path.join(fixturesDir, 'small-test-image.jpg'), smallImagePath);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('getMetadata', () => {
    it('should return correct metadata for PNG image', async () => {
      const metadata = await processor.getMetadata(testImagePath);
      
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(800);
      expect(metadata.format).toBe('png');
      expect(metadata.size).toBeGreaterThan(0);
    });

    it('should return correct metadata for JPG image', async () => {
      const metadata = await processor.getMetadata(smallImagePath);
      
      expect(metadata.width).toBe(500);
      expect(metadata.height).toBe(400);
      expect(metadata.format).toBe('jpeg');
      expect(metadata.size).toBeGreaterThan(0);
    });

    it('should return zeros for non-existent file', async () => {
      const metadata = await processor.getMetadata('non-existent.png');
      
      expect(metadata.width).toBe(0);
      expect(metadata.height).toBe(0);
      expect(metadata.format).toBe('');
      expect(metadata.size).toBe(0);
    });
  });

  describe('recompressPng', () => {
    it('should recompress large PNG when thresholds are met', async () => {
      const options = {
        sizeThreshold: 1000, // Very low threshold for testing
        pixelsThreshold: 100000, // Low threshold for testing
        compressionLevel: 9,
        effort: 9,
        adaptiveFiltering: true,
      };

      const originalSize = (await fs.stat(largeImagePath)).size;
      const result = await processor.recompressPng(largeImagePath, options);
      const newSize = (await fs.stat(largeImagePath)).size;

      expect(result.compressed).toBe(true);
      expect(result.originalSize).toBe(originalSize);
      expect(result.newSize).toBeLessThan(originalSize);
      expect(newSize).toBe(result.newSize);
    });

    it('should not recompress when thresholds are not met', async () => {
      const options = {
        sizeThreshold: 99999999, // Very high threshold
        pixelsThreshold: 99999999, // Very high threshold
        compressionLevel: 9,
        effort: 9,
        adaptiveFiltering: true,
      };

      const originalSize = (await fs.stat(testImagePath)).size;
      const result = await processor.recompressPng(testImagePath, options);

      expect(result.compressed).toBe(false);
      expect(result.originalSize).toBe(originalSize);
      expect(result.newSize).toBe(originalSize);
    });

    it('should not recompress non-PNG files', async () => {
      const options = {
        sizeThreshold: 1000,
        pixelsThreshold: 1000,
        compressionLevel: 9,
        effort: 9,
        adaptiveFiltering: true,
      };

      const originalSize = (await fs.stat(smallImagePath)).size;
      const result = await processor.recompressPng(smallImagePath, options);

      expect(result.compressed).toBe(false);
      expect(result.originalSize).toBe(originalSize);
      expect(result.newSize).toBe(originalSize);
    });
  });

  describe('downscale', () => {
    it('should downscale image when larger than target width', async () => {
      const destPath = path.join(tempDir, 'downscaled.png');
      const targetWidth = 640;

      const result = await processor.downscale(testImagePath, destPath, targetWidth, { jpg: 78 });

      expect(result.created).toBe(true);
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.newSize).toBeGreaterThan(0);
      
      const metadata = await processor.getMetadata(destPath);
      expect(metadata.width).toBe(targetWidth);
      expect(metadata.height).toBe(512); // Proportional height for 1000x800 -> 640x?
    });

    it('should copy image when smaller than target width', async () => {
      const destPath = path.join(tempDir, 'copied.jpg');
      const targetWidth = 640;

      const result = await processor.downscale(smallImagePath, destPath, targetWidth, { jpg: 78 });

      expect(result.created).toBe(true);
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.newSize).toBeGreaterThan(0);
      
      const metadata = await processor.getMetadata(destPath);
      expect(metadata.width).toBe(500); // Original width preserved
      expect(metadata.height).toBe(400); // Original height preserved
    });

    it('should not recreate existing file', async () => {
      const destPath = path.join(tempDir, 'existing.png');
      await fs.copy(testImagePath, destPath);

      const result = await processor.downscale(testImagePath, destPath, 640, { jpg: 78 });

      expect(result.created).toBe(false);
      expect(result.originalSize).toBe(0);
    });
  });

  describe('convertToWebp', () => {
    it('should convert image to WebP format', async () => {
      const destPath = path.join(tempDir, 'test.webp');
      
      const result = await processor.convertToWebp(testImagePath, destPath, 80);

      expect(result.created).toBe(true);
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.newSize).toBeGreaterThan(0);
      expect(await fs.pathExists(destPath)).toBe(true);
      
      const metadata = await processor.getMetadata(destPath);
      expect(metadata.format).toBe('webp');
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(800);
    });

    it('should not recreate existing WebP file', async () => {
      const destPath = path.join(tempDir, 'existing.webp');
      await processor.convertToWebp(testImagePath, destPath, 80);

      const result = await processor.convertToWebp(testImagePath, destPath, 80);

      expect(result.created).toBe(false);
    });
  });
});
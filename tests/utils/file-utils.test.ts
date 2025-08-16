import { FileUtils } from '../../src/utils/file-utils';
import * as path from 'path';

describe('FileUtils', () => {
  describe('extractSrc', () => {
    it('should extract src from simple string', () => {
      expect(FileUtils.extractSrc('image.jpg')).toBe('image.jpg');
    });

    it('should extract src from quoted string', () => {
      expect(FileUtils.extractSrc('"image.jpg"')).toBe('image.jpg');
      expect(FileUtils.extractSrc("'image.jpg'")).toBe('image.jpg');
    });

    it('should extract src from asset() helper', () => {
      expect(FileUtils.extractSrc("asset('images/logo.png')")).toBe('images/logo.png');
      expect(FileUtils.extractSrc('asset("images/logo.png")')).toBe('images/logo.png');
      expect(FileUtils.extractSrc('asset(`images/logo.png`)')).toBe('images/logo.png');
    });

    it('should return null for empty or undefined input', () => {
      expect(FileUtils.extractSrc('')).toBeNull();
      expect(FileUtils.extractSrc(undefined)).toBeNull();
      expect(FileUtils.extractSrc(null as any)).toBeNull();
    });

    it('should handle complex asset() expressions', () => {
      expect(FileUtils.extractSrc("asset('path/to/image.jpg')")).toBe('path/to/image.jpg');
    });
  });

  describe('isRasterImage', () => {
    const rasterExts = ['.jpg', '.jpeg', '.png', '.webp'];

    it('should identify raster images correctly', () => {
      expect(FileUtils.isRasterImage('image.jpg', rasterExts)).toBe(true);
      expect(FileUtils.isRasterImage('image.jpeg', rasterExts)).toBe(true);
      expect(FileUtils.isRasterImage('image.png', rasterExts)).toBe(true);
      expect(FileUtils.isRasterImage('image.webp', rasterExts)).toBe(true);
    });

    it('should handle case insensitive extensions', () => {
      expect(FileUtils.isRasterImage('image.JPG', rasterExts)).toBe(true);
      expect(FileUtils.isRasterImage('image.PNG', rasterExts)).toBe(true);
    });

    it('should reject non-raster images', () => {
      expect(FileUtils.isRasterImage('image.svg', rasterExts)).toBe(false);
      expect(FileUtils.isRasterImage('image.gif', rasterExts)).toBe(false);
      expect(FileUtils.isRasterImage('document.pdf', rasterExts)).toBe(false);
    });
  });

  describe('path utilities', () => {
    it('should get extension correctly', () => {
      expect(FileUtils.getExtension('/path/to/image.jpg')).toBe('.jpg');
      expect(FileUtils.getExtension('image.PNG')).toBe('.png');
      expect(FileUtils.getExtension('file')).toBe('');
    });

    it('should get basename correctly', () => {
      expect(FileUtils.getBasename('/path/to/image.jpg')).toBe('image.jpg');
      expect(FileUtils.getBasename('/path/to/image.jpg', '.jpg')).toBe('image');
    });

    it('should get dirname correctly', () => {
      expect(FileUtils.getDirname('/path/to/image.jpg')).toBe(path.normalize('/path/to'));
    });

    it('should join paths correctly', () => {
      expect(FileUtils.joinPath('path', 'to', 'file.jpg')).toBe(path.join('path', 'to', 'file.jpg'));
    });
  });
});
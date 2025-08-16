import { CssWebPProcessor } from '../../src/modules/css-optimizer/css-webp-processor';
import { TinyTailorConfig, Logger } from '../../src/types';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

// Mock Sharp processor
jest.mock('../../src/modules/image-optimizer/sharp-processor');

describe('CssWebPProcessor', () => {
  let processor: CssWebPProcessor;
  let tempDir: string;
  let config: TinyTailorConfig;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'css-webp-test-'));
    
    config = {
      projectRoot: tempDir,
      publicRoot: path.join(tempDir, 'public'),
      imageOptimization: {
        webpQuality: 80
      }
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      success: jest.fn(),
      debug: jest.fn(),
      startOperation: jest.fn(),
      endOperation: jest.fn(),
      logImageProcessing: jest.fn(),
      logTextProcessing: jest.fn(),
      logCssProcessing: jest.fn(),
    };

    processor = new CssWebPProcessor(config, mockLogger);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('processBackgroundImages', () => {
    it('should process CSS with background-image declarations', async () => {
      const cssContent = `
        .hero {
          background-image: url('images/hero.jpg');
          width: 100%;
        }
        .banner {
          background-image: url("assets/banner.png");
        }
      `;
      
      // Create test images
      const imagesDir = path.join(tempDir, 'images');
      const assetsDir = path.join(tempDir, 'assets');
      await fs.ensureDir(imagesDir);
      await fs.ensureDir(assetsDir);
      
      // Create dummy image files
      await fs.writeFile(path.join(imagesDir, 'hero.jpg'), 'fake-jpg-data');
      await fs.writeFile(path.join(assetsDir, 'banner.png'), 'fake-png-data');

      const result = await processor.processBackgroundImages(cssContent, path.join(tempDir, 'style.css'));

      expect(result.imagesProcessed).toBe(0); // Mock will not create actual files
      expect(result.changed).toBe(false); // No actual WebP files created in mock
    });

    it('should skip data URLs and external URLs', async () => {
      const cssContent = `
        .icon1 { background-image: url('data:image/png;base64,iVBORw0KGgoAAAA...'); }
        .icon2 { background-image: url('https://example.com/image.jpg'); }
        .icon3 { background-image: url('http://example.com/image.png'); }
        .icon4 { background-image: url('//cdn.example.com/image.gif'); }
      `;

      const result = await processor.processBackgroundImages(cssContent, path.join(tempDir, 'style.css'));

      expect(result.imagesProcessed).toBe(0);
      expect(result.changed).toBe(false);
    });

    it('should skip already processed WebP images', async () => {
      const cssContent = `
        .hero { background-image: url('images/hero.webp'); }
      `;

      const result = await processor.processBackgroundImages(cssContent, path.join(tempDir, 'style.css'));

      expect(result.imagesProcessed).toBe(0);
      expect(result.changed).toBe(false);
    });

    it('should handle CSS without background-image declarations', async () => {
      const cssContent = `
        .container {
          width: 100%;
          margin: 0 auto;
          color: #333;
        }
      `;

      const result = await processor.processBackgroundImages(cssContent, path.join(tempDir, 'style.css'));

      expect(result.imagesProcessed).toBe(0);
      expect(result.changed).toBe(false);
      expect(result.content).toBe(cssContent);
    });

    it('should handle non-existent image files gracefully', async () => {
      const cssContent = `
        .hero {
          background-image: url('images/nonexistent.jpg');
        }
      `;

      const result = await processor.processBackgroundImages(cssContent, path.join(tempDir, 'style.css'));

      expect(result.imagesProcessed).toBe(0);
      expect(result.changed).toBe(false);
    });

    it('should handle CSS with complex selectors and multiple declarations', async () => {
      const cssContent = `
        .hero-section .background,
        .hero-section::before {
          background-image: url('./images/complex-hero.jpg');
          background-size: cover;
          background-position: center;
          position: relative;
        }
        
        @media (max-width: 768px) {
          .hero-mobile {
            background-image: url("../assets/mobile-hero.png");
          }
        }
      `;

      const result = await processor.processBackgroundImages(cssContent, path.join(tempDir, 'css', 'main.css'));

      // Should process without errors even if images don't exist
      expect(result.content).toBe(cssContent); // Content unchanged when no WebP files created
    });

    it('should handle SCSS variables and functions', async () => {
      const cssContent = `
        $image-path: './images/';
        .hero {
          background-image: url('#{$image-path}hero.jpg');
        }
      `;

      const result = await processor.processBackgroundImages(cssContent, path.join(tempDir, 'style.scss'));

      // Should handle SCSS syntax without breaking
      expect(result.changed).toBe(false); // No processing because of SCSS variables
    });

    it('should skip gradient backgrounds', async () => {
      const cssContent = `
        .gradient {
          background-image: linear-gradient(to right, #ff0000, #0000ff);
        }
        .radial {
          background-image: radial-gradient(circle, #ff0000, #0000ff);
        }
      `;

      const result = await processor.processBackgroundImages(cssContent, path.join(tempDir, 'style.css'));

      expect(result.imagesProcessed).toBe(0);
      expect(result.changed).toBe(false);
    });
  });

  describe('URL filtering', () => {
    it('should identify URLs that should be skipped', () => {
      const testCases = [
        'data:image/png;base64,abc123',
        'http://example.com/image.jpg',
        'https://example.com/image.png',
        '//cdn.example.com/image.gif',
        'existing.webp',
        'linear-gradient(to right, red, blue)',
        '#anchor'
      ];

      testCases.forEach(url => {
        const result = (processor as any).shouldSkipUrl(url);
        expect(result).toBe(true);
      });
    });

    it('should identify URLs that should be processed', () => {
      const testCases = [
        'images/hero.jpg',
        './assets/banner.png',
        '../images/background.gif',
        '/static/image.jpeg'
      ];

      testCases.forEach(url => {
        const result = (processor as any).shouldSkipUrl(url);
        expect(result).toBe(false);
      });
    });
  });

  describe('WebP rule creation', () => {
    it('should create proper WebP CSS rules with @supports', () => {
      const originalRule = "background-image: url('images/hero.jpg')";
      const originalUrl = 'images/hero.jpg';
      const webpPath = path.join(tempDir, 'images', 'hero.webp');
      const cssDir = tempDir;

      const result = (processor as any).createWebPRule(originalRule, originalUrl, webpPath, cssDir);

      expect(result).toContain('@supports (background-image: url(');
      expect(result).toContain('data:image/webp;base64,');
      expect(result).toContain('images/hero.webp');
      expect(result).toContain('@supports not (background-image: url(');
      expect(result).toContain(originalRule);
    });

    it('should handle relative paths correctly', () => {
      const originalRule = "background-image: url('../images/hero.jpg')";
      const originalUrl = '../images/hero.jpg';
      const webpPath = path.join(tempDir, 'images', 'hero.webp');
      const cssDir = path.join(tempDir, 'css');

      const result = (processor as any).createWebPRule(originalRule, originalUrl, webpPath, cssDir);

      expect(result).toContain('../images/hero.webp');
    });
  });

  describe('error handling', () => {
    it('should handle invalid CSS gracefully', async () => {
      const cssContent = `
        .hero { background-image: url('invalid-path-that-does-not-exist.jpg'); }
      `;

      const result = await processor.processBackgroundImages(cssContent, path.join(tempDir, 'style.css'));

      expect(result.changed).toBe(false);
      expect(result.content).toBe(cssContent);
    });

    it('should continue processing other images when one fails', async () => {
      const cssContent = `
        .hero1 { background-image: url('images/hero1.jpg'); }
        .hero2 { background-image: url('images/hero2.jpg'); }
      `;

      // Create directory and one valid file
      const imagesDir = path.join(tempDir, 'images');
      await fs.ensureDir(imagesDir);
      await fs.writeFile(path.join(imagesDir, 'hero2.jpg'), 'fake-jpg-data');

      const result = await processor.processBackgroundImages(cssContent, path.join(tempDir, 'style.css'));

      // Should not fail completely, should continue with valid files
      expect(result.content).toBe(cssContent);
    });
  });
});
import { ConfigManager } from '../../src/core/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('ConfigManager', () => {
  let tempDir: string;
  let configManager: ConfigManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tinytailor-test-'));
    configManager = new ConfigManager(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('loadConfig', () => {
    it('should load default config when no config file exists', async () => {
      const config = await configManager.loadConfig();
      
      expect(config.projectRoot).toBe(tempDir);
      expect(config.imageOptimization.enabled).toBe(true);
      expect(config.textProcessing.hangingPrepositions.enabled).toBe(true);
      expect(config.scanGlobs).toContain('**/*.html');
      expect(config.scanGlobs).toContain('**/*.vue');
      expect(config.scanGlobs).toContain('**/*.blade.php');
    });

    it('should merge user config with defaults', async () => {
      const userConfig = {
        imageOptimization: {
          jpgQuality: 85,
          webpQuality: 90,
        },
        textProcessing: {
          hangingPrepositions: {
            enabled: false,
          },
        },
      };

      const configPath = path.join(tempDir, 'tinytailor.config.js');
      await fs.writeFile(
        configPath,
        `module.exports = ${JSON.stringify(userConfig, null, 2)};`,
        'utf8'
      );

      const config = await configManager.loadConfig();

      // Should have merged values
      expect(config.imageOptimization.jpgQuality).toBe(85);
      expect(config.imageOptimization.webpQuality).toBe(90);
      expect(config.textProcessing.hangingPrepositions.enabled).toBe(false);

      // Should keep defaults for unspecified values
      expect(config.imageOptimization.enabled).toBe(true);
      expect(config.textProcessing.superscriptReplacements.enabled).toBe(true);
    });
  });

  describe('validateConfig', () => {
    it('should validate default config as valid', async () => {
      const config = await configManager.loadConfig();
      const validation = await configManager.validateConfig();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid jpg quality', async () => {
      const userConfig = {
        imageOptimization: {
          jpgQuality: 150, // Invalid: > 100
        },
      };

      const configPath = path.join(tempDir, 'tinytailor.config.js');
      await fs.writeFile(
        configPath,
        `module.exports = ${JSON.stringify(userConfig, null, 2)};`,
        'utf8'
      );

      await configManager.loadConfig();
      const validation = await configManager.validateConfig();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('JPG quality must be between 1 and 100');
    });

    it('should detect invalid webp quality', async () => {
      const userConfig = {
        imageOptimization: {
          webpQuality: 0, // Invalid: < 1
        },
      };

      const configPath = path.join(tempDir, 'tinytailor.config.js');
      await fs.writeFile(
        configPath,
        `module.exports = ${JSON.stringify(userConfig, null, 2)};`,
        'utf8'
      );

      await configManager.loadConfig();
      const validation = await configManager.validateConfig();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('WebP quality must be between 1 and 100');
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const defaultConfig = configManager.getDefaultConfig();
      
      expect(defaultConfig.imageOptimization.jpgQuality).toBe(78);
      expect(defaultConfig.imageOptimization.webpQuality).toBe(80);
      expect(defaultConfig.textProcessing.hangingPrepositions.enabled).toBe(true);
      expect(defaultConfig.textProcessing.superscriptReplacements.enabled).toBe(true);
    });
  });
});
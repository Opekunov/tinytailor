import { runCommand } from '../../../src/cli/commands/run';
import { ConfigManager } from '../../../src/core/config';
import { TinyTailorProcessor } from '../../../src/core/processor';
import { TinyTailorLogger } from '../../../src/utils/logger';
import { InteractiveMenu } from '../../../src/cli/interactive-menu';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

// Mock dependencies
jest.mock('../../../src/core/config');
jest.mock('../../../src/core/processor');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/cli/interactive-menu');
jest.mock('chalk', () => {
  const mockChalk = jest.fn((str: string) => str) as any;
  mockChalk.red = jest.fn((str: string) => str);
  mockChalk.red.bold = jest.fn((str: string) => str);
  return {
    __esModule: true,
    default: mockChalk
  };
});

const MockedConfigManager = ConfigManager as jest.MockedClass<typeof ConfigManager>;
const MockedProcessor = TinyTailorProcessor as jest.MockedClass<typeof TinyTailorProcessor>;
const MockedLogger = TinyTailorLogger as jest.MockedClass<typeof TinyTailorLogger>;
const MockedMenu = InteractiveMenu as jest.MockedClass<typeof InteractiveMenu>;

describe('Run Command', () => {
  let tempDir: string;
  let mockConfigManager: jest.Mocked<ConfigManager>;
  let mockProcessor: jest.Mocked<TinyTailorProcessor>;
  let mockLogger: jest.Mocked<TinyTailorLogger>;
  let mockMenu: jest.Mocked<InteractiveMenu>;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tinytailor-run-test-'));
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    // Setup mocks
    mockConfigManager = new MockedConfigManager() as jest.Mocked<ConfigManager>;
    mockProcessor = new MockedProcessor({} as any, {} as any) as jest.Mocked<TinyTailorProcessor>;
    mockLogger = new MockedLogger() as jest.Mocked<TinyTailorLogger>;
    mockMenu = new MockedMenu() as jest.Mocked<InteractiveMenu>;

    // Mock constructors
    MockedConfigManager.mockImplementation(() => mockConfigManager);
    MockedProcessor.mockImplementation(() => mockProcessor);
    MockedLogger.mockImplementation(() => mockLogger);
    MockedMenu.mockImplementation(() => mockMenu);

    // Default mock implementations
    mockConfigManager.loadConfig.mockResolvedValue({
      projectRoot: tempDir,
      publicRoot: path.join(tempDir, 'public'),
      logging: {
        console: true,
        markdownReport: true,
        reportDir: 'reports',
      },
    } as any);

    mockConfigManager.validateConfig.mockResolvedValue({
      valid: true,
      errors: [],
    });

    mockProcessor.processFiles.mockResolvedValue({
      changedFiles: 0,
      totalFiles: 0,
      images: { processed: 0, webpConverted: 0, downscaled: 0, recompressed: 0 },
      text: { hangingPrepositionsFixed: 0, superscriptReplacements: 0 },
      css: { processed: 0, backgroundImagesProcessed: 0, webpRulesAdded: 0 },
      errors: [],
      warnings: [],
    });

    mockLogger.info.mockImplementation(() => {});
    mockLogger.generateReport.mockResolvedValue();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    jest.restoreAllMocks();
  });

  describe('configuration validation', () => {
    it('should load and validate configuration', async () => {
      mockMenu.showMainMenu.mockResolvedValue(['image-optimization']);

      await runCommand({ skipMenu: true, modules: ['image-optimization'] });

      expect(mockConfigManager.loadConfig).toHaveBeenCalled();
      expect(mockConfigManager.validateConfig).toHaveBeenCalled();
    });

    it('should exit when configuration is invalid', async () => {
      mockConfigManager.validateConfig.mockResolvedValue({
        valid: false,
        errors: ['Invalid project root', 'Missing public directory'],
      });

      await runCommand({ skipMenu: true, modules: ['image-optimization'] });

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Configuration errors')
      );
    });

    it('should use custom config path when provided', async () => {
      const customConfigPath = path.join(tempDir, 'custom.config.js');
      
      await runCommand({ 
        config: customConfigPath, 
        skipMenu: true, 
        modules: ['image-optimization'] 
      });

      expect(MockedConfigManager).toHaveBeenCalledWith(customConfigPath);
    });
  });

  describe('module selection', () => {
    it('should use command line modules when skipMenu is true', async () => {
      await runCommand({ 
        skipMenu: true, 
        modules: ['image-optimization', 'text-processing'] 
      });

      expect(mockProcessor.processFiles).toHaveBeenCalledWith([
        'image-optimization', 
        'text-processing'
      ]);
      expect(mockMenu.showMainMenu).not.toHaveBeenCalled();
    });

    it('should filter invalid modules from command line', async () => {
      await runCommand({ 
        skipMenu: true, 
        modules: ['image-optimization', 'invalid-module', 'text-processing'] 
      });

      expect(mockProcessor.processFiles).toHaveBeenCalledWith([
        'image-optimization', 
        'text-processing'
      ]);
    });

    it('should show interactive menu when not skipping menu', async () => {
      mockMenu.showMainMenu.mockResolvedValue(['size-checking']);

      await runCommand({ skipMenu: false });

      expect(mockMenu.showMainMenu).toHaveBeenCalled();
      expect(mockProcessor.processFiles).toHaveBeenCalledWith(['size-checking']);
    });

    it('should exit when no modules selected in interactive mode', async () => {
      mockMenu.showMainMenu.mockResolvedValue([]);

      await runCommand({ skipMenu: false });

      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });

  describe.skip('processing', () => {
    it('should initialize processor with config and logger', async () => {
      const config = {
        projectRoot: tempDir,
        logging: { console: true, markdownReport: true, reportDir: 'reports' },
      };
      mockConfigManager.loadConfig.mockResolvedValue(config as any);

      await runCommand({ skipMenu: true, modules: ['image-optimization'] });

      expect(MockedProcessor).toHaveBeenCalledWith(config, mockLogger);
      expect(MockedLogger).toHaveBeenCalledWith(true, true, 'reports');
    });

    it('should process files and generate report', async () => {
      const result = {
        changedFiles: 5,
        totalFiles: 10,
        images: { processed: 3, webpConverted: 2, downscaled: 1, recompressed: 0 },
        text: { hangingPrepositionsFixed: 10, superscriptReplacements: 5 },
        css: { processed: 2, backgroundImagesProcessed: 3, webpRulesAdded: 3 },
        errors: [],
        warnings: [],
      };

      mockProcessor.processFiles.mockResolvedValue(result);

      await runCommand({ skipMenu: true, modules: ['image-optimization'] });

      expect(mockProcessor.processFiles).toHaveBeenCalledWith(['image-optimization']);
      expect(mockLogger.generateReport).toHaveBeenCalledWith(result);
    });

    it('should handle processing errors gracefully', async () => {
      mockProcessor.processFiles.mockRejectedValue(new Error('Processing failed'));

      await expect(runCommand({ 
        skipMenu: true, 
        modules: ['image-optimization'] 
      })).rejects.toThrow('Processing failed');
    });
  });

  describe('logger initialization', () => {
    it('should initialize logger with correct settings', async () => {
      const config = {
        projectRoot: tempDir,
        logging: {
          console: false,
          markdownReport: true,
          reportDir: 'custom_reports',
        },
      };
      mockConfigManager.loadConfig.mockResolvedValue(config as any);

      await runCommand({ skipMenu: true, modules: ['text-processing'] });

      expect(MockedLogger).toHaveBeenCalledWith(false, true, 'custom_reports');
    });

    it('should log initialization messages', async () => {
      const config = {
        projectRoot: tempDir,
        publicRoot: path.join(tempDir, 'public'),
        logging: { console: true, markdownReport: true, reportDir: 'reports' },
      };
      mockConfigManager.loadConfig.mockResolvedValue(config as any);

      await runCommand({ skipMenu: true, modules: ['image-optimization'] });

      expect(mockLogger.info).toHaveBeenCalledWith('🎯 TinyTailor initialized');
      expect(mockLogger.info).toHaveBeenCalledWith(`Project root: ${tempDir}`);
      expect(mockLogger.info).toHaveBeenCalledWith(`Public root: ${path.join(tempDir, 'public')}`);
    });
  });

  describe.skip('edge cases', () => {
    it('should handle undefined modules gracefully', async () => {
      mockMenu.showMainMenu.mockResolvedValue(['image-optimization']);

      await runCommand({});

      expect(mockMenu.showMainMenu).toHaveBeenCalled();
    });

    it('should handle empty modules array', async () => {
      await runCommand({ skipMenu: true, modules: [] });

      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });
});
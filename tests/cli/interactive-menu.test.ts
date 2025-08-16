import { InteractiveMenu } from '../../src/cli/interactive-menu';
import inquirer from 'inquirer';

// Mock dependencies
jest.mock('inquirer');
jest.mock('chalk', () => ({
  cyan: Object.assign(jest.fn(x => x), { bold: jest.fn(x => x) }),
  green: Object.assign(jest.fn(x => x), { bold: jest.fn(x => x) }),
  yellow: Object.assign(jest.fn(x => x), { bold: jest.fn(x => x) }),
  red: Object.assign(jest.fn(x => x), { bold: jest.fn(x => x) }),
  blue: Object.assign(jest.fn(x => x), { bold: jest.fn(x => x) }),
  gray: jest.fn(x => x),
}));

const mockedInquirer = inquirer as jest.Mocked<typeof inquirer>;

describe('InteractiveMenu', () => {
  let menu: InteractiveMenu;

  beforeEach(() => {
    menu = new InteractiveMenu();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Clear all mock calls
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('showMainMenu', () => {
    it('should show module selection and return selected modules', async () => {
      mockedInquirer.prompt.mockResolvedValue({
        selectedModules: ['image-optimization', 'text-processing-prepositions']
      });

      const result = await menu.showMainMenu();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🎯 TinyTailor Processing Options')
      );

      expect(mockedInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'checkbox',
          name: 'selectedModules',
          message: 'Select processing modules to run:',
          choices: [
            {
              name: '🖼️  Image optimization (WebP conversion, mobile versions, compression)',
              value: 'image-optimization',
              checked: false,
            },
            {
              name: '📝 Fix hanging prepositions (replace spaces with &nbsp;)',
              value: 'text-processing-prepositions',
              checked: false,
            },
            {
              name: '🔢 Convert units to superscript (m² → m<sup>2</sup>)',
              value: 'text-processing-superscript',
              checked: false,
            },
            {
              name: '📏 Check image sizes vs CSS (experimental)',
              value: 'size-checking',
              checked: false,
            },
            {
              name: '🎨 CSS WebP Optimization',
              value: 'css-optimization',
              checked: false,
            },
            {
              name: '🚀 Run all enabled modules',
              value: 'all',
              checked: false,
            },
          ],
          validate: expect.any(Function),
        },
      ]);

      expect(result).toEqual(['image-optimization', 'text-processing']);
    });

    it('should validate that at least one module is selected', async () => {
      mockedInquirer.prompt.mockResolvedValue({ selectedModules: [] });

      await menu.showMainMenu();

      const promptCall = mockedInquirer.prompt.mock.calls[0][0] as any;
      const validator = promptCall[0].validate;

      expect(validator([])).toBe('You must choose at least one processing module.');
      expect(validator(['image-optimization'])).toBe(true);
    });

    it('should convert "all" selection to all modules', async () => {
      mockedInquirer.prompt.mockResolvedValue({
        selectedModules: ['all']
      });

      const result = await menu.showMainMenu();

      expect(result).toEqual(['image-optimization', 'text-processing', 'size-checking', 'css-optimization']);
    });

    it('should handle text processing sub-modules correctly', async () => {
      mockedInquirer.prompt.mockResolvedValue({
        selectedModules: ['text-processing-prepositions', 'text-processing-superscript']
      });

      const result = await menu.showMainMenu();

      expect(result).toEqual(['text-processing']);
    });

    it('should store text processing preferences globally', async () => {
      mockedInquirer.prompt.mockResolvedValue({
        selectedModules: ['text-processing-prepositions']
      });

      await menu.showMainMenu();

      expect((global as any).textProcessingPreferences).toEqual({
        prepositions: true,
        superscript: false,
      });
    });
  });

  describe('confirmProcessing', () => {
    it('should show file count and ask for confirmation', async () => {
      mockedInquirer.prompt.mockResolvedValue({ confirm: true });

      const result = await menu.confirmProcessing(42);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('About to process 42 files')
      );

      expect(mockedInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Continue with processing?',
          default: true,
        },
      ]);

      expect(result).toBe(true);
    });

    it('should return false when user declines', async () => {
      mockedInquirer.prompt.mockResolvedValue({ confirm: false });

      const result = await menu.confirmProcessing(10);

      expect(result).toBe(false);
    });
  });

  describe('askForConfigPath', () => {
    it('should return null when user chooses default config', async () => {
      mockedInquirer.prompt.mockResolvedValue({ hasCustomConfig: false });

      const result = await menu.askForConfigPath();

      expect(result).toBe(null);
    });

    it('should ask for custom config path when user chooses custom', async () => {
      mockedInquirer.prompt
        .mockResolvedValueOnce({ hasCustomConfig: true })
        .mockResolvedValueOnce({ configPath: 'custom.config.js' });

      const result = await menu.askForConfigPath();

      expect(mockedInquirer.prompt).toHaveBeenCalledTimes(2);
      expect(result).toBe('custom.config.js');
    });

    it('should validate config path input', async () => {
      mockedInquirer.prompt
        .mockResolvedValueOnce({ hasCustomConfig: true })
        .mockResolvedValueOnce({ configPath: 'custom.config.js' });

      await menu.askForConfigPath();

      // Get the second prompt call (config path input)
      const secondPromptArgs = mockedInquirer.prompt.mock.calls[1][0] as any;
      const validator = secondPromptArgs[0].validate;

      expect(validator('  ')).toBe('Config path cannot be empty.');
      expect(validator('config.js')).toBe(true);
    });

    it('should trim config path', async () => {
      mockedInquirer.prompt
        .mockResolvedValueOnce({ hasCustomConfig: true })
        .mockResolvedValueOnce({ configPath: '  custom.config.js  ' });

      const result = await menu.askForConfigPath();

      expect(result).toBe('custom.config.js');
    });
  });

  describe('display methods', () => {
    it('should show processing start message', () => {
      menu.showProcessingStart();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🚀 Starting processing')
      );
    });

    it('should show processing complete with statistics', () => {
      menu.showProcessingComplete(15, 50, 2.45);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✨ Processing completed!')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Files processed: 15/50')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Duration: 2.45s')
      );
    });

    it('should show error message', () => {
      menu.showError('Something went wrong');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error occurred')
      );
      expect(console.log).toHaveBeenCalledWith(
        'Something went wrong'
      );
    });

    it('should show warning message', () => {
      menu.showWarning('This is a warning');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  Warning')
      );
      expect(console.log).toHaveBeenCalledWith(
        'This is a warning'
      );
    });

    it('should show info message', () => {
      menu.showInfo('This is information');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️  Information')
      );
      expect(console.log).toHaveBeenCalledWith(
        'This is information'
      );
    });
  });

  describe('error handling', () => {
    it('should handle inquirer prompt errors', async () => {
      mockedInquirer.prompt.mockRejectedValue(new Error('Prompt failed'));

      await expect(menu.showMainMenu()).rejects.toThrow('Prompt failed');
    });

    it('should handle undefined prompt response', async () => {
      mockedInquirer.prompt.mockResolvedValue({ selectedModules: null });

      const result = await menu.showMainMenu();

      expect(result).toEqual([]);
    });
  });
});
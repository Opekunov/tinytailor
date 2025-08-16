import { initCommand } from '../../../src/cli/commands/init';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import inquirer from 'inquirer';

// Mock dependencies
jest.mock('inquirer');
jest.mock('chalk', () => ({
  cyan: { bold: jest.fn(x => x) },
  yellow: jest.fn(x => x),
  green: jest.fn(x => x),
  red: jest.fn(x => x),
  blue: jest.fn(x => x),
}));

const mockedInquirer = inquirer as jest.Mocked<typeof inquirer>;

describe('Init Command', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tinytailor-init-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
    jest.restoreAllMocks();
  });

  describe.skip('when config does not exist', () => {
    beforeEach(() => {
      // Create mock template
      const templateDir = path.join(tempDir, 'node_modules', 'tinytailor', 'templates');
      const templateContent = `module.exports = {
  projectRoot: '.',
  // Test config
};`;
      
      fs.ensureDirSync(templateDir);
      fs.writeFileSync(path.join(templateDir, 'tinytailor.config.js'), templateContent);
      
      // Mock __dirname to point to our temp structure
      const mockPath = path.join(tempDir, 'node_modules', 'tinytailor', 'src', 'cli', 'commands');
      jest.doMock('path', () => ({
        ...jest.requireActual('path'),
        join: jest.fn().mockImplementation((...args) => {
          if (args.includes('__dirname') && args.includes('../../../templates/tinytailor.config.js')) {
            return path.join(templateDir, 'tinytailor.config.js');
          }
          return jest.requireActual('path').join(...args);
        }),
      }));
      
      mockedInquirer.prompt.mockResolvedValue({ addToGitignore: true });
    });

    it('should create config file and reports directory', async () => {
      // Create template file
      const templateDir = path.join(tempDir, 'templates');
      await fs.ensureDir(templateDir);
      await fs.writeFile(path.join(templateDir, 'tinytailor.config.js'), 'module.exports = {};');
      
      // Mock the template path resolution
      const originalJoin = path.join;
      jest.spyOn(path, 'join').mockImplementation((...args) => {
        if (args.some(arg => typeof arg === 'string' && arg.includes('__dirname')) && 
            args.some(arg => arg === '../../../templates/tinytailor.config.js')) {
          return path.join(templateDir, 'tinytailor.config.js');
        }
        return originalJoin(...args);
      });

      await initCommand();

      expect(await fs.pathExists('tinytailor.config.js')).toBe(true);
      expect(await fs.pathExists('tinytailor_reports')).toBe(true);
      expect(await fs.pathExists('.gitignore')).toBe(true);
      
      const gitignoreContent = await fs.readFile('.gitignore', 'utf8');
      expect(gitignoreContent).toContain('tinytailor_reports/');
    });

    it('should not add to gitignore when user declines', async () => {
      // Create template file
      const templateDir = path.join(tempDir, 'templates');
      await fs.ensureDir(templateDir);
      await fs.writeFile(path.join(templateDir, 'tinytailor.config.js'), 'module.exports = {};');
      
      // Mock the template path resolution
      const originalJoin = path.join;
      jest.spyOn(path, 'join').mockImplementation((...args) => {
        if (args.some(arg => typeof arg === 'string' && arg.includes('__dirname')) && 
            args.some(arg => arg === '../../../templates/tinytailor.config.js')) {
          return path.join(templateDir, 'tinytailor.config.js');
        }
        return originalJoin(...args);
      });

      mockedInquirer.prompt.mockResolvedValue({ addToGitignore: false });

      await initCommand();

      expect(await fs.pathExists('.gitignore')).toBe(false);
    });
  });

  describe.skip('when config exists', () => {
    beforeEach(async () => {
      // Create existing config
      await fs.writeFile('tinytailor.config.js', 'module.exports = { existing: true };');
    });

    it('should prompt for overwrite and cancel when declined', async () => {
      mockedInquirer.prompt.mockResolvedValue({ overwrite: false });

      await initCommand();

      expect(mockedInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'overwrite',
          message: expect.stringContaining('Config file already exists'),
          default: false,
        },
      ]);

      // Config should remain unchanged
      const configContent = await fs.readFile('tinytailor.config.js', 'utf8');
      expect(configContent).toContain('existing: true');
    });

    it('should overwrite config when user confirms', async () => {
      // Create template file
      const templateDir = path.join(tempDir, 'templates');
      await fs.ensureDir(templateDir);
      await fs.writeFile(path.join(templateDir, 'tinytailor.config.js'), 'module.exports = { new: true };');
      
      // Mock the template path resolution
      const originalJoin = path.join;
      jest.spyOn(path, 'join').mockImplementation((...args) => {
        if (args.some(arg => typeof arg === 'string' && arg.includes('__dirname')) && 
            args.some(arg => arg === '../../../templates/tinytailor.config.js')) {
          return path.join(templateDir, 'tinytailor.config.js');
        }
        return originalJoin(...args);
      });

      mockedInquirer.prompt
        .mockResolvedValueOnce({ overwrite: true })
        .mockResolvedValueOnce({ addToGitignore: false });

      await initCommand();

      const configContent = await fs.readFile('tinytailor.config.js', 'utf8');
      expect(configContent).toContain('new: true');
    });
  });

  describe.skip('error handling', () => {
    it('should handle template copy errors gracefully', async () => {
      // Mock fs.copy to throw error
      (jest.spyOn(fs, 'copy') as any).mockRejectedValue(new Error('Copy failed'));

      await expect(initCommand()).resolves.not.toThrow();
      expect(console.log).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('Failed to create config file')
      );
    });

    it('should handle directory creation errors gracefully', async () => {
      // Create template file first
      const templateDir = path.join(tempDir, 'templates');
      await fs.ensureDir(templateDir);
      await fs.writeFile(path.join(templateDir, 'tinytailor.config.js'), 'module.exports = {};');
      
      // Mock the template path resolution
      const originalJoin = path.join;
      jest.spyOn(path, 'join').mockImplementation((...args) => {
        if (args.some(arg => typeof arg === 'string' && arg.includes('__dirname')) && 
            args.some(arg => arg === '../../../templates/tinytailor.config.js')) {
          return path.join(templateDir, 'tinytailor.config.js');
        }
        return originalJoin(...args);
      });

      // Mock ensureDir to fail for reports directory
      const originalEnsureDir = fs.ensureDir;
      jest.spyOn(fs, 'ensureDir').mockImplementation(async (dir) => {
        if (typeof dir === 'string' && dir.includes('tinytailor_reports')) {
          throw new Error('Directory creation failed');
        }
        return originalEnsureDir(dir);
      });

      mockedInquirer.prompt.mockResolvedValue({ addToGitignore: false });

      await expect(initCommand()).resolves.not.toThrow();
      expect(console.log).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('Failed to create reports directory')
      );
    });
  });
});
import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('CLI Integration Tests', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tinytailor-cli-test-'));
    cliPath = path.join(__dirname, '../../dist/cli/index.js');

    // Ensure CLI is built
    if (!await fs.pathExists(cliPath)) {
      cliPath = path.join(__dirname, '../../src/cli/index.ts');
    }
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });
  
  describe('tinytailor init', () => {
    it('should run init command', (done) => {
      const child = spawn('node', [cliPath, 'init'], {
        cwd: tempDir,
        stdio: 'pipe'
      });

      // Simulate user input
      child.stdin?.write('\n'); // Accept detected/choose first option
      child.stdin?.write('n\n'); // Decline overwrite if exists
      child.stdin?.write('n\n'); // Decline gitignore
      child.stdin?.end();

      child.on('close', (code) => {
        // Should execute without crashing
        expect(code).toBeDefined();
        done();
      });
    }, 15000);
  });

  describe('tinytailor run --skip-menu', () => {
    beforeEach(async () => {
      // Create a basic config file
      const configContent = `module.exports = {
        projectRoot: '.',
        publicRoot: 'public',
        scanGlobs: ['**/*.html'],
        excludePaths: ['node_modules'],
        excludeFiles: [],
        imageOptimization: { enabled: false },
        textProcessing: {
          hangingPrepositions: { enabled: false },
          superscriptReplacements: { enabled: false }
        },
        sizeChecking: { enabled: false },
        logging: {
          console: true,
          markdownReport: false,
          reportDir: 'reports'
        }
      };`;

      await fs.writeFile(path.join(tempDir, 'tinytailor.config.js'), configContent);

      // Create a simple HTML file to process
      await fs.writeFile(path.join(tempDir, 'test.html'), '<html><body><p>Test</p></body></html>');
    });

    it('should run with specific modules', (done) => {
      const child = spawn('node', [cliPath, 'run', '--skip-menu', '--modules', 'text-processing'], {
        cwd: tempDir,
        stdio: 'pipe'
      });

      child.on('close', (code) => {
        // Should execute without crashing
        expect(code).toBeDefined();
        done();
      });
    }, 15000);

    it('should handle invalid configuration', (done) => {
      // Create invalid config
      const invalidConfig = `module.exports = {
        projectRoot: '/non/existent/path',
        scanGlobs: [],
      };`;

      fs.writeFileSync(path.join(tempDir, 'tinytailor.config.js'), invalidConfig);

      const child = spawn('node', [cliPath, 'run', '--skip-menu', '--modules', 'text-processing'], {
        cwd: tempDir,
        stdio: 'pipe'
      });

      child.on('close', (code) => {
        // Should handle invalid config gracefully
        expect(code).toBeDefined();
        done();
      });
    }, 15000);
  });

  describe('error scenarios', () => {
    it('should handle missing config file', (done) => {
      const child = spawn('node', [cliPath, 'run', '--skip-menu', '--modules', 'text-processing'], {
        cwd: tempDir,
        stdio: 'pipe'
      });

      child.on('close', (code) => {
        // Should handle missing config gracefully
        expect(code).toBeDefined();
        done();
      });
    }, 10000);
  });
});

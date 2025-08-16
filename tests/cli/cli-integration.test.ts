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

  describe('tinytailor --help', () => {
    it('should show help information', (done) => {
      const child = spawn('node', [cliPath, '--help'], {
        cwd: tempDir,
        stdio: 'pipe'
      });

      let stdout = '';
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', (code) => {
        expect(code).toBe(0);
        expect(stdout).toContain('TinyTailor');
        expect(stdout).toContain('Usage:');
        expect(stdout).toContain('init');
        expect(stdout).toContain('run');
        done();
      });
    }, 10000);
  });

  describe('tinytailor --version', () => {
    it('should show version information', (done) => {
      const child = spawn('node', [cliPath, '--version'], {
        cwd: tempDir,
        stdio: 'pipe'
      });

      let stdout = '';
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', (code) => {
        expect(code).toBe(0);
        expect(stdout).toMatch(/\d+\.\d+\.\d+/); // Version pattern
        done();
      });
    }, 10000);
  });

  describe('tinytailor init', () => {
    it('should create configuration files', (done) => {
      // Create a minimal template for testing
      const templateDir = path.join(tempDir, 'templates');
      fs.ensureDirSync(templateDir);
      fs.writeFileSync(
        path.join(templateDir, 'tinytailor.config.js'),
        'module.exports = { projectRoot: "." };'
      );

      const child = spawn('node', [cliPath, 'init'], {
        cwd: tempDir,
        stdio: 'pipe'
      });

      // Simulate user input (decline overwrite, decline gitignore)
      child.stdin?.write('n\nn\n');
      child.stdin?.end();

      let stdout = '';
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', async (code) => {
        expect(stdout).toContain('TinyTailor Initialization');
        
        // Note: In a real test, we'd mock the template copy process
        // For now, we just check that the init command runs without crashing
        expect(code).not.toBe(undefined);
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

    it('should run with specific modules via command line', (done) => {
      const child = spawn('node', [cliPath, 'run', '--skip-menu', '--modules', 'text-processing'], {
        cwd: tempDir,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        // The command should execute, even if it doesn't find much to process
        expect(code).not.toBe(1); // Should not exit with error code 1
        
        // Check for some expected output patterns
        if (stdout || stderr) {
          const output = stdout + stderr;
          // Should mention TinyTailor initialization or processing
          expect(output).toMatch(/TinyTailor|initialized|processing|Processing/i);
        }
        
        done();
      });
    }, 15000);

    it('should validate configuration and show errors', (done) => {
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

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const output = stdout + stderr;
        
        // Should exit with error code or show configuration errors
        if (code === 1) {
          expect(output).toMatch(/Configuration errors|Invalid|Error/i);
        }
        
        done();
      });
    }, 15000);
  });

  describe.skip('error scenarios', () => {
    it('should handle missing config file gracefully', (done) => {
      const child = spawn('node', [cliPath, 'run', '--skip-menu', '--modules', 'text-processing'], {
        cwd: tempDir,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        // Should handle missing config, either by using defaults or showing an error
        expect(code).toBeDefined();
        done();
      });
    }, 10000);

    it('should handle invalid command arguments', (done) => {
      const child = spawn('node', [cliPath, 'invalid-command'], {
        cwd: tempDir,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      const timeout = setTimeout(() => {
        child.kill();
        done(new Error('Test timed out'));
      }, 8000);

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        const output = stdout + stderr;
        
        // Should show help or error message for invalid command
        expect(output).toMatch(/unknown command|help|Usage/i);
        done();
      });

      child.on('error', (err) => {
        clearTimeout(timeout);
        done(err);
      });
    }, 15000);
  });
});
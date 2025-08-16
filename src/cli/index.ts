#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { runCommand } from './commands/run';

const program = new Command();

program
  .name('tinytailor')
  .description('TinyTailor - A powerful tool for optimizing images and fixing text in HTML, Blade, and Vue files')
  .version('1.0.0');

// Init command
program
  .command('init')
  .description('Initialize TinyTailor in the current project')
  .action(async () => {
    try {
      await initCommand();
    } catch (error: unknown) {
      console.error(chalk.red.bold('\n❌ Initialization failed:\n'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Main processing command (default)
program
  .command('run', { isDefault: true })
  .description('Run TinyTailor processing')
  .option('-c, --config <path>', 'Path to config file', 'tinytailor.config.js')
  .option('-m, --modules <modules>', 'Comma-separated list of modules to run (image-optimization,text-processing,size-checking)')
  .option('--skip-menu', 'Skip interactive menu and use config/command line options')
  .action(async (options) => {
    try {
      const parsedOptions = {
        config: options.config,
        modules: options.modules ? options.modules.split(',').map((m: string) => m.trim()) : undefined,
        skipMenu: options.skipMenu || false,
      };

      await runCommand(parsedOptions);
    } catch (error: unknown) {
      console.error(chalk.red.bold('\n❌ Processing failed:\n'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      if (process.env.NODE_ENV === 'development') {
        console.error(chalk.gray(`\nStack trace:\n${error instanceof Error ? error.stack : 'No stack trace available'}`));
      }
      process.exit(1);
    }
  });

// Image optimization only
program
  .command('images')
  .description('Run image optimization only')
  .option('-c, --config <path>', 'Path to config file', 'tinytailor.config.js')
  .action(async (options) => {
    try {
      await runCommand({
        config: options.config,
        modules: ['image-optimization'],
        skipMenu: true,
      });
    } catch (error: unknown) {
      console.error(chalk.red.bold('\n❌ Image optimization failed:\n'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Text processing only
program
  .command('text')
  .description('Run text processing only (hanging prepositions, superscript)')
  .option('-c, --config <path>', 'Path to config file', 'tinytailor.config.js')
  .action(async (options) => {
    try {
      await runCommand({
        config: options.config,
        modules: ['text-processing'],
        skipMenu: true,
      });
    } catch (error: unknown) {
      console.error(chalk.red.bold('\n❌ Text processing failed:\n'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Size checking only
program
  .command('check-sizes')
  .description('Run image size checking only (experimental)')
  .option('-c, --config <path>', 'Path to config file', 'tinytailor.config.js')
  .action(async (options) => {
    try {
      await runCommand({
        config: options.config,
        modules: ['size-checking'],
        skipMenu: true,
      });
    } catch (error: unknown) {
      console.error(chalk.red.bold('\n❌ Size checking failed:\n'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Debug command for diagnostics
program
  .command('debug')
  .description('Debug file scanning and configuration')
  .option('-c, --config <path>', 'Path to config file', 'tinytailor.config.js')
  .action(async () => {
    try {
      const { ConfigManager } = await import('../core/config');
      const { FileUtils } = await import('../utils/file-utils');
      
      console.log(chalk.cyan.bold('\n🔍 TinyTailor Debug Information\n'));
      
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      
      console.log(chalk.yellow('Configuration:'));
      console.log(`  Project Root: ${chalk.cyan(config.projectRoot)}`);
      console.log(`  Public Root: ${chalk.cyan(config.publicRoot)}`);
      console.log(`  Current Working Directory: ${chalk.cyan(process.cwd())}`);
      
      console.log(chalk.yellow('\nScan Globs:'));
      config.scanGlobs.forEach(glob => {
        console.log(`  ${glob.startsWith('!') ? chalk.red(glob) : chalk.green(glob)}`);
      });
      
      console.log(chalk.yellow('\nScanning files...'));
      const files = await FileUtils.scanFiles(config.scanGlobs, config.projectRoot);
      
      console.log(`${chalk.green('✓')} Found ${chalk.bold(files.length)} files total`);
      
      if (files.length > 0 && files.length <= 20) {
        console.log(chalk.yellow('\nFound files:'));
        files.forEach(file => {
          const relative = FileUtils.relativePath(config.projectRoot, file);
          console.log(`  ${chalk.gray(relative)}`);
        });
      } else if (files.length > 20) {
        console.log(chalk.yellow('\nFirst 10 files:'));
        files.slice(0, 10).forEach(file => {
          const relative = FileUtils.relativePath(config.projectRoot, file);
          console.log(`  ${chalk.gray(relative)}`);
        });
        console.log(`  ${chalk.gray(`... and ${files.length - 10} more files`)}`);
      }
      
      // Test specific file patterns
      console.log(chalk.yellow('\nTesting specific patterns:'));
      const testPatterns = ['**/*.html', '**/*.vue', '**/*.blade.php', '**/*.css'];
      for (const pattern of testPatterns) {
        const testFiles = await FileUtils.scanFiles([pattern], config.projectRoot);
        console.log(`  ${pattern}: ${chalk.cyan(testFiles.length)} files`);
      }
      
    } catch (error: unknown) {
      console.error(chalk.red.bold('\n❌ Debug failed:\n'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      console.error(chalk.gray(`Stack: ${error instanceof Error ? error.stack : 'No stack trace available'}`));
      process.exit(1);
    }
  });

// Help command
program
  .command('help')
  .description('Show detailed help information')
  .action(() => {
    console.log(chalk.cyan.bold('\n🎯 TinyTailor - Comprehensive Help\n'));
    
    console.log(chalk.yellow('Basic Usage:'));
    console.log('  tinytailor                    # Run with interactive menu');
    console.log('  tinytailor init              # Initialize in current project');
    console.log('  tinytailor images            # Image optimization only');
    console.log('  tinytailor text              # Text processing only');
    console.log('  tinytailor check-sizes       # Size checking only (experimental)');
    
    console.log(chalk.yellow('\nConfiguration:'));
    console.log('  --config <path>              # Use custom config file');
    console.log('  --modules <list>             # Comma-separated module list');
    console.log('  --skip-menu                  # Skip interactive menu');
    
    console.log(chalk.yellow('\nAvailable Modules:'));
    console.log('  image-optimization           # WebP conversion, mobile versions, compression');
    console.log('  text-processing              # Hanging prepositions, superscript units');
    console.log('  size-checking                # Compare image sizes vs CSS (experimental)');
    
    console.log(chalk.yellow('\nExamples:'));
    console.log('  tinytailor --modules image-optimization,text-processing');
    console.log('  tinytailor --config ./custom.config.js --skip-menu');
    console.log('  tinytailor images');
    
    console.log(chalk.green('\n📄 Generated reports are saved in tinytailor_reports/'));
    console.log(chalk.gray('For more information, see the README.md file.\n'));
  });

// Error handling for unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`\n❌ Unknown command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('Run'), chalk.cyan('tinytailor help'), chalk.yellow('for available commands.'));
  process.exit(1);
});

// Parse command line arguments
try {
  program.parse(process.argv);
} catch (error: unknown) {
  console.error(chalk.red.bold('\n❌ Command parsing failed:\n'));
  console.error(chalk.red(error instanceof Error ? error.message : String(error)));
  process.exit(1);
}

// If no arguments provided, show help
if (process.argv.length === 2) {
  program.help();
}
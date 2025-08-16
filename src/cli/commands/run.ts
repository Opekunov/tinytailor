import chalk from 'chalk';
import { ConfigManager } from '../../core/config';
import { TinyTailorProcessor } from '../../core/processor';
import { TinyTailorLogger } from '../../utils/logger';
import { InteractiveMenu } from '../interactive-menu';
import { ProcessingModule } from '../../types';

export async function runCommand(options: { 
  config?: string; 
  modules?: string[];
  skipMenu?: boolean;
}): Promise<void> {
  try {
    // Initialize config
    const configManager = new ConfigManager(options.config ? require('path').dirname(options.config) : undefined);
    const config = await configManager.loadConfig();
    
    // Validate config
    const validation = await configManager.validateConfig();
    if (!validation.valid) {
      console.log(chalk.red.bold('\n❌ Configuration errors:\n'));
      validation.errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
      process.exit(1);
    }

    // Initialize logger
    const logger = new TinyTailorLogger(
      config.logging.console,
      config.logging.markdownReport,
      config.logging.reportDir
    );

    // Initialize processor
    const processor = new TinyTailorProcessor(config, logger);

    // Initialize interactive menu
    const menu = new InteractiveMenu();

    try {
      logger.info('🎯 TinyTailor initialized');
      logger.info(`Project root: ${config.projectRoot}`);
      logger.info(`Public root: ${config.publicRoot}`);

      // Determine which modules to run
      let selectedModules: ProcessingModule[];
      
      if (options.skipMenu && options.modules) {
        // Use modules from command line
        selectedModules = options.modules.filter(m => 
          ['image-optimization', 'text-processing', 'size-checking', 'css-optimization'].includes(m)
        ) as ProcessingModule[];
        
        if (selectedModules.length === 0) {
          menu.showError('No valid modules specified. Available: image-optimization, text-processing, size-checking, css-optimization');
          process.exit(1);
        }
      } else {
        // Show interactive menu
        selectedModules = await menu.showMainMenu();
      }

      logger.info(`Selected modules: ${selectedModules.join(', ')}`);

      // Show confirmation if not in skip mode
      if (!options.skipMenu) {
        // Quick scan to show file count
        const allFiles = await processor.processFiles([]);
        const confirmed = await menu.confirmProcessing(allFiles.totalFiles);
        
        if (!confirmed) {
          logger.info('Processing cancelled by user');
          process.exit(0);
        }
      }

      menu.showProcessingStart();

      // Process files
      const startTime = Date.now();
      const result = await processor.processFiles(selectedModules);
      const duration = (Date.now() - startTime) / 1000;

      // Show completion summary
      menu.showProcessingComplete(result.changedFiles, result.totalFiles, duration);

      // Generate report
      await logger.generateReport(result);

      // Exit with error code if there were errors
      if (result.errors.length > 0) {
        logger.error(`Processing completed with ${result.errors.length} errors`);
        process.exit(1);
      }

    } catch (error: any) {
      logger.error(`Processing failed: ${error.message}`);
      console.error(chalk.red(`\nStack trace:\n${error.stack}`));
      process.exit(1);
    }

  } catch (error: any) {
    console.log(chalk.red.bold('\n❌ Initialization failed:\n'));
    console.log(chalk.red(error.message));
    console.error(chalk.red(`\nStack trace:\n${error.stack}`));
    process.exit(1);
  }
}
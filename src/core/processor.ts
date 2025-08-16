import { TinyTailorConfig, ProcessingResult, ProcessingError, ProcessingModule, Logger } from '../types';
import { FileUtils } from '../utils/file-utils';
import { ImageOptimizer } from '../modules/image-optimizer';
import { TextProcessor } from '../modules/text-processor';
import { SizeChecker } from '../modules/image-optimizer/size-checker';
import { CssOptimizer } from '../modules/css-optimizer';

export class TinyTailorProcessor {
  private config: TinyTailorConfig;
  private logger: Logger;
  private imageOptimizer: ImageOptimizer;
  private textProcessor: TextProcessor;
  private sizeChecker: SizeChecker;
  private cssOptimizer: CssOptimizer;

  constructor(config: TinyTailorConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.imageOptimizer = new ImageOptimizer(config, logger);
    this.textProcessor = new TextProcessor(config, logger);
    this.sizeChecker = new SizeChecker(config, logger);
    this.cssOptimizer = new CssOptimizer(config, logger);
  }

  async processFiles(selectedModules: ProcessingModule[]): Promise<ProcessingResult> {
    const startTime = Date.now();
    this.logger.startOperation('Starting file processing');

    const result: ProcessingResult = {
      changedFiles: 0,
      totalFiles: 0,
      images: {
        processed: 0,
        webpConverted: 0,
        downscaled: 0,
        recompressed: 0,
      },
      text: {
        hangingPrepositionsFixed: 0,
        superscriptReplacements: 0,
      },
      css: {
        processed: 0,
        backgroundImagesProcessed: 0,
        webpRulesAdded: 0,
      },
      errors: [],
      warnings: [],
    };

    try {
      // Scan files
      const files = await this.scanFiles();
      result.totalFiles = files.length;
      
      this.logger.info(`Found ${files.length} files to process`);

      // Process each file
      for (const file of files) {
        try {
          let fileChanged = false;

          // Image optimization
          if (selectedModules.includes('image-optimization') && this.config.imageOptimization.enabled) {
            const imageResult = await this.imageOptimizer.processDocument(file);
            if (imageResult.changed) {
              fileChanged = true;
              result.images.processed++;
            }
          }

          // Text processing
          if (selectedModules.includes('text-processing')) {
            const textResult = await this.textProcessor.processDocument(file);
            if (textResult.changed) {
              fileChanged = true;
            }
            result.text.hangingPrepositionsFixed += textResult.hangingPrepositionsFixed;
            result.text.superscriptReplacements += textResult.superscriptReplacements;
          }

          // CSS optimization
          if (selectedModules.includes('css-optimization') && this.config.cssOptimization.enabled) {
            const cssResult = await this.cssOptimizer.processDocument(file);
            if (cssResult.changed) {
              fileChanged = true;
              result.css.processed++;
            }
            result.css.backgroundImagesProcessed += cssResult.backgroundImagesProcessed;
            result.css.webpRulesAdded += cssResult.webpRulesAdded;
          }

          if (fileChanged) {
            result.changedFiles++;
            this.logger.success(`Updated: ${this.getRelativePath(file)}`);
          }

        } catch (error: unknown) {
          const processingError: ProcessingError = {
            file: this.getRelativePath(file),
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          };
          result.errors.push(processingError);
          this.logger.error(`Error processing ${this.getRelativePath(file)}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Size checking (separate from file processing)
      if (selectedModules.includes('size-checking')) {
        try {
          const sizeWarnings = await this.sizeChecker.checkImageSizes(files);
          result.warnings.push(...sizeWarnings);
        } catch (error: unknown) {
          result.errors.push({
            file: 'size-checker',
            message: `Size checking failed: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      this.logger.endOperation(`Processing completed in ${duration.toFixed(2)}s`);

      // Generate summary
      this.generateSummary(result);

      return result;

    } catch (error: unknown) {
      result.errors.push({
        file: 'processor',
        message: `Fatal error during processing: ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  private async scanFiles(): Promise<string[]> {
    this.logger.info('Scanning for files...');
    
    try {
      const files = await FileUtils.scanFiles(this.config.scanGlobs, this.config.projectRoot);
      
      // Apply exclusions
      const filteredFiles = files.filter(file => {
        const relativePath = this.getRelativePath(file);
        
        // Check excluded paths
        for (const excludePath of this.config.excludePaths) {
          if (relativePath.startsWith(excludePath)) {
            return false;
          }
        }
        
        // Check excluded files
        const fileName = FileUtils.getBasename(file);
        if (this.config.excludeFiles.includes(fileName)) {
          return false;
        }
        
        return true;
      });

      this.logger.info(`Filtered ${files.length} to ${filteredFiles.length} files after exclusions`);
      return filteredFiles;

    } catch (error: unknown) {
      this.logger.error(`File scanning failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private generateSummary(result: ProcessingResult): void {
    this.logger.info('\n=== Processing Summary ===');
    this.logger.info(`Files changed: ${result.changedFiles}/${result.totalFiles}`);
    this.logger.info(`Images processed: ${result.images.processed}`);
    this.logger.info(`Hanging prepositions fixed: ${result.text.hangingPrepositionsFixed}`);
    this.logger.info(`Superscript replacements: ${result.text.superscriptReplacements}`);
    this.logger.info(`CSS files processed: ${result.css.processed}`);
    this.logger.info(`CSS background images optimized: ${result.css.backgroundImagesProcessed}`);
    
    if (result.errors.length > 0) {
      this.logger.warn(`Errors encountered: ${result.errors.length}`);
    }
    
    if (result.warnings.length > 0) {
      this.logger.warn(`Warnings generated: ${result.warnings.length}`);
    }
  }

  private getRelativePath(filePath: string): string {
    return FileUtils.relativePath(this.config.projectRoot, filePath);
  }

  async processSpecificModule(module: ProcessingModule, files?: string[]): Promise<ProcessingResult> {
    const filesToProcess = files || await this.scanFiles();
    
    switch (module) {
      case 'image-optimization':
        return this.processImageOptimization(filesToProcess);
      case 'text-processing':
        return this.processTextOnly(filesToProcess);
      case 'size-checking':
        return this.processSizeChecking(filesToProcess);
      default:
        throw new Error(`Unknown module: ${module}`);
    }
  }

  private async processImageOptimization(files: string[]): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      changedFiles: 0,
      totalFiles: files.length,
      images: { processed: 0, webpConverted: 0, downscaled: 0, recompressed: 0 },
      text: { hangingPrepositionsFixed: 0, superscriptReplacements: 0 },
      css: { processed: 0, backgroundImagesProcessed: 0, webpRulesAdded: 0 },
      errors: [],
      warnings: [],
    };

    for (const file of files) {
      try {
        const imageResult = await this.imageOptimizer.processDocument(file);
        if (imageResult.changed) {
          result.changedFiles++;
          result.images.processed++;
        }
      } catch (error: unknown) {
        result.errors.push({
          file: this.getRelativePath(file),
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }

  private async processTextOnly(files: string[]): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      changedFiles: 0,
      totalFiles: files.length,
      images: { processed: 0, webpConverted: 0, downscaled: 0, recompressed: 0 },
      text: { hangingPrepositionsFixed: 0, superscriptReplacements: 0 },
      css: { processed: 0, backgroundImagesProcessed: 0, webpRulesAdded: 0 },
      errors: [],
      warnings: [],
    };

    for (const file of files) {
      try {
        const textResult = await this.textProcessor.processDocument(file);
        if (textResult.changed) {
          result.changedFiles++;
        }
        result.text.hangingPrepositionsFixed += textResult.hangingPrepositionsFixed;
        result.text.superscriptReplacements += textResult.superscriptReplacements;
      } catch (error: unknown) {
        result.errors.push({
          file: this.getRelativePath(file),
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }

  private async processSizeChecking(files: string[]): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      changedFiles: 0,
      totalFiles: files.length,
      images: { processed: 0, webpConverted: 0, downscaled: 0, recompressed: 0 },
      text: { hangingPrepositionsFixed: 0, superscriptReplacements: 0 },
      css: { processed: 0, backgroundImagesProcessed: 0, webpRulesAdded: 0 },
      errors: [],
      warnings: [],
    };

    try {
      const warnings = await this.sizeChecker.checkImageSizes(files);
      result.warnings = warnings;
    } catch (error: unknown) {
      result.errors.push({
        file: 'size-checker',
        message: error instanceof Error ? error.message : String(error),
      });
    }

    return result;
  }
}
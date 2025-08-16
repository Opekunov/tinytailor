import * as fs from 'fs-extra';
import * as path from 'path';
import { TinyTailorConfig, Logger, CssProcessingResult } from '../../types';
import { FileUtils } from '../../utils/file-utils';
import { CssWebPProcessor } from './css-webp-processor';

export class CssOptimizer {
  private config: TinyTailorConfig;
  private logger: Logger;
  private webpProcessor: CssWebPProcessor;

  constructor(config: TinyTailorConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.webpProcessor = new CssWebPProcessor(config, logger);
  }

  async processDocument(filePath: string): Promise<CssProcessingResult> {
    const result: CssProcessingResult = {
      changed: false,
      backgroundImagesProcessed: 0,
      webpRulesAdded: 0,
      errors: [],
    };

    try {
      // Check if file is CSS/SCSS
      const ext = path.extname(filePath).toLowerCase();
      if (!['.css', '.scss', '.sass'].includes(ext)) {
        return result;
      }

      // Read file content
      const originalContent = await fs.readFile(filePath, 'utf8');
      let modifiedContent = originalContent;

      this.logger.info(`Processing CSS file: ${FileUtils.relativePath(this.config.projectRoot, filePath)}`);

      // Process WebP background-image optimization
      const webpResult = await this.webpProcessor.processBackgroundImages(modifiedContent, filePath);
      
      if (webpResult.changed) {
        modifiedContent = webpResult.content;
        result.changed = true;
        result.backgroundImagesProcessed = webpResult.imagesProcessed;
        result.webpRulesAdded = webpResult.webpRulesAdded;
        
        this.logger.success(`Added WebP support for ${webpResult.imagesProcessed} background images`);
      }

      // Write modified content back to file if changed
      if (result.changed) {
        await fs.writeFile(filePath, modifiedContent, 'utf8');
        this.logger.info(`Updated CSS file: ${FileUtils.relativePath(this.config.projectRoot, filePath)}`);
      }

      return result;

    } catch (error: any) {
      result.errors.push({
        file: FileUtils.relativePath(this.config.projectRoot, filePath),
        message: `CSS processing failed: ${error.message}`,
        stack: error.stack,
      });
      this.logger.error(`Failed to process CSS file ${filePath}: ${error.message}`);
      return result;
    }
  }

  async scanCssFiles(): Promise<string[]> {
    const cssGlobs = [
      '**/*.css',
      '**/*.scss', 
      '**/*.sass'
    ];

    const files: string[] = [];
    
    for (const glob of cssGlobs) {
      const found = await FileUtils.scanFiles([glob], this.config.projectRoot);
      files.push(...found);
    }

    // Apply exclusions
    const filteredFiles = files.filter(file => {
      const relativePath = FileUtils.relativePath(this.config.projectRoot, file);
      
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

    return filteredFiles;
  }
}
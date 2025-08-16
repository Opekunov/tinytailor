import * as fs from 'fs-extra';
import * as path from 'path';
import { TinyTailorConfig, Logger } from '../../types';
import { SharpProcessor } from '../image-optimizer/sharp-processor';

export interface CssWebPResult {
  content: string;
  changed: boolean;
  imagesProcessed: number;
  webpRulesAdded: number;
}

export class CssWebPProcessor {
  private config: TinyTailorConfig;
  private logger: Logger;
  private sharpProcessor: SharpProcessor;

  constructor(config: TinyTailorConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.sharpProcessor = new SharpProcessor();
  }

  async processBackgroundImages(cssContent: string, cssFilePath: string): Promise<CssWebPResult> {
    const result: CssWebPResult = {
      content: cssContent,
      changed: false,
      imagesProcessed: 0,
      webpRulesAdded: 0,
    };

    // Regex to find background-image declarations
    const backgroundImageRegex = /background-image\s*:\s*url\(['"]?([^'")]+)['"]?\)/gi;
    const matches = Array.from(cssContent.matchAll(backgroundImageRegex));

    if (matches.length === 0) {
      return result;
    }

    let modifiedContent = cssContent;
    const cssDir = path.dirname(cssFilePath);

    for (const match of matches) {
      const fullMatch = match[0];
      const imageUrl = match[1];

      try {
        // Skip URLs that are not relative paths or don't point to images
        if (this.shouldSkipUrl(imageUrl)) {
          continue;
        }

        // Resolve image path relative to CSS file
        const imagePath = path.resolve(cssDir, imageUrl);
        
        // Check if image exists and is supported format
        if (!await this.isProcessableImage(imagePath)) {
          continue;
        }

        // Generate WebP version
        const webpPath = await this.generateWebPVersion(imagePath);
        
        if (webpPath) {
          // Create WebP-aware CSS rule
          const webpRule = this.createWebPRule(fullMatch, imageUrl, webpPath, cssDir);
          
          if (webpRule) {
            modifiedContent = this.insertWebPRule(modifiedContent, fullMatch, webpRule);
            result.imagesProcessed++;
            result.webpRulesAdded++;
            result.changed = true;

            this.logger.debug(`Added WebP rule for: ${imageUrl}`);
          }
        }

      } catch (error: any) {
        this.logger.warn(`Failed to process background image ${imageUrl}: ${error.message}`);
      }
    }

    result.content = modifiedContent;
    return result;
  }

  private shouldSkipUrl(url: string): boolean {
    // Skip data URLs, external URLs, and already processed WebP images
    return (
      url.startsWith('data:') ||
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('//') ||
      url.endsWith('.webp') ||
      url.includes('gradient') ||
      url.startsWith('#')
    );
  }

  private async isProcessableImage(imagePath: string): Promise<boolean> {
    try {
      if (!await fs.pathExists(imagePath)) {
        return false;
      }

      const ext = path.extname(imagePath).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].includes(ext);
    } catch {
      return false;
    }
  }

  private async generateWebPVersion(imagePath: string): Promise<string | null> {
    try {
      const parsedPath = path.parse(imagePath);
      const webpPath = path.join(parsedPath.dir, `${parsedPath.name}.webp`);

      // Check if WebP version already exists
      if (await fs.pathExists(webpPath)) {
        return webpPath;
      }

      // Generate WebP version
      const quality = this.config.imageOptimization.webpQuality;
      const result = await this.sharpProcessor.convertToWebp(imagePath, webpPath, quality);

      return result.created ? webpPath : null;
    } catch (error: any) {
      this.logger.warn(`Failed to generate WebP for ${imagePath}: ${error.message}`);
      return null;
    }
  }

  private createWebPRule(originalRule: string, originalUrl: string, webpPath: string, cssDir: string): string | null {
    try {
      // Calculate relative path from CSS to WebP
      const webpRelative = path.relative(cssDir, webpPath);
      
      // Normalize path separators for web
      const webpUrl = webpRelative.replace(/\\/g, '/');

      // Create WebP rule with feature detection
      const webpRule = originalRule.replace(originalUrl, webpUrl);

      return `@supports (background-image: url('data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==')) {
  ${webpRule}
}

/* Fallback for browsers that don't support WebP */
@supports not (background-image: url('data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==')) {
  ${originalRule}
}`;
    } catch (error: any) {
      this.logger.warn(`Failed to create WebP rule: ${error.message}`);
      return null;
    }
  }

  private insertWebPRule(cssContent: string, originalRule: string, webpRule: string): string {
    // Find the CSS rule context (selector + declaration block)
    const ruleContext = this.findRuleContext(cssContent, originalRule);
    
    if (ruleContext) {
      // Replace the entire rule with WebP-aware version
      return cssContent.replace(ruleContext.fullRule, webpRule);
    } else {
      // Fallback: just replace the background-image declaration
      return cssContent.replace(originalRule, webpRule);
    }
  }

  private findRuleContext(cssContent: string, backgroundRule: string): { fullRule: string; selector: string } | null {
    try {
      const ruleIndex = cssContent.indexOf(backgroundRule);
      if (ruleIndex === -1) return null;

      // Find the start of the CSS rule (look backwards for selector)
      let selectorStart = ruleIndex;
      let braceCount = 0;
      let inRule = false;

      // Look backwards to find the opening brace and selector
      for (let i = ruleIndex - 1; i >= 0; i--) {
        const char = cssContent[i];
        
        if (char === '}') {
          if (!inRule) {
            // We found the end of a previous rule
            selectorStart = i + 1;
            break;
          }
          braceCount++;
        } else if (char === '{') {
          if (braceCount === 0) {
            // Found our rule's opening brace
            inRule = true;
          } else {
            braceCount--;
          }
        }
      }

      // Find the end of the current CSS rule (look forward for closing brace)
      let ruleEnd = ruleIndex;
      braceCount = 0;
      inRule = false;

      for (let i = ruleIndex; i < cssContent.length; i++) {
        const char = cssContent[i];
        
        if (char === '{') {
          if (!inRule) {
            inRule = true;
          } else {
            braceCount++;
          }
        } else if (char === '}') {
          if (braceCount === 0 && inRule) {
            // Found our rule's closing brace
            ruleEnd = i + 1;
            break;
          } else {
            braceCount--;
          }
        }
      }

      const fullRule = cssContent.substring(selectorStart, ruleEnd).trim();
      const selectorMatch = fullRule.match(/^([^{]+){/);
      const selector = selectorMatch ? selectorMatch[1].trim() : '';

      return { fullRule, selector };

    } catch (error: any) {
      this.logger.debug(`Failed to find rule context: ${error.message}`);
      return null;
    }
  }
}
import { TinyTailorConfig, Logger } from '../../types';
import { FileUtils } from '../../utils/file-utils';
import { HangingPrepositionsProcessor } from './hanging-prepositions';
import { SuperscriptReplacer } from './superscript-replacer';

export class TextProcessor {
  private config: TinyTailorConfig;
  private logger: Logger;
  private hangingPrepositionsProcessor: HangingPrepositionsProcessor;
  private superscriptReplacer: SuperscriptReplacer;

  constructor(config: TinyTailorConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.hangingPrepositionsProcessor = new HangingPrepositionsProcessor(config, logger);
    this.superscriptReplacer = new SuperscriptReplacer(config, logger);
  }

  async processDocument(filePath: string): Promise<{ changed: boolean; hangingPrepositionsFixed: number; superscriptReplacements: number }> {
    // Check if file extension should be processed
    if (!this.shouldProcessFile(filePath)) {
      return { changed: false, hangingPrepositionsFixed: 0, superscriptReplacements: 0 };
    }

    let content = await FileUtils.readFile(filePath);
    const originalContent = content;
    
    let totalHangingPrepositions = 0;
    let totalSuperscriptReplacements = 0;

    // Process hanging prepositions
    if (this.config.textProcessing.hangingPrepositions.enabled) {
      const result = this.hangingPrepositionsProcessor.processText(content, filePath);
      content = result.content;
      totalHangingPrepositions = result.replacements;
    }

    // Process superscript replacements
    if (this.config.textProcessing.superscriptReplacements.enabled) {
      const result = this.superscriptReplacer.processText(content, filePath);
      content = result.content;
      totalSuperscriptReplacements = result.replacements;
    }

    // Write back if changed
    const changed = content !== originalContent;
    if (changed) {
      await FileUtils.writeFile(filePath, content);
    }

    return {
      changed,
      hangingPrepositionsFixed: totalHangingPrepositions,
      superscriptReplacements: totalSuperscriptReplacements,
    };
  }

  private shouldProcessFile(filePath: string): boolean {
    const extension = FileUtils.getExtension(filePath);
    
    // Check hanging prepositions extensions
    if (this.config.textProcessing.hangingPrepositions.enabled) {
      if (this.config.textProcessing.hangingPrepositions.fileExtensions.includes(extension)) {
        return true;
      }
    }

    // Check superscript replacements (use same extensions as hanging prepositions for now)
    if (this.config.textProcessing.superscriptReplacements.enabled) {
      if (this.config.textProcessing.hangingPrepositions.fileExtensions.includes(extension)) {
        return true;
      }
    }

    return false;
  }

  async processHangingPrepositionsOnly(filePath: string): Promise<{ changed: boolean; replacements: number }> {
    if (!this.config.textProcessing.hangingPrepositions.enabled || !this.shouldProcessFile(filePath)) {
      return { changed: false, replacements: 0 };
    }

    const content = await FileUtils.readFile(filePath);
    const result = this.hangingPrepositionsProcessor.processText(content, filePath);
    
    if (result.replacements > 0) {
      await FileUtils.writeFile(filePath, result.content);
    }

    return { 
      changed: result.replacements > 0, 
      replacements: result.replacements 
    };
  }

  async processSuperscriptOnly(filePath: string): Promise<{ changed: boolean; replacements: number }> {
    if (!this.config.textProcessing.superscriptReplacements.enabled || !this.shouldProcessFile(filePath)) {
      return { changed: false, replacements: 0 };
    }

    const content = await FileUtils.readFile(filePath);
    const result = this.superscriptReplacer.processText(content, filePath);
    
    if (result.replacements > 0) {
      await FileUtils.writeFile(filePath, result.content);
    }

    return { 
      changed: result.replacements > 0, 
      replacements: result.replacements 
    };
  }

  getProcessableExtensions(): string[] {
    const extensions = new Set<string>();
    
    if (this.config.textProcessing.hangingPrepositions.enabled) {
      this.config.textProcessing.hangingPrepositions.fileExtensions.forEach(ext => 
        extensions.add(ext)
      );
    }

    return Array.from(extensions);
  }
}
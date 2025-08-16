import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger, ProcessingResult } from '../types';

export class TinyTailorLogger implements Logger {
  private markdownLog: string[] = [];
  private reportPath?: string;
  private enableConsole: boolean;
  private enableMarkdown: boolean;

  constructor(enableConsole = true, enableMarkdown = true, reportDir = 'tinytailor_reports') {
    this.enableConsole = enableConsole;
    this.enableMarkdown = enableMarkdown;
    
    if (enableMarkdown) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      this.reportPath = path.join(process.cwd(), reportDir, `tailorreport_${timestamp}.md`);
    }
  }

  info(message: string): void {
    if (this.enableConsole) {
      console.log(chalk.blue('ℹ'), message);
    }
    this.addToReport(`ℹ️ ${message}`);
  }

  warn(message: string): void {
    if (this.enableConsole) {
      console.log(chalk.yellow('⚠'), message);
    }
    this.addToReport(`⚠️ ${message}`);
  }

  error(message: string): void {
    if (this.enableConsole) {
      console.log(chalk.red('✗'), message);
    }
    this.addToReport(`❌ ${message}`);
  }

  success(message: string): void {
    if (this.enableConsole) {
      console.log(chalk.green('✓'), message);
    }
    this.addToReport(`✅ ${message}`);
  }

  debug(message: string): void {
    if (this.enableConsole) {
      console.log(chalk.gray('›'), message);
    }
    this.addToReport(`› ${message}`);
  }

  startOperation(message: string): void {
    if (this.enableConsole) {
      console.log(chalk.cyan('▶'), message);
    }
    this.addToReport(`▶️ ${message}`);
  }

  endOperation(message: string): void {
    if (this.enableConsole) {
      console.log(chalk.cyan('◼'), message);
    }
    this.addToReport(`◼️ ${message}`);
  }

  logImageProcessing(filePath: string, action: string, sizeBefore: number, sizeAfter: number): void {
    const reduction = ((sizeBefore - sizeAfter) / sizeBefore * 100).toFixed(1);
    const message = `${action}: ${path.relative(process.cwd(), filePath)} | ${(sizeBefore/1024).toFixed(1)}KB → ${(sizeAfter/1024).toFixed(1)}KB (${reduction}%)`;
    
    if (this.enableConsole) {
      console.log(chalk.green('•'), message);
    }
    this.addToReport(`• ${message}`);
  }

  logTextProcessing(filePath: string, replacements: number, type: string): void {
    const message = `${type}: ${path.relative(process.cwd(), filePath)} | ${replacements} changes`;
    
    if (this.enableConsole) {
      console.log(chalk.blue('•'), message);
    }
    this.addToReport(`• ${message}`);
  }

  logCssProcessing(filePath: string, backgroundImages: number, webpRules: number): void {
    const message = `CSS WebP: ${path.relative(process.cwd(), filePath)} | ${backgroundImages} backgrounds, ${webpRules} WebP rules`;
    
    if (this.enableConsole) {
      console.log(chalk.magenta('•'), message);
    }
    this.addToReport(`• ${message}`);
  }

  private addToReport(message: string): void {
    if (this.enableMarkdown) {
      this.markdownLog.push(message);
    }
  }

  async generateReport(result: ProcessingResult): Promise<void> {
    if (!this.enableMarkdown || !this.reportPath) return;

    const report = this.buildMarkdownReport(result);
    await fs.ensureDir(path.dirname(this.reportPath));
    await fs.writeFile(this.reportPath, report, 'utf8');
    
    if (this.enableConsole) {
      console.log(chalk.cyan('📄'), `Report saved: ${path.relative(process.cwd(), this.reportPath)}`);
    }
  }

  private buildMarkdownReport(result: ProcessingResult): string {
    const timestamp = new Date().toLocaleString();
    
    let report = `# TinyTailor Processing Report\n\n`;
    report += `**Generated:** ${timestamp}  \n`;
    report += `**Duration:** ${process.uptime().toFixed(2)}s\n\n`;
    
    report += `## Summary\n\n`;
    report += `- **Files processed:** ${result.changedFiles}/${result.totalFiles}\n`;
    report += `- **Images processed:** ${result.images.processed}\n`;
    report += `- **WebP conversions:** ${result.images.webpConverted}\n`;
    report += `- **Images downscaled:** ${result.images.downscaled}\n`;
    report += `- **PNG recompressed:** ${result.images.recompressed}\n`;
    report += `- **Hanging prepositions fixed:** ${result.text.hangingPrepositionsFixed}\n`;
    report += `- **Superscript replacements:** ${result.text.superscriptReplacements}\n`;
    report += `- **CSS files processed:** ${result.css.processed}\n`;
    report += `- **CSS background images optimized:** ${result.css.backgroundImagesProcessed}\n`;
    report += `- **CSS WebP rules added:** ${result.css.webpRulesAdded}\n`;
    report += `- **Errors:** ${result.errors.length}\n`;
    report += `- **Warnings:** ${result.warnings.length}\n\n`;
    
    if (result.errors.length > 0) {
      report += `## Errors\n\n`;
      result.errors.forEach(error => {
        report += `### ${error.file}\n`;
        report += `**Error:** ${error.message}\n\n`;
        if (error.stack) {
          report += `<details>\n<summary>Stack trace</summary>\n\n\`\`\`\n${error.stack}\n\`\`\`\n</details>\n\n`;
        }
      });
    }
    
    if (result.warnings.length > 0) {
      report += `## Warnings\n\n`;
      result.warnings.forEach(warning => {
        report += `### ${warning.file}\n`;
        report += `**Warning:** ${warning.message}\n`;
        if (warning.suggestion) {
          report += `**Suggestion:** ${warning.suggestion}\n`;
        }
        report += `\n`;
      });
    }
    
    if (this.markdownLog.length > 0) {
      report += `## Processing Log\n\n`;
      this.markdownLog.forEach(entry => {
        report += `${entry}  \n`;
      });
    }
    
    report += `\n---\n\n`;
    report += `🤖 Generated with [TinyTailor](https://github.com/Opekunov/tinytailor)\n`;
    
    return report;
  }
}
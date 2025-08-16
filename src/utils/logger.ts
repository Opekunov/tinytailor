import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger, ProcessingResult } from '../types';

// Animation frames for different spinners
const GLOBAL_SPINNER_FRAMES = ['✶', '✷', '✸', '✹', '✺', '✻', '✼', '✽', '✾', '✿', '❀', '❁', '❂', '❃', '❄', '❅', '❆', '❇', '❈', '❉', '❊', '❋'];
const FILE_SPINNER_FRAMES = ['◐', '◓', '◑', '◒'];
const TREE_CHARS = {
  BRANCH: '├── ',
  LAST_BRANCH: '└── ',
  VERTICAL: '│   ',
  SPACE: '    '
};

export class TinyTailorLogger implements Logger {
  private markdownLog: string[] = [];
  private reportPath?: string;
  private enableConsole: boolean;
  private enableMarkdown: boolean;
  
  // Animation state
  private globalSpinnerInterval?: ReturnType<typeof setInterval>;
  private globalSpinnerFrame = 0;
  private globalSpinnerMessage = '';
  private fileSpinners = new Map<string, { interval: ReturnType<typeof setInterval>; frame: number }>();
  private isGlobalSpinnerActive = false;
  private lastLoggedLine = '';

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

  // New animated logging methods
  startGlobalSpinner(message: string): void {
    if (!this.enableConsole) return;
    
    this.stopGlobalSpinner(); // Stop any existing spinner
    this.globalSpinnerMessage = message;
    this.isGlobalSpinnerActive = true;
    
    this.globalSpinnerInterval = setInterval(() => {
      this.globalSpinnerFrame = (this.globalSpinnerFrame + 1) % GLOBAL_SPINNER_FRAMES.length;
      const frame = GLOBAL_SPINNER_FRAMES[this.globalSpinnerFrame];
      
      // Clear the current line and print spinner
      process.stdout.write('\r\x1b[K'); // Clear line
      process.stdout.write(chalk.cyan(frame) + ' ' + chalk.white(this.globalSpinnerMessage));
    }, 100);
  }

  updateGlobalSpinner(message: string): void {
    this.globalSpinnerMessage = message;
  }

  stopGlobalSpinner(finalMessage?: string): void {
    if (!this.enableConsole) return;
    
    if (this.globalSpinnerInterval) {
      clearInterval(this.globalSpinnerInterval);
      this.globalSpinnerInterval = undefined;
    }
    
    if (this.isGlobalSpinnerActive) {
      process.stdout.write('\r\x1b[K'); // Clear the spinner line
      if (finalMessage) {
        console.log(chalk.green('✓'), finalMessage);
      }
      this.isGlobalSpinnerActive = false;
    }
  }

  startFileProcessing(filePath: string): void {
    if (!this.enableConsole) return;
    
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Move cursor up if global spinner is active to print above it
    if (this.isGlobalSpinnerActive) {
      process.stdout.write('\r\x1b[1A\x1b[K'); // Move up and clear
    }
    
    let frame = 0;
    const interval = setInterval(() => {
      frame = (frame + 1) % FILE_SPINNER_FRAMES.length;
      const spinnerChar = FILE_SPINNER_FRAMES[frame];
      
      if (this.isGlobalSpinnerActive) {
        process.stdout.write('\r\x1b[K'); // Clear current line
        process.stdout.write(chalk.blue(spinnerChar) + ' ' + chalk.white(relativePath) + '\n');
        // Restore global spinner line
        const globalFrame = GLOBAL_SPINNER_FRAMES[this.globalSpinnerFrame];
        process.stdout.write(chalk.cyan(globalFrame) + ' ' + chalk.white(this.globalSpinnerMessage));
      } else {
        process.stdout.write('\r\x1b[K'); // Clear line
        process.stdout.write(chalk.blue(spinnerChar) + ' ' + chalk.white(relativePath));
      }
    }, 200);
    
    this.fileSpinners.set(filePath, { interval, frame: 0 });
  }

  endFileProcessing(filePath: string, changes?: string[]): void {
    if (!this.enableConsole) return;
    
    const relativePath = path.relative(process.cwd(), filePath);
    const spinner = this.fileSpinners.get(filePath);
    
    if (spinner) {
      clearInterval(spinner.interval);
      this.fileSpinners.delete(filePath);
      
      if (this.isGlobalSpinnerActive) {
        process.stdout.write('\r\x1b[1A\x1b[K'); // Move up and clear
      } else {
        process.stdout.write('\r\x1b[K'); // Clear line
      }
      
      console.log(chalk.green('✓'), chalk.white(relativePath));
      
      // Show changes in tree format
      if (changes && changes.length > 0) {
        changes.forEach((change, index) => {
          const isLast = index === changes.length - 1;
          this.logTreeNode(1, isLast, change, 'change');
        });
      }
      
      // Restore global spinner if active
      if (this.isGlobalSpinnerActive && this.globalSpinnerInterval) {
        const globalFrame = GLOBAL_SPINNER_FRAMES[this.globalSpinnerFrame];
        process.stdout.write(chalk.cyan(globalFrame) + ' ' + chalk.white(this.globalSpinnerMessage));
      }
    }
  }

  logFileChange(filePath: string, lineNumbers: number[], description: string): void {
    const relativePath = path.relative(process.cwd(), filePath);
    const lineRange = lineNumbers.length > 0 ? 
      (lineNumbers.length === 1 ? 
        `line ${lineNumbers[0]}` : 
        `lines ${Math.min(...lineNumbers)}-${Math.max(...lineNumbers)}`) : 
      'unknown lines';
    
    const message = `${description} (${lineRange})`;
    
    if (this.enableConsole) {
      this.logTreeNode(2, true, message, 'info');
    }
    
    this.addToReport(`  • ${relativePath}: ${message}`);
  }

  logTreeNode(level: number, isLast: boolean, content: string, type: 'file' | 'change' | 'info' = 'info'): void {
    if (!this.enableConsole) return;
    
    let prefix = '';
    for (let i = 0; i < level - 1; i++) {
      prefix += TREE_CHARS.VERTICAL;
    }
    
    if (level > 0) {
      prefix += isLast ? TREE_CHARS.LAST_BRANCH : TREE_CHARS.BRANCH;
    }
    
    let coloredContent = content;
    switch (type) {
      case 'file':
        coloredContent = chalk.cyan(content);
        break;
      case 'change':
        coloredContent = chalk.green(content);
        break;
      case 'info':
        coloredContent = chalk.gray(content);
        break;
    }
    
    // Handle spinner interactions
    if (this.isGlobalSpinnerActive) {
      process.stdout.write('\r\x1b[1A\x1b[K'); // Move up and clear
      console.log(chalk.gray(prefix) + coloredContent);
      // Restore global spinner
      const globalFrame = GLOBAL_SPINNER_FRAMES[this.globalSpinnerFrame];
      process.stdout.write(chalk.cyan(globalFrame) + ' ' + chalk.white(this.globalSpinnerMessage));
    } else {
      console.log(chalk.gray(prefix) + coloredContent);
    }
  }
}
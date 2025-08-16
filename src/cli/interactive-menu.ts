import inquirer from 'inquirer';
import chalk from 'chalk';
import { MenuChoice, ProcessingModule } from '../types';

export class InteractiveMenu {
  async showMainMenu(): Promise<ProcessingModule[]> {
    console.log(chalk.cyan.bold('\n🎯 TinyTailor Processing Options\n'));
    
    const choices: MenuChoice[] = [
      {
        name: '🖼️  Image optimization (WebP conversion, mobile versions, compression)',
        value: 'image-optimization',
        description: 'Generate mobile versions, convert to WebP, compress large PNGs'
      },
      {
        name: '📝 Fix hanging prepositions (replace spaces with &nbsp;)',
        value: 'text-processing-prepositions',
        description: 'Replace spaces after prepositions with non-breaking spaces'
      },
      {
        name: '🔢 Convert units to superscript (m² → m<sup>2</sup>)',
        value: 'text-processing-superscript',
        description: 'Convert m², m³, etc. to proper superscript HTML'
      },
      {
        name: '📏 Check image sizes vs CSS (experimental)',
        value: 'size-checking',
        description: 'Compare image dimensions to CSS display sizes'
      },
      {
        name: '🎨 CSS WebP Optimization',
        value: 'css-optimization',
        description: 'Add WebP support for background-image in CSS/SCSS files'
      },
      {
        name: '🚀 Run all enabled modules',
        value: 'all',
        description: 'Execute all processing modules that are enabled in config'
      }
    ];

    const { selectedModules } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedModules',
        message: 'Select processing modules to run:',
        choices: choices.map(choice => ({
          name: choice.name,
          value: choice.value,
          checked: false,
        })),
        validate: (answer: string[]) => {
          if (answer.length < 1) {
            return 'You must choose at least one processing module.';
          }
          return true;
        }
      }
    ]);

    // Convert menu selections to actual module types
    const modules: ProcessingModule[] = [];
    const selections = selectedModules || [];
    
    if (selections.includes('image-optimization') || selections.includes('all')) {
      modules.push('image-optimization');
    }
    
    if (selections.includes('text-processing-prepositions') || 
        selections.includes('text-processing-superscript') || 
        selections.includes('all')) {
      modules.push('text-processing');
    }
    
    if (selections.includes('size-checking') || selections.includes('all')) {
      modules.push('size-checking');
    }

    if (selections.includes('css-optimization') || selections.includes('all')) {
      modules.push('css-optimization');
    }

    // Store specific text processing preferences
    this.storeTextProcessingPreferences(selections);

    return modules;
  }

  private storeTextProcessingPreferences(selectedModules: string[]): void {
    // Store preferences for text processing sub-modules
    // This could be used by the text processor to enable/disable specific features
    const preferences = {
      prepositions: selectedModules.includes('text-processing-prepositions') || selectedModules.includes('all'),
      superscript: selectedModules.includes('text-processing-superscript') || selectedModules.includes('all'),
    };
    
    // We can store this in a temporary global or pass it to the processor
    (global as Record<string, unknown>).textProcessingPreferences = preferences;
  }

  async confirmProcessing(fileCount: number): Promise<boolean> {
    console.log(chalk.yellow(`\n⚠️  About to process ${fileCount} files.`));
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Continue with processing?',
        default: true,
      }
    ]);

    return confirm;
  }

  async askForConfigPath(): Promise<string | null> {
    const { hasCustomConfig } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'hasCustomConfig',
        message: 'Use custom config file?',
        default: false,
      }
    ]);

    if (!hasCustomConfig) {
      return null;
    }

    const { configPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'configPath',
        message: 'Enter path to config file:',
        default: 'tinytailor.config.js',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Config path cannot be empty.';
          }
          return true;
        }
      }
    ]);

    return configPath.trim();
  }

  showProcessingStart(): void {
    console.log(chalk.green.bold('\n🚀 Starting processing...\n'));
  }

  showProcessingComplete(
    changedFiles: number,
    totalFiles: number,
    duration: number
  ): void {
    console.log(chalk.green.bold('\n✨ Processing completed!\n'));
    console.log(chalk.cyan(`📊 Files processed: ${changedFiles}/${totalFiles}`));
    console.log(chalk.cyan(`⏱️  Duration: ${duration.toFixed(2)}s`));
    console.log(chalk.gray('\n📄 Check the generated report for detailed information.'));
  }

  showError(error: string): void {
    console.log(chalk.red.bold('\n❌ Error occurred:\n'));
    console.log(chalk.red(error));
  }

  showWarning(warning: string): void {
    console.log(chalk.yellow.bold('\n⚠️  Warning:\n'));
    console.log(chalk.yellow(warning));
  }

  showInfo(info: string): void {
    console.log(chalk.blue.bold('\nℹ️  Information:\n'));
    console.log(chalk.blue(info));
  }
}
import * as fs from 'fs-extra';
import * as path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';

export async function initCommand(): Promise<void> {
  const cwd = process.cwd();
  const configPath = path.join(cwd, 'tinytailor.config.js');
  const reportsDir = path.join(cwd, 'tinytailor_reports');
  const gitignorePath = path.join(cwd, '.gitignore');
  
  console.log(chalk.cyan.bold('\n🎯 TinyTailor Initialization\n'));
  
  // Check if config already exists
  if (await fs.pathExists(configPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Config file already exists at ${chalk.yellow('tinytailor.config.js')}. Overwrite?`,
        default: false,
      },
    ]);
    
    if (!overwrite) {
      console.log(chalk.yellow('⚠ Initialization cancelled.'));
      return;
    }
  }
  
  // Copy template config
  const templatePath = path.join(__dirname, '../../../templates/tinytailor.config.js');
  
  try {
    await fs.copy(templatePath, configPath);
    console.log(chalk.green('✓'), `Created ${chalk.cyan('tinytailor.config.js')}`);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(chalk.red('✗'), `Failed to create config file: ${errorMsg}`);
    return;
  }
  
  // Create reports directory
  try {
    await fs.ensureDir(reportsDir);
    console.log(chalk.green('✓'), `Created ${chalk.cyan('tinytailor_reports/')} directory`);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(chalk.red('✗'), `Failed to create reports directory: ${errorMsg}`);
  }
  
  // Ask about .gitignore
  const { addToGitignore } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addToGitignore',
      message: `Add ${chalk.cyan('tinytailor_reports/')} to .gitignore?`,
      default: true,
    },
  ]);
  
  if (addToGitignore) {
    try {
      let gitignoreContent = '';
      
      if (await fs.pathExists(gitignorePath)) {
        gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
      }
      
      const gitignoreEntry = 'tinytailor_reports/';
      
      if (!gitignoreContent.includes(gitignoreEntry)) {
        const newContent = gitignoreContent + (gitignoreContent.endsWith('\n') ? '' : '\n') + 
                          `\n# TinyTailor reports\n${gitignoreEntry}\n`;
        await fs.writeFile(gitignorePath, newContent);
        console.log(chalk.green('✓'), `Added ${chalk.cyan('tinytailor_reports/')} to .gitignore`);
      } else {
        console.log(chalk.blue('ℹ'), `${chalk.cyan('tinytailor_reports/')} already in .gitignore`);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(chalk.red('✗'), `Failed to update .gitignore: ${errorMsg}`);
    }
  }
  
  // Show completion message
  console.log(chalk.green.bold('\n🎉 Initialization complete!\n'));
  console.log('Next steps:');
  console.log(`  1. Review and customize ${chalk.cyan('tinytailor.config.js')}`);
  console.log(`  2. Run ${chalk.cyan('tinytailor')} to start processing`);
  console.log(`  3. Check the generated reports in ${chalk.cyan('tinytailor_reports/')}\n`);
}
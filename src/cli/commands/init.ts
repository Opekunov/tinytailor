import * as fs from 'fs-extra';
import * as path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';

type ModuleSystem = 'esm' | 'commonjs' | 'typescript';
type ConfigTemplate = {
  filename: string;
  templatePath: string;
  description: string;
};

// Detect project's module system automatically
async function detectModuleSystem(projectRoot: string): Promise<ModuleSystem | null> {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  try {
    // Check package.json for "type": "module"
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      if (packageJson.type === 'module') {
        return 'esm';
      }
    }
    
    // Check for TypeScript configuration
    const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
    if (await fs.pathExists(tsConfigPath)) {
      return 'typescript';
    }
    
    // Check for .mjs files (indicates ES modules usage)
    const files = await fs.readdir(projectRoot);
    const hasMjsFiles = files.some(file => file.endsWith('.mjs'));
    if (hasMjsFiles) {
      return 'esm';
    }
    
    // Check for modern config files that typically use ES modules
    const esmConfigFiles = ['vite.config.js', 'rollup.config.js', 'vitest.config.js'];
    const hasEsmConfigs = esmConfigFiles.some(configFile => 
      files.includes(configFile)
    );
    if (hasEsmConfigs) {
      return 'esm';
    }
    
    return null; // Unable to detect, will ask user
  } catch (error) {
    console.warn(chalk.yellow('⚠ Failed to detect module system automatically'));
    return null;
  }
}

// Get available config templates
function getConfigTemplates(): Record<ModuleSystem, ConfigTemplate> {
  return {
    esm: {
      filename: 'tinytailor.config.mjs',
      templatePath: path.join(__dirname, '../../../templates/tinytailor.config.mjs'),
      description: 'ES Modules (export default) - Modern JavaScript'
    },
    commonjs: {
      filename: 'tinytailor.config.js', 
      templatePath: path.join(__dirname, '../../../templates/tinytailor.config.js'),
      description: 'CommonJS (module.exports) - Traditional Node.js'
    },
    typescript: {
      filename: 'tinytailor.config.ts',
      templatePath: path.join(__dirname, '../../../templates/tinytailor.config.ts'),
      description: 'TypeScript (export default) - Type-safe configuration'
    }
  };
}

export async function initCommand(): Promise<void> {
  const cwd = process.cwd();
  const reportsDir = path.join(cwd, 'tinytailor_reports');
  const gitignorePath = path.join(cwd, '.gitignore');
  
  console.log(chalk.cyan.bold('\n🎯 TinyTailor Initialization\n'));
  
  // Detect module system automatically
  console.log(chalk.blue('🔍 Detecting project module system...'));
  const detectedSystem = await detectModuleSystem(cwd);
  
  const templates = getConfigTemplates();
  let selectedTemplate: ConfigTemplate;
  
  if (detectedSystem) {
    console.log(chalk.green(`✓ Detected: ${detectedSystem}`));
    
    const { useDetected } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useDetected',
        message: `Use detected module system (${templates[detectedSystem].description})?`,
        default: true,
      },
    ]);
    
    if (useDetected) {
      selectedTemplate = templates[detectedSystem];
    } else {
      const { moduleSystem } = await inquirer.prompt([
        {
          type: 'list',
          name: 'moduleSystem',
          message: 'Choose module system:',
          choices: Object.entries(templates).map(([key, template]) => ({
            name: template.description,
            value: key,
          })),
        },
      ]);
      selectedTemplate = templates[moduleSystem as ModuleSystem];
    }
  } else {
    console.log(chalk.yellow('⚠ Could not auto-detect module system'));
    
    const { moduleSystem } = await inquirer.prompt([
      {
        type: 'list',
        name: 'moduleSystem',
        message: 'Choose module system:',
        choices: Object.entries(templates).map(([key, template]) => ({
          name: template.description,
          value: key,
        })),
      },
    ]);
    selectedTemplate = templates[moduleSystem as ModuleSystem];
  }
  
  const configPath = path.join(cwd, selectedTemplate.filename);
  
  // Check if config already exists
  if (await fs.pathExists(configPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Config file already exists at ${chalk.yellow(selectedTemplate.filename)}. Overwrite?`,
        default: false,
      },
    ]);
    
    if (!overwrite) {
      console.log(chalk.yellow('⚠ Initialization cancelled.'));
      return;
    }
  }
  
  // Copy selected template
  try {
    await fs.copy(selectedTemplate.templatePath, configPath);
    console.log(chalk.green('✓'), `Created ${chalk.cyan(selectedTemplate.filename)}`);
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
  console.log(`  1. Review and customize ${chalk.cyan(selectedTemplate.filename)}`);
  console.log(`  2. Run ${chalk.cyan('tinytailor')} to start processing`);
  console.log(`  3. Check the generated reports in ${chalk.cyan('tinytailor_reports/')}\n`);
}
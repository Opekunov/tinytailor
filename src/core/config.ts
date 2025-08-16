import * as path from 'path';
import * as fs from 'fs-extra';
import { TinyTailorConfig, VMSandbox, PartialTinyTailorConfig } from '../types';

const DEFAULT_CONFIG: TinyTailorConfig = {
  projectRoot: process.cwd(),
  publicRoot: path.join(process.cwd(), 'public'),
  
  scanGlobs: [
    '**/*.blade.php',
    '**/*.html',
    '**/*.vue',
    '!vendor/**',
    '!node_modules/**',
    '!storage/**',
    '!bootstrap/cache/**',
    '!resources/views/vendor/**',
    '!resources/views/emails/**',
    '!storage/framework/views/**',
  ],
  
  excludePaths: [],
  excludeFiles: [],
  
  imageOptimization: {
    enabled: true,
    excludedExtensions: ['.webp'],
    wrapLooseImg: false,
    mobileWidth1x: 640,
    retinaMultiplier: 2,
    onlyDownscaleIfWiderThan: 800,
    mobileMedia: '(max-width: 640px)',
    jpgQuality: 78,
    webpQuality: 80,
    rasterExts: ['.jpg', '.jpeg', '.png', '.webp'],
    markerAttr: 'data-optimized',
    pngRecompress: {
      enabled: true,
      sizeThresholdBytes: 8 * 1024 * 1024, // 8 MB
      minPixelsThreshold: 12_000_000, // ~3464×3464
      compressionLevel: 9,
      effort: 9,
      adaptiveFiltering: true,
      log: true,
    },
  },
  
  textProcessing: {
    hangingPrepositions: {
      enabled: true,
      fileExtensions: ['.html', '.blade.php', '.vue'],
      prepositions: [
        // Primary prepositions (основные предлоги)
        'в', 'во', 'на', 'за', 'под', 'над', 'от', 'до', 'из', 'к', 'ко', 'с', 'со', 
        'у', 'о', 'об', 'при', 'через', 'между', 'среди', 'без', 'для', 'после', 
        'перед', 'про', 'по',
        
        // Extended prepositions (расширенные предлоги)  
        'вокруг', 'около', 'возле', 'против', 'вместо', 'кроме', 'сквозь', 'вдоль', 
        'поперек', 'наряду', 'помимо', 'согласно', 'благодаря', 'вопреки', 'навстречу',
        'касательно', 'относительно', 'насчет', 'ввиду', 'вследствие', 'посредством',
        'путем', 'силой', 'дабы', 'чтобы', 'ради', 'мимо', 'кругом', 'вдоль',
        
        // Conjunctions (союзы)
        'и', 'а', 'но', 'да', 'или', 'либо', 'то', 'ни', 'что', 'как', 'когда', 
        'где', 'куда', 'откуда', 'пока', 'если', 'хотя', 'чтобы', 'словно', 'будто',
        
        // Particles (частицы) 
        'не', 'ни', 'же', 'ли', 'бы', 'ведь', 'вот', 'вон', 'уж', 'ну', 'да', 'нет',
        'еще', 'уже', 'только', 'лишь', 'даже', 'именно', 'как', 'будто', 'словно',
        
        // Short pronouns and words (короткие местоимения и слова)
        'я', 'он', 'мы', 'вы', 'их', 'им', 'те', 'то', 'та', 'ту', 'ты', 'мне', 'тебе',
        'нам', 'вам', 'них', 'нее', 'его', 'ее', 'них', 'тот', 'эта', 'это', 'тут', 'там',
        
        // Numbers and temporal words (числительные и временные слова)
        'два', 'три', 'пять', 'сто', 'год', 'лет', 'дня', 'час', 'раз', 'все', 'всех',
        'всем', 'кто', 'что', 'чем', 'чей', 'чья', 'чье', 'чьи', 'кого', 'кому', 'кем',
        
        // English prepositions (английские предлоги)
        'a', 'an', 'the', 'in', 'on', 'at', 'by', 'for', 'of', 'to', 'from', 'with', 'without',
        'under', 'over', 'above', 'below', 'into', 'onto', 'upon', 'within', 'beyond', 'across',
        'through', 'throughout', 'around', 'about', 'near', 'beside', 'between', 'among', 'amid',
        'against', 'toward', 'towards', 'before', 'after', 'during', 'since', 'until', 'till',
        'despite', 'except', 'beside', 'besides', 'along', 'beneath', 'inside', 'outside',
        'regarding', 'concerning', 'considering', 'including', 'excluding', 'following',
        'according', 'depending', 'owing', 'due', 'prior', 'subsequent', 'pursuant', 'via',
        
        // English conjunctions (английские союзы)  
        'and', 'or', 'but', 'nor', 'yet', 'so', 'as', 'if', 'when', 'where', 'why', 'how',
        'that', 'what', 'who', 'whom', 'whose', 'which', 'while', 'since', 'until', 'unless',
        'though', 'although', 'because', 'whereas', 'wherever', 'whenever', 'however',
        'therefore', 'moreover', 'furthermore', 'nevertheless', 'nonetheless', 'otherwise',
        
        // English articles and determiners (английские артикли и определители)
        'this', 'that', 'these', 'those', 'some', 'any', 'all', 'each', 'every', 'both',
        'either', 'neither', 'such', 'much', 'many', 'few', 'little', 'more', 'most',
        'less', 'least', 'no', 'none', 'one', 'two', 'ten', 'one\'s', 'my', 'our', 'your',
        'his', 'her', 'its', 'their',
        
        // English short words and pronouns (английские короткие слова и местоимения)
        'I', 'me', 'we', 'us', 'you', 'he', 'him', 'she', 'her', 'it', 'they', 'them',
        'am', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'do', 'did',
        'will', 'would', 'can', 'could', 'may', 'might', 'must', 'shall', 'should',
        'up', 'out', 'off', 'down', 'away', 'back', 'here', 'there', 'now', 'then',
        'yes', 'no', 'not', 'too', 'very', 'so', 'just', 'only', 'also', 'even', 'still'
      ],
    },
    superscriptReplacements: {
      enabled: true,
      replacements: [
        { from: 'м2', to: 'м<sup>2</sup>' },
        { from: 'м3', to: 'м<sup>3</sup>' },
        { from: 'км2', to: 'км<sup>2</sup>' },
        { from: 'км3', to: 'км<sup>3</sup>' },
        { from: 'см2', to: 'см<sup>2</sup>' },
        { from: 'см3', to: 'см<sup>3</sup>' },
        { from: 'мм2', to: 'мм<sup>2</sup>' },
        { from: 'мм3', to: 'мм<sup>3</sup>' },
      ],
    },
  },
  
  sizeChecking: {
    enabled: false,
    threshold: 50, // 50% bigger than needed
  },

  cssOptimization: {
    enabled: true,
    webpEnabled: true,
    fileExtensions: ['.css', '.scss', '.sass'],
  },
  
  logging: {
    console: true,
    markdownReport: true,
    reportDir: 'tinytailor_reports',
  },
};

export class ConfigManager {
  private config: TinyTailorConfig;
  private configPath: string;

  constructor(projectRoot?: string) {
    const root = projectRoot || process.cwd();
    this.configPath = path.join(root, 'tinytailor.config.js');
    this.config = {
      ...DEFAULT_CONFIG,
      projectRoot: root,
      publicRoot: path.join(root, 'public'),
    };
  }

  async loadConfig(): Promise<TinyTailorConfig> {
    try {
      if (await fs.pathExists(this.configPath)) {
        let userConfig: unknown;
        
        try {
          // Try require first - most compatible for CommonJS
          const configPath = path.resolve(this.configPath);
          delete require.cache[configPath];
          const requiredConfig = require(configPath);
          
          // Handle both module.exports and export default
          userConfig = requiredConfig.default || requiredConfig;
        } catch (requireError: unknown) {
          // If require fails, try to load as JS file by reading and evaluating
          try {
            const configContent = await fs.readFile(this.configPath, 'utf8');
            
            // Check if it uses ES6 export syntax
            const hasESExport = /export\s+default/.test(configContent);
            
            if (hasESExport) {
              // Handle ES6 export default syntax
              const modifiedContent = configContent
                .replace(/export\s+default\s+/, 'module.exports = ')
                .replace(/export\s*\{\s*([^}]+)\s+as\s+default\s*\}/, 'module.exports = $1');
              
              // Create a safe evaluation context
              const sandbox: VMSandbox = {
                module: { exports: {} },
                exports: {},
                require: require,
                __dirname: path.dirname(this.configPath),
                __filename: this.configPath,
                console: console,
                Buffer: Buffer,
                process: process,
                global: global,
              };
              
              sandbox.exports = sandbox.module.exports;
              
              const vm = require('vm');
              const context = vm.createContext(sandbox);
              vm.runInContext(modifiedContent, context, {
                filename: this.configPath,
                timeout: 5000,
              });
              
              userConfig = sandbox.module.exports as unknown;
            } else {
              // Handle CommonJS module.exports
              const sandbox: VMSandbox = {
                module: { exports: {} },
                exports: {},
                require: require,
                __dirname: path.dirname(this.configPath),
                __filename: this.configPath,
                console: console,
                Buffer: Buffer,
                process: process,
                global: global,
              };
              
              sandbox.exports = sandbox.module.exports;
              
              const vm = require('vm');
              const context = vm.createContext(sandbox);
              vm.runInContext(configContent, context, {
                filename: this.configPath,
                timeout: 5000,
              });
              
              userConfig = sandbox.module.exports as unknown;
            }
            
            if (!userConfig || typeof userConfig !== 'object') {
              throw new Error('Config file did not export a valid configuration object');
            }
          } catch (vmError: unknown) {
            const requireMsg = requireError instanceof Error ? requireError.message : String(requireError);
            const vmMsg = vmError instanceof Error ? vmError.message : String(vmError);
            throw new Error(`Failed to load config - require error: ${requireMsg}, vm error: ${vmMsg}`);
          }
        }
        
        // Deep merge user config with defaults
        const userConfigTyped = userConfig as PartialTinyTailorConfig;
        this.config = this.mergeConfigs(DEFAULT_CONFIG, userConfigTyped);
        this.config.projectRoot = path.dirname(this.configPath);
        
        // Update publicRoot if not explicitly set
        if (!userConfigTyped.publicRoot) {
          this.config.publicRoot = path.join(this.config.projectRoot, 'public');
        }
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Could not load config from ${this.configPath}:`, errorMsg);
      console.warn('Using default configuration.');
    }

    return this.config;
  }

  getConfig(): TinyTailorConfig {
    return this.config;
  }

  getDefaultConfig(): TinyTailorConfig {
    return { ...DEFAULT_CONFIG };
  }

  private mergeConfigs(defaultConfig: TinyTailorConfig, userConfig: PartialTinyTailorConfig): TinyTailorConfig {
    const result = { ...defaultConfig };
    
    for (const key in userConfig) {
      const userValue = userConfig[key as keyof PartialTinyTailorConfig];
      const defaultValue = defaultConfig[key as keyof TinyTailorConfig];
      
      if (userValue !== null && typeof userValue === 'object' && !Array.isArray(userValue) && defaultValue && typeof defaultValue === 'object') {
        // For nested objects, recursively merge
        (result as Record<string, unknown>)[key] = {
          ...(defaultValue as Record<string, unknown>),
          ...(userValue as Record<string, unknown>)
        };
      } else if (userValue !== undefined) {
        // For primitive values or arrays, use user value
        (result as Record<string, unknown>)[key] = userValue as unknown;
      }
    }
    
    return result;
  }

  async validateConfig(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Check if project root exists
    if (!await fs.pathExists(this.config.projectRoot)) {
      errors.push(`Project root does not exist: ${this.config.projectRoot}`);
    }
    
    // Check if public root exists (optional) - only warn in non-test environments
    if (this.config.publicRoot && !await fs.pathExists(this.config.publicRoot) && !process.env.NODE_ENV?.includes('test')) {
      console.warn(`Warning: Public root does not exist: ${this.config.publicRoot}`);
    }
    
    // Validate image quality settings
    if (this.config.imageOptimization.jpgQuality < 1 || this.config.imageOptimization.jpgQuality > 100) {
      errors.push('JPG quality must be between 1 and 100');
    }
    
    if (this.config.imageOptimization.webpQuality < 1 || this.config.imageOptimization.webpQuality > 100) {
      errors.push('WebP quality must be between 1 and 100');
    }

    // Validate CSS optimization settings
    if (this.config.cssOptimization.fileExtensions.length === 0) {
      errors.push('CSS optimization file extensions cannot be empty');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
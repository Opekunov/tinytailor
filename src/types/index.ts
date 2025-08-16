export interface TinyTailorConfig {
  // Project paths
  projectRoot: string;
  publicRoot: string;
  
  // File scanning
  scanGlobs: string[];
  excludePaths: string[];
  excludeFiles: string[];
  
  // Image processing
  imageOptimization: {
    enabled: boolean;
    excludedExtensions: string[];
    wrapLooseImg: boolean;
    mobileWidth1x: number;
    retinaMultiplier: number;
    onlyDownscaleIfWiderThan: number;
    mobileMedia: string;
    jpgQuality: number;
    webpQuality: number;
    rasterExts: string[];
    markerAttr: string;
    pngRecompress: {
      enabled: boolean;
      sizeThresholdBytes: number;
      minPixelsThreshold: number;
      compressionLevel: number;
      effort: number;
      adaptiveFiltering: boolean;
      log: boolean;
    };
  };
  
  // Text processing
  textProcessing: {
    hangingPrepositions: {
      enabled: boolean;
      fileExtensions: string[];
      prepositions: string[];
    };
    superscriptReplacements: {
      enabled: boolean;
      replacements: Array<{
        from: string;
        to: string;
      }>;
    };
  };
  
  // Size checking
  sizeChecking: {
    enabled: boolean;
    threshold: number; // percentage difference to trigger warning
  };
  
  // CSS optimization
  cssOptimization: {
    enabled: boolean;
    webpEnabled: boolean;
    fileExtensions: string[];
  };
  
  // Logging
  logging: {
    console: boolean;
    markdownReport: boolean;
    reportDir: string;
  };
}

export interface ProcessingResult {
  changedFiles: number;
  totalFiles: number;
  images: {
    processed: number;
    webpConverted: number;
    downscaled: number;
    recompressed: number;
  };
  text: {
    hangingPrepositionsFixed: number;
    superscriptReplacements: number;
  };
  css: {
    processed: number;
    backgroundImagesProcessed: number;
    webpRulesAdded: number;
  };
  errors: ProcessingError[];
  warnings: ProcessingWarning[];
}

export interface ProcessingError {
  file: string;
  message: string;
  stack?: string;
}

export interface ProcessingWarning {
  file: string;
  message: string;
  suggestion?: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ImageDerivatives {
  dir: string;
  base: string;
  ext: string;
  mob1x: string;
  mob2x: string;
  webp: string;
  mob1xWebp: string;
  mob2xWebp: string;
}

export interface MenuChoice {
  name: string;
  value: string;
  description?: string;
}

export type ProcessingModule = 'image-optimization' | 'text-processing' | 'size-checking' | 'css-optimization';

export interface CssProcessingResult {
  changed: boolean;
  backgroundImagesProcessed: number;
  webpRulesAdded: number;
  errors: ProcessingError[];
}

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  success(message: string): void;
  debug(message: string): void;
  startOperation(message: string): void;
  endOperation(message: string): void;
  logImageProcessing(filePath: string, action: string, sizeBefore: number, sizeAfter: number): void;
  logTextProcessing(filePath: string, replacements: number, type: string): void;
  logCssProcessing(filePath: string, backgroundImages: number, webpRules: number): void;
}
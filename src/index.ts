// Main API exports for programmatic usage
export { ConfigManager } from './core/config';
export { TinyTailorProcessor } from './core/processor';
export { TinyTailorLogger } from './utils/logger';
export { FileUtils } from './utils/file-utils';
export { PathResolver } from './utils/path-resolver';
export { ImageOptimizer } from './modules/image-optimizer';
export { TextProcessor } from './modules/text-processor';
export { InteractiveMenu } from './cli/interactive-menu';

// Type exports
export * from './types';

// CLI exports
export { initCommand } from './cli/commands/init';
export { runCommand } from './cli/commands/run';
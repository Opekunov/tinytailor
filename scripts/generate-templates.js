#!/usr/bin/env node

/**
 * Generate .js and .mjs config templates from the TypeScript template
 * This ensures all config formats stay in sync automatically
 */

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../templates');
const TS_TEMPLATE = path.join(TEMPLATES_DIR, 'tinytailor.config.ts');
const JS_TEMPLATE = path.join(TEMPLATES_DIR, 'tinytailor.config.js');
const MJS_TEMPLATE = path.join(TEMPLATES_DIR, 'tinytailor.config.mjs');

function generateTemplates() {
  console.log('🔄 Generating config templates from TypeScript source...');

  // Read the TypeScript template
  const tsContent = fs.readFileSync(TS_TEMPLATE, 'utf8');

  // Convert TS to JS
  const jsContent = convertToJS(tsContent);
  
  // Convert TS to MJS (ES modules)
  const mjsContent = convertToMJS(tsContent);

  // Write the generated files
  fs.writeFileSync(JS_TEMPLATE, jsContent);
  fs.writeFileSync(MJS_TEMPLATE, mjsContent);

  console.log('✅ Generated:');
  console.log(`   📄 ${path.relative(process.cwd(), JS_TEMPLATE)}`);
  console.log(`   📄 ${path.relative(process.cwd(), MJS_TEMPLATE)}`);
}

function convertToJS(tsContent) {
  return tsContent
    // Remove TypeScript import type
    .replace(/import type \{ TinyTailorConfig \} from 'tinytailor';\s*\n/, '')
    // Remove TypeScript type annotation
    .replace(/const config: TinyTailorConfig = \{/, 'const config = {')
    // Change export syntax to CommonJS
    .replace(/export default config;/, 'module.exports = config;')
    // Update header comment for JS
    .replace(/TinyTailor Configuration Guide \(TypeScript\)/g, 'TinyTailor Configuration Guide (JavaScript)')
    .replace(/This is the TypeScript version of the configuration file\./g, 'This is the JavaScript version of the configuration file.')
    .replace(/Use this format for maximum type safety and IntelliSense support\s*\nin modern TypeScript projects\./g, 'Use this format for traditional Node.js projects with CommonJS modules.')
    .replace(/✨ TypeScript Benefits:[\s\S]*?• Auto-completion for configuration options\s*\n\s*\n/g, '✨ JavaScript Benefits:\n   • Works in any Node.js environment\n   • No compilation step required\n   • Simple and straightforward syntax\n   • Compatible with older tooling\n\n');
}

function convertToMJS(tsContent) {
  return tsContent
    // Remove TypeScript import type  
    .replace(/import type \{ TinyTailorConfig \} from 'tinytailor';\s*\n/, '')
    // Remove TypeScript type annotation
    .replace(/const config: TinyTailorConfig = \{/, 'const config = {')
    // Change export syntax to ES modules
    .replace(/export default config;/, 'export default config;') // Keep as is for MJS
    // Update header comment for MJS
    .replace(/TinyTailor Configuration Guide \(TypeScript\)/g, 'TinyTailor Configuration Guide (ES Modules)')
    .replace(/This is the TypeScript version of the configuration file\./g, 'This is the ES Modules version of the configuration file.')
    .replace(/Use this format for maximum type safety and IntelliSense support\s*\nin modern TypeScript projects\./g, 'Use this format for modern Node.js projects with ES modules support.')
    .replace(/✨ TypeScript Benefits:[\s\S]*?• Auto-completion for configuration options\s*\n\s*\n/g, '✨ ES Modules Benefits:\n   • Modern JavaScript syntax\n   • Tree-shaking support\n   • Better static analysis\n   • Future-proof module system\n\n');
}

// Run the script
if (require.main === module) {
  try {
    generateTemplates();
  } catch (error) {
    console.error('❌ Error generating templates:', error.message);
    process.exit(1);
  }
}

module.exports = { generateTemplates };
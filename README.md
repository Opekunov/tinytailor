# TinyTailor

> ⚠️ **Notice**: This code was generated as part of an exploration with Claude.ai and is not recommended for production use.

A powerful tool for optimizing images and fixing text in HTML, Blade, and Vue files.

## Features

### 🖼️ Image Optimization
- **WebP Conversion**: Automatically converts images to WebP format with fallbacks
- **Responsive Images**: Creates mobile versions (@1x, @2x) for better performance
- **PNG Recompression**: Optimizes large PNG files by removing metadata and recompressing
- **Picture Tag Generation**: Wraps images in `<picture>` tags with appropriate `<source>` elements
- **Smart Processing**: Preserves original file structure and handles Laravel `asset()` helper

### 📝 Text Processing  
- **Hanging Prepositions**: Replaces spaces after prepositions with `&nbsp;` to prevent awkward line breaks
- **Superscript Units**: Converts m², m³, km² etc. to proper HTML with `<sup>` tags
- **Smart Processing**: Avoids processing text inside HTML tags and attributes
- **Multilingual Support**: Built-in support for Russian prepositions, easily extensible

### 🎨 CSS WebP Optimization (NEW!)
- **Background Image Optimization**: Automatically generates WebP versions of CSS background images
- **Browser-Compatible Rules**: Uses `@supports` queries for progressive enhancement
- **Multiple Format Support**: Works with CSS, SCSS, and SASS files
- **Fallback Support**: Ensures compatibility with older browsers

### 📏 Size Checking (Experimental)
- **Dimension Analysis**: Compares image actual dimensions to CSS display sizes
- **Performance Warnings**: Alerts when images are significantly oversized
- **Optimization Recommendations**: Suggests improvements for better performance

### 🛠️ Developer Experience
- **Interactive CLI**: Easy-to-use command-line interface with beautiful output
- **Flexible Configuration**: Full configuration support with sensible defaults (CommonJS & ESM)
- **Detailed Reporting**: Console output with markdown reports
- **Multiple File Formats**: Supports HTML, Vue, Blade, CSS, SCSS, SASS

## 🚀 Planned Features (Roadmap)

### 🎨 Advanced Image Processing
- **AVIF Support**: Next-generation image format with even better compression than WebP
- **SVG Optimization**: Minification, path optimization, and metadata removal
- **Progressive JPEG**: Optimized loading for better perceived performance
- **Smart Crop**: AI-powered focal point detection for responsive images
- **Lazy Loading**: Automatic implementation of intersection observer-based lazy loading

### 🔤 Font & Typography Optimization
- **Font Subsetting**: Automatically create subsets containing only used characters
- **WOFF2 Conversion**: Convert legacy font formats to modern WOFF2
- **Font Display Optimization**: Smart `font-display: swap` implementation
- **Preload Hints**: Automatic `<link rel="preload">` for critical fonts
- **Typography Enhancer**: Smart quotes, em dashes, and professional typography

### ⚡ Performance Optimization
- **Critical CSS Extraction**: Above-the-fold CSS inlining for faster rendering
- **Resource Hints**: Automatic DNS prefetch, preconnect, and prefetch
- **Bundle Analysis**: File size tracking and performance budgets
- **Core Web Vitals**: Automated CLS, LCP, and FID optimization
- **Service Worker**: Automatic caching strategy generation

### 🔍 SEO & Accessibility
- **Alt Text Generator**: AI-powered alt text for images missing descriptions
- **Structured Data**: Automatic JSON-LD generation for better SEO
- **Meta Tag Optimizer**: Social media and search engine meta tags
- **Accessibility Audit**: WCAG compliance checking and fixes
- **Sitemap Generator**: Dynamic XML sitemap creation

### 🧩 Framework Integrations
- **Webpack Plugin**: Seamless integration with Webpack build process
- **Vite Plugin**: Lightning-fast development with Vite support
- **Next.js Plugin**: Optimized for Next.js image and CSS workflows  
- **Nuxt Module**: Native Nuxt.js module with SSR support
- **Astro Integration**: Static site optimization for Astro projects

### 📊 Advanced Analytics
- **Performance Monitoring**: Real-time Core Web Vitals tracking
- **Optimization Reports**: Before/after comparisons with metrics
- **CI/CD Integration**: Automated performance regression detection
- **Lighthouse CI**: Automated performance scoring
- **Bundle Size Tracking**: Monitor asset size changes over time

### 🌐 Multi-language Support
- **Internationalization**: Smart text processing for multiple languages
- **RTL Support**: Right-to-left language optimization
- **Font Loading**: Language-specific font optimization
- **Hyphenation**: Automatic hyphenation for better text flow
- **Content Analysis**: Language-aware typography improvements

### 🔧 Advanced Configuration
- **Visual Config Builder**: Web-based configuration generator
- **Preset Templates**: Ready-made configs for popular frameworks
- **Plugin System**: Extensible architecture for custom processors
- **Hot Reload**: Real-time config changes during development
- **Environment Profiles**: Different settings for dev/staging/production

## What Problems Does TinyTailor Solve?

### Manual Web Development Tasks That Eat Hours of Your Time:

#### 🖼️ **Image & Media Hell**
1. **WebP Conversion Nightmare**: Converting hundreds of images to WebP, creating fallbacks, writing complex picture tags
2. **Responsive Image Setup**: Creating @1x, @2x, @3x versions for every screen size and device
3. **CSS Background Images**: Adding WebP support with browser compatibility fallbacks
4. **SVG Optimization**: Manually cleaning up designer-exported SVGs with bloated code
5. **Font Performance**: Converting fonts to WOFF2, creating subsets, managing font-display

#### 📝 **Typography & Content Torture**  
6. **Hanging Prepositions**: Finding and fixing awkward line breaks in multi-page content
7. **Professional Typography**: Converting quotes to smart quotes, adding proper em dashes
8. **Unit Formatting**: Converting measurement units (m², km³) to proper superscript across content
9. **Multi-language Support**: Handling typography rules for different languages and scripts
10. **Accessibility Text**: Writing alt text for hundreds of images manually

#### ⚡ **Performance Optimization Pain**
11. **Critical CSS Extraction**: Manually identifying and inlining above-the-fold styles  
12. **Bundle Size Monitoring**: Tracking asset sizes and preventing performance regressions
13. **Core Web Vitals**: Optimizing LCP, CLS, FID across dozens of pages
14. **Resource Hints**: Adding preload, prefetch, preconnect tags for optimal loading
15. **Lazy Loading**: Implementing intersection observers for images and content

#### 🔍 **SEO & Meta Tag Madness**
16. **Meta Tag Generation**: Creating Open Graph, Twitter Cards, and search meta tags
17. **Structured Data**: Writing JSON-LD markup for better search visibility  
18. **Sitemap Management**: Keeping XML sitemaps updated with new content
19. **Image Alt Text**: Ensuring every image has descriptive alt text for accessibility
20. **Social Media Optimization**: Perfect sharing previews across all platforms

#### 🧩 **Build Process Bottlenecks**
21. **Framework Integration**: Setting up optimization for Webpack, Vite, Next.js separately
22. **Development Workflow**: Hot reloading configs and seeing optimization results instantly
23. **CI/CD Setup**: Automated performance testing and regression detection
24. **Environment Management**: Different optimization settings for dev/staging/production

### Before TinyTailor (Manual Process):
```html
<!-- You had to manually create: -->
<img src="hero.jpg" alt="Hero image">

<!-- And convert it to: -->
<picture>
  <source media="(max-width: 640px)" srcset="hero-mobile.webp, hero-mobile@2x.webp 2x" type="image/webp">
  <source media="(max-width: 640px)" srcset="hero-mobile.jpg, hero-mobile@2x.jpg 2x">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" alt="Hero image">
</picture>
```

### TinyTailor Solution (Current + Planned):

#### ✅ **Already Automated** (Available Now):
```bash
npx tinytailor
# ✅ WebP conversion with picture tag fallbacks
# ✅ Responsive @1x/@2x image generation  
# ✅ CSS background-image WebP optimization
# ✅ Hanging prepositions fix with &nbsp;
# ✅ Superscript unit conversion (m² → m<sup>2</sup>)
# ✅ PNG recompression for large files
# ✅ Size mismatch warnings and recommendations
```

#### 🚀 **Coming Soon** (Roadmap Features):
```bash
npx tinytailor --future-mode
# 🔜 AVIF + SVG optimization
# 🔜 Font subsetting and WOFF2 conversion
# 🔜 Critical CSS extraction and inlining
# 🔜 AI-powered alt text generation
# 🔜 Automatic structured data (JSON-LD)
# 🔜 Smart quotes and professional typography
# 🔜 Framework plugins (Webpack/Vite/Next.js)
# 🔜 Core Web Vitals optimization
# 🔜 Multi-language typography support
```

**The Vision**: One command that handles **all** your web optimization needs, from images and fonts to SEO and performance. TinyTailor aims to be the Swiss Army knife of web development automation.

## Installation

```bash
npm install --save-dev tinytailor
```

Or install globally:

```bash
npm install -g tinytailor
```

## Quick Start

1. Initialize TinyTailor in your project:
```bash
tinytailor init
```

2. Run the interactive processing:
```bash
tinytailor
```

## CLI Commands

### Main Commands

- `tinytailor` - Run with interactive menu (default)
- `tinytailor init` - Initialize configuration in current project
- `tinytailor --image-optimization` - Run image optimization only
- `tinytailor --text-processing` - Run text processing only
- `tinytailor --css-optimization` - Run CSS WebP optimization only
- `tinytailor --size-checking` - Run size checking only (experimental)
- `tinytailor --help` - Show detailed help

### Options

- `--config <path>` - Use custom config file
- `--skip-menu` - Skip interactive menu and run all enabled modules

### Examples

```bash
# Run specific modules
tinytailor --image-optimization --text-processing

# Use custom config
tinytailor --config ./custom.config.js --skip-menu

# Run all modules without interaction
tinytailor --skip-menu
```

## Configuration

TinyTailor supports both **CommonJS** and **ES Module** configuration formats. Run `tinytailor init` to create a default configuration file with detailed comments.

### Configuration Formats

#### Option 1: CommonJS (tinytailor.config.js)
```javascript
module.exports = {
  // File scanning patterns
  scanGlobs: [
    '**/*.blade.php',
    '**/*.html', 
    '**/*.vue',
    '!vendor/**',
    '!node_modules/**',
  ],

  // Image optimization settings
  imageOptimization: {
    enabled: true,
    mobileWidth1x: 640,
    jpgQuality: 78,
    webpQuality: 80,
  },

  // Text processing settings
  textProcessing: {
    hangingPrepositions: {
      enabled: true,
      prepositions: ['в', 'на', 'и', 'а', 'с', 'для'],
    },
    superscriptReplacements: {
      enabled: true,
      replacements: [
        { from: 'м2', to: 'м<sup>2</sup>' },
        { from: 'м3', to: 'м<sup>3</sup>' },
      ],
    },
  },

  // CSS WebP optimization
  cssOptimization: {
    enabled: true,
    webpEnabled: true,
    fileExtensions: ['.css', '.scss', '.sass'],
  },

  // Logging and reporting
  logging: {
    console: true,
    markdownReport: true,
    reportDir: 'tinytailor_reports',
  },
};
```

#### Option 2: ES Module (tinytailor.config.mjs)
```javascript
export default {
  // File scanning patterns
  scanGlobs: [
    '**/*.blade.php',
    '**/*.html', 
    '**/*.vue',
    '!vendor/**',
    '!node_modules/**',
  ],

  // Image optimization settings
  imageOptimization: {
    enabled: true,
    mobileWidth1x: 640,
    jpgQuality: 78,
    webpQuality: 80,
  },

  // Text processing settings
  textProcessing: {
    hangingPrepositions: {
      enabled: true,
      prepositions: ['в', 'на', 'и', 'а', 'с', 'для'],
    },
    superscriptReplacements: {
      enabled: true,
      replacements: [
        { from: 'м2', to: 'м<sup>2</sup>' },
        { from: 'м3', to: 'м<sup>3</sup>' },
      ],
    },
  },

  // CSS WebP optimization
  cssOptimization: {
    enabled: true,
    webpEnabled: true,
    fileExtensions: ['.css', '.scss', '.sass'],
  },

  // Logging and reporting
  logging: {
    console: true,
    markdownReport: true,
    reportDir: 'tinytailor_reports',
  },
};
```

### Configuration Usage

```bash
# Use CommonJS format
tinytailor --config ./tinytailor.config.js

# Use ES Module format  
tinytailor --config ./tinytailor.config.mjs

# Auto-detect (looks for both formats)
tinytailor
```

> **Note**: The ES Module format (`.mjs`) is recommended for modern TypeScript/ESM projects. The CommonJS format (`.js`) works well with traditional Node.js projects.

## Real-World Use Cases

### E-commerce Sites
- Optimize product images for faster loading
- Fix product description typography
- Generate responsive images for mobile shopping

### Marketing Websites  
- Convert hero images and banners to WebP
- Fix hanging prepositions in marketing copy
- Optimize CSS background images

### Content Management
- Bulk process uploaded images
- Standardize measurement unit formatting
- Improve page load performance

### Laravel/Vue Applications
- Handle `asset()` helper paths correctly
- Process Blade templates and Vue components
- Integrate with existing build processes

## What TinyTailor Does

### Image Processing Flow

1. **Scans** your HTML, Vue, and Blade files for `<img>` tags
2. **Analyzes** image sources and resolves paths (including Laravel `asset()` helper)
3. **Creates** WebP versions of original images
4. **Generates** mobile-optimized versions (@1x and @2x)
5. **Replaces** simple `<img>` tags with responsive `<picture>` elements
6. **Recompresses** large PNG files for better performance

### Text Processing Flow

1. **Parses** HTML content while preserving structure
2. **Identifies** text content (excluding HTML tags and attributes)
3. **Finds** hanging prepositions and short words
4. **Replaces** spaces with `&nbsp;` to prevent line breaks
5. **Converts** measurement units to proper superscript format

### CSS WebP Processing Flow

1. **Scans** CSS, SCSS, and SASS files for `background-image` properties
2. **Extracts** image URLs from CSS rules
3. **Generates** WebP versions of background images
4. **Creates** `@supports` rules for WebP compatibility
5. **Maintains** fallback support for older browsers

## Reporting

TinyTailor generates detailed reports showing:

- Files processed and changes made
- Image optimization statistics (size reduction, formats converted)
- Text processing results (prepositions fixed, units converted)
- CSS optimization results (background images processed)
- Errors and warnings with suggestions
- Performance metrics and processing time

Reports are saved as markdown files in the `tinytailor_reports/` directory.

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
npm run test:watch
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Type Checking

```bash
npm run typecheck
```

## Requirements

- Node.js 16.0.0 or higher
- npm or yarn

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Changelog

### 1.0.0

- Initial release
- Image optimization with WebP conversion and responsive images
- Text processing for hanging prepositions and superscript units
- CSS WebP optimization for background images
- Interactive CLI with beautiful output and progress indicators
- Comprehensive configuration system with sensible defaults
- Detailed markdown reporting and error handling
- Support for HTML, Vue, Blade, CSS, SCSS, and SASS files
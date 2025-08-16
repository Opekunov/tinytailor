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
- **Flexible Configuration**: Full configuration support with sensible defaults
- **Detailed Reporting**: Console output with markdown reports
- **Multiple File Formats**: Supports HTML, Vue, Blade, CSS, SCSS, SASS

## What Problems Does TinyTailor Solve?

### Manual HTML/CSS Tasks That Take Forever:
1. **Image Optimization Nightmare**: Converting dozens of images to WebP, creating responsive versions, writing picture tags with proper fallbacks
2. **Typography Issues**: Manually finding and fixing hanging prepositions in large content files
3. **CSS Background Images**: Adding WebP support to CSS background images with browser compatibility
4. **Unit Formatting**: Converting measurement units (m², km³) to proper superscript across all content
5. **Performance Audits**: Manually checking if images are oversized compared to their display size
6. **Responsive Image Setup**: Creating and managing multiple image sizes for different devices

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

### After TinyTailor (Automated):
```bash
npx tinytailor
# ✅ Converts all images automatically
# ✅ Generates responsive versions  
# ✅ Creates WebP with fallbacks
# ✅ Fixes text typography
# ✅ Optimizes CSS backgrounds
```

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

TinyTailor uses `tinytailor.config.js` for configuration. Run `tinytailor init` to create a default configuration file with detailed comments.

### Default Configuration

```javascript
module.exports = {
  // File scanning patterns
  scanGlobs: [
    '**/*.blade.php',
    '**/*.html', 
    '**/*.vue',
    '!vendor/**',
    '!node_modules/**',
    // ... more exclusions
  ],

  // Image optimization settings
  imageOptimization: {
    enabled: true,
    mobileWidth1x: 640,
    jpgQuality: 78,
    webpQuality: 80,
    // ... more options
  },

  // Text processing settings
  textProcessing: {
    hangingPrepositions: {
      enabled: true,
      prepositions: ['в', 'на', 'и', 'а', 'с', 'для', /* ... */],
    },
    superscriptReplacements: {
      enabled: true,
      replacements: [
        { from: 'м2', to: 'м<sup>2</sup>' },
        { from: 'м3', to: 'м<sup>3</sup>' },
        // ... more replacements
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
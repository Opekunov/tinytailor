module.exports = {
  // Project paths
  // projectRoot: process.cwd(), // Auto-detected
  // publicRoot: 'public', // Relative to project root

  // File scanning patterns
  scanGlobs: [
    '**/*.html', 
    '**/*.vue',
    '**/*.css',
    // Exclude common paths
    '!node_modules/**',
  ],

  // Additional paths to exclude
  excludePaths: [
    // 'path/to/exclude/**',
  ],
  
  // Additional files to exclude
  excludeFiles: [
    // 'specific-file.html',
  ],

  // Image optimization settings
  imageOptimization: {
    enabled: true,
    
    // Extensions to skip optimization
    excludedExtensions: ['.webp'],
    
    // Wrap lone <img> tags in <picture> (careful - may break layouts)
    wrapLooseImg: false,
    
    // Mobile image dimensions
    mobileWidth1x: 640,
    retinaMultiplier: 2, // For @2x images
    onlyDownscaleIfWiderThan: 800, // Only process if original is wider
    mobileMedia: '(max-width: 640px)',
    
    // Image quality settings
    jpgQuality: 78,
    webpQuality: 80,
    
    // Supported raster image formats
    rasterExts: ['.jpg', '.jpeg', '.png', '.webp'],
    
    // Attribute marker for processed images
    markerAttr: 'data-optimized',
    
    // PNG recompression for very large files
    pngRecompress: {
      enabled: true,
      sizeThresholdBytes: 8 * 1024 * 1024, // 8MB
      minPixelsThreshold: 12000000, // ~3464x3464px
      compressionLevel: 9,
      effort: 9,
      adaptiveFiltering: true,
      log: true,
    },
  },

  // Text processing settings
  textProcessing: {
    // Fix hanging prepositions with non-breaking spaces
    hangingPrepositions: {
      enabled: true,
      fileExtensions: ['.html', '.blade.php', '.vue'],
      prepositions: [
        // Russian prepositions and short words
        'а', 'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со',
        'как', 'к', 'по', 'из', 'у', 'за', 'от', 'о', 'об', 'для',
        'до', 'при', 'без', 'под', 'над', 'через', 'про', 'между',
        // Add English prepositions if needed
        // 'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      ],
    },
    
    // Convert м2, м3 to proper superscript
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
        // Add custom replacements as needed
        // { from: 'ft2', to: 'ft<sup>2</sup>' },
      ],
    },
  },

  // Size checking (experimental - compares image dimensions to CSS)
  sizeChecking: {
    enabled: false, // Enable at your own risk
    threshold: 50, // Warn if image is 50%+ larger than displayed size
  },

  // CSS WebP optimization - NEW FEATURE! 🎨
  cssOptimization: {
    enabled: true, // Automatically add WebP support for CSS background-image
    webpEnabled: true, // Generate WebP versions of background images
    fileExtensions: ['.css', '.scss', '.sass'], // Process these CSS file types
  },

  // Logging and reporting
  logging: {
    console: true,
    markdownReport: true,
    reportDir: 'tinytailor_reports',
  },
};

/*
🎯 TinyTailor Configuration Guide

MAIN FEATURES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖼️ Image Optimization
   • WebP conversion with fallbacks (<picture> elements)
   • Mobile responsive versions (@1x, @2x)
   • PNG recompression for large files
   • Smart file scanning with exclusions

📝 Text Processing
   • Russian hanging prepositions (spaces → &nbsp;)
   • Superscript units (м2 → м<sup>2</sup>)
   • Customizable word lists and replacements

🎨 CSS WebP Optimization (NEW!)
   • Automatic WebP support for background-image
   • Browser-compatible @supports rules
   • Works with CSS, SCSS, SASS files
   • Progressive enhancement with fallbacks

📏 Size Checking (Experimental)
   • Detect oversized images vs CSS display size
   • Performance optimization recommendations

📊 Comprehensive Reporting
   • Real-time console progress
   • Detailed markdown reports
   • Processing statistics and metrics

USAGE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Interactive mode:    npx tinytailor
With specific module: npx tinytailor --css-optimization
All modules:         npx tinytailor --image-optimization --text-processing --css-optimization
Help:                npx tinytailor --help

Generated with TinyTailor ✨
Visit: https://github.com/Opekunov/tinytailor
*/
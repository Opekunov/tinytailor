export default {
  // Project paths
  // projectRoot: process.cwd(), // Auto-detected
  // publicRoot: 'public', // Relative to project root

  // File scanning patterns
  scanGlobs: [
    '**/*.blade.php',
    '**/*.html', 
    '**/*.vue',
    // Exclude common paths
    '!vendor/**',
    '!node_modules/**',
    '!storage/**',
    '!bootstrap/cache/**',
    '!resources/views/vendor/**',
    '!resources/views/emails/**',
    '!storage/framework/views/**',
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
        // Primary prepositions (основные предлоги)
        'в', 'во', 'на', 'за', 'под', 'над', 'от', 'до', 'из', 'к', 'ко', 'с', 'со', 
        'у', 'о', 'об', 'при', 'через', 'между', 'среди', 'без', 'для', 'после', 
        'перед', 'про', 'по',
        
        // Extended prepositions (расширенные предлоги)  
        'вокруг', 'около', 'возле', 'против', 'вместо', 'кроме', 'сквозь', 'вдоль', 
        'поперек', 'наряду', 'помимо', 'согласно', 'благодаря', 'вопреки', 'навстречу',
        'касательно', 'относительно', 'насчет', 'ввиду', 'вследствие', 'посредством',
        'путем', 'силой', 'дабы', 'чтобы', 'ради', 'мимо', 'кругом',
        
        // Conjunctions (союзы)
        'и', 'а', 'но', 'да', 'или', 'либо', 'то', 'ни', 'что', 'как', 'когда', 
        'где', 'куда', 'откуда', 'пока', 'если', 'хотя', 'словно', 'будто',
        
        // Particles (частицы) 
        'не', 'ни', 'же', 'ли', 'бы', 'ведь', 'вот', 'вон', 'уж', 'ну', 'нет',
        'еще', 'уже', 'только', 'лишь', 'даже', 'именно',
        
        // Short pronouns and words (короткие местоимения и слова)
        'я', 'он', 'мы', 'вы', 'их', 'им', 'те', 'то', 'та', 'ту', 'ты', 'мне', 'тебе',
        'нам', 'вам', 'них', 'нее', 'его', 'ее', 'тот', 'эта', 'это', 'тут', 'там',
        
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
🎯 TinyTailor Configuration Guide (ES6 Module)

This is the ES6 module version of the configuration file.
Use this format if you're working with modern Node.js projects
that use ES modules or TypeScript with module: "ESNext".

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
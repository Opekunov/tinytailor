import { TinyTailorConfig, Logger } from '../../types';

export class HangingPrepositionsProcessor {
  private config: TinyTailorConfig;
  private logger: Logger;

  constructor(config: TinyTailorConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  processText(content: string, filePath: string): { content: string; replacements: number } {
    if (!this.config.textProcessing.hangingPrepositions.enabled) {
      return { content, replacements: 0 };
    }

    const prepositions = this.config.textProcessing.hangingPrepositions.prepositions;
    if (!prepositions.length) {
      return { content, replacements: 0 };
    }

    // Check if this is a Vue file and handle it differently
    if (filePath.endsWith('.vue')) {
      return this.processVueFile(content, filePath, prepositions);
    }

    let processedContent = content;
    let totalReplacements = 0;

    // Process each preposition one by one
    for (const preposition of prepositions) {
      const result = this.processPreposition(processedContent, preposition);
      processedContent = result.content;
      totalReplacements += result.replacements;
    }

    if (totalReplacements > 0) {
      this.logger.logTextProcessing(filePath, totalReplacements, 'Hanging prepositions fixed');
    }

    return { content: processedContent, replacements: totalReplacements };
  }

  private processVueFile(content: string, filePath: string, prepositions: string[]): { content: string; replacements: number } {
    let processedContent = content;
    let totalReplacements = 0;

    // Extract template section from Vue file
    const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/);
    
    if (!templateMatch) {
      // No template section found, return original content
      return { content, replacements: 0 };
    }

    const templateContent = templateMatch[1];
    const templateStart = content.indexOf(templateMatch[0]);
    const templateTagStart = templateMatch[0].indexOf('>') + 1; // Position after opening <template> tag
    const templateContentStart = templateStart + templateTagStart;

    // Process each preposition in the template content only
    let processedTemplateContent = templateContent;
    for (const preposition of prepositions) {
      const result = this.processPreposition(processedTemplateContent, preposition);
      processedTemplateContent = result.content;
      totalReplacements += result.replacements;
    }

    // Replace only the template content in the original file
    if (totalReplacements > 0) {
      processedContent = 
        content.substring(0, templateContentStart) +
        processedTemplateContent +
        content.substring(templateContentStart + templateContent.length);

      this.logger.logTextProcessing(filePath, totalReplacements, 'Hanging prepositions fixed in Vue template');
    }

    return { content: processedContent, replacements: totalReplacements };
  }

  private processPreposition(content: string, preposition: string): { content: string; replacements: number } {
    let replacements = 0;
    
    // Escape special regex characters
    const escapedPrep = preposition.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Pattern: Find preposition followed by whitespace (including line breaks) and then a word
    // Using (^|\\s) instead of \\b for better cyrillic support
    const pattern = new RegExp(`(^|\\s)(${escapedPrep})(\\s+)(\\S)`, 'gim');
    
    // Split content by HTML tags to avoid processing inside tags
    const parts = this.splitContentByTags(content);
    
    const processedParts = parts.map(part => {
      if (part.type === 'text') {
        const processedContent = part.content.replace(pattern, (match, prefix, prep, whitespace, nextChar) => {
          replacements++;
          // Replace the last space in whitespace with &nbsp;
          let processedWhitespace;
          if (/\n/.test(whitespace)) {
            // Has line breaks - preserve them but replace last space with &nbsp;
            processedWhitespace = whitespace.replace(/[ \t]+$/, '&nbsp;');
          } else {
            // No line breaks - just replace spaces with &nbsp;
            processedWhitespace = '&nbsp;';
          }
          return prefix + prep + processedWhitespace + nextChar;
        });
        return processedContent;
      }
      return part.content;
    });
    
    return {
      content: processedParts.join(''),
      replacements,
    };
  }

  private splitContentByTags(content: string): Array<{ type: 'text' | 'tag'; content: string }> {
    const parts: Array<{ type: 'text' | 'tag'; content: string }> = [];
    let lastIndex = 0;
    
    // Find all HTML tags
    const tagRegex = /<[^>]*>/g;
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
      // Add text before tag
      if (match.index > lastIndex) {
        const textContent = content.slice(lastIndex, match.index);
        if (textContent) {
          parts.push({ type: 'text', content: textContent });
        }
      }
      
      // Add the tag
      parts.push({ type: 'tag', content: match[0] });
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last tag
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      if (remainingText) {
        parts.push({ type: 'text', content: remainingText });
      }
    }
    
    // If no tags were found, treat entire content as text
    if (parts.length === 0 && content) {
      parts.push({ type: 'text', content });
    }
    
    return parts;
  }
}
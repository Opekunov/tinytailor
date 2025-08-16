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

  private processPreposition(content: string, preposition: string): { content: string; replacements: number } {
    let replacements = 0;
    
    // Escape special regex characters
    const escapedPrep = preposition.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Pattern: space or start of string + preposition + space + any non-whitespace
    // Using (^|\\s) instead of \\b for better cyrillic support  
    // Using (?=\\S) instead of (?=\\w) to include cyrillic letters
    const pattern = new RegExp(`(^|\\s)${escapedPrep}\\s+(?=\\S)`, 'gi');
    
    // Split content by HTML tags to avoid processing inside tags
    const parts = this.splitContentByTags(content);
    
    const processedParts = parts.map(part => {
      if (part.type === 'text') {
        return part.content.replace(pattern, (match, _prefix) => {
          replacements++;
          // Replace the trailing space with &nbsp; while keeping prefix
          return match.replace(/\s+$/, '&nbsp;');
        });
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
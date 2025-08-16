import { TinyTailorConfig, Logger } from '../../types';

export class SuperscriptReplacer {
  private config: TinyTailorConfig;
  private logger: Logger;

  constructor(config: TinyTailorConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  processText(content: string, filePath: string): { content: string; replacements: number } {
    if (!this.config.textProcessing.superscriptReplacements.enabled) {
      return { content, replacements: 0 };
    }

    const replacements = this.config.textProcessing.superscriptReplacements.replacements;
    if (!replacements.length) {
      return { content, replacements: 0 };
    }

    let processedContent = content;
    let totalReplacements = 0;

    for (const replacement of replacements) {
      const result = this.performReplacement(processedContent, replacement.from, replacement.to);
      processedContent = result.content;
      totalReplacements += result.replacements;
    }

    if (totalReplacements > 0) {
      this.logger.logTextProcessing(filePath, totalReplacements, 'Superscript replacements');
    }

    return { content: processedContent, replacements: totalReplacements };
  }

  private performReplacement(
    content: string,
    from: string,
    to: string
  ): { content: string; replacements: number } {
    let replacements = 0;

    // Escape special regex characters
    const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Match after spaces, start of line, or digits, followed by punctuation/space/end
    const pattern = new RegExp(`(^|\\s|[0-9])${escapedFrom}(?=\\s|$|[.,;:!?])`, 'gi');

    // Split content by HTML tags to avoid processing inside tags and avoid existing <sup> tags
    const parts = this.splitContentByTags(content);

    const processedParts = parts.map(part => {
      if (part.type === 'text') {
        return part.content.replace(pattern, (match, prefix) => {
          replacements++;
          // Replace only the matched text, keeping prefix
          return prefix + to;
        });
      }
      return part.content;
    });

    return {
      content: processedParts.join(''),
      replacements,
    };
  }

  private splitContentByTags(content: string): Array<{ type: 'text' | 'tag' | 'sup-text'; content: string }> {
    const parts: Array<{ type: 'text' | 'tag' | 'sup-text'; content: string }> = [];
    let lastIndex = 0;
    let insideSupTag = false;
    
    // Find all HTML tags
    const tagRegex = /<[^>]*>/g;
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
      // Add text before tag
      if (match.index > lastIndex) {
        const textContent = content.slice(lastIndex, match.index);
        if (textContent) {
          parts.push({ 
            type: insideSupTag ? 'sup-text' : 'text', 
            content: textContent 
          });
        }
      }
      
      // Check if this is a sup tag
      const isSupOpen = /<sup\b[^>]*>/i.test(match[0]);
      const isSupClose = /<\/sup>/i.test(match[0]);
      
      if (isSupOpen) {
        insideSupTag = true;
      } else if (isSupClose) {
        insideSupTag = false;
      }
      
      // Add the tag
      parts.push({ type: 'tag', content: match[0] });
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last tag
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      if (remainingText) {
        parts.push({ 
          type: insideSupTag ? 'sup-text' : 'text', 
          content: remainingText 
        });
      }
    }
    
    // If no tags were found, treat entire content as text
    if (parts.length === 0 && content) {
      parts.push({ type: 'text', content });
    }
    
    return parts;
  }

  private isInsideSupTag(text: string): boolean {
    // Very simple check - if the content contains sup tags, avoid processing
    // A more sophisticated implementation would track whether we're inside a <sup> tag
    return /<sup[^>]*>|<\/sup>/i.test(text);
  }
}
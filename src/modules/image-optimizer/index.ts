import * as cheerio from 'cheerio';
import * as path from 'path';
import * as mime from 'mime-types';
import { TinyTailorConfig, Logger, ImageDerivatives } from '../../types';
import { FileUtils } from '../../utils/file-utils';
import { PathResolver } from '../../utils/path-resolver';
import { SharpProcessor } from './sharp-processor';

export class ImageOptimizer {
  private config: TinyTailorConfig;
  private logger: Logger;
  private pathResolver: PathResolver;
  private sharpProcessor: SharpProcessor;

  constructor(config: TinyTailorConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.pathResolver = new PathResolver(
      config.projectRoot,
      config.publicRoot,
      config.imageOptimization.rasterExts
    );
    this.sharpProcessor = new SharpProcessor();
  }

  async processDocument(filePath: string): Promise<{ changed: boolean }> {
    const source = await FileUtils.readFile(filePath);
    const result = await this.processGenericRegion(filePath, source);
    
    if (result.changed) {
      await FileUtils.writeFile(filePath, result.output);
    }
    
    return result;
  }

  private async processGenericRegion(fileAbs: string, region: string): Promise<{ changed: boolean; output: string }> {
    // First, process existing <picture> blocks
    const pictureBlocks = this.findPictureBlocks(region);
    let output = region;
    let anyChanged = false;
    let offset = 0;

    for (const block of pictureBlocks) {
      const updated = await this.processPictureFragment(fileAbs, block.openTag, block.inner, block.closeTag, block.indent);
      if (!updated) continue;
      
      const start = block.start + offset;
      const end = block.end + offset;
      output = output.slice(0, start) + updated + output.slice(end);
      offset += updated.length - (end - start);
      anyChanged = true;
    }

    // Then, find standalone <img> tags and convert them to <picture>
    const standaloneImgs = this.findStandaloneImages(output);
    offset = 0;

    for (const imgBlock of standaloneImgs) {
      const pictureElement = await this.convertImgToPicture(fileAbs, imgBlock.imgTag, imgBlock.indent);
      if (!pictureElement) continue;

      const start = imgBlock.start + offset;
      const end = imgBlock.end + offset;
      output = output.slice(0, start) + pictureElement + output.slice(end);
      offset += pictureElement.length - (end - start);
      anyChanged = true;
    }
    
    return { changed: anyChanged, output };
  }

  private findPictureBlocks(source: string) {
    const blocks = [];
    const re = /<picture\b([^>]*)>([\s\S]*?)<\/picture\s*>/gi;
    let match;
    
    while ((match = re.exec(source))) {
      const attrs = match[1] || '';
      const inner = match[2] || '';
      const start = match.index;
      const end = match.index + match[0].length;
      const indentMatch = source.slice(source.lastIndexOf('\n', start) + 1, start).match(/^\s*/);
      const indent = indentMatch ? indentMatch[0] : '';
      
      blocks.push({
        start,
        end,
        openTag: `<picture${attrs}>`,
        inner,
        closeTag: `</picture>`,
        indent,
      });
    }
    
    return blocks;
  }

  private async processPictureFragment(
    fileAbs: string,
    openTag: string,
    innerHtml: string,
    closeTag: string,
    indent: string
  ): Promise<string | null> {
    const $ = cheerio.load(`<wrapper>${innerHtml}</wrapper>`);
    const $root = $('wrapper');
    const $img = $root.find('img').first();
    
    if (!$img.length) return null;

    const rawSrc = $img.attr('src') || '';
    const src = FileUtils.extractSrc(rawSrc);
    const imgAbs = await this.pathResolver.resolveImagePath(fileAbs, src || '');
    
    if (!imgAbs || !FileUtils.isRasterImage(imgAbs, this.config.imageOptimization.rasterExts)) {
      return null;
    }

    // Determine the original src format (asset() or regular path)
    const usesAsset = rawSrc.includes('asset(');

    // Create backup if we're going to modify the image
    await FileUtils.backupFile(imgAbs);

    // PNG recompression first
    if (this.config.imageOptimization.pngRecompress.enabled) {
      try {
        const result = await this.sharpProcessor.recompressPng(imgAbs, {
          sizeThreshold: this.config.imageOptimization.pngRecompress.sizeThresholdBytes,
          pixelsThreshold: this.config.imageOptimization.pngRecompress.minPixelsThreshold,
          compressionLevel: this.config.imageOptimization.pngRecompress.compressionLevel,
          effort: this.config.imageOptimization.pngRecompress.effort,
          adaptiveFiltering: this.config.imageOptimization.pngRecompress.adaptiveFiltering,
        });

        if (result.compressed && this.config.imageOptimization.pngRecompress.log) {
          this.logger.logImageProcessing(imgAbs, 'PNG Recompressed', result.originalSize, result.newSize);
        }
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`PNG recompress failed for ${path.relative(this.config.projectRoot, imgAbs)}: ${errorMsg}`);
      }
    }

    const { width: origWidth } = await this.sharpProcessor.getMetadata(imgAbs);
    const derivatives = this.pathResolver.buildDerivatives(imgAbs);

    const needDownscale = origWidth > this.config.imageOptimization.onlyDownscaleIfWiderThan;
    
    // Generate mobile versions
    if (needDownscale) {
      const mob1xResult = await this.sharpProcessor.downscale(
        imgAbs,
        derivatives.mob1x,
        this.config.imageOptimization.mobileWidth1x,
        { jpg: this.config.imageOptimization.jpgQuality }
      );
      if (mob1xResult.created) {
        this.logger.logImageProcessing(derivatives.mob1x, 'Mobile 1x', mob1xResult.originalSize, mob1xResult.newSize);
      }

      const mob2xResult = await this.sharpProcessor.downscale(
        imgAbs,
        derivatives.mob2x,
        this.config.imageOptimization.mobileWidth1x * this.config.imageOptimization.retinaMultiplier,
        { jpg: this.config.imageOptimization.jpgQuality }
      );
      if (mob2xResult.created) {
        this.logger.logImageProcessing(derivatives.mob2x, 'Mobile 2x', mob2xResult.originalSize, mob2xResult.newSize);
      }

      // WebP versions of mobile
      const mob1xWebpResult = await this.sharpProcessor.convertToWebp(
        derivatives.mob1x,
        derivatives.mob1xWebp,
        this.config.imageOptimization.webpQuality
      );
      if (mob1xWebpResult.created) {
        this.logger.logImageProcessing(derivatives.mob1xWebp, 'Mobile WebP 1x', mob1xWebpResult.originalSize, mob1xWebpResult.newSize);
      }

      const mob2xWebpResult = await this.sharpProcessor.convertToWebp(
        derivatives.mob2x,
        derivatives.mob2xWebp,
        this.config.imageOptimization.webpQuality
      );
      if (mob2xWebpResult.created) {
        this.logger.logImageProcessing(derivatives.mob2xWebp, 'Mobile WebP 2x', mob2xWebpResult.originalSize, mob2xWebpResult.newSize);
      }
    }

    // Desktop WebP
    const webpResult = await this.sharpProcessor.convertToWebp(
      imgAbs,
      derivatives.webp,
      this.config.imageOptimization.webpQuality
    );
    if (webpResult.created) {
      this.logger.logImageProcessing(derivatives.webp, 'Desktop WebP', webpResult.originalSize, webpResult.newSize);
    }

    // Build new <source> elements
    const sourcesToAdd = this.buildSourceElements(fileAbs, derivatives, needDownscale, $, $root, usesAsset);

    if (!sourcesToAdd.length) return null;

    // Insert new sources and normalize existing content
    const insertPos = innerHtml.search(/<source\b|<img\b/i);
    const newSourcesBlock = this.prettyInsertSources(indent, sourcesToAdd);

    let newInner: string;
    if (insertPos >= 0) {
      const beforeInsert = innerHtml.slice(0, insertPos).trimEnd();
      const afterInsert = innerHtml.slice(insertPos);
      // Normalize indentation of existing content
      const normalizedAfter = this.normalizeContentIndent(afterInsert, indent);
      newInner = beforeInsert + newSourcesBlock + normalizedAfter;
    } else {
      newInner = newSourcesBlock + innerHtml;
    }

    return `${openTag}\n${newInner.trimEnd()}\n${indent}${closeTag}`;
  }

  private buildSourceElements(
    fileAbs: string,
    derivatives: ImageDerivatives,
    needDownscale: boolean,
    $: cheerio.CheerioAPI,
    $root: cheerio.Cheerio<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
    usesAsset: boolean = false
  ): string[] {
    const sources = [];

    // Mobile WebP sources
    if (needDownscale) {
      if (!this.hasSourceCheerio($, $root, s => s.type === 'image/webp' && s.media === this.config.imageOptimization.mobileMedia)) {
        sources.push(
          `<source ${this.config.imageOptimization.markerAttr}="true" media="${this.config.imageOptimization.mobileMedia}" type="image/webp" srcset="${this.formatSrcForHtml(fileAbs, derivatives.mob1xWebp, usesAsset)} 1x, ${this.formatSrcForHtml(fileAbs, derivatives.mob2xWebp, usesAsset)} 2x">`
        );
      }

      // Mobile original format sources
      const origMime = mime.lookup(derivatives.ext) || '';
      if (!this.hasSourceCheerio($, $root, s => s.type === origMime && s.media === this.config.imageOptimization.mobileMedia)) {
        sources.push(
          `<source ${this.config.imageOptimization.markerAttr}="true" media="${this.config.imageOptimization.mobileMedia}" type="${origMime}" srcset="${this.formatSrcForHtml(fileAbs, derivatives.mob1x, usesAsset)} 1x, ${this.formatSrcForHtml(fileAbs, derivatives.mob2x, usesAsset)} 2x">`
        );
      }
    }

    // Desktop WebP source
    if (!this.hasSourceCheerio($, $root, s => s.type === 'image/webp' && !s.media)) {
      sources.push(
        `<source ${this.config.imageOptimization.markerAttr}="true" type="image/webp" srcset="${this.formatSrcForHtml(fileAbs, derivatives.webp, usesAsset)}">`
      );
    }

    return sources;
  }

  private hasSourceCheerio($: cheerio.CheerioAPI, $pic: cheerio.Cheerio<any>, predicate: (s: { type: string; srcset: string; media: string; marker: boolean }) => boolean): boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
    let found = false;
    $pic.find('source').each((_, el) => {
      const $el = $(el);
      const type = ($el.attr('type') || '').trim();
      const srcset = ($el.attr('srcset') || '').trim();
      const media = ($el.attr('media') || '').trim();
      const marker = $el.attr(this.config.imageOptimization.markerAttr) === 'true';
      
      if (predicate({ type, srcset, media, marker })) {
        found = true;
      }
    });
    return found;
  }

  private prettyInsertSources(indent: string, sources: string[]): string {
    // Determine indentation for picture content (base indent + 4 spaces for nested elements)
    const contentIndent = `${indent}    `;
    return sources.map(s => `${contentIndent}${s}`).join('\n') + '\n';
  }

  private normalizeContentIndent(content: string, baseIndent: string): string {
    const contentIndent = `${baseIndent}    `;
    
    return content
      // Normalize indentation for source and img elements
      .replace(/^(\s*)<(source|img)\b/gm, `${contentIndent}<$2`)
      // Remove extra empty lines at the beginning
      .replace(/^\s*\n/, '');
  }

  private formatSrcForHtml(fileAbs: string, imgAbs: string, usesAsset: boolean): string {
    const normalizedSrc = this.pathResolver.normalizeSrcForHtml(fileAbs, imgAbs);
    
    if (usesAsset) {
      // If original used asset(), wrap the new path in asset() too
      // Remove leading slashes and ./ for asset() - Laravel expects relative paths from public
      let assetPath = normalizedSrc;
      if (assetPath.startsWith('/')) {
        assetPath = assetPath.slice(1);
      } else if (assetPath.startsWith('./')) {
        assetPath = assetPath.slice(2);
      }
      return `{{ asset('${assetPath}') }}`;
    }
    
    return normalizedSrc;
  }

  private findStandaloneImages(source: string) {
    const blocks = [];
    // Find <img> tags that are NOT inside <picture> elements
    const imgRe = /<img\b[^>]*>/gi;
    let match;
    
    while ((match = imgRe.exec(source))) {
      const imgTag = match[0];
      const start = match.index;
      const end = match.index + imgTag.length;
      
      // Check if this <img> is inside a <picture> element
      const beforeImg = source.slice(0, start);
      const afterImg = source.slice(end);
      
      // Count opening and closing <picture> tags before this <img>
      const openPictureBefore = (beforeImg.match(/<picture\b[^>]*>/gi) || []).length;
      const closePictureBefore = (beforeImg.match(/<\/picture\s*>/gi) || []).length;
      
      // If we're not inside a <picture>, this is a standalone <img>
      if (openPictureBefore === closePictureBefore) {
        const indentMatch = source.slice(source.lastIndexOf('\n', start) + 1, start).match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : '';
        
        blocks.push({
          start,
          end,
          imgTag,
          indent,
        });
      }
    }
    
    return blocks;
  }

  private async convertImgToPicture(fileAbs: string, imgTag: string, indent: string): Promise<string | null> {
    // Parse the img tag to extract src and other attributes
    // Handle both regular quotes and Laravel blade syntax
    let rawSrc: string | null = null;
    
    // Try double quotes first
    let srcMatch = imgTag.match(/src\s*=\s*"([^"]*)"/i);
    if (srcMatch) {
      rawSrc = srcMatch[1];
    } else {
      // Try single quotes
      srcMatch = imgTag.match(/src\s*=\s*'([^']*)'/i);
      if (srcMatch) {
        rawSrc = srcMatch[1];
      }
    }
    
    if (!rawSrc) {
      return null;
    }
    
    const src = FileUtils.extractSrc(rawSrc);
    const imgAbs = await this.pathResolver.resolveImagePath(fileAbs, src || '');
    
    if (!imgAbs || !FileUtils.isRasterImage(imgAbs, this.config.imageOptimization.rasterExts)) {
      return null;
    }

    // Create backup if we're going to modify the image
    await FileUtils.backupFile(imgAbs);

    // Determine the original src format (asset() or regular path)
    const usesAsset = rawSrc.includes('asset(');

    // PNG recompression first
    if (this.config.imageOptimization.pngRecompress.enabled) {
      try {
        const result = await this.sharpProcessor.recompressPng(imgAbs, {
          sizeThreshold: this.config.imageOptimization.pngRecompress.sizeThresholdBytes,
          pixelsThreshold: this.config.imageOptimization.pngRecompress.minPixelsThreshold,
          compressionLevel: this.config.imageOptimization.pngRecompress.compressionLevel,
          effort: this.config.imageOptimization.pngRecompress.effort,
          adaptiveFiltering: this.config.imageOptimization.pngRecompress.adaptiveFiltering,
        });

        if (result.compressed && this.config.imageOptimization.pngRecompress.log) {
          this.logger.logImageProcessing(imgAbs, 'PNG Recompressed', result.originalSize, result.newSize);
        }
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`PNG recompress failed for ${path.relative(this.config.projectRoot, imgAbs)}: ${errorMsg}`);
      }
    }

    const { width: origWidth } = await this.sharpProcessor.getMetadata(imgAbs);
    const derivatives = this.pathResolver.buildDerivatives(imgAbs);

    const needDownscale = origWidth > this.config.imageOptimization.onlyDownscaleIfWiderThan;
    
    // Generate mobile versions
    if (needDownscale) {
      const mob1xResult = await this.sharpProcessor.downscale(
        imgAbs,
        derivatives.mob1x,
        this.config.imageOptimization.mobileWidth1x,
        { jpg: this.config.imageOptimization.jpgQuality }
      );
      if (mob1xResult.created) {
        this.logger.logImageProcessing(derivatives.mob1x, 'Mobile 1x', mob1xResult.originalSize, mob1xResult.newSize);
      }

      const mob2xResult = await this.sharpProcessor.downscale(
        imgAbs,
        derivatives.mob2x,
        this.config.imageOptimization.mobileWidth1x * this.config.imageOptimization.retinaMultiplier,
        { jpg: this.config.imageOptimization.jpgQuality }
      );
      if (mob2xResult.created) {
        this.logger.logImageProcessing(derivatives.mob2x, 'Mobile 2x', mob2xResult.originalSize, mob2xResult.newSize);
      }

      // WebP versions of mobile
      const mob1xWebpResult = await this.sharpProcessor.convertToWebp(
        derivatives.mob1x,
        derivatives.mob1xWebp,
        this.config.imageOptimization.webpQuality
      );
      if (mob1xWebpResult.created) {
        this.logger.logImageProcessing(derivatives.mob1xWebp, 'Mobile WebP 1x', mob1xWebpResult.originalSize, mob1xWebpResult.newSize);
      }

      const mob2xWebpResult = await this.sharpProcessor.convertToWebp(
        derivatives.mob2x,
        derivatives.mob2xWebp,
        this.config.imageOptimization.webpQuality
      );
      if (mob2xWebpResult.created) {
        this.logger.logImageProcessing(derivatives.mob2xWebp, 'Mobile WebP 2x', mob2xWebpResult.originalSize, mob2xWebpResult.newSize);
      }
    }

    // Desktop WebP
    const webpResult = await this.sharpProcessor.convertToWebp(
      imgAbs,
      derivatives.webp,
      this.config.imageOptimization.webpQuality
    );
    if (webpResult.created) {
      this.logger.logImageProcessing(derivatives.webp, 'Desktop WebP', webpResult.originalSize, webpResult.newSize);
    }

    // Build source elements for the new <picture>
    const sources = [];

    // Mobile WebP sources
    if (needDownscale) {
      sources.push(
        `<source ${this.config.imageOptimization.markerAttr}="true" media="${this.config.imageOptimization.mobileMedia}" type="image/webp" srcset="${this.formatSrcForHtml(fileAbs, derivatives.mob1xWebp, usesAsset)} 1x, ${this.formatSrcForHtml(fileAbs, derivatives.mob2xWebp, usesAsset)} 2x">`
      );

      // Mobile original format sources
      const origMime = mime.lookup(derivatives.ext) || '';
      sources.push(
        `<source ${this.config.imageOptimization.markerAttr}="true" media="${this.config.imageOptimization.mobileMedia}" type="${origMime}" srcset="${this.formatSrcForHtml(fileAbs, derivatives.mob1x, usesAsset)} 1x, ${this.formatSrcForHtml(fileAbs, derivatives.mob2x, usesAsset)} 2x">`
      );
    }

    // Desktop WebP source
    sources.push(
      `<source ${this.config.imageOptimization.markerAttr}="true" type="image/webp" srcset="${this.formatSrcForHtml(fileAbs, derivatives.webp, usesAsset)}">`
    );

    // Build the complete <picture> element
    const contentIndent = `${indent}    `;
    const sourcesBlock = sources.map(s => `${contentIndent}${s}`).join('\n');
    const normalizedImg = `${contentIndent}${imgTag}`;

    return `<picture>\n${sourcesBlock}\n${normalizedImg}\n${indent}</picture>`;
  }
}
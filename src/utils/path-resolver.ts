import * as path from 'path';
import * as fs from 'fs-extra';
import fg from 'fast-glob';
import { FileUtils } from './file-utils';

export class PathResolver {
  private projectRoot: string;
  private publicRoot: string;
  private rasterExts: string[];

  constructor(projectRoot: string, publicRoot: string, rasterExts: string[]) {
    this.projectRoot = projectRoot;
    this.publicRoot = publicRoot;
    this.rasterExts = rasterExts;
  }

  async resolveImagePath(docFileAbs: string, imgRef: string): Promise<string | null> {
    if (!imgRef) return null;

    // Absolute path from public/
    if (imgRef.startsWith('/')) {
      const resolvedPath = path.join(this.publicRoot, imgRef);
      if (await fs.pathExists(resolvedPath)) {
        return resolvedPath;
      }
      return null;
    }

    // Relative to document
    const byRelative = path.resolve(path.dirname(docFileAbs), imgRef);
    if (await fs.pathExists(byRelative)) {
      return byRelative;
    }

    // Relative to public (useful for asset() calls)
    const fromPublic = path.join(this.publicRoot, imgRef);
    if (await fs.pathExists(fromPublic)) {
      return fromPublic;
    }

    // Last resort: search through project
    const normalized = imgRef.replace(/^\.?\/*/, '');
    const candidates = await fg(`**/${normalized}`, {
      cwd: this.projectRoot,
      ignore: ['vendor/**', 'node_modules/**', 'bootstrap/cache/**'],
      onlyFiles: true,
      unique: true,
      absolute: true,
      suppressErrors: true,
    });

    const rasterCandidates = candidates.filter((candidate: string) => 
      FileUtils.isRasterImage(candidate, this.rasterExts)
    );

    return rasterCandidates[0] || null;
  }

  normalizeSrcForHtml(fileAbs: string, imgAbs: string): string {
    // Try to make relative to public first
    const relFromPublic = path.relative(this.publicRoot, imgAbs).split(path.sep).join('/');
    
    if (!relFromPublic.startsWith('..')) {
      return '/' + relFromPublic;
    }
    
    // Fall back to relative to document
    const relToDoc = path.relative(path.dirname(fileAbs), imgAbs).split(path.sep).join('/');
    return relToDoc.startsWith('.') ? relToDoc : './' + relToDoc;
  }

  buildDerivatives(absPath: string) {
    const dir = path.dirname(absPath);
    const ext = path.extname(absPath).toLowerCase();
    const base = path.basename(absPath, ext);

    return {
      dir,
      base,
      ext,
      mob1x: path.join(dir, `${base}-mob${ext}`),
      mob2x: path.join(dir, `${base}-mob@2x${ext}`),
      webp: path.join(dir, `${base}.webp`),
      mob1xWebp: path.join(dir, `${base}-mob.webp`),
      mob2xWebp: path.join(dir, `${base}-mob@2x.webp`),
    };
  }
}
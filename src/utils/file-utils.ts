import * as fs from 'fs-extra';
import * as path from 'path';
import fg from 'fast-glob';

export class FileUtils {
  static async scanFiles(globs: string[], cwd: string): Promise<string[]> {
    return fg(globs, {
      cwd,
      absolute: true,
      onlyFiles: true,
      suppressErrors: true,
    });
  }

  static async backupFile(filePath: string, suffix = '_orig'): Promise<string> {
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    const backupPath = path.join(dir, `${base}${suffix}${ext}`);
    
    if (!await fs.pathExists(backupPath)) {
      await fs.copy(filePath, backupPath);
    }
    
    return backupPath;
  }

  static isRasterImage(filePath: string, rasterExts: string[]): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return rasterExts.includes(ext);
  }

  static extractSrc(raw?: string): string | null {
    if (!raw) return null;
    if (raw.trim() === '') return null;
    
    const s = String(raw).trim();
    
    // Handle asset() helper
    const assetMatch = s.match(/asset\(['"`]([^'"`]+)['"`]\)/);
    if (assetMatch) return assetMatch[1];
    
    // Clean up quotes and other characters
    return s.replace(/^["'{(]+|[)"'}]+$/g, '');
  }

  static async ensureDirectory(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }

  static async fileExists(filePath: string): Promise<boolean> {
    return fs.pathExists(filePath);
  }

  static async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }

  static async copyFile(src: string, dest: string): Promise<void> {
    await this.ensureDirectory(path.dirname(dest));
    await fs.copy(src, dest);
  }

  static async writeFile(filePath: string, content: string): Promise<void> {
    await this.ensureDirectory(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
  }

  static async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf8');
  }

  static relativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  static normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }

  static joinPath(...paths: string[]): string {
    return path.join(...paths);
  }

  static getExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  static getBasename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  static getDirname(filePath: string): string {
    return path.dirname(filePath);
  }
}
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { encryptText } from './encryption';

export class EncryptedFileTransport extends winston.transports.File {
  public filename: string;
  public maxsize: number;
  public maxFiles: number;
  private currentFileIndex: number = 0;

  constructor(options: {
    filename: string;
    maxsize?: number;
    maxFiles?: number;
    level?: string;
  }) {
    super(options);
    
    this.filename = options.filename;
    this.maxsize = options.maxsize || 100 * 1024 * 1024; // 100MB default
    this.maxFiles = options.maxFiles || 10;
    
    // Ensure directory exists
    const dir = path.dirname(this.filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  log(info: any, callback: () => void) {
    const logEntry = JSON.stringify({
      ...info,
      timestamp: new Date().toISOString()
    }) + '\n';

    // Encrypt the log entry
    const encrypted = encryptText(logEntry);
    const encryptedEntry = JSON.stringify(encrypted) + '\n';

    // Get current encrypted file path
    const encryptedPath = this.getEncryptedFilePath();

    // Check if we need to rotate
    if (fs.existsSync(encryptedPath)) {
      const stats = fs.statSync(encryptedPath);
      if (stats.size + Buffer.byteLength(encryptedEntry) > this.maxsize) {
        this.rotateFiles();
      }
    }

    // Append encrypted entry
    fs.appendFileSync(encryptedPath, encryptedEntry, { mode: 0o600 });

    callback();
  }

  private getEncryptedFilePath(): string {
    const ext = path.extname(this.filename);
    const base = this.filename.slice(0, -ext.length);
    return `${base}.${this.currentFileIndex}.enc`;
  }

  private rotateFiles(): void {
    // Remove oldest file if we're at the limit
    const oldestIndex = this.currentFileIndex - this.maxFiles + 1;
    if (oldestIndex >= 0) {
      const oldestPath = this.getEncryptedFilePathByIndex(oldestIndex);
      if (fs.existsSync(oldestPath)) {
        fs.unlinkSync(oldestPath);
      }
    }

    // Increment current file index
    this.currentFileIndex++;
  }

  private getEncryptedFilePathByIndex(index: number): string {
    const ext = path.extname(this.filename);
    const base = this.filename.slice(0, -ext.length);
    return `${base}.${index}.enc`;
  }
}
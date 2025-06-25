import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits

// Generate or load encryption key
function getEncryptionKey(): Buffer {
  const keyPath = path.join(process.cwd(), '.encryption-key');
  
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath);
  } else {
    // Generate new key
    const key = crypto.randomBytes(KEY_LENGTH);
    fs.writeFileSync(keyPath, key, { mode: 0o600 }); // Read-only for owner
    return key;
  }
}

export function encryptText(text: string): { encrypted: string; iv: string; tag: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from('log-encryption'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decryptText(encryptedData: { encrypted: string; iv: string; tag: string }): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const tag = Buffer.from(encryptedData.tag, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(Buffer.from('log-encryption'));
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Encrypt log files
export function encryptLogFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.trim()) return; // Skip empty files
  
  const encrypted = encryptText(content);
  const encryptedContent = JSON.stringify(encrypted);
  
  // Write encrypted content with .enc extension
  const encryptedPath = filePath + '.enc';
  fs.writeFileSync(encryptedPath, encryptedContent, { mode: 0o600 });
  
  // Remove original file
  fs.unlinkSync(filePath);
}

// Decrypt log files for reading
export function decryptLogFile(encryptedFilePath: string): string {
  if (!fs.existsSync(encryptedFilePath)) return '';
  
  const encryptedContent = fs.readFileSync(encryptedFilePath, 'utf8');
  const encryptedData = JSON.parse(encryptedContent);
  
  return decryptText(encryptedData);
}
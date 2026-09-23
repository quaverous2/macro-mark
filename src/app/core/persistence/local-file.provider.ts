import { BackupDocument, parseBackupDocument } from './backup-document';
import { LocalFileHandle } from './file-system-access';

export class LocalFileProvider {
  constructor(private readonly fileHandle: LocalFileHandle) {}

  async read(): Promise<BackupDocument> {
    const file = await this.fileHandle.getFile();
    return parseBackupDocument(JSON.parse(await file.text()));
  }

  async write(document: BackupDocument): Promise<void> {
    const writable = await this.fileHandle.createWritable();
    await writable.write(`${JSON.stringify(document, null, 2)}\n`);
    await writable.close();
  }

  async hasReadWritePermission(): Promise<boolean> {
    return (await this.fileHandle.queryPermission({ mode: 'readwrite' })) === 'granted';
  }

  async requestReadWritePermission(): Promise<boolean> {
    if (await this.hasReadWritePermission()) return true;
    return (await this.fileHandle.requestPermission({ mode: 'readwrite' })) === 'granted';
  }
}

export function supportsLocalFileProvider(): boolean {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
}

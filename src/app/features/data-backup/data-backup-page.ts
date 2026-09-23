import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { BackupDocument } from '../../core/persistence/backup-document';
import { FilePickerWindow, LocalFileHandle } from '../../core/persistence/file-system-access';
import { LocalFileProvider, supportsLocalFileProvider } from '../../core/persistence/local-file.provider';
import { PersistenceSyncService } from '../../core/persistence/persistence-sync.service';

interface PendingFileImport {
  fileHandle: LocalFileHandle;
  document: BackupDocument;
}

@Component({
  selector: 'app-data-backup-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-backup-page.html',
  styleUrl: './data-backup-page.scss',
})
export class DataBackupPage {
  readonly isSetup = input(false);
  readonly pendingFileImport = signal<PendingFileImport | undefined>(undefined);
  readonly actionError = signal<string | null>(null);
  readonly supportsLocalFiles = supportsLocalFileProvider();
  readonly statusLabel = computed(() => {
    const labels = {
      'device-only': 'Saved on this device',
      syncing: 'Syncing…',
      synced: 'Synced',
      waiting: 'Waiting to sync',
      attention: 'Sync needs attention',
    } as const;
    return labels[this.persistenceSyncService.status()];
  });

  constructor(protected readonly persistenceSyncService: PersistenceSyncService) {}

  protected async useThisDeviceOnly(): Promise<void> {
    this.actionError.set(null);
    await this.persistenceSyncService.useThisDeviceOnly();
  }

  protected async createLocalFile(): Promise<void> {
    this.actionError.set(null);
    try {
      const fileHandle = await filePickerWindow().showSaveFilePicker({
        suggestedName: 'macro-mark-backup.json',
        types: [{ description: 'JSON backup', accept: { 'application/json': ['.json'] } }],
      });
      await this.persistenceSyncService.replaceFileWithLocalData(fileHandle);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        this.actionError.set('The backup file could not be created. Please try again.');
      }
    }
  }

  protected async selectExistingLocalFile(): Promise<void> {
    this.actionError.set(null);
    try {
      const [fileHandle] = await filePickerWindow().showOpenFilePicker({
        multiple: false,
        types: [{ description: 'JSON backup', accept: { 'application/json': ['.json'] } }],
      });
      const document = await new LocalFileProvider(fileHandle).read();
      this.pendingFileImport.set({ fileHandle, document });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        this.actionError.set('This file is not a valid MacroMark backup.');
      }
    }
  }

  protected async useFileData(): Promise<void> {
    const pendingImport = this.pendingFileImport();
    if (pendingImport === undefined) return;
    await this.persistenceSyncService.useFileData(pendingImport.fileHandle, pendingImport.document);
    this.pendingFileImport.set(undefined);
  }

  protected async replaceFileWithDeviceData(): Promise<void> {
    const pendingImport = this.pendingFileImport();
    if (pendingImport === undefined) return;
    await this.persistenceSyncService.replaceFileWithLocalData(pendingImport.fileHandle);
    this.pendingFileImport.set(undefined);
  }

  protected cancelFileImport(): void { this.pendingFileImport.set(undefined); }

  protected async reconnectFile(): Promise<void> {
    this.actionError.set(null);
    await this.persistenceSyncService.reconnectFile();
  }

  protected async retry(): Promise<void> {
    this.actionError.set(null);
    await this.persistenceSyncService.retry();
  }
}

function filePickerWindow(): FilePickerWindow {
  return window as unknown as FilePickerWindow;
}

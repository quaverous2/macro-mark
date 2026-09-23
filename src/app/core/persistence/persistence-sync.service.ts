import { Injectable, computed, signal } from '@angular/core';
import { DailyLog } from '../domain/daily-log';
import { dailyLogSchema } from '../domain/daily-log.schema';
import { foodSchema } from '../domain/food.schema';
import { hasConsumedEntries } from '../nutrition/daily-nutrition-calculations';
import { BackupDocument } from './backup-document';
import { getLocalDateKey } from './daily-log.repository';
import { LocalFileHandle } from './file-system-access';
import { LocalFileProvider } from './local-file.provider';
import { database } from './macro-mark.database';
import { StorageSettings, StorageSettingsRepository } from './storage-settings.repository';

export type SyncStatus = 'device-only' | 'syncing' | 'synced' | 'waiting' | 'attention';

@Injectable({ providedIn: 'root' })
export class PersistenceSyncService {
  private readonly syncDelayMs = 500;
  private syncTimer: ReturnType<typeof setTimeout> | undefined;

  readonly settings = signal<StorageSettings | undefined>(undefined);
  readonly status = signal<SyncStatus>('device-only');
  readonly isInitialized = signal(false);
  readonly needsSetup = computed(() => this.isInitialized() && this.settings() === undefined);

  constructor(private readonly settingsRepository: StorageSettingsRepository) {}

  async initialize(): Promise<void> {
    try {
      const settings = await this.settingsRepository.get();
      this.settings.set(settings);
      if (settings?.provider === 'file' && settings.fileHandle !== undefined) {
        if (settings.hasPendingChanges) {
          this.status.set('waiting');
          await this.syncToFile();
        } else {
          await this.loadFromFile(settings.fileHandle);
        }
      } else if (settings?.provider === 'google-sheets') {
        this.status.set('attention');
      } else {
        this.status.set('device-only');
      }
    } catch {
      this.status.set('attention');
    } finally {
      this.isInitialized.set(true);
    }
  }

  notifyLocalChange(): void {
    if (!this.isInitialized()) return;
    if (this.settings()?.provider !== 'file' || this.settings()?.fileHandle === undefined) {
      this.status.set('device-only');
      return;
    }

    this.status.set('waiting');
    this.setPendingChanges(true);
    if (this.syncTimer !== undefined) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => void this.syncToFile(), this.syncDelayMs);
  }

  async useThisDeviceOnly(): Promise<void> {
    const settings = await this.settingsRepository.save({ provider: 'device', hasPendingChanges: false });
    this.settings.set(settings);
    this.status.set('device-only');
  }

  async useFileData(fileHandle: LocalFileHandle, document: BackupDocument): Promise<void> {
    const settings = await this.settingsRepository.save({
      provider: 'file',
      fileHandle,
      fileName: fileHandle.name,
      hasPendingChanges: false,
    });
    await this.replaceLocalData(document);
    this.settings.set(settings);
    this.status.set('synced');
    this.notifyLocalChange();
  }

  async replaceFileWithLocalData(fileHandle: LocalFileHandle): Promise<void> {
    const settings = await this.settingsRepository.save({
      provider: 'file',
      fileHandle,
      fileName: fileHandle.name,
      hasPendingChanges: true,
    });
    this.settings.set(settings);
    await this.syncToFile();
  }

  async reconnectFile(): Promise<void> {
    const fileHandle = this.settings()?.fileHandle;
    if (this.settings()?.provider !== 'file' || fileHandle === undefined) return;
    const provider = new LocalFileProvider(fileHandle);
    if (!(await provider.requestReadWritePermission())) {
      this.status.set('attention');
      return;
    }
    await this.loadFromFile(fileHandle);
  }

  async retry(): Promise<void> {
    if (this.settings()?.provider === 'file') await this.syncToFile();
  }

  private async loadFromFile(fileHandle: LocalFileHandle): Promise<void> {
    const provider = new LocalFileProvider(fileHandle);
    if (!(await provider.hasReadWritePermission())) {
      this.status.set('attention');
      return;
    }

    try {
      const document = await provider.read();
      await this.replaceLocalData(document);
      this.status.set('synced');
      this.notifyLocalChange();
    } catch {
      this.status.set('attention');
    }
  }

  private async syncToFile(): Promise<void> {
    const fileHandle = this.settings()?.fileHandle;
    if (this.settings()?.provider !== 'file' || fileHandle === undefined) return;

    const provider = new LocalFileProvider(fileHandle);
    if (!(await provider.hasReadWritePermission())) {
      this.status.set('attention');
      return;
    }

    this.status.set('syncing');
    try {
      await provider.write(await this.createDocument());
      this.setPendingChanges(false);
      this.status.set('synced');
    } catch {
      this.status.set(navigator.onLine ? 'attention' : 'waiting');
    }
  }

  private async createDocument(): Promise<BackupDocument> {
    const todayKey = getLocalDateKey();
    const [storedFoods, storedLogs] = await Promise.all([database.foods.toArray(), database.dailyLogs.toArray()]);
    const foods = storedFoods.map((food) => foodSchema.parse(food));
    const logs = storedLogs.map((log) => dailyLogSchema.parse(log));
    const today = logs.find((log) => log.date === todayKey);
    const history = logs
      .filter((log) => log.date !== todayKey && hasConsumedEntries(log))
      .map((log) => ({ ...log, entries: log.entries.filter((entry) => entry.amountGrams > 0) }));

    return { schemaVersion: 1, foods, ...(today === undefined ? {} : { today }), history };
  }

  private async replaceLocalData(document: BackupDocument): Promise<void> {
    const logs = [...document.history, ...(document.today === undefined ? [] : [document.today])];
    await database.transaction('rw', database.foods, database.dailyLogs, async () => {
      await database.foods.clear();
      await database.dailyLogs.clear();
      await database.foods.bulkPut(document.foods);
      await database.dailyLogs.bulkPut(logs);
    });
  }

  private setPendingChanges(hasPendingChanges: boolean): void {
    const settings = this.settings();
    if (settings === undefined || settings.hasPendingChanges === hasPendingChanges) return;
    const updatedSettings = { ...settings, hasPendingChanges, updatedAt: new Date() };
    this.settings.set(updatedSettings);
    void this.settingsRepository.update(updatedSettings);
  }
}

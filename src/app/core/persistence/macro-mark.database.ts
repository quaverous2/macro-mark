import Dexie, { type EntityTable } from 'dexie';
import { DailyLog } from '../domain/daily-log';
import { Food } from '../domain/food';
import type { StorageSettings } from './storage-settings.repository';

class MacroMarkDatabase extends Dexie {
  readonly foods!: EntityTable<Food, 'id'>;
  readonly dailyLogs!: EntityTable<DailyLog, 'date'>;
  readonly storageSettings!: EntityTable<StorageSettings, 'id'>;

  constructor() {
    super('macro-mark');

    this.version(1).stores({
      foods: '&id, &normalizedName, createdAt, updatedAt',
    });

    this.version(2)
      .stores({
        foods: '&id, &normalizedName, createdAt, updatedAt',
        dailyLogs: '&date, updatedAt',
      })
      .upgrade(() => undefined);

    this.version(3)
      .stores({
        foods: '&id, &normalizedName, createdAt, updatedAt',
        dailyLogs: '&date, updatedAt',
        storageSettings: '&id, provider, updatedAt',
      })
      .upgrade(() => undefined);
  }
}

export const database = new MacroMarkDatabase();

import Dexie, { type EntityTable } from 'dexie';
import { DailyLog } from '../domain/daily-log';
import { Food } from '../domain/food';

class MacroMarkDatabase extends Dexie {
  readonly foods!: EntityTable<Food, 'id'>;
  readonly dailyLogs!: EntityTable<DailyLog, 'date'>;

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
  }
}

export const database = new MacroMarkDatabase();

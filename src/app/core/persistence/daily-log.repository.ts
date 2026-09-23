import { Injectable } from '@angular/core';
import { DailyLog } from '../domain/daily-log';
import { dailyLogSchema } from '../domain/daily-log.schema';
import { Food } from '../domain/food';
import { createDailyFoodEntry, hasConsumedEntries } from '../nutrition/daily-nutrition-calculations';
import { database } from './macro-mark.database';
import { PersistenceSyncService } from './persistence-sync.service';

@Injectable({ providedIn: 'root' })
export class DailyLogRepository {
  constructor(private readonly persistenceSyncService: PersistenceSyncService) {}

  async get(date: string): Promise<DailyLog | undefined> {
    const log = await database.dailyLogs.get(date);
    return log === undefined ? undefined : dailyLogSchema.parse(log);
  }

  async listCompletedBefore(date: string): Promise<DailyLog[]> {
    const logs = await database.dailyLogs.toArray();
    return logs
      .map((log) => dailyLogSchema.parse(log))
      .filter((log) => log.date < date && hasConsumedEntries(log))
      .sort((first, second) => second.date.localeCompare(first.date));
  }

  async addEntry(date: string, food: Food): Promise<DailyLog> {
    assertCurrentDate(date);
    const now = new Date();
    const log = await database.transaction('rw', database.dailyLogs, async () => {
      const storedLog = await database.dailyLogs.get(date);
      const currentLog = storedLog === undefined ? undefined : dailyLogSchema.parse(storedLog);
      const log: DailyLog = {
        date,
        entries: [...(currentLog?.entries ?? []), createDailyFoodEntry(food, now)],
        updatedAt: now,
      };
      await database.dailyLogs.put(log);
      return log;
    });
    this.persistenceSyncService.notifyLocalChange();
    return log;
  }

  async updateAmount(date: string, entryId: string, amountGrams: number): Promise<DailyLog> {
    assertCurrentDate(date);
    const now = new Date();
    const log = await database.transaction('rw', database.dailyLogs, async () => {
      const storedLog = await database.dailyLogs.get(date);
      if (storedLog === undefined) throw new Error(`No daily log exists for ${date}.`);
      const currentLog = dailyLogSchema.parse(storedLog);
      const hasEntry = currentLog.entries.some((entry) => entry.id === entryId);
      if (!hasEntry) throw new Error(`No entry exists for ${entryId}.`);
      const entries = currentLog.entries.map((entry) =>
        entry.id === entryId ? { ...entry, amountGrams, updatedAt: now } : entry,
      );
      const log = dailyLogSchema.parse({ ...currentLog, entries, updatedAt: now });
      await database.dailyLogs.put(log);
      return log;
    });
    this.persistenceSyncService.notifyLocalChange();
    return log;
  }

  async removeEntry(date: string, entryId: string): Promise<DailyLog> {
    assertCurrentDate(date);
    const now = new Date();
    const log = await database.transaction('rw', database.dailyLogs, async () => {
      const storedLog = await database.dailyLogs.get(date);
      if (storedLog === undefined) throw new Error(`No daily log exists for ${date}.`);
      const currentLog = dailyLogSchema.parse(storedLog);
      const log = dailyLogSchema.parse({
        ...currentLog,
        entries: currentLog.entries.filter((entry) => entry.id !== entryId),
        updatedAt: now,
      });
      await database.dailyLogs.put(log);
      return log;
    });
    this.persistenceSyncService.notifyLocalChange();
    return log;
  }
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function assertCurrentDate(date: string, currentDate = getLocalDateKey()): void {
  if (date !== currentDate) {
    throw new Error('Past daily logs are read-only.');
  }
}

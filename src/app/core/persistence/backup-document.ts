import { z } from 'zod';
import { DailyLog } from '../domain/daily-log';
import { dailyFoodEntrySchema } from '../domain/daily-log.schema';
import { Food } from '../domain/food';
import { foodSchema } from '../domain/food.schema';

export interface BackupDocument {
  schemaVersion: 1;
  foods: Food[];
  today?: DailyLog;
  history: DailyLog[];
}

const storedFoodSchema = foodSchema.extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const storedDailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entries: z.array(
    dailyFoodEntrySchema.extend({
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
    }),
  ),
  updatedAt: z.coerce.date(),
});

const backupDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  foods: z.array(storedFoodSchema),
  today: storedDailyLogSchema.optional(),
  history: z.array(storedDailyLogSchema),
});

export function parseBackupDocument(value: unknown): BackupDocument {
  return backupDocumentSchema.parse(value);
}

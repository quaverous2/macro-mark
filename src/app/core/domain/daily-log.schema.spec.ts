import { describe, expect, it } from 'vitest';
import { dailyLogSchema } from './daily-log.schema';

const validLog = {
  date: '2026-09-23',
  entries: [{
    id: 'af3761f6-97a1-4c61-a7b1-3c58579a91b6',
    foodId: '4f784ad0-2ec9-4479-8e55-36ac37728e68',
    foodName: 'Banana',
    amountGrams: 120,
    carbohydratesGramsPer100g: 12.8,
    fatGramsPer100g: 0,
    proteinGramsPer100g: 0.8,
    createdAt: new Date('2026-09-23T00:00:00.000Z'),
    updatedAt: new Date('2026-09-23T00:00:00.000Z'),
  }],
  updatedAt: new Date('2026-09-23T00:00:00.000Z'),
};

describe('dailyLogSchema', () => {
  it('rejects entries outside the supported amount range', () => {
    expect(() => dailyLogSchema.parse({ ...validLog, entries: [{ ...validLog.entries[0], amountGrams: 10_000.01 }] })).toThrow();
  });
});

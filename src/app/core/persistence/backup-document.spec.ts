import { describe, expect, it } from 'vitest';
import { parseBackupDocument } from './backup-document';

const document = {
  schemaVersion: 1,
  foods: [{
    id: 'af3761f6-97a1-4c61-a7b1-3c58579a91b6',
    name: 'Banana',
    normalizedName: 'banana',
    carbohydratesGramsPer100g: 12.8,
    fatGramsPer100g: 0,
    proteinGramsPer100g: 0.8,
    createdAt: '2026-09-23T00:00:00.000Z',
    updatedAt: '2026-09-23T00:00:00.000Z',
  }],
  history: [],
};

describe('parseBackupDocument', () => {
  it('hydrates JSON dates into the application document', () => {
    expect(parseBackupDocument(document).foods[0].createdAt).toEqual(new Date('2026-09-23T00:00:00.000Z'));
  });

  it('rejects unsupported document versions', () => {
    expect(() => parseBackupDocument({ ...document, schemaVersion: 2 })).toThrow();
  });
});

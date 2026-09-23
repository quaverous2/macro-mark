import { Injectable } from '@angular/core';
import { z } from 'zod';
import { LocalFileHandle } from './file-system-access';
import { database } from './macro-mark.database';

export type StorageProviderKind = 'device' | 'file' | 'google-sheets';

export interface StorageSettings {
  id: 'storage';
  provider: StorageProviderKind;
  fileHandle?: LocalFileHandle;
  fileName?: string;
  hasPendingChanges: boolean;
  updatedAt: Date;
}

const storageSettingsSchema = z.object({
  id: z.literal('storage'),
  provider: z.enum(['device', 'file', 'google-sheets']),
  fileName: z.string().min(1).max(255).optional(),
  hasPendingChanges: z.boolean(),
  updatedAt: z.date(),
});

@Injectable({ providedIn: 'root' })
export class StorageSettingsRepository {
  async get(): Promise<StorageSettings | undefined> {
    const storedSettings = await database.storageSettings.get('storage');
    if (storedSettings === undefined) return undefined;

    const settings = storageSettingsSchema.parse(storedSettings);
    return {
      ...settings,
      ...(isLocalFileHandle(storedSettings.fileHandle) ? { fileHandle: storedSettings.fileHandle } : {}),
    };
  }

  async save(settings: Omit<StorageSettings, 'id' | 'updatedAt'>): Promise<StorageSettings> {
    const storedSettings: StorageSettings = { id: 'storage', ...settings, updatedAt: new Date() };
    await database.storageSettings.put(storedSettings);
    return storedSettings;
  }

  async update(settings: StorageSettings): Promise<void> {
    await database.storageSettings.put(settings);
  }
}

function isLocalFileHandle(value: unknown): value is LocalFileHandle {
  return typeof value === 'object' && value !== null && 'getFile' in value && 'createWritable' in value;
}

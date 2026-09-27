import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Food } from '../domain/food';
import { FOOD_DATABASE, type FoodDatabase } from './macro-mark.database';
import { PersistenceSyncService } from './persistence-sync.service';

const databaseMock = vi.hoisted(() => ({
  foods: {
    delete: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
  transaction: vi.fn(),
}));

import { FoodNotFoundError, FoodRepository } from './food.repository';

const storedFood: Food = {
  id: '4f784ad0-2ec9-4479-8e55-36ac37728e68',
  name: 'Original food',
  normalizedName: 'original food',
  carbohydratesGramsPer100g: 12,
  fatGramsPer100g: 3,
  proteinGramsPer100g: 4,
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  updatedAt: new Date('2026-09-02T00:00:00.000Z'),
};

describe('FoodRepository mutations', () => {
  let repository: FoodRepository;
  let persistenceSyncService: Pick<PersistenceSyncService, 'notifyLocalChange'>;

  beforeEach(async () => {
    vi.clearAllMocks();
    databaseMock.transaction.mockImplementation(
      async (_mode: unknown, _table: unknown, operation: () => Promise<unknown>) => operation(),
    );
    persistenceSyncService = { notifyLocalChange: vi.fn() };

    await TestBed.configureTestingModule({
      providers: [
        FoodRepository,
        { provide: FOOD_DATABASE, useValue: databaseMock as unknown as FoodDatabase },
        { provide: PersistenceSyncService, useValue: persistenceSyncService },
      ],
    }).compileComponents();

    repository = TestBed.inject(FoodRepository);
  });

  it('updates the library record without changing its identity or creation date', async () => {
    databaseMock.foods.get.mockResolvedValue(storedFood);
    databaseMock.foods.put.mockResolvedValue(storedFood.id);
    const updatedFood = await repository.update(storedFood.id, {
      name: '  Updated   food  ',
      carbohydratesGramsPer100g: 20,
      fatGramsPer100g: 5,
      proteinGramsPer100g: 7,
      saltGramsPer100g: 0.4,
    });

    expect(updatedFood).toMatchObject({
      id: storedFood.id,
      name: 'Updated   food',
      normalizedName: 'updated food',
      createdAt: storedFood.createdAt,
      carbohydratesGramsPer100g: 20,
    });
    expect(updatedFood.updatedAt).not.toEqual(storedFood.updatedAt);
    expect(databaseMock.foods.put).toHaveBeenCalledWith(updatedFood);
    expect(persistenceSyncService.notifyLocalChange).toHaveBeenCalledOnce();
  });

  it('permanently removes only an existing food and notifies persistence sync', async () => {
    databaseMock.foods.get.mockResolvedValue(storedFood);
    databaseMock.foods.delete.mockResolvedValue(undefined);
    await repository.remove(storedFood.id);

    expect(databaseMock.foods.delete).toHaveBeenCalledWith(storedFood.id);
    expect(persistenceSyncService.notifyLocalChange).toHaveBeenCalledOnce();
  });

  it('does not notify persistence sync when the food has already been removed', async () => {
    databaseMock.foods.get.mockResolvedValue(undefined);
    await expect(repository.remove(storedFood.id)).rejects.toBeInstanceOf(FoodNotFoundError);

    expect(databaseMock.foods.delete).not.toHaveBeenCalled();
    expect(persistenceSyncService.notifyLocalChange).not.toHaveBeenCalled();
  });
});

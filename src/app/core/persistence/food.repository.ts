import { Injectable, inject } from '@angular/core';
import Dexie from 'dexie';
import { Food, FoodNutrition } from '../domain/food';
import { foodSchema } from '../domain/food.schema';
import { FOOD_DATABASE } from './macro-mark.database';
import { PersistenceSyncService } from './persistence-sync.service';

export class DuplicateFoodNameError extends Error {
  constructor(name: string) {
    super(`${name} is already in your food library.`);
  }
}

export class FoodNotFoundError extends Error {
  constructor() {
    super('This food no longer exists.');
  }
}

export interface NewFood extends FoodNutrition {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class FoodRepository {
  private readonly database = inject(FOOD_DATABASE);

  constructor(private readonly persistenceSyncService: PersistenceSyncService) {}

  async listNewest(): Promise<Food[]> {
    const foods = await this.database.foods.orderBy('createdAt').reverse().toArray();
    return foods.map((food) => foodSchema.parse(food));
  }

  async getById(id: string): Promise<Food | undefined> {
    const food = await this.database.foods.get(id);
    return food === undefined ? undefined : foodSchema.parse(food);
  }

  async add(newFood: NewFood): Promise<Food> {
    const now = new Date();
    const name = newFood.name.trim();
    const food = foodSchema.parse({
      ...newFood,
      id: crypto.randomUUID(),
      name,
      normalizedName: normalizeFoodName(name),
      createdAt: now,
      updatedAt: now,
    });

    try {
      await this.database.foods.add(food);
      this.persistenceSyncService.notifyLocalChange();
      return food;
    } catch (error) {
      if (error instanceof Dexie.ConstraintError) {
        throw new DuplicateFoodNameError(food.name);
      }

      throw error;
    }
  }

  async update(id: string, values: NewFood): Promise<Food> {
    const food = await this.database.transaction('rw', this.database.foods, async () => {
      const existingFood = await this.database.foods.get(id);
      if (existingFood === undefined) {
        throw new FoodNotFoundError();
      }

      const name = values.name.trim();
      const normalizedName = normalizeFoodName(name);
      const food = foodSchema.parse({
        ...values,
        id,
        name,
        normalizedName,
        createdAt: existingFood.createdAt,
        updatedAt: new Date(),
      });

      try {
        await this.database.foods.put(food);
        return food;
      } catch (error) {
        if (error instanceof Dexie.ConstraintError) {
          throw new DuplicateFoodNameError(food.name);
        }

        throw error;
      }
    });

    this.persistenceSyncService.notifyLocalChange();
    return food;
  }

  async remove(id: string): Promise<void> {
    await this.database.transaction('rw', this.database.foods, async () => {
      const food = await this.database.foods.get(id);
      if (food === undefined) {
        throw new FoodNotFoundError();
      }

      await this.database.foods.delete(id);
    });

    this.persistenceSyncService.notifyLocalChange();
  }
}

export function normalizeFoodName(name: string): string {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

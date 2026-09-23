import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { Food, FoodNutrition } from '../domain/food';
import { foodSchema } from '../domain/food.schema';
import { database } from './macro-mark.database';
import { PersistenceSyncService } from './persistence-sync.service';

export class DuplicateFoodNameError extends Error {
  constructor(name: string) {
    super(`${name} is already in your food library.`);
  }
}

export interface NewFood extends FoodNutrition {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class FoodRepository {
  constructor(private readonly persistenceSyncService: PersistenceSyncService) {}

  async listNewest(): Promise<Food[]> {
    const foods = await database.foods.orderBy('createdAt').reverse().toArray();
    return foods.map((food) => foodSchema.parse(food));
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
      await database.foods.add(food);
      this.persistenceSyncService.notifyLocalChange();
      return food;
    } catch (error) {
      if (error instanceof Dexie.ConstraintError) {
        throw new DuplicateFoodNameError(food.name);
      }

      throw error;
    }
  }
}

export function normalizeFoodName(name: string): string {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Food } from '../../core/domain/food';
import { NutritionTotals } from '../../core/nutrition/daily-nutrition-calculations';
import { calculateCaloriesPer100g } from '../../core/nutrition/nutrition-calculations';
import { FoodNotFoundError, FoodRepository } from '../../core/persistence/food.repository';
import { ToastService } from '../../core/ui/toast.service';
import { NutritionRow } from '../../shared/nutrition-row/nutrition-row';

@Component({
  selector: 'app-food-library-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NutritionRow, RouterLink],
  templateUrl: './food-library-page.html',
  styleUrl: './food-library-page.scss',
})
export class FoodLibraryPage {
  private readonly foodRepository = inject(FoodRepository);
  private readonly toastService = inject(ToastService);

  readonly foods = signal<Food[]>([]);
  readonly searchTerm = signal('');
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly foodPendingRemoval = signal<Food | null>(null);
  readonly isRemoving = signal(false);
  readonly removalError = signal<string | null>(null);
  readonly filteredFoods = computed(() => {
    const searchTerm = this.searchTerm().trim().toLocaleLowerCase();

    return this.foods().filter((food) =>
      food.name.toLocaleLowerCase().includes(searchTerm),
    );
  });

  constructor() {
    void this.loadFoods();
  }

  protected updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  protected requestRemoval(food: Food): void {
    this.removalError.set(null);
    this.foodPendingRemoval.set(food);
  }

  protected cancelRemoval(): void {
    this.foodPendingRemoval.set(null);
  }

  protected async removeFood(): Promise<void> {
    const food = this.foodPendingRemoval();
    if (food === null) {
      return;
    }

    this.isRemoving.set(true);
    this.removalError.set(null);

    try {
      await this.foodRepository.remove(food.id);
      this.foods.update((foods) => foods.filter((item) => item.id !== food.id));
      this.foodPendingRemoval.set(null);
      this.toastService.showSuccess(`${food.name} removed from your foods.`);
    } catch (error) {
      this.removalError.set(
        error instanceof FoodNotFoundError
          ? 'This food has already been removed.'
          : 'This food could not be removed. Please try again.',
      );
    } finally {
      this.isRemoving.set(false);
    }
  }

  protected foodNutrition(food: Food): NutritionTotals {
    return {
      carbohydratesGramsPer100g: food.carbohydratesGramsPer100g,
      fatGramsPer100g: food.fatGramsPer100g,
      proteinGramsPer100g: food.proteinGramsPer100g,
      saltGramsPer100g: food.saltGramsPer100g ?? 0,
      calories: calculateCaloriesPer100g(food),
    };
  }

  private async loadFoods(): Promise<void> {
    try {
      this.foods.set(await this.foodRepository.listNewest());
    } catch {
      this.loadError.set('Your food library could not be loaded. Please refresh and try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}

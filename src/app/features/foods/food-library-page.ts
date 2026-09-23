import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Food } from '../../core/domain/food';
import { FoodRepository } from '../../core/persistence/food.repository';
import { FoodCard } from './food-card/food-card';

@Component({
  selector: 'app-food-library-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FoodCard],
  templateUrl: './food-library-page.html',
  styleUrl: './food-library-page.scss',
})
export class FoodLibraryPage {
  private readonly foodRepository = inject(FoodRepository);

  readonly foods = signal<Food[]>([]);
  readonly searchTerm = signal('');
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
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

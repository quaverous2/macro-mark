import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Food } from '../../../core/domain/food';
import {
  calculateCaloriesPer100g,
  formatNutritionValue,
} from '../../../core/nutrition/nutrition-calculations';

@Component({
  selector: 'app-food-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './food-card.html',
  styleUrl: './food-card.scss',
})
export class FoodCard {
  readonly food = input.required<Food>();
  readonly calories = computed(() => calculateCaloriesPer100g(this.food()));

  protected readonly formatNutritionValue = formatNutritionValue;
}

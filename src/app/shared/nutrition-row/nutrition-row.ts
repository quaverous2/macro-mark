import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NutritionTotals } from '../../core/nutrition/daily-nutrition-calculations';
import { formatNutritionValue } from '../../core/nutrition/nutrition-calculations';

@Component({
  selector: 'app-nutrition-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  host: { '[class.nutrition-row-host--total]': 'isTotal()' },
  templateUrl: './nutrition-row.html',
  styleUrl: './nutrition-row.scss',
})
export class NutritionRow {
  readonly name = input.required<string>();
  readonly nutrition = input.required<NutritionTotals>();
  readonly kind = input<'today' | 'foods'>('foods');
  readonly amountControl = input<FormControl<number> | null>(null);
  readonly per100g = input(false);
  readonly editLink = input<string[] | null>(null);
  readonly isTotal = input(false);
  readonly amountChanged = output<number>();
  readonly amountBlurred = output<void>();
  readonly removeRequested = output<void>();

  protected readonly formatNutritionValue = formatNutritionValue;
}

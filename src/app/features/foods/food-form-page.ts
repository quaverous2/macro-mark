import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { FoodNutrition } from '../../core/domain/food';
import {
  calculateCaloriesPer100g,
  formatNutritionValue,
} from '../../core/nutrition/nutrition-calculations';
import {
  DuplicateFoodNameError,
  FoodNotFoundError,
  FoodRepository,
} from '../../core/persistence/food.repository';
import { ToastService } from '../../core/ui/toast.service';

const nutritionValidators = [
  Validators.required,
  Validators.min(0),
  Validators.max(100),
  decimalPlacesValidator(2),
];

@Component({
  selector: 'app-food-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './food-form-page.html',
  styleUrl: './food-form-page.scss',
})
export class FoodFormPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly foodRepository = inject(FoodRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly submitted = signal(false);
  readonly isEditing = this.route.snapshot.paramMap.has('id');
  readonly isSaving = signal(false);
  readonly isLoadingFood = signal(this.isEditing);
  readonly loadError = signal<string | null>(null);
  readonly submissionError = signal<string | null>(null);
  readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    fatGramsPer100g: [null as number | null, nutritionValidators],
    carbohydratesGramsPer100g: [null as number | null, nutritionValidators],
    proteinGramsPer100g: [null as number | null, nutritionValidators],
    saltGramsPer100g: [null as number | null, [Validators.min(0), Validators.max(100), decimalPlacesValidator(2)]],
  });
  private readonly formValues = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );
  readonly calories = computed(() => {
    const values = this.formValues();

    if (
      values.fatGramsPer100g === null ||
      values.carbohydratesGramsPer100g === null ||
      values.proteinGramsPer100g === null
    ) {
      return null;
    }

    return calculateCaloriesPer100g(values as FoodNutrition);
  });

  protected readonly formatNutritionValue = formatNutritionValue;

  constructor() {
    const foodId = this.route.snapshot.paramMap.get('id');
    if (foodId !== null) {
      void this.loadFood(foodId);
    }
  }

  protected showError(controlName: keyof typeof this.form.controls): boolean {
    return this.submitted() && this.form.controls[controlName].invalid;
  }

  protected async save(): Promise<void> {
    this.submitted.set(true);
    this.submissionError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const values = this.form.getRawValue();
    const foodValues = {
      name: values.name ?? '',
      fatGramsPer100g: values.fatGramsPer100g as number,
      carbohydratesGramsPer100g: values.carbohydratesGramsPer100g as number,
      proteinGramsPer100g: values.proteinGramsPer100g as number,
      ...(values.saltGramsPer100g === null
        ? {}
        : { saltGramsPer100g: values.saltGramsPer100g }),
    };

    try {
      const foodId = this.route.snapshot.paramMap.get('id');
      if (foodId === null) {
        await this.foodRepository.add(foodValues);
        this.toastService.showSuccess(`${values.name?.trim()} added to your foods.`);
      } else {
        await this.foodRepository.update(foodId, foodValues);
        this.toastService.showSuccess(`${values.name?.trim()} updated.`);
      }
      await this.router.navigate(['/foods']);
    } catch (error) {
      this.submissionError.set(
        error instanceof DuplicateFoodNameError
          ? error.message
          : error instanceof FoodNotFoundError
            ? 'This food no longer exists.'
          : 'Your food could not be saved. Please try again.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  private async loadFood(id: string): Promise<void> {
    try {
      const food = await this.foodRepository.getById(id);
      if (food === undefined) {
        this.loadError.set('This food no longer exists.');
        return;
      }

      this.form.patchValue({
        name: food.name,
        fatGramsPer100g: food.fatGramsPer100g,
        carbohydratesGramsPer100g: food.carbohydratesGramsPer100g,
        proteinGramsPer100g: food.proteinGramsPer100g,
        saltGramsPer100g: food.saltGramsPer100g ?? null,
      });
    } catch {
      this.loadError.set('This food could not be loaded. Please return to your food library.');
    } finally {
      this.isLoadingFood.set(false);
    }
  }
}

function decimalPlacesValidator(maximumDecimalPlaces: number): ValidatorFn {
  return (control): ValidationErrors | null => {
    if (control.value === null || control.value === '') {
      return null;
    }

    const decimalPart = String(control.value).split('.')[1];
    return decimalPart && decimalPart.length > maximumDecimalPlaces
      ? { decimalPlaces: { maximumDecimalPlaces } }
      : null;
  };
}

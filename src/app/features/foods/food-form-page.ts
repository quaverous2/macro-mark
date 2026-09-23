import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { FoodNutrition } from '../../core/domain/food';
import {
  calculateCaloriesPer100g,
  formatNutritionValue,
} from '../../core/nutrition/nutrition-calculations';
import {
  DuplicateFoodNameError,
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
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly submitted = signal(false);
  readonly isSaving = signal(false);
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

    try {
      await this.foodRepository.add({
        name: values.name ?? '',
        fatGramsPer100g: values.fatGramsPer100g as number,
        carbohydratesGramsPer100g: values.carbohydratesGramsPer100g as number,
        proteinGramsPer100g: values.proteinGramsPer100g as number,
        ...(values.saltGramsPer100g === null
          ? {}
          : { saltGramsPer100g: values.saltGramsPer100g }),
      });
      this.toastService.showSuccess(`${values.name?.trim()} added to your foods.`);
      await this.router.navigate(['/foods']);
    } catch (error) {
      this.submissionError.set(
        error instanceof DuplicateFoodNameError
          ? error.message
          : 'Your food could not be saved. Please try again.',
      );
    } finally {
      this.isSaving.set(false);
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

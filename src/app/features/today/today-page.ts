import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DailyFoodEntry } from '../../core/domain/daily-log';
import { Food } from '../../core/domain/food';
import { calculateDailyTotals, calculateEntryNutrition } from '../../core/nutrition/daily-nutrition-calculations';
import { formatNutritionValue } from '../../core/nutrition/nutrition-calculations';
import { DailyLogRepository, getLocalDateKey } from '../../core/persistence/daily-log.repository';
import { FoodRepository } from '../../core/persistence/food.repository';

const amountValidator: ValidatorFn = (control) => {
  const value = control.value;
  return Number.isFinite(value) && value >= 0 && value <= 10_000 && Math.abs(value * 100 - Math.round(value * 100)) < 1e-8
    ? null
    : { amount: true };
};

@Component({
  selector: 'app-today-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './today-page.html',
  styleUrl: './today-page.scss',
})
export class TodayPage {
  private readonly foodRepository = inject(FoodRepository);
  private readonly dailyLogRepository = inject(DailyLogRepository);
  private dateKey = getLocalDateKey();
  private readonly amountControls = new Map<string, FormControl<number>>();
  private readonly saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly foods = signal<Food[]>([]);
  readonly entries = signal<DailyFoodEntry[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly isPickerOpen = signal(false);
  readonly pickerSearch = signal('');
  readonly isAdding = signal(false);
  readonly totals = computed(() => calculateDailyTotals(this.entries()));
  readonly filteredFoods = computed(() => {
    const term = this.pickerSearch().trim().toLocaleLowerCase();
    return this.foods().filter((food) => food.name.toLocaleLowerCase().includes(term));
  });

  constructor() {
    void this.loadToday();
  }

  @HostListener('document:visibilitychange')
  protected handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') void this.refreshForDateChange();
  }

  protected async togglePicker(): Promise<void> {
    if (await this.refreshForDateChange()) return;
    this.isPickerOpen.update((isOpen) => !isOpen);
    this.pickerSearch.set('');
  }

  protected updatePickerSearch(value: string): void { this.pickerSearch.set(value); }

  protected async addEntry(food: Food): Promise<void> {
    if (await this.refreshForDateChange()) return;
    this.isAdding.set(true);
    this.saveError.set(null);
    try {
      const log = await this.dailyLogRepository.addEntry(this.dateKey, food);
      this.setEntries(log.entries);
      this.isPickerOpen.set(false);
      this.pickerSearch.set('');
    } catch {
      this.saveError.set('This food could not be added. Please try again.');
    } finally {
      this.isAdding.set(false);
    }
  }

  protected amountControl(entryId: string): FormControl<number> {
    const control = this.amountControls.get(entryId);
    if (control === undefined) throw new Error(`No amount control exists for ${entryId}.`);
    return control;
  }

  protected async updateAmount(entryId: string, amount: number): Promise<void> {
    if (await this.refreshForDateChange()) return;
    if (this.amountControl(entryId).invalid) return;
    this.entries.update((entries) => entries.map((entry) =>
      entry.id === entryId ? { ...entry, amountGrams: amount } : entry,
    ));
    this.queueAmountSave(entryId, amount);
  }

  protected async flushAmountSave(entryId: string): Promise<void> {
    if (await this.refreshForDateChange()) return;
    const control = this.amountControl(entryId);
    if (control.invalid) {
      const entry = this.entries().find((candidate) => candidate.id === entryId);
      if (entry !== undefined) control.setValue(entry.amountGrams, { emitEvent: false });
      return;
    }
    this.clearAmountSave(entryId);
    void this.persistAmount(entryId, control.value);
  }

  protected async removeEntry(entryId: string): Promise<void> {
    if (await this.refreshForDateChange()) return;
    this.clearAmountSave(entryId);
    this.saveError.set(null);
    try {
      const log = await this.dailyLogRepository.removeEntry(this.dateKey, entryId);
      this.amountControls.delete(entryId);
      this.setEntries(log.entries);
    } catch {
      this.saveError.set('This entry could not be removed. Please try again.');
    }
  }

  protected readonly calculateEntryNutrition = calculateEntryNutrition;
  protected readonly formatNutritionValue = formatNutritionValue;

  private async loadToday(): Promise<void> {
    try {
      const [foods, log] = await Promise.all([this.foodRepository.listNewest(), this.dailyLogRepository.get(this.dateKey)]);
      this.foods.set(foods);
      this.setEntries(log?.entries ?? []);
    } catch {
      this.loadError.set('Today could not be loaded. Please refresh and try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private setEntries(entries: DailyFoodEntry[]): void {
    this.entries.set(entries);
    for (const entry of entries) {
      if (!this.amountControls.has(entry.id)) {
        this.amountControls.set(entry.id, new FormControl(entry.amountGrams, { nonNullable: true, validators: [amountValidator] }));
      }
    }
  }

  private queueAmountSave(entryId: string, amount: number): void {
    this.clearAmountSave(entryId);
    this.saveTimers.set(entryId, setTimeout(() => void this.persistAmount(entryId, amount), 300));
  }

  private clearAmountSave(entryId: string): void {
    const timer = this.saveTimers.get(entryId);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.saveTimers.delete(entryId);
    }
  }

  private async persistAmount(entryId: string, amount: number): Promise<void> {
    if (await this.refreshForDateChange()) return;
    this.clearAmountSave(entryId);
    this.saveError.set(null);
    try {
      await this.dailyLogRepository.updateAmount(this.dateKey, entryId, amount);
    } catch {
      this.saveError.set('This amount could not be saved. Please try again.');
    }
  }

  private async refreshForDateChange(): Promise<boolean> {
    const currentDateKey = getLocalDateKey();
    if (currentDateKey === this.dateKey) return false;

    for (const timer of this.saveTimers.values()) clearTimeout(timer);
    this.saveTimers.clear();
    this.amountControls.clear();
    this.entries.set([]);
    this.dateKey = currentDateKey;
    this.isPickerOpen.set(false);
    this.pickerSearch.set('');
    await this.loadToday();
    return true;
  }
}

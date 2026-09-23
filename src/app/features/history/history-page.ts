import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DailyFoodEntry, DailyLog } from '../../core/domain/daily-log';
import {
  calculateDailyTotals,
  calculateEntryNutrition,
} from '../../core/nutrition/daily-nutrition-calculations';
import { formatNutritionValue } from '../../core/nutrition/nutrition-calculations';
import { DailyLogRepository, getLocalDateKey } from '../../core/persistence/daily-log.repository';

@Component({
  selector: 'app-history-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './history-page.html',
  styleUrl: './history-page.scss',
})
export class HistoryPage {
  private readonly dailyLogRepository = inject(DailyLogRepository);

  readonly logs = signal<DailyLog[]>([]);
  readonly expandedDates = signal<ReadonlySet<string>>(new Set());
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly completedEntries = computed(() =>
    new Map(this.logs().map((log) => [log.date, log.entries.filter((entry) => entry.amountGrams > 0)])),
  );

  constructor() {
    void this.loadHistory();
  }

  protected toggleDate(date: string): void {
    this.expandedDates.update((expandedDates) => {
      const nextDates = new Set(expandedDates);
      nextDates.has(date) ? nextDates.delete(date) : nextDates.add(date);
      return nextDates;
    });
  }

  protected entriesFor(log: DailyLog): DailyFoodEntry[] {
    return this.completedEntries().get(log.date) ?? [];
  }

  protected readonly calculateDailyTotals = calculateDailyTotals;
  protected readonly calculateEntryNutrition = calculateEntryNutrition;
  protected readonly formatNutritionValue = formatNutritionValue;
  protected readonly formatHistoryDate = formatHistoryDate;

  private async loadHistory(): Promise<void> {
    try {
      this.logs.set(await this.dailyLogRepository.listCompletedBefore(getLocalDateKey()));
    } catch {
      this.loadError.set('History could not be loaded. Please refresh and try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}

export function formatHistoryDate(dateKey: string, todayKey = getLocalDateKey()): string {
  const date = dateFromKey(dateKey);
  const yesterday = dateFromKey(todayKey);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateKey === toDateKey(yesterday)) {
    return `Yesterday, ${new Intl.DateTimeFormat('en-CH', { day: 'numeric', month: 'short' }).format(date)}`;
  }

  return new Intl.DateTimeFormat('en-CH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function dateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

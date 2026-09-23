import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<string | null>(null);
  private timeoutId: ReturnType<typeof setTimeout> | undefined;

  showSuccess(message: string): void {
    this.message.set(message);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => this.message.set(null), 3_500);
  }
}

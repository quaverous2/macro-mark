import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastService } from './core/ui/toast.service';
import { PersistenceSyncService } from './core/persistence/persistence-sync.service';
import { DataBackupPage } from './features/data-backup/data-backup-page';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataBackupPage, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly toastService = inject(ToastService);
  protected readonly persistenceSyncService = inject(PersistenceSyncService);
}

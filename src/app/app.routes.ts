import { Routes } from '@angular/router';
import { FoodFormPage } from './features/foods/food-form-page';
import { FoodLibraryPage } from './features/foods/food-library-page';
import { HistoryPage } from './features/history/history-page';
import { TodayPage } from './features/today/today-page';

export const routes: Routes = [
  { path: '', component: TodayPage, pathMatch: 'full' },
  { path: 'foods', component: FoodLibraryPage },
  { path: 'foods/new', component: FoodFormPage },
  { path: 'history', component: HistoryPage },
  { path: '**', redirectTo: '' },
];

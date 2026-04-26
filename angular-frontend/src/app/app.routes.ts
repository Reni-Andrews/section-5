import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'chat',
    loadComponent: () => import('./pages/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'chat' },
];

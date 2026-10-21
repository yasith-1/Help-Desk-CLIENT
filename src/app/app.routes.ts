import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { permGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/register.component').then(m => m.RegisterComponent) },

  { path: 'dashboard', canActivate: [authGuard],
    loadComponent: () => import('./components/dashboard.component').then(m => m.DashboardComponent) },

  { path: 'tickets', canActivate: [authGuard],
    loadComponent: () => import('./components/ticket-list.component').then(m => m.TicketListComponent) },
  { path: 'tickets/new', canActivate: [authGuard],
    loadComponent: () => import('./components/ticket-form.component').then(m => m.TicketFormComponent) },
  { path: 'tickets/:id', canActivate: [authGuard],
    loadComponent: () => import('./components/ticket-detail.component').then(m => m.TicketDetailComponent) },
  { path: 'tickets/:id/edit', canActivate: [authGuard],
    loadComponent: () => import('./components/ticket-form.component').then(m => m.TicketFormComponent) },

  // Permission-gated admin screens
  { path: 'admin/users', canActivate: [permGuard], data: { perm: 'users.manage' },
    loadComponent: () => import('./components/admin-users.component').then(m => m.AdminUsersComponent) },
  { path: 'admin/categories', canActivate: [permGuard], data: { perm: 'categories.manage' },
    loadComponent: () => import('./components/admin-categories.component').then(m => m.AdminCategoriesComponent) },
  { path: 'admin/roles', canActivate: [permGuard], data: { perm: 'roles.manage' },
    loadComponent: () => import('./components/admin-roles.component').then(m => m.AdminRolesComponent) },

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];

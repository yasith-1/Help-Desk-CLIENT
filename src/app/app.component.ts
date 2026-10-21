import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { ToastService } from './services/toast.service';
import { ConfirmService } from './services/confirm.service';
import { DashboardService } from './services/dashboard.service';
import { AvatarComponent } from './components/ui/avatar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, NgClass, AvatarComponent],
  template: `
    @if (auth.isLoggedIn()) {
      <div class="flex min-h-screen bg-background">
        <!-- Sidebar -->
        <aside class="sticky top-0 h-screen w-[68px] shrink-0 bg-sidebar border-r border-border flex flex-col items-center py-4 gap-2 z-20">
          <a routerLink="/dashboard" class="grid place-items-center h-10 w-10 rounded-xl bg-brand text-brand-foreground font-bold mb-2 shadow-lg shadow-brand/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
          </a>

          @for (n of nav(); track n.path) {
            <a [routerLink]="n.path" routerLinkActive="!bg-accent !text-foreground" [routerLinkActiveOptions]="{exact:true}" [title]="n.label"
               class="group relative grid place-items-center h-11 w-11 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              @switch (n.key) {
                @case ('dash') { <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg> }
                @case ('ticket') { <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a2 2 0 012-2h14a2 2 0 012 2 2 2 0 000 4 2 2 0 01-2 2H5a2 2 0 01-2-2 2 2 0 000-4z"/><path d="M13 7v10"/></svg> }
                @case ('plus') { <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg> }
                @case ('users') { <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8"/></svg> }
                @case ('tag') { <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0l-7-7a2 2 0 01-.6-1.4V5a2 2 0 012-2h6.8a2 2 0 011.4.6l7.4 7.4a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg> }
                @case ('shield') { <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg> }
              }
            </a>
          }

          <div class="flex-1"></div>
          <button class="btn-icon text-muted-foreground" (click)="theme.toggle()" [title]="theme.theme()==='dark' ? 'Light mode' : 'Dark mode'">
            @if (theme.theme()==='dark') {
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            } @else {
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>
            }
          </button>
          <button class="btn-icon text-muted-foreground hover:!text-destructive" (click)="logout()" title="Logout">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </aside>

        <!-- Main -->
        <div class="flex-1 min-w-0 flex flex-col">
          <header class="sticky top-0 z-10 h-16 bg-background/80 backdrop-blur border-b border-border flex items-center gap-4 px-4 sm:px-6">
            <span class="font-semibold text-[15px] shrink-0">{{ title() }}</span>

            <div class="flex-1 max-w-md mx-auto hidden sm:block">
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
                <input class="input pl-9 h-9 bg-muted/50 border-transparent" [(ngModel)]="search" (keyup.enter)="doSearch()" placeholder="Search tickets…" />
              </div>
            </div>

            <div class="flex items-center gap-2 sm:gap-3 ml-auto">
              <button class="btn-icon relative text-muted-foreground" (click)="goAlerts()" title="Alerts">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/></svg>
                @if (alerts() > 0) { <span class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand text-brand-foreground text-[10px] font-bold grid place-items-center">{{ alerts() }}</span> }
              </button>
              <span class="hidden md:inline-flex pill border-border text-muted-foreground">📅 {{ today }}</span>
              <div class="flex items-center gap-2 pl-2 sm:border-l border-border">
                <ui-avatar [name]="auth.fullName()" size="sm" />
                <div class="hidden sm:block leading-tight">
                  <div class="text-sm font-medium">{{ auth.fullName() }}</div>
                  <div class="text-[11px] text-muted-foreground">{{ auth.role() }}</div>
                </div>
              </div>
            </div>
          </header>

          <main class="flex-1 animate-fade-in"><router-outlet /></main>
        </div>
      </div>
    } @else {
      <router-outlet />
    }

    <!-- Confirmation dialog -->
    @if (confirm.current(); as c) {
      <div class="fixed inset-0 z-[200] grid place-items-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" (click)="confirm.cancel()">
        <div class="card p-6 w-full max-w-sm shadow-lg" (click)="$event.stopPropagation()">
          <div class="flex items-start gap-3">
            <div class="grid place-items-center h-10 w-10 rounded-full shrink-0"
                 [ngClass]="c.danger ? 'bg-destructive/10 text-destructive' : 'bg-accent text-foreground'">
              @if (c.danger) {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h16.9a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>
              } @else {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              }
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold">{{ c.title }}</h3>
              <p class="text-sm text-muted-foreground mt-1">{{ c.message }}</p>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-5">
            <button class="btn-outline btn-sm" (click)="confirm.cancel()">{{ c.cancelText }}</button>
            <button [class]="c.danger ? 'btn-destructive btn-sm' : 'btn-primary btn-sm'" (click)="confirm.confirm()">{{ c.confirmText }}</button>
          </div>
        </div>
      </div>
    }

    <!-- Toasts -->
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      @for (t of toast.toasts(); track t.id) {
        <div (click)="toast.dismiss(t.id)" class="animate-slide-in cursor-pointer rounded-lg border bg-popover px-4 py-3 text-sm shadow-lg min-w-[240px]"
             [class.border-emerald-500]="t.type==='success'" [class.border-destructive]="t.type==='error'" [class.border-border]="t.type==='info'">
          {{ t.text }}
        </div>
      }
    </div>
  `
})
export class AppComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  toast = inject(ToastService);
  confirm = inject(ConfirmService);
  private dash = inject(DashboardService);
  private router = inject(Router);

  search = '';
  alerts = signal(0);
  today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  nav = () => {
    const base = [
      { path: '/dashboard', label: 'Dashboard', key: 'dash' },
      { path: '/tickets', label: 'Tickets', key: 'ticket' },
      { path: '/tickets/new', label: 'New Ticket', key: 'plus' },
    ];
    if (this.auth.has('users.manage')) base.push({ path: '/admin/users', label: 'Users', key: 'users' });
    if (this.auth.has('roles.manage')) base.push({ path: '/admin/roles', label: 'Roles & Permissions', key: 'shield' });
    if (this.auth.has('categories.manage')) base.push({ path: '/admin/categories', label: 'Categories', key: 'tag' });
    return base;
  };

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.auth.refreshPermissions();   // role/permission වෙනස් වෙලා නම් latest ගන්නවා
      this.dash.stats().subscribe({
        next: s => this.alerts.set(this.auth.isStaff() ? s.overdue + s.unassigned : s.open),
        error: () => {}
      });
    }
  }

  title() {
    const u = this.router.url.split('?')[0];
    if (u.startsWith('/dashboard')) return 'Dashboard';
    if (u === '/tickets/new') return 'New Ticket';
    if (u.endsWith('/edit')) return 'Edit Ticket';
    if (/^\/tickets\/\d+/.test(u)) return 'Ticket Details';
    if (u.startsWith('/tickets')) return 'Tickets';
    if (u.startsWith('/admin/users')) return 'User Management';
    if (u.startsWith('/admin/categories')) return 'Categories';
    return 'HelpDesk';
  }

  doSearch() { this.router.navigate(['/tickets'], { queryParams: { search: this.search || null } }); }
  goAlerts() { this.router.navigate(['/tickets'], { queryParams: this.auth.isStaff() ? { assignedToId: -1 } : {} }); }
  logout() { this.auth.logout(); this.router.navigate(['/login']); }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PasswordInputComponent } from './ui/password-input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, PasswordInputComponent],
  template: `
    <div class="min-h-screen grid place-items-center p-4 relative overflow-hidden">
      <div class="absolute inset-0 -z-10" style="background:radial-gradient(60% 50% at 50% 0%, hsl(217 91% 60% / .12), transparent 70%)"></div>

      <div class="w-full max-w-sm card p-6 animate-fade-in">
        <div class="flex items-center gap-2 mb-1">
          <span class="grid place-items-center h-9 w-9 rounded-xl bg-brand text-brand-foreground">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
          </span>
          <span class="text-lg font-bold">HelpDesk</span>
        </div>
        <p class="text-sm text-muted-foreground mb-5">Sign in to your support workspace</p>

        @if (error()) { <div class="pill-overdue w-full justify-start mb-4 py-2">{{ error() }}</div> }

        <form (ngSubmit)="submit()" class="space-y-3">
          <div>
            <label class="label">Username</label>
            <input class="input" [(ngModel)]="username" name="username" placeholder="admin" autocomplete="username" />
          </div>
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="label mb-0">Password</label>
              <a routerLink="/forgot-password" class="text-xs text-brand font-medium hover:underline">Forgot password?</a>
            </div>
            <ui-password [(ngModel)]="password" name="password" placeholder="••••••" autocomplete="current-password" />
          </div>
          <button class="btn-primary w-full" type="submit" [disabled]="loading()">{{ loading() ? 'Signing in…' : 'Sign in' }}</button>
        </form>

        <p class="text-sm text-muted-foreground mt-4">New here? <a routerLink="/register" class="text-brand font-medium hover:underline">Create an account</a></p>

        <div class="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-xs space-y-0.5">
          <div class="font-semibold mb-1">Demo accounts</div>
          <div>Admin — <span class="font-mono">admin / admin123</span></div>
          <div>Agent — <span class="font-mono">nimal / nimal123</span></div>
          <div>Customer — <span class="font-mono">kamal / kamal123</span></div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  username = ''; password = '';
  error = signal(''); loading = signal(false);

  submit() {
    if (!this.username || !this.password) { this.error.set('Username and password are required'); return; }
    this.loading.set(true); this.error.set('');
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => { this.error.set(err.error?.message ?? 'Login failed'); this.loading.set(false); }
    });
  }
}

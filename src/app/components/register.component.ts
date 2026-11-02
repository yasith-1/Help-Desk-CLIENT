import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { PasswordInputComponent } from './ui/password-input.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, PasswordInputComponent],
  template: `
    <div class="min-h-screen grid place-items-center p-4 relative overflow-hidden">
      <div class="absolute inset-0 -z-10" style="background:radial-gradient(60% 50% at 50% 0%, hsl(217 91% 60% / .12), transparent 70%)"></div>

      <div class="w-full max-w-sm card p-6 animate-fade-in">
        <h2 class="text-lg font-bold">Create account</h2>
        <p class="text-sm text-muted-foreground mb-5">Register to raise and track support tickets</p>

        @if (error()) { <div class="pill-overdue w-full justify-start mb-4 py-2">{{ error() }}</div> }

        <form (ngSubmit)="submit()" class="space-y-3">
          <div><label class="label">Full name</label><input class="input" [(ngModel)]="fullName" name="fullName" placeholder="Jane Doe" /></div>
          <div><label class="label">Email</label><input class="input" [(ngModel)]="email" name="email" type="email" placeholder="jane@example.com" /></div>
          <div><label class="label">Username</label><input class="input" [(ngModel)]="username" name="username" placeholder="janedoe" autocomplete="username" /></div>
          <div><label class="label">Password</label><ui-password [(ngModel)]="password" name="password" placeholder="min 6 characters" autocomplete="new-password" /></div>
          <button class="btn-primary w-full" type="submit" [disabled]="loading()">{{ loading() ? 'Creating…' : 'Create account' }}</button>
        </form>

        <p class="text-sm text-muted-foreground mt-4">Already have an account? <a routerLink="/login" class="text-brand font-medium hover:underline">Sign in</a></p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  fullName = ''; email = ''; username = ''; password = '';
  error = signal(''); loading = signal(false);

  submit() {
    if (!this.fullName || !this.email || !this.username || !this.password) { this.error.set('All fields are required'); return; }
    this.loading.set(true); this.error.set('');
    this.auth.register({ fullName: this.fullName, email: this.email, username: this.username, password: this.password })
      .subscribe({
        next: () => { this.toast.success('Welcome! Account created.'); this.router.navigate(['/dashboard']); },
        error: (err) => { this.error.set(err.error?.message ?? 'Registration failed'); this.loading.set(false); }
      });
  }
}

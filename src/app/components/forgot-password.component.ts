import { Component, inject, signal, computed, ViewChildren, QueryList, ElementRef, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PasswordInputComponent } from './ui/password-input.component';

// Forgot-password flow — 3 steps:
//   1) enter email        → backend sends a 6-digit OTP (5 min)
//   2) enter OTP           → verify it's valid (6 paste-able digit boxes)
//   3) new + confirm pw    → reset the password
@Component({
  selector: 'app-forgot-password',
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

        @if (error()) { <div class="pill-overdue w-full justify-start mt-4 mb-5 px-3 py-2.5 leading-relaxed">{{ error() }}</div> }

        <!-- STEP 1 — email -->
        @if (step() === 1) {
          <p class="text-sm text-muted-foreground mb-5">Enter your account email and we'll send you a 6-digit reset code.</p>
          <form (ngSubmit)="sendCode()" class="space-y-3">
            <div>
              <label class="label">Email</label>
              <input class="input" [(ngModel)]="email" name="email" type="email" placeholder="you@example.com" autocomplete="email" />
            </div>
            <button class="btn-primary w-full" type="submit" [disabled]="loading()">{{ loading() ? 'Sending…' : 'Send code' }}</button>
          </form>
        }

        <!-- STEP 2 — OTP -->
        @else if (step() === 2) {
          <p class="text-sm text-muted-foreground mb-1">Enter the 6-digit code sent to</p>
          <p class="text-sm font-medium mb-4">{{ email }}</p>

          <!-- 6 digit boxes — paste the whole code into any box -->
          <div class="flex justify-between gap-2 mb-3" (paste)="onPaste($event)">
            @for (d of digits; track $index) {
              <input #otpBox
                     class="input h-12 w-full text-center text-lg font-semibold tracking-normal px-0"
                     inputmode="numeric" autocomplete="one-time-code" maxlength="1"
                     [value]="digits[$index]"
                     (input)="onInput($index, $event)"
                     (keydown)="onKeydown($index, $event)" />
            }
          </div>

          <div class="flex items-center justify-between text-xs mb-4">
            @if (secondsLeft() > 0) {
              <span class="text-muted-foreground">Code expires in <span class="font-medium text-foreground">{{ mmss() }}</span></span>
            } @else {
              <span class="text-destructive">Code expired</span>
            }
            <button type="button" class="text-brand font-medium hover:underline disabled:opacity-50 disabled:no-underline"
                    [disabled]="loading() || secondsLeft() > 240" (click)="resend()">Resend code</button>
          </div>

          <button class="btn-primary w-full" type="button" [disabled]="loading() || otp().length !== 6" (click)="verify()">
            {{ loading() ? 'Verifying…' : 'Verify code' }}
          </button>
          <button class="btn-ghost w-full mt-2 text-sm" type="button" (click)="backToEmail()">← Use a different email</button>
        }

        <!-- STEP 3 — new password -->
        @else if (step() === 3) {
          <p class="text-sm text-muted-foreground mb-5">Create a new password for your account.</p>
          <form (ngSubmit)="reset()" class="space-y-3">
            <div>
              <label class="label">New password</label>
              <ui-password [(ngModel)]="newPassword" name="newPassword" placeholder="••••••" autocomplete="new-password" />
            </div>
            <div>
              <label class="label">Confirm password</label>
              <ui-password [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="••••••" autocomplete="new-password" />
            </div>
            @if (pwMismatch()) { <p class="field-err">Passwords do not match</p> }
            <button class="btn-primary w-full" type="submit" [disabled]="loading() || !canReset()">
              {{ loading() ? 'Saving…' : 'Reset password' }}
            </button>
          </form>
        }

        <!-- STEP 4 — done -->
        @else {
          <div class="text-center py-2">
            <div class="mx-auto mb-3 grid place-items-center h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h3 class="font-semibold mb-1">Password changed</h3>
            <p class="text-sm text-muted-foreground mb-5">Your password has been reset. You can now sign in with your new password.</p>
            <button class="btn-primary w-full" type="button" (click)="router.navigate(['/login'])">Go to sign in</button>
          </div>
        }

        @if (step() !== 4) {
          <p class="text-sm text-muted-foreground mt-4 text-center">
            Remembered it? <a routerLink="/login" class="text-brand font-medium hover:underline">Back to sign in</a>
          </p>
        }
      </div>
    </div>
  `
})
export class ForgotPasswordComponent implements OnDestroy {
  private auth = inject(AuthService);
  router = inject(Router);

  @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef<HTMLInputElement>>;

  step = signal<1 | 2 | 3 | 4>(1);
  loading = signal(false);
  error = signal('');

  email = '';
  digits = ['', '', '', '', '', ''];
  newPassword = '';
  confirmPassword = '';

  secondsLeft = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  otp = () => this.digits.join('');
  mmss = computed(() => {
    const s = this.secondsLeft();
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  });
  pwMismatch = () => !!this.confirmPassword && this.newPassword !== this.confirmPassword;
  canReset = () => this.newPassword.length >= 6 && this.newPassword === this.confirmPassword;

  // ── Step 1 ──────────────────────────────────────────────────────────────────────
  sendCode() {
    const email = this.email.trim();
    if (!email) { this.error.set('Please enter your email'); return; }
    this.loading.set(true); this.error.set('');
    this.auth.forgotPassword(email).subscribe({
      next: () => { this.email = email; this.loading.set(false); this.goToOtp(); },
      error: (err) => { this.error.set(err.error?.message ?? 'Something went wrong'); this.loading.set(false); }
    });
  }

  private goToOtp() {
    this.resetDigits();
    this.step.set(2);
    this.startCountdown(300);        // 5 minutes
    setTimeout(() => this.focusBox(0));
  }

  // ── Step 2: OTP box handling ──────────────────────────────────────────────────────
  onInput(i: number, e: Event) {
    const el = e.target as HTMLInputElement;
    const v = el.value.replace(/\D/g, '');
    this.digits[i] = v ? v.slice(-1) : '';
    el.value = this.digits[i];
    if (this.digits[i] && i < 5) this.focusBox(i + 1);
  }

  onKeydown(i: number, e: KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (this.digits[i]) { this.digits[i] = ''; (e.target as HTMLInputElement).value = ''; }
      else if (i > 0) { this.focusBox(i - 1); this.digits[i - 1] = ''; this.setBoxValue(i - 1, ''); }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && i > 0) { this.focusBox(i - 1); }
    else if (e.key === 'ArrowRight' && i < 5) { this.focusBox(i + 1); }
  }

  onPaste(e: ClipboardEvent) {
    const text = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    for (let k = 0; k < 6; k++) { this.digits[k] = text[k] ?? ''; this.setBoxValue(k, this.digits[k]); }
    this.focusBox(Math.min(text.length, 5));
  }

  verify() {
    if (this.otp().length !== 6) return;
    this.loading.set(true); this.error.set('');
    this.auth.verifyOtp(this.email, this.otp()).subscribe({
      next: () => { this.loading.set(false); this.stopCountdown(); this.step.set(3); },
      error: (err) => { this.error.set(err.error?.message ?? 'Invalid or expired code'); this.loading.set(false); }
    });
  }

  resend() {
    this.loading.set(true); this.error.set('');
    this.auth.forgotPassword(this.email).subscribe({
      next: () => { this.loading.set(false); this.resetDigits(); this.startCountdown(300); this.focusBox(0); },
      error: (err) => { this.error.set(err.error?.message ?? 'Could not resend code'); this.loading.set(false); }
    });
  }

  backToEmail() { this.stopCountdown(); this.error.set(''); this.step.set(1); }

  // ── Step 3 ──────────────────────────────────────────────────────────────────────
  reset() {
    if (!this.canReset()) { this.error.set('Please enter matching passwords (min 6 characters)'); return; }
    this.loading.set(true); this.error.set('');
    this.auth.resetPassword({
      email: this.email, otp: this.otp(),
      newPassword: this.newPassword, confirmPassword: this.confirmPassword
    }).subscribe({
      next: () => { this.loading.set(false); this.step.set(4); },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message ?? 'Could not reset password';
        this.error.set(msg);
        // OTP expired/invalid → send them back to the code step
        if (/code|expired|invalid/i.test(msg)) { this.step.set(2); }
      }
    });
  }

  // ── helpers ──────────────────────────────────────────────────────────────────────
  private resetDigits() { this.digits = ['', '', '', '', '', '']; this.otpBoxes?.forEach(b => (b.nativeElement.value = '')); }
  private focusBox(i: number) { this.otpBoxes?.get(i)?.nativeElement.focus(); }
  private setBoxValue(i: number, v: string) { const b = this.otpBoxes?.get(i); if (b) b.nativeElement.value = v; }

  private startCountdown(sec: number) {
    this.stopCountdown();
    this.secondsLeft.set(sec);
    this.timer = setInterval(() => {
      const s = this.secondsLeft() - 1;
      this.secondsLeft.set(Math.max(0, s));
      if (s <= 0) this.stopCountdown();
    }, 1000);
  }
  private stopCountdown() { if (this.timer) { clearInterval(this.timer); this.timer = undefined; } }

  ngOnDestroy() { this.stopCountdown(); }
}

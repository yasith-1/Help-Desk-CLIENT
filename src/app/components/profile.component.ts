import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';
import { ToastService } from '../services/toast.service';
import { AvatarComponent } from './ui/avatar.component';
import { Profile } from '../models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, DatePipe, AvatarComponent],
  template: `
    <div class="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in">

      @if (profile(); as p) {
        <!-- ── Avatar + identity ───────────────────────────────── -->
        <div class="card p-6">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div class="relative shrink-0">
              <ui-avatar [name]="p.fullName" [imageUrl]="avatarSrc()" size="lg" />
              <!-- camera overlay button -->
              <button (click)="fileInput.click()" [disabled]="uploading()" title="Change photo"
                class="absolute -bottom-1 -right-1 grid place-items-center h-7 w-7 rounded-full bg-brand text-brand-foreground shadow-md hover:opacity-90 disabled:opacity-60">
                @if (uploading()) {
                  <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 11-6.2-8.5"/></svg>
                } @else {
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                }
              </button>
              <input #fileInput type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden
                     (change)="onFile($event)" />
            </div>

            <div class="text-center sm:text-left min-w-0 flex-1">
              <h2 class="text-xl font-bold truncate">{{ p.fullName }}</h2>
              <p class="text-sm text-muted-foreground">{{ p.email }}</p>
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span class="pill border-border text-muted-foreground">&#64;{{ p.username }}</span>
                <span class="pill border-brand/30 text-brand bg-brand/5">{{ p.role }}</span>
                <span class="pill border-border text-muted-foreground">Joined {{ p.createdAt | date:'mediumDate' }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-3">JPG, PNG, WebP or GIF · max 2MB</p>
            </div>
          </div>
        </div>

        <!-- ── Edit details ────────────────────────────────────── -->
        <div class="card p-6">
          <h3 class="font-semibold mb-1">Personal details</h3>
          <p class="text-sm text-muted-foreground mb-4">Username and role are managed by your administrator.</p>
          <form (ngSubmit)="saveDetails()" class="space-y-4">
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="label" for="fullName">Full name</label>
                <input id="fullName" class="input" [(ngModel)]="fullName" name="fullName" placeholder="Your name" />
              </div>
              <div>
                <label class="label" for="email">Email</label>
                <input id="email" class="input" type="email" [(ngModel)]="email" name="email" placeholder="you@example.com" />
              </div>
            </div>
            <div class="grid sm:grid-cols-2 gap-4 opacity-70">
              <div>
                <label class="label" for="username">Username <span class="text-[10px] uppercase tracking-wide">(read-only)</span></label>
                <input id="username" class="input" [value]="p.username" disabled />
              </div>
              <div>
                <label class="label" for="role">Role <span class="text-[10px] uppercase tracking-wide">(read-only)</span></label>
                <input id="role" class="input" [value]="p.role" disabled />
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button type="button" class="btn-outline btn-sm" (click)="resetDetails()" [disabled]="!detailsDirty() || savingDetails()">Reset</button>
              <button type="submit" class="btn-primary btn-sm" [disabled]="!detailsDirty() || savingDetails()">
                {{ savingDetails() ? 'Saving…' : 'Save changes' }}
              </button>
            </div>
          </form>
        </div>

        <!-- ── Change password ─────────────────────────────────── -->
        <div class="card p-6">
          <h3 class="font-semibold mb-1">Change password</h3>
          <p class="text-sm text-muted-foreground mb-4">Enter your current password to set a new one.</p>
          <form (ngSubmit)="savePassword()" class="space-y-4">
            <div>
              <label class="label" for="curpw">Current password</label>
              <input id="curpw" class="input max-w-sm" type="password" [(ngModel)]="currentPassword" name="currentPassword" autocomplete="current-password" />
            </div>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="label" for="newpw">New password</label>
                <input id="newpw" class="input" type="password" [(ngModel)]="newPassword" name="newPassword" autocomplete="new-password" placeholder="min 6 characters" />
              </div>
              <div>
                <label class="label" for="confpw">Confirm new password</label>
                <input id="confpw" class="input" type="password" [(ngModel)]="confirmPassword" name="confirmPassword" autocomplete="new-password" />
              </div>
            </div>
            <div class="flex justify-end">
              <button type="submit" class="btn-primary btn-sm" [disabled]="savingPassword()">
                {{ savingPassword() ? 'Updating…' : 'Update password' }}
              </button>
            </div>
          </form>
        </div>
      } @else {
        <div class="card p-10 grid place-items-center text-muted-foreground">
          <svg class="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 12a9 9 0 11-6.2-8.5"/></svg>
        </div>
      }
    </div>
  `
})
export class ProfileComponent {
  private api = inject(ProfileService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  profile = signal<Profile | null>(null);

  // editable fields
  fullName = ''; email = '';
  currentPassword = ''; newPassword = ''; confirmPassword = '';

  uploading = signal(false);
  savingDetails = signal(false);
  savingPassword = signal(false);

  avatarSrc = computed(() => this.api.avatarUrl(this.profile()?.avatarUrl));

  detailsDirty = () => {
    const p = this.profile();
    return !!p && (this.fullName.trim() !== p.fullName || this.email.trim() !== p.email);
  };

  constructor() {
    this.api.get().subscribe({
      next: p => this.setProfile(p),
      error: () => this.toast.error('Could not load your profile')
    });
  }

  private setProfile(p: Profile) {
    this.profile.set(p);
    this.fullName = p.fullName;
    this.email = p.email;
  }

  resetDetails() {
    const p = this.profile();
    if (p) { this.fullName = p.fullName; this.email = p.email; }
  }

  saveDetails() {
    const fullName = this.fullName.trim(), email = this.email.trim();
    if (!fullName || !email) { this.toast.error('Full name and email are required'); return; }
    this.savingDetails.set(true);
    this.api.update({ fullName, email }).subscribe({
      next: p => {
        this.setProfile(p);
        this.auth.updateProfile(p.fullName, p.avatarUrl);   // header refresh
        this.savingDetails.set(false);
        this.toast.success('Profile updated');
      },
      error: err => { this.savingDetails.set(false); this.toast.error(err.error?.message ?? 'Update failed'); }
    });
  }

  onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { this.toast.error('Image must be 2MB or smaller'); input.value = ''; return; }

    this.uploading.set(true);
    this.api.uploadAvatar(file).subscribe({
      next: p => {
        this.setProfile(p);
        this.auth.updateProfile(p.fullName, p.avatarUrl);   // header avatar refresh
        this.uploading.set(false);
        this.toast.success('Profile photo updated');
      },
      error: err => { this.uploading.set(false); this.toast.error(err.error?.message ?? 'Upload failed'); }
    });
    input.value = '';   // same file ආයෙත් තෝරන්න පුළුවන් වෙන්න
  }

  savePassword() {
    if (!this.currentPassword || !this.newPassword) { this.toast.error('Fill in both password fields'); return; }
    if (this.newPassword.length < 6) { this.toast.error('New password must be at least 6 characters'); return; }
    if (this.newPassword !== this.confirmPassword) { this.toast.error('New passwords do not match'); return; }

    this.savingPassword.set(true);
    this.api.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.currentPassword = this.newPassword = this.confirmPassword = '';
        this.toast.success('Password updated');
      },
      error: err => { this.savingPassword.set(false); this.toast.error(err.error?.message ?? 'Password change failed'); }
    });
  }
}

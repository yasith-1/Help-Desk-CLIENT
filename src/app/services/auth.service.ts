import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, Role } from '../models/models';

// Authentication + permission state. token + permissions localStorage එකේ.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  userId = signal<number>(Number(localStorage.getItem('userId') ?? 0));
  fullName = signal<string>(localStorage.getItem('fullName') ?? '');
  username = signal<string>(localStorage.getItem('username') ?? '');
  role = signal<Role>(localStorage.getItem('role') ?? '');
  avatarUrl = signal<string | null>(localStorage.getItem('avatarUrl') || null);
  permissions = signal<string[]>(this.loadPerms());

  // Permission-driven — custom roles support (hard-coded role names නෑ)
  has = (perm: string) => this.permissions().includes(perm);
  isStaff = computed(() => this.permissions().includes('tickets.viewAll'));
  isAdmin = computed(() =>
    this.permissions().includes('users.manage') ||
    this.permissions().includes('roles.manage') ||
    this.permissions().includes('categories.manage'));

  private loadPerms(): string[] {
    try { return JSON.parse(localStorage.getItem('permissions') ?? '[]'); } catch { return []; }
  }

  login(c: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, c).pipe(tap(r => this.saveSession(r)));
  }
  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/register`, req).pipe(tap(r => this.saveSession(r)));
  }

  // ── Forgot password (OTP) — pre-auth, no session saved ──────────────────────────
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/auth/forgot-password`, { email });
  }
  verifyOtp(email: string, otp: string): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(`${this.api}/auth/verify-otp`, { email, otp });
  }
  resetPassword(payload: { email: string; otp: string; newPassword: string; confirmPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/auth/reset-password`, payload);
  }

  // Role/permission වෙනස් වුණාම UI refresh කරන්න (re-login නැතුව)
  refreshPermissions() {
    if (!this.isLoggedIn()) return;
    this.http.get<string[]>(`${this.api}/auth/permissions`).subscribe({
      next: p => { this.permissions.set(p); localStorage.setItem('permissions', JSON.stringify(p)); },
      error: () => {}
    });
  }

  private saveSession(r: AuthResponse) {
    localStorage.setItem('token', r.token);
    localStorage.setItem('userId', String(r.userId));
    localStorage.setItem('fullName', r.fullName);
    localStorage.setItem('username', r.username);
    localStorage.setItem('role', r.role);
    if (r.avatarUrl) localStorage.setItem('avatarUrl', r.avatarUrl); else localStorage.removeItem('avatarUrl');
    localStorage.setItem('permissions', JSON.stringify(r.permissions ?? []));
    this.userId.set(r.userId); this.fullName.set(r.fullName);
    this.username.set(r.username); this.role.set(r.role);
    this.avatarUrl.set(r.avatarUrl ?? null); this.permissions.set(r.permissions ?? []);
  }

  // Profile page එකේ name/avatar වෙනස් වුණාම header එකත් update කරන්න (re-login නැතුව)
  updateProfile(fullName: string, avatarUrl: string | null) {
    this.fullName.set(fullName);
    localStorage.setItem('fullName', fullName);
    this.avatarUrl.set(avatarUrl);
    if (avatarUrl) localStorage.setItem('avatarUrl', avatarUrl); else localStorage.removeItem('avatarUrl');
  }

  logout() {
    localStorage.clear();
    this.userId.set(0); this.fullName.set(''); this.username.set(''); this.role.set('');
    this.avatarUrl.set(null); this.permissions.set([]);
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  isLoggedIn(): boolean { return !!this.getToken(); }

  initials(): string {
    const n = this.fullName() || this.username();
    return n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?';
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { AvatarComponent } from './ui/avatar.component';
import { User, Role, CreateUserRequest } from '../models/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, DatePipe, AvatarComponent],
  template: `
    <div class="page-wrap">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-bold">User Management</h2>
          <p class="text-xs text-muted-foreground">Create accounts, change roles, activate or deactivate</p>
        </div>
        <button class="btn-primary btn-sm" (click)="showForm.set(!showForm())">{{ showForm() ? 'Close' : '+ New user' }}</button>
      </div>

      @if (showForm()) {
        <div class="card p-5 mb-4">
          <h3 class="section-title mb-3">Create account</h3>
          @if (error()) { <div class="pill-overdue w-full justify-start mb-3 py-2">{{ error() }}</div> }
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div><label class="label">Full name</label><input class="input" [(ngModel)]="f.fullName" /></div>
            <div><label class="label">Email</label><input class="input" [(ngModel)]="f.email" type="email" /></div>
            <div><label class="label">Role</label><select class="select" [(ngModel)]="f.role">@for (r of roles(); track r) { <option [value]="r">{{ r }}</option> }</select></div>
            <div><label class="label">Username</label><input class="input" [(ngModel)]="f.username" /></div>
            <div><label class="label">Password</label><input class="input" [(ngModel)]="f.password" type="password" /></div>
          </div>
          <button class="btn-primary btn-sm mt-4" (click)="create()" [disabled]="saving()">{{ saving() ? 'Creating…' : 'Create user' }}</button>
        </div>
      }

      @if (loading()) { <div class="spinner"></div> }
      @else {
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="tbl">
              <thead><tr><th>User</th><th>Username</th><th>Role</th><th>Status</th><th>Joined</th><th class="text-right">Action</th></tr></thead>
              <tbody>
                @for (u of users(); track u.id) {
                  <tr>
                    <td><div class="flex items-center gap-2.5"><ui-avatar [name]="u.fullName" size="sm" /><div><div class="font-medium">{{ u.fullName }}</div><div class="text-xs text-muted-foreground">{{ u.email }}</div></div></div></td>
                    <td class="text-xs">{{ u.username }}</td>
                    <td><select class="select w-auto h-8 text-xs" [ngModel]="u.role" (ngModelChange)="changeRole(u, $event)">@for (r of roles(); track r) { <option [value]="r">{{ r }}</option> }</select></td>
                    <td>@if (u.isActive) { <span class="pill-ok">Active</span> } @else { <span class="st-Closed">Inactive</span> }</td>
                    <td class="text-xs text-muted-foreground">{{ u.createdAt | date:'MMM d, y' }}</td>
                    <td class="text-right"><button class="btn-outline btn-sm" (click)="toggle(u)">{{ u.isActive ? 'Deactivate' : 'Activate' }}</button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminUsersComponent {
  private api = inject(UserService);
  private roleApi = inject(RoleService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  roles = signal<string[]>([]);
  users = signal<User[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  error = signal('');
  f: CreateUserRequest = { fullName: '', email: '', username: '', password: '', role: 'Agent' };

  constructor() {
    this.roleApi.names().subscribe(ns => this.roles.set(ns));
    this.load();
  }

  load() { this.loading.set(true); this.api.list().subscribe({ next: u => { this.users.set(u); this.loading.set(false); }, error: () => this.loading.set(false) }); }

  create() {
    if (!this.f.fullName || !this.f.email || !this.f.username || !this.f.password) { this.error.set('All fields required'); return; }
    this.saving.set(true); this.error.set('');
    this.api.create(this.f).subscribe({
      next: () => { this.toast.success('User created'); this.saving.set(false); this.showForm.set(false); this.f = { fullName: '', email: '', username: '', password: '', role: 'Agent' }; this.load(); },
      error: (err) => { this.error.set(err.error?.message ?? 'Failed'); this.saving.set(false); }
    });
  }
  changeRole(u: User, role: Role) {
    this.api.changeRole(u.id, role).subscribe({ next: () => this.toast.success(`${u.fullName} → ${role}`), error: (err) => { this.toast.error(err.error?.message ?? 'Failed'); this.load(); } });
  }
  toggle(u: User) {
    this.api.setActive(u.id, !u.isActive).subscribe({ next: () => { this.toast.success('Updated'); this.load(); }, error: (err) => this.toast.error(err.error?.message ?? 'Failed') });
  }
}

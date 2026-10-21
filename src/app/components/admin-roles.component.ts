import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../services/role.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ConfirmService } from '../services/confirm.service';
import { RoleDef, PermissionItem } from '../models/models';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-wrap">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-bold">Roles &amp; Permissions</h2>
          <p class="text-xs text-muted-foreground">Create roles and control exactly what each one can do</p>
        </div>
        <button class="btn-primary btn-sm" (click)="toggleNew()">{{ showNew() ? 'Close' : '+ New role' }}</button>
      </div>

      <!-- New role -->
      @if (showNew()) {
        <div class="card p-5 mb-5">
          <h3 class="section-title mb-3">Create role</h3>
          @if (error()) { <div class="pill-overdue w-full justify-start mb-3 py-2">{{ error() }}</div> }
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div><label class="label">Role name</label><input class="input" [(ngModel)]="nName" placeholder="e.g. Supervisor" /></div>
            <div><label class="label">Description</label><input class="input" [(ngModel)]="nDesc" placeholder="What this role is for" /></div>
          </div>
          <label class="label">Permissions</label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-1">
            @for (g of groups(); track g) {
              <div>
                <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{{ g }}</div>
                @for (p of permsIn(g); track p.key) {
                  <label class="flex items-center gap-2 py-1 text-sm cursor-pointer">
                    <input type="checkbox" class="w-4 h-4 accent-brand" [checked]="nPerms.has(p.key)" (change)="toggleNew2(p.key)" />
                    {{ p.label }}
                  </label>
                }
              </div>
            }
          </div>
          <button class="btn-primary btn-sm mt-4" (click)="create()" [disabled]="saving()">{{ saving() ? 'Creating…' : 'Create role' }}</button>
        </div>
      }

      @if (loading()) { <div class="spinner"></div> }

      <!-- Role cards -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        @for (r of roles(); track r.id) {
          <div class="card p-5">
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold">{{ r.name }}</h3>
                  @if (r.isSystem) { <span class="badge-outline">system</span> }
                  <span class="badge-outline">{{ r.userCount }} user{{ r.userCount === 1 ? '' : 's' }}</span>
                </div>
                <p class="text-xs text-muted-foreground mt-0.5">{{ r.description || '—' }}</p>
              </div>
              @if (!r.isSystem) {
                <button class="btn-outline-danger btn-sm" (click)="remove(r)">Delete</button>
              }
            </div>

            @if (r.name === 'Admin') {
              <p class="text-xs text-muted-foreground italic">Admin always has every permission (locked).</p>
            }

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              @for (g of groups(); track g) {
                <div>
                  <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{{ g }}</div>
                  @for (p of permsIn(g); track p.key) {
                    <label class="flex items-center gap-2 py-1 text-sm" [class.opacity-60]="r.name==='Admin'"
                           [class.cursor-pointer]="r.name!=='Admin'">
                      <input type="checkbox" class="w-4 h-4 accent-brand"
                             [checked]="isChecked(r.id, p.key)" [disabled]="r.name==='Admin'"
                             (change)="toggle(r.id, p.key)" />
                      {{ p.label }}
                    </label>
                  }
                </div>
              }
            </div>

            @if (r.name !== 'Admin') {
              <div class="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                <button class="btn-primary btn-sm" (click)="save(r)" [disabled]="!dirty(r.id)">Save changes</button>
                @if (dirty(r.id)) { <span class="text-xs text-muted-foreground">unsaved changes</span> }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class AdminRolesComponent {
  private api = inject(RoleService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private confirm = inject(ConfirmService);

  roles = signal<RoleDef[]>([]);
  catalog = signal<PermissionItem[]>([]);
  loading = signal(true);
  showNew = signal(false);
  saving = signal(false);
  error = signal('');

  // local editable permission sets (roleId → Set)
  private draft: Record<number, Set<string>> = {};
  // new role form
  nName = ''; nDesc = ''; nPerms = new Set<string>();

  groups = computed(() => [...new Set(this.catalog().map(c => c.group))]);
  permsIn(group: string) { return this.catalog().filter(c => c.group === group); }

  constructor() {
    this.api.catalog().subscribe(c => this.catalog.set(c));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.list().subscribe({
      next: rs => {
        this.roles.set(rs);
        this.draft = {};
        for (const r of rs) this.draft[r.id] = new Set(r.permissions);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isChecked(roleId: number, key: string) { return this.draft[roleId]?.has(key) ?? false; }
  toggle(roleId: number, key: string) {
    const set = this.draft[roleId]; if (!set) return;
    set.has(key) ? set.delete(key) : set.add(key);
  }
  dirty(roleId: number) {
    const r = this.roles().find(x => x.id === roleId); if (!r) return false;
    const a = this.draft[roleId] ?? new Set();
    return a.size !== r.permissions.length || r.permissions.some(p => !a.has(p));
  }

  save(r: RoleDef) {
    this.api.updatePermissions(r.id, [...(this.draft[r.id] ?? [])]).subscribe({
      next: () => { this.toast.success(`${r.name} permissions saved`); this.auth.refreshPermissions(); this.load(); },
      error: (err) => this.toast.error(err.error?.message ?? 'Failed')
    });
  }

  // new role form
  toggleNew() { this.showNew.set(!this.showNew()); this.error.set(''); }
  toggleNew2(key: string) { this.nPerms.has(key) ? this.nPerms.delete(key) : this.nPerms.add(key); }
  create() {
    if (!this.nName.trim()) { this.error.set('Role name is required'); return; }
    this.saving.set(true); this.error.set('');
    this.api.create({ name: this.nName.trim(), description: this.nDesc, permissions: [...this.nPerms] }).subscribe({
      next: () => { this.toast.success('Role created'); this.saving.set(false); this.showNew.set(false);
                    this.nName = ''; this.nDesc = ''; this.nPerms = new Set(); this.load(); },
      error: (err) => { this.error.set(err.error?.message ?? 'Failed'); this.saving.set(false); }
    });
  }

  async remove(r: RoleDef) {
    const ok = await this.confirm.ask({
      title: 'Delete role',
      message: `Delete the "${r.name}" role? Soft delete — recoverable.`,
      confirmText: 'Delete', danger: true
    });
    if (!ok) return;
    this.api.delete(r.id).subscribe({
      next: () => { this.toast.success('Role deleted'); this.load(); },
      error: (err) => this.toast.error(err.error?.message ?? 'Cannot delete')
    });
  }
}

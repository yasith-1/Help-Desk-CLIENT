import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../services/category.service';
import { ToastService } from '../services/toast.service';
import { ConfirmService } from '../services/confirm.service';
import { Category, CategoryRequest, PRIORITIES } from '../models/models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-wrap">
      <h2 class="text-lg font-bold mb-4">Categories</h2>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2">
          @if (loading()) { <div class="spinner"></div> }
          @else {
            <div class="card overflow-hidden">
              <div class="overflow-x-auto">
                <table class="tbl">
                  <thead><tr><th>Name</th><th>Default priority</th><th>SLA</th><th>Tickets</th><th class="text-right">Action</th></tr></thead>
                  <tbody>
                    @for (c of categories(); track c.id) {
                      <tr>
                        <td><div class="font-medium">{{ c.name }}</div><div class="text-xs text-muted-foreground">{{ c.description }}</div></td>
                        <td><span [class]="'pr-'+c.defaultPriority">{{ c.defaultPriority }}</span></td>
                        <td class="text-xs">{{ c.slaHours }}h</td>
                        <td class="text-xs">{{ c.ticketCount }}</td>
                        <td class="text-right whitespace-nowrap">
                          <div class="flex justify-end gap-2">
                            <button class="btn-outline btn-sm" (click)="edit(c)">Edit</button>
                            <button class="btn-outline-danger btn-sm" (click)="remove(c)">Delete</button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>

        <div class="card p-5 self-start">
          <h3 class="section-title mb-3">{{ editId() ? 'Edit category' : 'New category' }}</h3>
          @if (error()) { <div class="pill-overdue w-full justify-start mb-3 py-2">{{ error() }}</div> }
          <div class="space-y-3">
            <div><label class="label">Name</label><input class="input" [(ngModel)]="f.name" placeholder="e.g. IT & Hardware" /></div>
            <div><label class="label">Description</label><input class="input" [(ngModel)]="f.description" placeholder="Short description" /></div>
            <div><label class="label">Default priority</label><select class="select" [(ngModel)]="f.defaultPriority">@for (p of priorities; track p) { <option [value]="p">{{ p }}</option> }</select></div>
            <div><label class="label">SLA hours</label><input class="input" [(ngModel)]="f.slaHours" type="number" min="1" /></div>
          </div>
          <div class="flex items-center gap-2 mt-4">
            <button class="btn-primary btn-sm" (click)="save()" [disabled]="saving()">{{ editId() ? 'Save' : 'Create' }}</button>
            @if (editId()) { <button class="btn-ghost btn-sm" (click)="reset()">Cancel</button> }
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminCategoriesComponent {
  private api = inject(CategoryService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  priorities = PRIORITIES;
  categories = signal<Category[]>([]);
  loading = signal(true);
  saving = signal(false);
  editId = signal(0);
  error = signal('');
  f: CategoryRequest = { name: '', description: '', defaultPriority: 'Medium', slaHours: 24 };

  constructor() { this.load(); }
  load() { this.loading.set(true); this.api.list().subscribe({ next: c => { this.categories.set(c); this.loading.set(false); }, error: () => this.loading.set(false) }); }

  edit(c: Category) { this.editId.set(c.id); this.f = { name: c.name, description: c.description, defaultPriority: c.defaultPriority, slaHours: c.slaHours }; }
  reset() { this.editId.set(0); this.error.set(''); this.f = { name: '', description: '', defaultPriority: 'Medium', slaHours: 24 }; }

  save() {
    if (!this.f.name) { this.error.set('Name is required'); return; }
    this.saving.set(true); this.error.set('');
    const op = this.editId() ? this.api.update(this.editId(), this.f) : this.api.create(this.f);
    op.subscribe({
      next: () => { this.toast.success('Saved'); this.saving.set(false); this.reset(); this.load(); },
      error: (err) => { this.error.set(err.error?.message ?? 'Failed'); this.saving.set(false); }
    });
  }
  async remove(c: Category) {
    const ok = await this.confirm.ask({
      title: 'Delete category',
      message: `Delete "${c.name}"? It will be hidden from new tickets (existing tickets keep it). Soft delete — recoverable.`,
      confirmText: 'Delete', danger: true
    });
    if (!ok) return;
    this.api.delete(c.id).subscribe({ next: () => { this.toast.success('Category deleted'); this.load(); }, error: (err) => this.toast.error(err.error?.message ?? 'Cannot delete') });
  }
}

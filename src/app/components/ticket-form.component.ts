import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TicketService } from '../services/ticket.service';
import { CategoryService } from '../services/category.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Category, PRIORITIES, TicketPriority } from '../models/models';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-wrap">
      <h2 class="text-lg font-bold mb-4">{{ editId ? 'Edit ticket' : 'Raise a new ticket' }}</h2>

      @if (error()) { <div class="pill-overdue w-full justify-start mb-4 py-2">{{ error() }}</div> }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- Form -->
        <div class="card p-6 lg:col-span-2">
          <form (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="label">Title *</label>
              <input class="input" [(ngModel)]="title" name="title" placeholder="Short summary of the issue" />
            </div>
            <div>
              <label class="label">Description *</label>
              <textarea class="textarea min-h-[160px]" [(ngModel)]="description" name="description" placeholder="Describe the problem in detail…"></textarea>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="label">Category *</label>
                <select class="select" [(ngModel)]="categoryId" name="categoryId">
                  <option [ngValue]="0" disabled>Select a category</option>
                  @for (c of categories(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
                </select>
              </div>
              <div>
                <label class="label">Priority {{ auth.isStaff() ? '' : '(suggested)' }}</label>
                <select class="select" [(ngModel)]="priority" name="priority">
                  @for (p of priorities; track p) { <option [value]="p">{{ p }}</option> }
                </select>
              </div>
            </div>
            <div class="flex items-center gap-2 pt-2">
              <button class="btn-primary" type="submit" [disabled]="loading()">{{ loading() ? 'Saving…' : (editId ? 'Save changes' : 'Submit ticket') }}</button>
              <a class="btn-ghost" routerLink="/tickets">Cancel</a>
            </div>
          </form>
        </div>

        <!-- Tips panel -->
        <div class="lg:col-span-1 space-y-5">
          <div class="card p-5">
            <h3 class="section-title mb-3">💡 Tips for a great ticket</h3>
            <ul class="space-y-2.5 text-sm text-muted-foreground">
              <li class="flex gap-2"><span class="text-brand">•</span> Use a clear, specific title.</li>
              <li class="flex gap-2"><span class="text-brand">•</span> Describe what happened, what you expected, and any steps to reproduce.</li>
              <li class="flex gap-2"><span class="text-brand">•</span> Pick the right category so it reaches the right team.</li>
              <li class="flex gap-2"><span class="text-brand">•</span> Set priority by real impact — reserve <b>Urgent</b> for blocking issues.</li>
            </ul>
          </div>
          <div class="card p-5">
            <h3 class="section-title mb-2">What happens next?</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              Your ticket gets a number and an SLA due time based on its category. An agent reviews it, may ask follow-up questions, and updates the status until it's resolved.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TicketFormComponent {
  private api = inject(TicketService);
  private catApi = inject(CategoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  priorities = PRIORITIES;
  title = ''; description = ''; categoryId = 0; priority: TicketPriority = 'Medium';
  categories = signal<Category[]>([]);
  error = signal(''); loading = signal(false);
  editId = 0;

  constructor() {
    this.catApi.list().subscribe(c => {
      this.categories.set(c);
      if (!this.editId && c.length && this.categoryId === 0) this.categoryId = c[0].id;
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.api.get(this.editId).subscribe(t => {
        this.title = t.title; this.description = t.description; this.categoryId = t.categoryId; this.priority = t.priority;
      });
    }
  }

  submit() {
    if (!this.title || !this.description || !this.categoryId) { this.error.set('Title, description and category are required'); return; }
    this.loading.set(true); this.error.set('');
    const done = (id: number, msg: string) => { this.toast.success(msg); this.router.navigate(['/tickets', id]); };
    const fail = (err: any) => { this.error.set(err.error?.message ?? 'Save failed'); this.loading.set(false); };
    if (this.editId) {
      this.api.update(this.editId, { title: this.title, description: this.description, categoryId: this.categoryId, priority: this.priority })
        .subscribe({ next: t => done(t.id, 'Ticket updated'), error: fail });
    } else {
      this.api.create({ title: this.title, description: this.description, categoryId: this.categoryId, priority: this.priority })
        .subscribe({ next: t => done(t.id, 'Ticket submitted'), error: fail });
    }
  }
}

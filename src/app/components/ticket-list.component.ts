import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TicketService, TicketQuery } from '../services/ticket.service';
import { CategoryService } from '../services/category.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { AvatarComponent } from './ui/avatar.component';
import {
  TicketListItem, Paged, Category, AgentOption, STATUSES, PRIORITIES, TicketStatus
} from '../models/models';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [FormsModule, DatePipe, AvatarComponent],
  template: `
    <div class="page-wrap">
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <input class="input w-48" [(ngModel)]="q.search" (keyup.enter)="reload(1)" placeholder="Search…" />
        <select class="select w-auto" [(ngModel)]="q.status" (change)="reload(1)">
          <option value="">All status</option>
          @for (s of statuses; track s) { <option [value]="s">{{ pretty(s) }}</option> }
        </select>
        <select class="select w-auto" [(ngModel)]="q.priority" (change)="reload(1)">
          <option value="">All priority</option>
          @for (p of priorities; track p) { <option [value]="p">{{ p }}</option> }
        </select>
        <select class="select w-auto" [(ngModel)]="q.categoryId" (change)="reload(1)">
          <option [ngValue]="undefined">All categories</option>
          @for (c of categories(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
        </select>
        @if (auth.has('tickets.assign')) {
          <select class="select w-auto" [(ngModel)]="q.assignedToId" (change)="reload(1)">
            <option [ngValue]="undefined">Any assignee</option>
            <option [ngValue]="-1">Unassigned</option>
            @for (a of agents(); track a.id) { <option [ngValue]="a.id">{{ a.fullName }}</option> }
          </select>
        }
        <select class="select w-auto" [(ngModel)]="q.sort" (change)="reload(1)">
          <option value="newest">Newest</option><option value="oldest">Oldest</option>
          <option value="priority">Priority</option><option value="due">Due date</option>
        </select>

        <div class="ml-auto flex items-center gap-2">
          <div class="seg">
            <button [class.active]="view()==='list'" (click)="setView('list')">☰ List</button>
            <button [class.active]="view()==='kanban'" (click)="setView('kanban')">▦ Board</button>
          </div>
          <button class="btn-primary btn-sm" (click)="router.navigate(['/tickets/new'])">+ New</button>
        </div>
      </div>

      @if (loading()) { <div class="spinner"></div> }

      <!-- LIST -->
      @else if (view() === 'list') {
        @if (page(); as pg) {
          @if (pg.items.length === 0) { <div class="card p-10 text-center text-muted-foreground text-sm">No tickets match your filters.</div> }
          @else {
            <div class="card overflow-hidden">
              <div class="overflow-x-auto">
                <table class="tbl rowhover">
                  <thead><tr>
                    <th>#</th><th>Title</th><th>Status</th><th>Priority</th><th>Category</th>
                    <th>Requester</th><th>Assignee</th><th>Due</th>
                  </tr></thead>
                  <tbody>
                    @for (t of pg.items; track t.id) {
                      <tr (click)="open(t.id)">
                        <td class="text-xs text-muted-foreground">{{ t.ticketNumber }}</td>
                        <td class="font-medium max-w-[260px] truncate">{{ t.title }}</td>
                        <td><span [class]="'st-'+t.status">{{ pretty(t.status) }}</span></td>
                        <td><span [class]="'pr-'+t.priority">{{ t.priority }}</span></td>
                        <td class="text-xs text-muted-foreground">{{ t.categoryName }}</td>
                        <td><div class="flex items-center gap-2"><ui-avatar [name]="t.createdByName" size="sm" /><span class="text-xs hidden lg:inline">{{ t.createdByName }}</span></div></td>
                        <td class="text-xs">{{ t.assignedToName ?? '—' }}</td>
                        <td class="text-xs">
                          @if (t.isOverdue) { <span class="pill-overdue">Overdue</span> }
                          @else { <span class="text-muted-foreground">{{ t.dueAt | date:'MMM d' }}</span> }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
            <div class="flex items-center justify-center gap-3 mt-4 text-sm">
              <button class="btn-outline btn-sm" [disabled]="pg.page<=1" (click)="reload(pg.page-1)">‹ Prev</button>
              <span class="text-muted-foreground text-xs">Page {{ pg.page }} / {{ pg.totalPages || 1 }} · {{ pg.total }} tickets</span>
              <button class="btn-outline btn-sm" [disabled]="pg.page>=pg.totalPages" (click)="reload(pg.page+1)">Next ›</button>
            </div>
          }
        }
      }

      <!-- KANBAN -->
      @else {
        <div class="flex gap-4 overflow-x-auto pb-2">
          @for (col of statuses; track col) {
            <div class="w-72 shrink-0 rounded-xl border bg-muted/30 flex flex-col max-h-[72vh]"
                 [class.ring-2]="dropTarget()===col" [class.ring-brand]="dropTarget()===col"
                 (dragover)="onDragOver($event, col)" (dragleave)="dropTarget.set('')" (drop)="onDrop(col)">
              <div class="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <span class="text-sm font-semibold">{{ pretty(col) }}</span>
                <span class="text-xs text-muted-foreground">{{ (grouped()[col] ?? []).length }}</span>
              </div>
              <div class="p-2 overflow-y-auto flex flex-col gap-2">
                @for (t of grouped()[col] ?? []; track t.id) {
                  <div class="card p-3 cursor-pointer hover:border-brand transition-colors" [attr.draggable]="auth.has('tickets.changeStatus')"
                       (dragstart)="dragId.set(t.id)" (dragend)="dragId.set(0)" (click)="open(t.id)">
                    <div class="flex items-center justify-between mb-1.5">
                      <span [class]="'pr-'+t.priority">{{ t.priority }}</span>
                      @if (t.isOverdue) { <span class="pill-overdue">Overdue</span> }
                    </div>
                    <div class="text-sm font-medium leading-snug">{{ t.title }}</div>
                    <div class="flex items-center gap-2 mt-2">
                      <ui-avatar [name]="t.assignedToName ?? t.createdByName" size="sm" />
                      <span class="text-xs text-muted-foreground">{{ t.ticketNumber }} · {{ t.assignedToName ?? 'Unassigned' }}</span>
                    </div>
                  </div>
                }
                @if ((grouped()[col] ?? []).length === 0) { <div class="text-xs text-muted-foreground px-2 py-3 text-center">—</div> }
              </div>
            </div>
          }
        </div>
        @if (auth.has('tickets.changeStatus')) { <p class="text-xs text-muted-foreground mt-3">Tip: drag a card to another column to change its status.</p> }
      }
    </div>
  `
})
export class TicketListComponent implements OnInit {
  private api = inject(TicketService);
  private catApi = inject(CategoryService);
  private userApi = inject(UserService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  auth = inject(AuthService);
  router = inject(Router);

  statuses = STATUSES; priorities = PRIORITIES;
  q: TicketQuery = { status: '', priority: '', sort: 'newest', page: 1, pageSize: 10 };

  page = signal<Paged<TicketListItem> | null>(null);
  categories = signal<Category[]>([]);
  agents = signal<AgentOption[]>([]);
  loading = signal(true);
  view = signal<'list' | 'kanban'>((localStorage.getItem('ticketView') as any) ?? 'list');

  grouped = signal<Record<string, TicketListItem[] | undefined>>({});
  dragId = signal(0);
  dropTarget = signal('');

  ngOnInit() {
    this.catApi.list().subscribe(c => this.categories.set(c));
    if (this.auth.has('tickets.assign')) this.userApi.agents().subscribe(a => this.agents.set(a));
    // read search/assignee from query params (topbar search, bell)
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('search')) this.q.search = qp.get('search')!;
    if (qp.get('assignedToId')) this.q.assignedToId = +qp.get('assignedToId')!;
    this.reload(1);
  }

  setView(v: 'list' | 'kanban') { this.view.set(v); localStorage.setItem('ticketView', v); this.reload(1); }

  reload(page: number) {
    this.loading.set(true);
    this.q.page = page;
    if (this.view() === 'kanban') {
      this.api.list({ ...this.q, page: 1, pageSize: 200, status: '', sort: 'priority' }).subscribe({
        next: pg => { this.regroup(pg.items); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    } else {
      this.api.list(this.q).subscribe({
        next: pg => { this.page.set(pg); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    }
  }

  private regroup(items: TicketListItem[]) {
    const g: Record<string, TicketListItem[]> = {};
    for (const s of this.statuses) g[s] = [];
    for (const t of items) (g[t.status] ??= []).push(t);
    this.grouped.set(g);
  }

  onDragOver(e: DragEvent, col: string) { if (!this.auth.has('tickets.changeStatus')) return; e.preventDefault(); this.dropTarget.set(col); }
  onDrop(col: TicketStatus) {
    this.dropTarget.set('');
    const id = this.dragId(); if (!id || !this.auth.has('tickets.changeStatus')) return;
    const current = Object.values(this.grouped()).flat().find(t => t?.id === id);
    if (!current || current.status === col) return;
    this.api.changeStatus(id, col).subscribe({
      next: () => { this.toast.success(`Moved to ${this.pretty(col)}`); this.reload(1); },
      error: (err) => this.toast.error(err.error?.message ?? 'Could not move ticket')
    });
  }

  open(id: number) { this.router.navigate(['/tickets', id]); }
  pretty(s: string) { return s.replace(/([A-Z])/g, ' $1').trim(); }
}

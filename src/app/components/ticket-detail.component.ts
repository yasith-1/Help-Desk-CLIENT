import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { TicketService } from '../services/ticket.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { AvatarComponent } from './ui/avatar.component';
import { TicketDetail, AgentOption, STATUSES, PRIORITIES, TicketStatus, TicketPriority } from '../models/models';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [FormsModule, DatePipe, NgClass, RouterLink, AvatarComponent],
  template: `
    <div class="page-wrap">
      @if (loading()) { <div class="spinner"></div> }
      @if (ticket(); as t) {
        <div class="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <span class="text-xs text-muted-foreground font-mono">{{ t.ticketNumber }}</span>
            <h2 class="text-xl font-bold leading-tight">{{ t.title }}</h2>
          </div>
          <div class="flex items-center gap-2">
            @if (canEdit()) { <a class="btn-outline btn-sm" [routerLink]="['/tickets', t.id, 'edit']">✏️ Edit</a> }
            <a class="btn-ghost btn-sm" routerLink="/tickets">← Back</a>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- LEFT -->
          <div class="lg:col-span-2 space-y-5">
            <div class="card p-5">
              <div class="flex items-center gap-2 mb-3">
                <span [class]="'st-'+t.status">{{ pretty(t.status) }}</span>
                <span [class]="'pr-'+t.priority">{{ t.priority }}</span>
                @if (t.isOverdue) { <span class="pill-overdue">Overdue</span> }
              </div>
              <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ t.description }}</p>
              <div class="flex items-center gap-2 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                <ui-avatar [name]="t.createdByName" size="sm" />
                Raised by {{ t.createdByName }} · {{ t.createdAt | date:'MMM d, y, HH:mm' }}
              </div>
            </div>

            <div>
              <h3 class="section-title mb-3">Conversation ({{ t.comments.length }})</h3>
              @if (t.comments.length === 0) { <div class="card p-6 text-center text-sm text-muted-foreground">No messages yet.</div> }
              <div class="space-y-3">
                @for (c of t.comments; track c.id) {
                  <div class="card p-4" [ngClass]="c.isInternal ? 'bg-amber-500/5 border-amber-500/40' : ''">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <ui-avatar [name]="c.authorName" size="sm" />
                        <span class="text-sm font-medium">{{ c.authorName }}</span>
                        <span class="badge-outline">{{ c.authorRole }}</span>
                      </div>
                      <span class="text-xs text-muted-foreground">
                        @if (c.isInternal) { 🔒 internal · } {{ c.createdAt | date:'MMM d, HH:mm' }}
                      </span>
                    </div>
                    <div class="text-sm whitespace-pre-wrap leading-relaxed pl-9">{{ c.body }}</div>
                  </div>
                }
              </div>

              <!-- Composer -->
              <div class="card p-4 mt-3">
                <textarea class="textarea min-h-[80px]" [(ngModel)]="reply" placeholder="Write a reply…"></textarea>
                <div class="flex items-center justify-between mt-3">
                  @if (auth.has('tickets.commentInternal')) {
                    <label class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <input type="checkbox" class="w-4 h-4 accent-amber-500" [(ngModel)]="internal" /> 🔒 Internal note
                    </label>
                  } @else { <span></span> }
                  <button class="btn-primary btn-sm" [disabled]="posting() || !reply.trim()" (click)="send(t.id)">{{ posting() ? 'Sending…' : 'Send' }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT -->
          <div class="space-y-5">
            <div class="card p-5">
              <h3 class="section-title mb-3">Properties</h3>
              <div class="space-y-3 text-sm">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-muted-foreground text-xs">Status</span>
                  @if (auth.has('tickets.changeStatus')) {
                    <select class="select w-auto h-8 text-xs" [ngModel]="t.status" (ngModelChange)="setStatus(t, $event)">
                      @for (s of statuses; track s) { <option [value]="s">{{ pretty(s) }}</option> }
                    </select>
                  } @else if (canReopen(t)) {
                    <button class="btn-outline btn-sm" (click)="setStatus(t, 'Reopened')">Reopen</button>
                  } @else { <span [class]="'st-'+t.status">{{ pretty(t.status) }}</span> }
                </div>

                <div class="flex items-center justify-between gap-2">
                  <span class="text-muted-foreground text-xs">Priority</span>
                  @if (auth.has('tickets.changePriority')) {
                    <select class="select w-auto h-8 text-xs" [ngModel]="t.priority" (ngModelChange)="setPriority(t, $event)">
                      @for (p of priorities; track p) { <option [value]="p">{{ p }}</option> }
                    </select>
                  } @else { <span [class]="'pr-'+t.priority">{{ t.priority }}</span> }
                </div>

                <div class="flex items-center justify-between gap-2">
                  <span class="text-muted-foreground text-xs">Assignee</span>
                  @if (auth.has('tickets.assign')) {
                    <select class="select w-auto h-8 text-xs" [ngModel]="t.assignedToId ?? 0" (ngModelChange)="setAssignee(t, $event)">
                      <option [ngValue]="0">Unassigned</option>
                      @for (a of agents(); track a.id) { <option [ngValue]="a.id">{{ a.fullName }}</option> }
                    </select>
                  } @else { <span class="font-medium">{{ t.assignedToName ?? '—' }}</span> }
                </div>

                <div class="flex items-center justify-between border-t border-border pt-3"><span class="text-muted-foreground text-xs">Category</span><span class="font-medium">{{ t.categoryName }}</span></div>
                <div class="flex items-center justify-between"><span class="text-muted-foreground text-xs">Requester</span><span class="font-medium">{{ t.createdByName }}</span></div>
                <div class="flex items-center justify-between"><span class="text-muted-foreground text-xs">Created</span><span class="text-xs">{{ t.createdAt | date:'MMM d, HH:mm' }}</span></div>
                <div class="flex items-center justify-between"><span class="text-muted-foreground text-xs">SLA due</span>
                  @if (t.isOverdue) { <span class="pill-overdue">Overdue</span> } @else { <span class="text-xs">{{ t.dueAt | date:'MMM d, HH:mm' }}</span> }
                </div>
                @if (t.resolvedAt) { <div class="flex items-center justify-between"><span class="text-muted-foreground text-xs">Resolved</span><span class="text-xs">{{ t.resolvedAt | date:'MMM d, HH:mm' }}</span></div> }
              </div>
            </div>

            <div class="card p-5">
              <h3 class="section-title mb-3">Activity</h3>
              <ul class="space-y-0">
                @for (h of t.history; track $index) {
                  <li class="relative pl-5 pb-3 border-l border-border last:border-l-transparent">
                    <span class="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-brand"></span>
                    <div class="text-sm font-medium">{{ h.action }}</div>
                    <div class="text-xs text-muted-foreground">{{ h.actorName }} · {{ h.createdAt | date:'MMM d, HH:mm' }}</div>
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class TicketDetailComponent {
  private api = inject(TicketService);
  private userApi = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  statuses = STATUSES; priorities = PRIORITIES;
  ticket = signal<TicketDetail | null>(null);
  agents = signal<AgentOption[]>([]);
  loading = signal(true);
  posting = signal(false);
  reply = ''; internal = false;
  id = 0;

  canEdit = computed(() => {
    const t = this.ticket(); if (!t) return false;
    return this.auth.has('tickets.editAny') || t.createdById === this.auth.userId();
  });

  constructor() {
    this.id = +this.route.snapshot.paramMap.get('id')!;
    if (this.auth.has('tickets.assign')) this.userApi.agents().subscribe(a => this.agents.set(a));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.get(this.id).subscribe({
      next: t => { this.ticket.set(t); this.loading.set(false); },
      error: (err) => { this.toast.error(err.error?.message ?? 'Could not load ticket'); this.router.navigate(['/tickets']); }
    });
  }

  canReopen(t: TicketDetail) {
    return t.createdById === this.auth.userId() && (t.status === 'Resolved' || t.status === 'Closed');
  }
  setStatus(t: TicketDetail, status: TicketStatus) {
    if (status === t.status) return;
    this.api.changeStatus(t.id, status).subscribe({
      next: r => { this.ticket.set(r); this.toast.success(`Status → ${this.pretty(status)}`); },
      error: (err) => this.toast.error(err.error?.message ?? 'Failed')
    });
  }
  setPriority(t: TicketDetail, priority: TicketPriority) {
    if (priority === t.priority) return;
    this.api.update(t.id, { title: t.title, description: t.description, categoryId: t.categoryId, priority })
      .subscribe({ next: r => { this.ticket.set(r); this.toast.success(`Priority → ${priority}`); }, error: (err) => this.toast.error(err.error?.message ?? 'Failed') });
  }
  setAssignee(t: TicketDetail, id: number) {
    this.api.assign(t.id, id === 0 ? null : id).subscribe({
      next: r => { this.ticket.set(r); this.toast.success('Assignment updated'); },
      error: (err) => this.toast.error(err.error?.message ?? 'Failed')
    });
  }
  send(id: number) {
    const body = this.reply.trim(); if (!body) return;
    this.posting.set(true);
    this.api.addComment(id, body, this.internal && this.auth.has('tickets.commentInternal')).subscribe({
      next: () => { this.reply = ''; this.internal = false; this.posting.set(false); this.load(); },
      error: (err) => { this.toast.error(err.error?.message ?? 'Could not send'); this.posting.set(false); }
    });
  }
  pretty(s: string) { return s.replace(/([A-Z])/g, ' $1').trim(); }
}

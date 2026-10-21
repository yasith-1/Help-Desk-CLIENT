import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DashboardService } from '../services/dashboard.service';
import { AuthService } from '../services/auth.service';
import { DashboardStats } from '../models/models';
import { StatCardComponent } from './ui/stat-card.component';
import { LineChartComponent, ChartPoint } from './ui/line-chart.component';
import { DonutComponent, DonutSeg } from './ui/donut.component';
import { AvatarComponent } from './ui/avatar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, StatCardComponent, LineChartComponent, DonutComponent, AvatarComponent],
  template: `
    <div class="page-wrap">
      @if (loading()) { <div class="spinner"></div> }
      @if (stats(); as s) {
        <!-- Row 1: overview + hero -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- Overview -->
          <div class="card p-5 lg:col-span-2">
            <div class="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h3 class="font-semibold">{{ auth.isStaff() ? 'Tickets Overview' : 'My Tickets' }}</h3>
                <p class="text-xs text-muted-foreground mt-0.5">New tickets created over time</p>
              </div>
              <div class="seg">
                <button [class.active]="range()===7" (click)="range.set(7)">7d</button>
                <button [class.active]="range()===14" (click)="range.set(14)">14d</button>
              </div>
            </div>

            <div class="mt-3 flex items-end gap-3">
              <div class="text-3xl font-bold tracking-tight">{{ periodTotal() }}</div>
              <div class="text-sm font-semibold mb-1 flex items-center gap-1"
                   [class.text-emerald-500]="trendDelta()>=0" [class.text-red-500]="trendDelta()<0">
                {{ trendDelta()>=0 ? '▲' : '▼' }} {{ absTrend() }}%
              </div>
              <div class="text-xs text-muted-foreground mb-1.5 ml-auto">last {{ range() }} days</div>
            </div>

            <div class="mt-2"><ui-line-chart [data]="chart()" [height]="190" /></div>
          </div>

          <!-- Hero -->
          <div class="card p-5 relative overflow-hidden lg:col-span-1 flex flex-col">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">{{ auth.isStaff() ? 'Workload' : 'Status' }}</h3>
              <span class="pill border-border text-muted-foreground">live</span>
            </div>
            <div class="mt-3">
              <div class="text-xs text-muted-foreground">Open tickets right now</div>
              <div class="text-4xl font-bold tracking-tight mt-1">{{ s.open + s.inProgress }}</div>
              <div class="text-xs mt-1" [class.text-red-500]="s.overdue>0">
                @if (s.overdue>0) { {{ s.overdue }} overdue need attention } @else { ✓ all within SLA }
              </div>
            </div>

            <!-- gradient visual -->
            <div class="relative mt-4 rounded-xl h-28 overflow-hidden grid place-items-center text-center"
                 style="background:radial-gradient(130% 120% at 50% 0%, hsl(217 91% 60% / .35), transparent 60%), hsl(var(--muted))">
              <div class="absolute inset-0 opacity-30"
                   style="background-image:radial-gradient(circle at 20% 30%, white 0.5px, transparent 1px), radial-gradient(circle at 70% 60%, white 0.5px, transparent 1px); background-size:34px 34px"></div>
              <div class="relative">
                <div class="text-2xl font-bold text-brand">{{ resolveRate() }}%</div>
                <div class="text-[11px] text-muted-foreground">resolved on record</div>
              </div>
            </div>

            <div class="mt-auto pt-4 grid grid-cols-2 gap-3 text-sm">
              <div><div class="text-muted-foreground text-xs">Avg resolve</div><div class="font-semibold">{{ s.avgResolutionHours }}h</div></div>
              <div><div class="text-muted-foreground text-xs">Unassigned</div><div class="font-semibold">{{ s.unassigned }}</div></div>
            </div>
          </div>
        </div>

        <!-- Row 2: stat cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <ui-stat-card label="Total" icon="🎫" [value]="s.total" />
          <ui-stat-card label="Open" icon="📬" [value]="s.open" />
          <ui-stat-card label="Resolved" icon="✅" [value]="s.resolved" />
          <ui-stat-card label="Overdue" icon="⏰" [value]="s.overdue" [alert]="s.overdue>0" />
        </div>

        <!-- Row 3: table + priority -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
          <div class="card lg:col-span-2 overflow-hidden">
            <div class="flex items-center justify-between p-5 pb-3">
              <h3 class="font-semibold">Recent tickets</h3>
              <button class="btn-ghost btn-sm" (click)="router.navigate(['/tickets'])">View all →</button>
            </div>
            @if (s.recent.length === 0) { <div class="empty p-8 text-center text-muted-foreground text-sm">No tickets yet.</div> }
            @else {
              <div class="overflow-x-auto">
                <table class="tbl rowhover">
                  <thead><tr><th>#</th><th>Title</th><th>Requester</th><th>Category</th><th>Status</th><th>Priority</th><th class="text-right">Action</th></tr></thead>
                  <tbody>
                    @for (t of s.recent; track t.id) {
                      <tr (click)="open(t.id)">
                        <td class="text-muted-foreground text-xs">{{ t.ticketNumber }}</td>
                        <td class="font-medium max-w-[220px] truncate">{{ t.title }}</td>
                        <td><div class="flex items-center gap-2"><ui-avatar [name]="t.createdByName" size="sm" /><span class="text-xs hidden xl:inline">{{ t.createdByName }}</span></div></td>
                        <td class="text-xs text-muted-foreground">{{ t.categoryName }}</td>
                        <td><span [class]="'st-'+t.status">{{ pretty(t.status) }}</span></td>
                        <td><span [class]="'pr-'+t.priority">{{ t.priority }}</span></td>
                        <td class="text-right"><button class="btn-outline btn-sm" (click)="open(t.id); $event.stopPropagation()">View</button></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <div class="card p-5 lg:col-span-1">
            <h3 class="font-semibold mb-4">By priority</h3>
            <ui-donut [data]="priorityDonut()" [size]="130" />
            <div class="mt-5 pt-4 border-t border-border">
              <h4 class="text-sm font-semibold mb-3">By status</h4>
              @for (r of s.byStatus; track r.label) {
                <div class="flex items-center gap-2 mb-2 text-sm">
                  <span class="w-24 text-xs text-muted-foreground truncate">{{ pretty(r.label) }}</span>
                  <div class="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div class="h-full rounded-full bg-brand" [style.width.%]="barPct(r.count, s.byStatus)"></div>
                  </div>
                  <span class="w-6 text-right font-semibold text-xs">{{ r.count }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent {
  private api = inject(DashboardService);
  router = inject(Router);
  auth = inject(AuthService);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  range = signal<7 | 14>(14);

  constructor() {
    this.api.stats().subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  chart = computed<ChartPoint[]>(() => {
    const t = this.stats()?.trend ?? [];
    return t.slice(-this.range()).map(x => ({ label: x.label, value: x.count }));
  });
  periodTotal = computed(() => this.chart().reduce((a, b) => a + b.value, 0));
  trendDelta = computed(() => {
    const c = this.chart(); if (c.length < 2) return 0;
    const half = Math.floor(c.length / 2);
    const prev = c.slice(0, half).reduce((a, b) => a + b.value, 0);
    const recent = c.slice(half).reduce((a, b) => a + b.value, 0);
    if (prev === 0) return recent > 0 ? 100 : 0;
    return Math.round(((recent - prev) / prev) * 100);
  });
  absTrend = computed(() => Math.abs(this.trendDelta()));

  resolveRate = computed(() => {
    const s = this.stats(); if (!s || s.total === 0) return 0;
    return Math.round((s.resolved / s.total) * 100);
  });

  priorityDonut = computed<DonutSeg[]>(() => {
    const colors: Record<string, string> = { Low: '#64748b', Medium: '#0ea5e9', High: '#f59e0b', Urgent: '#ef4444' };
    return (this.stats()?.byPriority ?? []).map(p => ({ label: p.label, value: p.count, color: colors[p.label] ?? '#64748b' }));
  });

  barPct(v: number, all: { count: number }[]) {
    const max = Math.max(...all.map(x => x.count), 1);
    return Math.round((v / max) * 100);
  }
  pretty(s: string) { return s.replace(/([A-Z])/g, ' $1').trim(); }
  open(id: number) { this.router.navigate(['/tickets', id]); }
}

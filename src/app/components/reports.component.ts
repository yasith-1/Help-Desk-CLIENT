import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CategoryService } from '../services/category.service';
import { ReportService, ReportFilter, ReportKind } from '../services/report.service';
import { ToastService } from '../services/toast.service';
import { Category, STATUSES, PRIORITIES, Paged, TicketListItem } from '../models/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page-wrap">
      <div class="mb-5">
        <h2 class="text-lg font-bold">Reports</h2>
        <p class="text-sm text-muted-foreground">Download ticket data and summary analytics. Filters below apply to every report.</p>
      </div>

      <!-- Filters -->
      <div class="card p-5 mb-5">
        <h3 class="section-title mb-3">Filters</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label class="label">From</label>
            <input class="input" type="date" [(ngModel)]="from" [max]="to || undefined" (click)="openPicker($event)" (change)="reloadPreview(1)" />
          </div>
          <div>
            <label class="label">To</label>
            <input class="input" type="date" [(ngModel)]="to" [min]="from || undefined" (click)="openPicker($event)" (change)="reloadPreview(1)" />
          </div>
          <div>
            <label class="label">Status</label>
            <select class="select" [(ngModel)]="status" (change)="reloadPreview(1)">
              <option value="">All status</option>
              @for (s of statuses; track s) { <option [value]="s">{{ pretty(s) }}</option> }
            </select>
          </div>
          <div>
            <label class="label">Priority</label>
            <select class="select" [(ngModel)]="priority" (change)="reloadPreview(1)">
              <option value="">All priority</option>
              @for (p of priorities; track p) { <option [value]="p">{{ p }}</option> }
            </select>
          </div>
          <div>
            <label class="label">Category</label>
            <select class="select" [(ngModel)]="categoryId" (change)="reloadPreview(1)">
              <option [ngValue]="undefined">All categories</option>
              @for (c of categories(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
            </select>
          </div>
        </div>
        <div class="flex justify-end mt-3">
          <button class="btn-ghost btn-sm" type="button" (click)="clear()">Clear filters</button>
        </div>
      </div>

      <!-- Report cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- CSV -->
        <div class="card p-5 flex flex-col">
          <div class="flex items-center gap-2 mb-2">
            <span class="grid place-items-center h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-xs">CSV</span>
            <h3 class="font-semibold">Tickets</h3>
          </div>
          <p class="text-sm text-muted-foreground flex-1">Every ticket matching the filters, as a spreadsheet-ready CSV (opens in Excel / Sheets).</p>
          <button class="btn-primary btn-sm mt-4" type="button" [disabled]="busy() !== null || !hasData()" (click)="run('tickets-csv', 'csv')">
            {{ busy() === 'tickets-csv' ? 'Preparing…' : '↓ Download CSV' }}
          </button>
        </div>

        <!-- PDF -->
        <div class="card p-5 flex flex-col">
          <div class="flex items-center gap-2 mb-2">
            <span class="grid place-items-center h-9 w-9 rounded-lg bg-red-500/10 text-red-500 font-bold text-xs">PDF</span>
            <h3 class="font-semibold">Summary</h3>
          </div>
          <p class="text-sm text-muted-foreground flex-1">A one-page analytics report — totals, overdue, and breakdowns by status, priority & category.</p>
          <button class="btn-primary btn-sm mt-4" type="button" [disabled]="busy() !== null || !hasData()" (click)="run('summary-pdf', 'pdf')">
            {{ busy() === 'summary-pdf' ? 'Preparing…' : '↓ Download PDF' }}
          </button>
        </div>

        <!-- Excel -->
        <div class="card p-5 flex flex-col">
          <div class="flex items-center gap-2 mb-2">
            <span class="grid place-items-center h-9 w-9 rounded-lg bg-green-600/10 text-green-600 font-bold text-xs">XLSX</span>
            <h3 class="font-semibold">Full workbook</h3>
          </div>
          <p class="text-sm text-muted-foreground flex-1">Formatted Excel file with a <b>Tickets</b> sheet (auto-filtered) and a <b>Summary</b> sheet.</p>
          <button class="btn-primary btn-sm mt-4" type="button" [disabled]="busy() !== null || !hasData()" (click)="run('full-excel', 'xlsx')">
            {{ busy() === 'full-excel' ? 'Preparing…' : '↓ Download Excel' }}
          </button>
        </div>
      </div>

      @if (!hasData() && !loadingPreview()) {
        <p class="text-xs text-muted-foreground mt-3">No tickets match the current filters — downloads are disabled. Adjust the filters to export.</p>
      }

      <!-- Preview table -->
      <div class="card overflow-hidden mt-5">
        <div class="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 class="section-title">Matching tickets</h3>
          <span class="text-xs text-muted-foreground">{{ preview()?.total ?? 0 }} total</span>
        </div>

        @if (loadingPreview()) { <div class="spinner"></div> }
        @else if (preview()) {
          @if (preview(); as pg) {
          @if (pg.items.length === 0) {
            <div class="p-10 text-center text-sm text-muted-foreground">No tickets match the selected filters.</div>
          } @else {
            <div class="overflow-x-auto">
              <table class="tbl rowhover">
                <thead><tr>
                  <th>#</th><th>Title</th><th>Status</th><th>Priority</th><th>Category</th>
                  <th>Requester</th><th>Assignee</th><th>Created</th><th>Due</th>
                </tr></thead>
                <tbody>
                  @for (t of pg.items; track t.id) {
                    <tr>
                      <td class="text-xs text-muted-foreground">{{ t.ticketNumber }}</td>
                      <td class="font-medium max-w-[240px] truncate">{{ t.title }}</td>
                      <td><span [class]="'st-'+t.status">{{ pretty(t.status) }}</span></td>
                      <td><span [class]="'pr-'+t.priority">{{ t.priority }}</span></td>
                      <td class="text-xs text-muted-foreground">{{ t.categoryName }}</td>
                      <td class="text-xs">{{ t.createdByName }}</td>
                      <td class="text-xs">{{ t.assignedToName ?? '—' }}</td>
                      <td class="text-xs">{{ t.createdAt | date:'MMM d, y' }}</td>
                      <td class="text-xs">
                        @if (t.isOverdue) { <span class="pill-overdue">Overdue</span> }
                        @else { <span class="text-muted-foreground">{{ t.dueAt | date:'MMM d' }}</span> }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="flex items-center justify-center gap-3 py-3 text-sm border-t border-border">
              <button class="btn-outline btn-sm" [disabled]="pg.page<=1" (click)="reloadPreview(pg.page-1)">‹ Prev</button>
              <span class="text-muted-foreground text-xs">Page {{ pg.page }} / {{ pg.totalPages || 1 }} · {{ pg.total }} tickets</span>
              <button class="btn-outline btn-sm" [disabled]="pg.page>=pg.totalPages" (click)="reloadPreview(pg.page+1)">Next ›</button>
            </div>
          }
          }
        }
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  private catApi = inject(CategoryService);
  private reports = inject(ReportService);
  private toast = inject(ToastService);

  statuses = STATUSES; priorities = PRIORITIES;
  from = ''; to = ''; status = ''; priority = '';
  categoryId?: number;

  categories = signal<Category[]>([]);
  busy = signal<ReportKind | null>(null);

  preview = signal<Paged<TicketListItem> | null>(null);
  loadingPreview = signal(false);
  pageSize = 10;

  hasData = () => (this.preview()?.total ?? 0) > 0;

  ngOnInit() {
    this.catApi.list().subscribe(c => this.categories.set(c));
    this.reloadPreview(1);
  }

  reloadPreview(page: number) {
    this.loadingPreview.set(true);
    this.reports.preview(this.filter(), page, this.pageSize).subscribe({
      next: pg => { this.preview.set(pg); this.loadingPreview.set(false); },
      error: () => { this.preview.set(null); this.loadingPreview.set(false); }
    });
  }

  private filter(): ReportFilter {
    return {
      from: this.from || undefined,
      to: this.to || undefined,
      status: this.status || undefined,
      priority: this.priority || undefined,
      categoryId: this.categoryId
    };
  }

  run(kind: ReportKind, ext: string) {
    this.busy.set(kind);
    this.reports.download(kind, this.filter()).subscribe({
      next: blob => {
        this.save(blob, `helpdesk-${kind}-${this.stamp()}.${ext}`);
        this.busy.set(null);
        this.toast.success('Report downloaded');
      },
      error: async (err) => { this.busy.set(null); this.toast.error(await this.errMsg(err)); }
    });
  }

  clear() { this.from = this.to = this.status = this.priority = ''; this.categoryId = undefined; this.reloadPreview(1); }

  // date field එකේ ඕනෑම තැනක click කළාම native calendar එක open කරනවා
  openPicker(e: Event) {
    const el = e.target as HTMLInputElement & { showPicker?: () => void };
    try { el.showPicker?.(); } catch { /* not supported / blocked — icon still works */ }
  }

  pretty(s: string) { return s.replace(/([A-Z])/g, ' $1').trim(); }

  private stamp() { return new Date().toISOString().slice(0, 10).replace(/-/g, ''); }

  private save(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // error response body is a Blob → try to read the JSON message out of it
  private async errMsg(err: any): Promise<string> {
    try {
      if (err?.error instanceof Blob) {
        const j = JSON.parse(await err.error.text());
        return j.message ?? 'Could not generate report';
      }
    } catch { /* ignore */ }
    return 'Could not generate report';
  }
}

import { Component, Input, computed, signal } from '@angular/core';

export interface ChartPoint { label: string; value: number; }

// Dependency-free SVG area+line chart with hover tooltip.
@Component({
  selector: 'ui-line-chart',
  standalone: true,
  template: `
    <div class="relative w-full select-none" (mouseleave)="hover.set(-1)">
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="w-full" [style.height.px]="height"
           preserveAspectRatio="none" (mousemove)="onMove($event)">
        <defs>
          <linearGradient [attr.id]="gid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="hsl(var(--brand))" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="hsl(var(--brand))" stop-opacity="0"/>
          </linearGradient>
        </defs>

        <!-- gridlines -->
        @for (g of gridY(); track g) {
          <line [attr.x1]="padL" [attr.x2]="W-padR" [attr.y1]="g" [attr.y2]="g"
                stroke="hsl(var(--border))" stroke-width="1" stroke-dasharray="3 5" opacity="0.6"/>
        }

        @if (pts().length > 1) {
          <path [attr.d]="areaPath()" [attr.fill]="'url(#' + gid + ')'"/>
          <path [attr.d]="linePath()" fill="none" stroke="hsl(var(--brand))" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
          @if (hover() >= 0) {
            <line [attr.x1]="pts()[hover()].x" [attr.x2]="pts()[hover()].x" [attr.y1]="padT" [attr.y2]="H-padB"
                  stroke="hsl(var(--brand))" stroke-width="1" opacity="0.5" vector-effect="non-scaling-stroke"/>
            <circle [attr.cx]="pts()[hover()].x" [attr.cy]="pts()[hover()].y" r="4.5"
                    fill="hsl(var(--brand))" stroke="hsl(var(--background))" stroke-width="2"/>
          }
        }
      </svg>

      <!-- tooltip -->
      @if (hover() >= 0) {
        <div class="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md animate-fade-in"
             [style.left.%]="(pts()[hover()].x / W) * 100" [style.top.%]="(pts()[hover()].y / H) * 100">
          <div class="font-semibold">{{ pts()[hover()].v }}</div>
          <div class="text-muted-foreground">{{ data[hover()].label }}</div>
        </div>
      }

      <!-- x labels -->
      <div class="flex justify-between mt-2 px-1 text-[11px] text-muted-foreground">
        @for (l of xLabels(); track $index) { <span>{{ l }}</span> }
      </div>
    </div>
  `
})
export class LineChartComponent {
  private _data = signal<ChartPoint[]>([]);
  @Input() set data(v: ChartPoint[]) { this._data.set(v ?? []); }
  get data() { return this._data(); }
  @Input() height = 180;

  readonly W = 600; readonly H = 200;
  readonly padL = 6; readonly padR = 6; readonly padT = 16; readonly padB = 10;
  gid = 'g' + Math.random().toString(36).slice(2, 8);
  hover = signal(-1);

  private min = computed(() => Math.min(...this._data().map(d => d.value), 0));
  private max = computed(() => Math.max(...this._data().map(d => d.value), 1));

  pts = computed(() => {
    const d = this._data(); const n = d.length; if (!n) return [];
    const lo = this.min(), hi = this.max(), span = hi - lo || 1;
    return d.map((p, i) => ({
      x: this.padL + (n === 1 ? 0 : (i / (n - 1)) * (this.W - this.padL - this.padR)),
      y: this.padT + (1 - (p.value - lo) / span) * (this.H - this.padT - this.padB),
      v: p.value
    }));
  });

  linePath = computed(() => this.pts().map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '));
  areaPath = computed(() => {
    const p = this.pts(); if (p.length < 2) return '';
    return this.linePath() + ` L${p[p.length - 1].x.toFixed(1)} ${this.H - this.padB} L${p[0].x.toFixed(1)} ${this.H - this.padB} Z`;
  });

  gridY = computed(() => [0.25, 0.5, 0.75].map(f => this.padT + f * (this.H - this.padT - this.padB)));

  xLabels = computed(() => {
    const d = this._data(); const n = d.length; if (!n) return [];
    if (n <= 6) return d.map(x => x.label);
    const idx = [0, Math.floor(n * 0.33), Math.floor(n * 0.66), n - 1];
    return idx.map(i => d[i].label);
  });

  onMove(e: MouseEvent) {
    const n = this._data().length; if (n < 2) return;
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    this.hover.set(Math.round(ratio * (n - 1)));
  }
}

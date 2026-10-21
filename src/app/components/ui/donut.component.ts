import { Component, Input, computed, signal } from '@angular/core';

export interface DonutSeg { label: string; value: number; color: string; }

// SVG donut chart — segments + center total.
@Component({
  selector: 'ui-donut',
  standalone: true,
  template: `
    <div class="flex items-center gap-5">
      <svg [attr.width]="size" [attr.height]="size" [attr.viewBox]="'0 0 ' + size + ' ' + size" class="shrink-0 -rotate-90">
        <circle [attr.cx]="c" [attr.cy]="c" [attr.r]="r" fill="none" stroke="hsl(var(--muted))" [attr.stroke-width]="sw"/>
        @for (a of arcs(); track a.label) {
          <circle [attr.cx]="c" [attr.cy]="c" [attr.r]="r" fill="none" [attr.stroke]="a.color" [attr.stroke-width]="sw"
                  [attr.stroke-dasharray]="a.len + ' ' + (circ - a.len)" [attr.stroke-dashoffset]="a.offset"
                  stroke-linecap="butt"/>
        }
      </svg>
      <div class="flex flex-col gap-1.5 text-sm">
        @for (s of data; track s.label) {
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-sm" [style.background]="s.color"></span>
            <span class="text-muted-foreground">{{ s.label }}</span>
            <span class="font-semibold ml-auto">{{ s.value }}</span>
          </div>
        }
      </div>
    </div>
  `
})
export class DonutComponent {
  private _data = signal<DonutSeg[]>([]);
  @Input() set data(v: DonutSeg[]) { this._data.set(v ?? []); }
  get data() { return this._data(); }
  @Input() size = 120;

  get sw() { return 16; }
  get c() { return this.size / 2; }
  get r() { return this.size / 2 - this.sw / 2; }
  get circ() { return 2 * Math.PI * this.r; }

  arcs = computed(() => {
    const total = this._data().reduce((s, x) => s + x.value, 0) || 1;
    let acc = 0;
    return this._data().filter(s => s.value > 0).map(s => {
      const len = (s.value / total) * this.circ;
      const offset = -acc;
      acc += len;
      return { label: s.label, color: s.color, len, offset };
    });
  });
}

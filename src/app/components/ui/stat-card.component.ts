import { Component, Input } from '@angular/core';

// KPI stat card — label, big value, optional delta (▲/▼ %).
@Component({
  selector: 'ui-stat-card',
  standalone: true,
  template: `
    <div class="card p-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          @if (icon) { <span>{{ icon }}</span> } {{ label }}
        </span>
        @if (delta !== null && delta !== undefined) {
          <span class="text-xs font-semibold flex items-center gap-0.5"
                [class.text-emerald-500]="!negative()" [class.text-red-500]="negative()">
            {{ negative() ? '▼' : '▲' }} {{ absDelta() }}%
          </span>
        }
      </div>
      <div class="mt-2 text-2xl font-bold tracking-tight" [class.text-red-500]="alert">{{ value }}<span class="text-sm text-muted-foreground font-medium">{{ suffix }}</span></div>
      @if (hint) { <div class="text-xs text-muted-foreground mt-1">{{ hint }}</div> }
    </div>
  `
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() suffix = '';
  @Input() icon = '';
  @Input() hint = '';
  @Input() delta: number | null = null;
  @Input() alert = false;

  negative() { return (this.delta ?? 0) < 0; }
  absDelta() { return Math.abs(this.delta ?? 0); }
}

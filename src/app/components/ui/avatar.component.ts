import { Component, Input, computed, signal } from '@angular/core';

// Deterministic colored avatar (initials). Name එකෙන් color එක hash කරනවා.
const PALETTE = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

@Component({
  selector: 'ui-avatar',
  standalone: true,
  template: `
    @if (src()) {
      <img [src]="src()" [style.width.px]="px()" [style.height.px]="px()" alt="avatar"
           class="rounded-full object-cover ring-2 ring-background shrink-0" (error)="src.set('')" />
    } @else {
      <span class="inline-flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-background shrink-0"
            [style.width.px]="px()" [style.height.px]="px()" [style.background]="color()" [style.fontSize.px]="px()*0.4">
        {{ initials() }}
      </span>
    }
  `
})
export class AvatarComponent {
  private _name = signal('');
  src = signal('');
  @Input() set name(v: string | null | undefined) { this._name.set(v ?? ''); }
  @Input() set imageUrl(v: string | null | undefined) { this.src.set(v ?? ''); }
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  px = computed(() => ({ sm: 26, md: 34, lg: 44 }[this.size]));
  initials = computed(() => {
    const parts = this._name().trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  });
  color = computed(() => {
    const n = this._name();
    let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length];
  });
}

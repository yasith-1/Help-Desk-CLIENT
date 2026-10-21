import { Component, Input } from '@angular/core';
import { AvatarComponent } from './avatar.component';

// Overlapping avatars + "+N" more.
@Component({
  selector: 'ui-avatar-stack',
  standalone: true,
  imports: [AvatarComponent],
  template: `
    <span class="flex items-center">
      @for (n of shown(); track $index) {
        <span class="-ml-2 first:ml-0"><ui-avatar [name]="n" size="sm" /></span>
      }
      @if (extra() > 0) {
        <span class="-ml-2 inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground text-[11px] font-semibold ring-2 ring-background"
              style="width:26px;height:26px">+{{ extra() }}</span>
      }
    </span>
  `
})
export class AvatarStackComponent {
  @Input() names: string[] = [];
  @Input() max = 3;
  shown() { return this.names.slice(0, this.max); }
  extra() { return Math.max(0, this.names.length - this.max); }
}

import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; text: string; type: 'info' | 'success' | 'error'; }

// සරල toast notifications (app shell එකේ පෙන්නනවා)
@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private seq = 0;

  show(text: string, type: Toast['type'] = 'info') {
    const id = ++this.seq;
    this.toasts.update(list => [...list, { id, text, type }]);
    setTimeout(() => this.dismiss(id), 3500);
  }
  success(t: string) { this.show(t, 'success'); }
  error(t: string) { this.show(t, 'error'); }
  dismiss(id: number) { this.toasts.update(list => list.filter(t => t.id !== id)); }
}

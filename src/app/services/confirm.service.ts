import { Injectable, signal } from '@angular/core';

export interface ConfirmReq {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  resolve: (v: boolean) => void;
}

// Promise-based confirmation dialog — app shell එකේ modal එකක් විදිහට පෙන්නනවා.
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  current = signal<ConfirmReq | null>(null);

  ask(opts: { title?: string; message: string; confirmText?: string; cancelText?: string; danger?: boolean }): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.current.set({
        title: opts.title ?? 'Are you sure?',
        message: opts.message,
        confirmText: opts.confirmText ?? 'Confirm',
        cancelText: opts.cancelText ?? 'Cancel',
        danger: opts.danger ?? false,
        resolve,
      });
    });
  }

  confirm() { this.close(true); }
  cancel() { this.close(false); }

  private close(v: boolean) {
    const c = this.current();
    if (c) { c.resolve(v); this.current.set(null); }
  }
}

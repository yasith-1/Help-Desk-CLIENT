import { Injectable, signal } from '@angular/core';

// Dark / light theme — .dark class එක <html> එකට, localStorage එකේ persist (default dark).
@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<'dark' | 'light'>('dark');

  constructor() {
    let saved: string | null = null;
    try { saved = localStorage.getItem('theme'); } catch {}
    this.apply((saved as 'dark' | 'light') ?? 'dark');
  }

  toggle() { this.apply(this.theme() === 'dark' ? 'light' : 'dark'); }

  private apply(t: 'dark' | 'light') {
    this.theme.set(t);
    const root = document.documentElement;
    root.classList.toggle('dark', t === 'dark');
    try { localStorage.setItem('theme', t); } catch {}
  }
}

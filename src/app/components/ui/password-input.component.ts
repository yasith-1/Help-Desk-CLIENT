import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// Reusable password field with a show/hide (eye) toggle.
// Implements ControlValueAccessor → drops into existing [(ngModel)] bindings as-is.
// Usage: <ui-password [(ngModel)]="password" name="password" placeholder="••••••" autocomplete="new-password" />
@Component({
  selector: 'ui-password',
  standalone: true,
  template: `
    <div class="relative" [class]="inputClass()">
      <input
        [attr.id]="inputId() || null"
        [type]="show() ? 'text' : 'password'"
        class="input pr-10"
        [placeholder]="placeholder()"
        [attr.autocomplete]="autocomplete()"
        [value]="value"
        [disabled]="disabled"
        (input)="onInput($event)"
        (blur)="onTouched()" />

      <button type="button" tabindex="-1"
        class="absolute inset-y-0 right-0 grid place-items-center w-10 text-muted-foreground hover:text-foreground transition-colors"
        [attr.aria-label]="show() ? 'Hide password' : 'Show password'"
        [attr.aria-pressed]="show()"
        (click)="show.set(!show())">
        @if (show()) {
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        } @else {
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        }
      </button>
    </div>
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PasswordInputComponent), multi: true }]
})
export class PasswordInputComponent implements ControlValueAccessor {
  placeholder = input('');
  autocomplete = input('off');
  inputClass = input('');          // extra classes for the wrapper (e.g. "max-w-sm")
  inputId = input('');             // optional id so a <label for=…> keeps working

  show = signal(false);
  value = '';
  disabled = false;

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(e: Event) { this.value = (e.target as HTMLInputElement).value; this.onChange(this.value); }

  // ControlValueAccessor
  writeValue(v: string) { this.value = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.disabled = d; }
}

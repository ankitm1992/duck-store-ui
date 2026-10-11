import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatInput } from '@angular/material/input'; 
import { COLORS, Duck, SIZES } from '../duck.model';
import { DuckService } from '../duck.service';
import { MatButton } from '@angular/material/button';

/** One form for both adding (duck = null) and editing (color and size are read-only). */
@Component({
  selector: 'app-duck-form',
  imports: [ReactiveFormsModule,MatFormField, MatLabel, MatError, MatSelect, MatOption, MatInput],
  templateUrl: './duck-form.html',
  styleUrl: './duck-form.css',
})
export class DuckForm {
  private readonly fb = inject(FormBuilder);
  private readonly ducks = inject(DuckService);

  readonly duck = input<Duck | null>(null);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly colors = COLORS;
  readonly sizes = SIZES;
  readonly saving = signal(false);
  readonly error = signal('');

  readonly isEdit = computed(() => this.duck() !== null);
  readonly title = computed(() => (this.duck() ? 'Edit duck' : 'Add duck'));

  readonly form = this.fb.nonNullable.group({
    color: [COLORS[0] as string, Validators.required],
    size: [SIZES[0] as string, Validators.required],
    price: [0, [Validators.required, Validators.min(0.01)]],
    quantity: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
  });

  constructor() {
    effect(() => this.resetFor(this.duck()));
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    this.error.set('');

    const value = this.form.getRawValue();
    const current = this.duck();
    const request = current
      ? this.ducks.update(current.id, { price: value.price, quantity: value.quantity })
      : this.ducks.add(value);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(this.describe(e));
      },
    });
  }

  private resetFor(duck: Duck | null): void {
    this.error.set('');
    const minQuantity = duck ? 0 : 1;
    this.form.controls.quantity.setValidators([
      Validators.required,
      Validators.min(minQuantity),
      Validators.pattern(/^\d+$/),
    ]);

    if (duck) {
      this.form.reset({
        color: duck.color,
        size: duck.size,
        price: duck.price,
        quantity: duck.quantity,
      });
      this.form.controls.color.disable();
      this.form.controls.size.disable();
    } else {
      this.form.controls.color.enable();
      this.form.controls.size.enable();
      this.form.reset({ color: COLORS[0], size: SIZES[0], price: 0, quantity: 1 });
    }
    this.form.controls.quantity.updateValueAndValidity();
  }

  private describe(e: HttpErrorResponse): string {
    const details = e.error?.details ? Object.values<string>(e.error.details).join('; ') : '';
    return details || e.error?.message || 'Request failed. Please try again.';
  }
}
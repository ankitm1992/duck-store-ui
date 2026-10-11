import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Duck, SortDirection } from '../duck.model';
import { DuckService } from '../duck.service';
import { DuckForm } from '../duck-form/duck-form';

@Component({
  selector: 'app-duck-list',
  imports: [CurrencyPipe, DuckForm],
  templateUrl: './duck-list.html',
  styleUrl: './duck-list.css',
})
export class DuckList implements OnInit {
  private readonly service = inject(DuckService);

  readonly ducks = signal<Duck[]>([]);
  readonly page = signal(0);
  readonly pageSize = 10;
  readonly hasNext = signal(false);
  readonly direction = signal<SortDirection>('DESC');
  readonly formOpen = signal(false);
  readonly editing = signal<Duck | null>(null);
  readonly error = signal('');

  ngOnInit(): void {
    this.load();
  }

load(): void {
  this.service.list(this.page(), this.pageSize, 'quantity', this.direction()).subscribe({
   next: items => {
      // deleted the last row of a later page: step back instead of showing an empty page
      if (items.length === 0 && this.page() > 0) {
        this.page.update(p => p - 1);
        this.load();
        return;
      }
      this.ducks.set(items);
      this.hasNext.set(items.length === this.pageSize);
      this.error.set('');
    },
    error: () => this.error.set('Could not load ducks. Server Error !'),
  });
}

toggleSort(): void {
  this.direction.update(d => (d === 'ASC' ? 'DESC' : 'ASC'));
  this.page.set(0);
  this.load();
}

goTo(page: number): void {
  this.page.set(page);
  this.load();
}

  openAdd(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  openEdit(duck: Duck): void {
    this.editing.set(duck);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  onSaved(): void {
    this.closeForm();
    this.load();
  }

  remove(duck: Duck): void {
    if (!confirm(`Delete the ${duck.color} ${duck.size} duck (id ${duck.id})?`)) {
      return;
    }
    this.service.remove(duck.id).subscribe({
      next: () => this.load(),
      error: (e: HttpErrorResponse) => {
        this.error.set(e.error?.message ?? 'Delete failed.');
        this.load();
      },
    });
  }
}
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Duck, SortDirection, SortField } from '../duck.model';
import { DuckService } from '../duck.service';
import { DuckForm } from '../duck-form/duck-form';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { DuckPaginatorIntl } from './duck-paginator-intl';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-duck-list',
  imports: [CurrencyPipe, DuckForm,MatPaginator,MatButton,MatIcon],
  providers: [{ provide: MatPaginatorIntl, useClass: DuckPaginatorIntl }],
  templateUrl: './duck-list.html',
  styleUrl: './duck-list.css',
})
export class DuckList implements OnInit {
  private readonly service = inject(DuckService);
  private readonly dialog = inject(MatDialog);

  readonly ducks = signal<Duck[]>([]);

  readonly pageSizeOptions = [10, 20, 50];
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly hasNext = signal(false);
  readonly sortBy = signal<SortField>('quantity');
  readonly direction = signal<SortDirection>('DESC');


  readonly formOpen = signal(false);
  readonly editing = signal<Duck | null>(null);
  readonly error = signal('');

  readonly length = computed(() => {
  const loaded = this.pageIndex() * this.pageSize() + this.ducks().length;
  return loaded + (this.hasNext() ? 1 : 0);
});

  ngOnInit(): void {
    this.load();
  }

load(): void {
  this.service.list(this.pageIndex(), this.pageSize(), this.sortBy(), this.direction()).subscribe({
    next: items => {
      if (items.length === 0 && this.pageIndex() > 0) {
        this.pageIndex.update(p => p - 1);
        this.load();
        return;
      }
      this.ducks.set(items);
      this.hasNext.set(items.length === this.pageSize());
      this.error.set('');
    },
    error: () => this.error.set('Could not load ducks. Server Error !'),
  });
}

sortOn(field: SortField): void {
  if (this.sortBy() === field) {
    this.direction.update(d => (d === 'ASC' ? 'DESC' : 'ASC'));
  } else {
    this.sortBy.set(field);
    this.direction.set('ASC');
  }
  this.pageIndex.set(0);
  this.load();
}

arrow(field: SortField): string {
  if (this.sortBy() !== field) {
    return '';
  }
  return this.direction() === 'ASC' ? '▲' : '▼';
}

onPage(event: PageEvent): void {
  this.pageIndex.set(event.pageIndex);
  this.pageSize.set(event.pageSize);
  this.load();
}

toggleSort(): void {
  this.direction.update(d => (d === 'ASC' ? 'DESC' : 'ASC'));
  this.pageIndex.set(0);
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
this.dialog.open(ConfirmDialog, {
  width: '400px',
  panelClass: 'square-dialog',
  data: {
    title: 'Delete !',
    message: `Delete the ${duck.color}, ${duck.size} duck?`,
    confirmText: 'Delete',
  },
})
    .afterClosed()
    .pipe(filter(confirmed => confirmed === true))
    .subscribe(() => {
      this.service.remove(duck.id).subscribe({
        next: () => this.load(),
        error: (e: HttpErrorResponse) => {
          this.error.set(e.error?.message ?? 'Delete failed.');
          this.load();
        },
      });
    });
}
}
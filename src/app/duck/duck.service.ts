import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Duck, DuckInput, SortDirection } from './duck.model';

@Injectable({ providedIn: 'root' })
export class DuckService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/ducks';

  list(direction: SortDirection): Observable<Duck[]> {
    return this.http.get<Duck[]>(this.url, { params: { direction } });
  }

  add(duck: DuckInput): Observable<Duck> {
    return this.http.post<Duck>(this.url, duck);
  }

  update(id: number, changes: Pick<DuckInput, 'price' | 'quantity'>): Observable<Duck> {
    return this.http.put<Duck>(`${this.url}/${id}`, changes);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
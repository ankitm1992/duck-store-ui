import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Duck, DuckInput, SortDirection } from './duck.model';

@Injectable({ providedIn: 'root' })
export class DuckService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/warehouse';


list(page: number, size: number, sortBy: string, sortDir: SortDirection): Observable<Duck[]> {
  return this.http.get<Duck[]>(`${this.baseUrl}/listDucks`, {
    params: { page, size, sortBy, sortDir },
  });
}

  add(duck: DuckInput): Observable<Duck> {
    return this.http.post<Duck>(`${this.baseUrl}/addDucks`, duck);
  }

  update(id: number, changes: Pick<DuckInput, 'price' | 'quantity'>): Observable<Duck> {
    return this.http.put<Duck>(`${this.baseUrl}/update/${id}`, changes);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }
}
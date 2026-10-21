import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category, CategoryRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/categories`;

  list(): Observable<Category[]> { return this.http.get<Category[]>(this.api); }
  create(req: CategoryRequest): Observable<Category> { return this.http.post<Category>(this.api, req); }
  update(id: number, req: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.api}/${id}`, req);
  }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/${id}`); }
}

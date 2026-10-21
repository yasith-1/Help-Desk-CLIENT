import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Paged, TicketListItem, TicketDetail, CreateTicketRequest, UpdateTicketRequest,
  Comment, History, TicketStatus
} from '../models/models';

export interface TicketQuery {
  status?: string; priority?: string; categoryId?: number; assignedToId?: number;
  mine?: boolean; search?: string; sort?: string; page?: number; pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/tickets`;

  list(q: TicketQuery): Observable<Paged<TicketListItem>> {
    let p = new HttpParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return this.http.get<Paged<TicketListItem>>(this.api, { params: p });
  }

  get(id: number): Observable<TicketDetail> {
    return this.http.get<TicketDetail>(`${this.api}/${id}`);
  }
  create(req: CreateTicketRequest): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(this.api, req);
  }
  update(id: number, req: UpdateTicketRequest): Observable<TicketDetail> {
    return this.http.put<TicketDetail>(`${this.api}/${id}`, req);
  }
  changeStatus(id: number, status: TicketStatus): Observable<TicketDetail> {
    return this.http.patch<TicketDetail>(`${this.api}/${id}/status`, { status });
  }
  assign(id: number, assignedToId: number | null): Observable<TicketDetail> {
    return this.http.patch<TicketDetail>(`${this.api}/${id}/assign`, { assignedToId });
  }
  addComment(id: number, body: string, isInternal: boolean): Observable<Comment> {
    return this.http.post<Comment>(`${this.api}/${id}/comments`, { body, isInternal });
  }
  history(id: number): Observable<History[]> {
    return this.http.get<History[]>(`${this.api}/${id}/history`);
  }
}

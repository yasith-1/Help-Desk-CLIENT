import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Paged, TicketListItem } from '../models/models';

export interface ReportFilter {
  from?: string;        // yyyy-MM-dd
  to?: string;          // yyyy-MM-dd
  status?: string;
  priority?: string;
  categoryId?: number;
}

export type ReportKind = 'tickets-csv' | 'summary-pdf' | 'full-excel';

// Admin reports — authenticated downloads (JWT interceptor adds the token). Returns a Blob.
@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/reports`;

  private params(f: ReportFilter): HttpParams {
    let p = new HttpParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return p;
  }

  download(kind: ReportKind, f: ReportFilter): Observable<Blob> {
    return this.http.get(`${this.api}/${kind}`, { params: this.params(f), responseType: 'blob' });
  }

  // table preview — matching tickets, paginated
  preview(f: ReportFilter, page: number, pageSize: number): Observable<Paged<TicketListItem>> {
    const p = this.params(f).set('page', String(page)).set('pageSize', String(pageSize));
    return this.http.get<Paged<TicketListItem>>(`${this.api}/preview`, { params: p });
  }
}

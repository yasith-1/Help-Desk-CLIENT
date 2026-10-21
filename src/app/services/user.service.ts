import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, AgentOption, CreateUserRequest, Role } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/users`;

  list(): Observable<User[]> { return this.http.get<User[]>(this.api); }
  agents(): Observable<AgentOption[]> { return this.http.get<AgentOption[]>(`${this.api}/agents`); }
  create(req: CreateUserRequest): Observable<User> { return this.http.post<User>(this.api, req); }
  changeRole(id: number, role: Role): Observable<User> {
    return this.http.patch<User>(`${this.api}/${id}/role`, { role });
  }
  setActive(id: number, isActive: boolean): Observable<User> {
    return this.http.patch<User>(`${this.api}/${id}/active`, { isActive });
  }
}

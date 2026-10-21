import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RoleDef, PermissionItem, CreateRoleRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/roles`;

  list(): Observable<RoleDef[]> { return this.http.get<RoleDef[]>(this.api); }
  names(): Observable<string[]> { return this.http.get<string[]>(`${this.api}/names`); }
  catalog(): Observable<PermissionItem[]> { return this.http.get<PermissionItem[]>(`${this.api}/permissions`); }
  create(req: CreateRoleRequest): Observable<RoleDef> { return this.http.post<RoleDef>(this.api, req); }
  update(id: number, name: string, description: string): Observable<RoleDef> {
    return this.http.put<RoleDef>(`${this.api}/${id}`, { name, description });
  }
  updatePermissions(id: number, permissions: string[]): Observable<RoleDef> {
    return this.http.put<RoleDef>(`${this.api}/${id}/permissions`, { permissions });
  }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/${id}`); }
}

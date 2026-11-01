import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Profile, UpdateProfileRequest, ChangePasswordRequest } from '../models/models';

// Self-service profile — current user තමන්ගේ details manage කරනවා.
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/profile`;

  // Avatar images serve වෙන්නේ /uploads/... (API එකේ /api prefix එක නැතුව) — origin එක ගන්නවා
  private origin = environment.apiUrl.replace(/\/api\/?$/, '');

  get(): Observable<Profile> { return this.http.get<Profile>(this.api); }

  update(req: UpdateProfileRequest): Observable<Profile> {
    return this.http.put<Profile>(this.api, req);
  }

  changePassword(req: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/password`, req);
  }

  uploadAvatar(file: File): Observable<Profile> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Profile>(`${this.api}/avatar`, form);
  }

  // Relative path (/uploads/avatars/x.jpg) → full URL. null නම් '' දෙනවා (→ initials avatar).
  avatarUrl(path: string | null | undefined): string {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.origin}${path}`;
  }
}

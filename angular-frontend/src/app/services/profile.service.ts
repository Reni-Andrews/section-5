import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  displayName: string;
  preferences: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly base = `${environment.dotnetUrl}/api/UserProfile`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.base);
  }

  updateProfile(displayName: string, preferences?: string): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.base, { displayName, preferences });
  }
}

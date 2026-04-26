import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'deckzi_token';
  private readonly USER_KEY = 'deckzi_user';

  private loggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedIn$.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  // ── FastAPI Auth ────────────────────────────────────────────────────────────

 register(username: string, email: string, password: string): Observable<any> {
  return this.http
    // 1. Change to dotnetUrl (Port 5193)
    // 2. Ensure the route matches your .NET controller (likely /api/auth/register)
    .post<any>(`${environment.dotnetUrl}/api/auth/register`, { username, email, password })
    .pipe(
      // 3. Make sure this matches the function name you just wrote (setSession)
      tap(res => this.setSession(res)) 
    );
}

  login(credentials: any): Observable<any> {
  return this.http.post(`${environment.dotnetUrl}/api/auth/login`, credentials)
    .pipe(tap(res => this.setSession(res)));
}

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.loggedIn$.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUsername(): string | null {
    return localStorage.getItem(this.USER_KEY);
  }

  hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  // src/app/services/auth.service.ts
  private setSession(authResult: any) {
    const token = authResult.token || authResult.tokenString || authResult.access_token;
    const username = authResult.username;

    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
      if (username) {
        localStorage.setItem(this.USER_KEY, username);
      }
      this.loggedIn$.next(true);
      console.log('Token successfully saved to LocalStorage');
    } else {
      console.error('Login succeeded but no token was found in the response!', authResult);
    }
  }
}

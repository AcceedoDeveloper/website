// service/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:3008';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, { username, password });
  }

  getUserRole(): string | null {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user).role : null;
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('token');
  }
}

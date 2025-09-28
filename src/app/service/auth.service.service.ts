// service/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient, private config : ConfigService) {}




 login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.config.getWebsiteUrl('login'), { username, password });
  }


  getUserRole(): string | null {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user).role : null;
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('token');
  }
}

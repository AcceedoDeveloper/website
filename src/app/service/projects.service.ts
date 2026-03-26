import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  constructor(private http: HttpClient, private configService: ConfigService) { }

  // Get projects by employee username
  getProjectsByEmployee(username: string): Observable<any> {
    return this.http.get(`${this.configService.getWebsiteUrl('getProjectsByEmployee')}/${username}`);
  }

  // Get all projects (if needed)
  getProjects(): Observable<any> {
    return this.http.get(this.configService.getWebsiteUrl('getProjects'));
  }
}
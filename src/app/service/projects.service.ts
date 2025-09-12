import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private baseApi = 'http://localhost:3008';

  constructor(private http: HttpClient) { }

  // Get projects by employee username
  getProjectsByEmployee(username: string): Observable<any> {
    return this.http.get(`${this.baseApi}/by-employee/${username}`);
  }

  // Get all projects (if needed)
  getProjects(): Observable<any> {
    return this.http.get(`${this.baseApi}/getProjects`);
  }
}
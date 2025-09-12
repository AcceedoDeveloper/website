import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CreatprojectService {
  private baseApi = 'http://localhost:3008';

  constructor(private http: HttpClient) {}

  // Get all projects
  getProjects(): Observable<any> {
    return this.http.get(`${this.baseApi}/getProjects`);
  }

  // Get projects by employee username
  getProjectsByEmployee(userName: string): Observable<any> {
    return this.http.get(`${this.baseApi}/by-employee/${userName}`);
  }

  createProject(projectData: any): Observable<any> {
    return this.http.post(`${this.baseApi}/createProject`, projectData);
  }

  updateProject(id: string, projectData: any): Observable<any> {
    return this.http.put(`${this.baseApi}/updateProject/${id}`, projectData);
  }

  deleteProject(id: string): Observable<any> {
    return this.http.delete(`${this.baseApi}/deleteProject/${id}`);
  }
}

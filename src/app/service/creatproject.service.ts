import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CreatprojectService {
  private baseApi = 'http://localhost:3008';

  constructor(private http: HttpClient) { }

  createProject(projectData: any): Observable<any> {
    return this.http.post(`${this.baseApi}/createProject`, projectData);
  }

  getProjects(): Observable<any> {
    return this.http.get(`${this.baseApi}/getProjects`);
  }

  updateProject(id: string, projectData: any): Observable<any> {
    return this.http.put(`${this.baseApi}/updateProduct/${id}`, projectData);
  }

  deleteProject(id: string): Observable<any> {
    return this.http.delete(`${this.baseApi}/deleteProduct/${id}`);
  }
}
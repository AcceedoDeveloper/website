import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class CreatprojectService {
  private baseApi = 'http://localhost:3008';

  constructor(private http: HttpClient,private config : ConfigService ) {}

  
  // getProjects(): Observable<any> {
  //   return this.http.get(`${this.baseApi}/getProjects`);
  // }


  // getProjectsByEmployee(userName: string): Observable<any> {
  //   return this.http.get(`${this.baseApi}/by-employee/${userName}`);
  // }

  // createProject(projectData: any): Observable<any> {
  //   return this.http.post(`${this.baseApi}/createProject`, projectData);
  // }

  // updateProject(id: string, projectData: any): Observable<any> {
  //   return this.http.put(`${this.baseApi}/updateProduct/${id}`, projectData);
  // }

  // deleteProject(id: string): Observable<any> {
  //   return this.http.delete(`${this.baseApi}/deleteProduct/${id}`);
  // }

  // Get all projects
  getProjects(): Observable<any> {
    return this.http.get(this.config.getWebsiteUrl('getProjects'));
  }

  getProjectsByEmployee(userName: string): Observable<any> {
  return this.http.get(this.config.getWebsiteUrl("getProjectsByEmployee") + `/${userName}`);
}


  // Create a new project
  createProject(projectData: any): Observable<any> {
    return this.http.post(this.config.getWebsiteUrl('createProject'), projectData);
  }

  // Update project by ID
  updateProject(id: string, projectData: any): Observable<any> {
    return this.http.put(this.config.getWebsiteUrl(`updateProduct/${id}`), projectData);
  }

  // Delete project by ID
  deleteProject(id: string): Observable<any> {
    return this.http.delete(this.config.getWebsiteUrl(`deleteProduct/${id}`));
  }
}
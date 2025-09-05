import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CreatprojectService {
  private createProjectApi = 'http://localhost:3008/createProject';

  constructor(private http: HttpClient) { }

  createProject(projectData: any): Observable<any> {
    return this.http.post(this.createProjectApi, projectData);
  }
}
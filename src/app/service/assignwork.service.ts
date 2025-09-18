import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AssignWork {
  _id?: string;
  projectName: string;
  title: string;
  description: string;
  comment: Comment[];
  assignedTo: string;
  assignee: string;
  startDate: any;
  dueDate: string;
  Status: string;    
  projectId: string;
}

export interface Comment {
timestamp: string|number|Date;
  user: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssignWorkService {
  private baseUrl = 'http://localhost:3008';

  constructor(private http: HttpClient) {}

  createAssignment(task: AssignWork): Observable<any> {
    return this.http.post(`${this.baseUrl}/CreateAssignWork`, task);
  }

  getAssignments(): Observable<AssignWork[]> {
    return this.http.get<AssignWork[]>(`${this.baseUrl}/GetAssignWork`);
  }

  updateAssignment(id: string, task: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/UpdateAssignWork/${id}`, task, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  deleteAssignment(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/DeleteAssignWork/${id}`);
  }

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetUsers`);
  }
}
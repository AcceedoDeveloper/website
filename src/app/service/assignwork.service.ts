import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AssignWork {
status: any;
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
  pictures:string;
  createdAt: string;
}

export interface Comment {
timestamp: string|number|Date;
  user: string;
  message: string;
}


// for document
export interface MyFormData {
  title: string;
  files: File[];
}

export interface UserViewResponse {
  total: number;
  works: AssignWork[];
}

@Injectable({
  providedIn: 'root'
})
export class AssignWorkService {
  private baseUrl = 'http://localhost:3008';

  constructor(private http: HttpClient) {}

createAssignment(task: FormData | any): Observable<any> {
  if (task instanceof FormData) {
    return this.http.post(`${this.baseUrl}/CreateAssignWork`, task);
  } else {
    return this.http.post(`${this.baseUrl}/CreateAssignWork`, task);
  }
}


 updateAssignment(id: string, task: FormData | any): Observable<any> {
  if (task instanceof FormData) {
    return this.http.put(`${this.baseUrl}/UpdateAssignWork/${id}`, task);
  } else {
    return this.http.put(`${this.baseUrl}/UpdateAssignWork/${id}`, task, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
  deleteAssignment(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/DeleteAssignWork/${id}`);
  }

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetUsers`);
  }

// upload document service need here

//get

// Document-related services
  getDocument(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/getDocument`);
  }

  createDocument(task: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/createDocument`, task);
  }

  updateDocument(id: string, task: FormData): Observable<any> {
    return this.http.put(`${this.baseUrl}/updateDocument/${id}`, task);
  }

  deleteDocument(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/deleteDocument/${id}`);
  }

  deleteFile(documentId: string, fileName: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/deleteFile/${documentId}/${encodeURIComponent(fileName)}`);
  }


  //user-view

//     getUserview():Observable<any>{
//     return this.http.get<any>('${this.baseUrl}/getAssignWorkByProject/:projectName/:assignedTo')
// }

getUserview(projectName: string, assignedTo: string): Observable<UserViewResponse> {
    return this.http.get<UserViewResponse>(`${this.baseUrl}/getAssignWorkByProject/${encodeURIComponent(projectName)}`);
  }

  //GetAssignWork

// GetAssignWork
getAssignments(): Observable<UserViewResponse> {
  console.log('Fetching assignments from:', `${this.baseUrl}/GetAssignWork`);
  return this.http.get<UserViewResponse>(`${this.baseUrl}/GetAssignWork`);
}

  
}
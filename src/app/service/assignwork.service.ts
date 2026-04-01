import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface AssignWork {
status: any;
  _id?: string;

  title: string;
  description: string;
  comment: Comment[];
  assignedTo: string;
  assignee: string;
  startDate: any;
  dueDate: string;
  Status: string;    
  projectId: string;
  projectName?: string;
  subTask?: AssignWorkSubTask[];
  pictures:string;
  createdAt: string;
}

export interface AssignWorkSubTask {
  title?: string;
  description?: string;
  StartDate?: string | Date;
  EndDate?: string | Date;
  assignee?: string;
  assignedTo?: string;
  Status?: string;
  NoOfDays?: string;
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
  constructor(private http: HttpClient, private configService: ConfigService) {}

createAssignment(task: FormData | any): Observable<any> {
  if (task instanceof FormData) {
    return this.http.post(this.configService.getWebsiteUrl('CreateAssignWork'), task);
  } else {
    return this.http.post(this.configService.getWebsiteUrl('CreateAssignWork'), task);
  }
}


 updateAssignment(id: string, task: FormData | any): Observable<any> {
  if (task instanceof FormData) {
    return this.http.put(`${this.configService.getWebsiteUrl('UpdateAssignWork')}/${id}`, task);
  } else {
    return this.http.put(`${this.configService.getWebsiteUrl('UpdateAssignWork')}/${id}`, task, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
  deleteAssignment(id: string): Observable<any> {
    return this.http.delete(`${this.configService.getWebsiteUrl('DeleteAssignWork')}/${id}`);
  }

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(this.configService.getWebsiteUrl('GetUsers'));
  }

// upload document service need here

//get

// Document-related services
  getDocument(): Observable<any> {
    return this.http.get<any>(this.configService.getWebsiteUrl('getDocument'));
  }

  createDocument(task: FormData): Observable<any> {
    return this.http.post<any>(this.configService.getWebsiteUrl('createDocument'), task);
  }

  updateDocument(id: string, task: FormData): Observable<any> {
    return this.http.put(`${this.configService.getWebsiteUrl('updateDocument')}/${id}`, task);
  }

  deleteDocument(id: string): Observable<any> {
    return this.http.delete(`${this.configService.getWebsiteUrl('deleteDocument')}/${id}`);
  }

  deleteFile(documentId: string, fileName: string): Observable<any> {
    return this.http.delete(`${this.configService.getWebsiteUrl('deleteFile')}/${documentId}/${encodeURIComponent(fileName)}`);
  }


  //user-view

//     getUserview():Observable<any>{
//     return this.http.get<any>('${this.baseUrl}/getAssignWorkByProject/:projectName/:assignedTo')
// }

getUserview(projectName: string, assignedTo: string): Observable<UserViewResponse> {
    return this.http.get<UserViewResponse>(`${this.configService.getWebsiteUrl('getAssignWorkByProject')}/${encodeURIComponent(projectName)}`);
  }

  //GetAssignWork

// GetAssignWork
getAssignments(): Observable<UserViewResponse> {
  console.log('Fetching assignments from:', this.configService.getWebsiteUrl('GetAssignWork'));
  return this.http.get<UserViewResponse>(this.configService.getWebsiteUrl('GetAssignWork'));
}

  
}

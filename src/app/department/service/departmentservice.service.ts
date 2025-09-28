import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from '../../service/config.service';


export interface Department {
  _id?: string;
  departmentName: string;
  subDepartments?: { name: string; _id?: string; createdAt?: string; updatedAt?: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SubDepartmentPayload {
  subDepartments: string[];
}

export interface DepartmentResponse {
  message: string;
  department?: Department;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentserviceService {
  private apiUrl = 'http://localhost:3008';
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  private getdmapi = `${this.apiUrl}/getDepartment`;
  private savedmapi = `${this.apiUrl}/createDepartment`;
  private editdmapi = `${this.apiUrl}/updateDepartment`;
  private deletedmapi = `${this.apiUrl}/deleteDepartment`;
  private savesubdmapi = `${this.apiUrl}/addSubdepartments`;
  private editsubdmap1 = `${this.apiUrl}/updateSubdepartments`;
  private deletesubdmapi = `${this.apiUrl}/deleteSubdepartments`;

  constructor(private http: HttpClient, private config : ConfigService ) {}

  // loaddm(): Observable<Department[]> {
  //   return this.httpdepartment.get<Department[]>(this.getdmapi).pipe(
  //     catchError(error => {
  //       console.error('Error fetching departments:', {
  //         status: error.status,
  //         statusText: error.statusText,
  //         message: error.message,
  //         url: error.url,
  //         response: error.error
  //       });
  //       return throwError(() => new Error(error.message || 'Failed to fetch departments'));
  //     })
  //   );
  // }

  // savedm(department: { departmentName: string }): Observable<DepartmentResponse> {
  //   console.log('Sending POST request to:', this.savedmapi, 'with payload:', department);
  //   return this.httpdepartment.post<DepartmentResponse>(this.savedmapi, department, this.httpOptions).pipe(
  //     catchError(error => {
  //       console.error('Error saving department:', {
  //         status: error.status,
  //         statusText: error.statusText,
  //         message: error.message,
  //         url: error.url,
  //         payload: department,
  //         response: error.error
  //       });
  //       return throwError(() => new Error(error.message || 'Failed to save department'));
  //     })
  //   );
  // }

  // editdm(id: string, data: { departmentName: string }): Observable<DepartmentResponse> {
  //   console.log('Sending PUT request to:', `${this.editdmapi}/${id}`, 'with payload:', data);
  //   return this.httpdepartment.put<DepartmentResponse>(`${this.editdmapi}/${id}`, data, this.httpOptions).pipe(
  //     catchError(error => {
  //       console.error('Error updating department:', {
  //         status: error.status,
  //         statusText: error.statusText,
  //         message: error.message,
  //         url: error.url,
  //         payload: data,
  //         response: error.error
  //       });
  //       return throwError(() => new Error(error.message || 'Failed to update department'));
  //     })
  //   );
  // }

  // deletedm(id: string): Observable<{ message: string }> {
  //   console.log('Sending DELETE request to:', `${this.deletedmapi}/${id}`);
  //   return this.httpdepartment.delete<{ message: string }>(`${this.deletedmapi}/${id}`, this.httpOptions).pipe(
  //     catchError(error => {
  //       console.error('Error deleting department:', {
  //         status: error.status,
  //         statusText: error.statusText,
  //         message: error.message,
  //         url: error.url,
  //         response: error.error
  //       });
  //       return throwError(() => new Error(error.message || 'Failed to delete department'));
  //     })
  //   );
  // }

  // addSubDepartment(deptId: string, data: SubDepartmentPayload): Observable<DepartmentResponse> {
  //   console.log('Sending POST request to:', `${this.savesubdmapi}/${deptId}`, 'with payload:', data);
  //   return this.httpdepartment.post<DepartmentResponse>(`${this.savesubdmapi}/${deptId}`, data, this.httpOptions).pipe(
  //     catchError(error => {
  //       console.error('Error adding subdepartment:', {
  //         status: error.status,
  //         statusText: error.statusText,
  //         message: error.message,
  //         url: error.url,
  //         payload: data,
  //         response: error.error
  //       });
  //       return throwError(() => new Error(error.message || 'Failed to add subdepartment'));
  //     })
  //   );
  // }

  // updateSubDepartment(subId: string, data: { name: string }): Observable<DepartmentResponse> {
  //   console.log('Sending PUT request to:', `${this.editsubdmap1}/${subId}`, 'with payload:', data);
  //   return this.httpdepartment.put<DepartmentResponse>(`${this.editsubdmap1}/${subId}`, data, this.httpOptions).pipe(
  //     catchError(error => {
  //       console.error('Error updating subdepartment:', {
  //         status: error.status,
  //         statusText: error.statusText,
  //         message: error.message,
  //         url: error.url,
  //         payload: data,
  //         response: error.error
  //       });
  //       return throwError(() => new Error(error.message || 'Failed to update subdepartment'));
  //     })
  //   );
  // }

  // deleteSubDepartment(subId: string): Observable<{ message: string; department?: Department }> {
  //   console.log('Sending DELETE request to:', `${this.deletesubdmapi}/${subId}`);
  //   return this.httpdepartment.delete<{ message: string; department?: Department }>(`${this.deletesubdmapi}/${subId}`, this.httpOptions).pipe(
  //     catchError(error => {
  //       console.error('Error deleting subdepartment:', {
  //         status: error.status,
  //         statusText: error.statusText,
  //         message: error.message,
  //         url: error.url,
  //         response: error.error
  //       });
  //       return throwError(() => new Error(error.message || 'Failed to delete subdepartment'));
  //     })
  //   );
  // }


loaddm(): Observable<Department[]> {
    return this.http.get<Department[]>(this.config.getWebsiteUrl('getDepartment')).pipe(
      catchError(error => {
        console.error('Error fetching departments:', error);
        return throwError(() => new Error(error.message || 'Failed to fetch departments'));
      })
    );
  }

  savedm(department: { departmentName: string }): Observable<DepartmentResponse> {
    return this.http.post<DepartmentResponse>(this.config.getWebsiteUrl('createDepartment'), department, this.httpOptions).pipe(
      catchError(error => {
        console.error('Error saving department:', error);
        return throwError(() => new Error(error.message || 'Failed to save department'));
      })
    );
  }

  editdm(id: string, data: { departmentName: string }): Observable<DepartmentResponse> {
    return this.http.put<DepartmentResponse>(`${this.config.getWebsiteUrl('updateDepartment')}/${id}`, data, this.httpOptions).pipe(
      catchError(error => {
        console.error('Error updating department:', error);
        return throwError(() => new Error(error.message || 'Failed to update department'));
      })
    );
  }

  deletedm(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.config.getWebsiteUrl('deleteDepartment')}/${id}`, this.httpOptions).pipe(
      catchError(error => {
        console.error('Error deleting department:', error);
        return throwError(() => new Error(error.message || 'Failed to delete department'));
      })
    );
  }

  addSubDepartment(deptId: string, data: SubDepartmentPayload): Observable<DepartmentResponse> {
    return this.http.post<DepartmentResponse>(`${this.config.getWebsiteUrl('addSubdepartments')}/${deptId}`, data, this.httpOptions).pipe(
      catchError(error => {
        console.error('Error adding subdepartment:', error);
        return throwError(() => new Error(error.message || 'Failed to add subdepartment'));
      })
    );
  }

  updateSubDepartment(subId: string, data: { name: string }): Observable<DepartmentResponse> {
    return this.http.put<DepartmentResponse>(`${this.config.getWebsiteUrl('updateSubdepartments')}/${subId}`, data, this.httpOptions).pipe(
      catchError(error => {
        console.error('Error updating subdepartment:', error);
        return throwError(() => new Error(error.message || 'Failed to update subdepartment'));
      })
    );
  }

  deleteSubDepartment(subId: string): Observable<{ message: string; department?: Department }> {
    return this.http.delete<{ message: string; department?: Department }>(`${this.config.getWebsiteUrl('deleteSubdepartments')}/${subId}`, this.httpOptions).pipe(
      catchError(error => {
        console.error('Error deleting subdepartment:', error);
        return throwError(() => new Error(error.message || 'Failed to delete subdepartment'));
      })
    );
  }












}
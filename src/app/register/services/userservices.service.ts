import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface User {
  _id?: string;
  userCode?: string;
  name?: string;
  userName?: string;
  emailId?: string;
  phoneNumber?: string;
  role?: string;
  departmentName?: string;
  subDepartmentName?: string;
  photo?: string;
  photoURL?: string;
  // Add other user properties as needed
}

@Injectable({ providedIn: 'root' })
export class UserservicesService {
  constructor(private httpuser: HttpClient) {}

  private getuserapi = 'http://localhost:3008/getUser';
  private saveuserapi = 'http://localhost:3008/createUser';
  private edituserapi = 'http://localhost:3008/updateUser';
  private deleteuserapi = 'http://localhost:3008/deleteUser';

  getuser(): Observable<User[]> {
    return this.httpuser.get<User[]>(this.getuserapi);
  }

  saveuser(formData: FormData): Observable<any> {
    return this.httpuser.post(this.saveuserapi, formData);
  }

  edituser(_id: any, formData: FormData): Observable<any> {
    return this.httpuser.put(`${this.edituserapi}/${_id}`, formData);
  }

  deleteuser(_id: any): Observable<any> {
    return this.httpuser.delete(`${this.deleteuserapi}/${_id}`);
  }
}
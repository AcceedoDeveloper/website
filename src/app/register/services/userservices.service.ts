import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../service/config.service';

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
}

@Injectable({ providedIn: 'root' })
export class UserservicesService {
  constructor(private http: HttpClient, private config : ConfigService) {}

  private getuserapi = 'http://localhost:3008/getUser';
  private saveuserapi = 'http://localhost:3008/createUser';
  private edituserapi = 'http://localhost:3008/updateUser';
  private deleteuserapi = 'http://localhost:3008/deleteUser';

  // getuser(): Observable<User[]> {
  //   const timestamp = new Date().getTime();
  //   return this.httpuser.get<User[]>(`${this.getuserapi}?t=${timestamp}`);
  // }

  // saveuser(formData: FormData): Observable<any> {
  //   return this.httpuser.post(this.saveuserapi, formData);
  // }

  // edituser(_id: any, formData: FormData): Observable<any> {
  //   return this.httpuser.put(`${this.edituserapi}/${_id}`, formData);
  // }

  // deleteuser(_id: any): Observable<any> {
  //   return this.httpuser.delete(`${this.deleteuserapi}/${_id}`);
  // }


  getuser(): Observable<User[]> {
    const url = this.config.getWebsiteUrl('getUser');
    const timestamp = new Date().getTime();
    return this.http.get<User[]>(`${url}?t=${timestamp}`);
  }

  saveuser(formData: FormData): Observable<any> {
    const url = this.config.getWebsiteUrl('createUser');
    return this.http.post(url, formData);
  }

  edituser(_id: any, formData: FormData): Observable<any> {
    const url = this.config.getWebsiteUrl('updateUser');
    return this.http.put(`${url}/${_id}`, formData);
  }

  deleteuser(_id: any): Observable<any> {
    const url = this.config.getWebsiteUrl('deleteUser');
    return this.http.delete(`${url}/${_id}`);
  }


}
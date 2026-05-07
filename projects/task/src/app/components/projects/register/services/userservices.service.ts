import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { ConfigService } from '../../../../services/service/config.service';
import { Permission } from '../../../permission/permission';

export interface User {
  _id?: string;
  userCode?: string;
  userName?: string;
  UserName?: string;
  emailId?: string;
  phoneNumber?: string;
  role?: string;
  departmentName?: string;
  subDepartmentName?: string;
  photo?: string;
  photoURL?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserservicesService {

  // ================= USER STATE =================
  private userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  // ================= STORAGE =================
  private getUserFromStorage(): User | null {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  private saveUserToStorage(user: User) {
    sessionStorage.setItem('user', JSON.stringify(user));
  }

  // ================= GLOBAL USER =================
  setUser(user: User) {
    this.saveUserToStorage(user);
    this.userSubject.next(user);
  }

  getUser(): User | null {
    return this.userSubject.value;
  }

  // ================= API CALLS =================

  /** GET ALL USERS */
  getuser(): Observable<User[]> {
    const url = this.config.getWebsiteUrl('getUser');
    const timestamp = new Date().getTime();

    return this.http.get<User[]>(`${url}?t=${timestamp}`);
  }

  /** CREATE USER */
  saveuser(formData: FormData): Observable<any> {
    const url = this.config.getWebsiteUrl('createUser');
    return this.http.post(url, formData);
  }

  /** UPDATE USER (PROFILE EDIT) */
  edituser(_id: string, formData: FormData): Observable<User> {
    const url = this.config.getWebsiteUrl('updateUser');

    return this.http.put<User>(`${url}/${_id}`, formData).pipe(
      tap((updatedUser) => {
        this.setUser(updatedUser);
      })
    );
  }

  /** DELETE USER */
  deleteuser(_id: string): Observable<any> {
    const url = this.config.getWebsiteUrl('deleteUser');
    return this.http.delete(`${url}/${_id}`);
  }

 //permission 
 createPermission(permissionData:Permission):Observable<Permission>{
  const url =this.config.getWebsiteUrl('createPermission');
  return this.http.post<Permission>(url,permissionData);
 }

getPermissions(): Observable<Permission[]> {
  const url = this.config.getWebsiteUrl('getPermissions');
  return this.http.get<Permission[]>(url);
}

 updatePermission(_id:string,permissionData:Permission):Observable<Permission>{
  const url =this.config.getWebsiteUrl('updatePermission');
  return this.http.put<Permission>(`${url}/${_id}`,permissionData);
 }

 deletePermission(_id:string):Observable<any>{
  const url =this.config.getWebsiteUrl('deletePermission');
  return this.http.delete(`${url}/${_id}`);
 }
}
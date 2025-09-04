import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class UserservicesService {
  constructor(private httpuser: HttpClient) {}

  private getuserapi = 'http://localhost:3008/getUser';
  private saveuserapi = 'http://localhost:3008/createUser';
  private edituserapi = 'http://localhost:3008/updateUser';
  private deleteuserapi = 'http://localhost:3008/deleteUser';

  getuser() {
    return this.httpuser.get(this.getuserapi);
  }

  saveuser(data: any) {
    return this.httpuser.post(this.saveuserapi, data);
  }

  edituser(_id: any, data: any) {
    return this.httpuser.put(`${this.edituserapi}/${_id}`, data);
  }

  deleteuser(_id: any) {
    return this.httpuser.delete(`${this.deleteuserapi}/${_id}`);
  }
}

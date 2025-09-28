import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class RoleserviceService {
  private getroleapi = 'http://localhost:3008/getrole';
  private saveroleapi = 'http://localhost:3008/createRole';
  private editroleapi = 'http://localhost:3008/updaterole';
  private deleteroleapi = 'http://localhost:3008/deleterole'; // Corrected from `:id`

  constructor(private http: HttpClient, private config : ConfigService) {}

  // // Get roles
  // Loadrole() {
  //   return this.httprole.get(this.getroleapi);
  // }

  // // Save role
  // saverole(roleform: any) {
  //   console.log('Sending POST request to:', this.saveroleapi, 'with payload:', roleform);
  //   return this.httprole.post(this.saveroleapi, roleform);
  // }

  // // Update role
  // edirole(_id: any, data: any) {
  //   console.log('Sending PUT request to:', `${this.editroleapi}/${_id}`, 'with payload:', data);
  //   return this.httprole.put(`${this.editroleapi}/${_id}`, data);
  // }

  // // Delete role
  // deleterole(_id: any) {
  //   console.log('Sending DELETE request to:', `${this.deleteroleapi}/${_id}`);
  //   return this.httprole.delete(`${this.deleteroleapi}/${_id}`);
  // }

  Loadrole() {
    const url = this.config.getWebsiteUrl('getRole');
    return this.http.get(url);
  }

  // Save role
  saverole(roleform: any) {
    const url = this.config.getWebsiteUrl('createRole');
    console.log('Sending POST request to:', url, 'with payload:', roleform);
    return this.http.post(url, roleform);
  }

  // Update role
  edirole(_id: any, data: any) {
    const url = this.config.getWebsiteUrl('updateRole');
    console.log('Sending PUT request to:', `${url}/${_id}`, 'with payload:', data);
    return this.http.put(`${url}/${_id}`, data);
  }

  // Delete role
  deleterole(_id: any) {
    const url = this.config.getWebsiteUrl('deleteRole');
    console.log('Sending DELETE request to:', `${url}/${_id}`);
    return this.http.delete(`${url}/${_id}`);
  }
}
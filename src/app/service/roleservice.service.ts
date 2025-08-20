import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RoleserviceService {
  private getroleapi = 'http://localhost:3008/getrole';
  private saveroleapi = 'http://localhost:3008/createRole';
  private editroleapi = 'http://localhost:3008/updaterole';
  private deleteroleapi = 'http://localhost:3008/deleterole'; // Corrected from `:id`

  constructor(private httprole: HttpClient) {}

  // Get roles
  Loadrole() {
    return this.httprole.get(this.getroleapi);
  }

  // Save role
  saverole(roleform: any) {
    console.log('Sending POST request to:', this.saveroleapi, 'with payload:', roleform);
    return this.httprole.post(this.saveroleapi, roleform);
  }

  // Update role
  edirole(_id: any, data: any) {
    console.log('Sending PUT request to:', `${this.editroleapi}/${_id}`, 'with payload:', data);
    return this.httprole.put(`${this.editroleapi}/${_id}`, data);
  }

  // Delete role
  deleterole(_id: any) {
    console.log('Sending DELETE request to:', `${this.deleteroleapi}/${_id}`);
    return this.httprole.delete(`${this.deleteroleapi}/${_id}`);
  }
}
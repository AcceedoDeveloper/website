import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface ContactPayload {
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  createContact(payload: ContactPayload): Observable<any> {
    return this.http.post(this.config.getWebsiteUrl('createContact'), payload);
  }

  getContacts(): Observable<any> {
    return this.http.get(this.config.getWebsiteUrl('getContacts'));
  }
}

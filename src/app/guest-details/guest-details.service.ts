import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../service/config.service';

export interface GuestDetails {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  purpose?: string;
  source?: string;
  createdAt?: string;
  lastEmailSentAt?: string | null;
}

// Fields the admin Add / Edit form sends.
export interface GuestFormPayload {
  name: string;
  email: string;
  phone: string;
  purpose: string;
}

@Injectable({
  providedIn: 'root'
})
export class GuestDetailsService {


  constructor(private http: HttpClient, private config: ConfigService) {}

  private getAuthHeaders(): HttpHeaders | undefined {

    const token = sessionStorage.getItem('token') || '';

    return token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      : undefined;
  }

  saveGuest(payload: GuestDetails): Observable<any> {
    return this.http.post(
      `${this.config.getWebsiteUrl('createGuest')}`,
      payload
    );
  }

  getGuests(): Observable<GuestDetails[]> {

    return this.http.get<GuestDetails[]>(
      `${this.config.getWebsiteUrl('getGuests')}`,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteGuest(id: string): Observable<any> {

    return this.http.delete(
      `${this.config.getWebsiteUrl('deleteGuest')}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Admin: add a guest manually (saved only, no email sent).
  addGuest(payload: GuestFormPayload): Observable<any> {

    return this.http.post(
      `${this.config.getWebsiteUrl('addGuest')}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  // Admin: edit a guest.
  updateGuest(id: string, payload: GuestFormPayload): Observable<any> {

    return this.http.put(
      `${this.config.getWebsiteUrl('updateGuest')}/${id}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  // Admin: send the thank-you email (with brochure) to a guest.
  sendGuestMail(id: string): Observable<any> {

    return this.http.post(
      `${this.config.getWebsiteUrl('sendGuestMail')}/${id}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CareerData } from './careers.component'; // adjust path as needed
import { ConfigService } from '../service/config.service';

@Injectable({
  providedIn: 'root'
})
export class CareersService {
  constructor(private http: HttpClient,private config: ConfigService) { }
  //private baseUrl = 'http://localhost:3008/api';
  getAllCareers() {
    const url = this.config.getWebsiteUrl('getJobs');
    return this.http.get<CareerData[]>(url);
  }
  createCareer(payload: Partial<CareerData>) {
    const url = this.config.getWebsiteUrl('createJob');
    return this.http.post<CareerData>(url, payload);
  }
  updateCareer(id: string, payload: Partial<CareerData>) {
    const url = this.config.getWebsiteUrl('updateJob');
    return this.http.put<CareerData>(`${url}/${id}`, payload);
  }
  deleteCareer(id: string) {
    const url = this.config.getWebsiteUrl('deleteJob');
    return this.http.delete<void>(`${url}/${id}`);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CareerData } from './careers.component'; // adjust path as needed

@Injectable({
  providedIn: 'root'
})
export class CareersService {



  constructor(private http: HttpClient) {}

 private baseUrl = 'http://localhost:3008/api';

getAllCareers() {
  return this.http.get<CareerData[]>(`${this.baseUrl}/getJobs`);
}
createCareer(payload: Partial<CareerData>) {
  return this.http.post<CareerData>(`${this.baseUrl}/createJob`, payload);
}
updateCareer(id: string, payload: Partial<CareerData>) {
  return this.http.put<CareerData>(`${this.baseUrl}/updateJob/${id}`, payload);
}
deleteCareer(id: string) {
  return this.http.delete<void>(`${this.baseUrl}/deleteJob/${id}`);
}
}
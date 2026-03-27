import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClickToCallService {
  private readonly apiUrl = 'https://projectsapi.lpu.in/clicktocall/api/CTC/';


  constructor(private http: HttpClient) {}

  getAvailableDates(): Observable<any> {
    return this.http.get(`${this.apiUrl}ClicktocallDates`);
  }

  makeCall(requestData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}makecall`, requestData);
  }

  scheduleCall(requestData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}ScheduleCall`, requestData);
  }
}


























































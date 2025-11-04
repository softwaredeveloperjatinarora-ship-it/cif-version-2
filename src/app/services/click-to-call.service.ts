import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClickToCallService {
  private readonly apiUrl = 'https://websiteapi.lpu.in/clicktocall/api/CTC/';

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


// import { Injectable, inject, PLATFORM_ID } from '@angular/core';
// import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// import { isPlatformServer } from '@angular/common';
// import { TransferState, makeStateKey } from '@angular/core';
// import { Observable, of, throwError } from 'rxjs';
// import { tap, retry, catchError } from 'rxjs/operators';

// const DATES_KEY = makeStateKey<any>('click-to-call-dates');

// @Injectable({
//   providedIn: 'root',
// })
// export class ClickToCallService {
//   private readonly apiUrl = 'https://websiteapi.lpu.in/clicktocall/api/CTC/';

//   private http = inject(HttpClient);
//   private transferState = inject(TransferState);
//   private platformId = inject(PLATFORM_ID);

//   getAvailableDates(): Observable<any> {
//     const isServer = isPlatformServer(this.platformId);
//     const cached = this.transferState.get(DATES_KEY, null);

//     if (cached) {
//       return of(cached);
//     }

//     return this.http.get(`${this.apiUrl}ClicktocallDates`).pipe(
//       retry(2),
//       tap(data => {
//         if (isServer) {
//           this.transferState.set(DATES_KEY, data);
//         }
//       }),
//       catchError(this.handleError)
//     );
//   }

//   makeCall(requestData: any): Observable<any> {
//     return this.http.post(`${this.apiUrl}makecall`, requestData).pipe(
//       catchError(this.handleError)
//     );
//   }

//   scheduleCall(requestData: any): Observable<any> {
//     return this.http.post(`${this.apiUrl}ScheduleCall`, requestData).pipe(
//       catchError(this.handleError)
//     );
//   }

//   private handleError(error: HttpErrorResponse) {
//     console.error('API Error:', error);
//     return throwError(() => new Error('Something went wrong. Please try again later.'));
//   }
// }

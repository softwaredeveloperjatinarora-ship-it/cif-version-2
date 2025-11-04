import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders , HttpResponse} from '@angular/common/http';
import { Observable, catchError, switchMap, tap, throwError } from 'rxjs';
import { StorageService } from './storage.service';
@Injectable({
  providedIn: 'root'
})
export class CohortnetworkService {
  authToken : any;
  constructor(private http: HttpClient, private storageService: StorageService) { }
  getData(url: any)  {
    // console.log('url:  ' +  url);
    return this.http.get<HttpResponse<any>>( url); 
  }
//   getRoadmap(url: string) : Observable<HttpResponse<any>> {
//     console.log('url: ' + url);
//     this.getTokenFromAPI();
//     const authToken = localStorage.getItem('authToken'); 
//     console.log( "token", authToken)// Retrieve the authToken from local storage
//     const headers = new HttpHeaders({
//       Authorization:  `Bearer ${authToken}`
//     });
//     return this.http.get<HttpResponse<any>>(url, { headers });
//   }
//   getTokenFromAPI(){
//     const apiUrl = 'http://172.17.133.124:220/security/createCommonToken';
//     const userName = '12220779';
//     // 12214922'
//     // 12220779
//     this.http.post(apiUrl, { userName }).subscribe(
//       (response: any) => {
//        this.authToken = response;
//       console.log ('Authentication token stored successfully!' , this.authToken);
//       localStorage.clear(); 
//       localStorage.setItem('authToken', this.authToken);
//       (error: any) => {
//         console.error('Error while retrieving authentication token:', error);
//       }
//     }
//     );
//   }
  
// }

postWithAuth(url: any, param ?: any): Observable<HttpResponse<any>> {
  console.log('url: ' + url);

      const authToken = this.storageService.getUser();
      console.log("token", authToken);
      const headers = new HttpHeaders({
        Authorization: `Bearer ${authToken}`
      });
      return this.http.post<HttpResponse<any>>(url, param, { headers });
    
  
}

getRoadmap(url: string): Observable<HttpResponse<any>> {
  console.log('url: ' + url);
 
  
      const authToken =   this.storageService.getUser();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${authToken}`
      });
      return this.http.get<HttpResponse<any>>(url, { headers });
    
}

// getTokenFromAPI(): Observable<void> {
//   const apiUrl = 'https://projectsapi.lpu.in/security/createCommonToken';
//   const userName  = '12219848';
//   // 12219848
//   return this.http.post(apiUrl, { userName }).pipe(
//     tap((response: any) => {
//       this.authToken = response;
//       localStorage.clear();
//       localStorage.setItem('authToken', this.authToken);
//     }),
//     catchError((error: any) => {
//       console.error('Error while retrieving authentication token:', error);
//       return throwError(error);
//     })
//   );
// }
}

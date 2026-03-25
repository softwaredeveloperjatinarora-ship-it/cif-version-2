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

    return this.http.get<HttpResponse<any>>( url); 
  }



























  


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

















}

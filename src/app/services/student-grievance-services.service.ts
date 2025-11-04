import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';

const AUTH_API = 'https://projectsapi.lpu.in/';


@Injectable({
  providedIn: 'root'
})
export class StudentGrievanceServicesService {

  constructor(private http: HttpClient,private storageService: StorageService) {}

  
  GetAllStudentsCases(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 
    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.get(
      AUTH_API + 'api/StudentGrievance/Get',
     {headers}
    );
  }

}

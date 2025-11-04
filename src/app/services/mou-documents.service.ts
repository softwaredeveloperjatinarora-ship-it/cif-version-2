import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// import { environment } from 'src/environments/environment';

import { StorageService } from './storage.service';
const AUTH_API = 'https://projectsapi.lpu.in/';//'https://projectsapi.lpu.in/'; //'https://projectsapi.lpu.in/';
const AUTH_API_LOCAL = 'https://projectsapi.lpu.in/';

@Injectable({
  providedIn: 'root'
})
@Injectable({
  providedIn: 'root'
})
export class MouDocumentsService {
  FileData: string | undefined;
  fileName: string | undefined;

  constructor(private http: HttpClient, private storageService: StorageService) { }
  // private Localtoken = environment.authToken;

  GetEmployeeDetails(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
   .set('Authorization', 'Bearer ' + token)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetEmployeeDetails',
     {headers}
    );
  }
  GetAdminEmployeeDetails(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
   .set('Authorization', 'Bearer ' + token)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetEmployeeDetails',
     {headers}
    );
  }


  MouDocumentUpload(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouDocumentInsert',
      dataSoft,
      { headers }
    );
  }

  GetAllUploadedDocuments(): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
   .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetAllUploadedDocuments',
     {headers}
    );
  }
  ApproveDocument(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
   .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      AUTH_API + 'api/Mou/ApprovalAction',
      dataSoft,
      { headers });
      // // Create an HttpHeaders object with the Authorization header
      //// debugger
      // let headers = new HttpHeaders()
      //   .set('Authorization', 'Bearer ' + this.authToken)
  }


  MouDocumentUpdateFile(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouDocumentUpdateFile',
      dataSoft,
      { headers }
    );
  }

  GetUIDWiseUploadedDocuments(Id: any): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
   .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    .set('Content-Type', 'application/json');
    return this.http.get(AUTH_API + 'api/Mou/GetUIDWiseMouDocumentDetails?Uid=' + Id, {headers});
    // return this.http.get(
    //   AUTH_API + 'api/Mou/GetUIDWiseMouDocumentDetails?Uid=' + Id,
    //  {headers}
    // );
  }

  MouActivityInsert(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouActivityInsert',
      dataSoft,
      { headers }
    );
  }

  GetUIDWiseMouActivityDetails(Id: any): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
   .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    .set('Content-Type', 'application/json');
    return this.http.get(AUTH_API + 'api/Mou/GetUIDWiseMouActivityDetails?Uid=' + Id, {headers});
    // return this.http.get(
    //   AUTH_API + 'api/Mou/GetUIDWiseMouDocumentDetails?Uid=' + Id,
    //  {headers}
    // );
  }

  GetAllUploadedActivities(): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
   .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    .set('Content-Type', 'application/json');
    return this.http.get(AUTH_API + 'api/Mou/GetAllMouActivityDetails', {headers});
  }

  MouActivityUpdateFile(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouActivityUpdateFile',
      dataSoft,
      { headers }
    );
  }

  ApproveActivity(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      AUTH_API + 'api/Mou/ActivityApprovalAction',
      dataSoft,
      { headers }
    );
      // // Create an HttpHeaders object with the Authorization header
      //// debugger
      // let headers = new HttpHeaders()
      //   .set('Authorization', 'Bearer ' + this.authToken)
  }

  GetEmployeeData(): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
   .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetAllEmployeeData',
     {headers}
    );
  }
  MouDocumentsforApproval(EmployeeCode: any): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetMouDocumentsforApproval?Uid=' + EmployeeCode,
     {headers}
    );
  }

  MouNewActivityPlanAddNew(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouNewActivityPlan',
      dataSoft,
      { headers }
    );
      // // Create an HttpHeaders object with the Authorization header
      //// debugger
      // let headers = new HttpHeaders()
      //   .set('Authorization', 'Bearer ' + this.authToken)
  }
  InsertMouActivityActionTaken(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouActivityActionTakenInsert',
      dataSoft,
      { headers }
    );
      // // Create an HttpHeaders object with the Authorization header
      //// debugger
      // let headers = new HttpHeaders()
      //   .set('Authorization', 'Bearer ' + this.authToken)
  }
  MouDocumentstoTakeAction(Uid: any): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
   .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetMouDocumentstoTakeAction?Uid=' + Uid,
     {headers}
    );
  }


  MouActionsTakenData(Uid: any): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
   .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetMouActivityActionTaken?Uid=' + Uid,
     {headers}
    );
  }
  ApproveMouActionTakenDocument(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouActionTakenDocumentApproval',
      dataSoft,
      { headers }
    );
      // // Create an HttpHeaders object with the Authorization header
      //// debugger
      // let headers = new HttpHeaders()
      //   .set('Authorization', 'Bearer ' + this.authToken)
  }

  MOUGetAllActivitiesAssigned(EmployeeCode: any): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetAllActivitiesAssigned?Uid=' + EmployeeCode,
     {headers}
    );
  }

  UpdateSchoolDivision(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
   .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouUpdateSchoolInvolved',
      dataSoft,
      { headers });
      // // Create an HttpHeaders object with the Authorization header
      //// debugger
      // let headers = new HttpHeaders()
      //   .set('Authorization', 'Bearer ' + this.authToken)
  }

}

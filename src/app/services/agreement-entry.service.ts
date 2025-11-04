import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';

const AUTH_API = 'https://projectsapi.lpu.in/';


@Injectable({
  providedIn: 'root'
})
export class AgreementEntryService {

  constructor(private http: HttpClient,private storageService: StorageService) {}

  getRunningSession(): Observable<any> {
   // debugger
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 

    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.get(
      AUTH_API + 'api/Planning/GetRunningSession',
     {headers}
    );
  }

  getCollabArea(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 

    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.get(
      AUTH_API + 'api/Planning/GetIndustryInterfaceMainBroadAreas',
     {headers}
    );
  }

  getMetricBySessionID(type:any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 

    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.get(
      AUTH_API + 'api/Planning/GetMetricBySessionId?sessionId='+type,
     {headers}
    );
  }

  //AreaofCollaboration
  getActivityByAoC(dataSoft:any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 
    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.post(
      AUTH_API + 'api/Planning/GetAreaofCollaboration',dataSoft,
     {headers}
    );
  }

  getActivityByAoCCollab(dataSoft:any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 
    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.post(
      AUTH_API + 'api/Planning/GetAreaofCollaborationByActivityId',dataSoft,
     {headers}
    );
  }

  
  getSchoolsAndDivisionInvolved(type:any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 
    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.get(
      AUTH_API + 'api/Planning/GetSchoolandDivisions?type='+type,
     {headers}
    );
  }

  getDisplayAllemployee(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 

    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.get(
      AUTH_API + 'api/Planning/GetDisplayAllemployee',
     {headers}
    );
  }

  getDisplayAllemployeeByUID(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 

    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.get(
      AUTH_API + 'api/Planning/GetDisplayemployeeByHeadUID',
     {headers}
    );
  }


  getDisplayAllemployeeByNormalUID(empCode:any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 

    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.get(
      AUTH_API + 'api/Planning/GetDisplayemployeeByEmpDepartment?empCode='+empCode,
     {headers}
    );
  }

  

  geteGovDivisionMaster(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 

    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.get(
      AUTH_API + 'api/Planning/GeteGovDivisionMaster',
     {headers}
    );
  }


  addMouEntryforApproval(dataSoft:FormData): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Accept', '*/*',);

    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.post(
      AUTH_API + 'api/Planning/AddMouAgreementMaster',dataSoft,
     {headers}
    );
  }



  addMouEntry(dataSoft:any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Accept', '*/*',);

    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.post(
      AUTH_API + 'api/Planning/AddMouAgreementBasicDetails',dataSoft,
     {headers}
    );
  }



  updateSGRCCases(dataSoft:any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Accept', '*/*',);

    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.post(
      AUTH_API + 'api/StudentGrievance/AddStudentGrievanceRemarks',dataSoft,
     {headers}
    );
  }


  addMouActivityPlannedEntry(dataSoft:any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Accept', '*/*',);

    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.post(
      AUTH_API + 'api/Planning/AddMouAgreementPlannedActivity',dataSoft,
     {headers}
    );
  }


  getMouAgreementMaster(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 

    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.get(
      AUTH_API + 'api/Planning/GetMouAgreementMaster',
     {headers}
    );
  }

  getMouAgreementMasterCreatedby(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 

    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.get(
      AUTH_API + 'api/Planning/GetMouAgreementMasterCreatedby',
     {headers}
    );
  }


  updateMouApprovalSTatus(dataSoft:any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 
    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.post(
      AUTH_API + 'api/Planning/UpdateMouAgreementMaster',dataSoft,
     {headers}
    );
  }


  verifyMouData(dataSoft:any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 
    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.post(
      AUTH_API + 'api/Planning/VerifyMouNotingSheet',dataSoft,
     {headers}
    );
  }

  getverifyMouNotingData(dataSoft:any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 
    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.post(
      AUTH_API + 'api/Planning/GetOBPNotingSheetData',dataSoft,
     {headers}
    );
  }

  getMoUByloginName(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 
    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.get(
      AUTH_API + 'api/Planning/GetMouAgreementMasterApproved',
     {headers}
    );
  }


  getMoUDetailById(mouId:any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 
    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.get(
      AUTH_API + 'api/Planning/GetMouAgreementMasterApprovedById?id='+mouId,
     {headers}
    );
  }


  getMoUByloginNameAll(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + token)
    .set('Content-Type', 'application/json'); 
    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
    return this.http.get(
      AUTH_API + 'api/Planning/GetMouAgreementMasterAll?type=Y',
     {headers}
    );
  }

}

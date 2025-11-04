import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';
const AUTH_API = 'https://projectsapi.lpu.in/';//'https://projectsapi.lpu.in/';
const AUTH_API_LOCAL = 'https://projectsapi.lpu.in/';//'https://localhost:7125/';
const AUTH_API_LOCALS = 'https://projectsapi.lpu.in/';//'https://localhost:7125/';
// const AUTH_API = 'https://localhost:7125/';
// const AUTH_API_LOCAL = 'https://localhost:7125/';
// const AUTH_API_LOCALS = 'https://localhost:7125/';

@Injectable({
  providedIn: 'root'
})

export class LpuCIFWebService {
  baseUrl = AUTH_API;
  FileData: string | undefined;
  fileName: string | undefined;

  constructor(private http: HttpClient, private storageService: StorageService) { }

  private authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMb2dpbk5hbWUiOiJDSUYiLCJuYmYiOjE3NTM3NzU3ODIsImV4cCI6MTc4NTMxMTc4MiwiaWF0IjoxNzUzNzc1NzgyLCJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo3MTI1LyIsImF1ZCI6Imh0dHBzOi8vbG9jYWxob3N0OjcxMjUvIn0.9Oc0vzoLFrYmMpzfN5z9cDy-ysE3PgyxY8o4XC8ZRuI';
  // private authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMb2dpbk5hbWUiOiIyNTg5OSIsIkRlcGFydG1lbnROYW1lIjoiTi9BIiwiUm9sbElkIjoiNTAiLCJlbWFpbElkIjoiamF0aW4uMjU4OTlAbHB1LmNvLmluIiwiTkFNRSI6IkphdGluIFNhcnBhbCIsImlzQWN0aXZlIjoiVHJ1ZSIsIlVuaXF1ZWlkIjoiYmRmYWU4MWQtMDUxNy00M2ZjLWFjMzctZjM0ZDExODRmZjY3IiwiSXNQYXJlbnQiOiJGYWxzZSIsIlVzZXJUeXBlIjoiTi9BIiwiU3BlY2lhbEJsb2NrIjoiTi9BIiwibmJmIjoxNzIxODgxODU1LCJleHAiOjE3NTM0MTc4NTUsImlhdCI6MTcyMTg4MTg1NSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NzEyNS8iLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MTI1LyJ9.K8Pswv0q8MtTJ_QHOyX2TSksR6x888AdYVCqd5f1tTI';
  // private authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMb2dpbk5hbWUiOiJMUFVKb3VybmFsIiwibmJmIjoxNzM5MjU0OTYzLCJleHAiOjE3NzA3OTA5NjMsImlhdCI6MTczOTI1NDk2MywiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NzEyNS8iLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MTI1LyJ9.Ir-NM1QRF4MMr-hSvbMAhwv6Fzyhc3agCmn0TkqtwrM';


  folderUrl = 'http://172.19.2.206/umsweb/webftp/CIFDocuments/';

  getFolderUrl(): string {
    return this.folderUrl;
  }

  getStudentById(regNo: any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      // .set('Authorization', 'Bearer ' + token)
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      // AUTH_API + 'api/LpuCIF/GetStudentById?RegNo='+regNo, {headers});
      AUTH_API_LOCAL + 'api/LpuCIF/GetStudentById?RegNo=' + regNo, { headers });
  }

  // GetAuthoriseUserData(UserEmail: any, secreatKeys: any, userRole: any): Observable<any> {
  //   let token = this.storageService.getUser();
  //   let headers = new HttpHeaders()
  //     // .set('Authorization', 'Bearer ' + token)
  //     .set('Authorization', 'Bearer ' + this.authToken)
  //     .set('Content-Type', 'application/json');
  //   return this.http.get(
  //     // AUTH_API + 'api/LpuCIF/GetUserDataIdWise?Email=' + UserEmail + '&PasswordText=' + secreatKeys + '&UserRole=' + userRole,
  //      'https://localhost:7125/api/LpuCIF/GetUserDataIdWise?Email=' + UserEmail + '&PasswordText=' + secreatKeys + '&UserRole=' + userRole,
  //     { headers }
  //   );
   
  // }
  

  GetAllBooksDetails(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authToken}`
      })
    };
    // return this.http.get<any>(`${this.baseUrl}api/LpuJournal/GetBooksMasterData`, httpOptions);
    return this.http.get<any>(`${this.baseUrl}api/LpuJournal/GetAllJournalData`, httpOptions);
  }


  GetInstrumentsDetails(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authToken}`
      })
    };
    return this.http.get<any>(`${this.baseUrl}api/LpuCIF/GetInstrumentsDetails`, httpOptions);
  }

  // GetInstrumentWiseAnalysisDetails?InstrumentId=100000
  GetAnalysisDetails(InstrumentId: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authToken}`
      })
    };
    return this.http.get<any>(`${this.baseUrl}api/LpuCIF/GetInstrumentWiseAnalysisDetails?InstrumentId=` + InstrumentId, httpOptions);
  }


  GetDuationAndPrice(AnalysisId: any, UserId: any, Duration: string): Observable<any> {

    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authToken}`
      })
    };
    return this.http.get<any>(`${this.baseUrl}api/LpuCIF/GetDuationAndPrice?AnalysisId=` + AnalysisId + `&UserId=` + UserId + `&Duration=` + Duration, httpOptions);
  }


  addBookingSlot(newBookingData: FormData): Observable<any> {
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
    return this.http.post(
      // AUTH_API_LOCAL + 'api/LpuCIF/NewBookingSlot', newBookingData, { headers }
      AUTH_API + 'api/LpuCIF/NewBookingSlot', newBookingData, { headers }
    );
  }

  //   let token = this.storageService.getUser();
  //   // "Content-Type": "multipart/form-data"
  //   let headers = new HttpHeaders()
  //     .set('Authorization', 'Bearer ' + this.authToken)
  //     // .set('Content-Type', 'multipart/form-data');
  //   return this.http.post(
  //     this.baseUrl + 'LpuCIF/NewBookingSlot', newBookingData, { headers }
  //   );
  // }






  // api/LpuCIF/GetAllBookingSlot?UserId=jane.smith%40example.com GetUserPaymentDetails
  GetAllBookingSlot(UserEmailId: string): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      // .set('Authorization', 'Bearer ' + token)
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetAllBookingSlot?UserId=' + UserEmailId,
      // AUTH_API_LOCAL + 'api/LpuCIF/GetAllBookingSlot?UserId=' + UserEmailId,
      { headers }
    );
  }
  //   const httpOptions = {
  //     headers: new HttpHeaders({
  //       'Authorization': `Bearer ${this.authToken}`
  //     })
  //   };

  //   return this.http.get<any>(this.baseUrl + 'LpuCIF/GetAllBookingSlot?UserId=' + UserEmailId, httpOptions);
  // }

  // https://projectsapi.lpu.in/api/LpuCIF/GetAllBookingTests
  GetAllBooking(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/CIFGetAllAssignedTesttoStaff',
    // 'https://localhost:7125/api/LpuCIF/CIFGetAllAssignedTesttoStaff',
      { headers }
    );
  }

  GetAllUploadedResultsByStaff(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/CIFGetAllUploadedResultsByStaff',
      // AUTH_API_LOCAL + 'api/LpuCIF/CIFGetAllUploadedResultsByStaff',
      { headers }
    );
  }
  GetAllBookingTests(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      // .set('Authorization', 'Bearer ' + this.authToken)
      .set('Authorization', 'Bearer ' + token)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetAllBookingTests',
      //  'https://localhost:7125/api/LpuCIF/GetAllBookingTests',
      { headers }
    );
  }

  //   const httpOptions = {
  //     headers: new HttpHeaders({
  //       'Authorization': `Bearer ${this.authToken}`
  //     })
  //   };
  //   return this.http.get<any>(this.baseUrl + 'LpuCIF/GetAllBookingTests', httpOptions);
  // }

  MakePaymentforTest(newPaymentRecord: FormData): Observable<any> {
    let token = this.storageService.getUser();
    // "Content-Type": "multipart/form-data"
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
    // .set('Content-Type', 'multipart/form-data');
    return this.http.post(
      AUTH_API + 'api/LpuCIF/MakePaymentNowNew', newPaymentRecord, { headers }
      // AUTH_API + 'api/LpuCIF/MakePaymentNowNew', newPaymentRecord, { headers }
    );
  }
  // https://projectsapi.lpu.in/api/LpuCIF/GetUserPaymentDetails?UserId=3130258'
  GetUserPaymentDetails(UserEmailId: string): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetUserPaymentDetails?UserId=' + UserEmailId,
      // AUTH_API_LOCAL + 'api/LpuCIF/GetUserPaymentDetails?UserId=' + UserEmailId,
      { headers }
    );
  }
  //   const httpOptions = {
  //     headers: new HttpHeaders({
  //       'Authorization': `Bearer ${this.authToken}`
  //     })
  //   };
  //   return this.http.get<any>(this.baseUrl + 'LpuCIF/GetUserPaymentDetails?UserId=' + UserEmailId, httpOptions);
  // }


  // GetAllPaymentDetails Admin panel
  GetAllPaymentDetails(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetAllPaymentDetails',
      //  'https://projectsapi.lpu.in/api/LpuCIF/GetAllPaymentDetails' ,
      { headers }
    );
  }
 


  CIFResultsUploads(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      AUTH_API + 'api/LpuCIF/CIFResultsUploads', dataSoft, { headers }
      //  AUTH_API_LOCAL + 'api/LpuCIF/CIFResultsUploads', dataSoft, { headers }
    );
  }
  GetAllInstruments(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetInstrumentsDetails',
      // AUTH_API_LOCAL + 'api/LpuCIF/GetInstrumentsDetails',
      { headers }
    );
  }

  //   let authToken = this.storageService.getUser();
  //   let headers = new HttpHeaders()
  //     .set('Authorization', 'Bearer ' + authToken)
  //     //.set('Authorization', 'Bearer ' + this.Localtoken)
  //   return this.http.get(
  //      this.baseUrl + 'LpuCIF/GetInstrumentsDetails', { headers }
  //   );
  // }


  CIFUpdateStatusInstruments(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      //  AUTH_API_LOCAL + 'api/LpuCIF/CIFUpdateStatusInstruments', dataSoft, { headers }
      AUTH_API + 'api/LpuCIF/CIFUpdateStatusInstruments', dataSoft, { headers }
    );
  }

  CIFAssignTestToStaff(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken) // Added on 18-sep-25
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      //  'https://projectsapi.lpu.in/api/LpuCIF/CIFAssignTest', dataSoft, { headers }
      AUTH_API + 'api/LpuCIF/CIFAssignTest', dataSoft, { headers }
    );
  }

  GetUserResultsDetails(EmailId: any, BookingId: any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      // AUTH_API_LOCAL + 'api/LpuCIF/GetUserResultsDetails?Uid=' + EmailId +'&BookingId='+BookingId,
      AUTH_API + 'api/LpuCIF/GetUserResultsDetails?Uid=' + EmailId + '&BookingId=' + BookingId,
      { headers }
    );
  }
  //   const httpOptions = {
  //     headers: new HttpHeaders({
  //       'Authorization': `Bearer ${this.authToken}`
  //     })
  //   };
  //   // Uid=vijay.24374%40lpu.com&BookingId=600114
  //   return this.http.get<any>(this.baseUrl + 'LpuCIF/GetUserResultsDetails?Uid=' + EmailId +'&BookingId='+BookingId, httpOptions);
  // }

  GetUserBookingStatus(UserEmailId: string): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetUserBookingStatus?Uid=' + UserEmailId,
      // AUTH_API_LOCAL + 'api/LpuCIF/GetUserBookingStatus?Uid=' + UserEmailId,
      { headers }
    );
  }
  //   const httpOptions = {
  //     headers: new HttpHeaders({
  //       'Authorization': `Bearer ${this.authToken}`
  //     })
  //   };
  //   return this.http.get<any>(this.baseUrl + 'LpuCIF/GetUserBookingStatus?Uid=' + UserEmailId, httpOptions);
  // }
  GetAllUserData(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetAllApprovedUserData',
      // AUTH_API_LOCAL + 'api/LpuCIF/GetAllApprovedUserData',
      { headers }
    );
  }
  //   const httpOptions = {
  //     headers: new HttpHeaders({
  //       'Authorization': `Bearer ${this.authToken}`
  //     })
  //   };
  //   return this.http.get<any>(this.baseUrl + 'LpuCIF/GetAllApprovedUserData', httpOptions);
  // }

  CIFUpdateUserDetails(UpdateUserData: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      AUTH_API + 'api/LpuCIF/CIFChangePasswordDetails', UpdateUserData, { headers }
    //  'https://localhost:7125/api/LpuCIF/CIFChangePasswordDetails', UpdateUserData, { headers }
    );
  }



  // GetInstrumentWiseAnalysisDetails?InstrumentId=100000
  GetAnalysisData(Id: any, TypeId: any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      // AUTH_API_LOCAL + 'api/LpuCIF/GetAnalysisIdWisePriceDetails?AnalysisId=' + Id +'&TypeId='+TypeId,
      AUTH_API + 'api/LpuCIF/GetAnalysisIdWisePriceDetails?AnalysisId=' + Id + '&TypeId=' + TypeId,
      { headers }
    );
  }
  //   const httpOptions = {
  //     headers: new HttpHeaders({
  //       'Authorization': `Bearer ${this.authToken}`
  //     })
  //   };
  //   //GetAnalysisIdWisePriceDetails?AnalysisId=300001&TypeId=400000
  //   return this.http.get<any>(this.baseUrl + 'LpuCIF/GetAnalysisIdWisePriceDetails?AnalysisId=' + Id +'&TypeId='+TypeId, httpOptions);
  // }


  //.set('Authorization', 'Bearer ' + this.Localtoken)


  GetUserAllBookingSlot(UserEmailId: string): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      //  .set('Authorization', 'Bearer ' + authToken) // for local API
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      // AUTH_API_LOCAL + 'api/LpuCIF/GetAllUserBookingSlot?UserId=' + UserEmailId,
      AUTH_API + 'api/LpuCIF/GetAllUserBookingSlot?UserId=' + UserEmailId,
      { headers }
    );
    //   .set('Content-Type', 'application/json');
    //   return this.http.get(
    //     AUTH_API + 'api/LpuCIF/GetAllUserBookingSlot?UserId=' + UserEmailId,
    //     // AUTH_API_LOCAL + 'api/LpuCIF/GetAllUserBookingSlot?UserId=' + UserEmailId,
    //     {headers}
    //   );
    // }
    //   const httpOptions = {
    //     headers: new HttpHeaders({
    //       'Authorization': `Bearer ${this.authToken}`
    //     })
    //   };

    //   return this.http.get<any>(this.baseUrl + 'LpuCIF/GetAllUserBookingSlot?UserId=' + UserEmailId, httpOptions);
    // }
  }


  // /LpuCIF/CIFGetUserDetails?EmailId=vijay.24374%40lpu.com'  https://projectsapi.lpu.in/api/LpuCIF/CIFGetUserDetails?EmailId=vijay.24374%40lpu.com' 
  // CIFGetUserDetails(UserEmail:any): Observable<any> {
  //   let authToken = this.storageService.getUser();
  //   let headers = new HttpHeaders()
  //     .set('Authorization', 'Bearer ' + this.authToken)
  //   return this.http.post(
  //       // AUTH_API + 'api/LpuCIF/CIFGetUserDetails', UpdateUserData, { headers }
  //       AUTH_API_LOCAL + 'api/LpuCIF/CIFGetUserDetails?EmailId=', UserEmail, { headers }
  //   );
  // }


  CIFGetUserDetails(UserEmailId: string): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      //  .set('Authorization', 'Bearer ' + authToken) // for local API
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      // AUTH_API_LOCAL + 'api/LpuCIF/GetAllUserBookingSlot?UserId=' + UserEmailId,
      AUTH_API + 'api/LpuCIF/CIFGetUserDetails?EmailId=' + UserEmailId,
      { headers }
    );
  }

  GetDecodePaymentStatusDetails(Data: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
    return this.http.post(
      AUTH_API_LOCAL + 'api/LpuCIF/DecodePaymentStatusDetails', Data, { headers }
      // AUTH_API + 'api/LpuCIF/DecodePaymentStatusDetails', Data, { headers }
    );
  }
  GetUserPaymentStatusDetails(UserEmailId: string): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      // .set('Authorization', 'Bearer ' + token)
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetUserPaymentStatusDetails?UserId=' + UserEmailId,
      //  AUTH_API_LOCAL + 'api/LpuCIF/GetUserPaymentStatusDetails?UserId=' + UserEmailId,
      { headers }
    );
  }

  GetAllInstrumentsData(): Observable<any> {
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetAllInstruments',
      // AUTH_API_LOCAL + 'api/LpuCIF/GetAllInstruments',
      { headers }
    );
  }


  fetchSpecifications(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetAllSpecifications', { headers }
    );
  }
  InsertPaymentDetails(Data: any): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
    return this.http.post(
      AUTH_API_LOCAL + 'api/LpuCIF/AddPaymentDetails', Data, { headers }
      // AUTH_API + 'api/LpuCIF/AddPaymentDetails', Data, { headers }
    );

  }

  UpdateInstrumentImageFile(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
    return this.http.post(
      AUTH_API + 'api/LpuCIF/UpdateInstrumentImage', dataSoft,
      // AUTH_API_LOCAL + 'api/LpuCIF/UpdateInstrumentImage',dataSoft,
      { headers }
    );
  }

  CIFInstrumentUpdateDetails(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
    return this.http.post(
      AUTH_API_LOCAL + 'api/LpuCIF/UpdateInstrumentImage', dataSoft,
      // AUTH_API_LOCAL + 'api/LpuCIF/CIFInstrumentUpdateData',dataSoft,
      { headers }
    );
  }


  GetChargesDetails(Id: any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      // AUTH_API + 'api/LpuCIF/GetAGetInstrumentChargesDetailsllSpecifications', { headers }
      AUTH_API_LOCAL + 'api/LpuCIF/GetInstrumentChargesDetails?InstrumentID=' + Id, { headers }
    );
  }

  NewCifFeedback(newFeedbackData: FormData): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
    // .set('Content-Type', 'multipart/form-data');
    return this.http.post(
      AUTH_API_LOCALS + 'api/LpuCIF/NewFeedback', newFeedbackData, { headers }
    );
  }

  NewSAmpleStatus(newSampleStatus: FormData): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
    // .set('Content-Type', 'multipart/form-data');
    return this.http.post(
      AUTH_API + 'api/LpuCIF/CIFUpdateSampleStatus', newSampleStatus, { headers }
    );
  }
  // GetAllSampleStatus
  GetAllSampleStatus(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetAllSampleStatus', { headers }
    );   
  }
  GetAllFeedbackdetails(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetAllUserFeedbacks', { headers }
      // 'https://projectsapi.lpu.in/api/LpuCIF/GetAllUserFeedbacks', { headers }
    );   
  }
  GetUploadedResultDetails(UserEmailId: any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      // AUTH_API + 'api/LpuCIF/GetUploadedResultDetails?UserId=' + UserEmailId, { headers }
      //  'https://localhost:7125/api/LpuCIF/GetUploadedResultDetails?UserId=' + UserEmailId, { headers }
      AUTH_API+'api/LpuCIF/GetUploadedResultDetails?UserId=' + UserEmailId, { headers }
    );   
  }
  GetAllUserLists(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetCIFAssignTestProperties', { headers }
      // 'https://projectsapi.lpu.in/api/LpuCIF/GetCIFAssignTestProperties', { headers }
    );   
  }



  GetSampleStatus(UserEmailId: string): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetSampleStatusByUserId?UserId=' + UserEmailId,
        // 'https://localhost:7125/api/LpuCIF/GetSampleStatusByUserId?UserId=' + UserEmailId,
      { headers }
    );
  }


  GetAllEventDetails(): Observable<any> {
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuCIF/GetAllCifEventDetails',
      // 'https://localhost:7125/api/LpuCIF/GetAllCifEventDetails',
      { headers }
    );
  }

  
  CIFNewEventsDetails(dataSoft: FormData): Observable<any> {
    var authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      // .set('Authorization', 'Bearer ' + authToken)
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      AUTH_API + 'api/LpuCIF/CIFEventsUploads', dataSoft, { headers });
      // 'https://localhost:7125/api/LpuCIF/CIFEventsUploads', dataSoft, { headers });
  }
  CIFUpdateEventsDetails(dataSoft: FormData): Observable<any> {
    var authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      // .set('Authorization', 'Bearer ' + authToken)
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      AUTH_API + 'api/LpuCIF/UpdateCIFEventDetails', dataSoft, { headers });
      // 'https://localhost:7125/api/LpuCIF/UpdateCIFEventDetails', dataSoft, { headers });
  }

  // 8-sep-25
  CIFLockUser(dataSoft: FormData): Observable<any>{
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
         AUTH_API + 'api/LpuCIF/CIFLockUserLogin', dataSoft, { headers }
      //'https://localhost:7125/api/LpuCIF/CIFLockUserLogin', dataSoft, { headers }
    );
  }


  // added on 10-sep-25

  UpdateUserDetails(UserData: FormData): Observable<any> {
    var authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      // .set('Authorization', 'Bearer ' + authToken)
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      //  'https://localhost:7125/api/LpuCIF/CIUpdateUserDetails', UserData, { headers }
       AUTH_API + 'api/LpuCIF/CIUpdateUserDetails', UserData, { headers }
    ); 
  }



  // Added on 18-sep025
    ReAssignTestToStaff(dataSoft: FormData): Observable<any> {
    let authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      //  'https://projectsapi.lpu.in/api/LpuCIF/CIFAssignTest', dataSoft, { headers }
       'https://localhost:7125/api/LpuCIF/ReAssignTesttoCIFStaff', dataSoft, { headers }
        // AUTH_API + 'api/LpuCIF/ReAssignTesttoCIFStaff', dataSoft, { headers }
    );
  }



  // New Logic for Login Page 

GetAuthoriseUserData(loginData: FormData): Observable<any> {
  const headers = new HttpHeaders()
    .set('Authorization', 'Bearer ' + this.authToken)
    // .set('Content-Type', 'application/json'); // correct for JSON

  return this.http.post(
    // 'https://localhost:7125/api/LpuCIF/GetUserDataIdWise',    loginData,    { headers }
    AUTH_API_LOCAL +'api/LpuCIF/GetUserDataIdWise',    loginData,    { headers }
  );
}
// New Logic for Internal user login 
  NewUserRecord(newUserData: FormData): Observable<any> {
    let token = this.storageService.getUser();
    // "Content-Type": "multipart/form-data"
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
    // .set('Content-Type', 'multipart/form-data');
    return this.http.post(
      // 'https://localhost:7125/api/LpuCIF/CreateCIFUserAccount', newUserData, { headers }
      AUTH_API_LOCAL + 'api/LpuCIF/CreateCIFUserAccount', newUserData, { headers }
    );
  }


    NewUserSignUp(newUserData: FormData): Observable<any> {
    let token = this.storageService.getUser();
    // "Content-Type": "multipart/form-data"
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authToken)
    // .set('Content-Type', 'multipart/form-data');
    return this.http.post(
    //  'https://localhost:7125/api/LpuCIF/CIFNewUserSignUpInsert', newUserData, { headers }
       AUTH_API +  'api/LpuCIF/CIFNewUserSignUpInsert', newUserData, { headers }
    );// for new user account creatinng
  }

}
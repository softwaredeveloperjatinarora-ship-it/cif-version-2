// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Observable, forkJoin } from 'rxjs';
// // import { environment } from 'src/environments/environment';

// import { StorageService } from './storage.service';

// // import { University } from '../views/pages';
// // import { UniversityUpdate } from '../views/pages/sm-add-new-university/universityUpdate.model';
// // import { xmlUniversity } from '../views/pages/sm-add-new-university/xmlUniversity.model';
// // import { deleteUniversity } from '../views/pages/sm-add-new-university/deleteUniversity.model';

// const AUTH_API = 'https://projectsapi.lpu.in/';
// //const AUTH_API = 'https://localhost:7125/'; //'https://projectsapi.lpu.in/';

// @Injectable({
//   providedIn: 'root'
// })
// export class SemesterExchangeStuDetailsService {

//   baseUrl = AUTH_API;
//   FileData: string | undefined;
//   fileName: string | undefined;

//   constructor(private http: HttpClient, private storageService: StorageService) { }
//   private LocalauthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMb2dpbk5hbWUiOiIyNTg5OSIsIkRlcGFydG1lbnROYW1lIjoiTi9BIiwiUm9sbElkIjoiNTAiLCJlbWFpbElkIjoiamF0aW4uMjU4OTlAbHB1LmNvLmluIiwiTkFNRSI6IkphdGluIFNhcnBhbCIsImlzQWN0aXZlIjoiVHJ1ZSIsIlVuaXF1ZWlkIjoiYmRmYWU4MWQtMDUxNy00M2ZjLWFjMzctZjM0ZDExODRmZjY3IiwiSXNQYXJlbnQiOiJGYWxzZSIsIlVzZXJUeXBlIjoiTi9BIiwiU3BlY2lhbEJsb2NrIjoiTi9BIiwibmJmIjoxNzIxODgxODU1LCJleHAiOjE3NTM0MTc4NTUsImlhdCI6MTcyMTg4MTg1NSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NzEyNS8iLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MTI1LyJ9.K8Pswv0q8MtTJ_QHOyX2TSksR6x888AdYVCqd5f1tTI';
  
//   // private authToken = environment.authToken;//'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMb2dpbk5hbWUiOiIzMTMwOSIsIkRlcGFydG1lbnROYW1lIjoiTi9BIiwiUm9sbElkIjoiNTAiLCJlbWFpbElkIjoiamF0aW5kZXIuMzEzMDlAbHB1LmNvLmluIiwiTkFNRSI6IkphdGluZGVyIEt1bWFyIiwiaXNBY3RpdmUiOiJUcnVlIiwiVW5pcXVlaWQiOiJmYzJhYjI4Yi0zYmFiLTRmNmMtOWE3MS0yNTk2OTYwZWM2ZDAiLCJJc1BhcmVudCI6IkZhbHNlIiwiVXNlclR5cGUiOiJOL0EiLCJTcGVjaWFsQmxvY2siOiJOL0EiLCJuYmYiOjE3MDc3MDc4MjksImV4cCI6MTcwNzc5NDIyOSwiaWF0IjoxNzA3NzA3ODI5LCJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo3MTI1LyIsImF1ZCI6Imh0dHBzOi8vbG9jYWxob3N0OjcxMjUvIn0.X8u6FgsUq2E2pmIumzLQSGKpbGIXHNETBKgxx8im6HE';
//   private authToken = this.storageService.getUser();
//   private Localtoken = environment.authToken;
//   // private authToken=sessionStorage.getItem('USER_KEY');
//   folderUrl = 'https://files.lpu.in/umsweb/webftp/DIA/SemesterExchangedocuments/';

//    getFolderUrl(): string {
//     return this.folderUrl;
//   }

//   getStudentById(): Observable<any> {
//     var authToken = this.storageService.getUser();
//     const httpOptions = {
//       headers: new HttpHeaders({
//         'Authorization': `Bearer ${this.LocalauthToken}`
//       })
//     };

//     return this.http.get<any>(`${this.baseUrl}api/SemesterExchangeStudent/GetStudentById`, httpOptions);
//   }
//   getApplicationDetailsBYId(RegId: string): Observable<any> {
//     var authToken = this.storageService.getUser();
//     const httpOptions = {
//       headers: new HttpHeaders({
//         'Authorization': `Bearer ${authToken}`
//       })
//     };

//     return this.http.get<any>(`${this.baseUrl}api/SemesterExchangeStudent/ApplicationDetailsBYId?RegNo=${RegId ? RegId : ''}`, httpOptions);
//   }
//   getAllApplicationDetails(): Observable<any> {
//     let authToken = this.storageService.getUser();
//     let headers = new HttpHeaders()
//     // .set('Authorization', 'Bearer ' + authToken)
//     .set('Authorization', 'Bearer ' + this.Localtoken)
//     .set('Content-Type', 'application/json'); 
//     return this.http.get(
//       AUTH_API + 'api/SemesterExchangeStudent/GetAllApplicationDetails' ,
//      {headers}
//     );  
//   }


//   GetIdWiseDocuments(aplicationId: number, regId: string): Observable<any> {
//     let authToken = this.storageService.getUser();
//     let headers = new HttpHeaders()
//     // .set('Authorization', 'Bearer ' + authToken)
//     .set('Authorization', 'Bearer ' + this.Localtoken)
//     .set('Content-Type', 'application/json'); 
//     return this.http.get(
//       AUTH_API + 'api/SemesterExchangeStudent/GetIdWiseDocuments?ApplicationId=' + aplicationId + '&RegNo=' + regId,
//      {headers}
//     );  

//     // var authToken = this.storageService.getUser();
//     // const httpOptions = {
//     //   headers: new HttpHeaders({
//     //     'Authorization': `Bearer ${authToken}`
//     //   })
//     // };
//     // return this.http.get<any>(this.baseUrl + 'api/SemesterExchangeStudent/GetIdWiseDocuments?ApplicationId=' + aplicationId + '&RegNo=' + regId, httpOptions);
//   }


//   GetPendigLists(aplicationId: number): Observable<any> {
//     var authToken = this.storageService.getUser();
//     const httpOptions = {
//       headers: new HttpHeaders({
//         'Authorization': `Bearer ${authToken}`
//       })
//     };
//     return this.http.get<any>(this.baseUrl + 'api/SemesterExchangeStudent/GetPendingUploadList?ApplicationId=' + aplicationId , httpOptions);
//   }

//   GetStatusCheckListDocuments(aplicationId: number): Observable<any> {
//     var authToken = this.storageService.getUser();
//     const httpOptions = {
//       headers: new HttpHeaders({
//         'Authorization': `Bearer ${authToken}`
//       })
//     };
//     return this.http.get<any>(this.baseUrl + 'api/SemesterExchangeStudent/GetStatusCheckListDocuments?ApplicationId=' + aplicationId , httpOptions);
//   }


//   GetIdWiseUploadedDocumentsStatus(aplicationId: number, regId: string): Observable<any> {
//     var authToken = this.storageService.getUser();
//     const httpOptions = {
//       headers: new HttpHeaders({
//         'Authorization': `Bearer ${authToken}`
//       })
//     };
//     return this.http.get<any>(this.baseUrl + 'api/SemesterExchangeStudent/GetIdWiseUploadedDocumentsStatus?ApplicationId=' + aplicationId + '&RegNo=' + regId, httpOptions);
//   }




//   GetCheckListDocuments(): Observable<any> {
//     var authToken = this.storageService.getUser();
//     const httpOptions = {
//       headers: new HttpHeaders({
//         'Authorization': `Bearer ${authToken}`
//       })
//     };

//     // Make the HTTP GET request with the headers
//     return this.http.get<any>(`${this.baseUrl}api/SemesterExchangeStudent/GetCheckListDocuments`, httpOptions);
//   }

//   GetAllCheckListDocs(): Observable<any> {
//     var authToken = this.storageService.getUser();
//     const httpOptions = {
//       headers: new HttpHeaders({
//         'Authorization': `Bearer ${authToken}`
//       })
//     };

//     // Make the HTTP GET request with the headers
//     return this.http.get<any>(`${this.baseUrl}api/SemesterExchangeStudent/GetAllCheckListDocs`, httpOptions);
//   }
//   GetCheckListDocs(ApplicationId: any, RegNo: String): Observable<any> {
//     var authToken = this.storageService.getUser();
//     const httpOptions = {
//       headers: new HttpHeaders({
//         'Authorization': `Bearer ${authToken}`
//       })
//     };
//     // Make the HTTP GET request with the headers
//     return this.http.get<any>(this.baseUrl + 'api/SemesterExchangeStudent/GetAllUploadedCheckListDocuments?ApplicationId=' + ApplicationId + '&RegNo=' + RegNo, httpOptions);
//   }
//   GetIdWiseUploadedDocumentList(ApplicationId: any, DocName: String): Observable<any> {
//     var authToken = this.storageService.getUser();
//     const httpOptions = {
//       headers: new HttpHeaders({
//         'Authorization': `Bearer ${authToken}`
//       })
//     };
//     return this.http.get<any>(this.baseUrl + 'api/SemesterExchangeStudent/GetIdWiseUploadedDocumentList?ApplicationId=' + ApplicationId + '&docName=' + DocName, httpOptions);
//   }


//   getUniversityDetails(): Observable<any> {
//     var token = this.storageService.getUser();
//     const httpOptions = {
//       headers: new HttpHeaders({
//         'Authorization': `Bearer ${token}`
//       })
//     };
//     return this.http.get<any>(`${this.baseUrl}api/SemesterExchangeStudent/GetAllUniversityDetails`, httpOptions);
//   }

//   addstuEntryforApproval(dataSoft: any): Observable<any> {
//     // let token = this.storageService.getUser();
//     var authToken = this.storageService.getUser();
//     let headers = new HttpHeaders()
//       .set('Authorization', 'Bearer ' + authToken)
//       .set('Content-Type', 'application/json');
//     //httpOptions.headers.set('Authentication', 'Bearer ' + token);
//     return this.http.post(
//       AUTH_API + 'api/SemesterExchangeStudent/CreateSemesterExchangeStudentData', dataSoft,
//       { headers }
//     );
//   }
//   // addUniversity(universityData: University): Observable<any> {
//   //   // let token = this.storageService.getUser();
//   //   var authToken = this.storageService.getUser();
//   //   let headers = new HttpHeaders()
//   //     .set('Authorization', 'Bearer ' + authToken)
//   //     .set('Content-Type', 'application/json');
//   //   //httpOptions.headers.set('Authentication', 'Bearer ' + token);
//   //   return this.http.post(
//   //     AUTH_API + 'api/SemesterExchangeStudent/CreateUniversityData', universityData,
//   //     { headers }
//   //   );
//   // }

//   addSECheckListDocuments(dataSoft: FormData): Observable<any> {  
//     var authToken = this.storageService.getUser();  
//     let headers = new HttpHeaders()
//       .set('Authorization', 'Bearer ' + authToken)
//     return this.http.post(
//       AUTH_API + 'api/SemesterExchangeStudent/SemesterExchangeCheckListDocumentInsert',
//       dataSoft,
//       { headers }
//     );
//   }


//   UploadInterviewDocuments(dataSoft: FormData): Observable<any> {
//     var authToken = this.storageService.getUser();
//     let headers = new HttpHeaders()
//       .set('Authorization', 'Bearer ' + authToken)
//     return this.http.post(
//       AUTH_API + 'api/SemesterExchangeStudent/SemesterExchangeUploadInterviewSchedule',
//       dataSoft,
//       { headers }
//     );
//   }

//   UploadCourseMapping(dataSoft: FormData): Observable<any> {
//     var authToken = this.storageService.getUser();
//     let headers = new HttpHeaders()
//       .set('Authorization', 'Bearer ' + authToken)
//     return this.http.post(
//       AUTH_API + 'api/SemesterExchangeStudent/SemesterExchangeUploadCourseMapping',
//       dataSoft,
//       { headers }
//     );
//   }


//   ApproveCheckListDocument(dataSoft: FormData): Observable<any> {
//     var authToken = this.storageService.getUser();
//     let headers = new HttpHeaders()
//       .set('Authorization', 'Bearer ' + authToken)
//     return this.http.post(
//       AUTH_API + 'api/SemesterExchangeStudent/approveChecklistDocs', dataSoft, { headers });
//   }

//   ChangeStatusCheckListDoc(dataSoft: FormData): Observable<any> {
//     var authToken = this.storageService.getUser();
//     let headers = new HttpHeaders()
//       .set('Authorization', 'Bearer ' + authToken)
//     return this.http.post(
//       AUTH_API + 'api/SemesterExchangeStudent/ChangeStatusCheckListDoc', dataSoft, { headers });
//   }


// //   // Upload Excel sheet Record data into University Database 
// //   createUniversityUsingExcelSheet(xmlUniversity: xmlUniversity): Observable<any> {
// //     var authToken = this.storageService.getUser();
// //      let headers = new HttpHeaders()
// //      .set('Authorization', 'Bearer ' + authToken)
// //      .set('Content-Type', 'application/json');
// //    //httpOptions.headers.set('Authentication', 'Bearer ' + token);
// //    return this.http.post(
// //      AUTH_API + 'api/SemesterExchangeStudent/UploadExceldata', xmlUniversity,
// //      { headers }
// //    );
// //  }

// // // Delete Record from Database  university 
// //   deleteUniversityRecord(deleteUniversity: deleteUniversity): Observable<any> {
// //     var authToken = this.storageService.getUser();
// //     let headers = new HttpHeaders()
// //       .set('Authorization', 'Bearer ' + authToken)
// //       .set('Content-Type', 'application/json');
    
// //     return this.http.post(
// //       AUTH_API + 'api/SemesterExchangeStudent/DeleteUniversityRecord', deleteUniversity,
// //       { headers }
// //     );
// //   }
// // // UpdateUniversityData
// // updateUniversity(universityData: UniversityUpdate): Observable<any> {
// //   var authToken = this.storageService.getUser();
// //   let headers = new HttpHeaders()
// //     .set('Authorization', 'Bearer ' + authToken)
// //     .set('Content-Type', 'application/json');
// //   //httpOptions.headers.set('Authentication', 'Bearer ' + token);
// //   return this.http.post(
// //     AUTH_API + 'api/SemesterExchangeStudent/UpdateUniversityData', universityData,
// //     { headers }
// //   );
// // }

// }

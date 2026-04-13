import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { StorageService } from './storage.service';

 
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LpuCIFWebService {
  private readonly authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMb2dpbk5hbWUiOiJDSUYiLCJuYmYiOjE3NTM3NzU3ODIsImV4cCI6MTc4NTMxMTc4MiwiaWF0IjoxNzUzNzc1NzgyLCJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo3MTI1LyIsImF1ZCI6Imh0dHBzOi8vbG9jYWxob3N0OjcxMjUvIn0.9Oc0vzoLFrYmMpzfN5z9cDy-ysE3PgyxY8o4XC8ZRuI';

 
  private readonly http           = inject(HttpClient);
  private readonly storageService = inject(StorageService);

 
  private readonly base = environment.apiBase;
  private readonly api  = `${this.base}/api/LpuCIF`;

  private readonly baseUrl = environment.apiUrl; //
  private readonly LocalbaseUrl = environment.LocalapiUrl; //
  

  readonly folderUrl = 'https://files.lpu.in/umsweb/webftp/CIFDocuments/';
  getFolderUrl(): string { return this.folderUrl; }


    UploadPaymentReceipt(PaymentReceipt: FormData): Observable<any> {
       return this.http.post(
      `${this.api}/CIFUploadPaymentReceipt`, PaymentReceipt,
      { headers: this.multipartHeaders(true) }
    );
  }
      
   
  GetBookingPaymentProofDetails(BookingId: any): Observable<any> {
    return this.http.get(
      `${this.api}/CIFGetBookingPaymentProofDetails?UserId=${BookingId}`,
      { headers: this.staticJsonHeaders() }
    );
  }

 
 

  downloadFile(fileUrl: string): Observable<Blob> {
    const payload = {
      fileName: fileUrl,
      folderPath: ""
    };
    const token = this.storageService.getUser();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post('https://projectsapi.lpu.in/api/Mou/DownloadMOUFiles/MOUDownloadFiles', payload, {

      headers: headers,
      responseType: 'blob'
    });
  }

  private staticJsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
    });
  }

  
  private sessionJsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.storageService.getUser()}`,
      'Content-Type': 'application/json',
    });
  }

 
  private multipartHeaders(useSession = false): HttpHeaders {
    const token = useSession ? this.storageService.getUser() : this.authToken;
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }
 
  GetAuthoriseUserData(loginData: FormData): Observable<any> {
    return this.http
      .post(`${this.api}/GetUserDataIdWise`, loginData, {
        headers: this.multipartHeaders(false),
      })
      .pipe(catchError(err => of({ error: true, message: err.message })));
  }

  
  getStudentById(regNo: any): Observable<any> {
    return this.http.get(
      `${this.api}/GetStudentById?RegNo=${regNo}`,
      { headers: this.staticJsonHeaders() }
    );
  }

  GetAllUserData(): Observable<any> {
    return this.http.get(
      `${this.api}/GetAllApprovedUserData`,
      { headers: this.staticJsonHeaders() }
    );
  }


  
  GetAllUserLists(): Observable<any> {
    return this.http.get(
      `${this.api}/GetCIFAssignTestProperties`,
      { headers: this.staticJsonHeaders() }
    );
  }

  CIFGetUserDetails(userEmailId: string): Observable<any> {
    return this.http.get(
      `${this.api}/CIFGetUserDetails?EmailId=${userEmailId}`,
      { headers: this.staticJsonHeaders() }
    );
  }

  CIFUpdateUserDetails(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/CIFChangePasswordDetails`, data,
      { headers: this.multipartHeaders(true) }
    );
  }

 
  UpdateUserDetails(UserData: FormData): Observable<any> {
    var authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      
      `${this.api}/CIUpdateUserDetails`, UserData, { headers }
    );
  }









  CIFLockUser(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/CIFLockUserLogin`, data,
      { headers: this.multipartHeaders(true) }
    );
  }

  NewUserRecord(newUserData: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/CreateCIFUserAccount`, newUserData,
      { headers: this.multipartHeaders(false) }
    );
  }

  NewUserSignUp(newUserData: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/CIFNewUserSignUpInsert`, newUserData,
      { headers: this.multipartHeaders(false) }
    );
  }

  

  GetAllInstrumentsData(): Observable<any> {
    return this.http
      .get(`${this.api}/GetAllInstruments`, { headers: this.staticJsonHeaders() })
      .pipe(catchError(err => of({ item1: [], error: true, message: err.message })));
  }

  GetAllInstruments(): Observable<any> {
    return this.http.get(
      `${this.api}/GetInstrumentsDetails`,
      { headers: this.staticJsonHeaders() }
    );
  }

  GetInstrumentsDetails(): Observable<any> {
    return this.http.get(
      `${this.api}/GetInstrumentsDetails`,
      { headers: this.staticJsonHeaders() }
    );
  }

  CIFUpdateStatusInstruments(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/CIFUpdateStatusInstruments`, data,
      { headers: this.multipartHeaders(false) }
    );
  }

  UpdateInstrumentImageFile(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/UpdateInstrumentImage`, data,
      { headers: this.multipartHeaders(false) }
    );
  }

  CIFInstrumentUpdateDetails(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/UpdateInstrumentImage`, data,
      { headers: this.multipartHeaders(false) }
    );
  }

  fetchSpecifications(): Observable<any> {
    return this.http.get(
      `${this.api}/GetAllSpecifications`,
      { headers: this.staticJsonHeaders() }
    );
  }

  GetChargesDetails(id: any): Observable<any> {
    return this.http.get(
      `${this.api}/GetInstrumentChargesDetails?InstrumentID=${id}`,
      { headers: this.staticJsonHeaders() }
    );
  }





  GetAnalysisDetails(instrumentId: any): Observable<any> {
    return this.http.get(
      `${this.api}/GetInstrumentWiseAnalysisDetails?InstrumentId=${instrumentId}`,
      { headers: this.staticJsonHeaders() }
    );
  }

  GetAnalysisData(id: any, typeId: any): Observable<any> {
    return this.http.get(
      `${this.api}/GetAnalysisIdWisePriceDetails?AnalysisId=${id}&TypeId=${typeId}`,
      { headers: this.staticJsonHeaders() }
    );
  }

  GetDuationAndPrice(analysisId: any, userId: any, duration: string): Observable<any> {
    return this.http.get(
      `${this.api}/GetDuationAndPrice?AnalysisId=${analysisId}&UserId=${userId}&Duration=${duration}`,
      { headers: this.staticJsonHeaders() }
    );
  }





  addBookingSlot(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/NewBookingSlot`, data,
      { headers: this.multipartHeaders(false) }
    );
  }

  GetAllBookingSlot(userEmailId: string): Observable<any> {
    return this.http.get(
      `${this.api}/GetAllBookingSlot?UserId=${userEmailId}`,
      { headers: this.staticJsonHeaders() }
    );
  }

  GetUserAllBookingSlot(userEmailId: string): Observable<any> {
    return this.http.get(
      `${this.api}/GetAllUserBookingSlot?UserId=${userEmailId}`,
      { headers: this.staticJsonHeaders() }
    );
  }

  GetUserBookingStatus(userEmailId: string): Observable<any> {
    return this.http.get(
      `${this.api}/GetUserBookingStatus?Uid=${userEmailId}`,
      { headers: this.staticJsonHeaders() }
    );
  }

  GetAllBooking(): Observable<any> {
    return this.http.get(
      `${this.api}/CIFGetAllAssignedTesttoStaff`,
      { headers: this.sessionJsonHeaders() }
    );
  }

  GetAllBookingTests(): Observable<any> {
    return this.http.get(
      `${this.api}/GetAllBookingTests`,
      { headers: this.sessionJsonHeaders() }
    );
  }

  CIFAssignTestToStaff(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/CIFAssignTest`, data,
      { headers: this.multipartHeaders(true) }
    );
  }

  ReAssignTestToStaff(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/ReAssignTesttoCIFStaff`, data,
      { headers: this.multipartHeaders(true) }
    );
  }





  MakePaymentforTest(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/MakePaymentNowNew`, data,
      { headers: this.multipartHeaders(false) }
    );
  }

  GetUserPaymentDetails(userEmailId: string): Observable<any> {
    return this.http.get(
      `${this.api}/GetUserPaymentDetails?UserId=${userEmailId}`,
      { headers: this.staticJsonHeaders() }
    );
  }

  GetAllPaymentDetails(): Observable<any> {
    return this.http.get(
      `${this.api}/GetAllPaymentDetails`,
      { headers: this.staticJsonHeaders() }
    );
  }

  GetDecodePaymentStatusDetails(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/DecodePaymentStatusDetails`, data,
      { headers: this.multipartHeaders(false) }
    );
  }

  GetUserPaymentStatusDetails(userEmailId: string): Observable<any> {
    return this.http.get(
      `${this.api}/GetUserPaymentStatusDetails?UserId=${userEmailId}`,
      { headers: this.staticJsonHeaders() }
    );
  }

  InsertPaymentDetails(data: any): Observable<any> {
    return this.http.post(
      `${this.api}/AddPaymentDetails`, data,
      { headers: this.multipartHeaders(false) }
    );
  }





  CIFResultsUploads(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/CIFResultsUploads`, data,
      { headers: this.multipartHeaders(false) }
    );
  }

  GetUserResultsDetails(emailId: any, bookingId: any): Observable<any> {
    return this.http.get(
      `${this.api}/GetUserResultsDetails?Uid=${emailId}&BookingId=${bookingId}`,
      { headers: this.staticJsonHeaders() }
    );
  }

  GetAllUploadedResultsByStaff(): Observable<any> {
    return this.http.get(
      `${this.api}/CIFGetAllUploadedResultsByStaff`,
      { headers: this.sessionJsonHeaders() }
    );
  }

  GetUploadedResultDetails(userEmailId: any): Observable<any> {
    return this.http.get(
      `${this.api}/GetUploadedResultDetails?UserId=${userEmailId}`,
      { headers: this.staticJsonHeaders() }
    );
  }





  NewSAmpleStatus(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/CIFUpdateSampleStatus`, data,
      { headers: this.multipartHeaders(true) }
    );
  }

  GetAllSampleStatus(): Observable<any> {
    return this.http.get(
      `${this.api}/GetAllSampleStatus`,
      { headers: this.staticJsonHeaders() }
    );
  }

  GetSampleStatus(userEmailId: string): Observable<any> {
    return this.http.get(
      `${this.api}/GetSampleStatusByUserId?UserId=${userEmailId}`,
      { headers: this.staticJsonHeaders() }
    );
  }





  NewCifFeedback(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/NewFeedback`, data,
      { headers: this.multipartHeaders(true) }
    );
  }

  GetAllFeedbackdetails(): Observable<any> {
    return this.http.get(
      `${this.api}/GetAllUserFeedbacks`,
      { headers: this.staticJsonHeaders() }
    );
  }
 
 
  GetAllEventDetails(): Observable<any> {
    return this.http.get(
      `${this.api}/GetAllCifEventDetails`,
      { headers: this.staticJsonHeaders() }
    );
  }

  CIFNewEventsDetails(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/CIFEventsUploads`, data,
      { headers: this.multipartHeaders(true) }
    );
  }

  CIFUpdateEventsDetails(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/UpdateCIFEventDetails`, data,
      { headers: this.multipartHeaders(true) }
    );
  }

 
  GetAllBooksDetails(): Observable<any> {

    return this.http.get(
      `${this.base}/api/LpuJournal/GetAllJournalData`,
      { headers: this.staticJsonHeaders() }
    );
  }

  UpdateInstrumentPrice(data: FormData): Observable<any> {
    return this.http.post(
      `${this.api}/CIFUpdatePrice`,
      data,
    { headers: this.multipartHeaders(true) }
    ).pipe(
      catchError(err => of({ success: false, error: true, message: err.message }))
    );
  }

 


    CIFUpdateEventsStatus(dataSoft: FormData): Observable<any> {
    var authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
       `${this.api}/UpdateEventsStatus`, dataSoft, { headers });
  }



    ReplaceExcelSheetSample(newUserData: FormData): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
    return this.http.post(
      //  'https://localhost:7125/api/LpuCIF/ReplaceExcelSheetSample', newUserData, { headers }
       `${this.api}/ReplaceExcelSheetSample`, newUserData, { headers }
    );// for new user account creatinng
  }


  //   GetAllFeedbackdetails(): Observable<any> {
  //   let token = this.storageService.getUser();
  //   let headers = new HttpHeaders()
  //     .set('Authorization', 'Bearer ' + this.authToken)
  //     .set('Content-Type', 'application/json');
  //   return this.http.get(
  //     `${this.api}/GetAllUserFeedbacks`, { headers }
  //     // 'https://projectsapi.lpu.in/api/LpuCIF/GetAllUserFeedbacks', { headers }
  //   );
  // }



    EventsCrudOperation(data: FormData, action: 'Insert' | 'Update' | 'Delete' | 'View'): Observable<any> {
    var authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      // .set('Authorization', 'Bearer ' + authToken)
      .set('Authorization', 'Bearer ' + this.authToken)
   

    return this.http.post<any>(
      `${this.api}/EventsCrudOperation`,
       
      data, { headers }
    ).pipe(catchError(this.handleError('EventsCrudOperation', { success: false, message: 'Events CRUD operation failed' })));

  
  }





    CifMOUCrudOperations(data: FormData, action:  'Insert' | 'Update' | 'Delete' | 'View' | 'ViewAll' | 'Approve' | 'DisApprove'  ): Observable<any> {
    var authToken = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      // .set('Authorization', 'Bearer ' + this.authToken)
   

    return this.http.post<any>(
      `https://localhost:7125/api/LpuCIF/CIFMOUCrudOperation`,
       
      data, { headers }
    ).pipe(catchError(this.handleError('CIFMOUCrudOperation', { success: false, message: 'MOU Cif CRUD operation failed' })));

  
  }















  
    private handleError<T>(operation: string, fallbackValue: T): (error: any) => Observable<T> {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Return the fallback value with user-friendly error message to prevent UI crashes
      const userFriendlyMessage = 'Data Server Connection error , Try again later';

      // For array fallbacks, return the empty array with error flag
      if (Array.isArray(fallbackValue)) {
        return of({ data: fallbackValue, error: true, message: userFriendlyMessage } as unknown as T);
      }
      // For null/nothing fallbacks, return error response object
      if (fallbackValue === null || fallbackValue === undefined) {
        return of({ error: true, message: userFriendlyMessage } as unknown as T);
      }
      // For object fallbacks, merge the error message
      return of({ ...fallbackValue, error: true, message: userFriendlyMessage } as unknown as T);
    };
  }

}


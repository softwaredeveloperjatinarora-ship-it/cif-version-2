import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';
// import { environment } from 'src/environments/environment';
const AUTH_API = 'https://projectsapi.lpu.in/';//'https://projectsapi.lpu.in/';
const AUTH_API_LOCAL = 'https://projectsapi.lpu.in/';//'https://localhost:7125/';

@Injectable({
  providedIn: 'root'
})

export class ObpAutoAssignService {

   FileData: string | undefined;
  fileName: string | undefined;

  constructor(private http: HttpClient, private storageService: StorageService) { }

  private authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMb2dpbk5hbWUiOiIyNTg5OSIsIkRlcGFydG1lbnROYW1lIjoiTi9BIiwiUm9sbElkIjoiNTAiLCJlbWFpbElkIjoiamF0aW4uMjU4OTlAbHB1LmNvLmluIiwiTkFNRSI6IkphdGluIFNhcnBhbCIsImlzQWN0aXZlIjoiVHJ1ZSIsIlVuaXF1ZWlkIjoiYmRmYWU4MWQtMDUxNy00M2ZjLWFjMzctZjM0ZDExODRmZjY3IiwiSXNQYXJlbnQiOiJGYWxzZSIsIlVzZXJUeXBlIjoiTi9BIiwiU3BlY2lhbEJsb2NrIjoiTi9BIiwibmJmIjoxNzIxODgxODU1LCJleHAiOjE3NTM0MTc4NTUsImlhdCI6MTcyMTg4MTg1NSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NzEyNS8iLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MTI1LyJ9.K8Pswv0q8MtTJ_QHOyX2TSksR6x888AdYVCqd5f1tTI';

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


  GetObpMetricDetails(Id:any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
      .set('Content-Type', 'application/json');
    return this.http.get(
      // AUTH_API + 'api/LpuObpAutomation/GetAGetInstrumentChargesDetailsllSpecifications', { headers }
      AUTH_API_LOCAL + 'api/LpuObpAutomation/GetObpMetricDetails?MetricId='+Id, { headers }
    );
  }
  GetAllOBPPlannerSessions(): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
      .set('Content-Type', 'application/json');
    return this.http.get(
      // AUTH_API + 'api/LpuObpAutomation/GetAGetInstrumentChargesDetailsllSpecifications', { headers }
      AUTH_API_LOCAL + 'api/LpuObpAutomation/GetOBPPlannerSessions', { headers }
    );
  }
  
  GetOBPQueryResultsData(Query: any): Observable<any> {
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
      .set('Content-Type', 'application/json');
    return this.http.get(
      // AUTH_API + 'api/LpuObpAutomation/GetAGetInstrumentChargesDetailsllSpecifications', { headers }
      AUTH_API_LOCAL + 'api/LpuObpAutomation/GetQueryResultsData?queryData='+Query, { headers }
    );
  }

  CallWebApiInsertData(DataValues: FormData): Observable<any> {
    // console.log("Form Values in API HIT Services" + DataValues)
    let token = this.storageService.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
    return this.http.post(
      // AUTH_API_LOCAL + 'api/LpuCIF/NewBookingSlot', newBookingData, { headers }
      AUTH_API_LOCAL+'api/LpuObpAutomation/OBPInsertMetricAutoIntegration',DataValues, { headers });
  }
  
}

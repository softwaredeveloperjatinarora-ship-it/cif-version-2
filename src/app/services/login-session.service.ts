import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';
// import { environment } from 'src/environments/environment';

const AUTH_API = 'https://projectsapi.lpu.in/';

@Injectable({
  providedIn: 'root'
})
export class LoginSessionService {
  // baseUrl = environment.apiUrl;
  FileData: string | undefined;
  fileName: string | undefined;
  private sessionData: any[] = []; //any = {};

  constructor(private http: HttpClient, private storageService: StorageService) { }

 // private authToken = environment.authToken;//'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMb2dpbk5hbWUiOiIzMTMwOSIsIkRlcGFydG1lbnROYW1lIjoiTi9BIiwiUm9sbElkIjoiNTAiLCJlbWFpbElkIjoiamF0aW5kZXIuMzEzMDlAbHB1LmNvLmluIiwiTkFNRSI6IkphdGluZGVyIEt1bWFyIiwiaXNBY3RpdmUiOiJUcnVlIiwiVW5pcXVlaWQiOiJmYzJhYjI4Yi0zYmFiLTRmNmMtOWE3MS0yNTk2OTYwZWM2ZDAiLCJJc1BhcmVudCI6IkZhbHNlIiwiVXNlclR5cGUiOiJOL0EiLCJTcGVjaWFsQmxvY2siOiJOL0EiLCJuYmYiOjE3MDc3MDc4MjksImV4cCI6MTcwNzc5NDIyOSwiaWF0IjoxNzA3NzA3ODI5LCJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo3MTI1LyIsImF1ZCI6Imh0dHBzOi8vbG9jYWxob3N0OjcxMjUvIn0.X8u6FgsUq2E2pmIumzLQSGKpbGIXHNETBKgxx8im6HE';


  folderUrl = 'http://172.19.2.206/umsweb/webftp/CIFDocuments/';

  getFolderUrl(): string {
    return this.folderUrl;
  }


  addToSession(item: any): void {
    this.sessionData.push(item);
  }


  getSession(): any[] {
    return this.sessionData;
  }


  clearSession(): void {
    this.sessionData = [];
  }
}

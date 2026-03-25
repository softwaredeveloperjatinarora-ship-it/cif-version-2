import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';


const AUTH_API = 'https://projectsapi.lpu.in/';

@Injectable({
  providedIn: 'root'
})
export class LoginSessionService {

  FileData: string | undefined;
  fileName: string | undefined;
  private sessionData: any[] = []; //any = {};

  constructor(private http: HttpClient, private storageService: StorageService) { }




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

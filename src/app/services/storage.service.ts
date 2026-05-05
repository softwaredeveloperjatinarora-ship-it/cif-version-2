import { isPlatformBrowser } from '@angular/common';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
// import { isPlatformBrowser } from '@angularcommon';

const USER_KEY = 'auth-user';
@Injectable({ providedIn: 'root' })
 
export class StorageService {
   constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  

          clean(): void {
                    window.sessionStorage.clear();
          }
          public saveUser(user: any): void {
                    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
          }

          public getUser(): any {
            if (isPlatformBrowser(this.platformId)) {
                    const user = window.sessionStorage.getItem(USER_KEY);
                    if (user) {
                              return JSON.parse(user);
                    }
                  }
                    return {};
          }

          public isLoggedIn(): boolean {
                    const loginId = localStorage.getItem(USER_KEY);
                    const user = window.sessionStorage.getItem(USER_KEY);
                    if (loginId) {
                              return true;
                    }

                    return false;
          }
}



 
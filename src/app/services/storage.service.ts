import { Injectable } from '@angular/core';

const USER_KEY = 'auth-user';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor() {}

  clean(): void {
    window.sessionStorage.clear();
  }
  public saveUser(user: any): void {
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public getUser(): any {
    const user = window.sessionStorage.getItem(USER_KEY);
    if (user) {
      return JSON.parse(user);
    }

    return {};
  }
  // public saveUser(user: any): void {
  // this.clean();
  // localStorage.setItem(USER_KEY, user)
  //  window.sessionStorage.removeItem(USER_KEY);
  //  window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  // }

  // public getUser(): any {
  //   // return localStorage.getItem(USER_KEY);
  //   const user = localStorage.getItem(USER_KEY); //window.sessionStorage.getItem(USER_KEY);
  //   if (user) {
  //     return user;
  //   }
  //   else
  //   {
  //     this.clean();
  //     return null;
  //   }
  // }

  public isLoggedIn(): boolean {
    const loginId= localStorage.getItem(USER_KEY);
    const user = window.sessionStorage.getItem(USER_KEY);
    if (loginId) {
      return true;
    }

    return false;
  }
}


// import { Injectable } from '@angular/core';

// const USER_KEY = 'auth-user';

// @Injectable({
//   providedIn: 'root'
// })
// export class StorageService {
//   constructor() {}

//   clean(): void {
//     window.sessionStorage.clear();
//   }

//   public saveUser(user: any): void {
//     window.sessionStorage.removeItem(USER_KEY);
//     window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
//   }

//   public getUser(): any {
//     const user = window.sessionStorage.getItem(USER_KEY);
//     if (user) {
//       return JSON.parse(user);
//     }

//     return {};
//   }

//   public isLoggedIn(): boolean {
//     const user = window.sessionStorage.getItem(USER_KEY);
//     if (user) {
//       return true;
//     }

//     return false;
//   }
// }

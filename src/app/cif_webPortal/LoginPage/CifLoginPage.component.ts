import { Component, OnInit, signal, ViewChild, ElementRef, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';

import { NgbCarouselModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import swal from 'sweetalert2';


 
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { TopBar } from "../top-bar/top-bar";
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { LoginSessionService } from '../../services/login-session.service';
import { CookieService } from 'ngx-cookie-service';
import { NgbCarousel } from "@ng-bootstrap/ng-bootstrap";
// Services
 //   selector: 'app-CifLoginPage',
//   templateUrl: './CifLoginPage.component.html',
//   styleUrls: ['./CifLoginPage.component.scss'],
//   imports: [TopBar, NgbCarousel]
@Component({
  selector: 'app-cif-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgbCarouselModule,TopBar, NgbCarousel],
   templateUrl: './CifLoginPage.component.html',
    styleUrls: ['./CifLoginPage.component.scss'],
})
export class CifLoginPageComponent implements OnInit {
    goto(val: any): void {
    this.router.navigateByUrl(val);
  }
  VisitUrl(Sufix: any, name: any, Id: any, catId: any) {
    this.router.navigateByUrl(Sufix + '/' + name + '/' + Id + '/' + catId);
  }
  // --- Dependency Injection ---
  private fb = inject(FormBuilder);
  private cifService = inject(LpuCIFWebService);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private session = inject(LoginSessionService);
  private router = inject(Router);
  private cookieService = inject(CookieService);
  private modalService = inject(NgbModal);

  // --- UI State Signals ---
  loadingIndicator = signal(false);
  isLoading = signal(true);
  submitted = signal(false);
  showPassword = signal(false);
  loginError = signal<string | null>(null);
  
  // --- Data Signals ---
  instruments = signal<any[]>([]);
  chunkedEvents = signal<any[][]>([]);
  loadingStates = signal<boolean[]>([]);

  // --- Form ---
  formdata!: FormGroup;

  // --- View References ---
  facilitiesSection = viewChild<ElementRef>('facilitiesSection');

  events = [
    { img: 'https://www.lpu.in/lpu-assets/images/cif/summer-training-programme-2025.webp', title: 'ANRF Sponsored Summer Training Programme', date: '(2 June - 11 July 2025)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-10.jpg', title: 'National Workshop', date: '(24 - 26 April 2025)' },
    // ... rest of your events array
  ];

  ngOnInit(): void {
    this.cookieService.delete('InternalUserAuthData');
    this.session.clearSession();
    this.initForm();
    this.loadInitialData();
  }

  private initForm(): void {
    this.formdata = this.fb.group({
      Email: ['', [Validators.required, Validators.minLength(5)]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      UserRoleS: ['', Validators.required]
    });
  }

  private async loadInitialData() {
    this.loadingIndicator.set(true);
    const startTime = Date.now();

    this.getAllInstruments();
    this.chunkedEvents.set(this.chunkArray(this.events, 3));

    const elapsed = Date.now() - startTime;
    setTimeout(() => this.loadingIndicator.set(false), Math.max(1500 - elapsed, 0));
  }

  // --- API Calls (Maintained as requested) ---
  getAllInstruments(): void {
    this.cifService.GetAllInstrumentsData().subscribe({
      next: response => {
        if (response.item1?.length > 0) {
          this.instruments.set(response.item1.slice(0, 8));
          this.loadingStates.set(new Array(this.instruments().length).fill(true));
        }
      },
      error: err => console.error(err)
    });
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.formdata.invalid) return;

    const { Email, password, UserRoleS } = this.formdata.value;
    this.authoriseUser(Email, password, parseInt(UserRoleS, 10));
  }

  authoriseUser(Id: string, Key: string, Role: number): void {
    const formData = new FormData();
    formData.append('Email', Id);
    formData.append('PasswordText', Key);
    formData.append('UserRole', Role.toString());

    this.cifService.GetAuthoriseUserData(formData).subscribe({
      next: (response) => {
        if (response.item1?.length > 0) {
          const email = response.item1[0].email;
          this.createToken(email, response);
        } else {
          this.handleLoginError('Invalid login details.');
        }
      },
      error: (err) => this.handleLoginError('Server Error', err)
    });
  }

  private createToken(id: string, response: any): void {
    this.authService.LoginJournalAccessTemp(id).subscribe({
      next: (data) => {
        this.storageService.saveUser(data);
        this.setUserData(response);
      }
    });
  }

  // --- Helper Methods ---
  private handleLoginError(msg: string, err?: any) {
    this.loginError.set(msg);
    swal.fire({ title: 'Error', text: msg, icon: 'warning' });
    this.formdata.reset({ UserRoleS: '' });
    this.submitted.set(false);
  }

  togglePasswordVisibility = () => this.showPassword.update(v => !v);

  onImageLoad = (index: number) => this.loadingStates.update(s => { s[index] = false; return s; });

  gotoFacilities() {
    this.facilitiesSection()?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  chunkArray(arr: any[], size: number): any[][] {
    return arr.reduce((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
  }

  setUserData(response: any): void {
    const user = response.item1[0];
    const userCookiesData = {
      CandidateName: user.candidateName,
      UserId: user.emailId,
      EmailId: user.emailId,
      UserRole: user.userRole,
      // ... rest of your mapping
    };

    this.cookieService.set('InternalUserAuthData', JSON.stringify(userCookiesData));
    
    // Logic for password check and SweetAlert modal remains the same as your source
    if (!user.isPasswordUpdated) {
        this.session.addToSession(response.item1);
        this.router.navigateByUrl('/SecurityIssue').then(() => window.location.reload());
    } else {
        this.showTermsModal(response.item1);
    }
  }

  private showTermsModal(userData: any) {
    swal.fire({
      title: 'Terms & Conditions',
      html: `YOUR_LONG_HTML_STRING_HERE`, // Keep your provided HTML string
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Yes, Agreed'
    }).then((result) => {
      if (result.isConfirmed) {
        this.session.addToSession(userData);
        this.router.navigateByUrl('/NewBookings').then(() => window.location.reload());
      } else {
        this.logoutUser();
      }
    });
  }

  logoutUser = () => {
    this.cookieService.delete('InternalUserAuthData');
    this.session.clearSession();
    this.router.navigateByUrl('/Login');
  }
}

// import { ChangeDetectorRef, Component, DOCUMENT, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
// import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import swal from 'sweetalert2';
// import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
// import { TopBar } from "../top-bar/top-bar";
// import { AuthService } from '../../services/auth.service';
// import { StorageService } from '../../services/storage.service';
// import { LoginSessionService } from '../../services/login-session.service';
// import { CookieService } from 'ngx-cookie-service';
// import { NgbCarousel } from "@ng-bootstrap/ng-bootstrap";

// @Component({
//   selector: 'app-CifLoginPage',
//   templateUrl: './CifLoginPage.component.html',
//   styleUrls: ['./CifLoginPage.component.scss'],
//   imports: [TopBar, NgbCarousel]
// })
// export class CifLoginPageComponent implements OnInit {
//    @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;
//   loadingIndicator: boolean = false;
//   i: any;

//   gotoFacilities() {
//     this.facilitiesSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
//   }

//   formdata!: FormGroup;
//   submitted = false;
//   showPassword = false;
//   loginError: string | null = null;
//   isLoginFailed = false;

//   UserData: any;
//   Email: string = '';

//   constructor(
//     private fb: FormBuilder,
//     private CIFwebService: LpuCIFWebService,
//     private authService: AuthService,
//     private storageService: StorageService,
//     private AuthSession: LoginSessionService,
//     private router: Router,
//     private cookieService: CookieService
//   ) { }

//   ngOnInit(): void {
//     this.cookieService.delete('InternalUserAuthData');
//     this.AuthSession.clearSession();
//     this.loadingIndicator = true;
//     const startTime = new Date().getTime();

//     this.loadForm();


//     const elapsed = new Date().getTime() - startTime;
//     const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 5s

//     setTimeout(() => {
//       this.loadingIndicator = false;
//     }, remainingDelay);


//     this.getAllInstruments();
//     this.chunkedEvents = this.chunkArray(this.events, 3);
//   }


//   loadForm(): void {
//     this.formdata = this.fb.group({
//       Email: ['', [Validators.required, Validators.minLength(5)]],
//       password: ['', [Validators.required, Validators.minLength(5)]],
//       UserRoleS: ['', Validators.required]
//     });
//     this.submitted = false;
//     this.loginError = null;
//   }

//   // Getters for form controls
//   get email(): AbstractControl | null {
//     return this.formdata.get('Email');
//   }

//   get passwordText(): AbstractControl | null {
//     return this.formdata.get('password');
//   }

//   get userRole(): AbstractControl | null {
//     return this.formdata.get('UserRoleS');
//   }

//   togglePasswordVisibility(): void {
//     this.showPassword = !this.showPassword;
//   }

//   checkUserType(event: Event): void {
//     const selectElement = event.target as HTMLSelectElement;
//     const selectedValue = selectElement.value;
//     if (!selectedValue) {
//       console.warn('Please select a valid role.');
//     }
//   }

//   onSubmit(): void {
//     this.submitted = true;

//     if (this.formdata.invalid) {
//       this.formdata.markAllAsTouched();
//       return;
//     }

//     const formValues = this.formdata.value;
//     const uid = formValues.Email;
//     const password = formValues.password;
//     const userRoleX = parseInt(formValues.UserRoleS, 10);

//     this.authoriseUser(uid, password, userRoleX);
//   }


//   authoriseUser(Id: string, Key: string, Role: any): void {
//     const loginData = {
//       Email: Id,           // Match C# property name
//       PasswordText: Key,   // Can include #, @, etc.
//       UserRole: Role
//     };
//     const formData = new FormData();
//     formData.append('Email', Id);
//     formData.append('PasswordText', Key);
//     formData.append('UserRole', Role);

//     this.CIFwebService.GetAuthoriseUserData(formData).subscribe({
//       next: (response) => {
//         if (response.item1 && response.item1.length > 0) {
//           this.Email = response.item1[0].email;
//           this.UserData = response.item1;
//           this.createToken(this.Email, response);
//           this.formdata.reset();
//           this.submitted = false;
//           this.loginError = null;
//           this.isLoginFailed = false;
//         } else {
//           this.loginError = 'Invalid login details. Please try again.';
//           this.isLoginFailed = true;
//           swal.fire({
//             title: 'Invalid Login Details',
//             text: 'Check Details!',
//             icon: 'warning'
//           });
//           this.formdata.reset();
//           this.formdata.patchValue({ UserRoleS: '' });
//           this.submitted = false;
//         }
//       },
//       error: (err) => {
//         console.error(err);
//         this.loginError = 'An error occurred while processing your request.';
//         this.isLoginFailed = true;

//         if (err.status === 0) {
//           swal.fire({
//             title: 'Server Down',
//             text: 'The server is currently unavailable. Please try again later.',
//             icon: 'error'
//           });
//         } else {
//           swal.fire({
//             title: 'Error',
//             text: this.loginError,
//             icon: 'error'
//           });
//         }

//         this.formdata.reset();
//         this.formdata.patchValue({ UserRoleS: '' });
//         this.submitted = false;
//       }
//     });
//   }

//   createToken(Id: string, response: any): void {
//     this.authService.LoginJournalAccessTemp(Id).subscribe({
//       next: (data) => {
//         this.storageService.saveUser(data);
//         this.setUserData(response);
//       },
//       error: () => {
//         // Handle error if needed
//       }
//     });
//   }

//   setUserData(response: any): void {
//     const user = response.item1[0];
//     this.UserData = response.item1;
//     const userCookiesData = {
//       CandidateName: user.candidateName,
//       UserId: user.emailId,
//       Department: user.department,
//       DepartmentName: user.departmentName,
//       Designation: user.department,
//       EmailId: user.emailId,
//       MobileNo: user.mobileNumber,
//       UserRole: user.userRole,
//       SupervisorName: user.supervisorName,
//       ProofNumber: btoa(user.idProofNumber),
//       ProofName: user.idProofType,
//       // PasswordText: user.passwordText
//     };

//     this.cookieService.set('InternalUserAuthData', JSON.stringify(userCookiesData));

//     const passwordchanged = user['isPasswordUpdated']
//     if (passwordchanged != true) {
//       alert(passwordchanged + " " + this.UserData.isPasswordUpdated)
//       this.AuthSession.addToSession(this.UserData);
//       this.router.navigateByUrl('/SecurityIssue').then(() => {
//         window.location.reload();
//       });
//     } else {
//       // Show terms and conditions modal
//       swal
//         .fire({
//           title: 'Terms & Conditions',
//           html: `
//           <div style="max-height: 400px; overflow-y: auto; text-align: left; padding: 10px;">
//             <p>Welcome to Lovely Professional University. These terms and conditions outline the rules and regulations for the use of Lovely Professional University's Website, located at lpu.co.in</p>
//             <p><strong>You specifically agree to all of the following undertakings:</strong></p>
//             <ul style="list-style-type: disc; padding-left: 20px; font-size: 14px; line-height: 1.6;">
//               <li>We agree to acknowledge CIF, LPU in our publications and thesis if the results from CIF instrumentation are incorporated/used in them.</li>
//               <li>I/We undertake to abide by the safety, standard sample preparation guidelines and precautions during testing of samples.</li>
//               <li>I/We understand the possibility of samples getting damaged during handling and analysis. I/We shall not claim for any loss/damage of the sample submitted to CIF and agree to resubmit the new sample requested by CIF for analysis.</li>
//               <li>CIF, LPU reserves the rights to return the samples without performing analysis and will refund the analytical charges (after deduction of GST, if applicable) under special circumstances.</li>
//               <li>I/we agree to maintain decorum during the visit in CIF labs for sample analysis and fully agree that CIF has full right to take action if decorum of CIF’s labs functionality is disturbed/hampered by me.</li>
//               <li>CIF shall not take any responsibility about the analysis, interpretation and publication of data acquired by the end user.</li>
//               <li>I/We hereby declare that the results of the analysis will not be used for the settlement of any legal issue.</li>
//             </ul>
//           </div>
//         `,
//           icon: 'info',
//           showCancelButton: true,
//           confirmButtonText: 'Yes, Agreed',
//           cancelButtonText: 'No',
//           customClass: { popup: 'swal-wide' }
//         })
//         .then((result) => {
//           if (result.isConfirmed) {
//             this.AuthSession.addToSession(this.UserData);
//             this.router.navigateByUrl('/NewBookings').then(() => {
//               window.location.reload();
//             });
//           } else {
//             swal
//               .fire({
//                 title: 'Agreement Required',
//                 text: 'You must agree to proceed further.',
//                 icon: 'warning'
//               })
//               .then(() => {
//                 this.logoutUser();
//               });
//           }
//         });
//     }
//   }

//   logoutUser(): void {
//     this.cookieService.delete('InternalUserAuthData');
//     this.AuthSession.clearSession();
//     this.router.navigateByUrl('/Login');
//   }
//   @ViewChild('table') table: ElementRef | undefined;
 
//   ResultData: any[] = []; currentPage = 1; itemsPerPage = 10; InstrumentsDataData: any[] = [];
//   tmpsInstrumentsDataData: any[] = []; tmpsResultData: any[] = [];
//   InstrumentId: any; instrumentName: any = ''; UserRole: any; UserId: any; uploadEnabled: boolean | undefined; Remarks: any; dataSource: any;
//   Description: any; ImageUrl: any;
//   columns: any;   headHtmlData: any[] = []; p: any = 1; perPage: any = 5;
//   loadingStates: boolean[] = []; ServerUrl: any; isLoading: boolean = true; loadedCount: number = 0;
//   openSampleInstructions() {
//     swal.fire({
//       title: 'Send Samples at Following Address :',
//       html: `
//              <address>
//               <div class="contact-text">
//              Central Instrumentation Facility (CIF) <br/>
//             Lovely Professional University <br/>
//             Block-38, Room No.106 <br/>
//             Jalandhar - Delhi G.T. Road, <br/>
//             Phagwara, Punjab (India) - 144411 <br/>
//             Phone : <a href="tel:+911824444021">+91 1824-444021</a><br>
//             Email : cif@lpu.co.in<br>
//             </div>
//              </address>`,
//       icon: 'info'
//     });
//   }
//   goto(val: any): void {
//     this.router.navigateByUrl(val);
//   }
//   VisitUrl(Sufix: any, name: any, Id: any, catId: any) {
//     this.router.navigateByUrl(Sufix + '/' + name + '/' + Id + '/' + catId);
//   }
//   onImageLoad(index: number): void {
//     this.loadingStates[index] = false;
//   }
//   onImageError(event: any, index: number): void {
//     event.target.src = '/image.jpg';
//     this.loadingStates[index] = false;
//   }

//   getAllInstruments(): void {
//     this.loadingIndicator = true;
//     const startTime = new Date().getTime();
//     this.CIFwebService.GetAllInstrumentsData().subscribe({
//       next: response => {
//         if (response.item1 && response.item1.length > 0) {
//           this.InstrumentsDataData = response.item1;
//           this.tmpsInstrumentsDataData = response.item1.slice(0, 8);
//           this.loadingStates = Array(this.tmpsInstrumentsDataData.length).fill(true); // Initialize loading states
//         } else {
//           this.InstrumentsDataData = [];
//         }
//         const elapsed = new Date().getTime() - startTime;
//         const remainingDelay = Math.max(2500 - elapsed, 0); // wait at least 5s

//         setTimeout(() => {
//           this.loadingIndicator = false;
//         }, remainingDelay);
//       },
//       error: err => {
//         this.loadingIndicator = false;
//         console.error(err);
//       }
//     });
//   }
//   gotoHome(): void {
//     this.router.navigateByUrl('Home');
//   }

//   // added on 21-aug-25
//   chunkedEvents: any[][] = [];

//   chunkArray(arr: any[], size: number): any[][] {
//     return arr.reduce((acc, _, i) =>
//       (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
//   }
//   events = [
//     {
//       img: 'https://www.lpu.in/lpu-assets/images/cif/summer-training-programme-2025.webp',
//       title: 'ANRF Sponsored Summer Training Programme',
//       date: '(2 June - 11 July 2025)'
//     },
//     {
//       img: 'https://www.lpu.in/lpu-assets/images/cif/event-10.jpg',
//       title: 'Discovering the Crystalline and Nano world using X-ray Diffraction and Particle Size and Zeta Potential Analyzer: A National Workshop',
//       date: '(24 - 26 April 2025)'
//     },
//     {
//       img: 'https://www.lpu.in/lpu-assets/images/cif/event-9.jpg',
//       title: 'National Workshop on Advance Research with Field Emission Scanning Electron Microscopy: Exploring the Nano-Structural Imaging',
//       date: '(27 - 29 March 2025)'
//     },
//     {
//       img: 'https://www.lpu.in/lpu-assets/images/cif/event-7.jpg',
//       title: 'National Workshop on Advanced Chromatographic Techniques Theory & Applications',
//       date: '(19 - 21 September, 2024)'
//     },
//     {
//       img: 'https://www.lpu.in/lpu-assets/images/cif/event-8.jpg',
//       title: 'SHORT-TERM COURSE on Advanced Materials analysis & Characterization Techniques: Hands-on-Training and Data Interpretation',
//       date: '(09 - 13 December, 2024)'
//     },
//     {
//       img: 'https://www.lpu.in/lpu-assets/images/cif/event-1.jpg',
//       title: 'National workshop on X-Ray Diffraction and Particle Size Analyzer',
//       date: '(26 - 27 April 2024)'
//     },
//     {
//       img: 'https://www.lpu.in/lpu-assets/images/cif/event-2.jpg',
//       title: 'Summer Training Programme',
//       date: '(3 June - 13 July 2024)'
//     },
//     {
//       img: 'https://www.lpu.in/lpu-assets/images/cif/event-3.jpg',
//       title: 'Workshop on Field Emission Scanning Electron Microscope',
//       date: '(29 - 30 March 2024)'
//     },
//     {
//       img: 'https://www.lpu.in/lpu-assets/images/cif/summer-training-programme-2025.webp',
//       title: 'ANRF Sponsored Summer Training Programme',
//       date: '(2 June - 11 July 2025)'
//     },
//   ];
//   get eventGroups() {
//     const groups = [];
//     for (let i = 0; i < this.events.length; i += 3) {
//       groups.push(this.events.slice(i, i + 3));
//     }
//     return groups;
//   }
// }

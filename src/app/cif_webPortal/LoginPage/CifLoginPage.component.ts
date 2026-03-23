import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import swal from 'sweetalert2';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { TopBar } from "../top-bar/top-bar";
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { LoginSessionService } from '../../services/login-session.service';
import { CookieService } from 'ngx-cookie-service';
import { NgbCarousel } from "@ng-bootstrap/ng-bootstrap";

 

@Component({
  selector: 'app-CifLoginPage',
  standalone: true,                          // ← Angular 14+ standalone API
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgbCarouselModule,
    TopBar,
  ],
  templateUrl: './CifLoginPage.component.html',
  styleUrls: ['./CifLoginPage.component.scss'],
})
export class CifLoginPageComponent implements OnInit {

  // ─── DI via inject() (Angular 14+, preferred in standalone) ─────────────────
  private readonly fb             = inject(FormBuilder);
  private readonly cifWebService  = inject(LpuCIFWebService);
  private readonly authService    = inject(AuthService);
  private readonly storageService = inject(StorageService);
  private readonly authSession    = inject(LoginSessionService);
  private readonly router         = inject(Router);
  private readonly cookieService  = inject(CookieService);

  // ─── Signals (replaces plain boolean fields for OnPush friendliness) ─────────
  readonly showPassword    = signal(false);
  readonly loadingIndicator = signal(false);
  readonly isLoading       = signal(true);

  // ─── Plain reactive state ────────────────────────────────────────────────────
  submitted          = false;
  loginError: string | null = null;
  isLoginFailed      = false;
  serverConnectionError = false;

  userData: any;
  email_value        = '';

  // ─── Instruments / carousel state ───────────────────────────────────────────
  instrumentsData:    any[] = [];
  tmpsInstrumentsData: any[] = [];
  loadingStates:      boolean[] = [];
  chunkedEvents:      any[][] = [];

  // ─── ViewChild refs ──────────────────────────────────────────────────────────
  @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;

  // ─── Reactive form ───────────────────────────────────────────────────────────
  formdata = this.fb.group({
    Email:     ['', [Validators.required, Validators.minLength(5)]],
    password:  ['', [Validators.required, Validators.minLength(5)]],
    UserRoleS: ['', Validators.required],
  });

  // ─── Getters (identical API to Angular 13 version) ──────────────────────────
  get email(): AbstractControl | null      { return this.formdata.get('Email'); }
  get passwordText(): AbstractControl | null { return this.formdata.get('password'); }
  get userRole(): AbstractControl | null   { return this.formdata.get('UserRoleS'); }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.cookieService.delete('InternalUserAuthData');
    this.authSession.clearSession();
    this.submitted  = false;
    this.loginError = null;

    this.getAllInstruments();
    this.chunkedEvents = this.chunkArray(this.events, 3);
  }

  // ─── UI helpers ─────────────────────────────────────────────────────────────
  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  checkUserType(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (!value) { console.warn('Please select a valid role.'); }
  }

  gotoFacilities(): void {
    this.facilitiesSection?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  goto(path: string): void {
    this.router.navigateByUrl(path);
  }

  visitUrl(prefix: string, name: string, id: any, catId: any): void {
    this.router.navigateByUrl(`${prefix}/${name}/${id}/${catId}`);
  }

  gotoHome(): void {
    this.router.navigateByUrl('Home');
  }

  // ─── Image callbacks ─────────────────────────────────────────────────────────
  onImageLoad(index: number): void {
    this.loadingStates[index] = false;
  }

  onImageError(event: Event, index: number): void {
    (event.target as HTMLImageElement).src = '/image.jpg';
    this.loadingStates[index] = false;
  }

  // ─── Form submission ─────────────────────────────────────────────────────────
  onSubmit(): void {
    this.submitted = true;

    if (this.formdata.invalid) {
      this.formdata.markAllAsTouched();
      return;
    }

    const { Email, password, UserRoleS } = this.formdata.value;
    this.authoriseUser(Email!, password!, parseInt(UserRoleS!, 10));
  }

  // ─── Auth flow ───────────────────────────────────────────────────────────────
  authoriseUser(id: string, key: string, role: number): void {
    const formData = new FormData();
    formData.append('Email', id);
    formData.append('PasswordText', key);
    formData.append('UserRole', String(role));

    this.cifWebService.GetAuthoriseUserData(formData).subscribe({
      next: (response) => {
        if (response?.error) {
          this.serverConnectionError = true;
          this.loginError  = response.message ?? 'Data Server Connection error, Try again later';
          this.isLoginFailed = true;
          this._resetForm();
          return;
        }

        if (response.item1?.length > 0) {
          this.email_value = response.item1[0].email;
          this.userData    = response.item1;
          this.createToken(this.email_value, response);
          this._resetForm();
          this.loginError    = null;
          this.isLoginFailed = false;
        } else {
          this.loginError    = 'Invalid login details. Please try again.';
          this.isLoginFailed = true;
          swal.fire({ title: 'Invalid Login Details', text: 'Check Details!', icon: 'warning' });
          this._resetForm();
        }
      },
      error: (err) => {
        console.error(err);
        this.loginError    = 'An error occurred while processing your request.';
        this.isLoginFailed = true;

        swal.fire({
          title: err.status === 0 ? 'Server Down' : 'Error',
          text:  err.status === 0
            ? 'The server is currently unavailable. Please try again later.'
            : this.loginError!,
          icon: 'error',
        });
        this._resetForm();
      },
    });
  }

  createToken(id: string, response: any): void {
    this.authService.LoginJournalAccessTemp(id).subscribe({
      next: (data) => {
        this.storageService.saveUser(data);
        this.setUserData(response);
      },
      error: () => { /* silent – handled upstream */ },
    });
  }

  setUserData(response: any): void {
    const user = response.item1[0];
    this.userData = response.item1;

    const userCookiesData = {
      CandidateName:  user.candidateName,
      UserId:         user.emailId,
      Department:     user.department,
      DepartmentName: user.departmentName,
      Designation:    user.department,
      EmailId:        user.emailId,
      MobileNo:       user.mobileNumber,
      UserRole:       user.userRole,
      SupervisorName: user.supervisorName,
      ProofNumber:    btoa(user.idProofNumber),
      ProofName:      user.idProofType,
    };
    this.cookieService.set('InternalUserAuthData', JSON.stringify(userCookiesData));

    if (user.isPasswordUpdated !== true) {
      this.authSession.addToSession(this.userData);
      this.router.navigateByUrl('/SecurityIssue').then(() => window.location.reload());
    } else {
      swal.fire({
        title: 'Terms & Conditions',
        html: `
          <div style="max-height:400px;overflow-y:auto;text-align:left;padding:10px;">
            <p>Welcome to Lovely Professional University. These terms and conditions outline the rules
               and regulations for the use of LPU's Website at lpu.co.in</p>
            <p><strong>You specifically agree to all of the following undertakings:</strong></p>
            <ul style="list-style-type:disc;padding-left:20px;font-size:14px;line-height:1.6;">
              <li>We agree to acknowledge CIF, LPU in our publications and thesis if the results from
                  CIF instrumentation are incorporated/used in them.</li>
              <li>I/We undertake to abide by the safety, standard sample preparation guidelines and
                  precautions during testing of samples.</li>
              <li>I/We understand the possibility of samples getting damaged during handling and
                  analysis. I/We shall not claim for any loss/damage of the sample submitted to CIF
                  and agree to resubmit the new sample requested by CIF for analysis.</li>
              <li>CIF, LPU reserves the rights to return the samples without performing analysis and
                  will refund the analytical charges (after deduction of GST, if applicable) under
                  special circumstances.</li>
              <li>I/we agree to maintain decorum during the visit in CIF labs for sample analysis and
                  fully agree that CIF has full right to take action if decorum of CIF's labs
                  functionality is disturbed/hampered by me.</li>
              <li>CIF shall not take any responsibility about the analysis, interpretation and
                  publication of data acquired by the end user.</li>
              <li>I/We hereby declare that the results of the analysis will not be used for the
                  settlement of any legal issue.</li>
            </ul>
          </div>`,
        icon: 'info',
        showCancelButton:  true,
        confirmButtonText: 'Yes, Agreed',
        cancelButtonText:  'No',
        customClass: { popup: 'swal-wide' },
      }).then((result) => {
        if (result.isConfirmed) {
          this.authSession.addToSession(this.userData);
          this.router.navigateByUrl('NewBookings').then(() => window.location.reload());
        } else {
          swal.fire({ title: 'Agreement Required', text: 'You must agree to proceed further.', icon: 'warning' })
            .then(() => this.logoutUser());
        }
      });
    }
  }

  logoutUser(): void {
    this.cookieService.delete('InternalUserAuthData');
    this.authSession.clearSession();
    this.router.navigateByUrl('/Login');
  }

  openSampleInstructions(): void {
    swal.fire({
      title: 'Send Samples at Following Address:',
      html: `<address>
               <div class="contact-text">
                 Central Instrumentation Facility (CIF)<br/>
                 Lovely Professional University<br/>
                 Block-38, Room No.106<br/>
                 Jalandhar - Delhi G.T. Road,<br/>
                 Phagwara, Punjab (India) - 144411<br/>
                 Phone: <a href="tel:+911824444021">+91 1824-444021</a><br/>
                 Email: cif@lpu.co.in
               </div>
             </address>`,
      icon: 'info',
    });
  }

  // ─── Instruments ─────────────────────────────────────────────────────────────
  getAllInstruments(): void {
    this.loadingIndicator.set(true);
    const startTime = Date.now();

    this.cifWebService.GetAllInstrumentsData().subscribe({
      next: (response) => {
        const items: any[] = response.item1?.length > 0 ? response.item1 : this.dataItems;
        this.instrumentsData     = items;
        this.tmpsInstrumentsData = [...items];
        this.loadingStates       = Array(items.length).fill(true);

        if (!response.item1?.length) {
          this.serverConnectionError = true;
          this.loginError = 'Data Server Connection error, Try again later';
        }

        const delay = Math.max(2500 - (Date.now() - startTime), 0);
        setTimeout(() => this.loadingIndicator.set(false), delay);
      },
      error: (err) => {
        console.error(err);
        this.instrumentsData     = this.dataItems;
        this.tmpsInstrumentsData = [...this.dataItems];
        this.loadingStates       = Array(this.dataItems.length).fill(true);
        this.serverConnectionError = true;
        this.loginError = 'Data Server Connection error, Try again later';
        this.loadingIndicator.set(false);
      },
    });
  }

  // ─── Events carousel helpers ─────────────────────────────────────────────────
  chunkArray<T>(arr: T[], size: number): T[][] {
    return arr.reduce<T[][]>((acc, _, i) =>
      i % size ? acc : [...acc, arr.slice(i, i + size)], []);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────
  private _resetForm(): void {
    this.formdata.reset();
    this.formdata.patchValue({ UserRoleS: '' });
    this.submitted = false;
  }

  // ─── Static data ─────────────────────────────────────────────────────────────
  readonly events = [
    { img: 'https://www.lpu.in/lpu-assets/images/cif/summer-training-programme-2025.webp', title: 'ANRF Sponsored Summer Training Programme', date: '(2 June - 11 July 2025)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-10.jpg', title: 'Discovering the Crystalline and Nano world using X-ray Diffraction and Particle Size and Zeta Potential Analyzer: A National Workshop', date: '(24 - 26 April 2025)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-9.jpg', title: 'National Workshop on Advance Research with Field Emission Scanning Electron Microscopy: Exploring the Nano-Structural Imaging', date: '(27 - 29 March 2025)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-7.jpg', title: 'National Workshop on Advanced Chromatographic Techniques Theory & Applications', date: '(19 - 21 September, 2024)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-8.jpg', title: 'SHORT-TERM COURSE on Advanced Materials analysis & Characterization Techniques: Hands-on-Training and Data Interpretation', date: '(09 - 13 December, 2024)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-1.jpg', title: 'National workshop on X-Ray Diffraction and Particle Size Analyzer', date: '(26 - 27 April 2024)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-2.jpg', title: 'Summer Training Programme', date: '(3 June - 13 July 2024)' },
    { img: 'https://www.lpu.in/lpu-assets/images/cif/event-3.jpg', title: 'Workshop on Field Emission Scanning Electron Microscope', date: '(29 - 30 March 2024)' },
  ];

  readonly dataItems = [
    { id: 1,  instrumentId: 0, instrumentName: 'Field Emission Scanning Electron Microscope, FESEM JEOL JSM-7610F-PLUS',                         categoryId: 1,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_23899918_2_2025_100006_FESEM-Instrument.JPG' },
    { id: 2,  instrumentId: 0, instrumentName: 'Powder XRD (Bruker D8 Advance)',                                                                   categoryId: 2,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_2005552723_2_2025_100009_XRD-Instrument.JPG' },
    { id: 3,  instrumentId: 0, instrumentName: 'FTIR with Diamond ATR & Pellet accessories (Perkin Elmer Spectrum 2)',                             categoryId: 3,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_926534728_2_2025_100014_FTIR-Instrument.JPG' },
    { id: 4,  instrumentId: 0, instrumentName: 'Fluorescence Spectrometer (Perkin Elmer LS6500)',                                                  categoryId: 4,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1449097689_2_2025_100011_Flourescence-Instrument.JPG' },
    { id: 5,  instrumentId: 0, instrumentName: 'Thermogravimetric analyzer (Perkin Elmer TGA 4000)',                                               categoryId: 5,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_543001469_2_2025_100012_TGA-Instrument.JPG' },
    { id: 6,  instrumentId: 0, instrumentName: 'Differential scanning calorimeter (Perkin Elmer DSC 6000)',                                        categoryId: 6,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1507892084_2_2025_100013_DSC-Instrument.JPG' },
    { id: 9,  instrumentId: 0, instrumentName: 'Gas Chromatography and Mass Spectroscopy, Shimadzu GCMS TQ8040 NX',                               categoryId: 7,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_2009182246_2_2025_100008_GCMS-Instrument.JPG' },
    { id: 10, instrumentId: 0, instrumentName: 'High Performance and Liquid Chromatography, Shimadzu Prominence LPGE',                            categoryId: 8,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_34620374_2_2025_100007_HPLC-Instrument.JPG' },
    { id: 11, instrumentId: 0, instrumentName: 'Electrochemical workstation, Metrohm: Multi-Channel Autolab AUT.MAC.204',                         categoryId: 9,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1060204202_3_2026_100000_ADP_2248.JPG' },
    { id: 12, instrumentId: 0, instrumentName: 'Density meter (Axis Density Meter with analytical balance ALN-220)',                              categoryId: 10, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_382530855_2_2025_100002_Density_Meter-Instrument.jpg' },
    { id: 13, instrumentId: 0, instrumentName: 'Refrigerated Centrifuge (Eppendorf 5804R)',                                                        categoryId: 11, isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_259413724_2_2025_100003_Refrigerated_Centirfuge-Instrument.JPG' },
    { id: 23, instrumentId: 0, instrumentName: 'Distilled Water (milli-Q water)',                                                                  categoryId: 0,  isActive: true, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_507378691_3_2025_100015_noImage.jpg' },
  ];
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

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import swal from 'sweetalert2';

import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { TopBar } from "../top-bar/top-bar";
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { LoginSessionService } from '../../services/login-session.service';


 
import { MouDocumentsService }  from '../../services/mou-documents.service';

 
interface EmployeeRecord {
  employeeName: string;
  employeeCode: string;
  department:   string;
  departmentName: string;
  email:        string;
  contactNo:    string;
}

interface UpdateApiResponse {
  item1: Array<{ msg: string; returnId: number }>;
}
 
const ALLOWED_EMPLOYEE_IDS = new Set([
  '24374', // vijay
  '20362', // napoor
  '25760', // anju
  '34228', // monika
  '34185', // puneet
  '16477', // prashant
  '27727', // naperna
  '27808', // kamlesh
  '26918', // baljeet
  '30694', // aman
  '29159',
  '31691', // sameer
  '33476', // sanjeev
  '31309', // jatinder
]);



@Component({
  selector: 'app-staff-user-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,TopBar],
  templateUrl: './StaffLogin.html',
  styleUrls: ['./StaffLogin.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffUserLoginComponent implements OnInit {

  // ── DI via inject() ───────────────────────────────────────────────────────
  private readonly fb                  = inject(FormBuilder);
  private readonly authService         = inject(AuthService);
  private readonly storageService      = inject(StorageService);
  private readonly cifWebService       = inject(LpuCIFWebService);
  private readonly authSession         = inject(LoginSessionService);
  private readonly router              = inject(Router);
  private readonly cookieService       = inject(CookieService);
  private readonly mouDocumentsService = inject(MouDocumentsService);

  // ── Template refs ─────────────────────────────────────────────────────────
  @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;

  // ── Signals (state) ───────────────────────────────────────────────────────
  readonly submitted    = signal(false);
  readonly showPassword = signal(false);
  readonly errMessage   = signal('');

  // ── Reactive Form ─────────────────────────────────────────────────────────
  formdata!: FormGroup;

  // ── Private state (not needed in template) ────────────────────────────────
  private secretKey    = '';
  private employeeCode = '';
  private emailId      = '';
  private candidateName  = '';
  private supervisorName = '';
  private mobileNo       = '';
  private department     = '';
  private departmentName = '';
  private userRole       = 'Admin-User';

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.authSession.clearSession();
    this.buildForm();
  }

  // ── Form Helpers ──────────────────────────────────────────────────────────
  private buildForm(): void {
    this.formdata = this.fb.group({
      Email:    ['', [Validators.required, Validators.minLength(5)]],
      password: ['', [Validators.required, Validators.minLength(5)]],
    });
    this.submitted.set(false);
    this.errMessage.set('');
  }

  get email(): AbstractControl | null {
    return this.formdata.get('Email');
  }

  get passwordText(): AbstractControl | null {
    return this.formdata.get('password');
  }

  // ── UI Actions ────────────────────────────────────────────────────────────
  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  gotoFacilities(): void {
    this.facilitiesSection?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  onSubmit(): void {
    this.submitted.set(true);
    if (this.formdata.invalid) return;

    const { Email, password } = this.formdata.value;
    this.secretKey = password ?? '';

    // Encode credentials before passing to token service
    const encodedEmail    = btoa(Email    ?? '');
    const encodedPassword = btoa(password ?? '');

    this.getToken(encodedEmail, encodedPassword);
  }

  // ── Auth Flow ─────────────────────────────────────────────────────────────
  private getToken(encodedEmail: string, encodedPassword: string): void {
    this.authService
      .loginInternalUser(atob(encodedEmail), atob(encodedPassword))
      .subscribe({
        next: (data) => {
          this.storageService.saveUser(data.token);
          this.fetchEmployeeDetails();
        },
        error: (err) => this.handleLoginFailure(err),
      });
  }

  private fetchEmployeeDetails(): void {
    this.mouDocumentsService.GetEmployeeDetails().subscribe({
      next: (response) => {
        if (!response.item1?.length) {
          this.handleLoginFailure(null);
          return;
        }

        const emp: EmployeeRecord = response.item1[0];

        // Store employee data locally
        this.candidateName  = emp.employeeName;
        this.employeeCode   = emp.employeeCode;
        this.department     = emp.department;
        this.departmentName = emp.departmentName;
        this.emailId        = emp.email;
        this.mobileNo       = emp.contactNo;
        this.supervisorName = emp.department;

        if (!ALLOWED_EMPLOYEE_IDS.has(this.employeeCode)) {
          this.errMessage.set(
            'Not Authorised. This Dashboard is only for CIF Staff Members!'
          );
          return;
        }

        this.persistSessionAndNavigate(response.item1);
      },
      error: (err) => this.handleLoginFailure(err),
    });

    this.formdata.reset();
  }

  private persistSessionAndNavigate(employeeList: EmployeeRecord[]): void {
    this.authSession.addToSession(employeeList);

    const userCookiesData = {
      CandidateName:  this.candidateName,
      UserId:         this.employeeCode,
      Department:     this.department,
      DepartmentName: this.departmentName,
      Designation:    this.department,
      EmailId:        this.emailId,
      MobileNo:       this.mobileNo,
      UserRole:       this.userRole,
      SupervisorName: this.supervisorName,
      ProofNumber:    this.mobileNo,
      ProofName:      'Mobile',
      PasswordText:   this.secretKey,
    };

    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 40); 

    this.cookieService.set(
      'StaffUserAuthData',
      JSON.stringify(userCookiesData),
      expirationDate,
      '/',
      undefined,
      true,
      'Lax'
    );

    this.errMessage.set('');
    this.router.navigate(['/StaffActionBookings']);
  }

  // ── Error Handling ────────────────────────────────────────────────────────
  private handleLoginFailure(error: unknown): void {
    console.error('Login failure:', error);
    this.cookieService.delete('StaffUserAuthData');
    this.authSession.clearSession();
    this.errMessage.set('Login Failed. Invalid Details.');

    swal.fire({
      title: 'Login Failed',
      text:  'Login details are invalid. Please try again.',
      icon:  'warning',
    });
  }

  // ── Store Internal User (called separately if needed) ─────────────────────
  storeInternalUserInDatabase(): void {
    const formData = new FormData();
    formData.append('UserEmail',      this.emailId);
    formData.append('CandidateName',  this.candidateName);
    formData.append('SupervisorName', this.supervisorName);
    formData.append('MobileNumber',   this.mobileNo);
    formData.append('SchoolName',     this.department);
    formData.append('DepartmentName', this.departmentName);
    formData.append('IdProofType',    'UMSID');
    formData.append('IdProofNumber',  this.employeeCode);
    formData.append('UserType',       this.userRole);
    formData.append('Address',        'Internal User');
    formData.append('PasswordText',   btoa(this.secretKey));

    this.cifWebService.NewUserRecord(formData).subscribe({
      next: (data: UpdateApiResponse) => {
        if (!data?.item1?.[0]) return;
        const { msg, returnId } = data.item1[0];
        if (msg !== 'Success' && returnId !== -1) {
          console.warn('Unexpected store result:', msg);
        }
      },
      error: (err) => console.error('Error saving user:', err),
    });
  }
}
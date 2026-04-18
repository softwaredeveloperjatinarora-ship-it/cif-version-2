import { CommonModule } from '@angular/common';
import { Component, inject, signal, ViewChild, ElementRef, computed, effect } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { LoginSessionService } from '../../services/login-session.service';
import { CookieService } from 'ngx-cookie-service';
import { MouDocumentsService } from '../../services/mou-documents.service';
import swal from 'sweetalert2';

import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { TopBar } from '../top-bar/top-bar';
import { EventsCarousel } from '../../shared/EventsCarousel/events-carousel';

interface UserData {
    CandidateName: string;
    UserId: string;
    Department: string;
    DepartmentName: string;
    Designation: string;
    EmailId: string;
    MobileNo: string;
    UserRole: string;
    SupervisorName: string;
    ProofNumber: string;
    ProofName: string;
}

@Component({
    selector: 'app-login-page',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        TopBar, 
        EventsCarousel

    ],
    templateUrl: './LoginPage.html',
    styleUrls: ['./LoginPage.scss']
})
export class LoginPageComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly storageService = inject(StorageService);
    private readonly cifWebService = inject(LpuCIFWebService);
    private readonly authSession = inject(LoginSessionService);
    private readonly cookieService = inject(CookieService);
    private readonly mouDocumentsService = inject(MouDocumentsService);
    public readonly router = inject(Router);

    @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;

    showPassword = signal(false);
    isLoading = signal(false);
    storeResult = signal(0);

    loginForm: FormGroup = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.minLength(5)]],
        password: ['', [Validators.required, Validators.minLength(5)]],
        userRole: ['', [Validators.required]]
    });

    loginFormControl = (name: string): FormControl => this.loginForm.get(name) as FormControl;

    constructor() {
        effect(() => {
            if (this.isLoading()) {
            }
        });
    }

    gotoFacilities(): void {
        this.facilitiesSection?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }

    togglePasswordVisibility(): void {
        this.showPassword.update(value => !value);
    }

    onRoleChange(event: Event): void {
        const selectElement = event.target as HTMLSelectElement;
        const selectedValue = selectElement.value;

        if (selectedValue === '') {
            console.warn('Please select a valid role.');
        }
    }

    async onSubmit(): Promise<void> {
        if (this.loginForm.invalid) return;

        this.isLoading.set(true);
        const { email, password, userRole } = this.loginForm.value;

        try {
            await this.getToken(email, password, userRole);
        } finally {
            this.isLoading.set(false);
        }
    }

    private async getToken(email: string, password: string, role: string): Promise<void> {
        try {
            const loginResult = await this.authService.loginInternalUser(email, password).toPromise();

            this.storageService.saveUser(loginResult.token);

            if (role === 'Staff') {
                await this.getEmployeeDetails();
            } else if (role === 'Student') {
                await this.getStudentById(email);
            }
        } catch (error) {
            this.handleLoginError(error);
        }
    }

    private async getStudentById(regNo: string): Promise<void> {
        try {
            const response = await this.cifWebService.getStudentById(regNo).toPromise();

            if (response?.item1?.length > 0) {
                const student = response.item1[0];
                const userData = this.mapStudentToUserData(student, regNo);

                await this.processSuccessfulLogin(userData);
            } else {
                throw new Error('No student record found');
            }
        } catch (error) {
            this.handleLoginError(error);
        }
    }

    private async getEmployeeDetails(): Promise<void> {
        try {
            const response = await this.mouDocumentsService.GetEmployeeDetails().toPromise();

            if (response?.item1?.length > 0) {
                const employee = response.item1[0];
                const userData = this.mapEmployeeToUserData(employee);

                await this.processSuccessfulLogin(userData);
            } else {
                throw new Error('No employee record found');
            }
        } catch (error) {
            this.handleLoginError(error);
        }
    }

    private mapStudentToUserData(student: any, regNo: string): UserData {
        return {
            CandidateName: student.studentName,
            UserId: student.registerationNumber,
            Department: student.schoolName ?? 'LPU',
            DepartmentName: student.courseName ?? '',
            Designation: 'Student',
            EmailId: student.officialEmail ?? student.studentEmail ?? '',
            MobileNo: student.studentMobile ?? '',
            UserRole: '400000',
            SupervisorName: 'N-A',
            ProofNumber: student.studentMobile ?? '',
            ProofName: 'Mobile'
        };
    }

    private mapEmployeeToUserData(employee: any): UserData {
        return { 
            CandidateName: employee.employeeName,
            UserId: employee.employeeCode,
            Department: 'LPU',
            DepartmentName: employee.departmentName,
            Designation: employee.department,
            EmailId: employee.email?.length > 3 ? employee.email : employee.officialEmailId,
            MobileNo: employee.contactNo,
            UserRole: '400000',
            SupervisorName: employee.employeeName,
            ProofNumber: employee.contactNo,
            ProofName: 'Mobile'
        };
    }

    private async processSuccessfulLogin(userData: UserData): Promise<void> {
        this.cookieService.set('InternalUserAuthData', JSON.stringify(userData));

        this.authSession.addToSession(userData);

        await this.storeInternalUserInDatabase(userData);

        if (this.storeResult() === 1 || this.storeResult() === 2) {
            await this.showTermsAgreement();
        } else {
            throw new Error('Error in user storage');
        }
    }

    private async storeInternalUserInDatabase(userData: UserData): Promise<void> {
        const formData = new FormData();
        formData.append('UserEmail', userData.EmailId);
        formData.append('CandidateName', userData.CandidateName);
        formData.append('SupervisorName', userData.SupervisorName);
        formData.append('MobileNumber', userData.MobileNo);
        formData.append('SchoolName', 'LPU');
        formData.append('DepartmentName', userData.DepartmentName);
        formData.append('IdProofType', 'UMS ID');
        formData.append('IdProofNumber', userData.UserId);
        formData.append('UserType', userData.UserRole);
        formData.append('Address', 'Internal User');
        formData.append('PasswordText', this.loginForm.value.password);

        const response = await this.cifWebService.NewUserRecord(formData).toPromise();

        const result = response?.item1[0]?.msg;
        const errorCode = response?.item1[0]?.returnId;

        if (result === 'Success') {
            this.storeResult.set(1);
        } else if (result === 'Already Stored') {
            this.storeResult.set(2);
        } else if (errorCode === -1) {
            this.storeResult.set(-1);
            throw new Error('Error in user storage');
        }
    }

    private async showTermsAgreement(): Promise<void> {
        const { isConfirmed } = await swal.fire({
            title: 'Terms & Conditions',
            text: 'Do you agree with terms & conditions?',
            html: `
        <div style="max-height: 450px; overflow-y: auto; text-align: left; padding: 10px;">
          <p>Welcome to Lovely Professional University. These terms and conditions outline the rules and regulations...</p>
          <!-- Full terms content here -->
        </div>
      `,
            customClass: { popup: 'swal-wide' },
            showCancelButton: true,
            confirmButtonText: 'Yes, Agreed',
            cancelButtonText: 'No',
            icon: 'info'
        });

        if (isConfirmed) {
            this.router.navigateByUrl('/NewBookings').then(() => {
                window.location.reload();
            });
        } else {
            await swal.fire({
                title: 'Agreement Required',
                text: 'You must agree to proceed further.',
                icon: 'warning'
            });
            this.logoutUser();
        }
    }

    private handleLoginError(error: any): void {
        swal.fire({
            title: 'Login Failed',
            text: 'Login details are invalid!',
            icon: 'warning'
        });
        this.loginForm.reset();
    }

    logoutUser(): void {
        this.cookieService.delete('InternalUserAuthData');
        this.authSession.clearSession();
        this.router.navigateByUrl('/Login');
    }
}
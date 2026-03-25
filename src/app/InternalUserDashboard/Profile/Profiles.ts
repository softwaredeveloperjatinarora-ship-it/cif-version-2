import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
 
import swal from 'sweetalert2';


import { LoginSessionService } from '../../services/login-session.service';

import { CifMenuBarComponent } from '../cif-menu-bar/cif-menu-bar.component';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';





interface CookieAuthData {
  UserRole: string;
  EmailId: string;
}

interface UserDetailsResponse {
  candidateName: string;
  supervisorName: string;
  mobileNumber: string;
  organisation: string;
  departmentName: string;
  idProofType: string;
  idProofNumber: string;
  address: string;
}

interface UpdateApiResponse {
  item1: Array<{ msg: string; returnId: number }>;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CifMenuBarComponent],
  templateUrl: './Profiles.html',
  styleUrls: ['./Profiles.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent implements OnInit {
 private readonly router        = inject(Router);
  private readonly fb             = inject(FormBuilder);
  private readonly cookieService  = inject(CookieService);
  private readonly cifWebService  = inject(LpuCIFWebService);

  readonly isForm1Submitted = signal(false);
  readonly isEditMode       = signal(false);
  readonly isLoading        = signal(false);

  cifUserForm!: FormGroup;

  readonly loadingIndicator   = signal(false);

  get form1() {
    return this.cifUserForm.controls;
  }

  ngOnInit(): void {
    this.buildForm();
    this.populateUserData();
  }

  private buildForm(): void {
    this.cifUserForm = this.fb.group({
      EmailId:       [{ value: '', disabled: true }, [Validators.required, Validators.email, Validators.maxLength(150)]],
      CandidateName: ['', [Validators.required, Validators.maxLength(30)]],
      SupervisorName:['', [Validators.required, Validators.maxLength(30)]],
      MobileNumber:  ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      InstituteName: ['', [Validators.required, Validators.maxLength(30)]],
      DepartmentName:['', [Validators.required, Validators.maxLength(30)]],
      IdProofType:   ['', Validators.required],
      IdProofNumber: ['', [Validators.required, Validators.maxLength(15)]],
      Address:       ['', [Validators.required, Validators.maxLength(150)]],
    });
  }

  private populateUserData(): void {
    this.loadingIndicator.set(true);
    const startTime = Date.now();
    const raw = this.cookieService.get('InternalUserAuthData');
    if (!raw) return;

    const cookie: CookieAuthData = JSON.parse(raw);

    this.cifWebService.CIFGetUserDetails(cookie.EmailId).subscribe({
      next: (data) => {
        const user: UserDetailsResponse = data.item1[0];

        this.cifUserForm.patchValue({
          EmailId:        cookie.EmailId,
          CandidateName:  user.candidateName  ?? '',
          SupervisorName: user.supervisorName ?? '',
          MobileNumber:   user.mobileNumber   ?? '',
          InstituteName:  user.organisation   ?? '',
          DepartmentName: user.departmentName ?? '',
          IdProofType:    user.idProofType    ?? '',
          IdProofNumber:  user.idProofNumber  ?? '',
          Address:        user.address        ?? '',
        });

        this.cifUserForm.disable();
        this.cifUserForm.get('EmailId')?.disable();

          const delay = Math.max(500 - (Date.now() - startTime), 0);
        setTimeout(() => this.loadingIndicator.set(false), delay);
      },
      error: (err) => {
        console.error('Error fetching user details:', err);         
        this.loadingIndicator.set(false);
        
      },
    });
  }

  onEdit(): void {
    this.isEditMode.set(true);
    this.isForm1Submitted.set(false);
    this.cifUserForm.enable();
    this.cifUserForm.get('EmailId')?.disable();  
  }

  onUpdate(): void {
    this.isForm1Submitted.set(true);

    if (this.cifUserForm.invalid) {
      return;
    }

    this.isEditMode.set(false);
    this.isLoading.set(true);
    this.cifUserForm.disable();
    this.cifUserForm.get('EmailId')?.disable();

    const raw = this.cifUserForm.getRawValue();

    const formData = new FormData();
    formData.append('CandidateName',  raw.CandidateName);
    formData.append('SupervisorName', raw.SupervisorName);
    formData.append('MobileNumber',   raw.MobileNumber);
    formData.append('InstituteName',  raw.InstituteName);
    formData.append('DepartmentName', raw.DepartmentName);
    formData.append('IdProofType',    raw.IdProofType);
    formData.append('IdProofNumber',  raw.IdProofNumber);
    formData.append('Address',        raw.Address);
    formData.append('UserEmail',      raw.EmailId);

    

    this.cifWebService.UpdateUserDetails(formData).subscribe({
      next: (data: UpdateApiResponse) => {
        const result    = data.item1[0]['msg'];
        const errorCode = data.item1[0]['returnId'];

        if (result === 'Success') {
          swal.fire({
            title: 'Details Updated Successfully',
            text: result,
            icon: 'success',
          }).then(() => this.goto('UserProfiles'));

        } else if (errorCode === -1) {
          swal.fire({
            title: 'Already Submitted',
            icon: 'error',
          }).then(() => this.goto('UserProfiles'));

        } else {
          swal.fire({
            title: 'Some Technical Issue',
            text: result,
            icon: 'error',
          }).then(() => this.goto('UserProfiles'));
        }
      },
      error: () => {
        swal.fire({
          title: 'Error Occurred',
          text: 'Unable to complete the request. Please try again later.',
          icon: 'error',
        });
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

   goto(path: string): void {
    this.router.navigate(['/' + path]);
  }
}
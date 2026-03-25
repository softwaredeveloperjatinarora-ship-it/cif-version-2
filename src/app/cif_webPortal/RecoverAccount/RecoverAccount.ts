import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { TopBar } from "../top-bar/top-bar";
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { LoginSessionService } from '../../services/login-session.service';
import { CookieService } from 'ngx-cookie-service';
import { NgbCarousel } from "@ng-bootstrap/ng-bootstrap";
import { MouDocumentsService } from '../../services/mou-documents.service';
import { HttpClient } from '@angular/common/http';
import swal from 'sweetalert2';

import Swal from 'sweetalert2';
@Component({
  selector: 'app-recover-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './RecoverAccount.html',
  styleUrls: ['./RecoverAccount.scss']
})

export class RecoverAccountComponent {
  isLoading = signal<boolean>(false);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cifService = inject(LpuCIFWebService);

  
  currentStep = signal<number>(1);
  errorMessage = signal<string>('');
  idProofType = signal<string>('');
  actualIdProofNumber = signal<string>('');
  userDetails = signal<any>(null);

  
  emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  idProofForm = this.fb.nonNullable.group({
    idProofNumber: ['', Validators.required]
  });

  resetPasswordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  checkEmail() {
    if (this.emailForm.invalid) return;

    const { email } = this.emailForm.getRawValue();

    this.isLoading.set(true);

    this.cifService.CIFGetUserDetails(email).subscribe({
      next: (res: any) => {
        if (res?.item1?.length > 0) {
          const user = res.item1[0];

          this.userDetails.set(user);
          this.idProofType.set(user.idProofType);
          this.actualIdProofNumber.set(user.idProofNumber);

          this.currentStep.set(2);
          this.errorMessage.set('');
        } else {
          this.errorMessage.set('No user found or account is locked');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error fetching user details');
        this.isLoading.set(false);
      }
    });
  }

  
  

  
  
  
  
  

  
  
  

  
  
  
  
  
  
  
  
  
  
  

  verifyIdProof() {
    if (this.idProofForm.invalid) return;

    const entered = this.idProofForm.value.idProofNumber;

    if (entered === this.actualIdProofNumber()) {
      this.currentStep.set(3);
      this.errorMessage.set('');
    } else {
      this.errorMessage.set('ID Proof number does not match');
    }
  }

  resetPassword() {
    if (this.resetPasswordForm.invalid) return;

    const { password, confirmPassword } = this.resetPasswordForm.getRawValue();

    if (password !== confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    const { email } = this.emailForm.getRawValue();

    const formData = new FormData();
    formData.append('UserId', email);
    formData.append('Password', password);

    this.isLoading.set(true);

    this.cifService.CIFUpdateUserDetails(formData).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);

        const result = res?.item1?.[0]?.msg;

        if (result === 'Success') {
          Swal.fire('Success', 'Password updated successfully', 'success')
            .then(() => this.router.navigate(['/Login']));
        } else {
          Swal.fire('Error', 'Unable to update. Try again.', 'error');
        }
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Error', 'Failed to update password', 'error');
      }
    });
  }

  
  

  

  
  
  
  
  
  

  
  
  

  
  
  

  
  
  
  
  
  
  
  
  
  
  
  

  
  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(v => v - 1);
    }
    this.errorMessage.set('');
  }
}

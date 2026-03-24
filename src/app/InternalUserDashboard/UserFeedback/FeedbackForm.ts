import {
  Component, OnInit, inject, DestroyRef, ChangeDetectorRef, PLATFORM_ID, signal, ViewEncapsulation
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CookieService } from 'ngx-cookie-service';
import Swal from 'sweetalert2';

// Shared Components
import { CifMenuBarComponent } from '../cif-menu-bar/cif-menu-bar.component';

// Services
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';

@Component({
  selector: 'app-UserFeedbackForm',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CifMenuBarComponent,
  ],
  templateUrl: './Feedbackform.html',
  styleUrls: ['./Feedbackform.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserFeedbackFormComponent implements OnInit {
  
  private readonly CIFwebService = inject(LpuCIFWebService);
  private readonly fb             = inject(FormBuilder);
  private readonly cookieService  = inject(CookieService);
  private readonly cdr            = inject(ChangeDetectorRef);
  private readonly destroyRef     = inject(DestroyRef);
  private readonly platformId     = inject(PLATFORM_ID);

 
  loadingIndicator = signal<boolean>(false);
  
   
  isSubmitting = signal<boolean>(false);

  // ── Form & Data ───────────────────────────────────────────────────────────
  feedbackForm!: FormGroup;
  isSubmitted = false;
  user_Email: string = '';

  ngOnInit(): void {
    // SSR Guard: Ensure logic only runs in the browser
    if (!isPlatformBrowser(this.platformId)) return;

    // 1. Activate initial loader immediately
    this.loadingIndicator.set(true);

    // 2. Extract Session Data
    this.initializeSession();

    // 3. Initialize Form
    this.loadForm();

    /** * 4. Loader Fix: We use a fixed duration (1.2s) instead of calculating 
     * diffs to ensure the user actually sees a smooth transition and the 
     * loader doesn't flicker or stay stuck.
     */
    setTimeout(() => {
      this.loadingIndicator.set(false);
      // Trigger change detection to ensure the UI removes the loader DOM
      this.cdr.detectChanges();
    }, 1200);
  }

  private initializeSession(): void {
    const raw = this.cookieService.get('InternalUserAuthData');
    if (raw) {
      try {
        const authData = JSON.parse(raw);
        this.user_Email = authData.EmailId || '';
      } catch (error) {
        console.error("Session Parse Error", error);
        this.cookieService.delete('InternalUserAuthData');
      }
    }
  }

  loadForm(): void {
    this.feedbackForm = this.fb.group({
      email: [this.user_Email, [Validators.required, Validators.email]],
      rating: [null, [Validators.required, Validators.min(1), Validators.max(10)]],
      CifComments: ['', Validators.required],
      suggestions: ['', Validators.required],
    });
  }

  // Helper for Template Validation
  get f() { return this.feedbackForm.controls; }

  setRating(value: number): void {
    this.feedbackForm.get('rating')?.setValue(value);
    this.feedbackForm.get('rating')?.markAsTouched();
  }

  onSubmit(): void {
    this.isSubmitted = true;

    if (this.feedbackForm.invalid) {
      Swal.fire('Form Invalid', 'Please check all required fields.', 'warning');
      return;
    }

    // Activate submission loader
    this.isSubmitting.set(true);

    const formData = new FormData();
    formData.append('EmailId', this.user_Email);
    formData.append('Rating', this.feedbackForm.value.rating);
    formData.append('Comments', this.feedbackForm.value.CifComments);
    formData.append('Suggestions', this.feedbackForm.value.suggestions);

    this.CIFwebService.NewCifFeedback(formData)
      .pipe(
        takeUntilDestroyed(this.destroyRef), // Auto-unsubscribe
        // Ensure loader closes regardless of success or error
      )
      .subscribe({
        next: (data) => {
          this.isSubmitting.set(false);
          const response = data.item1[0];
          
          if (response['msg'] === 'Success') {
            Swal.fire({
              title: 'Success!',
              text: 'Your feedback has been recorded.',
              icon: 'success'
            }).then(() => window.location.reload());
          } else {
            Swal.fire('Note', response['msg'], 'info');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          Swal.fire('Error', 'Could not submit feedback. Please try again.', 'error');
          console.error(err);
        }
      });
  }
}

// import {
//   Component, OnInit,
//   inject, DestroyRef, ChangeDetectorRef, PLATFORM_ID
// } from '@angular/core';
// import { isPlatformBrowser, CommonModule } from '@angular/common';
// import {
//   ReactiveFormsModule, FormBuilder, FormGroup, Validators
// } from '@angular/forms';
// // ✅ FormsModule removed — no [(ngModel)] used anywhere (dual-binding bug fixed)
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CookieService } from 'ngx-cookie-service';
// import Swal from 'sweetalert2';

// import { CifMenuBarComponent } from '../cif-menu-bar/cif-menu-bar.component';
// import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
// import { StorageService } from '../../services/storage.service';
// import { AuthService } from '../../services/auth.service';
// import { LoginSessionService } from '../../services/login-session.service';

// @Component({
//   selector: 'app-UserFeedbackForm',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,  // ✅ Only reactive forms — no FormsModule/ngModel
//     CifMenuBarComponent,
//   ],
//   templateUrl: './Feedbackform.html',
//   styleUrls: ['./Feedbackform.scss'],
// })
// export class UserFeedbackFormComponent implements OnInit {

//   // ── DI via inject() ───────────────────────────────────────────────────────
//   private readonly CIFwebService = inject(LpuCIFWebService);
//   private readonly fb            = inject(FormBuilder);
//   private readonly cookieService = inject(CookieService);
//   private readonly cdr           = inject(ChangeDetectorRef);
//   private readonly destroyRef    = inject(DestroyRef);
//   // ✅ SSR guard — prevents JSON.parse('') crash during server-side render
//   private readonly platformId    = inject(PLATFORM_ID);

//   // ── User session ──────────────────────────────────────────────────────────
//   UserSessionData: any;
//   UserRole:        any;
//   UserId:          any;
//   user_Email:      any;
//   supervisorName:  any;
//   departmentName:  any;
//   candidateName:   any;
//   MobileNo:        any;

//   // ── Form ──────────────────────────────────────────────────────────────────
//   feedbackForm!: FormGroup;
//   isSubmitted      = false;
//   isLoading        = false;
//   submissionSuccess = false;
//   submissionError   = false;
//   loadingIndicator  = false;

//   // ── Lifecycle ─────────────────────────────────────────────────────────────
//   ngOnInit(): void {
//     if (!isPlatformBrowser(this.platformId)) { return; }

//     const raw = this.cookieService.get('InternalUserAuthData');
//     if (!raw || raw.trim().length === 0) { return; }

//     try {
//       const c            = JSON.parse(raw);
//       this.UserRole      = c.UserRole;
//       this.UserId        = c.UserRole;
//       this.user_Email    = c.EmailId;
//       this.candidateName = c.CandidateName;
//       this.MobileNo      = c.MobileNo;
//     } catch {
//       this.cookieService.delete('InternalUserAuthData');
//       return;
//     }
 
//     this.loadForm();

//     this.loadingIndicator = true;
//     const startTime = Date.now();
//     const remaining = Math.max(500 - (Date.now() - startTime), 0);
//     setTimeout(() => {
//       this.loadingIndicator = false;
//       this.cdr.detectChanges();
//     }, remaining);
//   }

//   loadForm(): void {
//     this.feedbackForm = this.fb.group({
//       name:        [''],
//       email:       [this.user_Email, [Validators.required, Validators.email]],
//       rating:      [null, [Validators.required, Validators.min(1), Validators.max(10)]],
//       CifComments: ['', Validators.required],
//       suggestions: ['', Validators.required],
//     });
//   }

//   get f() { return this.feedbackForm.controls; }

//   onSubmit(): void {
//     this.isSubmitted      = true;
//     this.submissionError  = false;
//     this.submissionSuccess = false;

//     if (this.feedbackForm.invalid) { return; }

//     this.isLoading = true;

//     const formData = new FormData();
//     formData.append('EmailId',     this.user_Email);
//     formData.append('Rating',      this.feedbackForm.value.rating);
//     formData.append('Comments',    this.feedbackForm.value.CifComments);
//     formData.append('Suggestions', this.feedbackForm.value.suggestions);

//     this.CIFwebService.NewCifFeedback(formData)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (data) => {
//           const result    = data.item1[0]['msg'];
//           const errorCode = data.item1[0]['returnId'];

//           if (result === 'Success') {
//             Swal.fire({
//               title: 'Feedback Stored Successfully',
//               text:  data.item1[0]['msg'],
//               icon:  'success',
//             }).then(() => window.location.reload());
//           } else if (errorCode === -1) {
//             Swal.fire({ title: 'Already Submitted', icon: 'error' })
//               .then(() => window.location.reload());
//           } else {
//             Swal.fire({
//               title: 'Some Technical Issue',
//               text:  result,
//               icon:  'error',
//             }).then(() => window.location.reload());
//           }
//         },
//         error: () => {
//           Swal.fire({
//             title: 'Error Occurred',
//             text:  'Unable to complete the request. Please try again later.',
//             icon:  'error',
//           });
//           this.isLoading = false;
//         },
//         complete: () => {
//           this.isLoading = false;
//         },
//       });
//   }

//   // ── Rating helper used in template ────────────────────────────────────────
//   setRating(value: number): void {
//     this.feedbackForm.get('rating')?.setValue(value);
//     this.feedbackForm.get('rating')?.markAsTouched();
//   }
// }
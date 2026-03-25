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


import { CifMenuBarComponent } from '../cif-menu-bar/cif-menu-bar.component';


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

 
  feedbackForm!: FormGroup;
  isSubmitted = false;
  user_Email: string = '';

  ngOnInit(): void {
   
    if (!isPlatformBrowser(this.platformId)) return;

   
    this.loadingIndicator.set(true);

   
    this.initializeSession();

   
    this.loadForm();

    /** * 4. Loader Fix: We use a fixed duration (1.2s) instead of calculating 
     * diffs to ensure the user actually sees a smooth transition and the 
     * loader doesn't flicker or stay stuck.
     */
    setTimeout(() => {
      this.loadingIndicator.set(false);
     
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

   
    this.isSubmitting.set(true);

    const formData = new FormData();
    formData.append('EmailId', this.user_Email);
    formData.append('Rating', this.feedbackForm.value.rating);
    formData.append('Comments', this.feedbackForm.value.CifComments);
    formData.append('Suggestions', this.feedbackForm.value.suggestions);

    this.CIFwebService.NewCifFeedback(formData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
       
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














































































 


















































































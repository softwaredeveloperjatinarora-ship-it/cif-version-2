import Swal from 'sweetalert2';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  signal,
  computed,
  inject,
  DOCUMENT,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import {
  catchError,
  finalize,
  of,
  tap,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { LoginSessionService } from '../../services/login-session.service';


 import { EventModel } from './Event.model';
import { AdminDashboardComponent } from '../AdminDashboard/AdminDashboard';
import { MouDocumentsService } from '../../services/mou-documents.service';
import { CifMouCrudService } from './cif-mou-crud.service';

// --- Constants ---
const MIN_LOADING_TIME = 1500;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

 
@Component({
  selector: 'app-cifMou-crud',
  standalone: true,
  imports: [ AdminDashboardComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    DatePipe,
  ],
  templateUrl: './cifMou-crud.html',
  styleUrls: ['./cifMou-crud.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class cifMouCrudComponent implements OnInit {
    // ── Service Injection ───────────────────────────────────────────────────

  private readonly mouService = inject(MouDocumentsService);
  private readonly CifMouCrudService = inject(CifMouCrudService);

  private readonly eventsService = inject(LpuCIFWebService);
  private readonly authSession = inject(LoginSessionService);
  private readonly document = inject(DOCUMENT);


  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly cookieService = inject(CookieService);
  readonly userRole = signal<string>('Admin');
  readonly userId = signal<string | null>(null);
  readonly userEmail = signal<string>('');
  readonly loginName = signal<string>('');
  readonly isAdmin = computed(() => this.userRole() === 'Admin');

  // ── Signal State: Form Management ───────────────────────────────────────
  readonly mouForm = signal<FormGroup | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isFormSubmitted = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly showForm = signal<boolean>(true);

  // ── Signal State: Data Management ───────────────────────────────────────
  readonly mous = signal<any[]>([]);
  readonly mouStatuses = signal<{ label: string; value: string }[]>([
    { label: 'Active', value: '0' },
    { label: 'Expired', value: '1' },
  ]);
  readonly paginatedMouData = signal<any[]>([]);

  // ── Signal State: Pagination & Search ───────────────────────────────────
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);
  readonly searchTerm = signal<string>('');
  readonly totalItems = computed(() => this.mous().length);
  readonly totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  // ── Signal State: Edit Mode ─────────────────────────────────────────────
  readonly currentUserId = signal<string | null>(null);
  readonly currentEmail = signal<string | null>(null);
  readonly currentMouUrl = signal<string | null>(null);

  // ── Signal State: File Handling ─────────────────────────────────────────
  readonly mouFileData = signal<string | null>(null);
  readonly mouFileName = signal<string | null>(null);

  // ── Signal State: Configuration ─────────────────────────────────────────
  readonly serverUrl = signal<string>('https://files.lpu.in/umsweb/CIFDocuments/');
  readonly maxFileSizeMb = signal<number>(10);
  readonly MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB for MOU documents
  readonly allowedFileTypes = signal<string>('.pdf,.doc,.docx');

  // ── Computed Signals ────────────────────────────────────────────────────
  readonly daysUntilExpiry = computed(() => {
    const form = this.mouForm();
    if (!form) return null;
    const endDate = form.get('mouEndDate')?.value;
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  });

  readonly mouStatus = computed(() => {
    const days = this.daysUntilExpiry();
    if (days === null) return null;
    return days < 0 ? 'Expired' : days < 30 ? 'Expiring Soon' : 'Active';
  });
Math: any;

  constructor() {
    // Automatic cleanup with takeUntilDestroyed
  }

  ngOnInit(): void {
    // this.initializeUser();
    this.loadAllMous();
    this.initializeForm();
  }

  /**
   * Initialize user from authentication/cookie
   */
  private initializeUser(): void {
    try {
      const cookieData = this.cookieService.get('authData');
      if (cookieData) {
        const parsed = JSON.parse(cookieData);
        this.userRole.set(parsed.userRole || 'Admin');
        this.userEmail.set(parsed.EmailId || '');
        this.userId.set(parsed.UserId || null);
        this.loginName.set(parsed.LoginName || parsed.EmailId || '');
      }
    } catch (error) {
      console.error('User initialization failed:', error);
      this.userRole.set('Admin');
    }
  }

  /**
   * Initialize reactive form with validation rules
   */
  private initializeForm(): void {
    const form = this.fb.group({
      userId: ['', Validators.required],
      mouStartDate: ['', Validators.required],
      mouEndDate: ['', Validators.required],
      mouRemarks: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1500)]],
      mouDocumentUrl: [''],
    }, { validators: this.dateRangeValidator() });

    this.mouForm.set(form);
  }

  /**
   * Custom validator: End date must be after start date
   */
  private dateRangeValidator() {
    return (form: AbstractControl) => {
      const startDate = form.get('mouStartDate')?.value;
      const endDate = form.get('mouEndDate')?.value;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end <= start) {
          form.get('mouEndDate')?.setErrors({ invalidDateRange: true });
          return { invalidDateRange: true };
        }
      }

      return null;
    };
  }

  /**
   * Get form controls for easy template access
   */
  get formControls(): { [key: string]: AbstractControl } {
    return this.mouForm()?.controls || {};
  }

  /**
   * RETRIEVE: Load all MOUs from API
   * Action: 'ViewAll' for admin, 'View' for user
   */
  loadAllMous(): void {
    this.isLoading.set(true);
    const startTime = Date.now();

    const formData = new FormData();
    formData.append('Action', 'ViewAll');
  this.eventsService
        .CifMOUCrudOperations(formData, 'ViewAll')
        .pipe(
          // takeUntilDestroyed(),
          tap((response: any) => {
            if (response?.item1?.length > 0) {
              this.mous.set(response.item1 as EventModel[]);
            } else {
              this.mous.set([]);
            }
            this.filterAndPaginate();
          }),
          catchError((error) => {
            console.error('Error fetching Details:', error);
            Swal.fire({
              title: 'Data Error',
              text: 'Failed to load event list.',
              icon: 'error',
            });
            this.mous.set([]);
            this.filterAndPaginate();
            return of(null);
          }),
          finalize(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(MIN_LOADING_TIME - elapsed, 0);
            setTimeout(() => {
              this.isLoading.set(false);              
              this.cdRef.markForCheck();
            }, remaining);
          })
        )
        .subscribe();
   
  }
 
  private addNewMou(): void {
    const formData = this.prepareFormData('Insert');

    // Uncomment when service is available:
     this.eventsService.CifMOUCrudOperations(formData,'Insert')
      .pipe(
        tap((response: any) => {
          if (response?.returnId > 0 || response?.success) {
            Swal.fire('Success', 'MOU record created successfully', 'success');
            this.resetForm();
            this.loadAllMous();
          } else {
            Swal.fire('Error', response?.message || 'Failed to create MOU', 'error');
          }
        }),
        catchError((error) => {
          console.error('Create error:', error);
          Swal.fire('Error', 'Failed to create MOU record', 'error');
          return of(null);
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();

    // Mock implementation
    setTimeout(() => {
      Swal.fire('Success', 'MOU record created successfully', 'success');
      this.resetForm();
      this.isLoading.set(false);
    }, 1000);
  }

  /**
   * UPDATE: Modify existing MOU record
   * Action: 'Update'
   */
  private updateMou(): void {
    const formData = this.prepareFormData('Update');

    // Uncomment when service is available:
     this.eventsService.CifMOUCrudOperations(formData, 'Update')
      .pipe(
        tap((response: any) => {
          if (response?.returnId > 0 || response?.success) {
            Swal.fire('Success', `MOU for ${this.currentEmail()} updated successfully`, 'success');
            this.resetForm();
            this.loadAllMous();
          } else {
            Swal.fire('Error', response?.message || 'Failed to update MOU', 'error');
          }
        }),
        catchError((error) => {
          console.error('Update error:', error);
          Swal.fire('Error', 'Failed to update MOU record', 'error');
          return of(null);
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();

    // Mock implementation
    // setTimeout(() => {
    //   Swal.fire('Success', `MOU for ${this.currentEmail()} updated successfully`, 'success');
    //   this.resetForm();
    //   this.isLoading.set(false);
    // }, 1000);
  }

  /**
   * DELETE/REJECT: Mark MOU as not approved
   * Action: 'Delete' (actually rejection in the procedure)
   */
  onReject(mou: any): void {
    Swal.fire({
      title: 'Reject MOU?',
      text: `Are you sure you want to reject the MOU for ${mou.emailId}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading.set(true);

        const formData = new FormData();
        formData.append('Action', 'Delete');
        formData.append('UserId', mou.userId);
        formData.append('LoginName', this.loginName());
        formData.append('MOURemarks', 'MOU rejected by admin');

        // Uncomment when service is available:
         this.eventsService.CifMOUCrudOperations(formData,'Delete')
          .pipe(
            tap((response: any) => {
              if (response?.returnId > 0 || response?.success) {
                Swal.fire('Rejected', `MOU for ${mou.emailId} has been rejected`, 'success');
                this.loadAllMous();
              } else {
                Swal.fire('Error', response?.message || 'Failed to reject MOU', 'error');
              }
            }),
            catchError((error) => {
              console.error('Reject error:', error);
              Swal.fire('Error', 'Failed to reject MOU', 'error');
              return of(null);
            }),
            finalize(() => {
              this.isLoading.set(false);
            })
          )
          .subscribe();

        // Mock implementation
        // setTimeout(() => {
        //   Swal.fire('Rejected', `MOU for ${mou.emailId} has been rejected`, 'success');
        //   this.mous.update((mous) => mous.filter((m) => m.userId !== mou.userId));
        //   this.filterAndPaginate();
        //   this.isLoading.set(false);
        // }, 1000);
      }
    });
  }

  /**
   * APPROVE: Mark MOU as approved
   * Updates IsMouApproved to 1
   */
  onApprove(mou: any): void {
    if (mou.isMouApproved === 1) {
      Swal.fire('Info', 'This MOU is already approved', 'info');
      return;
    }

    Swal.fire({
      title: 'Approve MOU?',
      text: `Approve the MOU for ${mou.emailId}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading.set(true);

        const formData = new FormData();
        formData.append('Action', 'Update');
        formData.append('UserId', mou.userId);
        formData.append('MOUDocumentUrl', mou.mouDocumentUrl || '');
        formData.append('MouStartDate', mou.mouStartDate);
        formData.append('MouEndDate', mou.mouEndDate);
        formData.append('MOURemarks', mou.mouRemarks || '');
        formData.append('LoginName', this.loginName());

        // This would update the record with approval
        setTimeout(() => {
          Swal.fire('Approved', `MOU for ${mou.emailId} has been approved`, 'success');
          this.isLoading.set(false);
        }, 1000);
      }
    });
  }

  /**
   * Edit mode: Load MOU data into form
   */
  onEdit(mou: any): void {
    this.isEditMode.set(true);
    this.currentUserId.set(mou.userId);
    this.currentEmail.set(mou.emailId);
    this.currentMouUrl.set(mou.mouDocumentUrl);
    this.showForm.set(true);

    const form = this.mouForm();
    if (form) {
      form.patchValue({
        userId: mou.userId,
        mouStartDate: mou.mouStartDate,
        mouEndDate: mou.mouEndDate,
        mouRemarks: mou.mouRemarks,
        mouDocumentUrl: mou.mouDocumentUrl,
      });
    }

    // Scroll to form
    document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Form submission handler (Create or Update)
   */
  onSubmit(): void {
    this.isFormSubmitted.set(true);
    const form = this.mouForm();

    if (!form || form.invalid) {
      Swal.fire('Validation Error', 'Please fill out all required fields correctly.', 'warning');
      return;
    }

    // Document validation for new MOU
    if (!this.mouFileData() && !this.isEditMode()) {
      Swal.fire('Validation Error', 'Please upload an MOU document.', 'warning');
      return;
    }

    this.isLoading.set(true);

    if (this.isEditMode()) {
      this.updateMou();
    } else {
      this.addNewMou();
    }
  }

  /**
   * Prepare FormData for API submission
   */
  private prepareFormData(action: 'Insert' | 'Update' | 'Delete'): FormData {
    const form = this.mouForm();
    const formValue = form?.getRawValue() || {};
    const formData = new FormData();

    formData.append('Action', action);

    if (action === 'Update' && this.currentUserId()) {
      formData.append('UserId', this.currentUserId()!);
    } else if (action === 'Insert') {
      formData.append('UserId', formValue.userId || '');
    }

    if (action !== 'Delete') {
      formData.append('MouStartDate', formValue.mouStartDate || '');
      formData.append('MouEndDate', formValue.mouEndDate || '');
      formData.append('MOURemarks', formValue.mouRemarks || '');

      if (this.mouFileData() && this.mouFileName()) {
        formData.append('MOUDocumentUrl', this.mouFileName()!);
        formData.append('MOUDocumentData', this.mouFileData()!);
      } else if (this.currentMouUrl() && this.isEditMode()) {
        formData.append('MOUDocumentUrl', this.currentMouUrl()!);
      }
    }

    formData.append('LoginName', this.loginName());

    return formData;
  }

  /**
   * Handle file selection and conversion to Base64
   */
  async onFileSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    if (file.size > this.MAX_FILE_SIZE_BYTES) {
      await Swal.fire(
        'File Too Large',
        `File size exceeds ${this.maxFileSizeMb()}MB limit.`,
        'warning'
      );
      target.value = '';
      return;
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedFileTypes().includes(fileExtension)) {
      await Swal.fire(
        'Invalid File Type',
        `Only these formats are allowed: ${this.allowedFileTypes()}`,
        'warning'
      );
      target.value = '';
      return;
    }

    try {
      const base64 = await this.readFileAsBase64(file);
      this.mouFileData.set(base64);
      this.mouFileName.set(file.name);
    } catch (error) {
      await Swal.fire('Error', 'Failed to read file', 'error');
      target.value = '';
    }
  }

  /**
   * Utility: Read file as Base64
   */
  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Download/View MOU document
   */
  onDownloadDocument(mouUrl: string | null): void {
    if (mouUrl) {
      const fullUrl = `${this.serverUrl()}${mouUrl}`;
      window.open(fullUrl, '_blank');
    } else {
      Swal.fire('No Document', 'No MOU document available.', 'info');
    }
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.isEditMode.set(false);
    this.currentUserId.set(null);
    this.currentEmail.set(null);
    this.currentMouUrl.set(null);
    this.mouFileData.set(null);
    this.mouFileName.set(null);
    this.isFormSubmitted.set(false);

    const form = this.mouForm();
    if (form) {
      form.reset();
    }
  }

  /**
   * Filter MOUs by search term and paginate
   */
  private filterAndPaginate(): void {
    let filteredMous = this.mous();
    const searchTerm = this.searchTerm().toLowerCase().trim();

    if (searchTerm) {
      filteredMous = filteredMous.filter((mou) =>
        mou.emailId?.toLowerCase().includes(searchTerm) ||
        mou.userId?.toLowerCase().includes(searchTerm) ||
        mou.mouRemarks?.toLowerCase().includes(searchTerm)
      );
    }

    const totalItems = filteredMous.length;
    const totalPages = Math.ceil(totalItems / this.pageSize()) || 1;
    let currentPage = Math.min(this.currentPage(), totalPages);

    this.currentPage.set(currentPage);

    const startIndex = (currentPage - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    this.paginatedMouData.set(filteredMous.slice(startIndex, endIndex));

    this.cdRef.markForCheck();
  }

  /**
   * Handle search input change
   */
  onSearchChange(): void {
    this.currentPage.set(1);
    this.filterAndPaginate();
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(): void {
    this.currentPage.set(1);
    this.filterAndPaginate();
  }

  /**
   * Navigate to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.filterAndPaginate();
    }
  }

  /**
   * Toggle form visibility
   */
  toggleForm(): void {
    this.showForm.update((val) => !val);
    if (this.showForm()) {
      setTimeout(() => {
        document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
  }

  /**
   * Helper method to get MOU status badge
   */
  getMouStatusBadge(status: string): { text: string; class: string } {
    switch (status) {
      case '0':
        return { text: 'Active', class: 'badge bg-success' };
      case '1':
        return { text: 'Expired', class: 'badge bg-danger' };
      default:
        return { text: 'Unknown', class: 'badge bg-secondary' };
    }
  }

  /**
   * Helper method to get approval status badge
   */
  getApprovalBadge(approved: number | null): { text: string; class: string } {
    if (approved === 1) {
      return { text: 'Approved', class: 'badge bg-success' };
    } else if (approved === 0) {
      return { text: 'Rejected', class: 'badge bg-danger' };
    } else {
      return { text: 'Pending', class: 'badge bg-warning' };
    }
  }
}


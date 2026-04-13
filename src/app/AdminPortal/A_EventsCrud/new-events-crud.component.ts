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


// import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
// import { LoginSessionService } from 'src/app/_services/login-session.service';
 import { EventModel } from './Event.model';
import { AdminDashboardComponent } from '../AdminDashboard/AdminDashboard';

// --- Constants ---
const MIN_LOADING_TIME = 1500;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * EventsCrudComponent - Angular 20 Standalone Component
 * Refactored from Angular 14 with modern patterns:
 * - Standalone component
 * - Signals for state management
 * - takeUntilDestroyed for automatic cleanup
 * - ChangeDetectionStrategy.OnPush for performance
 * - Modern async/await patterns
 */
@Component({
  selector: 'app-events-crud',
  standalone: true,
  imports: [ AdminDashboardComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    DatePipe,
  ],
  templateUrl: './new-events-crud.component.html',
  styleUrls: ['./new-events-crud.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewEventsCrudComponent implements OnInit {
  // ── Inject Services ────────────────────────────────────────────────────
  private readonly eventsService = inject(LpuCIFWebService);
  private readonly fb = inject(FormBuilder);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly authSession = inject(LoginSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cookieService = inject(CookieService);
  private readonly document = inject(DOCUMENT);

  // ── Signal State Management ─────────────────────────────────────────────
  // User & Auth
  readonly userRole = signal<string>('Internal User');
  readonly userId = signal<any>(null);
  readonly userEmail = signal<string>('');
  readonly supervisorName = signal<string>('');
  readonly departmentName = signal<string>('');
  readonly candidateName = signal<string>('');

  // Form & Loading States
  readonly eventForm = signal<FormGroup | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isFormSubmitted = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly isLoginFailed = signal<boolean>(false);

  // Data Management
  readonly events = signal<EventModel[]>([]);
  readonly categories = signal<string[]>(['Upcoming', 'Happenings']);
  readonly paginatedEventsData = signal<EventModel[]>([]);

  // Pagination
  readonly pageSize = signal<number>(5);
  readonly currentPage = signal<number>(1);
  readonly totalItems = computed(() => this.events().length);
  readonly totalPages = computed(() =>
    Math.ceil(this.totalItems() / this.pageSize())
  );

  // Search
  readonly searchTerm = signal<string>('');

  // Edit Mode State
  readonly currentEventId = signal<number | null>(null);
  readonly currentImageUrl = signal<string | null>(null);

  // File Handling
  readonly eventFileData = signal<string | null>(null);
  readonly eventFileName = signal<string | null>(null);

  // Carousel/Chunked Data
  readonly chunkedEvents = signal<any[][]>([]);
  readonly upcomingChunkedEvents = signal<any[][]>([]);

  // Server Configuration
  readonly serverUrl = signal<string>(
    'https://files.lpu.in/umsweb/CIFDocuments/'
  );
  readonly maxFileSizeMb = signal<number>(
    MAX_FILE_SIZE_BYTES / (1024 * 1024)
  );

  // ── Computed Signals ────────────────────────────────────────────────────
  readonly isImageRequired = computed(() => {
    const form = this.eventForm();
    if (!form) return false;
    return form.get('eventCategory')?.value === 'Happenings';
  });

  constructor() {
     
  }

  ngOnInit(): void {
    // this.initializeUserFromCookie();
    this.initForm();
    this.loadEvents();
  }

  /**
   * Initialize user data from cookie
   */
  private initializeUserFromCookie(): void {
    const cookieData = this.cookieService.get('authData');

    if (cookieData) {
      try {
        const cookies = JSON.parse(cookieData);
        this.userRole.set(
          cookies.userRole?.length > 0 ? cookies.userRole : 'Internal User'
        );
        this.userEmail.set(cookies.EmailId || '');
        this.supervisorName.set(cookies.SupervisorName || '');
        this.departmentName.set(cookies.DepartmentName || '');
        this.candidateName.set(cookies.CandidateName || '');
      } catch (error) {
        console.error('Failed to parse cookie data:', error);
        this.showErrorAndRedirect();
      }
    } else {
      this.showErrorAndRedirect();
    }
  }

  /**
   * Show error alert and redirect to home
   */
  private showErrorAndRedirect(): void {
    Swal.fire({
      title: 'Login Failed',
      text: 'Session expired. Please login again.',
      icon: 'warning',
    }).then(() => {
      this.router.navigate(['/Home']);
    });
  }

  /**
   * Initialize reactive form with validation
   */
  private initForm(): void {
    const form = this.fb.group({
      eventId: [null],
      eventName: ['', [Validators.required, Validators.maxLength(1500)]],
      eventDate: ['', Validators.required],
      eventCategory: ['Happenings', Validators.required],
      eventDetails: ['', [Validators.required, Validators.maxLength(1500)]],
      imageUrl: [''],
    });

    this.eventForm.set(form);
  }

  /**
   * Get form controls for template access
   */
  get f(): { [key: string]: AbstractControl } {
    return this.eventForm()?.controls || {};
  }

  /**
   * Load all events from the API
   */
  loadEvents(): void {
    this.isLoading.set(true);
    const startTime = Date.now();
    this.events.set([]);

    const formData = new FormData();
    formData.append('Action', 'View');

    this.eventsService
      .EventsCrudOperation(formData, 'View')
      .pipe(
        // takeUntilDestroyed(),
        tap((response: any) => {
          if (response?.item1?.length > 0) {
            this.events.set(response.item1 as EventModel[]);
          } else {
            this.events.set([]);
          }
          this.filterAndPaginate();
        }),
        catchError((error) => {
          console.error('Error fetching events:', error);
          Swal.fire({
            title: 'Data Error',
            text: 'Failed to load event list.',
            icon: 'error',
          });
          this.events.set([]);
          this.filterAndPaginate();
          return of(null);
        }),
        finalize(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(MIN_LOADING_TIME - elapsed, 0);
          setTimeout(() => {
            this.isLoading.set(false);
            this.updateChunks();
            this.cdRef.markForCheck();
          }, remaining);
        })
      )
      .subscribe();
  }

  /**
   * Update chunked carousel data
   */
  private updateChunks(): void {
    const width = window.innerWidth;
    let itemsPerSlide = 3;

    if (width < 768) {
      itemsPerSlide = 1;
    } else if (width < 992) {
      itemsPerSlide = 2;
    }

    // Filter Happenings events
    const happeningEvents = this.events().filter(
      (e) => e.eventCategory === 'Happenings'
    );
    const happeningGroups: any[][] = [];

    for (let i = 0; i < happeningEvents.length; i += itemsPerSlide) {
      happeningGroups.push(happeningEvents.slice(i, i + itemsPerSlide));
    }

    this.chunkedEvents.set(happeningGroups);

    // Filter Upcoming events
    const upcomingEvents = this.events().filter(
      (e) => e.eventCategory === 'Upcoming'
    );
    const upcomingGroups: any[][] = [];

    for (let i = 0; i < upcomingEvents.length; i += itemsPerSlide) {
      upcomingGroups.push(upcomingEvents.slice(i, i + itemsPerSlide));
    }

    this.upcomingChunkedEvents.set(upcomingGroups);
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    const form = this.eventForm();
    if (form) {
      form.reset();
      form.get('eventCategory')?.setValue('Happenings');
    }

    this.isEditMode.set(false);
    this.currentEventId.set(null);
    this.currentImageUrl.set(null);
    this.eventFileData.set(null);
    this.eventFileName.set(null);
    this.isFormSubmitted.set(false);

    // Reload to refresh data
    window.location.reload();
  }

  /**
   * Edit an existing event
   */
  onEdit(event: EventModel): void {
    // Guard: Ensure eventId exists
    if (!event.eventId) {
      Swal.fire({
        title: 'Error',
        text: 'Cannot edit event without a valid ID.',
        icon: 'error',
      });
      return;
    }

    this.isEditMode.set(true);
    this.currentEventId.set(event.eventId);
    this.currentImageUrl.set(event.imageUrl);
    this.eventFileData.set(null);
    this.eventFileName.set(null);

    let formattedDate = event.eventDate;
    if (event.eventDate?.includes('T')) {
      formattedDate = event.eventDate.split('T')[0];
    }

    const form = this.eventForm();
    if (form) {
      form.patchValue({
        eventId: event.eventId,
        eventName: event.eventName,
        eventDate: formattedDate,
        eventCategory: event.eventCategory,
        eventDetails: event.eventDetails,
        imageUrl: event.imageUrl,
      });
    }

    this.isFormSubmitted.set(false);
    this.cdRef.markForCheck();
  }

  /**
   * Delete an event with confirmation
   */
  onDelete(event: EventModel): void {
    // Guard: Ensure eventId exists
    if (!event.eventId) {
      Swal.fire({
        title: 'Error',
        text: 'Cannot delete event without a valid ID.',
        icon: 'error',
      });
      return;
    }

    Swal.fire({
      title: 'Delete Event?',
      text: `Are you sure you want to delete "${event.eventName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading.set(true);

        const deleteFormData = new FormData();
        deleteFormData.append('Action', 'Delete');
        deleteFormData.append('EventId', event.eventId!.toString()); // Non-null assertion safe here
        deleteFormData.append('EventName', event.eventName.toString());

        this.eventsService
          .EventsCrudOperation(deleteFormData, 'Delete')
          .pipe(
            // takeUntilDestroyed(),
            tap(() => {
              Swal.fire(
                'Deleted!',
                'The event has been removed.',
                'success'
              );
            }),
            catchError((err) => {
              console.error('Deletion failed:', err);
              Swal.fire(
                'Failed!',
                'Deletion failed due to an error.',
                'error'
              );
              return of(null);
            }),
            finalize(() => {
              this.loadEvents();
            })
          )
          .subscribe();
      }
    });
  }

  /**
   * Handle form submission (Create or Update)
   */
  onSubmit(): void {
    this.isFormSubmitted.set(true);

    const form = this.eventForm();
    if (!form || form.invalid) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill out all required fields correctly.',
        icon: 'warning',
      });
      return;
    }

    if (
      this.isImageRequired() &&
      !this.eventFileData() &&
      !this.isEditMode()
    ) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please upload the event image file.',
        icon: 'warning',
      });
      return;
    }

    this.isLoading.set(true);

    if (this.isEditMode()) {
      this.updateEvent();
    } else {
      this.addNewEvent();
    }
  }

  /**
   * Update existing event
   */
  private updateEvent(): void {
    const formData = this.prepareFormData('Update');

    this.eventsService
      .EventsCrudOperation(formData, 'Update')
      .pipe(
        // takeUntilDestroyed(),
        tap((data: any) => {
          const errorCode = data?.item1?.[0]?.['returnData'];
          if (errorCode > 0) {
            Swal.fire({
              title: 'Success',
              text: `Event ID ${this.currentEventId()} updated successfully.`,
              icon: 'success',
            });
          }
        }),
        catchError((error) => {
          console.error('Update Error:', error);
          Swal.fire({
            title: 'Error',
            text: 'Failed to update event (HTTP Error).',
            icon: 'error',
          });
          return of(null);
        }),
        finalize(() => {
          this.resetForm();
        })
      )
      .subscribe();
  }

  /**
   * Add new event
   */
  private addNewEvent(): void {
    const formData = this.prepareFormData('Insert');

    this.eventsService
      .EventsCrudOperation(formData, 'Insert')
      .pipe(
        // takeUntilDestroyed(),
        tap((data: any) => {
          const errorCode = data?.item1?.[0]?.['returnData'];
          if (errorCode > 0) {
            Swal.fire({
              title: 'Success',
              text: 'Event created successfully.',
              icon: 'success',
            });
          }
        }),
        catchError((error) => {
          console.error('API Error:', error);
          Swal.fire({
            title: 'Error Occurred',
            text: 'Unable to complete the request (HTTP Error). Please check the network tab.',
            icon: 'error',
          });
          return of(null);
        }),
        finalize(() => {
          this.resetForm();
        })
      )
      .subscribe();
  }

  /**
   * Prepare FormData for API submission
   */
  private prepareFormData(
    action: 'Insert' | 'Update'
  ): FormData {
    const form = this.eventForm();
    const formValue = form?.getRawValue() || {};
    const formData = new FormData();

    formData.append('Action', action);

    // Only append EventId if it exists and we're updating
    if (action === 'Update' && this.currentEventId()) {
      formData.append('EventId', this.currentEventId()!.toString());
    }

    formData.append('EventName', formValue.eventName || '');
    formData.append('EventDate', formValue.eventDate || '');
    formData.append('EventCategory', formValue.eventCategory || '');
    formData.append('EventDetails', formValue.eventDetails || '');

    if (this.eventFileData() && this.eventFileName()) {
      formData.append('ImageUrl', this.eventFileName()!);
      formData.append('EventFileData', this.eventFileData()!);
    } else {
      formData.append('ImageUrl', '');
      formData.append('EventFileData', '');
    }

    formData.append('LoginName', this.userEmail());
    formData.append('DisapprovalReason', '');

    return formData;
  }

  /**
   * Read file as Base64
   */
  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve((reader.result as string).split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Handle file selection for event image
   */
  async onFileSelectedEventFile(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file: File | null = (target.files as FileList)?.[0] || null;

    this.eventFileData.set(null);
    this.eventFileName.set(null);

    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      await Swal.fire({
        title: 'Invalid File Size',
        text: `File size exceeds ${this.maxFileSizeMb()}MB.`,
        icon: 'warning',
      });
      target.value = '';
      return;
    }

    try {
      const base64Data = await this.readFileAsBase64(file);
      this.eventFileData.set(base64Data);
      this.eventFileName.set(file.name);
    } catch (error) {
      await Swal.fire({
        title: 'File Read Error',
        text: 'Could not process the selected file.',
        icon: 'error',
      });
      target.value = '';
    }
  }

  /**
   * Open file in new window
   */
  onViewFile(filePath: string | null): void {
    if (filePath) {
      window.open(`${this.serverUrl()}${filePath}`, '_blank');
    } else {
      Swal.fire({
        title: 'No File',
        text: 'No file path available for this event.',
        icon: 'info',
      });
    }
  }

  /**
   * Filter and paginate events based on search term
   */
  private filterAndPaginate(): void {
    let filteredData = this.events();
    const term = this.searchTerm().toLowerCase().trim();

    if (term) {
      filteredData = filteredData.filter(
        (event) =>
          event.eventName.toLowerCase().includes(term) ||
          event.eventDetails.toLowerCase().includes(term) ||
          event.eventCategory.toLowerCase().includes(term)
      );
    }

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / this.pageSize());

    let currentPage = this.currentPage();
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    } else if (currentPage === 0 && totalPages > 0) {
      currentPage = 1;
    } else if (totalPages === 0) {
      currentPage = 1;
    }

    this.currentPage.set(currentPage);

    const startIndex = (currentPage - 1) * this.pageSize();
    this.paginatedEventsData.set(
      filteredData.slice(startIndex, startIndex + this.pageSize())
    );

    this.cdRef.markForCheck();
  }

  /**
   * Navigate to a specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.filterAndPaginate();
    }
  }

  /**
   * Handle search term change
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
}


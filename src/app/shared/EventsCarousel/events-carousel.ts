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

// --- Constants ---
const MIN_LOADING_TIME = 1500;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;


@Component({
    selector: 'app-events-carousel',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NgbModule,
        DatePipe,
    ],
    templateUrl: './events-carousel.html',
    styleUrls: ['./events-carousel.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsCarousel implements OnInit {
    // ── Inject Services ────────────────────────────────────────────────────
    private readonly eventsService = inject(LpuCIFWebService);
    
    private readonly cdRef = inject(ChangeDetectorRef);
    

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
        this.loadEvents();
    }


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


import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  ViewChild,
  TemplateRef,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';


import { LoginSessionService } from '../../services/login-session.service';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

import { MouDocumentsService } from '../../services/mou-documents.service';
import { AdminDashboardComponent } from '../AdminDashboard/AdminDashboard';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject, takeUntil } from 'rxjs';
// ── Strongly-typed booking row ────────────────────────────────────────────────
export interface BookingRow {
  bookingId: string;
  instrumentName: string;
  noOfSamples: number;
  totalCharges: string | null;
  fileName?: string;
  userEmailId: string;
  candidateName: string;
  organisationName: string;
  userRole: string;
  paymentStatus: 'success' | 'failure' | 'null' | null;
  paymentDate: string | null;
  assignedUserId?: string;
  bookingRequestDate?: string;
}

export interface CifUser {
  uid: string;
  uiD_Name: string;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-view-booking-admin',
  standalone: true,                     
  imports: [CommonModule, FormsModule, AdminDashboardComponent,NgSelectModule], 
  templateUrl: './ViewBookingsAdmin.html',
  styleUrl: './ViewBookingsAdmin.scss',
})
 


 
export class AdminActionBookingsComponent implements OnInit, OnDestroy {

  // ── ViewChild refs ────────────────────────────────────────────────────────
  @ViewChild('viewDescModal2') viewDescModal2!: TemplateRef<any>;
  @ViewChild('table') tableRef!: ElementRef;

  // ── Service injection via inject() ────────────────────────────────────────
  // ✅ Angular 20: inject() replaces constructor parameter injection entirely
  private readonly cifWebService  = inject(LpuCIFWebService);
  private readonly storageService = inject(StorageService);
  private readonly authService    = inject(AuthService);
  private readonly authSession    = inject(LoginSessionService);
  private readonly modalService   = inject(NgbModal);
  private readonly router         = inject(Router);
  private readonly route          = inject(ActivatedRoute);
  private readonly cookieService  = inject(CookieService);

  // ── RxJS teardown ─────────────────────────────────────────────────────────
  private readonly destroy$ = new Subject<void>();

  // ── Constants ─────────────────────────────────────────────────────────────
  readonly serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';

  readonly statusOptions: SelectOption[] = [
    { label: 'All',     value: ''        },
    { label: 'Paid',    value: 'success' },
    { label: 'Failed',  value: 'failure' },
    { label: 'Pending', value: 'null'    },
  ];

  readonly assignedOptions: SelectOption[] = [
    { label: 'All Tests',    value: ''         },
    { label: 'Assigned',     value: 'Assigned' },
    { label: 'Not Assigned', value: 'Pending'  },
  ];

  readonly itemsPerPageOptions: SelectOption<number | 'all'>[] = [
    { label: '5',   value: 5   },
    { label: '10',  value: 10  },
    { label: '15',  value: 15  },
    { label: '20',  value: 20  },
    { label: 'All', value: 'all' },
  ];

  // ── User session signals ──────────────────────────────────────────────────
  readonly userRole      = signal<string>('');
  readonly userEmail     = signal<string>('');
  readonly candidateName = signal<string>('');

  // ── Data signals ──────────────────────────────────────────────────────────
  // originalData: source of truth — never mutated after API load
  readonly originalData       = signal<BookingRow[]>([]);
  readonly allAssignedTests   = signal<any[]>([]);
  readonly allCifUserList     = signal<CifUser[]>([]);

  // ── UI state signals ──────────────────────────────────────────────────────
  readonly loadingIndicator    = signal<boolean>(false);
  readonly showAdvancedSearch  = signal<boolean>(false);

  // ── Search / filter signals ───────────────────────────────────────────────
  readonly searchQuery     = signal<string>('');
  readonly selectedStatus  = signal<string>('');
  readonly isAssigned      = signal<string>('');

  // ── Pagination signals ────────────────────────────────────────────────────
  readonly currentPage     = signal<number>(1);
  readonly itemsPerPage    = signal<number>(15);
  readonly isAllSelected   = signal<boolean>(false);

  // ── Modal state signals ───────────────────────────────────────────────────
  readonly bookingCase = signal<BookingRow | null>(null);
  readonly remarks     = signal<string>('');
  readonly fileStatus  = signal<boolean>(false);
  private fileData64   = '';
  private fileName_    = '';

  // ── computed(): advanced-filtered data (no text search yet) ──────────────
  // ✅ computed() replaces getAdvancedFilteredData() — memoized, reactive
  private readonly advancedFilteredData = computed<BookingRow[]>(() => {
    let data = this.originalData();
    const status   = this.selectedStatus();
    const assigned = this.isAssigned();

    if (status) {
      data = data.filter(item =>
        status === 'null'
          ? !item.paymentStatus || item.paymentStatus === 'null'
          : item.paymentStatus === status
      );
    }

    if (assigned) {
      data = data.filter(item =>
        assigned === 'Assigned'
          ? !!item.assignedUserId?.trim()
          : !item.assignedUserId?.trim()
      );
    }

    // Sort by bookingRequestDate ascending
    return [...data].sort((a, b) => {
      const dA = a.bookingRequestDate ? new Date(a.bookingRequestDate).getTime() : 0;
      const dB = b.bookingRequestDate ? new Date(b.bookingRequestDate).getTime() : 0;
      return dA - dB;
    });
  });

  // ── computed(): text-search applied on top of advanced filter ────────────
  readonly filteredData = computed<BookingRow[]>(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.advancedFilteredData();
    return this.advancedFilteredData().filter(item =>
      Object.values(item).some(v => String(v).toLowerCase().includes(q))
    );
  });

  // ── computed(): total pages ───────────────────────────────────────────────
  readonly totalPages = computed<number>(() =>
    this.isAllSelected() ? 1 : Math.ceil(this.filteredData().length / this.itemsPerPage())
  );

  // ── computed(): current page slice ───────────────────────────────────────
  readonly currentPageData = computed<BookingRow[]>(() => {
    if (this.isAllSelected()) return this.filteredData();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredData().slice(start, start + this.itemsPerPage());
  });

  // ── computed(): whether any filter is active ──────────────────────────────
  readonly hasAnySearchCriteria = computed<boolean>(() =>
    !!this.selectedStatus().trim() || !!this.isAssigned().trim()
  );

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadUserFromCookies();
    this.getAllPaymentDetails();
    this.getAllAssignedTest();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Cookie session ────────────────────────────────────────────────────────
  private loadUserFromCookies(): void {
    // const raw = this.cookieService.get('AdminAuthData');
    // if (!raw) {
    //   Swal.fire('Session Expired', 'Please login again to continue.', 'warning');
    //   this.router.navigate(['/Home']);
    //   return;
    // }
    // try {
    //   const parsed = JSON.parse(raw);
    //   this.userRole.set(parsed.UserRole     ?? '');
    //   this.userEmail.set(parsed.EmailId     ?? '');
    //   this.candidateName.set(parsed.CandidateName ?? '');
    // } catch {
    //   Swal.fire('Session Error', 'Invalid session data. Please login again.', 'error');
    //   this.router.navigate(['/Home']);
    // }
  }

  // ── API: load all bookings ────────────────────────────────────────────────
  getAllPaymentDetails(): void {
    this.loadingIndicator.set(true);
    const startTime = Date.now();

    this.cifWebService.GetAllBookingTests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          const data: BookingRow[] = response.item1?.length > 0 ? response.item1 : [];
          this.originalData.set(data);
          this.currentPage.set(1);

          const delay = Math.max(1500 - (Date.now() - startTime), 0);
          setTimeout(() => this.loadingIndicator.set(false), delay);
        },
        error: err => {
          console.error('Failed to load booking tests:', err);
          this.loadingIndicator.set(false);
        },
      });
  }

  // ── API: load assigned tests ──────────────────────────────────────────────
  getAllAssignedTest(): void {
    this.cifWebService.GetAllUploadedResultsByStaff()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.allAssignedTests.set(response.item1?.length > 0 ? response.item1 : []);
        },
        error: err => console.error('Failed to load assigned tests:', err),
      });
  }

  // ── Search ────────────────────────────────────────────────────────────────
  onSearchQueryChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  // ── Advanced search ───────────────────────────────────────────────────────
  toggleAdvancedSearch(): void {
    const next = !this.showAdvancedSearch();
    this.showAdvancedSearch.set(next);
    if (!next) this.resetAdvancedSearch();
  }

  // No explicit applyAdvancedSearch needed — computed() handles it reactively.
  // Button kept in template as UX affordance; it just resets pagination.
  applyAdvancedSearch(): void {
    this.currentPage.set(1);
  }

  resetAdvancedSearch(): void {
    this.selectedStatus.set('');
    this.isAssigned.set('');
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  onItemsPerPageChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'all') {
      this.isAllSelected.set(true);
      this.itemsPerPage.set(this.filteredData().length);
    } else {
      this.isAllSelected.set(false);
      this.itemsPerPage.set(parseInt(value, 10));
    }
    this.currentPage.set(1);
  }

  // ── File helpers ──────────────────────────────────────────────────────────
  downloadFile(file: string): void {
    window.open(this.serverUrl + file, '_blank');
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  openPaymentModal(row: BookingRow): void {
    this.bookingCase.set(row);
    this.remarks.set('');
    this.fileStatus.set(false);
    this.fileData64 = '';
    this.fileName_  = '';
    this.modalService.open(this.viewDescModal2, { size: 'lg' })
      .result.then(() => {}).catch(() => {});
  }

  onFileSelected(event: Event): void {
    this.fileStatus.set(false);
    const target = event.target as HTMLInputElement;
    const file   = target.files?.[0] ?? null;
    if (!file) return;

    if (file.size > 5_148_576) {
      Swal.fire({ title: 'File size exceeds 5 MB.', text: 'Invalid File size', icon: 'warning' });
      target.value = '';
      return;
    }

    const safeNameRegex = /^[a-zA-Z0-9._-]+$/;
    const safeName = safeNameRegex.test(file.name)
      ? file.name
      : file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    const finalFile = safeName !== file.name
      ? (() => {
          const dt = new DataTransfer();
          const mf = new File([file], safeName, { type: file.type });
          dt.items.add(mf);
          target.files = dt.files;
          return mf;
        })()
      : file;

    const reader = new FileReader();
    reader.onload = () => {
      this.fileData64 = (reader.result as string).split(',')[1];
      this.fileName_  = safeName;
      this.fileStatus.set(true);
    };
    reader.readAsDataURL(finalFile);
  }

  verifyData(row: BookingRow): void {
    if (!this.fileData64) {
      Swal.fire({ title: 'Error', text: 'Kindly upload a file first.', icon: 'error' });
      return;
    }

    this.loadingIndicator.set(true);
    const startTime = Date.now();

    const formData = new FormData();
    formData.append('BookingId',   row.bookingId);
    formData.append('UserEmailId', row.userEmailId);
    formData.append('Remarks',     this.remarks());
    formData.append('CreatedBy',   this.userEmail());
    formData.append('FilePath',    this.fileName_);
    formData.append('File',        this.fileData64);

    this.cifWebService.CIFResultsUploads(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          const msg      = data.item1[0]['msg'];
          const returnId = data.item1[0]['ReturnId'];

          if (msg === 'Success' && returnId !== '0') {
            Swal.fire({ title: 'Uploaded Successfully!', icon: 'success' })
              .then(() => window.location.reload());
          } else {
            Swal.fire({ title: 'Already Uploaded Results for this Test', icon: 'error' })
              .then(() => window.location.reload());
          }
          const delay = Math.max(1500 - (Date.now() - startTime), 0);
          setTimeout(() => this.loadingIndicator.set(false), delay);
        },
        error: () => {
          Swal.fire({ title: 'Error', text: 'Failed to Upload.', icon: 'error' });
          this.loadingIndicator.set(false);
        },
      });
  }

  // ── Export ────────────────────────────────────────────────────────────────
  exportToExcel(): void {
    const rows = this.filteredData().map(item => ({
      BookingId:       item.bookingId,
      InstrumentName:  item.instrumentName,
      EmailId:         item.userEmailId,
      CandidateName:   item.candidateName,
      OrganisationName: item.organisationName,
      UserRole:        item.userRole,
      SampleCount:     item.noOfSamples,
      PaymentAmount:   item.totalCharges,
      RequestDate:     item.bookingRequestDate,
      PaymentStatus:   item.paymentStatus === 'success' ? 'Paid'
                     : item.paymentStatus === 'failure' ? 'Failed' : 'Pending',
      PaymentDate:     item.paymentDate,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Array(11).fill({ wpx: 200 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const blob = new Blob(
      [XLSX.write(wb, { bookType: 'xlsx', type: 'array' })],
      { type: 'application/octet-stream' }
    );
    const link = document.createElement('a');
    link.href  = URL.createObjectURL(blob);
    link.download = 'AssignedResults_report.xlsx';
    link.click();
  }

  // ── Payment status helpers ────────────────────────────────────────────────
  paymentLabel(status: string | null): string {
    if (status === 'success') return 'Paid';
    if (status === 'failure') return 'Failed';
    return 'Pending';
  }

  paymentBadgeClass(status: string | null): Record<string, boolean> {
    return {
      'bg-success':              status === 'success',
      'bg-danger':               status === 'failure',
      'bg-warning text-dark':    !status || status === 'null',
    };
  }

  paymentDateBadgeClass(date: string | null): Record<string, boolean> {
    const valid = !!date && date !== 'null';
    return { 'bg-info': valid, 'bg-danger': !valid };
  }
}
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StaffMenuComponent } from "../StaffMenu/StaffMenu";
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { LoginSessionService } from '../../services/login-session.service';
@Component({
  selector: 'app-staff-pending-payments',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    FormsModule,
    ReactiveFormsModule,
    StaffMenuComponent,
  ],
  templateUrl: './PendingPayments.html',
  styleUrls: ['./PendingPayments.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffPendingPaymentsComponent implements OnInit {

  // ─── Injected Services ──────────────────────────────────────────────────────
  // DestroyRef captured at field level (injection context) so it can be passed
  // into takeUntilDestroyed() inside regular methods.
  private readonly destroyRef    = inject(DestroyRef);
  private readonly cifWebService = inject(LpuCIFWebService);
  private readonly authSession   = inject(LoginSessionService);
  private readonly modalService  = inject(NgbModal);
  private readonly cookieService = inject(CookieService);
  private readonly fb            = inject(FormBuilder);

  // ─── View References ─────────────────────────────────────────────────────────
  @ViewChild('table')              tableRef!: ElementRef;
  @ViewChild('viewDescModal2')     viewDescModal2!: TemplateRef<unknown>;
  @ViewChild('PendingPaymentModal') PendingPaymentModal!: TemplateRef<unknown>;

  // ─── Signals ──────────────────────────────────────────────────────────────────
  readonly loadingIndicator    = signal<boolean>(false);
  /** Master list — never mutated after load */
  readonly AllPaymentData      = signal<any[]>([]);
  /** Filtered / searched working list */
  readonly tmpsAllPaymentData  = signal<any[]>([]);
  readonly currentPage         = signal<number>(1);
  /** 0 = "All" */
  readonly itemsPerPage        = signal<number>(10);
  readonly selectedStatus      = signal<string>('');

  // ─── Computed ────────────────────────────────────────────────────────────────
  readonly totalPages = computed(() => {
    const size = this.itemsPerPage();
    if (size === 0) return 1;
    return Math.ceil(this.tmpsAllPaymentData().length / size);
  });

  readonly currentPageData = computed(() => {
    const size = this.itemsPerPage();
    if (size === 0) return this.tmpsAllPaymentData();
    const start = (this.currentPage() - 1) * size;
    return this.tmpsAllPaymentData().slice(start, start + size);
  });

  // ─── Non-reactive State ───────────────────────────────────────────────────────
  private originalData: any[] = [];

  UserRole   = '';
  user_Email = '';

  // Receipt / modal state
  PaymentReceipt: any;
  BookingCase:    any;

  CurrentbookingId:     any;
  CurrentinstrumentName: any;
  CurrentcandidateName: any;
  CurrentrequestDate:   any;

  // Search
  searchQuery = '';

  // ─── Reactive Form ────────────────────────────────────────────────────────────
  readonly paymentForm = this.fb.group({
    amount:  [null as number | null, [Validators.required, Validators.min(0)]],
    remarks: ['',                     Validators.required],
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const raw = this.cookieService.get('StaffUserAuthData');
    if (raw) {
      const cookie   = JSON.parse(raw);
      this.UserRole   = cookie.UserRole;
      this.user_Email = cookie.EmailId;
    }
    this.loadPaymentDetails();
  }

  // ─── Data Loading ─────────────────────────────────────────────────────────────
  loadPaymentDetails(): void {
    this.loadingIndicator.set(true);
    const startTime = Date.now();

    this.cifWebService.GetAllPaymentDetails()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (response?.item1?.length > 0) {
            const sorted = [...response.item1].sort(
              (a: any, b: any) => b.bookingId - a.bookingId
            );
            this.originalData = sorted;
            this.AllPaymentData.set(sorted);
            this.tmpsAllPaymentData.set(sorted);
          } else {
            this.originalData = [];
            this.AllPaymentData.set([]);
            this.tmpsAllPaymentData.set([]);
          }

          const delay = Math.max(1500 - (Date.now() - startTime), 0);
          setTimeout(() => this.loadingIndicator.set(false), delay);
        },
        error: (err: any) => {
          console.error('Error loading payment details:', err);
          this.loadingIndicator.set(false);
        },
      });
  }

  // ─── Search ───────────────────────────────────────────────────────────────────
  search(): void {
    this.applyFilters();
  }

  // ─── Status Filter ────────────────────────────────────────────────────────────
  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedStatus.set(value);
    this.applyFilters();
  }

  private applyFilters(): void {
    const status = this.selectedStatus();
    const query  = this.searchQuery.toLowerCase().trim();

    let result = [...this.originalData];

    // Status filter
    if (status === 'null') {
      result = result.filter(item => item.paymentStatus == null || item.paymentStatus === 'null');
    } else if (status !== '') {
      result = result.filter(item => item.paymentStatus === status);
    }

    // Search filter
    if (query) {
      result = result.filter(item =>
        Object.values(item).some(val =>
          String(val ?? '').toLowerCase().includes(query)
        )
      );
    }

    this.tmpsAllPaymentData.set(result);
    this.currentPage.set(1);
  }

  // ─── Pagination ───────────────────────────────────────────────────────────────
  getTotalRecords(): number { return this.tmpsAllPaymentData().length; }
  getTotalPages():   number { return this.totalPages(); }

  getCurrentPageData(): any[] { return this.currentPageData(); }

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

  onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.itemsPerPage.set(value);
    this.currentPage.set(1);
  }

  getPageRangeLabel(): string {
    const total = this.tmpsAllPaymentData().length;
    const size  = this.itemsPerPage();
    if (total === 0) return '0 – 0 of 0';
    if (size  === 0) return `1 – ${total} of ${total}`;
    const start = (this.currentPage() - 1) * size + 1;
    const end   = Math.min(this.currentPage() * size, total);
    return `${start} – ${end} of ${total}`;
  }

  // ─── Export ───────────────────────────────────────────────────────────────────
  exportToExcel(): void {
    const paymentLabel = (status: string | null): string => {
      if (status === 'success') return 'Success';
      if (status === 'failure') return 'Failed';
      return 'Pending';
    };

    const exportedData = this.AllPaymentData().map(item => ({
      CandidateName:   item.candidateName,
      UserEmailId:     item.userEmailId,
      UserRole:        item.userRole,
      OrganisationName: item.organisationName,
      InstrumentName:  item.instrumentName,
      BookingId:       item.bookingId,
      NoOfSamples:     item.noOfSamples,
      RequestDate:     item.requestDate,
      PaymentAmount:   item.amount,
      PaymentStatus:   paymentLabel(item.paymentStatus),
      MobileNo:        item.mobileNo,
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
    ws['!cols'] = Array(15).fill({ wpx: 180 });

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link     = document.createElement('a');
    link.href      = URL.createObjectURL(
      new Blob([blobData], { type: 'application/octet-stream' })
    );
    link.download = 'Booking_Details_report.xlsx';
    link.click();
    link.remove();
  }

  // ─── Modals ───────────────────────────────────────────────────────────────────
  paymentReceiptScreen(data: any): void {
    this.PaymentReceipt = data;
    this.modalService.open(this.viewDescModal2, { size: 'lg' }).result.catch(() => {});
  }

  openPaymentModal(data: any): void {
    this.BookingCase = data;
    this.modalService.open(this.viewDescModal2, { size: 'sm' }).result.catch(() => {});
  }

  PendingPayment(data: any): void {
    this.CurrentbookingId      = data.bookingId;
    this.CurrentinstrumentName = data.instrumentName;
    this.CurrentcandidateName  = data.candidateName;
    this.CurrentrequestDate    = data.requestDate;
    this.modalService.open(this.PendingPaymentModal, { size: 'lg' }).result.catch(() => {});
  }

  // ─── Form Submit ──────────────────────────────────────────────────────────────
  onUpdatePayment(): void {
    if (this.paymentForm.valid) {
      const paymentDetails = this.paymentForm.value;
      // TODO: call API with paymentDetails
      console.log('Payment details to update:', paymentDetails);
    }
  }

  VerifyData(): void {
    Swal.fire({
      title: 'Processing Wait..',
      text:  'Payment Gateway Error!',
      icon:  'warning',
    });
  }

  // ─── Print Receipt ────────────────────────────────────────────────────────────
  printReceipt(): void {
    const modalContent = document.getElementById('ReceiptData');
    if (!modalContent) { console.error('Modal content not found'); return; }

    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, {
      position: 'absolute', width: '0px', height: '0px', border: 'none',
    });
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) { console.error('Failed to open iframe document'); return; }

    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules).map(r => r.cssText).join(' ');
        } catch { return ''; }
      })
      .join(' ');

    const cloned     = modalContent.cloneNode(true) as HTMLElement;
    const printBtn   = cloned.querySelector('button');
    if (printBtn) printBtn.style.display = 'none';

    iframeDoc.open();
    iframeDoc.write(`
      <html><head><title>Payment Receipt</title>
      <style>${styles}</style></head>
      <body>${cloned.innerHTML}</body></html>
    `);
    iframeDoc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      iframe.onload = () => document.body.removeChild(iframe);
    };
  }
}
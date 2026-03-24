import {
  Component, ElementRef, OnInit, TemplateRef, ViewChild,
  inject, DestroyRef, ChangeDetectorRef, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie-service';
import * as XLSX from 'xlsx';

import { CifMenuBarComponent } from '../cif-menu-bar/cif-menu-bar.component';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-search-payments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,     
    NgbModule,       
    CurrencyPipe,
    CifMenuBarComponent,
  ],
  templateUrl: './search-payments.component.html',
  styleUrls: ['./search-payments.component.scss'],
})
export class SearchPaymentsComponent implements OnInit {

  // ── ViewChildren ─────────────────────────────────────────────────────────────
  @ViewChild('viewDescModal2') viewDescModal2!: TemplateRef<any>;
  @ViewChild('table') table!: ElementRef;

  // ── DI via inject() ───────────────────────────────────────────────────────────
  private readonly CIFwebService = inject(LpuCIFWebService);
  private readonly modalService  = inject(NgbModal);
  private readonly cookieService = inject(CookieService);
  private readonly cdr           = inject(ChangeDetectorRef);
  private readonly destroyRef    = inject(DestroyRef);
  // ✅ SSR guard — prevents JSON.parse('') crash during server-side render
  private readonly platformId    = inject(PLATFORM_ID);

  // ── Table / pagination ────────────────────────────────────────────────────────
  BookingStatusData:      any[] = [];
  tmpsBookingStatusData:  any[] = [];
  headHtmlData:           any[] = [];
  columns:                any;
  dataSource:             any[] = [];

  currentPage    = 1;
  itemsPerPage   = 5;

  displayedColumns: string[] = [
    'instrumentName', 'analysisType', 'analysisCharges',
    'noOfSamples', 'totalCharges', 'remarks', 'bookingRequestDate',
  ];

  // ── User / session ────────────────────────────────────────────────────────────
  UserRole:       any;
  UserId:         any;
  user_Email:     any;
  userEmail:      any;
  userId:         any;
  MobileNo:       any;
  supervisorName: any;
  departmentName: any;
  candidateName:  any;
  ServerUrl!:     string;

  // ── UI state ──────────────────────────────────────────────────────────────────
  loadingIndicator = false; 
  BookingCase:     any;
  PaymentReceipt:  any;
  searchQuery      = '';
  uploadEnabled!:  boolean;
  Remarks:         any;
  selectedId!:     number;
  InstrumentId:    any;

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) { return; }

    this.ServerUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';

    const raw = this.cookieService.get('InternalUserAuthData');

    if (!raw || raw.trim().length === 0) {
      return; 
    }

    try {
      const c = JSON.parse(raw);
      this.UserRole      = c.userRole?.length > 0 ? c.userRole : 'Internal User';
      this.user_Email    = this.UserId = this.userEmail = this.userId = c.EmailId;
      this.MobileNo      = c.MobileNo;
      this.supervisorName = c.SupervisorName;
      this.departmentName = c.DepartmentName;
      this.candidateName  = c.CandidateName;
    } catch {
      return;
    }

    Promise.resolve().then(() => {
      this.getBookingDetails();
      this.cdr.detectChanges();
    });
  }

  // ── Search ────────────────────────────────────────────────────────────────────
  search(): void {
    const query = this.searchQuery.toLowerCase();
    this.tmpsBookingStatusData = this.BookingStatusData.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(query))
    );
    this.currentPage = 1;
  }

  get filteredBookingStatusData(): any[] {
    if (!this.searchQuery.trim()) { return this.BookingStatusData; }
    const term = this.searchQuery.toLowerCase();
    return this.BookingStatusData.filter(
      (b: { instrumentName: string; analysisType: string }) =>
        b.instrumentName.toLowerCase().includes(term) ||
        b.analysisType.toLowerCase().includes(term)
    );
  }

  // ── API: paid bookings ────────────────────────────────────────────────────────
  getBookingDetails(): void {
    this.loadingIndicator = true;
    const startTime = Date.now();

    this.CIFwebService.GetUserPaymentStatusDetails(this.UserId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (response.item1?.length > 0) {
            this.BookingStatusData = response.item1;
            this.dataSource        = response.item1;

            this.tmpsBookingStatusData = response.item1.filter(
              (item: { paymentStatus: any }) =>
                item.paymentStatus?.toLowerCase() === 'success' &&
                item.paymentStatus !== 'null'
            );

            if (this.tmpsBookingStatusData.length > 0) {
              this.headHtmlData = this.tmpsBookingStatusData[0];
              this.columns = Object.keys(this.tmpsBookingStatusData[0]).filter(
                (k: string) => !['ResultFile', 'userId', 'id', 'analysisId'].includes(k)
              );
            }
          } else {
            this.BookingStatusData = [];
          }
          this.stopLoader(startTime);
        },
        error: err => { console.error(err); this.loadingIndicator = false; },
      });
  }

  // ── Pagination ────────────────────────────────────────────────────────────────
  getTotalPages(): number {
    return Math.ceil(this.tmpsBookingStatusData.length / this.itemsPerPage);
  }

  getCurrentPageData(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.tmpsBookingStatusData.slice(start, start + this.itemsPerPage);
  }

  nextPage(): void { if (this.currentPage < this.getTotalPages()) this.currentPage++; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }

  // ── Excel export ──────────────────────────────────────────────────────────────
  exportToExcel(): void {
    const fileName    = 'Booking_Details_report.xlsx';
    const exportedData = this.BookingStatusData.map(item => ({
      BookingId:      item.bookingId,
      InstrumentName: item.instrumentName,
      Samples:        item.noOfSamples,
      RequestDate:    item.bookingRequestDate,
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
    ws['!cols'] = Array(10).fill({ wpx: 180 });
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link     = document.createElement('a');
    link.href      = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
    link.download  = fileName;
    link.click();
  }

  // ── Material table filter (kept for API parity) ───────────────────────────────
  applyFilter(event: Event): void {
    const val = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (this.dataSource && (this.dataSource as any).filter !== undefined) {
      (this.dataSource as any).filter = val;
    }
  }

  // ── Receipt modal ─────────────────────────────────────────────────────────────
  paymentReceiptScreen(data: any): void {
    this.PaymentReceipt = data;
    this.modalService.open(this.viewDescModal2, { size: 'sm' })
      .result.then(() => {}).catch(() => {});
  }

  // ── Print receipt ─────────────────────────────────────────────────────────────
  printReceipt(): void {
    const modalContent = document.getElementById('ReceiptData');
    if (!modalContent) { console.error('Modal content not found'); return; }

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) { console.error('Failed to open iframe document'); return; }

    // Collect all CSS rules from page stylesheets
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules).map(r => r.cssText).join(' ');
        } catch { return ''; }
      })
      .join(' ');

    const cloned = modalContent.cloneNode(true) as HTMLElement;
    const btn    = cloned.querySelector('button');
    if (btn) { btn.style.display = 'none'; }

    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>${styles}</style>
        </head>
        <body>${cloned.innerHTML}</body>
      </html>
    `);
    iframeDoc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  }

  // ── Private: consistent loader shutdown ───────────────────────────────────────
  private stopLoader(startTime: number): void {
    const remaining = Math.max(1500 - (Date.now() - startTime), 0);
    setTimeout(() => {
      this.loadingIndicator = false;
      this.cdr.detectChanges();
    }, remaining);
  }
}
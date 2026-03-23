import {
  Component, ElementRef, OnInit, TemplateRef, ViewChild,
  inject, DestroyRef, ChangeDetectorRef, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie-service';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';


import { LoginSessionService } from '../../services/login-session.service';

import { CifMenuBarComponent } from '../cif-menu-bar/cif-menu-bar.component';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-booking-status',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,       // ✅ required for [(ngModel)] on searchQuery
    NgbModule,         // ✅ required for NgbModal (let-modal in ng-template)
    DatePipe,
    CifMenuBarComponent,
  ],
  templateUrl: './booking-status.component.html',
  styleUrls: ['./booking-status.component.scss'],
  providers: [DatePipe],
})
export class BookingStatusComponent implements OnInit {

  // ── ViewChildren ──────────────────────────────────────────────────────────
  @ViewChild('viewDescModal2') viewDescModal2!: TemplateRef<any>;
  @ViewChild('table') table!: ElementRef;

  // ── DI via inject() ───────────────────────────────────────────────────────
  private readonly CIFwebService = inject(LpuCIFWebService);
  private readonly modalService  = inject(NgbModal);
  private readonly AuthSession   = inject(LoginSessionService);
  private readonly router        = inject(Router);
  private readonly cookieService = inject(CookieService);
  private readonly cdr           = inject(ChangeDetectorRef);
  private readonly destroyRef    = inject(DestroyRef);
  // ✅ SSR guard — prevents JSON.parse('') crash during server-side render
  private readonly platformId    = inject(PLATFORM_ID);

  // ── Table / pagination ────────────────────────────────────────────────────
  BookingStatusData:     any[] = [];
  tmpsBookingStatusData: any[] = [];
  ResultData:            any[] = [];
  tmpsResultData:        any[] = [];
  headHtmlData:          any[] = [];
  columns:               any;
  dataSource:            any;
  displayedColumns: string[] = [
    'instrumentName', 'analysisType', 'analysisCharges',
    'noOfSamples', 'totalCharges', 'remarks', 'bookingRequestDate',
  ];

  currentPage  = 1;
  itemsPerPage = 10;

  // ── User / session ────────────────────────────────────────────────────────
  UserRole:     any;
  UserId:       any;
  user_Email:   any;
  ServerUrl!:   string;

  // ── UI state ──────────────────────────────────────────────────────────────
  loadingIndicator = false;   // ✅ typed boolean — prevents NG0100
  searchQuery      = '';
  BookingCase:     any;
  selectedId!:     number;
  InstrumentId:    any;
  uploadEnabled!:  boolean;
  Remarks:         any;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // ✅ SSR guard — all browser/cookie logic is skipped on the server
    if (!isPlatformBrowser(this.platformId)) { return; }

    this.ServerUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';

    const raw = this.cookieService.get('InternalUserAuthData');

    if (!raw || raw.trim().length === 0) {
      Swal.fire({ title: 'Login Failed', icon: 'warning' });
      this.router.navigate(['/Home']);
      return;
    }

    try {
      const c        = JSON.parse(raw);
      this.UserRole  = c.userRole?.length > 0 ? c.userRole : 'Internal User';
      this.user_Email = c.EmailId;
    } catch {
      // Cookie is corrupt — redirect to login
      this.cookieService.delete('InternalUserAuthData');
      this.router.navigate(['/Home']);
      return;
    }

    // ✅ Defer first API call to avoid NG0100 ExpressionChangedAfterChecked.
    //    loadingIndicator is set synchronously inside getBookingDetails();
    //    deferring ensures Angular's first CD pass is already complete.
    Promise.resolve().then(() => {
      this.getBookingDetails();
      this.cdr.detectChanges();
    });
  }

  // ── Search ────────────────────────────────────────────────────────────────
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

  // ── API: booking status list ──────────────────────────────────────────────
  getBookingDetails(): void {
    this.loadingIndicator = true;
    const startTime = Date.now();

    this.CIFwebService.GetUserBookingStatus(this.user_Email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (response.item1?.length > 0) {
            this.dataSource = this.BookingStatusData =
              this.tmpsBookingStatusData = response.item1;
            this.headHtmlData = this.tmpsBookingStatusData[0];
            this.columns = Object.keys(this.tmpsBookingStatusData[0]).filter(
              (k: string) => !['ResultFile', 'userId', 'id', 'analysisId'].includes(k)
            );
          } else {
            this.BookingStatusData = [];
          }
          this.stopLoader(startTime);
        },
        // ✅ loader always resets on error — prevents infinite spinner
        error: err => { console.error(err); this.loadingIndicator = false; },
      });
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  getTotalPages(): number {
    return Math.ceil(this.tmpsBookingStatusData.length / this.itemsPerPage);
  }

  getCurrentPageData(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.tmpsBookingStatusData.slice(start, start + this.itemsPerPage);
  }

  nextPage(): void { if (this.currentPage < this.getTotalPages()) this.currentPage++; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }

  // ── Excel export ──────────────────────────────────────────────────────────
  exportToExcel(): void {
    const fileName    = 'Booking_Details_report.xlsx';
    const exportedData = this.BookingStatusData.map(item => ({
      BookingId:      item.bookingId,
      InstrumentName: item.instrumentName,
      // ✅ Original logic preserved exactly: trim last word from assignedTo
      AssignedTo:     item.assignedTo.split(' ').slice(0, -1).join(' '),
      AssignedDate:   item.assignedOn,
      Samples:        item.noOfSamples,
      RequestDate:    item.bookingRequestDate,
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
    ws['!cols'] = [
      { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 },
      { wpx: 180 }, { wpx: 200 }, { wpx: 180 }, { wpx: 180 },
      { wpx: 180 }, { wpx: 180 },
    ];
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link     = document.createElement('a');
    link.href      = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
    link.download  = fileName;
    link.click();
  }

  // ── Mat-table filter (kept for API parity) ────────────────────────────────
  applyFilter(event: Event): void {
    const val = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (this.dataSource && (this.dataSource as any).filter !== undefined) {
      (this.dataSource as any).filter = val;
    }
  }

  // ── Open result modal — fetches result data first ─────────────────────────
  openPaymentModal(a: any): void {
    this.BookingCase = a;

    this.CIFwebService.GetUserResultsDetails(this.user_Email, a.bookingId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (response.item1?.length > 0) {
            this.ResultData    = response.item1;
            this.dataSource    = response.item1;
            this.tmpsResultData = response.item1;
            this.headHtmlData  = this.tmpsResultData[0];
            this.columns = Object.keys(this.tmpsResultData[0]).filter(
              (k: string) => !['candidateName', 'userEmail', 'id', 'analysisId'].includes(k)
            );
            this.loadingIndicator = false;

            this.modalService.open(this.viewDescModal2, { size: 'sm' })
              .result.then(() => {}).catch(() => {});
          } else {
            this.ResultData = [];
            Swal.fire({ title: 'No Result Found for this Test', icon: 'error' })
              .then(() => window.location.reload());
          }
        },
        error: err => { console.error(err); },
      });
  }

  // ── Download excel sheet from result modal ────────────────────────────────
  // ✅ Original logic preserved: opens ServerUrl + excelSheet in new tab
  ExcelSheetDownload(a: any): void {
    window.open(this.ServerUrl + a[0].excelSheet, '_blank');
  }

  // ── Download result file from result modal ────────────────────────────────
  // ✅ Original logic preserved: opens ServerUrl + resultFile in new tab
  VerifyData(a: any): void {
    window.open(this.ServerUrl + a[0].resultFile, '_blank');
  }

  // ── Private: consistent loader shutdown ──────────────────────────────────
  private stopLoader(startTime: number): void {
    const remaining = Math.max(1500 - (Date.now() - startTime), 0);
    setTimeout(() => {
      this.loadingIndicator = false;
      this.cdr.detectChanges();
    }, remaining);
  }
}
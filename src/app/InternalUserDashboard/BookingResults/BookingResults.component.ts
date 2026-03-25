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
  selector: 'app-booking-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,       // ✅ required for [(ngModel)] on searchQuery
    NgbModule,         // ✅ required for NgbModal (let-modal in ng-template)
    DatePipe,
    CifMenuBarComponent,
  ],
  templateUrl: './BookingResults.html',
  styleUrls: ['./BookingResults.scss'],
  providers: [DatePipe],
})
export class BookingResultsComponent implements OnInit {


  @ViewChild('viewDescModal2') viewDescModal2!: TemplateRef<any>;
  @ViewChild('table') table!: ElementRef;





  private readonly CIFwebService = inject(LpuCIFWebService);
  private readonly modalService  = inject(NgbModal);
  private readonly AuthSession   = inject(LoginSessionService);
  private readonly router        = inject(Router);
  private readonly cookieService = inject(CookieService);
  private readonly cdr           = inject(ChangeDetectorRef);
  private readonly destroyRef    = inject(DestroyRef);

  private readonly platformId    = inject(PLATFORM_ID);


  BookingData:     any[] = [];
  tmpsBookingData: any[] = [];
  ResultData:      any[] = [];
  tmpsResultData:  any[] = [];
  headHtmlData:    any[] = [];
  columns:         any;
  dataSource:      any;
  displayedColumns: string[] = [
    'instrumentName', 'analysisType', 'analysisCharges',
    'noOfSamples', 'totalCharges', 'remarks', 'bookingRequestDate',
  ];

  currentPage          = 1;
  itemsPerPage         = 10;
  itemsPerPageOptions: number[] = [5, 10, 15, 20, 25];


  UserRole:      any;
  UserId:        any;
  user_Email:    any;
  candidateName: any;
  ServerUrl!:    string;


  loadingIndicator = false;   // ✅ typed boolean — prevents NG0100
  searchQuery      = '';
  BookingCase:     any;
  selectedId!:     number;
  InstrumentId:    any;
  uploadEnabled!:  boolean;
  Remarks:         any;


  ngOnInit(): void {

    if (!isPlatformBrowser(this.platformId)) { return; }

    this.ServerUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';

    const raw = this.cookieService.get('InternalUserAuthData');

    if (!raw || raw.trim().length === 0) {
      Swal.fire({ title: 'Login Failed', icon: 'warning' });
      this.router.navigate(['/Home']);
      return;
    }

    try {
      const c            = JSON.parse(raw);
      this.UserRole      = c.userRole?.length > 0 ? c.userRole : 'Internal User';
      this.user_Email    = c.EmailId;
      this.candidateName = c.CandidateName;
    } catch {
      this.cookieService.delete('InternalUserAuthData');
      this.router.navigate(['/Home']);
      return;
    }




    Promise.resolve().then(() => {
      this.getBookingDetails();
      this.cdr.detectChanges();
    });
  }


  search(): void {
    const query = this.searchQuery.toLowerCase();
    this.tmpsBookingData = this.BookingData.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(query))
    );
    this.currentPage = 1;
  }

  get filteredBookingData(): any[] {
    if (!this.searchQuery.trim()) { return this.BookingData; }
    const term = this.searchQuery.toLowerCase();
    return this.BookingData.filter(
      (b: { instrumentName: string; analysisType: string }) =>
        b.instrumentName.toLowerCase().includes(term) ||
        b.analysisType.toLowerCase().includes(term)
    );
  }


  getBookingDetails(): void {
    this.loadingIndicator = true;
    const startTime = Date.now();

    this.CIFwebService.GetUserAllBookingSlot(this.user_Email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (response.item1?.length > 0) {
            this.tmpsBookingData = this.dataSource = this.BookingData = response.item1;
            this.headHtmlData = this.tmpsBookingData[0];
            this.columns = Object.keys(this.tmpsBookingData[0]).filter(
              (k: string) => !['candidateName', 'userEmail', 'id', 'analysisId'].includes(k)
            );
          } else {
            this.BookingData = [];
          }
          this.stopLoader(startTime);
        },

        error: err => { console.error(err); this.loadingIndicator = false; },
      });
  }


  getTotalPages(): number {
    return Math.ceil(this.tmpsBookingData.length / this.itemsPerPage);
  }

  getCurrentPageData(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.tmpsBookingData.slice(start, start + this.itemsPerPage);
  }

  nextPage(): void { if (this.currentPage < this.getTotalPages()) this.currentPage++; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }

  onItemsPerPageChange(event: Event): void {
    this.itemsPerPage = Number((event.target as HTMLSelectElement).value);
    this.currentPage  = 1;
  }


  exportToExcel(): void {
    const fileName    = 'Booking_Details_report.xlsx';
    const exportedData = this.BookingData.map(item => ({
      BookinNo:       item.bookingId,
      InstrumentName: item.instrumentName,
      BookingDate:    item.bookingRequestDate,
      Charges:        item.totalCharges,
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
    ws['!cols'] = [{ wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }];
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link     = document.createElement('a');
    link.href      = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
    link.download  = fileName;
    link.click();
  }


  applyFilter(event: Event): void {
    const val = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (this.dataSource && (this.dataSource as any).filter !== undefined) {
      (this.dataSource as any).filter = val;
    }
  }


  openPaymentModal(a: any): void {
    this.loadingIndicator = true;
    const startTime = Date.now();
    this.BookingCase = a;

    this.CIFwebService.GetUserResultsDetails(this.user_Email, a.bookingId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (response.item1?.length > 0) {
            this.ResultData    = this.dataSource = this.tmpsResultData = response.item1;
            this.headHtmlData  = this.tmpsResultData[0];
            this.columns = Object.keys(this.tmpsResultData[0]).filter(
              (k: string) => !['candidateName', 'userEmail', 'id', 'analysisId'].includes(k)
            );

            this.modalService.open(this.viewDescModal2, { size: 'sm' })
              .result.then(() => {}).catch(() => {});
          } else {
            this.ResultData = [];
            Swal.fire({ title: 'No Result Found for this Test', icon: 'error' })
              .then(() => window.location.reload());
          }
          this.stopLoader(startTime);
        },

        error: err => { console.error(err); this.loadingIndicator = false; },
      });
  }



  ExcelSheetDownload(a: any): void {
    window.open(this.ServerUrl + a[0].excelSheet, '_blank');
  }



  VerifyData(a: any): void {
    window.open(this.ServerUrl + a[0].resultFile, '_blank');
  }


  private stopLoader(startTime: number): void {
    const remaining = Math.max(1500 - (Date.now() - startTime), 0);
    setTimeout(() => {
      this.loadingIndicator = false;
      this.cdr.detectChanges();
    }, remaining);
  }
}
import {
  Component, ElementRef, OnInit, TemplateRef, ViewChild,
  inject, DestroyRef, ChangeDetectorRef, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie-service';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

import { LoginSessionService } from '../../services/login-session.service';

import { CifMenuBarComponent } from '../cif-menu-bar/cif-menu-bar.component';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';


// ── Module-level constant (unchanged from original) ───────────────────────────
const FILE_SIZE_LIMIT = 5_148_576; // 5 MB

@Component({
  selector: 'app-FailedPayments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,           // ✅ [(ngModel)] on searchQuery, itemsPerPage, ReceiptRemarks
    ReactiveFormsModule,   // ✅ validationForm1 (FormGroup)
    NgbModule,             // ✅ NgbModal (let-modal in ng-template)
    CurrencyPipe,
    CifMenuBarComponent,
  ],
  templateUrl: './FailedPayments.component.html',
  styleUrls: ['./FailedPayments.component.scss'],
})
export class FailedPaymentsComponent implements OnInit {

  // ── ViewChildren ──────────────────────────────────────────────────────────
  @ViewChild('viewDescModal2')           viewDescModal2!:           TemplateRef<any>;
  @ViewChild('viewDescModal5')           viewDescModal5!:           TemplateRef<any>;
  @ViewChild('PaymentReceiptUploadModal') PaymentReceiptUploadModal!: TemplateRef<any>;
  @ViewChild('table') table!: ElementRef;

  // ── DI via inject() ───────────────────────────────────────────────────────
  private readonly CIFwebService  = inject(LpuCIFWebService);
  private readonly modalService   = inject(NgbModal);
  private readonly AuthSession    = inject(LoginSessionService);
  private readonly route          = inject(ActivatedRoute);
  private readonly cookieService  = inject(CookieService);
  private readonly formBuilder    = inject(FormBuilder);
  private readonly cdr            = inject(ChangeDetectorRef);
  private readonly destroyRef     = inject(DestroyRef);
  // ✅ SSR guard — prevents JSON.parse('') crash on server side
  private readonly platformId     = inject(PLATFORM_ID);

  // ── Table / pagination ────────────────────────────────────────────────────
  BookingStatusData:     any[] = [];
  tmpsBookingStatusData: any[] = [];
  headHtmlData:          any[] = [];
  columns:               any;
  dataSource:            any[] = [];
  displayedColumns: string[] = [
    'instrumentName', 'analysisType', 'analysisCharges',
    'noOfSamples', 'totalCharges', 'remarks', 'bookingRequestDate',
  ];

  currentPage          = 1;
  itemsPerPage         = 5;
  itemsPerPageOptions: number[] = [5, 10, 15, 20, 25];

  // ── Session / user ────────────────────────────────────────────────────────
  UserRole:       any;
  UserId:         any;
  user_Email:     any;
  userId          = '';
  userEmail       = '';
  MobileNo:       any;
  supervisorName  = '';
  departmentName  = '';
  candidateName   = '';

  // ── UI state ──────────────────────────────────────────────────────────────
  loadingIndicator = false;    // ✅ typed boolean — prevents NG0100
  serverUrl        = 'https://files.lpu.in/umsweb/CIFDocuments/';
  ServerUrl:       any;
  ResponseUrl:     any;
  TypeId           = 'CIF';
  searchQuery      = '';
  selectedId!:     number;
  InstrumentId:    any;
  uploadEnabled!:  boolean;
  Remarks:         any;

  // ── Modal / booking data ──────────────────────────────────────────────────
  BookingCase:    any;
  PaymentReceipt: any;
  paymentData:    any;

  // ── Route params ──────────────────────────────────────────────────────────
  id:            any;
  status:        any;
  type:          any;
  transactionNo: any;
  hashedValue:   any;
  course:        any;
  keyNote:       any;

  // ── Payment proof status ──────────────────────────────────────────────────
  paymentProofStatus: {
    [bookingId: string]: { hasProof: boolean; proofFile?: string; isApproved?: string }
  } = {};

  // ── File upload ───────────────────────────────────────────────────────────
  ReceiptRemarks   = '';
  FileDataX:       string | null = null;
  fileDataX:       any;
  fileStatus:      any;
  fileName:        any;
  fileChosen:      { [key: number]: boolean } = {};
  validationForm1!: FormGroup;
  isForm1Submitted = false;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // ✅ SSR guard — all browser/cookie logic skipped during server-side render
    if (!isPlatformBrowser(this.platformId)) { return; }

    const raw = this.cookieService.get('InternalUserAuthData');
    if (!raw || raw.trim().length === 0) { return; }

    try {
      const c = JSON.parse(raw);
      this.UserRole      = c.UserRole || (c.userRole?.length > 0 ? c.userRole : 'Internal User');
      this.UserId        = this.userId = this.user_Email = this.userEmail = c.EmailId;
      this.MobileNo      = c.MobileNo;
      this.supervisorName = c.SupervisorName;
      this.departmentName = c.DepartmentName;
      this.candidateName  = c.CandidateName;
    } catch {
      this.cookieService.delete('InternalUserAuthData');
      return;
    }

    this.initializeForm();

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params.keys.length > 0) { this.getParams(); }
      });

    this.ServerUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';

    // ✅ Build ResponseUrl using same logic as original
    const baseUrl = `${window.location.origin}${
      window.location.pathname.split('/').slice(0, -1).join('/')}`;
    this.ResponseUrl = `${baseUrl}/FailedPayments`;

    // ✅ Defer to avoid NG0100 ExpressionChangedAfterChecked.
    //    loadingIndicator is set synchronously inside getBookingDetails();
    //    deferring ensures Angular's first CD pass is already complete.
    Promise.resolve().then(() => {
      this.getBookingDetails();
      this.cdr.detectChanges();
    });
  }

  // ── Form helpers ──────────────────────────────────────────────────────────
  private initializeForm(): void {
    this.validationForm1 = this.formBuilder.group({
      ReceiptRemarks: ['', Validators.required],
      file:           [null, Validators.required],
    });
  }

  get form1() { return this.validationForm1.controls; }

  loadForm(): void {
    this.validationForm1 = this.formBuilder.group({
      ReceiptRemarks: ['', Validators.required],
      file:           [null, Validators.required],
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

  // ── API: failed-only bookings ─────────────────────────────────────────────
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
            // ✅ Filter: only 'failure' status records
            this.tmpsBookingStatusData = response.item1.filter(
              (item: { paymentStatus: any }) => item.paymentStatus === 'failure'
            );
            if (this.tmpsBookingStatusData.length > 0) {
              this.headHtmlData = this.tmpsBookingStatusData[0];
              this.columns = Object.keys(this.tmpsBookingStatusData[0]).filter(
                (k: string) => !['ResultFile', 'userId', 'id', 'analysisId'].includes(k)
              );
              this.fetchPaymentProofDetailsForBookings();
            }
          } else {
            this.BookingStatusData = [];
          }
          this.stopLoader(startTime);
        },
        // ✅ loader always resets on error — prevents infinite spinner
        error: err => { console.error(err); this.loadingIndicator = false; },
      });
  }

  // ── API: payment proof per booking ────────────────────────────────────────
  private fetchPaymentProofDetailsForBookings(): void {
    const bookingIds = this.tmpsBookingStatusData
      .map((item: any) => item.bookingId)
      .filter((id: any) => id);

    if (bookingIds.length === 0) { return; }

    this.CIFwebService.GetBookingPaymentProofDetails(this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (response?.item1?.length > 0) {
            const allProofData = response.item1;
            bookingIds.forEach((bookingId: string) => {
              const match = allProofData.find((p: any) => p.bookingId == bookingId);
              this.paymentProofStatus[bookingId] = match
                ? {
                    hasProof:   true,
                    proofFile:  match.receiptProofFile || match.proofFile || null,
                    isApproved: match.isProofApproved  || match.isApproved || null,
                  }
                : { hasProof: false };
            });
          } else {
            bookingIds.forEach((id: string) => {
              this.paymentProofStatus[id] = { hasProof: false };
            });
          }
        },
        error: err => {
          console.error('Error fetching payment proof details:', err);
          bookingIds.forEach((id: string) => {
            this.paymentProofStatus[id] = { hasProof: false };
          });
        },
      });
  }

  hasProofUploaded(bookingId: string): boolean {
    return this.paymentProofStatus[bookingId]?.hasProof === true;
  }

  getProofStatus(bookingId: string) {
    return this.paymentProofStatus[bookingId];
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
  onItemsPerPageChange(): void { this.currentPage = 1; }

  // ── Excel export ──────────────────────────────────────────────────────────
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

  // ── Mat-table filter (kept for API parity) ────────────────────────────────
  applyFilter(event: Event): void {
    const val = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (this.dataSource && (this.dataSource as any).filter !== undefined) {
      (this.dataSource as any).filter = val;
    }
  }

  // ── Modals ────────────────────────────────────────────────────────────────
  paymentReceiptScreen(data: any): void {
    this.PaymentReceipt = data;
    this.modalService.open(this.viewDescModal2, { size: 'sm' })
      .result.then(() => {}).catch(() => {});
  }

  openPaymentModal(a: any): void {
    this.BookingCase = a;
    this.modalService.open(this.viewDescModal5, { size: 'lg', centered: true })
      .result.then(() => {}).catch(() => {});
  }

  openReceiptUploadModal(booking: any): void {
    this.BookingCase = booking;
    this.loadForm();
    this.modalService.open(this.PaymentReceiptUploadModal, { size: 'lg', centered: true })
      .result.then(() => {}).catch(() => {});
  }

  // ── Route params → decode payment callback ────────────────────────────────
  getParams(): void {
    this.ResponseUrl = window.location.href;
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.id            = params.get('id');
        this.status        = params.get('status');
        this.type          = params.get('type');
        this.transactionNo = params.get('transactionNo');
        this.hashedValue   = params.get('hashedValue');
        this.course        = params.get('Course');
        this.keyNote       = params.get('KeyNote');

        const formData = new FormData();
        formData.append('Id',            this.id            ?? '');
        formData.append('Status',        this.status        ?? '');
        formData.append('Type',          this.type          ?? '');
        formData.append('TransactionNo', this.transactionNo ?? '');
        formData.append('Course',        this.course        ?? '');
        formData.append('KeyNote',       this.keyNote       ?? '');
        formData.append('HashedValue',   this.hashedValue   ?? '');

        this.CIFwebService.GetDecodePaymentStatusDetails(formData)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (data: any) => {
              if (data?.status === 'failure') {
                Swal.fire({ title: 'Payment Failed', icon: 'error' });
              } else if (data?.status === 'success') {
                Swal.fire({ title: 'Payment Made Successfully', icon: 'success' });
              }
            },
          });
      });
  }

  // ── Payment gateway ───────────────────────────────────────────────────────
  VerifyData(BookingCase: any): void {
    const formData = new FormData();
    formData.append('BookingId',    BookingCase.bookingId);
    formData.append('InstrumentId', BookingCase.instrumentId);
    formData.append('CandidateName', this.candidateName);
    formData.append('Amount',        BookingCase.amount);
    formData.append('Type',          this.TypeId);
    formData.append('UserEmailId',   this.user_Email);
    formData.append('MobileNo',      this.MobileNo);
    formData.append('FacultyCode',   this.user_Email);
    formData.append('ResponseUrl',   this.ResponseUrl);

    forkJoin({ payment: this.CIFwebService.MakePaymentforTest(formData) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results: any) => {
          this.paymentData = results;
          const url = results?.payment?.item1?.[0]?.url;
          if (url?.length > 0) {
            window.location.href = url;
          } else {
            Swal.fire({
              title: results ? 'Error Occurred, Try Again Later' : 'Error',
              text:  results ? 'Payment URL not found!' : 'No data received from the API!',
              icon: 'error',
            });
          }
        },
        error: (err: any) => {
          console.error('Error during API call:', err);
          Swal.fire({ title: 'Error', text: 'Payment Gateway Failed!', icon: 'error' });
        },
      });
  }

  openQRCodeScreen(url: string): Promise<any> {
    return Swal.fire({
      title: 'Scan the QR Code to Proceed with Payment',
      html: `<qrcode [qrdata]="qrCodeUrl" [width]="256" [errorCorrectionLevel]="'M'"></qrcode>`,
      showCancelButton: true,
      confirmButtonText: 'Proceed to Payment',
      cancelButtonText: 'Cancel',
    }).then(result => { if (result.isConfirmed) window.open(url); });
  }

  // ── File upload ───────────────────────────────────────────────────────────
  onFileXSelected(event: any, id: number): void {
    this.fileChosen[id] = event.target.files.length > 0;
    const target        = event.target as HTMLInputElement;
    const file: File | null = (target.files as FileList)[0] || null;
    if (!file) { return; }

    if (file.size > FILE_SIZE_LIMIT) {
      Swal.fire({ title: 'File size exceeds 5 MB', text: 'Please upload a smaller file.', icon: 'warning' });
      target.value = '';
      return;
    }

    const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
    const activeFile: File = fileNameRegex.test(file.name) ? file : (() => {
      const validName    = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const modifiedFile = new File([file], validName, { type: file.type });
      const dt           = new DataTransfer();
      dt.items.add(modifiedFile);
      target.files = dt.files;
      return modifiedFile;
    })();

    this.fileDataX  = activeFile;
    this.fileStatus = true;

    const reader = new FileReader();
    reader.readAsDataURL(activeFile);
    reader.onload = () => {
      const parts    = (reader.result as string).split(',');
      this.FileDataX = parts[1];
      this.fileName  = activeFile.name;
    };
  }

  UpdateFileDocument(Id: number): void {
    if (!this.fileChosen[Id]) { return; }

    this.loadingIndicator = true;
    const startTime = Date.now();

    const formData = new FormData();
    formData.append('BookingId',          Id.toString());
    formData.append('ReceiptRemarks',     this.ReceiptRemarks);
    formData.append('PaymentReceiptUrl',  this.fileName  || '');
    formData.append('PaymentReceiptData', this.FileDataX || '');
    formData.append('UserId',             this.userId);

    this.CIFwebService.UploadPaymentReceipt(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          const returnId = data.item1[0]?.returnId;
          const message  = data.item1[0]?.msg;

          if (returnId === 1) {
            Swal.fire({ title: 'Upload Successful', text: 'Receipt saved successfully!', icon: 'success' })
              .then(() => window.location.reload());
          } else if (returnId === -1) {
            Swal.fire({
              title: 'Receipt Already Exists',
              text:  message || 'A receipt has already been uploaded for this booking.',
              icon:  'warning',
            }).then(() => window.location.reload());
          } else if (returnId === 0) {
            Swal.fire({
              title: 'Upload Failed',
              text:  message || 'Failed to upload receipt. Please try again.',
              icon:  'error', timer: 2000, showConfirmButton: false,
            });
          } else {
            Swal.fire({
              title: 'Upload Result',
              text:  message || 'Unknown response from server.',
              icon:  'info', timer: 2000, showConfirmButton: false,
            });
          }
          this.stopLoader(startTime);
        },
        error: () => {
          Swal.fire({ title: 'Error', text: 'Internal Server error', icon: 'error', showConfirmButton: false });
          this.loadingIndicator = false;
        },
      });
  }

  // ── File download ─────────────────────────────────────────────────────────
  downloadFile(fileName: string): void {
    this.onDownloadFile(this.serverUrl + fileName);
  }

  onDownloadFile(remoteUrl: string): void {
    Swal.fire({ title: 'Downloading...', didOpen: () => { Swal.showLoading(null); } });

    this.CIFwebService.downloadFile(remoteUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob: Blob) => {
          const url  = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href  = url;
          link.download = remoteUrl.split('/').pop() || 'Document.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          Swal.close();
        },
        error: async (err) => {
          Swal.close();
          if (err.error instanceof Blob) {
            const msg = JSON.parse(await err.error.text());
            Swal.fire('Error', msg.message || 'Download failed', 'error');
          } else {
            Swal.fire('Error', 'Could not connect to the server', 'error');
          }
        },
      });
  }

  // ── Print receipt ─────────────────────────────────────────────────────────
  printReceipt(): void {
    const modalContent = document.getElementById('ReceiptData');
    if (!modalContent) { console.error('Modal content not found'); return; }

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) { console.error('Failed to open iframe document'); return; }

    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try { return Array.from(sheet.cssRules).map(r => r.cssText).join(' '); }
        catch { return ''; }
      }).join(' ');

    const cloned = modalContent.cloneNode(true) as HTMLElement;
    const btn    = cloned.querySelector('button');
    if (btn) { btn.style.display = 'none'; }

    iframeDoc.open();
    iframeDoc.write(
      `<html><head><title>Payment Receipt</title><style>${styles}</style></head>` +
      `<body>${cloned.innerHTML}</body></html>`
    );
    iframeDoc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
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
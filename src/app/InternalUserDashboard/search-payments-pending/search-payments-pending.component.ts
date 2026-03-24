

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

import { CifMenuBarComponent } from '../cif-menu-bar/cif-menu-bar.component';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';
import { LoginSessionService } from '../../services/login-session.service';
const FILE_SIZE_LIMIT = 1_048_576; // 1 MB

interface UploadProofRecord {
  bookingId: string;
  instrumentName: string;
  noOfSamples: number;
  totalCharges: number;
  requestDate: string;
  proofRemarks: string;
  isProofApproved: string;
  proofApprovedOn: string | null;
  receiptProofFile: string | null;
  [key: string]: unknown;
}

interface ApiResponse {
  item1: UploadProofRecord[];
}

@Component({
  selector: 'app-search-payments-pending',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    CurrencyPipe,
    CifMenuBarComponent,
  ],
  templateUrl: './search-payments-pending.component.html',
  styleUrls: ['./search-payments-pending.component.scss'],
})

export class SearchPaymentsPendingComponent implements OnInit {

  @ViewChild('viewDescModal2') viewDescModal2!: TemplateRef<any>;
  @ViewChild('viewDescModal5') viewDescModal5!: TemplateRef<any>;
  @ViewChild('PaymentReceiptUploadModal') PaymentReceiptUploadModal!: TemplateRef<any>;
  @ViewChild('table') table!: ElementRef;


  private readonly CIFwebService = inject(LpuCIFWebService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly modalService = inject(NgbModal);
  private readonly authSession = inject(LoginSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly cookieService = inject(CookieService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly platformId = inject(PLATFORM_ID);


  BookingCase: any;
  BookingStatusData: any[] = [];
  tmpsBookingStatusData: any[] = [];
  PaymentReceipt: any;
  paymentData: any;

  currentPage = 1;
  itemsPerPage = 10;
  pageSizeOptions: number[] = [10, 20, 30, 40, 50];

  searchQuery = '';


  ReceiptRemarks = '';
  FileDataX: string | null = null;
  fileDataX: any;
  fileStatus: any;
  fileName: any;
  fileChosen: { [key: number]: boolean } = {};
  validationForm1!: FormGroup;
  isForm1Submitted = false;


  userId = '';
  userEmail = '';
  mobileNo = '';
  supervisorName = '';
  departmentName = '';
  candidateName = '';
  userRole = '';


  loadingIndicator = false;
  serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';
  responseUrl = '';
  TypeId = 'CIF';


  uploadProofStatusData: any[] = [];
  filteredData: any[] = [];
  paymentProofStatus: {
    [bookingId: string]: { hasProof: boolean; proofFile?: string; isApproved?: string }
  } = {};


  id: string | null = null;
  status: string | null = null;
  type: string | null = null;
  transactionNo: string | null = null;
  hashedValue: string | null = null;
  course: string | null = null;
  keyNote: string | null = null;


  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) { return; }

    this.initializeForm();
    this.initializeUserSession();
    this.initializeRouteParams();

    Promise.resolve().then(() => {
      this.getBookingDetails();
      this.cdr.detectChanges();
    });
  }


  private initializeForm(): void {
    this.validationForm1 = this.formBuilder.group({
      ReceiptRemarks: ['', Validators.required],
      file: [null, Validators.required],
    });
  }

  private initializeUserSession(): void {
    const raw = this.cookieService.get('InternalUserAuthData');
    if (!raw || raw.trim().length === 0) { return; }

    try {
      const c = JSON.parse(raw);
      this.userRole = c.UserRole || 'Internal User';
      this.userId = c.EmailId;
      this.userEmail = c.EmailId;
      this.mobileNo = c.MobileNo;
      this.supervisorName = c.SupervisorName;
      this.departmentName = c.DepartmentName;
      this.candidateName = c.CandidateName;

      const base = `${window.location.origin}${window.location.pathname
        .split('/').slice(0, -1).join('/')}`;
      this.responseUrl = `${base}/SearchPendingPayments`;

      this.fetchPaymentProofDetailsForUser();
    } catch {
      this.cookieService.delete('InternalUserAuthData');
    }
  }

  private initializeRouteParams(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params.keys.length > 0) { this.getParams(); }
      });
  }


  getParams(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.id = params.get('id');
        this.status = params.get('status');
        this.type = params.get('type');
        this.transactionNo = params.get('transactionNo');
        this.hashedValue = params.get('hashedValue');
        this.course = params.get('Course');
        this.keyNote = params.get('KeyNote');

        const formData = new FormData();
        formData.append('Id', this.id || '');
        formData.append('Status', this.status || '');
        formData.append('Type', this.type || '');
        formData.append('TransactionNo', this.transactionNo || '');
        formData.append('Course', this.course || '');
        formData.append('KeyNote', this.keyNote || '');
        formData.append('HashedValue', this.hashedValue || '');

        this.CIFwebService.GetDecodePaymentStatusDetails(formData)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (result: any) => {
              if (result?.status === 'failure') {
                Swal.fire({ title: 'Payment Failed', icon: 'error' });
              } else if (result?.status === 'success') {
                Swal.fire({ title: 'Payment Made Successfully', icon: 'success' });
              }
            },
          });
      });
  }


  getBookingDetails(): void {
    this.loadingIndicator = true;
    const startTime = Date.now();

    this.CIFwebService.GetUserPaymentStatusDetails(this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (response.item1?.length > 0) {
            this.BookingStatusData = response.item1;

            this.tmpsBookingStatusData = response.item1.filter((item: any) =>
              item.paymentStatus == null ||
              item.paymentStatus?.toLowerCase() === 'failure'
            );
            if (this.tmpsBookingStatusData.length > 0) {
              this.fetchPaymentProofDetails(this.tmpsBookingStatusData);
            }
          } else {
            this.BookingStatusData = [];
            this.tmpsBookingStatusData = [];
          }
          this.stopLoader(startTime);
        },

        error: (err: any) => { console.error('Error loading payment data:', err); this.loadingIndicator = false; },
      });
  }


  private fetchPaymentProofDetailsForUser(): void {
    this.CIFwebService.GetBookingPaymentProofDetails(this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: ApiResponse) => this.handleApiResponse(response),
        error: err => { console.error('Error fetching payment proof details:', err); },
      });
  }

  private handleApiResponse(response: ApiResponse): void {
    if (response.item1?.length > 0) {
      this.uploadProofStatusData = response.item1;
      this.filteredData = [...this.uploadProofStatusData];
    } else {
      this.uploadProofStatusData = [];
      this.filteredData = [];
    }
  }

  private fetchPaymentProofDetails(bookingIds: any[]): void {
    this.CIFwebService.GetBookingPaymentProofDetails(this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (response?.item1?.length > 0) {
            const allProofData = response.item1;
            bookingIds.forEach((booking: any) => {
              const id = booking.bookingId ?? booking;
              const match = allProofData.find((p: any) => p.bookingId == id);
              this.paymentProofStatus[id] = match
                ? {
                  hasProof: true,
                  proofFile: match.receiptProofFile || match.proofFile || null,
                  isApproved: match.isProofApproved || match.isApproved || null,
                }
                : { hasProof: false };
            });
          } else {
            bookingIds.forEach((booking: any) => {
              const id = booking.bookingId ?? booking;
              this.paymentProofStatus[id] = { hasProof: false };
            });
          }
        },
        error: err => {
          console.error('Error fetching proof details:', err);
          bookingIds.forEach((booking: any) => {
            const id = booking.bookingId ?? booking;
            this.paymentProofStatus[id] = { hasProof: false };
          });
        },
      });
  }

  hasProofUploaded(bookingId: any): boolean {
    return this.uploadProofStatusData.some(
      (proof: any) => String(proof.bookingId) === String(bookingId)
    );
  }


  search(): void {
    const query = this.searchQuery.toLowerCase();
    if (!query.trim()) {
      this.tmpsBookingStatusData = this.BookingStatusData.filter((item: any) =>
        item.paymentStatus == null ||
        item.paymentStatus?.toLowerCase() === 'failure'
      );
    } else {
      this.tmpsBookingStatusData = this.BookingStatusData.filter(item =>
        Object.values(item).some(val => String(val).toLowerCase().includes(query))
      );
    }
    this.currentPage = 1;
  }


  getTotalPages(): number {
    return Math.ceil(this.tmpsBookingStatusData.length / this.itemsPerPage);
  }

  getCurrentPageData(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.tmpsBookingStatusData.slice(start, start + this.itemsPerPage);
  }

  onPageSizeChange(event: Event): void {
    this.itemsPerPage = Number((event.target as HTMLSelectElement).value);
    this.currentPage = 1;
  }

  nextPage(): void { if (this.currentPage < this.getTotalPages()) this.currentPage++; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }


  paymentReceiptScreen(data: any): void {
    this.PaymentReceipt = data;
    this.modalService.open(this.viewDescModal2, { size: 'sm' })
      .result.then(() => { }).catch(() => { });
  }

  openPaymentModal(booking: any): void {
    if (!booking?.bookingId) {
      Swal.fire({ title: 'Error', text: 'Invalid booking data', icon: 'error' });
      return;
    }
    this.BookingCase = booking;
    this.modalService.open(this.viewDescModal5, { size: 'sm' })
      .result.then(() => { }).catch(() => { });
  }

  openReceiptUploadModal(booking: any): void {
    this.BookingCase = booking;
    this.loadForm();
    this.modalService.open(this.PaymentReceiptUploadModal, { size: 'lg', centered: true })
      .result.then(() => { }).catch(() => { });
  }


  get form1() { return this.validationForm1.controls; }

  loadForm(): void {
    this.validationForm1 = this.formBuilder.group({
      ReceiptRemarks: ['', Validators.required],
      file: [null, Validators.required],
    });
  }


  onFileXSelected(event: any, id: number): void {
    this.fileChosen[id] = event.target.files.length > 0;
    const target = event.target as HTMLInputElement;
    const file: File | null = (target.files as FileList)[0] || null;
    if (!file) { return; }

    if (file.size > FILE_SIZE_LIMIT) {
      Swal.fire({ title: 'File size exceeds 1 MB', text: 'Please upload a smaller file.', icon: 'warning' });
      target.value = '';
      return;
    }

    const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
    const activeFile: File = fileNameRegex.test(file.name) ? file : (() => {
      const validName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const modifiedFile = new File([file], validName, { type: file.type });
      const dt = new DataTransfer();
      dt.items.add(modifiedFile);
      target.files = dt.files;
      return modifiedFile;
    })();

    this.fileDataX = activeFile;
    this.fileStatus = true;

    const reader = new FileReader();
    reader.readAsDataURL(activeFile);
    reader.onload = () => {
      const parts = (reader.result as string).split(',');
      this.FileDataX = parts[1];
      this.fileName = activeFile.name;
    };
  }

  UpdateFileDocument(Id: number): void {
    if (!this.fileChosen[Id]) { return; }

    this.loadingIndicator = true;
    const startTime = Date.now();

    const formData = new FormData();
    formData.append('BookingId', Id.toString());
    formData.append('ReceiptRemarks', this.ReceiptRemarks);
    formData.append('PaymentReceiptUrl', this.fileName || '');
    formData.append('PaymentReceiptData', this.FileDataX || '');
    formData.append('UserId', this.userId);

    this.CIFwebService.UploadPaymentReceipt(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          const returnId = data.item1[0]?.returnId;
          const message = data.item1[0]?.msg;

          if (returnId === 1) {
            Swal.fire({ title: 'Upload Successful', text: 'Receipt saved successfully!', icon: 'success' })
              .then(() => window.location.reload());
          } else if (returnId === -1) {
            Swal.fire({
              title: 'Receipt Already Exists',
              text: message || 'A receipt has already been uploaded for this booking.',
              icon: 'warning',
            }).then(() => window.location.reload());
          } else if (returnId === 0) {
            Swal.fire({
              title: 'Upload Failed',
              text: message || 'Failed to upload receipt. Please try again.',
              icon: 'error', timer: 2000, showConfirmButton: false,
            });
          } else {
            Swal.fire({
              title: 'Upload Result',
              text: message || 'Unknown response from server.',
              icon: 'info', timer: 2000, showConfirmButton: false,
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


  VerifyData(BookingCase: any): void {
    if (!BookingCase?.bookingId) {
      Swal.fire({ title: 'Error', text: 'Invalid booking data. Please try again.', icon: 'error' });
      return;
    }
    if (!this.userEmail || !this.mobileNo || !this.candidateName) {
      Swal.fire({ title: 'Session Error', text: 'User session data is missing. Please login again.', icon: 'error' });
      return;
    }

    this.loadingIndicator = true;

    const formData = new FormData();
    formData.append('BookingId', BookingCase.bookingId);
    formData.append('InstrumentId', BookingCase.instrumentId);
    formData.append('CandidateName', this.candidateName);
    formData.append('Amount', BookingCase.amount);
    formData.append('Type', this.TypeId);
    formData.append('UserEmailId', this.userEmail);
    formData.append('MobileNo', this.mobileNo);
    formData.append('FacultyCode', this.userEmail);
    formData.append('ResponseUrl', this.responseUrl);

    forkJoin({ payment: this.CIFwebService.MakePaymentforTest(formData) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results: any) => {
          this.paymentData = results;
          const url = results?.payment?.item1?.[0]?.url;
          if (url?.length > 0) {
            window.location.href = url;
          } else {
            this.loadingIndicator = false;
            Swal.fire({
              title: results?.payment?.item1?.length > 0
                ? 'Error Occurred, Try Again Later'
                : 'Error',
              text: url !== undefined
                ? 'Payment URL not found!'
                : 'Invalid response from payment server. Please try again.',
              icon: 'error',
            });
          }
        },
        error: (err: any) => {
          console.error('Error during API call:', err);
          this.loadingIndicator = false;
          Swal.fire({
            title: 'Payment Gateway Error',
            text: 'Unable to connect to payment server. Please try again later.',
            icon: 'error',
          });
        },
      });
  }


  downloadFile(fileName: string): void {
    this.onDownloadFile(this.serverUrl + fileName);
  }

  onDownloadFile(remoteUrl: string): void {
    Swal.fire({ title: 'Downloading...', didOpen: () => { Swal.showLoading(null); } });

    this.CIFwebService.downloadFile(remoteUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
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


  exportToExcel(): void {
    const fileName = 'Booking_Details_report.xlsx';
    const exportedData = this.BookingStatusData.map(item => ({
      BookingId: item.bookingId,
      InstrumentName: item.instrumentName,
      Samples: item.noOfSamples,
      RequestDate: item.bookingRequestDate,
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
    ws['!cols'] = [{ wpx: 120 }, { wpx: 180 }, { wpx: 100 }, { wpx: 120 }];
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
    link.download = fileName;
    link.click();
  }


  printReceipt(): void {
    const modalContent = document.getElementById('receiptData');
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
    const btn = cloned.querySelector('button');
    if (btn) { btn.style.display = 'none'; }

    iframeDoc.open();
    iframeDoc.write(`<html><head><title>Payment Receipt</title><style>${styles}</style></head><body>${cloned.innerHTML}</body></html>`);
    iframeDoc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  }


  applyFilter(event: Event): void {
     const filterValue = (event.target as HTMLInputElement).value;
    
  }


  private stopLoader(startTime: number): void {
    const remaining = Math.max(1500 - (Date.now() - startTime), 0);
    setTimeout(() => {
      this.loadingIndicator = false;
      this.cdr.detectChanges();
    }, remaining);
  }
}
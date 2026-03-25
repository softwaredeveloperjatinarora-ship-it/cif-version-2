import { LoginSessionService } from '../../services/login-session.service';

 import { CookieService } from 'ngx-cookie-service';
import Swal from 'sweetalert2';
import { CifMenuBarComponent } from '../cif-menu-bar/cif-menu-bar.component';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';
 
import {
  ChangeDetectorRef, Component, ElementRef, OnInit,
  TemplateRef, ViewChild, inject, DestroyRef, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import * as XLSX from 'xlsx';
 
@Component({
  selector: 'app-view-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,      
    NgbModule,       
    CurrencyPipe,
    DatePipe,
    CifMenuBarComponent,
  ],
  templateUrl: './view-bookings.component.html',
  styleUrls: ['./view-bookings.component.scss'],
  providers: [DatePipe],
})
export class ViewBookingsComponent implements OnInit {


  @ViewChild('viewDescModal2')           viewDescModal2!:           TemplateRef<any>;
  @ViewChild('ViewUpdateStatusModal')    ViewUpdateStatusModal!:    TemplateRef<any>;
  @ViewChild('PaymentReceiptUploadModal') PaymentReceiptUploadModal!: TemplateRef<any>;
  @ViewChild('table') table!: ElementRef;


  private readonly CIFwebService  = inject(LpuCIFWebService);
  private readonly modalService   = inject(NgbModal);
  private readonly router         = inject(Router);
  private readonly route          = inject(ActivatedRoute);
  private readonly location       = inject(Location);
  private readonly cookieService  = inject(CookieService);
  private readonly AuthSession    = inject(LoginSessionService);
  private readonly datePipe       = inject(DatePipe);
  private readonly cdr            = inject(ChangeDetectorRef);
  private readonly destroyRef     = inject(DestroyRef);

  private readonly platformId     = inject(PLATFORM_ID);


  BookingData:      any[] = [];
  tmpsBookingData:  any[] = [];
  headHtmlData:     any[] = [];
  columns:          any;

  dataSource:       any[] = [];

  currentPage              = 1;
  itemsPerPage             = 5;
  itemsPerPageOptions: number[] = [5, 10, 15, 20, 25];

  displayedColumns: string[] = [
    'instrumentName', 'analysisType', 'analysisCharges',
    'noOfSamples', 'totalCharges', 'remarks', 'bookingRequestDate',
  ];


  TypeId        = 'CIF';
  user_Email:   any;
  userId:       any;
  userEmail:    any;
  UserId:       any;
  UserRole:     any;
  MobileNo:     any;
  candidateName:  any;
  supervisorName: any;
  departmentName: any;
  serverUrl!:   string;
  ResponseUrl!: string;
  qrCodeUrl!:   string;
  sessionData:  any[] = [];


  id:            any;
  status:        any;
  type:          any;
  transactionNo: any;
  hashedValue:   any;
  course:        any;
  keyNote:       any;


  loadingIndicator = false;
  BookingCase:     any;
  paymentData:     any;
  searchQuery      = '';
  selectedId!:     number;
  InstrumentId:    any;


  SampleStatusData:  any;
  dataSourceSamples: any;
  ToGetSampleforId:           any;
  ToGetSampleforInstrumentId: any;


  uploadProofStatusData: any[] = [];
  filteredData:          any[] = [];


  ReceiptRemarks  = '';
  FileDataX:      string | null = null;
  fileDataX:      any;
  fileStatus:     any;
  fileName:       any;
  fileChosen:     { [key: number]: boolean } = {};


  ngOnInit(): void {

    if (!isPlatformBrowser(this.platformId)) { return; }

    this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';

    const raw = this.cookieService.get('InternalUserAuthData');
    if (!raw || raw.trim().length === 0) {
      Swal.fire({ title: 'Session Expired', text: 'Please login again.', icon: 'warning' })
        .then(() => this.router.navigate(['']));
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
      this.cookieService.delete('InternalUserAuthData');
      this.router.navigate(['']);
      return;
    }

    this.ResponseUrl = `${window.location.origin}${window.location.pathname
      .split('/').slice(0, -1).join('/')}/ViewBookings`;


    Promise.resolve().then(() => {
      this.getParams();
      this.getBookingDetails();
      this.fetchAllSampleStatus();
      this.fetchPaymentProofDetailsForUser();
      this.cdr.detectChanges();
    });
  }


  getParams(): void {
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
        formData.append('Id',            this.id);
        formData.append('Status',        this.status);
        formData.append('Type',          this.type);
        formData.append('TransactionNo', this.transactionNo);
        formData.append('Course',        this.course);
        formData.append('KeyNote',       this.keyNote);
        formData.append('HashedValue',   this.hashedValue);

        this.CIFwebService.GetDecodePaymentStatusDetails(formData)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: data => {
              if (data?.status === 'failure') {
                Swal.fire({ title: 'Payment Failed', icon: 'error' });
              } else if (data?.status === 'success') {
                Swal.fire({ title: 'Payment Made Successfully', icon: 'success' });
              }
            },
          });
      });
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
            this.BookingData       = response.item1;
            this.dataSource        = response.item1;
            this.tmpsBookingData   = response.item1;
            this.headHtmlData      = this.tmpsBookingData[0];
            this.columns = Object.keys(this.tmpsBookingData[0]).filter(
              (k: string) => !['bookingRequestDate', 'instrumentId', 'id', 'analysisId'].includes(k)
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


  search(): void {
    const query = this.searchQuery.toLowerCase();
    this.tmpsBookingData = this.BookingData.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(query))
    );
    this.currentPage = 1;
  }


  exportToExcel(): void {
    const fileName    = 'Booking_Details_report.xlsx';
    const exportedData = this.BookingData.map(item => ({
      BookingId:       item.bookingId,
      InstrumentName:  item.instrumentName,
      AnalysisType:    item.analysisType,
      AnalysisCharges: item.analysisCharges,
      Samples:         item.noOfSamples,
      totalCharges:    item.totalCharges,
      RequestDate:     this.datePipe.transform(item.bookingRequestDate, 'dd/MM/yyyy'),
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
    ws['!cols'] = Array(10).fill({ wpx: 180 });
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link      = document.createElement('a');
    link.href       = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
    link.download   = fileName;
    link.click();
  }


  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (this.dataSource && (this.dataSource as any).filter !== undefined) {
      (this.dataSource as any).filter = filterValue;
    }
  }

  downloadFile(fileName: string): void {
    window.open(this.serverUrl + fileName, '_blank');
  }


  openPaymentModal(a: any): void {
    this.BookingCase = a;
    this.modalService.open(this.viewDescModal2, { size: 'sm' })
      .result.then(() => {}).catch(() => {});
  }


  VerifyData(BookingCase: any): void {
    this.loadingIndicator = true;
    const startTime = Date.now();

    const formData = new FormData();
    formData.append('BookingId',    BookingCase.id);
    formData.append('InstrumentId', BookingCase.instrumentId);
    formData.append('CandidateName', this.candidateName);
    formData.append('Amount',        BookingCase.totalCharges);
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
            Swal.fire({ title: 'Error Occurred, Try Again Later', text: 'Payment URL not found!', icon: 'error' });
          }
          this.stopLoader(startTime);
        },
        error: (error: any) => {
          console.error('Error during API call:', error);
          Swal.fire({ title: 'Error', text: 'Payment Gateway Failed!', icon: 'error' });
          this.loadingIndicator = false;
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


  fetchAllSampleStatus(): void {
    this.CIFwebService.GetAllSampleStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (response.item1?.length > 0) {
            this.SampleStatusData  = response.item1;
            this.dataSourceSamples = response.item1;
          } else {
            this.SampleStatusData = [];
          }
        },
        error: err => console.error(err),
      });
  }

  GetStatus(Data: any): void {
    this.ToGetSampleforId           = Data['bookingId'];
    this.ToGetSampleforInstrumentId = Data['instrumentId'];

    this.SampleStatusData = this.dataSourceSamples.filter(
      (item: any) =>
        item.bookingId   == this.ToGetSampleforId &&
        item.instrumentId == this.ToGetSampleforInstrumentId
    );

    if (this.SampleStatusData?.length > 0) {
      this.modalService.open(this.ViewUpdateStatusModal, { size: 'sm' })
        .result.then(() => {}).catch(() => {});
    } else {
      this.SampleStatusData = [];
      Swal.fire({
        title: 'No Data Found',
        text:  'No sample status data available for the selected booking and instrument.',
        icon:  'info',
      });
    }
  }


  private fetchPaymentProofDetailsForUser(): void {
    this.CIFwebService.GetBookingPaymentProofDetails(this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => this.handleApiResponse(response),
        error: err => console.error('Error fetching payment proof details:', err),
      });
  }

  private handleApiResponse(response: any): void {
    if (response.item1?.length > 0) {
      this.uploadProofStatusData = response.item1;
      this.filteredData          = [...this.uploadProofStatusData];
    } else {
      this.uploadProofStatusData = [];
      this.filteredData          = [];
    }
  }

  hasProofUploaded(bookingId: any): boolean {
    return this.uploadProofStatusData.some(
      (proof: any) => String(proof.bookingId) === String(bookingId)
    );
  }


  openReceiptUploadModal(booking: any): void {
    this.BookingCase = booking;
    this.modalService.open(this.PaymentReceiptUploadModal, { size: 'lg', centered: true })
      .result.then(() => {}).catch(() => {});
  }

  onFileXSelected(event: any, id: number): void {
    this.fileChosen[id] = event.target.files.length > 0;
    const target = event.target as HTMLInputElement;
    const file: File | null = (target.files as FileList)[0] || null;
    if (!file) { return; }

    if (file.size > 5_148_576) {
      Swal.fire({ title: 'File size exceeds 5 MB', text: 'Please upload a smaller file.', icon: 'warning' });
      target.value = '';
      return;
    }

    this.fileDataX  = file;
    this.fileStatus = true;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result    = reader.result as string;
      this.FileDataX  = result.split(',')[1];
      this.fileName   = file.name;
    };
  }

  UpdateFileDocument(Id: number): void {
    if (!this.fileChosen[Id]) { return; }

    this.loadingIndicator = true;

    const formData = new FormData();
    formData.append('BookingId',          Id.toString());
    formData.append('ReceiptRemarks',     this.ReceiptRemarks);
    formData.append('PaymentReceiptUrl',  this.fileName  || '');
    formData.append('PaymentReceiptData', this.FileDataX || '');
    formData.append('UserId',             this.UserId);

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
          }
          this.loadingIndicator = false;
        },
        error: () => {
          Swal.fire({ title: 'Error', text: 'Internal Server error', icon: 'error', showConfirmButton: false });
          this.loadingIndicator = false;
        },
      });
  }


  private stopLoader(startTime: number): void {
    const remaining = Math.max(2500 - (Date.now() - startTime), 0);
    setTimeout(() => {
      this.loadingIndicator = false;
      this.cdr.detectChanges();
    }, remaining);
  }
}
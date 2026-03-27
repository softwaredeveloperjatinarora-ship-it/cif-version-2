import { FormBuilder, FormGroup, FormControl, FormsModule, ReactiveFormsModule, UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { NgbDateStruct, NgbModal, NgbDropdownModule, NgbDatepickerModule, NgbNavModule, NgbCollapseModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import * as XLSX from 'xlsx';
import swal from 'sweetalert2';
import Swal from 'sweetalert2';
import { ColumnMode, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { CommonModule, DOCUMENT } from '@angular/common';




import { LoginSessionService } from '../../services/login-session.service';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

import { MouDocumentsService } from '../../services/mou-documents.service';
import { AdminDashboardComponent } from '../AdminDashboard/AdminDashboard';
import { Subject, takeUntil } from 'rxjs';




@Component({
  selector: 'app-AdminPendingPayments',
  templateUrl: './AdminPendingPayments.component.html',
  styleUrls: ['./AdminPendingPayments.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDropdownModule,
    NgbDatepickerModule,
    NgxDatatableModule,
    NgbNavModule,
    NgbCollapseModule,
    NgbModule,
    NgSelectModule,
    AdminDashboardComponent
  ]
})
export class AdminPendingPaymentsComponent implements OnInit {
  @ViewChild('ngSelectComponent')
  ngSelectComponent: NgSelectComponent = new NgSelectComponent;
  @ViewChild('ngSelectComponentStream')
  ngSelectComponentStream: NgSelectComponent = new NgSelectComponent;
  @ViewChild('verticalCenteredModal')
  verticalCenteredModal!: TemplateRef<any>;
  @ViewChild('viewDescModal')
  viewDescModal!: TemplateRef<any>;
  @ViewChild('viewDescModal2')
  viewDescModal2!: TemplateRef<any>;
  @ViewChild('PendingPaymentModal')
  PendingPaymentModal!: TemplateRef<any>;
  dataSource!: MatTableDataSource<any>;

  selectedId!: number;
  ColumnMode = ColumnMode;
  columns: any;
  loadingIndicator = false;
  headHtmlData: any[] = [];
  p: any = 1;
  perPage: any = 5;
  @ViewChild('table')
  table!: ElementRef;
  displayedColumns: string[] = [
    'instrumentName', 'analysisType', 'analysisCharges', 'noOfSamples',
    'totalCharges', 'remarks', 'bookingRequestDate', //'bookingrequestDate'
  ];
  BookingCase: any;
  AllPaymentData: any[] = [];

  currentPage = 1;
  itemsPerPage = 10; //
  
  // Items per page dropdown options
  itemsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '15', value: 15 },
    { label: '20', value: 20 },
    { label: 'All', value: 'all' }
  ];
  
  // Track if 'all' is selected
  isAllSelected = false;
  tmpsAllPaymentData: any;
  InstrumentId: any;
  UserRole: any;
  PaymentReceipt: any;

  constructor(
    private CIFwebService: LpuCIFWebService,
    private storageService: StorageService,
    private authService: AuthService,
    private fb: FormBuilder, 
    private cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
    private modalService: NgbModal,
    private AuthSession: LoginSessionService,
    private router: Router, 
    private route: ActivatedRoute,
    private cookieService: CookieService
  ) { }

  user_Email: any;
  sessionData: any[] = [];
  
  paymentForm: FormGroup | undefined;

  getSessionDetails() {
    this.sessionData = this.AuthSession.getSession();
    for (const session of this.sessionData) {
      this.user_Email = session[0]['userEmail']
    }
  }

  ngOnInit(): void {
    const GetCookieData = this.cookieService.get('AdminAuthData');
    const retrievedCookies = JSON.parse(GetCookieData);
    this.UserRole = retrievedCookies.UserRole;
    this.user_Email = retrievedCookies.EmailId;
      this.paymentForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0)]],
      remarks: ['', Validators.required]
    });
    this.getAllPaymentDetails();
  }

  searchQuery: string = ''; // Property to store the search query

  get filteredAllPaymentData(): any[] {
    // If search query is empty, return all data
    if (!this.searchQuery.trim()) {
      return this.AllPaymentData;
    }

    // Otherwise, filter data based on search query
    const searchTerm = this.searchQuery.toLowerCase();
    return this.AllPaymentData.filter((booking: { instrumentName: string; analysisType: string; }) =>
      booking.instrumentName.toLowerCase().includes(searchTerm) || booking.analysisType.toLowerCase().includes(searchTerm)

    );
  }

  getAllPaymentDetails() {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();
    this.CIFwebService.GetAllPaymentDetails().subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.AllPaymentData = response.item1;
          this.dataSource = response.item1;
          // console.log(JSON.stringify(this.dataSource))
          this.originalData = [...this.AllPaymentData];  
          this.tmpsAllPaymentData = [...this.AllPaymentData];  
          this.filteredData = [...this.AllPaymentData];  

          this.headHtmlData = this.tmpsAllPaymentData[0];
          this.columns = Object.keys(this.tmpsAllPaymentData[0]);
          this.columns = this.columns.filter((item: any) => item !== 'bookingRequestDate' && item !== 'instrumentId' && item !== 'id' && item !== 'analysisId');
          //// debugger
          this.columns.push()
        }
        else {
          this.AllPaymentData = [];
        }
        const elapsed = new Date().getTime() - startTime;
        const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 5s

        setTimeout(() => {
          this.loadingIndicator = false;
          this.cdRef.markForCheck();
        }, remainingDelay);
      },
      error: err => {
        console.log(err)
      }
    });
  }

  search() {
    const query = this.searchQuery.toLowerCase();
    this.tmpsAllPaymentData = this.AllPaymentData.filter(item => {
      return Object.values(item).some(val =>
        String(val).toLowerCase().includes(query)
      );
    });
  }

  getTotalRecords(): number {
    return this.tmpsAllPaymentData ? this.tmpsAllPaymentData.length : 0;
  }

  getTotalPages() {
    if (this.isAllSelected) {
      return 1; // When 'all' is selected, there's only 1 page showing all data
    }
    return Math.ceil(this.tmpsAllPaymentData.length / this.itemsPerPage);
  }

  onItemsPerPageChange(event: any): void {
    const value = event.target.value;
    if (value === 'all') {
      this.isAllSelected = true;
      this.itemsPerPage = this.tmpsAllPaymentData.length; // Show all records
    } else {
      this.isAllSelected = false;
      this.itemsPerPage = parseInt(value, 10);
    }
    this.currentPage = 1; // Reset to first page when items per page changes
  }

  getCurrentPageData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.tmpsAllPaymentData.slice(startIndex, endIndex);
  }

  nextPage() {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  exportToExcel(): void {
    const fileName = 'Booking_Details_report.xlsx';
    const exportedData = this.AllPaymentData.map(item => ({
 
         CandidateName :item.candidateName,
         UserEmailId :item.userEmailId,
         UserRole :item.userRole,
         OrganisationName :item.organisationName,
         InstrumentName :item.instrumentName,
         BookingId :item.bookingId,
         NoOfSamples :item.noOfSamples,
         RequestDate  :item.requestDate ,
         PaymentAmount  :item.amount ,
         PaymentStatus:item.paymentStatus === 'success' ? 'Success' : item?.paymentStatus === 'failure' ? 'Failed' : 'Pending',
         MobileNo:item.mobileNo,

    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);

    const wscols = [
      { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }
    ];
    ws['!cols'] = wscols;

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link = this.document.createElement('a');
    link.href = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
    link.download = fileName;
    link.click();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openPaymentModal(a: any) {
    this.BookingCase = a;
    this.modalService.open(this.viewDescModal2, { size: 'sm' }).result.then(
      (result: string) => {
        console.log("Modal closed" + result);
      }
    ).catch((res: any) => { });

  }

  VerifyData() {
    swal.fire({
      title: 'Processing Wait..',
      text: 'Payment Gateway Error!',
      icon: 'warning',
    })
  }

  paymentReceiptScreen(data: any) {
    this.PaymentReceipt = data;
    this.modalService.open(this.viewDescModal2, { size: 'sm' }).result.then(
      (result: string) => {
        console.log("Modal closed" + result);
      }
    ).catch((res: any) => { });
  }

  printReceipt(): void {
    const modalContent = this.document.getElementById("ReceiptData");  // Get the modal content by its ID

    if (modalContent) {
      const iframe = this.document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      this.document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;

      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write('<html><head><title>Payment Receipt</title>');

        const styles = Array.from(this.document.styleSheets)
          .map(styleSheet => {
            try {
              return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join(' ');
            } catch (e) {
              return '';
            }
          })
          .join(' ');

        iframeDoc.write(`<style>${styles}</style>`);
        iframeDoc.write('</head><body >');

        const clonedContent = modalContent.cloneNode(true) as HTMLElement;
        const printButton = clonedContent.querySelector("button");
        if (printButton) {
          printButton.style.display = "none";
        }

        iframeDoc.write(clonedContent.innerHTML);
        iframeDoc.write('</body></html>');
        iframeDoc.close();


        iframe.onload = () => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();

          iframe.onload = () => {
            this.document.body.removeChild(iframe);
          };
        };
      } else {
        console.error('Failed to open iframe document');
      }
    } else {
      console.error('Modal content not found');
    }
  }

  CurrentUserPaymentData: any;
  CurrentbookingId: any;
  CurrentinstrumentName: any;
  CurrentcandidateName: any;
  CurrentrequestDate: any;

  PendingPayment(data: any) {
    var currentUserPaymentData = data;
    this.CurrentbookingId = currentUserPaymentData['bookingId']
    this.CurrentinstrumentName = currentUserPaymentData['instrumentName']
    this.CurrentcandidateName = currentUserPaymentData['candidateName']
    this.CurrentrequestDate = currentUserPaymentData['requestDate']

    this.modalService.open(this.PendingPaymentModal, { size: 'sm' }).result.then(
      (result: string) => {
        console.log("Modal closed" + result);
      }
    ).catch((res: any) => { });
  }


  
  // paymentForm: FormGroup;

  // paymentForm = this.fb.group({
  //   amount: [null, [Validators.required, Validators.min(0)]],
  //   remarks: ['', Validators.required]
  // });

  onUpdatePayment() {
    // if (this.paymentForm.valid) {
    //   const paymentDetails = this.paymentForm.value;
    //   // console.log("Payment details to update:", paymentDetails);
    //   // Perform your update logic here...
    // }
  }

  originalData: any[] = []; // Loaded from API
  filteredData: any[] = [];
  selectedStatus: string = '';

  filterData(): void {
    if (this.selectedStatus === '') {
      this.tmpsAllPaymentData = [...this.originalData]; // Show all data
    } else if (this.selectedStatus === 'null') {
      this.tmpsAllPaymentData = this.originalData.filter(item => item.paymentStatus === null);
    } else {
      this.tmpsAllPaymentData = this.originalData.filter(item => item.paymentStatus === this.selectedStatus);
    }
    this.currentPage = 1; // Reset to first page after filtering
  }

  statusOptions = [
    { label: 'All', value: '' }, 
    { label: 'Success', value: 'success' },
    { label: 'Failure', value: 'failure' },
    { label: 'Pending', value: 'null' }
  ];
  
}

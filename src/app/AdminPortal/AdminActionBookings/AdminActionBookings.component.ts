// import { FormBuilder } from '@angular/forms';
// import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
// import { CookieService } from 'ngx-cookie-service';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { Router, ActivatedRoute } from '@angular/router';
// import { AuthService } from '../../services/auth.service';
// import { StorageService } from '../../services/storage.service';
// import * as XLSX from 'xlsx';
// import swal from 'sweetalert2';
// import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
// import Swal from 'sweetalert2';
// import { LoginSessionService } from '../../services/login-session.service';

// import { ColumnMode } from '@swimlane/ngx-datatable';

// import { MatTableDataSource } from '@angular/material/table';
// import { NgSelectComponent } from '@ng-select/ng-select';
// import { DOCUMENT } from '@angular/common';


// @Component({
//   selector: 'app-AdminActionBookings',
//   templateUrl: './AdminActionBookings.component.html',
//   styleUrls: ['./AdminActionBookings.component.scss']
// })
// export class AdminActionBookingsComponent implements OnInit {
//   @ViewChild('ngSelectComponent') ngSelectComponent: NgSelectComponent;
//   @ViewChild('ngSelectComponentStream') ngSelectComponentStream: NgSelectComponent;
//   @ViewChild('verticalCenteredModal') verticalCenteredModal: TemplateRef<any>;
//   @ViewChild('viewDescModal') viewDescModal: TemplateRef<any>;
//   @ViewChild('viewDescModal2') viewDescModal2: TemplateRef<any>;
//   dataSource: MatTableDataSource<any>;



//   AllBookingTestsData: any[] = [];
//   tmpsAllBookingTestsData: any[] = []; // Not strictly needed, but keeping for compatibility/export
//   headHtmlData: any[] = [];

//   currentPage = 1;
//   itemsPerPage = 15;
//   searchQuery: string = '';

//   BookingCase: any;
//   AssignedTo: any = '';
//   InstrumentId: any;

//   // User data from cookie
//   UserRole: string = '';
//   user_Email: string = '';
//   candidateName: string = '';
//   serverUrl: string = 'https://files.lpu.in/umsweb/CIFDocuments/'; 
//   supervisorName: any;
//   departmentName: any;

//   FileData: any; array: any[] = []; fileData: File; fileStatus: boolean = false;
//   fileName: string;
//   selectedId: number;
//   ColumnMode = ColumnMode;
//   columns: any;
//   loadingIndicator = false;
//   p: any = 1;
//   perPage: any = 15;
//   @ViewChild('table') table: ElementRef;
//   displayedColumns: string[] = [
//     'instrumentName', 'analysisType', 'analysisCharges', 'noOfSamples',
//     'totalCharges', 'remarks', 'bookingRequestDate', 
//   ];
//   BookingData: any[] = []; // Unused after initial load, originalData is better
//   tmpsBookingData: any[] = []; // <--- THIS is the main array used for display/pagination/search
//   UserId: any;
//   uploadEnabled: boolean;
//   Remarks: any;
//   originalData: any[] = []; // Loaded from API and remains unchanged
//   selectedStatus: string;

//   constructor(
//     private CIFwebService: LpuCIFWebService,
//     private storageService: StorageService,
//     private authService: AuthService,
//     private fb: FormBuilder, private cdRef: ChangeDetectorRef,
//     @Inject(DOCUMENT) document: Document,
//     private modalService: NgbModal,
//     private AuthSession: LoginSessionService,
//     private router: Router, private route: ActivatedRoute,
//     private cookieService: CookieService) { }
//   sessionData: any[] = [];
//   getSessionDetails() {
//     this.sessionData = this.AuthSession.getSession();
//     for (const session of this.sessionData) {
//       this.user_Email = session[0]['userEmail']
//     }
//   }
//   ngOnInit(): void {
//     this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';//'http://172.19.2.52/umsweb/webftp/CIFDocuments/';
//     const GetCookieData = this.cookieService.get('authData');
//     const retrievedCookies = JSON.parse(GetCookieData);
//     this.UserRole = retrievedCookies.UserRole;
//     this.UserId = retrievedCookies.EmailId;
//     this.loadUserFromCookies();
//     this.getAllPaymentDetails();
//     this.getAllAssignedTest();
//   }


//   // FIX: This search logic should apply to the currently visible data set, which might be filtered by advanced search.
//   search() {
//     this.currentPage = 1; // Reset to first page on new search
//     const query = this.searchQuery.toLowerCase();
    
//     // Determine the base data to filter from: either the original data or the data filtered by advanced search (if active).
//     let baseData = this.originalData;

//     // If advanced filters are applied, filter from the advanced-filtered result set.
//     if (this.showAdvancedSearch && (this.selectedStatus || this.IsAssigned)) {
//         baseData = this.getAdvancedFilteredData();
//     }
    
//     this.tmpsBookingData = baseData.filter(item => {
//       // The search should only apply if the searchQuery is not empty. If it is empty, tmpsBookingData should just be the baseData.
//       if (!query) return true; 

//       return Object.values(item).some((val: any) =>
//         String(val).toLowerCase().includes(query)
//       );
//     });
//   }


//   get filteredBookingData(): any[] {
//     // This function is not used in the final display logic, kept for reference.
//     if (!this.searchQuery.trim()) {
//       return this.BookingData;
//     }
//     const searchTerm = this.searchQuery.toLowerCase();
//     return this.BookingData.filter((booking: { instrumentName: string; analysisType: string; }) =>
//       booking.instrumentName.toLowerCase().includes(searchTerm) || booking.analysisType.toLowerCase().includes(searchTerm)
//     );
//   }

//   statusOptions = [
//     { label: 'All', value: '' },
//     { label: 'Success', value: 'success' },
//     { label: 'Failure', value: 'failure' },
//     { label: 'Pending', value: 'null' }
//   ];

//   getTotalRecords(): number {
//     return this.tmpsBookingData ? this.tmpsBookingData.length : 0;
//   }

//   // Items per page dropdown options
//   itemsPerPageOptions = [
//     { label: '5', value: 5 },
//     { label: '10', value: 10 },
//     { label: '15', value: 15 },
//     { label: '20', value: 20 },
//     { label: 'All', value: 'all' }
//   ];

//   // Track if 'all' is selected
//   isAllSelected = false;

//   // Handle record size dropdown change
//   onItemsPerPageChange(event: any): void {
//     const value = event.target.value;
//     if (value === 'all') {
//       this.isAllSelected = true;
//       this.itemsPerPage = this.tmpsBookingData.length; // Show all records
//     } else {
//       this.isAllSelected = false;
//       this.itemsPerPage = parseInt(value, 10);
//     }
//     this.currentPage = 1; // Reset to first page when items per page changes
//   }


//   exportToExcel(): void {
//     const fileName = 'AssignedResults_report.xlsx';
//     // FIX: Export should use the currently displayed data, which is tmpsBookingData
//     const exportedData = this.tmpsBookingData.map(item => ({ 
//       BookingId: item.bookingId,
//       InstrumentName: item.instrumentName,
//       EmailId: item.userEmailId,
//       candidateName: item.candidateName,
//       OrganisationName: item.organisationName,
//       UserRole: item.userRole,
//       Samplecount: item.noOfSamples,
//       PaymentAmount: item.totalCharges,
//       RequestDate: item.bookingRequestDate,
//       PaymentStatus: item?.paymentStatus === 'success' ? 'Paid' : item?.paymentStatus === 'failure' ? 'Failed' : 'Pending',
//       BookingDate: item.paymentDate,
//     }));

//     const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);

//     const wscols = [
//       { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }
//     ];
//     ws['!cols'] = wscols;

//     const wb: XLSX.WorkBook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
//     const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
//     link.download = fileName;
//     link.click();
//   }


//   applyFilter(event: Event) {
//     const filterValue = (event.target as HTMLInputElement).value;
//     this.dataSource.filter = filterValue.trim().toLowerCase();
//   }

//   downloadFile(fileName: string): void {
//     const url = this.serverUrl + fileName;
//     window.open(url, '_blank');
//   }
//   openPaymentModal(a: any) {
//     this.BookingCase = a;
//     this.modalService.open(this.viewDescModal2, { size: 'sm' }).result.then(
//       (result: string) => {
//         console.log("Modal closed" + result);
//       }
//     ).catch((res: any) => { });

//   }

//   VerifyData(BookingData: any) {
//     this.loadingIndicator = true;
//     const startTime = new Date().getTime();
//     if (this.FileData) {
//       const formData = new FormData();
//       formData.append('BookingId', BookingData.bookingId);
//       formData.append('UserEmailId', BookingData.userEmailId);
//       formData.append('Remarks', this.Remarks);
//       formData.append('CreatedBy', this.user_Email);
//       formData.append('FilePath', this.fileName);
//       formData.append('File', this.FileData);
//       this.CIFwebService.CIFResultsUploads(formData).subscribe({
//         next: (data: any) => {
//           const result = data.item1[0]['msg']; 
//           const returnId = data.item1[0]['ReturnId'];

//           if (result === 'Success' && returnId !== '0') {
//             Swal.fire({
//               title: 'Uploaded Successfully!',
//               icon: 'success'
//             }).then(() => {
//               window.location.reload();
//             });
//           } else {
//             Swal.fire({
//               title: 'Already Uploaded Results for this Test',
//               icon: 'error'
//             }).then(() => {
//               window.location.reload();
//             });
//           }
//           const elapsed = new Date().getTime() - startTime;
//           const remainingDelay = Math.max(1500 - elapsed, 0); 

//           setTimeout(() => {
//             this.loadingIndicator = false;
//           }, remainingDelay);
//         },
//         error: (error: any) => {
//           Swal.fire({
//             title: 'Error',
//             text: 'Failed to Upload.',
//             icon: 'error'
//           });
//         }
//       });
//     }
//     else {
//       Swal.fire({
//         title: 'Error',
//         text: 'Kindly Upload File.',
//         icon: 'error'
//       });
//     }
//   }


//   onFileSelected(event: any): void {
//     this.fileStatus = false;
//     const reader = new FileReader();
//     const target = event.target as HTMLInputElement;
//     const file: File | null = (target.files as FileList)[0] || null;
//     if (file && file.size > 5148576) {
//       swal.fire({
//         title: 'File size exceeds 5MB. Please upload a smaller file.',
//         text: 'Invalid File size',
//         icon: 'warning'
//       });
//       target.value = '';
//       return;
//     }

//     const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
//     if (file && !fileNameRegex.test(file.name)) {
//       const validFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

//       const modifiedFile = new File([file], validFileName, { type: file.type });
//       const dataTransfer = new DataTransfer();
//       dataTransfer.items.add(modifiedFile);
//       target.files = dataTransfer.files;

//       this.fileData = modifiedFile;
//       this.fileStatus = true;

//       reader.readAsDataURL(modifiedFile);
//       reader.onload = () => {
//         const ssss = reader.result as string;
//         const ssssArray = ssss.split(',');
//         this.FileData = ssssArray[1];
//         this.fileName = validFileName;
//       };
//       this.uploadEnabled = true;
//       return;
//     }

//     this.fileData = file;
//     this.fileStatus = true;
//     if (file) {
//       reader.readAsDataURL(file);
//       reader.onload = () => {
//         const ssss = reader.result as string;
//         const ssssArray = ssss.split(',');
//         this.FileData = ssssArray[1];
//         this.fileName = file.name;
//       };
//     }
//   }

//   UploadDocument() {
//     const formData = new FormData();
//   }



//   loadUserFromCookies(): void {
//     const cookieData = this.cookieService.get('authData');

//     if (cookieData) {
//       try {
//         const parsed = JSON.parse(cookieData);
//         this.UserRole = parsed.UserRole || '';
//         this.user_Email = parsed.EmailId || '';
//         this.candidateName = parsed.CandidateName || '';
//       } catch (err) {
//         console.error('Error parsing authData cookie:', err);
//         swal.fire('Session Error', 'Invalid session data. Please login again.', 'error');
//         this.router.navigate(['/Home']);
//       }
//     } else {
//       swal.fire('Session Expired', 'Please login again to continue.', 'warning');
//       this.router.navigate(['/Home']);
//     }
//   }

//   get filteredAllBookingTestsData(): any[] {
//     const query = this.searchQuery.trim().toLowerCase();
//     if (!query) return this.tmpsBookingData;

//     return this.tmpsBookingData.filter((booking) =>
//       booking.instrumentName.toLowerCase().includes(query) ||
//       booking.analysisType.toLowerCase().includes(query)
//     );
//   }


//   IsAssigned: string = '';
//   // FIX: Removed getAssignedData as its logic is merged into applyAdvancedSearch
//   // getAssignedData(): void {
//   //   // ... logic is now inside applyAdvancedSearch ...
//   // }


//   assignedOptions = [
//     { label: 'All', value: '' },
//     { label: 'Assigned', value: 'Assigned' },
//     { label: 'Pending', value: 'Pending' }
//   ];

//   hasAnySearchCriteria: any;

//   checkSearchCriteria(): void {
//     this.hasAnySearchCriteria =
//       (this.selectedStatus && this.selectedStatus.trim() !== '') ||
//       (this.IsAssigned && this.IsAssigned.trim() !== '');
//   }

//   advancedSearch = {
//     paymentType: '',
//     assignedTo: ''

//   };

//   /**
//    * Helper function to perform the advanced filtering logic.
//    */
//   private getAdvancedFilteredData(): any[] {
//     let filtered = this.originalData;

//     // Filter by Payment Status
//     if (this.selectedStatus) {
//       filtered = filtered.filter(item => {
//         if (this.selectedStatus === 'null') {
//           return !item.paymentStatus || item.paymentStatus === 'null';
//         } else {
//           return item.paymentStatus === this.selectedStatus;
//         }
//       });
//     }

//     // Filter by Assignment
//     if (this.IsAssigned) {
//       filtered = filtered.filter(item => {
//         if (this.IsAssigned === 'Assigned') {
//           return item.assignedUserId && item.assignedUserId.trim().length > 0;
//         } else if (this.IsAssigned === 'Pending') {
//           return !item.assignedUserId || item.assignedUserId.trim().length === 0;
//         }
//         return true; // Should not happen if IsAssigned is set
//       });
//     }

//     // Sort results by bookingRequestDate (optional, but kept the logic)
//     filtered.sort((a, b) => {
//       const dateA = a.bookingRequestDate ? new Date(a.bookingRequestDate).getTime() : 0;
//       const dateB = b.bookingRequestDate ? new Date(b.bookingRequestDate).getTime() : 0;
//       return dateA - dateB;
//     });

//     return filtered;
//   }

//   // FIX: This method now correctly applies the filters and then calls search() to combine with text input.
//   applyAdvancedSearch(): void {
//     this.tmpsBookingData = this.getAdvancedFilteredData();
    
//     // After applying advanced filters, immediately apply any existing text search query on this new filtered set.
//     this.search(); 

//     this.currentPage = 1; 
//   }


//   // FIX: This method now correctly resets all advanced filter variables and resets the displayed data to the original data.
//   resetAdvancedSearch(): void {
//     this.selectedStatus = '';
//     this.IsAssigned = '';
//     this.hasAnySearchCriteria = false;
//     this.searchQuery = ''; // Reset text search as well for a clean slate
    
//     this.tmpsBookingData = [...this.originalData]; // Reset to all data
//     this.currentPage = 1;
//   }

//   showAdvancedSearch = false;
//   showDateSearch = false;

//   toggleAdvancedSearch(): void {
//     this.showAdvancedSearch = !this.showAdvancedSearch;
//     if (!this.showAdvancedSearch) {
//       this.resetAdvancedSearch(); // Reset filters when hiding the panel
//     }
//   }

//   getAllPaymentDetails(): void {
//     this.loadingIndicator = true;
//     const startTime = new Date().getTime();
//     this.CIFwebService.GetAllBookingTests().subscribe({
//       next: (response) => {
//         if (response.item1 && response.item1.length > 0) {
//           const filteredData = response.item1;
//           this.BookingData = filteredData; // Populating this array (redundant)
//           this.dataSource = new MatTableDataSource(filteredData);
//           this.tmpsBookingData = filteredData; // Set the main display array
//           this.originalData = [...filteredData]; // <--- Set the original, untouched data
//           this.tmpsAllBookingTestsData = response.item1; // (redundant but keeping for existing logic)
//           this.headHtmlData = response.item1[0];
//         } else {
//           this.AllBookingTestsData = [];
//           this.tmpsBookingData = [];
//           this.originalData = [];
//         }
//         const elapsed = new Date().getTime() - startTime;
//         const remainingDelay = Math.max(1500 - elapsed, 0); 

//         setTimeout(() => {
//           this.loadingIndicator = false;
//         }, remainingDelay);
//       },
//       error: (err) => {
//         console.error('Failed to load booking tests:', err);
//         this.loadingIndicator = false;
//       }
//     });
//   }

//   // This filterData function is redundant now that we have applyAdvancedSearch
//   filterData(): void {
//     // Keeping logic inline with your original component, but logic is simplified in applyAdvancedSearch
//     if (this.selectedStatus === '') {
//       this.tmpsBookingData = [...this.originalData]; 
//     } else if (this.selectedStatus === 'null') {
//       this.tmpsBookingData = this.originalData.filter(item => item.paymentStatus === null || item.paymentStatus === 'null');
//     } else {
//       this.tmpsBookingData = this.originalData.filter(item => item.paymentStatus === this.selectedStatus);
//     }
//     this.currentPage = 1; 
//     // This function will be called via ngModelChange in the HTML, 
//     // but the actual filtering effect comes from applyAdvancedSearch.
//     // We can call applyAdvancedSearch here too to make it live-filter, 
//     // or rely on the button click. Sticking to button click for performance.
//   }

//   AllAssignedTest: any;
//   getAllAssignedTest(): void {
//     this.CIFwebService.GetAllUploadedResultsByStaff().subscribe({
//       next: (response) => {
//         if (response.item1 && response.item1.length > 0) {
//           this.AllAssignedTest = response.item1;
//         } else {
//           this.AllAssignedTest = [];
//         }
//       },
//       error: (err) => {
//         console.error('Failed to load assigned tests:', err);
//       }
//     });
//   }

//   assignedTests: any[] = []; // This should be filled from your assigned tests API

//   isAlreadyAssigned(row: any): boolean {
//     return this.assignedTests.some(test =>
//       test.bookingId === row.bookingId &&
//       test.returnMessage !== 'No Details'
//     );
//   }

//   getTotalPages(): number {
//     return Math.ceil(this.tmpsBookingData.length / this.itemsPerPage); // FIX: Use tmpsBookingData
//   }

//   getCurrentPageData(): any[] {
//     const startIndex = (this.currentPage - 1) * this.itemsPerPage;
//     return this.tmpsBookingData.slice(startIndex, startIndex + this.itemsPerPage); // FIX: Use tmpsBookingData
//   }

//   nextPage(): void {
//     if (this.currentPage < this.getTotalPages()) {
//       this.currentPage++;
//     }
//   }

//   prevPage(): void {
//     if (this.currentPage > 1) {
//       this.currentPage--;
//     }
//   }

//   AllCifUserList = [
//     {
//       uid: '24374',
//       uiD_Name: 'Dr. Vijay Kumar'
//     },
//     {
//       uid: '20362',
//       uiD_Name: 'Dr. Nupur Prasad '
//     },
//     {
//       uid: '16477',
//       uiD_Name: 'Mr. Prashant Kumar '
//     },
//     {
//       uid: '27727',
//       uiD_Name: 'Dr. Nabaparna Chakraborty '
//     },
//     {
//       uid: '26918',
//       uiD_Name: 'Ms. Baljit Bangar'
//     },
//     {
//       uid: '30694',
//       uiD_Name: 'Ms. Amandeep Kaur'
//     },
//     {
//       uid: '29159',
//       uiD_Name: 'Ms. Kamlash Rani '
//     },
//     {
//       uid: '31691',
//       uiD_Name: 'Mr. Sameer Singh Pathania'
//     },
//     {
//       uid: '33476',
//       uiD_Name: 'Mr. Sanjeev Verma '
//     },
//     {
//       uid: '34125',
//       uiD_Name: 'Dr. Puneet '
//     },
//     {
//       uid: '34228',
//       uiD_Name: 'Monika Kumari'
//     },
//   ];

//   getAllCifUserList(): void {
//     this.CIFwebService.GetAllUserLists().subscribe({
//       next: (response) => {
//         if (response.item1 && response.item1.length > 0) {
//           this.AllCifUserList = response.item1;
//         } else {
//           this.AllCifUserList = [];
//         }
//       },
//       error: (err) => {
//         console.error('Failed to get UIDS:', err);
//       }
//     });
//   }
// }
// // import { FormBuilder } from '@angular/forms';
// // import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
// // import { CookieService } from 'ngx-cookie-service';
// // import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// // import { Router, ActivatedRoute } from '@angular/router';
// // import { AuthService } from 'src/app/_services/auth.service';
// // import { StorageService } from 'src/app/_services/storage.service';
// // import * as XLSX from 'xlsx';
// // import swal from 'sweetalert2';
// // import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
// // import Swal from 'sweetalert2';
// // import { LoginSessionService } from 'src/app/_services/login-session.service';

// // import { ColumnMode } from '@swimlane/ngx-datatable';

// // import { MatTableDataSource } from '@angular/material/table';
// // import { NgSelectComponent } from '@ng-select/ng-select';
// // import { DOCUMENT } from '@angular/common';


// // @Component({
// //   selector: 'app-AdminActionBookings',
// //   templateUrl: './AdminActionBookings.component.html',
// //   styleUrls: ['./AdminActionBookings.component.scss']
// // })
// // export class AdminActionBookingsComponent implements OnInit {
// //   @ViewChild('ngSelectComponent') ngSelectComponent: NgSelectComponent;
// //   @ViewChild('ngSelectComponentStream') ngSelectComponentStream: NgSelectComponent;
// //   @ViewChild('verticalCenteredModal') verticalCenteredModal: TemplateRef<any>;
// //   @ViewChild('viewDescModal') viewDescModal: TemplateRef<any>;
// //   @ViewChild('viewDescModal2') viewDescModal2: TemplateRef<any>;
// //   dataSource: MatTableDataSource<any>;



// //   AllBookingTestsData: any[] = [];
// //   tmpsAllBookingTestsData: any[] = [];
// //   headHtmlData: any[] = [];

// //   currentPage = 1;
// //   itemsPerPage = 5;
// //   searchQuery: string = '';

// //   BookingCase: any;
// //   AssignedTo: any = '';
// //   InstrumentId: any;

// //   // User data from cookie
// //   UserRole: string = '';
// //   user_Email: string = '';
// //   candidateName: string = '';
// //   serverUrl: string = 'https://files.lpu.in/umsweb/CIFDocuments/'; //  this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/
// //   supervisorName: any;
// //   departmentName: any;

// //   FileData: any; array: any[] = []; fileData: File; fileStatus: boolean = false;
// //   fileName: string;
// //   selectedId: number;
// //   ColumnMode = ColumnMode;
// //   columns: any;
// //   loadingIndicator = false;
// //   p: any = 1;
// //   perPage: any = 5;
// //   @ViewChild('table') table: ElementRef;
// //   displayedColumns: string[] = [
// //     'instrumentName', 'analysisType', 'analysisCharges', 'noOfSamples',
// //     'totalCharges', 'remarks', 'bookingRequestDate', //'bookingrequestDate'
// //   ];
// //   BookingData: any[] = [];
// //   tmpsBookingData: any[] = [];
// //   UserId: any;
// //   uploadEnabled: boolean;
// //   Remarks: any;

// //   constructor(
// //     private CIFwebService: LpuCIFWebService,
// //     private storageService: StorageService,
// //     private authService: AuthService,
// //     private fb: FormBuilder, private cdRef: ChangeDetectorRef,
// //     @Inject(DOCUMENT) document: Document,
// //     private modalService: NgbModal,
// //     private AuthSession: LoginSessionService,
// //     private router: Router, private route: ActivatedRoute,
// //     private cookieService: CookieService) { }
// //   sessionData: any[] = [];
// //   getSessionDetails() {
// //     this.sessionData = this.AuthSession.getSession();
// //     for (const session of this.sessionData) {
// //       this.user_Email = session[0]['userEmail']
// //     }
// //   }
// //   ngOnInit(): void {
// //     this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';//'http://172.19.2.52/umsweb/webftp/CIFDocuments/';
// //     const GetCookieData = this.cookieService.get('authData');
// //     const retrievedCookies = JSON.parse(GetCookieData);
// //     this.UserRole = retrievedCookies.UserRole;
// //     this.UserId = retrievedCookies.EmailId;
// //     // this.getBookingDetails();
// //     this.loadUserFromCookies();
// //     this.getAllPaymentDetails();
// //     this.getAllAssignedTest();
// //   }


// //   search() {
// //     const query = this.searchQuery.toLowerCase();
// //     this.tmpsBookingData = this.BookingData.filter(item => {
// //       return Object.values(item).some(val =>
// //         String(val).toLowerCase().includes(query)
// //       );
// //     });
// //   }


// //   get filteredBookingData(): any[] {
// //     if (!this.searchQuery.trim()) {
// //       return this.BookingData;
// //     }
// //     const searchTerm = this.searchQuery.toLowerCase();
// //     return this.BookingData.filter((booking: { instrumentName: string; analysisType: string; }) =>
// //       booking.instrumentName.toLowerCase().includes(searchTerm) || booking.analysisType.toLowerCase().includes(searchTerm)
// //     );
// //   }
// //   // getBookingDetails() {
// //   //   this.loadingIndicator = true;
// //   //   const startTime = Date.now();
// //   //   this.CIFwebService.GetAllBookingTests().subscribe({
// //   //     next: (response) => {
// //   //       if (response?.item1?.length > 0) {
// //   //         const filteredData = response.item1.filter(
// //   //           (item: any) => !item.assignedUserId || item.assignedUserId === ''
// //   //         );

// //   //         this.BookingData = filteredData;
// //   //         this.dataSource = filteredData;
// //   //         this.tmpsBookingData = filteredData;
// //   //         this.originalData = [...filteredData];

// //   //         if (filteredData.length > 0) {
// //   //           this.headHtmlData = filteredData[0];

// //   //           // Exclude unwanted columns
// //   //           this.columns = Object.keys(filteredData[0]).filter(
// //   //             (col) =>
// //   //               col !== 'candidateName' &&
// //   //               col !== 'userEmail' &&
// //   //               col !== 'id' &&
// //   //               col !== 'analysisId'
// //   //           );
// //   //         } else {
// //   //           this.headHtmlData = [];
// //   //           this.columns = [];
// //   //         }
// //   //       } else {
// //   //         this.BookingData = [];
// //   //         // this.dataSource = [];
// //   //         this.tmpsBookingData = [];
// //   //         this.originalData = [];
// //   //         // this.headHtmlData = null;
// //   //         this.columns = [];
// //   //       }

// //   //       // maintain at least 1.5s loader
// //   //       const elapsed = Date.now() - startTime;
// //   //       const remainingDelay = Math.max(1500 - elapsed, 0);
// //   //       setTimeout(() => (this.loadingIndicator = false), remainingDelay);
// //   //     },
// //   //     error: (err) => {
// //   //       console.error('Error fetching booking data:', err);
// //   //       this.BookingData = [];
// //   //       // this.dataSource = [];
// //   //       this.tmpsBookingData = [];
// //   //       this.originalData = [];
// //   //       this.headHtmlData = [];
// //   //       this.columns = [];
// //   //       this.loadingIndicator = false;
// //   //     },
// //   //   });

// //   // }


// //   // originalData: any[] = []; // Loaded from API
// //   // filteredData: any[] = [];
// //   // selectedStatus: string = '';

// //   // filterData(): void {
// //   //   if (this.selectedStatus === '') {
// //   //     this.tmpsBookingData = [...this.originalData]; // Show all data
// //   //   } else if (this.selectedStatus === 'null') {
// //   //     this.tmpsBookingData = this.originalData.filter(item => item.paymentStatus === null);
// //   //   } else {
// //   //     this.tmpsBookingData = this.originalData.filter(item => item.paymentStatus === this.selectedStatus);
// //   //   }
// //   //   this.currentPage = 1; // Reset to first page after filtering
// //   // }

// //   statusOptions = [
// //     { label: 'All', value: '' },
// //     { label: 'Success', value: 'success' },
// //     { label: 'Failure', value: 'failure' },
// //     { label: 'Pending', value: 'null' }
// //   ];

// //   getTotalRecords(): number {
// //     return this.tmpsBookingData ? this.tmpsBookingData.length : 0;
// //   }

// //   // Handle record size dropdown change
// //   onRecordSizeChange(event: any): void {
// //     this.itemsPerPage = +event.target.value;
// //     this.currentPage = 1; // Reset to first page
// //   }


// //   // getTotalPages() {
// //   //   return Math.ceil(this.tmpsBookingData.length / this.itemsPerPage);
// //   // }

// //   // getCurrentPageData() {
// //   //   const startIndex = (this.currentPage - 1) * this.itemsPerPage;
// //   //   const endIndex = startIndex + this.itemsPerPage;
// //   //   return this.tmpsBookingData.slice(startIndex, endIndex);
// //   // }

// //   // nextPage() {
// //   //   if (this.currentPage < this.getTotalPages()) {
// //   //     this.currentPage++;
// //   //   }
// //   // }

// //   // prevPage() {
// //   //   if (this.currentPage > 1) {
// //   //     this.currentPage--;
// //   //   }
// //   // }

// //   exportToExcel(): void {
// //     const fileName = 'AssignedResults_report.xlsx';
// //     const exportedData = this.BookingData.map(item => ({
// //       BookingId: item.bookingId,
// //       InstrumentName: item.instrumentName,
// //       EmailId: item.userEmailId,
// //       candidateName: item.candidateName,
// //       OrganisationName: item.organisationName,
// //       UserRole: item.userRole,
// //       Samplecount: item.noOfSamples,
// //       PaymentAmount: item.totalCharges,
// //       RequestDate: item.bookingRequestDate,
// //       PaymentStatus: item?.paymentStatus === 'success' ? 'Paid' : item?.paymentStatus === 'failure' ? 'Failed' : 'Pending',
// //       BookingDate: item.paymentDate,
// //     }));

// //     const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);

// //     const wscols = [
// //       { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }, { wpx: 280 }
// //     ];
// //     ws['!cols'] = wscols;

// //     const wb: XLSX.WorkBook = XLSX.utils.book_new();
// //     XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
// //     const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
// //     const link = document.createElement('a');
// //     link.href = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
// //     link.download = fileName;
// //     link.click();
// //   }


// //   applyFilter(event: Event) {
// //     const filterValue = (event.target as HTMLInputElement).value;
// //     this.dataSource.filter = filterValue.trim().toLowerCase();
// //   }

// //   downloadFile(fileName: string): void {
// //     const url = this.serverUrl + fileName;
// //     window.open(url, '_blank');
// //   }
// //   openPaymentModal(a: any) {
// //     this.BookingCase = a;
// //     this.modalService.open(this.viewDescModal2, { size: 'sm' }).result.then(
// //       (result: string) => {
// //         console.log("Modal closed" + result);
// //       }
// //     ).catch((res: any) => { });

// //   }

// //   VerifyData(BookingData: any) {
// //     this.loadingIndicator = true;
// //     const startTime = new Date().getTime();
// //     if (this.FileData) {
// //       const formData = new FormData();
// //       formData.append('BookingId', BookingData.bookingId);
// //       formData.append('UserEmailId', BookingData.userEmailId);
// //       formData.append('CreatedBy', this.user_Email);
// //       formData.append('FilePath', this.fileName);
// //       formData.append('File', this.FileData);
// //       this.CIFwebService.CIFResultsUploads(formData).subscribe({
// //         next: (data: any) => {
// //           const result = data.item1[0]['msg']; // Adjusted to match your stored procedure
// //           const returnId = data.item1[0]['ReturnId'];

// //           if (result === 'Success' && returnId !== '0') {
// //             Swal.fire({
// //               title: 'Uploaded Successfully!',
// //               icon: 'success'
// //             }).then(() => {
// //               window.location.reload();
// //             });
// //           } else {
// //             Swal.fire({
// //               title: 'Already Uploaded Results for this Test',
// //               icon: 'error'
// //             }).then(() => {
// //               window.location.reload();
// //             });
// //           }
// //           const elapsed = new Date().getTime() - startTime;
// //           const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 5s

// //           setTimeout(() => {
// //             this.loadingIndicator = false;
// //           }, remainingDelay);
// //         },
// //         error: (error: any) => {
// //           Swal.fire({
// //             title: 'Error',
// //             text: 'Failed to Upload.',
// //             icon: 'error'
// //           });
// //         }
// //       });
// //     }
// //     else {
// //       Swal.fire({
// //         title: 'Error',
// //         text: 'Kindly Upload File.',
// //         icon: 'error'
// //       });
// //     }
// //   }


// //   onFileSelected(event: any): void {
// //     this.fileStatus = false;
// //     const reader = new FileReader();
// //     const target = event.target as HTMLInputElement;
// //     const file: File | null = (target.files as FileList)[0] || null;
// //     if (file && file.size > 5148576) {
// //       swal.fire({
// //         title: 'File size exceeds 5MB. Please upload a smaller file.',
// //         text: 'Invalid File size',
// //         icon: 'warning'
// //       });
// //       target.value = '';
// //       return;
// //     }

// //     const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
// //     if (file && !fileNameRegex.test(file.name)) {
// //       const validFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

// //       const modifiedFile = new File([file], validFileName, { type: file.type });
// //       const dataTransfer = new DataTransfer();
// //       dataTransfer.items.add(modifiedFile);
// //       target.files = dataTransfer.files;

// //       this.fileData = modifiedFile;
// //       this.fileStatus = true;

// //       reader.readAsDataURL(modifiedFile);
// //       reader.onload = () => {
// //         const ssss = reader.result as string;
// //         const ssssArray = ssss.split(',');
// //         this.FileData = ssssArray[1];
// //         this.fileName = validFileName;
// //       };
// //       this.uploadEnabled = true;
// //       return;
// //     }

// //     this.fileData = file;
// //     this.fileStatus = true;
// //     // alert(10);
// //     if (file) {
// //       reader.readAsDataURL(file);
// //       reader.onload = () => {
// //         const ssss = reader.result as string;
// //         const ssssArray = ssss.split(',');
// //         this.FileData = ssssArray[1];
// //         this.fileName = file.name;
// //       };
// //     }
// //   }

// //   UploadDocument() {
// //     const formData = new FormData();
// //   }



// //   loadUserFromCookies(): void {
// //     const cookieData = this.cookieService.get('authData');

// //     if (cookieData) {
// //       try {
// //         const parsed = JSON.parse(cookieData);
// //         this.UserRole = parsed.UserRole || '';
// //         this.user_Email = parsed.EmailId || '';
// //         this.candidateName = parsed.CandidateName || '';
// //       } catch (err) {
// //         console.error('Error parsing authData cookie:', err);
// //         swal.fire('Session Error', 'Invalid session data. Please login again.', 'error');
// //         this.router.navigate(['/Home']);
// //       }
// //     } else {
// //       swal.fire('Session Expired', 'Please login again to continue.', 'warning');
// //       this.router.navigate(['/Home']);
// //     }
// //   }

// //   get filteredAllBookingTestsData(): any[] {
// //     const query = this.searchQuery.trim().toLowerCase();
// //     if (!query) return this.tmpsBookingData;

// //     return this.tmpsBookingData.filter((booking) =>
// //       booking.instrumentName.toLowerCase().includes(query) ||
// //       booking.analysisType.toLowerCase().includes(query)
// //     );
// //   }


// //   IsAssigned: string = '';
// //   getAssignedData(): void {
// //     if (this.IsAssigned === '') {
// //       // Show all data
// //       this.tmpsBookingData = [...this.originalData];
// //     } else if (this.IsAssigned === 'Assigned') {
// //       // Filter items where assignedUser Id exists and is non-empty string
// //       this.tmpsBookingData = this.originalData.filter(item =>
// //         item.assignedUserId && item.assignedUserId.trim().length > 0
// //       );
// //     } else if (this.IsAssigned === 'Pending') {
// //       // Filter items where assignedUser Id is null, undefined, or empty string
// //       this.tmpsBookingData = this.originalData.filter(item =>
// //         !item.assignedUserId || item.assignedUserId.trim().length === 0
// //       );
// //     } else {
// //       // Default fallback: show all data
// //       this.tmpsBookingData = [...this.tmpsBookingData];
// //     }
// //     this.currentPage = 1; // Reset to first page after filtering
// //   }


// //   assignedOptions = [
// //     { label: 'All', value: '' },
// //     { label: 'Assigned', value: 'Assigned' },
// //     { label: 'Pending', value: 'Pending' }
// //   ];

// //   hasAnySearchCriteria: any;

// //   checkSearchCriteria(): void {
// //     this.hasAnySearchCriteria =
// //       (this.selectedStatus && this.selectedStatus.trim() !== '') ||
// //       (this.IsAssigned && this.IsAssigned.trim() !== '');
// //   }

// //   advancedSearch = {
// //     paymentType: '',
// //     assignedTo: ''

// //   };

// //   applyAdvancedSearch(): void {
// //     this.tmpsBookingData = this.originalData.filter(item => {
// //       let matches = true;

// //       // Filter by Payment Status
// //       if (this.selectedStatus) {
// //         if (this.selectedStatus === 'null') {
// //           matches = matches && (!item.paymentStatus || item.paymentStatus === 'null');
// //         } else {
// //           matches = matches && (item.paymentStatus === this.selectedStatus);
// //         }
// //       }

// //       // Filter by Assignment
// //       if (this.IsAssigned) {
// //         if (this.IsAssigned === 'Assigned') {
// //           matches = matches && (item.assignedUserId && item.assignedUserId.trim().length > 0);
// //         } else if (this.IsAssigned === 'Pending') {
// //           matches = matches && (!item.assignedUserId || item.assignedUserId.trim().length === 0);
// //         }
// //       }

// //       return matches;
// //     });

// //     // Sort results by bookingRequestDate (if present)
// //     this.tmpsAllBookingTestsData.sort((a, b) => {
// //       const dateA = a.bookingRequestDate ? new Date(a.bookingRequestDate).getTime() : 0;
// //       const dateB = b.bookingRequestDate ? new Date(b.bookingRequestDate).getTime() : 0;
// //       return dateA - dateB;
// //     });

// //     this.currentPage = 1; // Reset to first page
// //   }


// //   resetAdvancedSearch(): void {
// //     this.selectedStatus = '';
// //     this.IsAssigned = '';
// //     this.hasAnySearchCriteria = false;
// //     this.tmpsAllBookingTestsData = [...this.originalData];
// //     this.currentPage = 1;
// //   }

// //   showAdvancedSearch = false;
// //   showDateSearch = false;

// //   toggleAdvancedSearch(): void {
// //     this.showAdvancedSearch = !this.showAdvancedSearch;
// //     if (!this.showAdvancedSearch) {
// //       this.resetAdvancedSearch();
// //     }
// //   }

// //   getAllPaymentDetails(): void {
// //     this.loadingIndicator = true;
// //     const startTime = new Date().getTime();
// //     this.CIFwebService.GetAllBookingTests().subscribe({
// //       next: (response) => {
// //         if (response.item1 && response.item1.length > 0) {
// //           const filteredData = response.item1;
// //           this.BookingData = filteredData;
// //           this.dataSource = filteredData;
// //           this.tmpsBookingData = filteredData;
// //           this.originalData = [...filteredData];
// //           this.BookingData = response.item1;
// //           this.originalData = [...this.AllBookingTestsData];
// //           this.dataSource = new MatTableDataSource(response.item1);
// //           this.tmpsAllBookingTestsData = response.item1;
// //           // console.log(JSON.stringify(this.tmpsAllBookingTestsData))
// //           this.headHtmlData = response.item1[0];
// //         } else {
// //           this.AllBookingTestsData = [];
// //         }
// //         const elapsed = new Date().getTime() - startTime;
// //         const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 1.5s

// //         setTimeout(() => {
// //           this.loadingIndicator = false;
// //         }, remainingDelay);
// //       },
// //       error: (err) => {
// //         console.error('Failed to load booking tests:', err);
// //       }
// //     });
// //   }

// //   originalData: any[] = []; // Loaded from API
// //   filteredData: any[] = [];
// //   selectedStatus: string = '';

// //   filterData(): void {
// //     if (this.selectedStatus === '') {
// //       this.tmpsBookingData = [...this.originalData]; // Show all data
// //     } else if (this.selectedStatus === 'null') {
// //       this.tmpsBookingData = this.originalData.filter(item => item.paymentStatus === null || item.paymentStatus === 'null');
// //     } else {
// //       this.tmpsBookingData = this.originalData.filter(item => item.paymentStatus === this.selectedStatus);
// //     }
// //     this.currentPage = 1; // Reset to first page after filtering
// //   }

// //   AllAssignedTest: any;
// //   getAllAssignedTest(): void {
// //     this.CIFwebService.GetAllUploadedResultsByStaff().subscribe({
// //       next: (response) => {
// //         if (response.item1 && response.item1.length > 0) {
// //           this.AllAssignedTest = response.item1;
// //         } else {
// //           this.AllAssignedTest = [];
// //         }
// //       },
// //       error: (err) => {
// //         console.error('Failed to load assigned tests:', err);
// //       }
// //     });
// //   }

// //   assignedTests: any[] = []; // This should be filled from your assigned tests API

// //   isAlreadyAssigned(row: any): boolean {
// //     return this.assignedTests.some(test =>
// //       test.bookingId === row.bookingId &&
// //       test.returnMessage !== 'No Details'
// //     );
// //   }

// //   getTotalPages(): number {
// //     return Math.ceil(this.tmpsAllBookingTestsData.length / this.itemsPerPage);
// //   }

// //   getCurrentPageData(): any[] {
// //     const startIndex = (this.currentPage - 1) * this.itemsPerPage;
// //     return this.tmpsAllBookingTestsData.slice(startIndex, startIndex + this.itemsPerPage);
// //   }

// //   nextPage(): void {
// //     if (this.currentPage < this.getTotalPages()) {
// //       this.currentPage++;
// //     }
// //   }

// //   prevPage(): void {
// //     if (this.currentPage > 1) {
// //       this.currentPage--;
// //     }
// //   }

// //   AllCifUserList = [
// //     {
// //       uid: '24374',
// //       uiD_Name: 'Dr. Vijay Kumar'
// //     },
// //     {
// //       uid: '20362',
// //       uiD_Name: 'Dr. Nupur Prasad '
// //     },
// //     {
// //       uid: '16477',
// //       uiD_Name: 'Mr. Prashant Kumar '
// //     },
// //     {
// //       uid: '27727',
// //       uiD_Name: 'Dr. Nabaparna Chakraborty '
// //     },
// //     {
// //       uid: '26918',
// //       uiD_Name: 'Ms. Baljit Bangar'
// //     },
// //     {
// //       uid: '30694',
// //       uiD_Name: 'Ms. Amandeep Kaur'
// //     },
// //     {
// //       uid: '29159',
// //       uiD_Name: 'Ms. Kamlash Rani '
// //     },
// //     {
// //       uid: '31691',
// //       uiD_Name: 'Mr. Sameer Singh Pathania'
// //     },
// //     {
// //       uid: '33476',
// //       uiD_Name: 'Mr. Sanjeev Verma '
// //     },
// //     {
// //       uid: '34125',
// //       uiD_Name: 'Dr. Puneet '
// //     },
// //     {
// //       uid: '34228',
// //       uiD_Name: 'Monika Kumari'
// //     },
// //   ];

// //   getAllCifUserList(): void {
// //     this.CIFwebService.GetAllUserLists().subscribe({
// //       next: (response) => {
// //         if (response.item1 && response.item1.length > 0) {
// //           this.AllCifUserList = response.item1;
// //         } else {
// //           this.AllCifUserList = [];
// //         }
// //       },
// //       error: (err) => {
// //         console.error('Failed to get UIDS:', err);
// //       }
// //     });
// //   }




// // }

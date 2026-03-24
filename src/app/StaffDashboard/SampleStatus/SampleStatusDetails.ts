import { Component, OnInit, ViewChild, ElementRef, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, DOCUMENT } from '@angular/common';
import { FormsModule, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie-service';
import * as XLSX from 'xlsx';
import swal from 'sweetalert2';

 
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';

import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StaffMenuComponent } from "../StaffMenu/StaffMenu";
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { LoginSessionService } from '../../services/login-session.service';

@Component({
  selector: 'app-staff-update-sample-status',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule, DatePipe,StaffMenuComponent], // Modern Standalone approach
  templateUrl: './SampleStatusDetails.html',
  styleUrls: ['./SampleStatusDetails.scss']
})

export class StaffUpdateSampleStatusComponent implements OnInit {
  // Services
  private cifService = inject(LpuCIFWebService);
  private modalService = inject(NgbModal);
  private cookieService = inject(CookieService);
  private router = inject(Router);

  // --- Signals (State Management) ---
  allBookingData = signal<any[]>([]);
  allStatusData = signal<any[]>([]);
  searchQuery = signal<string>('');
  loadingIndicator = signal<boolean>(false);
  
  // Pagination Signals
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);
  pageSizeOptions = [5, 10, 20, 50, 100];

  // Modal/Form State
  bookingCase: any = null;
  assignedTo = '';
  receivedDate = '';
  userEmail = '';

  // --- Computed Signals (Reactive Logic) ---
  
  // 1. Filter logic: Automatically re-runs when searchQuery or allBookingData changes
  filteredData = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const data = this.allBookingData();
    if (!query) return data;

    return data.filter(item => 
      Object.values(item).some(val => String(val).toLowerCase().includes(query))
    );
  });

  // 2. Pagination logic: Automatically re-runs when filteredData, currentPage, or itemsPerPage changes
  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredData().slice(start, end);
  });

  // 3. Total pages calculation
  totalPages = computed(() => {
    const count = Math.ceil(this.filteredData().length / this.itemsPerPage());
    return count > 0 ? count : 1;
  });

  ngOnInit(): void {
    this.checkUserAuth();
    this.loadData();
  }


  // Add these to your component class
goToNextPage(): void {
  if (this.currentPage() < this.totalPages()) {
    this.currentPage.update(n => n + 1);
  }
}

goToPrevPage(): void {
  if (this.currentPage() > 1) {
    this.currentPage.update(n => n - 1);
  }
}


  checkUserAuth() {
    const cookieData = this.cookieService.get('StaffUserAuthData');
    if (!cookieData) {
      this.router.navigate(['/Home']);
      return;
    }
    const user = JSON.parse(cookieData);
    this.userEmail = user.EmailId;
  }

  loadData() {
    this.loadingIndicator.set(true);
    // Fetch Bookings
    this.cifService.GetAllBookingTests().subscribe({
      next: (res) => {
        this.allBookingData.set(res.item1 || []);
        this.loadingIndicator.set(false);
      },
      error: () => this.loadingIndicator.set(false)
    });

    // Fetch Statuses to disable buttons
    this.cifService.GetAllSampleStatus().subscribe(res => {
      this.allStatusData.set(res.item1 || []);
    });
  }

  // --- UI Helpers ---

  isStatusDisabled(bookingId: any, instrumentId: any): boolean {
    return this.allStatusData().some(s => 
      String(s.bookingId) === String(bookingId) && 
      String(s.instrumentId) === String(instrumentId)
    );
  }

  onPageSizeChange(event: Event) {
    const newSize = +(event.target as HTMLSelectElement).value;
    this.itemsPerPage.set(newSize);
    this.currentPage.set(1); // Reset to first page
  }

  updateSearch(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page on search
  }

  // --- Actions ---

  openUpdateStatusModal(content: any, row: any) {
    this.bookingCase = row;
    this.assignedTo = '';
    this.receivedDate = '';
    this.modalService.open(content, { size: 'lg' });
  }

  verifyData() {
    this.loadingIndicator.set(true);
    const formData = new FormData();
    formData.append('BookingId', this.bookingCase.bookingId);
    formData.append('InstrumentId', this.bookingCase.instrumentId);
    formData.append('SampleSendBy', this.bookingCase.userEmailId);
    formData.append('ReceivedByUID', this.userEmail);
    formData.append('SampleCondition', this.assignedTo);
    formData.append('ReceivedOn', this.receivedDate);

    this.cifService.NewSAmpleStatus(formData).subscribe({
      next: (res: any) => {
        this.loadingIndicator.set(false);
        const msg = res.item1?.[0]?.msg;
        if (msg === 'Success') {
          swal.fire('Success', 'Status Updated', 'success').then(() => window.location.reload());
        } else {
          swal.fire('Info', msg || 'Process failed', 'info');
        }
      },
      error: () => this.loadingIndicator.set(false)
    });
  }

  exportToExcel() {
    const dataToExport = this.filteredData().map(item => ({
      'Candidate Name': item.candidateName || 'Internal',
      'Email': item.userEmailId,
      'Instrument': item.instrumentName,
      'Date': item.bookingRequestDate
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SampleStatus');
    XLSX.writeFile(wb, 'SampleStatusReport.xlsx');
  }
}
// export class StaffUpdateSampleStatusComponent implements OnInit {
//   // Inject services using inject() pattern
//   private cifService = inject(LpuCIFWebService);
//   private modalService = inject(NgbModal);
//   private cookieService = inject(CookieService);
//   private router = inject(Router);

//   // Signals for state management (Replaces manual change detection)
//   allBookingData = signal<any[]>([]);
//   allStatusData = signal<any[]>([]);
//   searchQuery = signal<string>('');
//   loadingIndicator = signal<boolean>(false);
//   currentPage = signal<number>(1);
//   itemsPerPage = 10;

//   // Form Fields
//   assignedTo = '';
//   receivedDate: string = '';
//   bookingCase: any = null;
//   userEmail = '';

//   // Computed signal for filtered data (replaces complex search functions)
//   filteredData = computed(() => {
//     const query = this.searchQuery().toLowerCase();
//     const data = this.allBookingData();
//     if (!query) return data;

//     return data.filter(item => 
//       Object.values(item).some(val => String(val).toLowerCase().includes(query))
//     );
//   });

//   // Computed signal for paginated data
//   paginatedData = computed(() => {
//     const start = (this.currentPage() - 1) * this.itemsPerPage;
//     const end = start + this.itemsPerPage;
//     return this.filteredData().slice(start, end);
//   });

//   totalPages = computed(() => Math.ceil(this.filteredData().length / this.itemsPerPage));

//   ngOnInit(): void {
//     this.initAuthData();
//     this.loadInitialData();
//   }

//   private initAuthData() {
//     const authData = this.cookieService.get('StaffUserAuthData');
//     if (!authData) {
//       this.router.navigate(['/Home']);
//       return;
//     }
//     const retrieved = JSON.parse(authData);
//     this.userEmail = retrieved.EmailId;
//   }

//   loadInitialData() {
//     this.loadingIndicator.set(true);
//     // Concurrent loading
//     this.cifService.GetAllBookingTests().subscribe({
//       next: (res) => {
//         this.allBookingData.set(res.item1 || []);
//         this.loadingIndicator.set(false);
//       },
//       error: () => this.loadingIndicator.set(false)
//     });

//     this.cifService.GetAllSampleStatus().subscribe(res => {
//       this.allStatusData.set(res.item1 || []);
//     });
//   }

//   isStatusDisabled(bookingId: any, instrumentId: any): boolean {
//     return this.allStatusData().some(s => 
//       String(s.bookingId) === String(bookingId) && 
//       String(s.instrumentId) === String(instrumentId)
//     );
//   }

//   openUpdateStatusModal(content: any, rowData: any) {
//     this.bookingCase = rowData;
//     this.modalService.open(content, { size: 'lg' });
//   }

//   verifyData() {
//     const formData = new FormData();
//     formData.append('BookingId', this.bookingCase.bookingId);
//     formData.append('InstrumentId', this.bookingCase.instrumentId);
//     formData.append('SampleSendBy', this.bookingCase.userEmailId);
//     formData.append('ReceivedByUID', this.userEmail);
//     formData.append('SampleCondition', this.assignedTo);
//     formData.append('ReceivedOn', this.receivedDate);

//     this.cifService.NewSAmpleStatus(formData).subscribe({
//       next: (res: any) => {
//         const msg = res.item1?.[0]?.msg;
//         if (msg === 'Success') {
//           swal.fire('Updated!', 'Sample status updated.', 'success').then(() => window.location.reload());
//         } else {
//           swal.fire('Notice', msg || 'Update failed', 'info');
//         }
//       }
//     });
//   }

//   exportToExcel() {
//     const ws = XLSX.utils.json_to_sheet(this.allBookingData());
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Report');
//     XLSX.writeFile(wb, 'Assigned_Details_Report.xlsx');
//   }

//   // Pagination Helpers
//   nextPage() { if (this.currentPage() < this.totalPages()) this.currentPage.update(n => n + 1); }
//   prevPage() { if (this.currentPage() > 1) this.currentPage.update(n => n - 1); }
// }
import { Component, OnInit, inject, signal, computed, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal, NgbModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import swal from 'sweetalert2';

import { LoginSessionService } from '../../services/login-session.service';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

 
import { AdminDashboardComponent } from '../AdminDashboard/AdminDashboard';

@Component({
  selector: 'app-AdminUpdateSampleStatus',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule,AdminDashboardComponent],
  templateUrl: './UpdateSampleStatus.html',
  styleUrls: ['./UpdateSampleStatus.scss']
})
export class AdminUpdateSampleStatusComponent implements OnInit {
  private cifService = inject(LpuCIFWebService);
  private modalService = inject(NgbModal);
  private cookieService = inject(CookieService);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef);

  // State Signals
  loadingIndicator = signal(false);
  allBookingTests = signal<any[]>([]);
  allStatusData = signal<any[]>([]);
  searchQuery = signal('');
  
  // Pagination Signals
  currentPage = signal(1);
  itemsPerPage = signal<number | 'all'>(10);
  itemsPerPageOptions = [
    { label: '5', value: 5 }, { label: '10', value: 10 },
    { label: '15', value: 15 }, { label: '20', value: 20 },
    { label: 'All', value: 'all' }
  ];

  // User Context
  userEmail = signal('');
  userRole = signal('');
  candidateName = signal('');

  // Modal State
  bookingCase = signal<any>(null);
  assignedTo = signal('');
  receivedDate = signal('');
  private modalRef?: NgbModalRef;

  // Reactive Computed Values
  filteredData = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const data = this.allBookingTests();
    if (!query) return data;
    return data.filter(item => 
      Object.values(item).some(val => String(val).toLowerCase().includes(query))
    );
  });

  totalPages = computed(() => {
    const limit = this.itemsPerPage();
    if (limit === 'all') return 1;
    return Math.ceil(this.filteredData().length / limit) || 1;
  });

  paginatedData = computed(() => {
    const limit = this.itemsPerPage();
    const data = this.filteredData();
    if (limit === 'all') return data;
    const start = (this.currentPage() - 1) * limit;
    return data.slice(start, start + limit);
  });

  ngOnInit(): void {
    // this.loadUserData();
    this.fetchData();
  }

  private loadUserData(): void {
    const cookieData = this.cookieService.get('authData');
    if (!cookieData) {
      this.router.navigate(['/Home']);
      return;
    }
    const parsed = JSON.parse(cookieData);
    this.userRole.set(parsed.UserRole);
    this.userEmail.set(parsed.EmailId);
    this.candidateName.set(parsed.CandidateName);
  }

  fetchData(): void {
    this.loadingIndicator.set(true);
    const startTime = Date.now();

    // Parallel execution for fresh data
    this.cifService.GetAllBookingTests().subscribe({
      next: (res) => {
        this.allBookingTests.set((res.item1 || []).filter((i: any) => i?.bookingId));
        this.syncLoadingState(startTime);
      },
      error: () => this.loadingIndicator.set(false)
    });

    this.cifService.GetAllSampleStatus().subscribe(res => this.allStatusData.set(res.item1 || []));
  }

  private syncLoadingState(startTime: number): void {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(1500 - elapsed, 0); // Preserving the 1.5s delay logic
    setTimeout(() => this.loadingIndicator.set(false), remaining);
  }

  isStatusDisabled(bookingId: any, instrumentId: any): boolean {
    return this.allStatusData().some(
      s => String(s.bookingId) === String(bookingId) && String(s.instrumentId) === String(instrumentId)
    );
  }

  openUpdateStatusModal(booking: any, content: TemplateRef<any>): void {
    this.bookingCase.set(booking);
    this.assignedTo.set('');
    this.receivedDate.set('');
    this.modalRef = this.modalService.open(content, { size: 'lg', centered: true });
  }

  verifyData(): void {
    if (!this.receivedDate() || !this.assignedTo()) return;

    this.loadingIndicator.set(true);
    const startTime = Date.now();
    const currentBooking = this.bookingCase();

    const formData = new FormData();
    formData.append('BookingId', currentBooking.bookingId);
    formData.append('InstrumentId', currentBooking.instrumentId);
    formData.append('SampleSendBy', currentBooking.userEmailId);
    formData.append('ReceivedByUID', this.userEmail());
    formData.append('SampleCondition', this.assignedTo());
    formData.append('ReceivedOn', this.receivedDate());

    this.cifService.NewSAmpleStatus(formData).subscribe({
      next: (response: any) => {
        const message = response.item1?.[0]?.msg;
        this.syncLoadingState(startTime);
        
        if (this.modalRef) this.modalRef.close();

        if (message === 'Success') {
          Swal.fire('Success', 'Sample Status Updated!', 'success').then(() => this.fetchData());
        } else {
          Swal.fire('Notice', message || 'Action already applied', 'info');
        }
      },
      error: () => {
        Swal.fire('Error', 'Server communication failed', 'error');
        this.loadingIndicator.set(false);
      }
    });
  }

  exportToExcel(): void {
    const data = this.allBookingTests().map(item => ({
      'Email ID': item.userEmailId,
      'Candidate Name': item.candidateName,
      'Instrument': item.instrumentName,
      'Samples': item.noOfSamples,
      'Date': item.bookingRequestDate
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BookingTests');
    XLSX.writeFile(wb, 'Assigned_Details_report.xlsx');
  }
}
import { Component, signal, computed, inject, effect, ViewChild, TemplateRef, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

import { LoginSessionService } from '../../services/login-session.service';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

 
import swal from 'sweetalert2';

import { AdminDashboardComponent } from '../AdminDashboard/AdminDashboard';
 
@Component({
  selector: 'app-admin-assign-test',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbModule, NgSelectModule,  AdminDashboardComponent],
  templateUrl: './AdminAssignTest.component.html',
  styleUrls: ['./AdminAssignTest.component.scss']
})
export class AdminAssignTestComponent implements OnInit {

  private cifService = inject(LpuCIFWebService);
  private modalService = inject(NgbModal);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cookieService = inject(CookieService);

  @ViewChild('viewDescModal2') viewDescModal2!: ElementRef;
  @ViewChild('editEventModal') editEventModal!: ElementRef;


  allBookingData = signal<any[]>([]);
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('');
  isAssignedFilter = signal<string>('');
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(5);
  loadingIndicator = signal<boolean>(false);
  showAdvancedSearch = signal<boolean>(false);


  filteredData = computed(() => {
    let data = [...this.allBookingData()];
    const query = this.searchQuery().toLowerCase();


    if (query) {
      data = data.filter(item => 
        Object.values(item).some(val => String(val).toLowerCase().includes(query))
      );
    }


    if (this.selectedStatus()) {
      data = data.filter(item => 
        this.selectedStatus() === 'null' 
          ? (!item.paymentStatus || item.paymentStatus === 'null')
          : item.paymentStatus === this.selectedStatus()
      );
    }

    if (this.isAssignedFilter()) {
      data = data.filter(item => 
        this.isAssignedFilter() === 'Assigned'
          ? (item.assignedUserId && item.assignedUserId.trim().length > 0)
          : (!item.assignedUserId || item.assignedUserId.trim().length === 0)
      );
    }

    return data;
  });

  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredData().slice(start, start + this.itemsPerPage());
  });

  totalPages = computed(() => Math.ceil(this.filteredData().length / this.itemsPerPage()) || 1);


  statusOptions = [
    { label: 'All Payments', value: '' },
    { label: 'Paid', value: 'success' },
    { label: 'Failure', value: 'failure' },
    { label: 'Pending', value: 'null' }
  ];

  assignedOptions = [
    { label: 'All Tests', value: '' },
    { label: 'All Assigned', value: 'Assigned' },
    { label: 'Not Assigned', value: 'Pending' }
  ];

  itemsPerPageOptions = [
    { label: '5', value: 5 }, { label: '10', value: 10 }, { label: 'All', value: 9999 }
  ];


  BookingCase: any;
  AssignedTo: string = '';
  AssignedToNew: string = '';
  editEvent: any = {};
  AllCifUserList: any[] = [];
  serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';

  ngOnInit(): void {
    this.loadUserFromCookies();
    this.loadInitialData();
  }

  loadInitialData() {
    this.loadingIndicator.set(true);
    this.cifService.GetAllBookingTests().subscribe({
      next: (res) => {
        this.allBookingData.set(res.item1 || []);
        this.loadingIndicator.set(false);
      },
      error: () => this.loadingIndicator.set(false)
    });

    this.cifService.GetAllUserLists().subscribe(res => {
      this.AllCifUserList = res.item1 || [];
    });
  }

  loadUserFromCookies() {
    const data = this.cookieService.get('AdminAuthData');
    if (!data) {
      this.router.navigate(['/Home']);
      return;
    }
  }


  onItemsPerPageChange(event: any) {
    this.itemsPerPage.set(Number(event.target.value));
    this.currentPage.set(1);
  }

  toggleAdvancedSearch() {
    this.showAdvancedSearch.update(v => !v);
    if (!this.showAdvancedSearch()) this.resetFilters();
  }

  resetFilters() {
    this.selectedStatus.set('');
    this.isAssignedFilter.set('');
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  openPaymentModal(item: any) {
    this.BookingCase = item;
    this.AssignedTo = '';
    this.modalService.open(this.viewDescModal2, { size: 'lg', centered: true });
  }

  openEditModal(item: any) {
    this.editEvent = { ...item };
    this.AssignedToNew = '';
    this.modalService.open(this.editEventModal, { size: 'lg', centered: true });
  }

  VerifyData(booking: any) {
    const fd = new FormData();
    fd.append('BookingId', booking.bookingId);
    fd.append('InstrumentId', booking.instrumentId);
    fd.append('UserId', booking.userEmailId);
    fd.append('AssignedTo', this.AssignedTo);

    this.cifService.CIFAssignTestToStaff(fd).subscribe(() => {
      swal.fire('Success', 'Staff Assigned', 'success');
      this.modalService.dismissAll();
      this.loadInitialData();
    });
  }

  exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(this.allBookingData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Records');
    XLSX.writeFile(wb, 'Assigned_Report.xlsx');
  }

  downloadFile(name: string) {
    window.open(this.serverUrl + name, '_blank');
  }
}
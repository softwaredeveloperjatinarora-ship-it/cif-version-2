import { Component, OnInit, ViewChild, ElementRef, inject, signal, computed } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { CookieService } from 'ngx-cookie-service';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import swal from 'sweetalert2';

import { LoginSessionService } from '../../services/login-session.service';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

 
import { AdminDashboardComponent } from '../AdminDashboard/AdminDashboard';

@Component({
  selector: 'app-admin-user-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbModule, NgSelectModule, AdminDashboardComponent],
  templateUrl: './AllUserDetails.html',
  styleUrls: ['./AllUserDetails.scss']
})
export class AdminUserDetailsComponent implements OnInit {
  // Injecting services using inject() - modern Angular 20 pattern
  private cifService = inject(LpuCIFWebService);
  private cookieService = inject(CookieService);
  private modalService = inject(NgbModal);
  private router = inject(Router);

  // Signals for Reactive State Management
  userDetailsData = signal<any[]>([]);
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('');
  showLoader = signal<boolean>(true);
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(5);
  isAllSelected = signal<boolean>(false);

  // Constants
  itemsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '15', value: 15 },
    { label: '20', value: 20 },
    { label: 'All', value: 'all' }
  ];

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Internal User', value: '400000' },
    { label: 'External User', value: '400001' },
    { label: 'Industry User', value: '400002' }
  ];

  // Computed Values for Filtering and Pagination
  filteredData = computed(() => {
    let data = this.userDetailsData();
    const query = this.searchQuery().toLowerCase();
    const status = this.selectedStatus();

    if (status) {
      data = data.filter(item => item.userRole === status);
    }

    if (query) {
      data = data.filter(item => 
        Object.values(item).some(val => String(val).toLowerCase().includes(query))
      );
    }
    return data;
  });

  paginatedData = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredData().slice(startIndex, startIndex + this.itemsPerPage());
  });

  totalPages = computed(() => Math.ceil(this.filteredData().length / this.itemsPerPage()));

  ngOnInit(): void {
    this.loadBookingDetails();
  }

  loadBookingDetails() {
    this.showLoader.set(true);
    this.cifService.GetAllUserData().subscribe({
      next: (response) => {
        this.userDetailsData.set(response.item1 || []);
        setTimeout(() => this.showLoader.set(false), 1500);
      },
      error: () => this.showLoader.set(false)
    });
  }

  onItemsPerPageChange(event: any) {
    const value = event.target.value;
    if (value === 'all') {
      this.isAllSelected.set(true);
      this.itemsPerPage.set(this.filteredData().length || 1);
    } else {
      this.isAllSelected.set(false);
      this.itemsPerPage.set(parseInt(value, 10));
    }
    this.currentPage.set(1);
  }

  exportToExcel(): void {
    const exportedData = this.userDetailsData().map(item => ({
      EmailId: item.emailId,
      CandidateName: item.candidateName,
      Role: item.userRole === '400000' ? 'Internal' : 'External'
    }));
    const ws = XLSX.utils.json_to_sheet(exportedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'User_Details_Report.xlsx');
  }

  openLockModal(user: any) {
    Swal.fire({
      title: 'Change Device State?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, lock user'
    }).then((result) => {
      if (result.isConfirmed) {
        const formData = new FormData();
        formData.append('emailId', user.emailId);
        this.cifService.CIFLockUser(formData).subscribe(() => {
          Swal.fire('Locked!', '', 'success').then(() => location.reload());
        });
      }
    });
  }
}
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import * as XLSX from 'xlsx';

import { NgSelectModule } from '@ng-select/ng-select';
import swal from 'sweetalert2';

import { LoginSessionService } from '../../services/login-session.service';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

 
import { AdminDashboardComponent } from '../AdminDashboard/AdminDashboard';

@Component({
  selector: 'app-staff-user-feedback-details',
  standalone: true,
  imports: [CommonModule, FormsModule,AdminDashboardComponent],
  templateUrl: './UserFeedbacks.html',
  styleUrls: ['./UserFeedbacks.scss']
})
export class StaffUserFeedbackDetailsComponent implements OnInit {
  private cifWebService = inject(LpuCIFWebService);
  private router = inject(Router);
  private cookieService = inject(CookieService);

  // State Signals
  showLoader = signal(false);
  allFeedbackData = signal<any[]>([]);
  searchQuery = signal('');
  currentPage = signal(1);
  itemsPerPage = 10;

  // User Session Data
  userEmail = signal('');

  // Computed: Search/Filter Logic
  filteredFeedback = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const data = this.allFeedbackData();
    if (!query) return data;

    return data.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(query))
    );
  });

  // Computed: Pagination Logic
  totalPages = computed(() => {
    return Math.ceil(this.filteredFeedback().length / this.itemsPerPage) || 1;
  });

  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredFeedback().slice(start, start + this.itemsPerPage);
  });

  ngOnInit(): void {
    // this.initAuth();
    this.fetchFeedbackData();
  }

  private initAuth(): void {
    const cookieData = this.cookieService.get('StaffUserAuthData');
    if (!cookieData) {
      this.router.navigate(['/Home']);
      return;
    }
    const parsed = JSON.parse(cookieData);
    this.userEmail.set(parsed.EmailId);
  }

  fetchFeedbackData(): void {
    this.showLoader.set(true);
    this.cifWebService.GetAllFeedbackdetails().subscribe({
      next: (res) => {
        // console.log(JSON.stringify(res))
        this.allFeedbackData.set(res.item1 || []);
        this.showLoader.set(false);
      },
      error: () => this.showLoader.set(false)
    });
  }

  // Pagination Controls
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  // Exact Excel Logic from Angular 14
  exportToExcel(): void {
    const exportedData = this.filteredFeedback().map(item => ({
      CandidateName: item.candidateName,
      UserEmailId: item.userEmailId,
      InstrumentName: item.instrumentName,
      FeedBack: item.feedbackDescription,
      Department: item.departmentName,
      SchoolName: item.organisation,
      SupervisorName: item.supervisorName,
      Designation: item.designation ?? 'NA',
      Role: this.mapUserRole(item.userRole)
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
    
    // Exact column widths from your source
    ws['!cols'] = [
      { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, 
      { wpx: 200 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Feedback_Report');
    XLSX.writeFile(wb, 'UserFeedbackDetails.xlsx');
  }

  private mapUserRole(role: string): string {
    if (!role) return 'N-A';
    const roles: Record<string, string> = {
      '400000': 'Internal User',
      '400001': 'External Academia'
    };
    return roles[role] || 'Industry User';
  }

  goto(val: string): void {
    this.router.navigateByUrl(val);
  }
}
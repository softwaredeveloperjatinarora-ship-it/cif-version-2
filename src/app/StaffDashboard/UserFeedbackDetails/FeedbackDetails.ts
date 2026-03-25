import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import * as XLSX from 'xlsx';
 
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StaffMenuComponent } from "../StaffMenu/StaffMenu";
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { LoginSessionService } from '../../services/login-session.service';


@Component({
  selector: 'app-StaffUserFeedbackDetails',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './FeedbackDetails.html',
  styleUrls: ['./FeedbackDetails.scss']
})
export class FeedbackDetailsComponent implements OnInit {
  private cifService = inject(LpuCIFWebService);
  private router = inject(Router);
  private cookieService = inject(CookieService);

  
  allFeedbackData = signal<any[]>([]);
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);
  showLoader = signal<boolean>(true);

  
  filteredData = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const data = this.allFeedbackData();
    if (!query) return data;

    return data.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(query))
    );
  });

  
  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredData().slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.filteredData().length / this.itemsPerPage()));
    userEmail: any;

  ngOnInit(): void {
    this.loadUserData();
    this.getAllFeedbackData();
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

  private loadUserData() {
    const cookie = this.cookieService.get('StaffUserAuthData');
    if (cookie) {
      const user = JSON.parse(cookie);
        this.userEmail = user.EmailId;
    }
    else {
        this.router.navigate(['/Home']);
        return;
    }
  }

  getAllFeedbackData() {
    this.showLoader.set(true);
    const startTime = Date.now();

    this.cifService.GetAllFeedbackdetails().subscribe({
      next: (response) => {
        this.allFeedbackData.set(response.item1 || []);
        const delay = Math.max(1500 - (Date.now() - startTime), 0);
        setTimeout(() => this.showLoader.set(false), delay);
      },
      error: () => this.showLoader.set(false)
    });
  }

  
  changePage(delta: number) {
    const next = this.currentPage() + delta;
    if (next >= 1 && next <= this.totalPages()) {
      this.currentPage.set(next);
    }
  }

  onPageSizeChange() {
    this.currentPage.set(1); 
  }

  exportToExcel(): void {
    const exportedData = this.allFeedbackData().map(item => ({
      EmailId: item.emailId,
      CandidateName: item.candidateName,
      MobileNo: item.mobileNumber,
      Role: this.mapRole(item.userRole)
    }));

    const ws = XLSX.utils.json_to_sheet(exportedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Feedback');
    XLSX.writeFile(wb, 'User_Details_report.xlsx');
  }

  private mapRole(role: string): string {
    const roles: Record<string, string> = {
      '400000': 'Internal User',
      '400001': 'External Academia'
    };
    return roles[role] || 'Industry User';
  }
}
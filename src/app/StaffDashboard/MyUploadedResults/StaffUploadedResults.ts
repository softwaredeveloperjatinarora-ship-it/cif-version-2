import { Component, OnInit, ViewChild, ElementRef, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import * as XLSX from 'xlsx';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StaffMenuComponent } from "../StaffMenu/StaffMenu";
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { LoginSessionService } from '../../services/login-session.service';

@Component({
  selector: 'app-staff-uploaded-results',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, StaffMenuComponent],
  templateUrl: './StaffUploadedResults.component.html',
  styleUrls: ['./StaffActionBookings.component.scss']
})
export class MyUploadedResultsComponent implements OnInit {
  private cifService = inject(LpuCIFWebService);
  private cookieService = inject(CookieService);

  @ViewChild('table') table!: ElementRef;

  readonly loadingIndicator    = signal<boolean>(false);
  bookingData = signal<any[]>([]);
  searchQuery = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(10);
  serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';

  pageSizeOptions = [5, 10, 15, 20];


  userContext = {
    role: '',
    id: '',
    employeeCode: ''
  };

  filteredData = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const data = this.bookingData();
    if (!query) return data;
    return data.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(query))
    );
  });


  totalPages = computed(() => {
    const count = Math.ceil(this.filteredData().length / this.itemsPerPage());
    return count > 0 ? count : 1;
  });

  currentPageData = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredData().slice(start, start + this.itemsPerPage());
  });


  onPageSizeChange(event: Event): void {
    const newSize = +(event.target as HTMLSelectElement).value;
    this.itemsPerPage.set(newSize);
    this.currentPage.set(1);
  }
  ngOnInit(): void {
    const cookieData = this.cookieService.get('StaffUserAuthData');
    if (cookieData) {
      const parsed = JSON.parse(cookieData);
      this.userContext = {
        role: parsed.UserRole,
        id: parsed.EmailId,
        employeeCode: parsed.UserId
      };
       
      this.getUploadedResultsDetails(this.userContext.employeeCode);
    }
     
  }

  getUploadedResultsDetails(UID: any): void {
    this.loadingIndicator.set(true);
    const startTime = Date.now();
    this.cifService.GetUploadedResultDetails(UID).subscribe({
      next: (response: any) => {
        let data: any[] = [];

        if (Array.isArray(response)) {
          data = response;
        } else if (response?.item1 && Array.isArray(response.item1)) {
          data = response.item1;
        } else if (response && typeof response === 'object') {
          data = [response];
        }

        this.bookingData.set(data);

          const delay = Math.max(1500 - (Date.now() - startTime), 0);
          setTimeout(() => this.loadingIndicator.set(false), delay);

        // const elapsed = Date.now() - startTime;
        // const remainingDelay = Math.max(2500 - elapsed, 0);
        // setTimeout(() => this.loadingIndicator.set(false), remainingDelay);
      },
      error: (err) => {
        console.error(err);
        this.loadingIndicator.set(false);
      }
    });
  }

  updateSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

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

  downloadFile(fileName: string): void {
    window.open(this.serverUrl + fileName, '_blank');
  }

  exportToExcel(): void {
    const fileName = 'AssignedResults_report.xlsx';
    const exportedData = this.bookingData().map(item => ({
      EmailId: item.userEmailId,
      BookingId: item.bookingId,
      Instrument: item.instrumentName,
      Charges: item.totalCharges,
      BookingDate: item.allocatedOn,
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
    ws['!cols'] = Array(5).fill({ wpx: 180 });

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
    link.download = fileName;
    link.click();
  }
}
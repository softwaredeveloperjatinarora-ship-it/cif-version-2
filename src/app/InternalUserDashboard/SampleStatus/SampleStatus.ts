import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as XLSX from 'xlsx';


import { LoginSessionService } from '../../services/login-session.service';

import { CifMenuBarComponent } from '../cif-menu-bar/cif-menu-bar.component';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface SampleStatusRow {
  bookingId: string;
  instrumentName: string;
  receivedBy: string;
  receivedDate: string;
  sampleCount: number;
  sampleCondition: string;
  assignedTo?: string;
  assignedOn?: string;
  noOfSamples?: number;
  bookingRequestDate?: string;
  remarks?: string;
  [key: string]: unknown;
}

export interface SamplesCase {
  bookingId: string;
  instrumentName: string;
  remarks: string;
  [key: string]: unknown;
}

interface CookieAuthData {
  UserRole: string;
  EmailId: string;
}
 
@Component({
  selector: 'app-sample-status',
  standalone: true,
  imports: [CommonModule, FormsModule, CifMenuBarComponent],
  templateUrl: './SampleStatus.html',
  styleUrls: ['./SampleStatus.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SampleStatusComponent implements OnInit {

  private readonly cifWebService  = inject(LpuCIFWebService);
  private readonly authSession    = inject(LoginSessionService);
  private readonly cookieService  = inject(CookieService);
  private readonly modalService   = inject(NgbModal);
  private readonly router         = inject(Router);
  private readonly route          = inject(ActivatedRoute);

  @ViewChild('viewDescModal2') viewDescModal2!: TemplateRef<unknown>;
  @ViewChild('table') tableRef!: ElementRef;

  readonly loadingIndicator   = signal(false);
  readonly samplesStatusData  = signal<SampleStatusRow[]>([]);
  readonly searchQuery        = signal('');
  readonly currentPage        = signal(1);
  readonly samplesCase        = signal<SamplesCase | null>(null);

  readonly itemsPerPage = 10;

  readonly filteredSamplesStatusData = computed<SampleStatusRow[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.samplesStatusData();

    return this.samplesStatusData().filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(query)
      )
    );
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.filteredSamplesStatusData().length / this.itemsPerPage)
  );

  readonly currentPageData = computed<SampleStatusRow[]>(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredSamplesStatusData().slice(start, start + this.itemsPerPage);
  });

  private userRole = '';
  private userId   = '';
  readonly serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';

  ngOnInit(): void {
    const raw = this.cookieService.get('InternalUserAuthData');
    const cookieData: CookieAuthData = JSON.parse(raw);
    this.userRole = cookieData.UserRole;
    this.userId   = cookieData.EmailId;
    this.loadSampleStatus();
  }

  private loadSampleStatus(): void {
    this.loadingIndicator.set(true);
    const startTime = Date.now();

    this.cifWebService.GetSampleStatus(this.userId).subscribe({
      next: (response) => {
        const rows: SampleStatusRow[] = response?.item1 ?? [];
        this.samplesStatusData.set(rows);

        const delay = Math.max(500 - (Date.now() - startTime), 0);
        setTimeout(() => this.loadingIndicator.set(false), delay);
      },
      error: (err) => {
        console.error('Failed to load sample status:', err);
        this.samplesStatusData.set([]);
        this.loadingIndicator.set(false);
      },
    });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1); // reset to first page on new search
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

  exportToExcel(): void {
    const exportedData = this.samplesStatusData().map(item => ({
      BookingId:      item.bookingId,
      InstrumentName: item.instrumentName,
      AssignedTo:     item.assignedTo?.split(' ').slice(0, -1).join(' ') ?? '',
      AssignedDate:   item.assignedOn ?? '',
      Samples:        item.noOfSamples ?? '',
      RequestDate:    item.bookingRequestDate ?? '',
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
    ws['!cols'] = Array(10).fill({ wpx: 180 });

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([blobData], { type: 'application/octet-stream' })
    );
    link.download = 'Samples_Details_report.xlsx';
    link.click();
  }

  openResultModal(row: SamplesCase): void {
    this.samplesCase.set(row);
    this.modalService.open(this.viewDescModal2, { size: 'lg' });
  }
}
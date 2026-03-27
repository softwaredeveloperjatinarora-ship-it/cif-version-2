import { Component, OnInit, ViewChild, TemplateRef, ElementRef, Inject, signal, computed, effect } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

import swal from 'sweetalert2';

import { LoginSessionService } from '../../services/login-session.service';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

 
import { AdminDashboardComponent } from '../AdminDashboard/AdminDashboard';

@Component({
  selector: 'app-AdminActionInstruments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbModule, MatTableModule, MatPaginatorModule, MatSortModule,AdminDashboardComponent],
  templateUrl: './InstrumentsAction.html',
  styleUrls: ['./InstrumentsAction.scss']
})
export class AdminActionInstrumentsComponent implements OnInit {
  // Signals for State Management (Angular 20 approach)
  loadingIndicator = signal(false);
  instrumentData = signal<any[]>([]);
  searchQuery = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(10);
  
  // Computed values for filtering and pagination
  filteredData = computed(() => {
    const term = this.searchQuery().toLowerCase().trim();
    if (!term) return this.instrumentData();
    return this.instrumentData().filter(item => 
      item.instrumentName?.toLowerCase().includes(term) || 
      item.analysisType?.toLowerCase().includes(term)
    );
  });

  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredData().slice(start, start + this.itemsPerPage());
  });

  totalPages = computed(() => Math.ceil(this.filteredData().length / this.itemsPerPage()));

  // UI State Variables
  serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/CIFSampleExcelSheets/';
  BookingCase: any;
  uploadedDataForDisplay: any[] = [];
  validationErrors: string[] = [];
  fileDataX: File | null = null;
  FileDataX: string = '';
  fileName: string = '';

  @ViewChild('table') table!: ElementRef;
  @ViewChild('viewDescModal2') viewDescModal2!: TemplateRef<any>;

  constructor(
    private CIFwebService: LpuCIFWebService,
    private modalService: NgbModal,
    private AuthSession: LoginSessionService,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData() {
    this.loadingIndicator.set(true);
    this.CIFwebService.GetAllInstruments().subscribe({
      next: (response) => {
        if (response.item1) {
          const mapped = response.item1.map((it: any) => ({
            ...it,
            instrumentExcelUrl: it.instrumentExcelName 
              ? `assets/CifDocumentsTemplates/${it.instrumentExcelName}`
              : `assets/CifDocumentsTemplates/${it.instrumentId}.xlsx`
          }));
          this.instrumentData.set(mapped);
        }
        this.loadingIndicator.set(false);
      },
      error: () => this.loadingIndicator.set(false)
    });
  }
// onDownloadFile(remoteUrl: string): void {
//   if (!remoteUrl) {
//     Swal.fire('Error', 'No file path provided.', 'error');
//     return;
//   }

//   Swal.fire({
//     title: 'Downloading...',
//     allowOutsideClick: false,
//     didOpen: () => { Swal.showLoading(null); }
//   });

//   // Note: Your service expects the URL as the 'fileName' property in the payload
//   this.CIFwebService.downloadFile(remoteUrl).subscribe({
//     next: (blob: Blob) => {
//       if (blob.size === 0) {
//         Swal.fire('Error', 'The file is empty or could not be found.', 'error');
//         return;
//       }

//       const downloadUrl = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = downloadUrl;

//       // Extract just the filename from the path for the download attribute
//       const fileName = remoteUrl.split('/').pop() || 'Document.xlsx';
//       link.download = fileName;

//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(downloadUrl);
//       Swal.close();
//     },
//     error: (err) => {
//       Swal.close();
      
//       // Since responseType is 'blob', error is also a blob. We must read it as text.
//       if (err.error instanceof Blob) {
//         const reader = new FileReader();
//         reader.onload = () => {
//           try {
//             const errorResult = JSON.parse(reader.result as string);
//             Swal.fire('Download Failed', errorResult.message || 'Server error', 'error');
//           } catch (e) {
//             Swal.fire('Error', 'File not found on server.', 'error');
//           }
//         };
//         reader.readAsText(err.error);
//       } else {
//         Swal.fire('Error', 'Connection failed.', 'error');
//       }
//     }
//   });
// }
  onDownloadFile(remoteUrl: string): void {
    Swal.fire({ title: 'Downloading...', didOpen: () => Swal.showLoading() });
    this.CIFwebService.downloadFile(remoteUrl).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = remoteUrl.split('/').pop() || 'Document.pdf';
        link.click();
        window.URL.revokeObjectURL(url);
        Swal.close();
      },
      error: () => {
        Swal.close();
        Swal.fire('Error', 'Download failed', 'error');
      }
    });
  }

  onFileXSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.size > 10148576) {
      Swal.fire('Warning', 'File exceeds 1MB', 'warning');
      return;
    }
    this.fileDataX = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.FileDataX = (reader.result as string).split(',')[1];
      this.fileName = file.name;
    };
    reader.readAsDataURL(file);
  }

  VerifyData(instrument: any): void {
    if (!this.fileDataX) Swal.fire('Error', 'No file selected', 'warning');

    const formData = new FormData();
    formData.append('InstrumentId', instrument.instrumentId);
    formData.append('FilePath', this.fileName);
    formData.append('File', this.FileDataX);

    this.CIFwebService.ReplaceExcelSheetSample(formData).subscribe({
      next: (res: any) => {
        if (res.item1?.[0]?.msg?.toLowerCase() === 'success') {
          Swal.fire('Success', 'Uploaded Successfully', 'success').then(() => window.location.reload());
        }
      }
    });
  }

  OpenReplaceModal(item: any) {
    this.BookingCase = item;
    this.modalService.open(this.viewDescModal2, { size: 'lg' });
  }

  exportToExcel(): void {
    const ws = XLSX.utils.table_to_sheet(this.table.nativeElement);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Instruments');
    XLSX.writeFile(wb, 'Instrument_Report.xlsx');
  }

  // Pagination Controls
  nextPage = () => this.currentPage() < this.totalPages() && this.currentPage.update(v => v + 1);
  prevPage = () => this.currentPage() > 1 && this.currentPage.update(v => v - 1);
}
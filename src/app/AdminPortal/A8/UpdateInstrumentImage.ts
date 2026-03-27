import { Component, OnInit, ViewChild, ElementRef, TemplateRef, inject, signal, computed } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

// Third-party imports
import { NgxDatatableModule, ColumnMode } from '@swimlane/ngx-datatable';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie-service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

import { NgSelectModule } from '@ng-select/ng-select';
import swal from 'sweetalert2';

import { LoginSessionService } from '../../services/login-session.service';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

 
import { AdminDashboardComponent } from '../AdminDashboard/AdminDashboard';
@Component({
  selector: 'app-update-instrument-price',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxDatatableModule, NgbModule,AdminDashboardComponent],
  templateUrl: './UpdateInstrumentImage.html',
  styleUrls: ['./UpdateInstrumentImage.scss']
})
export class UpdateInstrumentPriceComponent implements OnInit {
  // Inject services using inject() - Modern Angular pattern
  private cifService = inject(LpuCIFWebService);
  private fb = inject(FormBuilder);
  private modalService = inject(NgbModal);
  private cookieService = inject(CookieService);
  private router = inject(Router);
  private document = inject(DOCUMENT);

  // Signals for Reactive State
  loadingIndicator = signal(false);
  allInstruments = signal<any[]>([]);
  searchQuery = signal('');
  
  // Computed signal for filtered results
  filteredInstruments = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.allInstruments();
    return this.allInstruments().filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(query))
    );
  });

  // Template Variables
  @ViewChild('viewDescModal') viewDescModal!: TemplateRef<any>;
  columnMode = ColumnMode;
  columns = signal<string[]>([]);
  
  // Form & Upload State
  validationForm!: FormGroup;
  instrumentId = signal<any>(null);
  instrumentTitle = signal<string>('');
  statusInstrument = signal<boolean>(false);
  fileDataX: File | null = null;
  fileName = '';
  fileChosen = signal<boolean>(false);


  loading = signal(false);
 
  // Reactive filtering logic
  filteredData = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.allInstruments();
    return this.allInstruments().filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(query))
    );
  });

  ngOnInit() {
     this.initForm();
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.cifService.GetAllInstruments().subscribe({
      next: (res) => {
        this.allInstruments.set(res.item1 || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

 
 
  // private initAuth(): void {
  //   const cookieData = this.cookieService.get('authData');
  //   if (!cookieData) {
  //     Swal.fire('Login Failed', 'Please login again', 'warning');
  //     this.router.navigate(['/Home']);
  //     return;
  //   }
  // }

  private initForm(): void {
    this.validationForm = this.fb.group({
      file: [null, Validators.required]
    });
  }

  loadInstruments(): void {
    this.loadingIndicator.set(true);
    this.cifService.GetAllInstruments().subscribe({
      next: (response) => {
        if (response.item1?.length > 0) {
          this.allInstruments.set(response.item1);
          this.generateColumns(response.item1[0]);
        }
        setTimeout(() => this.loadingIndicator.set(false), 800);
      },
      error: () => this.loadingIndicator.set(false)
    });
  }

  private generateColumns(sampleItem: any): void {
    const excluded = ['imageUrl', 'excelSheetUrl', 'id', 'isActive', 'description'];
    const cols = Object.keys(sampleItem).filter(key => !excluded.includes(key));
    this.columns.set(cols);
  }

  onSelect(row: any): void {
    this.instrumentId.set(row.instrumentId);
    this.instrumentTitle.set(row.instrumentName);
    this.statusInstrument.set(row.isActive);
    this.modalService.open(this.viewDescModal, { size: 'lg' });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire('Error', 'File size exceeds 10MB', 'warning');
        return;
      }
      this.fileDataX = file;
      this.fileName = file.name;
      this.fileChosen.set(true);
    }
  }

  updateDocument(): void {
    if (!this.fileDataX) return;
    
    this.loadingIndicator.set(true);
    const formData = new FormData();
    formData.append('InstrumentId', this.instrumentId());
    formData.append('IsActive', String(this.statusInstrument()));
    formData.append('File', this.fileDataX);

    this.cifService.CIFInstrumentUpdateDetails(formData).subscribe({
      next: (res: any) => {
        if (res.item1[0]?.msg === 'ok') {
          Swal.fire('Success', 'Updated successfully', 'success').then(() => window.location.reload());
        }
        this.loadingIndicator.set(false);
      },
      error: () => this.loadingIndicator.set(false)
    });
  }

  exportToExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.allInstruments());
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Instruments');
    XLSX.writeFile(wb, 'Instruments_Report.xlsx');
  }

  downloadImage(url: string) {
    if (url) window.open(url, '_blank');
  }
}
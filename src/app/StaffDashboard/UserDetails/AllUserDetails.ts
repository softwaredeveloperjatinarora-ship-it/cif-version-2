import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';


import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StaffMenuComponent } from "../StaffMenu/StaffMenu";
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { LoginSessionService } from '../../services/login-session.service';

@Component({
  selector: 'app-staff-user-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    StaffMenuComponent,
  ],
  templateUrl: './AllUserDetails.html',
  styleUrls: ['./AllUserDetails.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
 
 
export class StaffUserDetailsComponent implements OnInit {

  // ─── Injected Services ──────────────────────────────────────────────────────
  // DestroyRef injected at field level (injection context) so it can be passed
  // into takeUntilDestroyed() inside regular methods safely.
  private readonly destroyRef     = inject(DestroyRef);
  private readonly cifWebService  = inject(LpuCIFWebService);
  private readonly storageService = inject(StorageService);
  private readonly authService    = inject(AuthService);
  private readonly authSession    = inject(LoginSessionService);
  private readonly modalService   = inject(NgbModal);
  private readonly router         = inject(Router);
  private readonly route          = inject(ActivatedRoute);
  private readonly cookieService  = inject(CookieService);

  // ─── View References ─────────────────────────────────────────────────────────
  @ViewChild('table')          tableRef!: ElementRef;
  @ViewChild('viewDescModal2') viewDescModal2!: TemplateRef<unknown>;

  // ─── Signals ──────────────────────────────────────────────────────────────────
  /** Master list from the API – never mutated after load */
  readonly UserDetailsData     = signal<any[]>([]);

  /** Working / filtered / searched list driving the table */
  readonly tmpsUserDetailsData = signal<any[]>([]);

  readonly showLoader   = signal<boolean>(true);
  readonly currentPage  = signal<number>(1);

  /** 0 = "All". Must be a signal so computed() reacts when it changes. */
  readonly itemsPerPage = signal<number>(10);

  // ─── Derived / computed ───────────────────────────────────────────────────────
  readonly totalPages = computed(() => {
    const size = this.itemsPerPage();
    if (size === 0) return 1;
    return Math.ceil(this.tmpsUserDetailsData().length / size);
  });

  readonly currentPageData = computed(() => {
    const size = this.itemsPerPage();
    if (size === 0) return this.tmpsUserDetailsData();
    const start = (this.currentPage() - 1) * size;
    return this.tmpsUserDetailsData().slice(start, start + size);
  });

  /** Snapshot used as the baseline for filter + search operations */
  private originalData: any[] = [];

  UserRole      = '';
  user_Email    = '';
  candidateName = '';

  // Modal / upload state
  BookingCase: any;
  Remarks      = '';
  FileData: any;
  fileName     = '';
  fileData!: File;
  fileStatus   = false;
  uploadEnabled = false;

  // Search & filter
  searchQuery    = '';
  selectedStatus = '';


  // ─── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const cookieRaw = this.cookieService.get('StaffUserAuthData');
    if (cookieRaw) {
      const cookie = JSON.parse(cookieRaw);
      this.UserRole      = cookie.UserRole;
      this.user_Email    = cookie.EmailId;
      this.candidateName = cookie.CandidateName;
    }
    this.loadUserData();
  }

  // ─── Data Loading ─────────────────────────────────────────────────────────────
  loadUserData(): void {
    this.showLoader.set(true);
    const startTime = Date.now();

    this.cifWebService.GetAllUserData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (response?.item1?.length > 0) {
            const sorted = [...response.item1].sort(
              (a: any, b: any) => b.idProofNumber - a.idProofNumber
            );
            this.originalData = sorted;
            this.UserDetailsData.set(sorted);
            this.tmpsUserDetailsData.set(sorted);
          } else {
            this.originalData = [];
            this.UserDetailsData.set([]);
            this.tmpsUserDetailsData.set([]);
          }

          const delay = Math.max(1500 - (Date.now() - startTime), 0);
          setTimeout(() => this.showLoader.set(false), delay);
        },
        error: (err: any) => {
          console.error('Error loading user data:', err);
          this.showLoader.set(false);
        },
      });
  }

  // ─── Pagination Helpers ───────────────────────────────────────────────────────
  getTotalRecords(): number {
    return this.tmpsUserDetailsData().length;
  }

  getTotalPages(): number {
    return this.totalPages();
  }

  getCurrentPageData(): any[] {
    return this.currentPageData();
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

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.itemsPerPage.set(Number(select.value));
    this.currentPage.set(1); // reset to first page on size change
  }

  getPageRangeLabel(): string {
    const total = this.tmpsUserDetailsData().length;
    const size  = this.itemsPerPage();
    if (total === 0) return '0 – 0 of 0';
    if (size === 0)  return `1 – ${total} of ${total}`;
    const start = (this.currentPage() - 1) * size + 1;
    const end   = Math.min(this.currentPage() * size, total);
    return `${start} – ${end} of ${total}`;
  }

  // ─── Search ───────────────────────────────────────────────────────────────────
  search(): void {
    const query = this.searchQuery.toLowerCase().trim();

    if (!query) {
      // Reapply only the status filter when search is cleared
      this.applyFilters();
      return;
    }

    const roleMap: Record<string, string> = {
      '400000': 'internal user',
      '400001': 'external academia',
      '400002': 'industry user',
    };

    const base = this.selectedStatus
      ? this.originalData.filter(item => item.userRole === this.selectedStatus)
      : [...this.originalData];

    this.tmpsUserDetailsData.set(
      base.filter(item =>
        Object.values(item).some(val => {
          const str = String(val ?? '').toLowerCase();
          const role = roleMap[item.userRole?.trim()] ?? '';
          return str.includes(query) || role.includes(query);
        })
      )
    );

    this.currentPage.set(1);
  }

  // ─── Status Filter ────────────────────────────────────────────────────────────
  filterData(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = [...this.originalData];

    if (this.selectedStatus && this.selectedStatus !== '') {
      if (this.selectedStatus === 'null') {
        result = result.filter(item => item.userRole == null || item.userRole === '');
      } else {
        result = result.filter(item => item.userRole === this.selectedStatus);
      }
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      const roleMap: Record<string, string> = {
        '400000': 'internal user',
        '400001': 'external academia',
        '400002': 'industry user',
      };
      result = result.filter(item =>
        Object.values(item).some(val => {
          const str = String(val ?? '').toLowerCase();
          const role = roleMap[item.userRole?.trim()] ?? '';
          return str.includes(query) || role.includes(query);
        })
      );
    }

    this.tmpsUserDetailsData.set(result);
    this.currentPage.set(1);
  }

  // ─── Export ───────────────────────────────────────────────────────────────────
  exportToExcel(): void {
    const roleLabel = (role: string | null): string => {
      if (role === '400000') return 'Internal User';
      if (role === '400001') return 'External Academia';
      if (role === '400002') return 'Industry User';
      return 'N/A';
    };

    const exportedData = this.UserDetailsData().map(item => ({
      EmailId:        item.emailId,
      CandidateName:  item.candidateName,
      MobileNo:       item.mobileNumber,
      Department:     item.departmentName,
      SchoolName:     item.organisation,
      SupervisorName: item.supervisorName,
      Designation:    item.designation ?? 'NA',
      Role:           roleLabel(item.userRole),
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
    link.download = 'User_Details_report.xlsx';
    link.click();
    link.remove();
  }

  // ─── Modal ────────────────────────────────────────────────────────────────────
  openPaymentModal(booking: any): void {
    this.BookingCase = booking;
    this.modalService
      .open(this.viewDescModal2, { size: 'sm' })
      .result.catch(() => {/* dismissed */});
  }

  // ─── File Upload ──────────────────────────────────────────────────────────────
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file   = target.files?.[0] ?? null;
    if (!file) return;

    if (file.size > 5_148_576) {
      Swal.fire({ title: 'File exceeds 5 MB limit', icon: 'warning' });
      target.value = '';
      return;
    }

    const validNameRegex = /^[a-zA-Z0-9._-]+$/;
    const finalFile = validNameRegex.test(file.name)
      ? file
      : (() => {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const dt = new DataTransfer();
          const mf = new File([file], safeName, { type: file.type });
          dt.items.add(mf);
          target.files = dt.files;
          return mf;
        })();

    this.fileData   = finalFile;
    this.fileStatus = true;
    this.fileName   = finalFile.name;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.FileData = base64;
    };
    reader.readAsDataURL(finalFile);
    this.uploadEnabled = true;
  }

  // ─── Result Upload ────────────────────────────────────────────────────────────
  VerifyData(booking: any): void {
    const formData = new FormData();
    formData.append('BookingId',    booking.bookingId);
    formData.append('UserEmailId',  booking.userEmailId);
    formData.append('FilePath',     this.fileName);
    formData.append('File',         this.FileData);

    this.cifWebService.CIFResultsUploads(formData).subscribe({
      next: (data: any) => {
        const msg      = data.item1[0]['msg'];
        const returnId = data.item1[0]['ReturnId'];

        if (msg === 'Success' && returnId !== '0') {
          Swal.fire({ title: 'Uploaded Successfully!', icon: 'success' })
            .then(() => window.location.reload());
        } else {
          Swal.fire({ title: 'Results already uploaded for this test', icon: 'error' })
            .then(() => window.location.reload());
        }
      },
      error: () => {
        Swal.fire({ title: 'Error', text: 'Failed to upload.', icon: 'error' });
      },
    });
  }
}

// export class StaffUserDetailsComponent implements OnInit {

//   // ─── Injected Services ──────────────────────────────────────────────────────
//   private readonly cifWebService  = inject(LpuCIFWebService);
//   private readonly storageService = inject(StorageService);
//   private readonly authService    = inject(AuthService);
//   private readonly authSession    = inject(LoginSessionService);
//   private readonly modalService   = inject(NgbModal);
//   private readonly router         = inject(Router);
//   private readonly route          = inject(ActivatedRoute);
//   private readonly cookieService  = inject(CookieService);

//   // ─── View References ─────────────────────────────────────────────────────────
//   @ViewChild('table')          tableRef!: ElementRef;
//   @ViewChild('viewDescModal2') viewDescModal2!: TemplateRef<unknown>;

//   // ─── Signals ──────────────────────────────────────────────────────────────────
//   /** Master list from the API – never mutated after load */
//   readonly UserDetailsData  = signal<any[]>([]);

//   /** Working / filtered / searched list driving the table */
//   readonly tmpsUserDetailsData = signal<any[]>([]);

//   readonly showLoader  = signal<boolean>(true);
//   readonly currentPage = signal<number>(1);

//   // ─── Derived / computed ───────────────────────────────────────────────────────
//   readonly totalPages = computed(() =>
//     Math.ceil(this.tmpsUserDetailsData().length / this.itemsPerPage)
//   );

//   readonly currentPageData = computed(() => {
//     const start = (this.currentPage() - 1) * this.itemsPerPage;
//     return this.tmpsUserDetailsData().slice(start, start + this.itemsPerPage);
//   });

//   // ─── Non-reactive State ───────────────────────────────────────────────────────
//   readonly itemsPerPage = 10;

//   /** Snapshot used as the baseline for filter + search operations */
//   private originalData: any[] = [];

//   UserRole      = '';
//   user_Email    = '';
//   candidateName = '';

//   // Modal / upload state
//   BookingCase: any;
//   Remarks      = '';
//   FileData: any;
//   fileName     = '';
//   fileData!: File;
//   fileStatus   = false;
//   uploadEnabled = false;

//   // Search & filter
//   searchQuery    = '';
//   selectedStatus = '';

//   readonly statusOptions = [
//     { label: 'All',      value: ''       },
//     { label: 'Internal', value: '400000' },
//     { label: 'External', value: '400001' },
//     { label: 'Industry', value: '400002' },
//   ];

//   // ─── Lifecycle ────────────────────────────────────────────────────────────────
//   ngOnInit(): void {
//     const cookieRaw = this.cookieService.get('StaffUserAuthData');
//     if (cookieRaw) {
//       const cookie = JSON.parse(cookieRaw);
//       this.UserRole      = cookie.UserRole;
//       this.user_Email    = cookie.EmailId;
//       this.candidateName = cookie.CandidateName;
//     }
//     this.loadUserData();
//   }

//   // ─── Data Loading ─────────────────────────────────────────────────────────────
//   loadUserData(): void {
//     this.showLoader.set(true);
//     const startTime = Date.now(); 
//     this.cifWebService.GetAllUserData().subscribe({
//           next: (response) => {       
//           if (response?.item1?.length > 0) {
//             const sorted = [...response.item1].sort(
//               (a: any, b: any) => b.idProofNumber - a.idProofNumber
//             );
//             this.originalData = sorted;
//             this.UserDetailsData.set(sorted);
//             this.tmpsUserDetailsData.set(sorted);
//           } else {
//             this.originalData = [];
//             this.UserDetailsData.set([]);
//             this.tmpsUserDetailsData.set([]);
//           }

//           const delay = Math.max(1500 - (Date.now() - startTime), 0);
//           setTimeout(() => this.showLoader.set(false), delay);
//         },
//         error: (err: any) => {
//           console.error('Error loading user data:', err);
//           this.showLoader.set(false);
//         },
//       });
//   }

//   getTotalRecords(): number {
//     return this.tmpsUserDetailsData().length;
//   }

//   getTotalPages(): number {
//     return this.totalPages();
//   }

//   getCurrentPageData(): any[] {
//     return this.currentPageData();
//   }

//   nextPage(): void {
//     if (this.currentPage() < this.totalPages()) {
//       this.currentPage.update(p => p + 1);
//     }
//   }

//   prevPage(): void {
//     if (this.currentPage() > 1) {
//       this.currentPage.update(p => p - 1);
//     }
//   }

//   search(): void {
//     const query = this.searchQuery.toLowerCase().trim();

//     if (!query) {
//       this.applyFilters();
//       return;
//     }

//     const roleMap: Record<string, string> = {
//       '400000': 'internal user',
//       '400001': 'external academia',
//       '400002': 'industry user',
//     };

//     const base = this.selectedStatus
//       ? this.originalData.filter(item => item.userRole === this.selectedStatus)
//       : [...this.originalData];

//     this.tmpsUserDetailsData.set(
//       base.filter(item =>
//         Object.values(item).some(val => {
//           const str = String(val ?? '').toLowerCase();
//           const role = roleMap[item.userRole?.trim()] ?? '';
//           return str.includes(query) || role.includes(query);
//         })
//       )
//     );

//     this.currentPage.set(1);
//   }

//   filterData(): void {
//     this.applyFilters();
//   }

//   private applyFilters(): void {
//     let result = [...this.originalData];

//     if (this.selectedStatus && this.selectedStatus !== '') {
//       if (this.selectedStatus === 'null') {
//         result = result.filter(item => item.userRole == null || item.userRole === '');
//       } else {
//         result = result.filter(item => item.userRole === this.selectedStatus);
//       }
//     }

//     if (this.searchQuery.trim()) {
//       const query = this.searchQuery.toLowerCase();
//       const roleMap: Record<string, string> = {
//         '400000': 'internal user',
//         '400001': 'external academia',
//         '400002': 'industry user',
//       };
//       result = result.filter(item =>
//         Object.values(item).some(val => {
//           const str = String(val ?? '').toLowerCase();
//           const role = roleMap[item.userRole?.trim()] ?? '';
//           return str.includes(query) || role.includes(query);
//         })
//       );
//     }

//     this.tmpsUserDetailsData.set(result);
//     this.currentPage.set(1);
//   }

//   // ─── Export ───────────────────────────────────────────────────────────────────
//   exportToExcel(): void {
//     const roleLabel = (role: string | null): string => {
//       if (role === '400000') return 'Internal User';
//       if (role === '400001') return 'External Academia';
//       if (role === '400002') return 'Industry User';
//       return 'N/A';
//     };

//     const exportedData = this.UserDetailsData().map(item => ({
//       EmailId:        item.emailId,
//       CandidateName:  item.candidateName,
//       MobileNo:       item.mobileNumber,
//       Department:     item.departmentName,
//       SchoolName:     item.organisation,
//       SupervisorName: item.supervisorName,
//       Designation:    item.designation ?? 'NA',
//       Role:           roleLabel(item.userRole),
//     }));

//     const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
//     ws['!cols'] = Array(10).fill({ wpx: 180 });

//     const wb: XLSX.WorkBook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

//     const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(
//       new Blob([blobData], { type: 'application/octet-stream' })
//     );
//     link.download = 'User_Details_report.xlsx';
//     link.click();
//     link.remove();
//   }

//   // ─── Modal ────────────────────────────────────────────────────────────────────
//   openPaymentModal(booking: any): void {
//     this.BookingCase = booking;
//     this.modalService
//       .open(this.viewDescModal2, { size: 'sm' })
//       .result.catch(() => {/* dismissed */});
//   }

//   // ─── File Upload ──────────────────────────────────────────────────────────────
//   onFileSelected(event: Event): void {
//     const target = event.target as HTMLInputElement;
//     const file   = target.files?.[0] ?? null;
//     if (!file) return;

//     if (file.size > 5_148_576) {
//       Swal.fire({ title: 'File exceeds 5 MB limit', icon: 'warning' });
//       target.value = '';
//       return;
//     }

//     const validNameRegex = /^[a-zA-Z0-9._-]+$/;
//     const finalFile = validNameRegex.test(file.name)
//       ? file
//       : (() => {
//           const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
//           const dt = new DataTransfer();
//           const mf = new File([file], safeName, { type: file.type });
//           dt.items.add(mf);
//           target.files = dt.files;
//           return mf;
//         })();

//     this.fileData   = finalFile;
//     this.fileStatus = true;
//     this.fileName   = finalFile.name;

//     const reader = new FileReader();
//     reader.onload = () => {
//       const base64 = (reader.result as string).split(',')[1];
//       this.FileData = base64;
//     };
//     reader.readAsDataURL(finalFile);
//     this.uploadEnabled = true;
//   }

//   // ─── Result Upload ────────────────────────────────────────────────────────────
//   VerifyData(booking: any): void {
//     const formData = new FormData();
//     formData.append('BookingId',    booking.bookingId);
//     formData.append('UserEmailId',  booking.userEmailId);
//     formData.append('FilePath',     this.fileName);
//     formData.append('File',         this.FileData);

//     this.cifWebService.CIFResultsUploads(formData).subscribe({
//       next: (data: any) => {
//         const msg      = data.item1[0]['msg'];
//         const returnId = data.item1[0]['ReturnId'];

//         if (msg === 'Success' && returnId !== '0') {
//           Swal.fire({ title: 'Uploaded Successfully!', icon: 'success' })
//             .then(() => window.location.reload());
//         } else {
//           Swal.fire({ title: 'Results already uploaded for this test', icon: 'error' })
//             .then(() => window.location.reload());
//         }
//       },
//       error: () => {
//         Swal.fire({ title: 'Error', text: 'Failed to upload.', icon: 'error' });
//       },
//     });
//   }
// }
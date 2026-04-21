import {
  Component, OnInit, OnDestroy, signal, computed, inject, ViewChild, TemplateRef,
  ChangeDetectorRef,
  DestroyRef,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, CommonModule, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import {
  MOUCrudOperation,
  MouRecord,
  MouInsertPayload,
  MouUpdatePayload,
} from '../../services/mou-crud-operation.service';
import { LoginSessionService } from '../../services/login-session.service';
import { CifMenuBarComponent } from '../cif-menu-bar/cif-menu-bar.component';
 
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
export type FormMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-user-mou',
  standalone: true,
  imports: [CommonModule, FormsModule,  CifMenuBarComponent,],
  templateUrl: './user-mou.component.html',
  styleUrl: './user-mou.component.scss',
})
export class UserMouComponent implements OnInit, OnDestroy {

  @ViewChild('editModal') editModal!: TemplateRef<any>;
  private readonly mouService  = inject(MOUCrudOperation);
  private readonly CIFwebService = inject(LpuCIFWebService);
  
  private readonly cookieService = inject(CookieService);
  private readonly modalService  = inject(NgbModal);
  private readonly router        = inject(Router);
  private readonly destroy$      = new Subject<void>();
  
  // ── Session ───────────────────────────────────────────────────────────────
  readonly userEmail    = signal<string>('');
  readonly userName     = signal<string>('');
  
  // ── Data ──────────────────────────────────────────────────────────────────
  readonly mouList      = signal<MouRecord[]>([]);
  readonly isLoading    = signal<boolean>(false);
  readonly formMode     = signal<FormMode>(null);
  
  // ── Search + pagination ───────────────────────────────────────────────────
  readonly searchQuery  = signal<string>('');
  readonly currentPage  = signal<number>(1);
  readonly pageSize     = signal<number>(8);
  serverUrl     = '';
  
  readonly filteredList = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.mouList();
    return this.mouList().filter(m =>
      Object.values(m).some(v => String(v).toLowerCase().includes(q))
    );
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredList().length / this.pageSize()))
  );

  readonly pagedList = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredList().slice(start, start + this.pageSize());
  });

  // ── Form model ────────────────────────────────────────────────────────────
  form = {
    mouId:       '',
    mouTitle:    '',
    mouStartDate: '',
    mouEndDate:  '',
    mouRemarks:  '',
  };

  fileData64   = '';
  fileName     = '';
  fileStatus   = signal<boolean>(false);
  submitting   = signal<boolean>(false);

  // ── Edit row being modified ───────────────────────────────────────────────
  editingRow = signal<MouRecord | null>(null);


  private readonly AuthSession   = inject(LoginSessionService);
  private readonly cdr           = inject(ChangeDetectorRef);
  private readonly destroyRef    = inject(DestroyRef);

  private readonly platformId    = inject(PLATFORM_ID);

  
  UserRole:     any;
  UserId:       any;
  user_Email:   any;
  ServerUrl!:   string;


  loadingIndicator = false;   // ✅ typed boolean — prevents NG0100
   
  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadSession();
    this.loadMyMous();
    // ftp://umsftp@172.19.2.52/umsweb/webftp/CIFDocuments/CIFMouDocuments/
     this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/CIFMouDocuments/';//'http://172.19.2.52/umsweb/webftp/CIFDocuments/CIFMouDocuments/';
    this.ServerUrl = 'https://files.lpu.in/umsweb/CIFDocuments/CIFMouDocuments/';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSession(): void {

    if (!isPlatformBrowser(this.platformId)) { return; }

    this.ServerUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';

    const rawData = this.cookieService.get('InternalUserAuthData');

    if (!rawData || rawData.trim().length === 0) {
      Swal.fire({ title: 'Login Failed', icon: 'warning' });
      this.router.navigate(['/Home']);
      return;
    }

    try {
      const c        = JSON.parse(rawData);
      this.UserRole  = c.userRole?.length > 0 ? c.userRole : 'Internal User';
      this.user_Email = c.EmailId;
       this.userEmail.set(c.EmailId ?? '');
      this.userName.set(c.CandidateName ?? '');
    } catch {

      this.cookieService.delete('InternalUserAuthData');
      this.router.navigate(['/Home']);
      return;
    }




    // Promise.resolve().then(() => {
    //   this.getBookingDetails();
    //   this.cdr.detectChanges();
    // });
    // const raw = this.cookieService.get('authData');
    // if (!raw) { this.router.navigate(['/Home']); return; }
    // try {
    //   const p = JSON.parse(raw);
    //   this.userEmail.set(p.EmailId ?? '');
    //   this.userName.set(p.CandidateName ?? '');
    // } catch {
    //   this.router.navigate(['/Home']);
    // }
  }

  // ── Load user's MOUs ──────────────────────────────────────────────────────
  loadMyMous(): void {
    this.isLoading.set(true);
    this.mouService.viewMyMous(this.userEmail())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.mouList.set(res.item1 ?? []);
          this.currentPage.set(1);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  // ── Form open/close ───────────────────────────────────────────────────────
  openCreateForm(): void {
    this.resetForm();
    this.formMode.set('create');
  }

  openEditModal(row: MouRecord): void {
    this.editingRow.set(row);
    this.form = {
      mouId:        row.mouId ?? '',
      mouTitle:     row.mouTitle,
      mouStartDate: this.toInputDate(row.mouStartDate),
      mouEndDate:   this.toInputDate(row.mouEndDate),
      mouRemarks:   row.mouRemarks ?? '',
    };
    this.fileData64  = '';
    this.fileName    = '';
    this.fileStatus.set(false);
    this.modalService.open(this.editModal, { size: 'lg', centered: true });
  }

  closeForm(): void {
    this.formMode.set(null);
    this.resetForm();
  }

  // ── File handling ─────────────────────────────────────────────────────────
  onFileSelected(event: Event): void {
    this.fileStatus.set(false);
    const target = event.target as HTMLInputElement;
    const file   = target.files?.[0];
    if (!file) return;

    if (file.size > 5_242_880) {
      Swal.fire({ title: 'File too large', text: 'Max allowed size is 5 MB.', icon: 'warning' });
      target.value = '';
      return;
    }

    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      Swal.fire({ title: 'Invalid file type', text: 'Only PDF and Word documents are allowed.', icon: 'warning' });
      target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.fileData64 = (reader.result as string).split(',')[1];
      this.fileName   = file.name;
      this.fileStatus.set(true);
    };
    reader.readAsDataURL(file);
  }

  // ── Submit: Insert ────────────────────────────────────────────────────────
  submitCreate(ngForm: NgForm): void {
    if (ngForm.invalid) { ngForm.form.markAllAsTouched(); return; }
    if (!this.fileStatus()) {
      Swal.fire({ title: 'Document required', text: 'Please upload the MOU document.', icon: 'warning' });
      return;
    }

    this.submitting.set(true);
    const payload: MouInsertPayload = {
      action:          'Insert',
      mouTitle:        this.form.mouTitle,
      mouDocumentData: this.fileData64,
      mouDocumentUrl:  this.fileName,
      mouStartDate:    this.form.mouStartDate,
      mouEndDate:      this.form.mouEndDate,
      mouRemarks:      this.form.mouRemarks,
      userId:          this.userEmail(),
    };

    this.mouService.insertMou(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          const ok = res.item1?.[0]?.msg === 'Success';
          this.submitting.set(false);
          if (ok) {
            Swal.fire({ title: 'MOU Submitted!', icon: 'success' })
              .then(() => { this.closeForm(); this.loadMyMous(); });
          } else {
            Swal.fire({ title: 'Submission Failed', icon: 'error' });
          }
        },
        error: () => {
          this.submitting.set(false);
          Swal.fire({ title: 'Error', text: 'Could not submit MOU.', icon: 'error' });
        },
      });
  }

  // ── Submit: Update ────────────────────────────────────────────────────────
  submitUpdate(ngForm: NgForm, modal: any): void {
    if (ngForm.invalid) { ngForm.form.markAllAsTouched(); return; }
    this.submitting.set(true);

    const payload: MouUpdatePayload = {
      action:      'Update',
      mouTitle:        this.form.mouTitle,
      mouDocumentData: this.fileData64,
      mouDocumentUrl:  this.fileName,
      mouStartDate:    this.form.mouStartDate,
      mouEndDate:      this.form.mouEndDate,
      mouRemarks:      this.form.mouRemarks,
      mouId:       this.form.mouId,
      loginName:   this.userEmail(),
        userId:  this.userEmail(),
      // ...(this.fileData64 ? { mouDocumentData: this.fileData64, mouDocumentUrl: this.fileName } : {}),
    };

    this.mouService.updateMou(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          const ok = res.item1?.[0]?.msg === 'Success';
          this.submitting.set(false);
          if (ok) {
            Swal.fire({ title: 'MOU Updated!', icon: 'success' })
              .then(() => { modal.close(); this.loadMyMous(); });
          } else {
            Swal.fire({ title: 'Update Failed', icon: 'error' });
          }
        },
        error: () => {
          this.submitting.set(false);
          Swal.fire({ title: 'Error', text: 'Could not update MOU.', icon: 'error' });
        },
      });
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  onSearch(value: string): void { this.searchQuery.set(value); this.currentPage.set(1); }
  nextPage(): void { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }
  prevPage(): void { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  statusLabel(row: MouRecord): string {
    if (row.mouStatus === '1') return 'Expired';
    if (row.isApproved === 1)  return 'Approved';
    if (row.isApproved === 0)  return 'Pending';
    return 'Unknown';
  }

  statusClass(row: MouRecord): string {
    if (row.mouStatus === '1') return 'badge-expired';
    if (row.isApproved === 1)  return 'badge-approved';
    return 'badge-pending';
  }

 

  private resetForm(): void {
    this.form = { mouId: '', mouTitle: '', mouStartDate: '', mouEndDate: '', mouRemarks: '' };
    this.fileData64 = '';
    this.fileName   = '';
    this.fileStatus.set(false);
  }

  /** Convert "06 Jan 2024" (SP format 106) to "2024-01-06" for <input type="date"> */
  private toInputDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

   viewDocument(url: string | undefined): void {
    // this.onDownloadFile(this.serverUrl + url);

    window.open(this.serverUrl + url, '_blank');
    // this.onDownloadFile(this.serverUrl + url);

  }
 
   private onDownloadFile(remoteUrl: string): void {
    Swal.fire({ title: 'Downloading...', didOpen: () => Swal.showLoading(null) });

     this.CIFwebService.downloadFile(remoteUrl).subscribe({
      next: (blob: Blob) => {
        const url  = URL.createObjectURL(blob);
        const link = Object.assign(document.createElement('a'), {
          href:     url,
          download: remoteUrl.split('/').pop() ?? 'Document.pdf',
        });
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        Swal.close();
      },
      error: async err => {
        Swal.close();
        const msg = err.error instanceof Blob
          ? (JSON.parse(await err.error.text())).message ?? 'Download failed'
          : 'Could not connect to the server';
        Swal.fire('Error', msg, 'error');
      },
    });
  }
}

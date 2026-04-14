import {
  Component, OnInit, OnDestroy, signal, computed, inject, ViewChild, TemplateRef,
  ChangeDetectorRef,
  DestroyRef,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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

export type FormMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-user-mou',
  standalone: true,
  imports: [CommonModule, FormsModule,CifMenuBarComponent],
  templateUrl: './new-Mou.html',
  styleUrl: './new-Mou.scss',
})
export class NewUserMouComponent implements OnInit, OnDestroy {

  @ViewChild('editModal') editModal!: TemplateRef<any>;
 serverUrl     = '';
  private readonly mouService    = inject(MOUCrudOperation);
  private readonly cookieService = inject(CookieService);
  private readonly modalService  = inject(NgbModal);
  private readonly router        = inject(Router);
  private readonly destroy$      = new Subject<void>();

    private readonly AuthSession   = inject(LoginSessionService);
  private readonly cdr           = inject(ChangeDetectorRef);
  private readonly destroyRef    = inject(DestroyRef);

  private readonly platformId    = inject(PLATFORM_ID);

  
  UserRole:     any;
  UserId:       any;
  user_Email:   any;
  ServerUrl!:   string;


  // ── Session ───────────────────────────────────────────────────────────────
  readonly userEmail = signal<string>('');
  readonly userName  = signal<string>('');

  // ── Data ──────────────────────────────────────────────────────────────────
  readonly mouList   = signal<MouRecord[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly formMode  = signal<FormMode>(null);

  // ── Search + pagination ───────────────────────────────────────────────────
  readonly searchQuery = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly pageSize    = signal<number>(8);

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
    mouId:        '',
    mouTitle:     '',
    mouStartDate: '',
    mouEndDate:   '',
    mouRemarks:   '',
  };

  // ── File state ────────────────────────────────────────────────────────────
  fileData64 = '';
  fileName   = '';

  // True once the user has picked a valid file in the current session
  readonly fileStatus = signal<boolean>(false);

  // The filename of the document already saved against this MOU (edit mode).
  // Displayed so the user knows what is currently attached before replacing it.
  readonly editExistingFileName = signal<string>('');

  readonly submitting = signal<boolean>(false);

  // ── Edit row ──────────────────────────────────────────────────────────────
  editingRow = signal<MouRecord | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadSession();
    this.loadMyMous();

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSession(): void {
    if (!isPlatformBrowser(this.platformId)) { return; }
    this.serverUrl = 'https://172.19.2.52/umsweb/webftp/CIFDocuments/CIFMouDocuments/';
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

  }

  // ── Load ──────────────────────────────────────────────────────────────────
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

  // ── Create form ───────────────────────────────────────────────────────────
  openCreateForm(): void {
    this.resetForm();
    this.formMode.set('create');
  }

  closeForm(): void {
    this.formMode.set(null);
    this.resetForm();
  }

  // ── Edit modal ────────────────────────────────────────────────────────────
  openEditModal(row: MouRecord): void {
    this.editingRow.set(row);

    this.form = {
      mouId:        row.mouId ?? '',
      mouTitle:     row.mouTitle,
      mouStartDate: this.toInputDate(row.mouStartDate),
      mouEndDate:   this.toInputDate(row.mouEndDate),
      mouRemarks:   row.mouRemarks ?? '',
    };

    // Reset file state — user MUST upload a new file to proceed
    this.fileData64 = '';
    this.fileName   = '';
    this.fileStatus.set(false);

    // Show the previously attached filename so the user knows what exists
    this.editExistingFileName.set(
      row.mouDocumentUrl
        ? row.mouDocumentUrl.split('/').pop() ?? row.mouDocumentUrl
        : ''
    );

    this.modalService.open(this.editModal, { size: 'lg', centered: true });
  }

  // ── File handling (shared by create + edit) ───────────────────────────────
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

    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
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
          this.submitting.set(false);
          if (res.item1?.[0]?.msg === 'Success') {
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

   
  submitUpdate(ngForm: NgForm, modal: any): void {
    if (ngForm.invalid) { ngForm.form.markAllAsTouched(); return; }

  
    if (!this.fileStatus()) {
      Swal.fire({
        title: 'Document required',
        text:  'Please upload the MOU document to proceed with the update.',
        icon:  'warning',
      });
      return;
    }

    this.submitting.set(true);

    // ✅ mouDocumentData and mouDocumentUrl are now always sent (not conditional)
    const payload: MouUpdatePayload = {
      action:          'Update',
      mouId:           this.form.mouId,
      mouTitle:        this.form.mouTitle,
      mouDocumentData: this.fileData64,
      mouDocumentUrl:  this.fileName,
      mouStartDate:    this.form.mouStartDate,
      mouEndDate:      this.form.mouEndDate,
      mouRemarks:      this.form.mouRemarks,
      loginName:       this.userEmail(),
      userId:          this.userEmail(),
    };

    this.mouService.updateMou(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.submitting.set(false);
          if (res.item1?.[0]?.msg === 'Success') {
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

  // ── Pagination & search ───────────────────────────────────────────────────
  onSearch(value: string): void { this.searchQuery.set(value); this.currentPage.set(1); }
  nextPage(): void { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }
  prevPage(): void { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  pageNumbers(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  statusLabel(row: MouRecord): string {
    if (row.mouStatus === '0')   return 'Expired';
    if (row.mouStatus === '1')   return 'Active';  
    if (row.isApproved === 'True')  return 'Approved';
    if (row.isApproved === 'False')  return 'Disapproved';
    return 'Pending';
  }

  statusClass(row: MouRecord): string {
    if (row.mouStatus === '0')   return 'badge-expired';
    if (row.mouStatus === '1')   return 'badge-approved';
    if (row.isApproved === 'True')  return 'badge-approved';
    if (row.isApproved === 'False')  return 'badge-disapproved';
    return 'badge-pending';
  }

  viewDocument(url: string | undefined): void {
    // if (url) window.open(url, '_blank');
      window.open(this.serverUrl + url, '_blank');
  }

  private resetForm(): void {
    this.form = { mouId: '', mouTitle: '', mouStartDate: '', mouEndDate: '', mouRemarks: '' };
    this.fileData64 = '';
    this.fileName   = '';
    this.fileStatus.set(false);
    this.editExistingFileName.set('');
  }

  private toInputDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  }
}

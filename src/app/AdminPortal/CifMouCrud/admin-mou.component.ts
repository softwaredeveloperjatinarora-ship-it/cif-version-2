import {
  Component, OnInit, OnDestroy, signal, computed, inject, ViewChild, TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
// import { MOUCrudOperation } from '../../services/mou-crud-operation.service';

import {
  MOUCrudOperation,
  MouRecord,
  MouApprovePayload,
  MouDeletePayload,
} from '../../services/mou-crud-operation.service';
import { AdminDashboardComponent } from '../AdminDashboard/AdminDashboard';

 
@Component({
  selector: 'app-admin-mou',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminDashboardComponent],
  templateUrl: './admin-mou.component.html',
  styleUrl: './admin-mou.component.scss',
})
export class AdminMouComponent implements OnInit, OnDestroy {

  @ViewChild('remarksModal') remarksModal!: TemplateRef<any>;

  private readonly mouService    = inject(MOUCrudOperation);
  private readonly cookieService = inject(CookieService);
  private readonly modalService  = inject(NgbModal);
  private readonly router        = inject(Router);
  private readonly destroy$      = new Subject<void>();

  // ── Session ───────────────────────────────────────────────────────────────
  readonly adminEmail    = signal<string>('');
  readonly adminName     = signal<string>('');

  // ── Data ──────────────────────────────────────────────────────────────────
  readonly mouList       = signal<MouRecord[]>([]);
  readonly isLoading     = signal<boolean>(false);

  // ── Filters ───────────────────────────────────────────────────────────────
  readonly searchQuery   = signal<string>('');
  readonly filterStatus  = signal<string>(''); 
  readonly filterApproved = signal<string>('');
  readonly filterUserType = signal<string>('');

  // ── Pagination ────────────────────────────────────────────────────────────
  readonly currentPage   = signal<number>(1);
  readonly pageSize      = signal<number>(5);

  readonly filteredList = computed(() => {
    let data = this.mouList();
    const q  = this.searchQuery().toLowerCase().trim();
    const st = this.filterStatus();
    const ap = this.filterApproved();
    const ut = this.filterUserType();

    if (q)  data = data.filter(m => Object.values(m).some(v => String(v).toLowerCase().includes(q)));
    if (st) data = data.filter(m => String(m.mouStatus) === st);
    if (ap) data = data.filter(m => String(m.isApproved) === ap);
    if (ut) data = data.filter(m => m.userType === ut);

    return data;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredList().length / this.pageSize()))
  );

  readonly pagedList = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredList().slice(start, start + this.pageSize());
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  readonly statTotal    = computed(() => this.mouList().length);
  readonly statApproved = computed(() => this.mouList().filter(m => m.isApproved === 'True').length);
  readonly statPending  = computed(() => this.mouList().filter(m => m.isApproved !=='False').length);
  readonly statRejected  = computed(() => this.mouList().filter(m => m.isApproved ==='False').length);
  readonly statExpired  = computed(() => this.mouList().filter(m => m.mouStatus === 'True').length);

  // ── Modal state ───────────────────────────────────────────────────────────
  pendingAction  = signal<'Approve' | 'DisApprove' | 'Delete' | null>(null);
  pendingRow     = signal<MouRecord | null>(null);
  approvalRemark = signal<string>('');
  processing     = signal<boolean>(false);

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // this.loadSession();
    this.loadAllMous();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSession(): void {
    const raw = this.cookieService.get('authData');
    if (!raw) { this.router.navigate(['/Home']); return; }
    try {
      const p = JSON.parse(raw);
      this.adminEmail.set(p.EmailId ?? '');
      this.adminName.set(p.CandidateName ?? '');
    } catch {
      this.router.navigate(['/Home']);
    }
  }

  loadAllMous(): void {
    this.isLoading.set(true);
    this.mouService.viewAllMous()
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

  // ── Open confirmation modal ───────────────────────────────────────────────
  openAction(action: 'Approve' | 'DisApprove' | 'Delete', row: MouRecord): void {
    this.pendingAction.set(action);
    this.pendingRow.set(row);
    this.approvalRemark.set('');
    this.modalService.open(this.remarksModal, { size: 'md', centered: true });
  }

  // ── Confirm action ────────────────────────────────────────────────────────
  confirmAction(modal: any): void {
    const action = this.pendingAction();
    const row    = this.pendingRow();
    if (!action || !row) return;

    this.processing.set(true);

    if (action === 'Delete') {
      const payload: MouDeletePayload = {
        action:    'Delete',
        mouId:     row.mouId ?? '',
        mouTitle:  row.mouTitle,
        userId:    row.userEmailId,
        loginName: this.adminEmail(),
      };
      this.mouService.deleteMou(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: res => this.handleResponse(res, modal, 'MOU deleted successfully.'),
          error: () => this.handleError(),
        });
      return;
    }

    const payload: MouApprovePayload = {
      action:          action,
      mouId:           row.mouId ?? '',
      userId:          row.userEmailId,
      approvalRemarks: this.approvalRemark(),
      loginName:       this.adminEmail(),
    };

    const call$ = action === 'Approve'
      ? this.mouService.approveMou(payload)
      : this.mouService.disapproveMou(payload);

    call$.pipe(takeUntil(this.destroy$)).subscribe({
      next: res => this.handleResponse(res, modal,
        action === 'Approve' ? 'MOU approved successfully.' : 'MOU disapproved.'),
      error: () => this.handleError(),
    });
  }

  private handleResponse(res: any, modal: any, successMsg: string): void {
    this.processing.set(false);
    const ok = res.item1?.[0]?.msg === 'Success';
    modal.close();
    if (ok) {
      Swal.fire({ title: successMsg, icon: 'success' }).then(() => this.loadAllMous());
    } else {
      Swal.fire({ title: 'Operation Failed', icon: 'error' });
    }
  }

  private handleError(): void {
    this.processing.set(false);
    Swal.fire({ title: 'Error', text: 'Something went wrong. Please try again.', icon: 'error' });
  }

  // ── Filters & pagination ──────────────────────────────────────────────────
  onSearch(value: string): void { this.searchQuery.set(value); this.currentPage.set(1); }
  onFilterChange(): void        { this.currentPage.set(1); }
  clearFilters(): void {
    this.searchQuery.set('');
    this.filterStatus.set('');
    this.filterApproved.set('');
    this.filterUserType.set('');
    this.currentPage.set(1);
  }

  nextPage(): void { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }
  prevPage(): void { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  pageNumbers(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  viewDocument(url: string | undefined): void {
    if (url) window.open(url, '_blank');
  }

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


  actionLabel(): string {
    const a = this.pendingAction();
    if (a === 'Approve')    return 'Approve';
    if (a === 'DisApprove') return 'Disapprove';
    return 'Delete';
  }

  actionColor(): string {
    const a = this.pendingAction();
    if (a === 'Approve') return 'confirm-green';
    if (a === 'Delete')  return 'confirm-red';
    return 'confirm-orange';
  }

  needsRemark(): boolean {
    return this.pendingAction() === 'Approve' || this.pendingAction() === 'DisApprove';
  }
}

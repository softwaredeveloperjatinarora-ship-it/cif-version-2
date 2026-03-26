import { 
  Component, OnInit, ViewChild, inject, signal, computed, 
  ChangeDetectorRef, TemplateRef, ViewEncapsulation 
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';


import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';


import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StaffMenuComponent } from "../StaffMenu/StaffMenu";
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { LoginSessionService } from '../../services/login-session.service';

import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-staff-action-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbModule, NgSelectModule,StaffMenuComponent],
  templateUrl: './TakeActions.html',
  styleUrls: ['./TakeActions.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StaffActionBookingsComponent implements OnInit {
  private cifService = inject(LpuCIFWebService);
  private modalService = inject(NgbModal);
  private cookieService = inject(CookieService);
  private cdr = inject(ChangeDetectorRef);
  private document = inject(DOCUMENT);

  readonly loadingIndicator    = signal<boolean>(false);
  allBookings = signal<any[]>([]);
  selectedStatus = signal<string>('All');
  
  filteredBookings = computed(() => {
    const status = this.selectedStatus();
    const data = this.allBookings();
    if (status === 'All') return data;
    return data.filter(item => item.paymentStatus === status);
  });

  statusOptions = [
    { label: 'All', value: 'All' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Completed', value: 'Completed' }
  ];
  NoResults = '';
  fileStatus = false;
  FileData: any;
  fileName: string = '';

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData() {
    this.loadingIndicator.set(true);
    const startTime = Date.now();
     
    this.cifService.GetAllBooking().subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.allBookings.set(res);
          this.NoResults = '';
        } else {
          this.NoResults = 'No Details';
        }
        const delay = Math.max(1500 - (Date.now() - startTime), 0);
        setTimeout(() => this.loadingIndicator.set(false), delay);
;
      },
      error: () => {
        this.loadingIndicator.set(false);
        Swal.fire('Error', 'Failed to fetch bookings', 'error');
      }
    });
  }

  exportToExcel() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredBookings());
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
    XLSX.writeFile(wb, `StaffBookings_${new Date().getTime()}.xlsx`);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('Warning', 'File size exceeds 5MB', 'warning');
        event.target.value = '';
        return;
      }
      this.fileName = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.FileData = base64.split(',')[1];
        this.fileStatus = true;
      };
      reader.readAsDataURL(file);
    }
  }



























  VerifyData(BookingData: any) {
    this.loadingIndicator.set(true);
    const startTime = new Date().getTime();
    if (this.FileData) {
      const formData = new FormData();
      formData.append('BookingId', BookingData.bookingId);
      formData.append('UserEmailId', BookingData.userId);
      formData.append('CreatedBy', BookingData.userId);
      formData.append('FilePath', this.fileName);
      formData.append('File', this.FileData);

      this.cifService.CIFResultsUploads(formData).subscribe({
        next: (data: any) => {
          const result = data.item1[0]['msg']; 
          const returnId = data.item1[0]['ReturnId'];

          if (result === 'Success' && returnId !== '0') {
            Swal.fire({
              title: 'Uploaded Successfully!',
              icon: 'success'
            }).then(() => {
              window.location.reload();
            });
          } else {
            Swal.fire({
              title: 'Already Uploaded Results for this Test',
              icon: 'error'
            }).then(() => {
              window.location.reload();
            });
          }
          const elapsed = new Date().getTime() - startTime;
          const remainingDelay = Math.max(500 - elapsed, 0); 

          setTimeout(() => {
            this.loadingIndicator.set(false);
          }, remainingDelay);
        },
        error: () => {
          Swal.fire({
            title: 'Error',
            text: 'Failed to Upload.',
            icon: 'error'
          });
        }
      });
    }
    else {
      Swal.fire({
        title: 'Error',
        text: 'Kindly Upload File.',
        icon: 'error'
      });
    }
  }
}
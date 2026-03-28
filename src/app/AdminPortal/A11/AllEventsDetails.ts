import { Component, OnInit, inject, signal, computed, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

import { NgSelectModule } from '@ng-select/ng-select';
import swal from 'sweetalert2';

import { LoginSessionService } from '../../services/login-session.service';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

 
import { AdminDashboardComponent } from '../AdminDashboard/AdminDashboard';

@Component({
  selector: 'app-admin-action-cif-events',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbModule,AdminDashboardComponent],
  templateUrl: './AllEventsDetails.html',
  styleUrls: ['./AllEventsDetails.scss']
})
 
export class AdminActionCifEvents implements OnInit {
  private cifService = inject(LpuCIFWebService);
  private modalService = inject(NgbModal);
  private fb = inject(FormBuilder);
  private cookieService = inject(CookieService);

  loadingIndicator = signal(false);
  isLoading = signal(false);
  allEvents = signal<any[]>([]);
  searchQuery = signal('');
  
  isRejecting = signal(false);
  rejectReason = signal('');
  
  userId = signal('');
  cifEventRegistration!: FormGroup;
  selectedEvent = signal<any>(null);
  
  consentLetterData = '';
  consentLetterFileName = '';

  filteredEvents = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const data = this.allEvents();
    if (!query) return data;
    return data.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    this.initForm();
    this.fetchEvents();
  }

  initForm() {
    this.cifEventRegistration = this.fb.group({
      EventId: [0],
      EventName: ['', Validators.required],
      EventDescription: ['', Validators.required],
      EventDate: ['', Validators.required],
      EventLocation: ['', Validators.required],
      RegistrationLink: [''],
      IsActive: [true]
    });
  }

  fetchEvents() {

    this.loadingIndicator.set(true);
    const startTime = Date.now();
    this.cifService.GetAllEventDetails().subscribe({
      next: (res) => {
        this.allEvents.set(res.item1 || []);
        console.log(JSON.stringify(res))
         const delay = Math.max(2500 - (Date.now() - startTime), 0);
        setTimeout(() => this.loadingIndicator.set(false), delay);
        // this.loadingIndicator.set(false);
      },
      error: () => this.loadingIndicator.set(false)
    });
  }

  // --- Action Handlers ---

  openActionModal(event: any, content: TemplateRef<any>, mode: 'edit' | 'reject') {
    this.selectedEvent.set(event);
    this.isRejecting.set(mode === 'reject');
    this.rejectReason.set('');

    this.cifEventRegistration.patchValue({
      EventId: event.eventId,
      EventName: event.eventName,
      EventDescription: event.eventDescription,
      EventDate: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '',
      EventLocation: event.eventLocation,
      RegistrationLink: event.registrationLink,
      IsActive: event.isActive
    });

    this.modalService.open(content, { size: 'lg', centered: true });
  }

   
  confirmDisapprove() {
    if (!this.rejectReason().trim()) {
      Swal.fire('Required', 'Please enter a rejection reason', 'error');
      return;
    }

    this.isLoading.set(true);
    const formData = new FormData();
    formData.append('EventId', this.selectedEvent().eventId);
    formData.append('DisapprovalReason', this.rejectReason());
    formData.append('UpdatedBy', this.userId());

    this.cifService.CIFUpdateEventsStatus(formData).subscribe({
      next: (data: any) => {
        this.isLoading.set(false);
        if (data.responseData === 'Cancel') {
          Swal.fire('No Change!', '', 'error');
        } else {
          Swal.fire('Rejected Successfully!', '', 'success');
          this.modalService.dismissAll();
          this.fetchEvents();
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  submitUpdate() {
    if (this.cifEventRegistration.invalid) return;
    this.isLoading.set(true);

    const formData = new FormData();
    const vals = this.cifEventRegistration.value;

    formData.append('EventId', vals.EventId);
    formData.append('EventName', vals.EventName);
    formData.append('EventDescription', vals.EventDescription);
    formData.append('EventDate', vals.EventDate);
    formData.append('EventLocation', vals.EventLocation);
    formData.append('IsActive', vals.IsActive);
    formData.append('CreatedBy', this.userId());

    if (this.consentLetterData) {
      formData.append('ImageUrl', this.consentLetterFileName);
      formData.append('ImageUrlData', this.consentLetterData);
    } else {
      formData.append('ExistingImageUrl', this.selectedEvent()?.imageUrl || '');
    }

    this.cifService.CIFNewEventsDetails(formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        Swal.fire('Success', 'Event updated!', 'success');
        this.modalService.dismissAll();
        this.fetchEvents();
      },
      error: () => this.isLoading.set(false)
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.consentLetterFileName = file.name;
      const reader = new FileReader();
      reader.onload = () => this.consentLetterData = (reader.result as string).split(',')[1];
      reader.readAsDataURL(file);
    }
  }

  exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(this.filteredEvents());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Events');
    XLSX.writeFile(wb, 'CIF_Events_Report.xlsx');
  }
}

// export class AdminActionCifEvents implements OnInit {
//   private cifService = inject(LpuCIFWebService);
//   private modalService = inject(NgbModal);
//   private cookieService = inject(CookieService);
//   private fb = inject(FormBuilder);

//   // State Signals
//   loadingIndicator = signal(false);
//   isLoading = signal(false); // Form submission state
//   instrumentData = signal<any[]>([]);
//   searchQuery = signal('');
  
//   // Auth/Session
//   userId = signal('');

//   // Form Group
//   cifEventRegistration!: FormGroup;
//   editEvent: any = {};
  
//   // File Upload State
//   consentLetterData = '';
//   consentLetterFileName = '';
//   isImageValid = signal(false);

//   // Computed Search Logic
//   filteredEvents = computed(() => {
//     const query = this.searchQuery().toLowerCase().trim();
//     if (!query) return this.instrumentData();
//     return this.instrumentData().filter(item =>
//       Object.values(item).some(val => String(val).toLowerCase().includes(query))
//     );
//   });

//   ngOnInit(): void {
//     this.initAuth();//
//     this.initForm();
//     this.fetchEvents();
//   }

//   private initAuth(): void {
//     const cookieData = this.cookieService.get('authData');
//     if (cookieData) {
//       const parsed = JSON.parse(cookieData);
//       this.userId.set(parsed.EmailId); // Mapping EmailId to CreatedBy as per original logic
//     }
//   }

//   private initForm(): void {
//     this.cifEventRegistration = this.fb.group({
//       EventId: [0],
//       EventName: ['', Validators.required],
//       EventDescription: ['', Validators.required],
//       EventDate: ['', Validators.required],
//       EventLocation: ['', Validators.required],
//       RegistrationLink: [''],
//       IsActive: [true]
//     });
//   }

//   fetchEvents(): void {
//     this.loadingIndicator.set(true);
//     this.cifService.GetAllEventDetails().subscribe({
//       next: (res) => {
//         this.instrumentData.set(res.item1 || []);
//         this.loadingIndicator.set(false);
//       },
//       error: () => this.loadingIndicator.set(false)
//     });
//   }

//   onFileSelectedConsentLetter(event: any): void {
//     const file = event.target.files[0];
//     if (file) {
//       this.consentLetterFileName = file.name;
//       const reader = new FileReader();
//       reader.onload = () => {
//         const base64 = reader.result as string;
//         this.consentLetterData = base64.split(',')[1];
//         this.isImageValid.set(true);
//       };
//       reader.readAsDataURL(file);
//     }
//   }

//   openEditModal(event: any, content: TemplateRef<any>): void {
//     this.editEvent = { ...event };
//     this.isImageValid.set(!!event.imageUrl); // Valid if exists or new one selected
    
//     this.cifEventRegistration.patchValue({
//       EventId: event.eventId,
//       EventName: event.eventName,
//       EventDescription: event.eventDescription,
//       EventDate: this.formatDateForInput(event.eventDate),
//       EventLocation: event.eventLocation,
//       RegistrationLink: event.registrationLink,
//       IsActive: event.isActive
//     });

//     this.modalService.open(content, { size: 'lg', centered: true });
//   }

//   formatDateForInput(dateString: string): string {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     return date.toISOString().split('T')[0];
//   }

//   submitForm(): void {
//     if (this.cifEventRegistration.invalid) return;

//     this.isLoading.set(true);
//     const formValues = this.cifEventRegistration.value;
//     const formData = new FormData();

//     formData.append('EventId', formValues.EventId);
//     formData.append('EventName', formValues.EventName);
//     formData.append('EventDescription', formValues.EventDescription);
//     formData.append('EventDate', formValues.EventDate);
//     formData.append('EventLocation', formValues.EventLocation);
//     formData.append('RegistrationLink', formValues.RegistrationLink);
//     formData.append('IsActive', formValues.IsActive);
//     formData.append('CreatedBy', this.userId());

//     if (this.isImageValid() && this.consentLetterData) {
//       formData.append('ImageUrl', this.consentLetterFileName);
//       formData.append('ImageUrlData', this.consentLetterData);
//     }

//     this.cifService.CIFNewEventsDetails(formData).subscribe({
//       next: () => {
//         this.isLoading.set(false);
//         Swal.fire('Success', 'Event updated successfully!', 'success')
//           .then(() => {
//             this.modalService.dismissAll();
//             this.fetchEvents();
//           });
//       },
//       error: () => {
//         this.isLoading.set(false);
//         Swal.fire('Error', 'Failed to update event', 'error');
//       }
//     });
//   }

//   exportToExcel(): void {
//     const ws = XLSX.utils.json_to_sheet(this.instrumentData());
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Events');
//     XLSX.writeFile(wb, 'CIF_Events_Details.xlsx');
//   }
// }
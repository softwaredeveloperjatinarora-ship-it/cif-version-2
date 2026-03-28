import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

import { NgSelectModule } from '@ng-select/ng-select';
import swal from 'sweetalert2';

import { LoginSessionService } from '../../services/login-session.service';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

 
import { AdminDashboardComponent } from '../AdminDashboard/AdminDashboard';
import { UpCommingEvents } from '../../cif_webPortal/up-comming-events/up-comming-events';
import { UpcomingEventsComponent } from "../../cif_webPortal/UpcomingEvents/UpcomingEventsDetails";

@Component({
  selector: 'app-admin-new-events-data',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule, AdminDashboardComponent,  UpcomingEventsComponent],
  templateUrl: './EventUploads.html',
  styleUrls: ['./EventUploads.scss']
})
export class AdminNewEventsDataComponent implements OnInit {
  private cifService = inject(LpuCIFWebService);
  private fb = inject(FormBuilder);
  private cookieService = inject(CookieService);

  readonly serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';
  // State Management via Signals
  loadingIndicator = signal(false);
  isLoading = signal(false); // Form submission state
  events = signal<any[]>([]);
  
  // File Upload State
  consentLetterData = '';
  consentLetterFileName = '';

  CIFEventRegistration!: FormGroup;
  userEmail = signal('');

  // Static Fallback Data preserved from original
  private readonly staticEvents = [
    {
      imageUrl: 'https://www.lpu.in/lpu-assets/images/cif/Scanning-Electron-Microscope.webp',
      eventName: 'Workshop on Scanning Electron Microscope',
      eventDate: '(29 - 30 March 2024)'
    },
    {
      imageUrl: 'https://www.lpu.in/lpu-assets/images/cif/summer-training-programme-2025.webp',
      eventName: 'ANRF Sponsored Summer Training Programme',
      eventDate: '(2 June - 11 July 2025)'
    }
  ];

  ngOnInit(): void {
    // this.initAuth();
    this.initForm();
    this.loadAllEvents();
  }

  private initAuth(): void {
    const cookieData = this.cookieService.get('authData');
    if (cookieData) {
      const parsed = JSON.parse(cookieData);
      this.userEmail.set(parsed.EmailId);
    }
  }

  private initForm(): void {
    this.CIFEventRegistration = this.fb.group({
      EventName: ['', Validators.required],
      EventDetails: ['', Validators.required],
      EventDate: ['', Validators.required],
      ImageUrl: ['']
    });
  }

  loadAllEvents(): void {
    this.loadingIndicator.set(true);
    const startTime = Date.now();

    this.cifService.GetAllEventDetails().subscribe({
      next: (res) => {
        const data = res.item1 && res.item1.length > 0 ? res.item1 : this.staticEvents;
        this.events.set(data);
        
        // console.log(JSON.stringify(res)+ '*****')
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(2500 - elapsed, 0);
        setTimeout(() => this.loadingIndicator.set(false), remaining);
      },
      error: () => this.loadingIndicator.set(false)
    });
  }

  onFileSelectedConsentLetter(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.consentLetterFileName = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.consentLetterData = base64.split(',')[1];
        this.CIFEventRegistration.patchValue({ ImageUrl: file.name });
      };
      reader.readAsDataURL(file);
    }
  }

  submitForm(): void {
    if (this.CIFEventRegistration.invalid) {
      Object.values(this.CIFEventRegistration.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    const formValues = this.CIFEventRegistration.value;
    const formData = new FormData();

    formData.append('EventName', formValues.EventName);
    formData.append('EventDetails', formValues.EventDetails);
    formData.append('EventDate', formValues.EventDate);
    formData.append('ImageUrl', this.consentLetterFileName);
    formData.append('ImageUrlData', this.consentLetterData);
    formData.append('CreatedBy', this.userEmail());

    this.cifService.CIFNewEventsDetails(formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        Swal.fire('Success', 'Event added successfully!', 'success').then(() => {
          this.CIFEventRegistration.reset();
          this.consentLetterData = '';
          this.consentLetterFileName = '';
          this.loadAllEvents();
        });
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Error', 'Failed to store event data', 'error');
      }
    });
  }

  // Helper for Carousel chunking
  getChunkedEvents(size: number) {
    const arr = this.events();
    const results = [];
    for (let i = 0; i < arr.length; i += size) {
      results.push(arr.slice(i, i + size));
    }
    return results;
  }
}
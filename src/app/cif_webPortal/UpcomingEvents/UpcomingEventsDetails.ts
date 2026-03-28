import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgbCarousel, NgbModule } from '@ng-bootstrap/ng-bootstrap';

// Services
import { NgSelectModule } from '@ng-select/ng-select';
import swal from 'sweetalert2';

import { LoginSessionService } from '../../services/login-session.service';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

 


@Component({
  selector: 'app-Upcoming-Events',
  standalone: true,
  imports: [CommonModule, NgbModule],
  templateUrl: './UpcomingEventsDetails.html',
  styleUrls: ['./UpcomingEventsDetails.scss']
})
export class UpcomingEventsComponent implements OnInit {
  private cifService = inject(LpuCIFWebService);
  private router = inject(Router);
  readonly isLoading       = signal(true);

  @ViewChild('ngbCarousel', { static: false }) carousel!: NgbCarousel;

  // State Management via Signals
  loadingIndicator = signal(false);
  allEvents = signal<any[]>([]);
  serverError = signal(false);
  errorMessage = signal('');
  
  // Configuration
  autoSlideInterval = 5000;
  serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';

  ngOnInit(): void {
    this.fetchEvents();
  }

  fetchEvents(): void {
    this.loadingIndicator.set(true);
    const startTime = Date.now();

    this.cifService.GetAllEventDetails().subscribe({
      next: (res) => {
        this.allEvents.set(res.item1 || []);
        
        const delay = Math.max(800 - (Date.now() - startTime), 10);
        setTimeout(() => this.loadingIndicator.set(false), delay);
        
        // setTimeout(() => {this.loadingIndicator.set(false);}, delay);
      },
      error: (err) => {
        console.error('Events Load Error:', err);
        this.loadingIndicator.set(false);
        this.serverError.set(true);
        this.errorMessage.set('Data Server Connection error, Try again later');
        this.allEvents.set([]); // Fallback to empty as per original logic
      }
    });
  }

  // Navigation Logic preserved from original
  goToEventC(eventId: any): void {
    if (!eventId) return;
    this.router.navigate(['/Events', eventId]);
  }

  // Carousel controls
  prev(): void {
    this.carousel?.prev();
  }

  next(): void {
    this.carousel?.next();
  }
}
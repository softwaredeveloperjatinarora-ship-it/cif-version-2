import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Inject,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import swal from 'sweetalert2';
import { LpuCIFWebService } from '../../services/lpu-cifweb.service';

@Component({
  selector: 'app-top-bar',
  imports: [],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss',
})
export class TopBar implements OnInit {
  @Output() facilitiesClicked = new EventEmitter<void>();

  serverUrl: any;
  menuIconChanged = false;
  isFixedNav = false;
  columns: any;
  loadingIndicator = false;
  chunkedEventsC: any[][] = [];
  events = [];
  chunkedEvents: any[][] = [];
  allEvents: any = [];

  constructor(
    private CIFwebService: LpuCIFWebService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScroll();
      window.addEventListener('scroll', this.checkScroll.bind(this));
      window.addEventListener('resize', this.checkScroll.bind(this));
    }

    this.GetAllEventDetails();
    this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.checkScroll.bind(this));
      window.removeEventListener('resize', this.checkScroll.bind(this));
    }
  }

  onFacilitiesClick() {
    this.facilitiesClicked.emit();
  }

  openSampleInstructions() {
    swal.fire({
      title: 'Send Samples at Following Address :',
      html: `
        <address>
          <div class="contact-text">
            Central Instrumentation Facility (CIF) <br/>
            Lovely Professional University <br/>
            Block-38, Room No.106 <br/>
            Jalandhar - Delhi G.T. Road, <br/>
            Phagwara, Punjab (India) - 144411 <br/>
            <a href="tel:+911824444021">+91 1824-444021</a><br>
            cif@lpu.co.in<br>
          </div>
        </address>`,
      icon: 'info',
    });
  }

  goto(val: any) {
    this.router.navigateByUrl(val);
  }

  testClick(a: any): void {
    if (!isPlatformBrowser(this.platformId)) return; // prevent SSR call

    const fileName = `${a}.pdf`;
    const fileUrl = `assets/CifDocumentsTemplates/${fileName}`;

    fetch(fileUrl, { method: 'HEAD' })
      .then((response) => {
        if (response.ok) {
          const link = this.document.createElement('a');
          link.href = fileUrl;
          link.download = fileName;
          this.document.body.appendChild(link);
          link.click();
          this.document.body.removeChild(link);
        }
      })
      .catch(() => {
        alert('Error downloading file');
      });
  }

  toggleMenuIcon(): void {
    this.menuIconChanged = !this.menuIconChanged;
  }

  private checkScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const y = window.scrollY || window.pageYOffset;
    const isIndexPage = this.document.body.classList.contains('index-page');
    const navWrapElement = this.document.getElementById('nest-nav-scroll');
    const navWrap = isIndexPage && navWrapElement ? navWrapElement.offsetTop : 100;

    if (window.innerWidth > 1030) {
      this.isFixedNav = y > navWrap;
    } else {
      this.isFixedNav = false;
    }
  }

  chunkArray(arr: any[], size: number): any[][] {
    return arr.reduce(
      (acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]),
      []
    );
  }

  GetAllEventDetails(): void {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();
    this.CIFwebService.GetAllEventDetails().subscribe({
      next: (response) => {
        this.events = response.item1 && response.item1.length > 0 ? response.item1 : [];
        this.chunkedEventsC = this.chunkArray(this.events, 3);
        this.allEvents = this.chunkedEventsC ? this.chunkedEventsC.flat() : [];

        const elapsed = new Date().getTime() - startTime;
        const remainingDelay = Math.max(2500 - elapsed, 0);

        setTimeout(() => {
          this.loadingIndicator = false;
        }, remainingDelay);
      },
      error: (err) => {
        this.loadingIndicator = false;
        console.error(err);
        this.events = [];
        this.chunkedEventsC = this.chunkArray(this.events, 3);
      },
    });
  }

  goToEvent(eventId: number) {
    this.router.navigate(['', eventId]);
  }
}